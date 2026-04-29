/**
 * Electra Chat Worker
 * -------------------
 * Endpoint: POST /ask   { question: string }
 *           returns    { answer: string, citations: [...] }
 *
 * Pipeline:
 *   1. Embed the question (Workers AI, bge-base-en-v1.5)
 *   2. Query Vectorize for top 8 corpus chunks
 *   3. Send to Claude Haiku 4.5 with a voice-calibrated system prompt
 *   4. Return answer + structured citations
 *
 * Bindings (set in wrangler.toml):
 *   AI         — Workers AI binding
 *   VECTORIZE  — Vectorize binding for `electra-corpus`
 *
 * Secrets (set via `wrangler secret put`):
 *   ANTHROPIC_API_KEY
 */

const ALLOWED_ORIGINS = [
  'https://graph.electrafrost.com',
  'https://electrafrost.com',
  'https://www.electrafrost.com',
  'http://localhost:5173', // vite dev server
  'http://localhost:3000',
];

const SYSTEM_PROMPT = `You are Electra Frost — a specialist public accountant building decentralised professional infrastructure for accountants in a Bitcoin Standard, Network State economy. You are answering questions about your own work to visitors of your intellectual provenance graph at graph.electrafrost.com.

VOICE
- Argue from the specific case to the general claim, never the reverse.
- Closings are stronger than openings; lead with the specific instance.
- No inflated language. No "in today's rapidly evolving landscape" type filler.
- Never use the word "fiscal". Use "tax" or rework the sentence.
- Don't say "Great question" or "I'd be happy to help". Just answer.
- Plain English. Short sentences mixed with longer ones. The rhythm of someone thinking out loud, not someone presenting.
- You are confident but not arrogant. Direct but not cold. You believe what you're saying.

STYLE
- 2–4 short paragraphs maximum unless the question genuinely demands more.
- No bullet points unless the user explicitly asks for a list.
- No headers unless the user asks for a structured document.
- If you don't have enough in the retrieved corpus to answer well, say so plainly. Don't invent positions.

CORPUS GROUNDING
- Below you will receive retrieved chunks from your own writing, posts, and graph nodes.
- Ground every claim in the retrieved material. Do not contradict it.
- If retrieved material on a topic is thin, acknowledge that the position is still developing rather than making things up.
- Quote yourself sparingly — paraphrasing in fresh words is almost always better.

CITATIONS
- The system handles citation rendering separately. You don't need to inline citation markers.
- Just write a natural answer. The retrieved chunks' metadata becomes the citation pills shown beneath your reply.`;

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function jsonResponse(data, init = {}, origin = '') {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(origin),
      ...(init.headers || {}),
    },
  });
}

async function embedQuestion(env, question) {
  const result = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
    text: [question],
  });
  return result.data[0];
}

async function retrieveChunks(env, vector, topK = 8) {
  const matches = await env.VECTORIZE.query(vector, {
    topK,
    returnMetadata: 'all',
  });
  return matches.matches || [];
}

async function callClaude(env, question, chunks) {
  const context = chunks.map((m, i) => {
    const meta = m.metadata || {};
    const label = meta.type === 'post'
      ? `[${meta.source}, ${meta.date}]`
      : meta.type === 'node'
      ? `[graph node: ${meta.title}, ${meta.date}]`
      : meta.type === 'era'
      ? `[era: ${meta.label}]`
      : meta.type === 'cpd'
      ? `[CPD: ${meta.event}, ${meta.date}]`
      : '[corpus]';
    return `--- chunk ${i + 1} ${label} (similarity: ${m.score?.toFixed(3) ?? 'n/a'}) ---\n${meta.text || '(no text stored)'}`;
  }).join('\n\n');

  const userMessage = `Retrieved chunks from my corpus:\n\n${context}\n\n---\n\nVisitor's question: ${question}\n\nAnswer in your own voice, grounded in the retrieved material.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Claude API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text || '';
}

function formatCitations(chunks) {
  return chunks.map(m => {
    const meta = m.metadata || {};
    return {
      id: m.id,
      score: m.score,
      type: meta.type,
      era: meta.era || null,
      date: meta.date || null,
      title: meta.title || meta.label || meta.event || '',
      source: meta.source || meta.provider || meta.type || '',
      url: meta.url || null,
    };
  });
}

// ─── HANDLER ──────────────────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    // Health check
    if (url.pathname === '/' || url.pathname === '/health') {
      return jsonResponse({ status: 'ok', service: 'electra-chat' }, {}, origin);
    }

    if (url.pathname !== '/ask') {
      return jsonResponse({ error: 'not found' }, { status: 404 }, origin);
    }

    if (request.method !== 'POST') {
      return jsonResponse({ error: 'POST required' }, { status: 405 }, origin);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: 'invalid JSON' }, { status: 400 }, origin);
    }

    const question = (body.question || '').trim();
    if (!question) {
      return jsonResponse({ error: 'question required' }, { status: 400 }, origin);
    }
    if (question.length > 1000) {
      return jsonResponse({ error: 'question too long (max 1000 chars)' }, { status: 400 }, origin);
    }

    try {
      const vector = await embedQuestion(env, question);
      const chunks = await retrieveChunks(env, vector, 8);

      // Workers AI Vectorize doesn't return chunk text by default —
      // we need to enrich from metadata if we stored it, or pass less.
      // For now we send what we have; the system prompt handles thin retrieval.
      const answer = await callClaude(env, question, chunks);
      const citations = formatCitations(chunks);

      return jsonResponse({ answer, citations }, {}, origin);
    } catch (err) {
      console.error('Worker error:', err.stack || err.message);
      return jsonResponse(
        { error: 'internal error', detail: err.message },
        { status: 500 },
        origin
      );
    }
  },
};
