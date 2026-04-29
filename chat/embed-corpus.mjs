#!/usr/bin/env node
/**
 * embed-corpus.mjs
 * ----------------
 * Reads the canonical corpus from ../src/data.json + ../public/posts.json,
 * chunks it, embeds each chunk via Cloudflare Workers AI (bge-base-en-v1.5),
 * and uploads to the Vectorize index `electra-corpus`.
 *
 * Run from the project root:
 *   node chat/embed-corpus.mjs
 *
 * Re-run any time the corpus changes (new posts, new nodes).
 *
 * Env vars required:
 *   CF_ACCOUNT_ID       Cloudflare account ID
 *   CF_API_TOKEN        Cloudflare API token with Vectorize:Edit + Workers AI:Read
 *
 * Set them once in PowerShell with:
 *   $env:CF_ACCOUNT_ID = "ae72bbf8f20dfbcf063e4e1539ea7d5e"
 *   $env:CF_API_TOKEN  = "<your-token>"
 *
 * Token: create at dash.cloudflare.com → My Profile → API Tokens
 *        Use the "Custom token" template.
 *        Permissions:
 *          • Account → Vectorize → Edit
 *          • Account → Workers AI → Read
 *        Account resources: include your account
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const API_TOKEN  = process.env.CF_API_TOKEN;
const INDEX_NAME = 'electra-corpus';
const EMBED_MODEL = '@cf/baai/bge-base-en-v1.5'; // 768 dims, matches the index

if (!ACCOUNT_ID || !API_TOKEN) {
  console.error('✗ Missing CF_ACCOUNT_ID or CF_API_TOKEN env vars. See header comments.');
  process.exit(1);
}

// ─── LOAD CORPUS ──────────────────────────────────────────────────────────────
console.log('Loading corpus…');
const data  = JSON.parse(readFileSync(join(ROOT, 'src/data.json'), 'utf8'));
const posts = JSON.parse(readFileSync(join(ROOT, 'public/posts.json'), 'utf8'));

console.log(`  data.json    : ${data.nodes.length} nodes, ${data.eras.length} eras, ${data.cpd?.length || 0} CPD records, ${(data.faqs || []).filter(f => f.category !== 'template').length} FAQs`);
console.log(`  posts.json   : ${posts.length} posts`);

// ─── CHUNKING ────────────────────────────────────────────────────────────────
// Goal: every chunk has enough context to be useful retrieved alone, and
//       carries enough metadata for citation back into the graph.

const chunks = [];

// 1. Eras themselves are searchable (someone asks "what is the Network State era?")
for (const era of data.eras) {
  chunks.push({
    id: `era_${era.id}`,
    text: `Era: ${era.label} (${era.range || ''}). ${era.description || ''}`,
    metadata: {
      type: 'era',
      era: era.id,
      label: era.label,
      range: era.range || '',
      url: `https://graph.electrafrost.com/#/era/${era.id}`,
    },
  });
}

// 2. Nodes — the curated thesis spine (55 items).
//    Each node gets one chunk; bodies aren't long enough to need splitting.
for (const node of data.nodes) {
  const text = [
    node.title,
    node.subtitle,
    node.body,
    node.tags?.length ? `Tags: ${node.tags.join(', ')}` : '',
  ].filter(Boolean).join('\n\n');

  chunks.push({
    id: `node_${node.id}`,
    text,
    metadata: {
      type: 'node',
      node_type: node.type || '',
      era: node.era || '',
      date: node.date || '',
      title: node.title || '',
      url: `https://graph.electrafrost.com/#/node/${node.id}`,
    },
  });
}

// 3. CPD records — short, one chunk each.
for (const cpd of (data.cpd || [])) {
  const text = `CPD: ${cpd.event} (${cpd.provider}, ${cpd.date}, ${cpd.hours} hours${cpd.verified ? ', verified' : ''})`;
  chunks.push({
    id: `cpd_${cpd.date}_${(cpd.event || '').replace(/[^a-z0-9]/gi, '_').slice(0, 40).toLowerCase()}`,
    text,
    metadata: {
      type: 'cpd',
      date: cpd.date || '',
      provider: cpd.provider || '',
      event: cpd.event || '',
      url: 'https://graph.electrafrost.com/#cpd',
    },
  });
}

// 3b. FAQs — canonical clarifications. Highest-trust chunks: short, written
//     specifically to anchor common questions. Each gets one chunk.
//     Skip template/documentation entries (category === "template").
for (const faq of (data.faqs || [])) {
  if (faq.category === 'template') continue;
  const text = [
    `FAQ: ${faq.question}`,
    '',
    faq.answer,
    faq.context ? `\nContext: ${faq.context}` : '',
  ].filter(Boolean).join('\n');

  chunks.push({
    id: faq.id,
    text,
    metadata: {
      type: 'faq',
      category: faq.category || '',
      date_added: faq.date_added || '',
      title: faq.question || '',
      tags: (faq.tags || []).join(','),
      url: 'https://graph.electrafrost.com/#faq',
    },
  });
}

// 4. Posts — the long tail. One chunk per post, since avg ~824 chars.
//    Posts longer than ~3000 chars get split by paragraph to keep retrieval sharp.
for (let i = 0; i < posts.length; i++) {
  const p = posts[i];
  const text = (p.text || '').trim();
  if (!text) continue;

  const baseId = `post_${p.source}_${i}`;
  const baseMeta = {
    type: 'post',
    source: p.source || '',
    date: p.date || '',
    title: p.title || '',
    url: p.url || '',
  };

  if (text.length <= 2500) {
    chunks.push({
      id: baseId,
      text: p.title ? `${p.title}\n\n${text}` : text,
      metadata: baseMeta,
    });
  } else {
    // Long post — split on double newlines, then group up to ~2000 chars.
    const paras = text.split(/\n\s*\n/).filter(s => s.trim());
    let buf = '';
    let part = 0;
    for (const para of paras) {
      if (buf.length + para.length > 2000 && buf) {
        chunks.push({
          id: `${baseId}_p${part++}`,
          text: buf.trim(),
          metadata: { ...baseMeta, part },
        });
        buf = '';
      }
      buf += (buf ? '\n\n' : '') + para;
    }
    if (buf.trim()) {
      chunks.push({
        id: `${baseId}_p${part}`,
        text: buf.trim(),
        metadata: { ...baseMeta, part },
      });
    }
  }
}

console.log(`Chunking complete: ${chunks.length} chunks`);

// ─── EMBED + UPLOAD IN BATCHES ────────────────────────────────────────────────
const BATCH = 20; // Workers AI accepts batched embedding requests; keep small for reliability

async function embedBatch(texts) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/${EMBED_MODEL}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text: texts }),
  });
  if (!res.ok) {
    throw new Error(`Embed failed (${res.status}): ${await res.text()}`);
  }
  const j = await res.json();
  if (!j.success) throw new Error(`Embed error: ${JSON.stringify(j.errors)}`);
  return j.result.data; // array of vectors
}

async function upsertBatch(vectors) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/vectorize/v2/indexes/${INDEX_NAME}/upsert`;
  // Vectorize upsert expects NDJSON (newline-delimited JSON)
  const body = vectors.map(v => JSON.stringify(v)).join('\n');
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/x-ndjson',
    },
    body,
  });
  if (!res.ok) {
    throw new Error(`Upsert failed (${res.status}): ${await res.text()}`);
  }
  const j = await res.json();
  if (!j.success) throw new Error(`Upsert error: ${JSON.stringify(j.errors)}`);
  return j.result;
}

console.log('Embedding + uploading…');
let processed = 0;
const startTime = Date.now();

for (let i = 0; i < chunks.length; i += BATCH) {
  const batch = chunks.slice(i, i + BATCH);
  const texts = batch.map(c => c.text);

  let vectors;
  try {
    vectors = await embedBatch(texts);
  } catch (err) {
    console.error(`✗ Embed batch ${i}-${i+batch.length} failed:`, err.message);
    process.exit(1);
  }

  const upsertPayload = batch.map((c, j) => ({
    id: c.id,
    values: vectors[j],
    // Store chunk text in metadata so the Worker can pass it to Claude
    // (Vectorize doesn't return original text, only vectors + metadata)
    // Truncate to 4KB to stay well under Vectorize's 10KB metadata limit
    metadata: {
      ...c.metadata,
      text: c.text.length > 4000 ? c.text.slice(0, 4000) + '…' : c.text,
    },
  }));

  try {
    await upsertBatch(upsertPayload);
  } catch (err) {
    console.error(`✗ Upsert batch ${i}-${i+batch.length} failed:`, err.message);
    process.exit(1);
  }

  processed += batch.length;
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const rate = (processed / parseFloat(elapsed)).toFixed(1);
  process.stdout.write(`\r  ${processed}/${chunks.length} (${rate} chunks/sec, ${elapsed}s)`);
}

console.log(`\n✓ Complete. ${chunks.length} vectors uploaded to ${INDEX_NAME} in ${((Date.now() - startTime)/1000).toFixed(1)}s`);
