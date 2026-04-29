/**
 * Electra Chat Worker
 * -------------------
 * Endpoints:
 *   POST /ask         - public; visitor question → grounded answer + citations
 *   GET  /health      - public; liveness check
 *   GET  /admin       - admin; HTML review panel (requires ?key=<ADMIN_KEY>)
 *   *    /admin/api/* - admin JSON API (requires header X-Admin-Key)
 *
 * Pipeline (for /ask):
 *   1. Embed the question (Workers AI, bge-base-en-v1.5)
 *   2. Query Vectorize for top 8 corpus chunks
 *   3. Send to Claude Haiku 4.5 with a voice-calibrated system prompt
 *   4. Log the Q&A to D1 (with retrieval-thinness flag)
 *   5. Return answer + structured citations
 *
 * Bindings (set in wrangler.toml):
 *   AI         — Workers AI binding
 *   VECTORIZE  — Vectorize binding for `electra-corpus`
 *   DB         — D1 binding for `electra-chat-log`
 *
 * Secrets (set via `wrangler secret put`):
 *   ANTHROPIC_API_KEY
 *   ADMIN_KEY  (long random string for protecting /admin)
 */

const ALLOWED_ORIGINS = [
  'https://graph.electrafrost.com',
  'https://electrafrost.com',
  'https://www.electrafrost.com',
  'http://localhost:5173',
  'http://localhost:3000',
];

const THIN_RETRIEVAL_THRESHOLD = 0.6; // top_score below this = retrieval is thin

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

CANONICAL FAQS
- Some retrieved chunks are labelled [CANONICAL FAQ: ...]. These are high-trust authoritative clarifications I have written specifically to anchor common questions.
- When a CANONICAL FAQ is present in the retrieved chunks AND it is relevant to the question, prioritise it over other chunks. It represents my verified position.
- If a CANONICAL FAQ contradicts what other chunks (e.g. older posts, adjacent nodes) suggest, the FAQ is correct. The other chunks are context, not ground truth.

ANTI-FABRICATION (CRITICAL)
- When asked about specific facts — dates, names, places, people, events, conversations, decisions, numbers, clients, projects — only state them if they appear in the retrieved chunks.
- Do NOT infer, reconstruct, or compose facts from adjacent material. Do NOT generalise from one specific example to assume similar specifics elsewhere. Do NOT fill plausible-sounding details to make a story flow.
- If a question asks for an origin story, a first encounter, a specific moment, or biographical specifics that are not in the retrieved chunks, say so plainly. Examples of good responses when retrieval is thin:
  • "I haven't written about that specific moment in this corpus."
  • "The corpus has my position on X but not the story of when I formed it."
  • "What I can tell you from what's here is [what IS in the chunks]. The specific [date/person/event] you're asking about isn't in this corpus."
- Better a short honest answer than a long fluent invented one. Visitors are reading this to understand my actual work, not to enjoy plausible-sounding stories.
- The voice rules (specific-to-general, no fiscal, plain English) still apply, but they apply to the TRUE answer — they are not a license to fabricate to make the voice sound right.

CITATIONS
- The system handles citation rendering separately. You don't need to inline citation markers.
- Just write a natural answer. The retrieved chunks' metadata becomes the citation pills shown beneath your reply.`;

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key',
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
  const result = await env.AI.run('@cf/baai/bge-base-en-v1.5', { text: [question] });
  return result.data[0];
}

async function retrieveChunks(env, vector, topK = 8) {
  const matches = await env.VECTORIZE.query(vector, { topK, returnMetadata: 'all' });
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
      : meta.type === 'faq'
      ? `[CANONICAL FAQ: ${meta.title}]`
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

async function logQuestion(env, { question, answer, chunks, request }) {
  if (!env.DB) return; // logging optional — don't break /ask if DB not bound
  try {
    const topScore = chunks[0]?.score ?? null;
    const thin = topScore !== null && topScore < THIN_RETRIEVAL_THRESHOLD ? 1 : 0;

    const chunkSummary = chunks.slice(0, 8).map(c => ({
      id: c.id,
      type: c.metadata?.type || '',
      title: c.metadata?.title || c.metadata?.label || c.metadata?.event || '',
      score: Number((c.score || 0).toFixed(3)),
    }));

    const userAgent = (request.headers.get('User-Agent') || '').slice(0, 200);
    const origin = request.headers.get('Origin') || '';

    await env.DB.prepare(
      `INSERT INTO questions
       (timestamp, question, answer, top_score, chunk_ids, chunk_summary,
        thin_retrieval, user_agent, origin)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      new Date().toISOString(),
      question,
      answer,
      topScore,
      JSON.stringify(chunks.map(c => c.id)),
      JSON.stringify(chunkSummary),
      thin,
      userAgent,
      origin,
    ).run();
  } catch (err) {
    // Logging failures shouldn't break /ask. Surface in console only.
    console.error('Logging error:', err.message);
  }
}

// ─── ADMIN PANEL ──────────────────────────────────────────────────────────────

function adminAuthOK(request, url, env) {
  const headerKey = request.headers.get('X-Admin-Key');
  const queryKey = url.searchParams.get('key');
  const provided = headerKey || queryKey;
  return provided && env.ADMIN_KEY && provided === env.ADMIN_KEY;
}

async function adminListQuestions(env, { view, limit = 100 }) {
  if (!env.DB) return { error: 'D1 not bound' };

  let where = '';
  if (view === 'thin') where = 'WHERE thin_retrieval = 1 AND addressed = 0';
  else if (view === 'unaddressed') where = 'WHERE addressed = 0';
  else if (view === 'addressed') where = 'WHERE addressed = 1';

  const sql = `
    SELECT id, timestamp, question, answer, top_score, chunk_summary,
           thin_retrieval, addressed, addressed_at, addressed_note
    FROM questions
    ${where}
    ORDER BY timestamp DESC
    LIMIT ?`;

  const result = await env.DB.prepare(sql).bind(limit).all();
  return { rows: result.results || [] };
}

async function adminMarkAddressed(env, { id, note }) {
  if (!env.DB) return { error: 'D1 not bound' };
  await env.DB.prepare(
    `UPDATE questions SET addressed = 1, addressed_at = ?, addressed_note = ? WHERE id = ?`
  ).bind(new Date().toISOString(), note || '', id).run();
  return { ok: true };
}

async function adminUnmarkAddressed(env, { id }) {
  if (!env.DB) return { error: 'D1 not bound' };
  await env.DB.prepare(
    `UPDATE questions SET addressed = 0, addressed_at = NULL, addressed_note = NULL WHERE id = ?`
  ).bind(id).run();
  return { ok: true };
}

async function adminCountSummary(env) {
  if (!env.DB) return { error: 'D1 not bound' };
  const total = await env.DB.prepare(`SELECT COUNT(*) as c FROM questions`).first();
  const thin = await env.DB.prepare(`SELECT COUNT(*) as c FROM questions WHERE thin_retrieval = 1 AND addressed = 0`).first();
  const addressed = await env.DB.prepare(`SELECT COUNT(*) as c FROM questions WHERE addressed = 1`).first();
  const unaddressed = await env.DB.prepare(`SELECT COUNT(*) as c FROM questions WHERE addressed = 0`).first();
  return {
    total: total?.c || 0,
    thin: thin?.c || 0,
    addressed: addressed?.c || 0,
    unaddressed: unaddressed?.c || 0,
  };
}

const ADMIN_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Electra Chat — admin</title>
<style>
  :root {
    --bg: #faf8f5; --bg-card: #fff; --border: #e8e4df;
    --text: #1a1a1a; --muted: #888; --accent: #e8621a;
    --thin: #c45a5a; --thin-pale: #fce7e7;
    --addressed: #3a7a3a; --addressed-pale: #e7f4e7;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', system-ui, sans-serif; background: var(--bg); color: var(--text); padding: 2rem; line-height: 1.5; }
  h1 { font-family: 'DM Serif Display', Georgia, serif; font-weight: 400; margin-bottom: 0.3rem; font-size: 1.8rem; }
  .sub { color: var(--muted); margin-bottom: 2rem; font-size: 0.9rem; }
  .stats { display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
  .stat { background: var(--bg-card); border: 1px solid var(--border); padding: 0.7rem 1.1rem; border-radius: 4px; }
  .stat-num { font-size: 1.4rem; font-weight: 600; }
  .stat-label { font-size: 0.78rem; color: var(--muted); font-family: 'DM Mono', monospace; }
  .views { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
  .view { background: var(--bg-card); border: 1px solid var(--border); padding: 0.5rem 0.95rem; cursor: pointer; font-family: 'DM Mono', monospace; font-size: 0.78rem; border-radius: 4px; color: var(--text); }
  .view.active { background: var(--text); color: var(--bg); border-color: var(--text); }
  .view:hover:not(.active) { border-color: var(--accent); color: var(--accent); }
  .row { background: var(--bg-card); border: 1px solid var(--border); border-radius: 4px; padding: 1.1rem 1.3rem; margin-bottom: 0.8rem; }
  .row.thin { border-left: 3px solid var(--thin); }
  .row.addressed { border-left: 3px solid var(--addressed); opacity: 0.7; }
  .row-meta { display: flex; gap: 0.7rem; align-items: center; font-family: 'DM Mono', monospace; font-size: 0.72rem; color: var(--muted); margin-bottom: 0.5rem; flex-wrap: wrap; }
  .badge { padding: 0.15rem 0.5rem; border-radius: 3px; font-size: 0.68rem; }
  .badge.thin { background: var(--thin-pale); color: var(--thin); }
  .badge.addressed { background: var(--addressed-pale); color: var(--addressed); }
  .badge.score { background: var(--bg); border: 1px solid var(--border); }
  .question { font-weight: 500; font-size: 1rem; margin-bottom: 0.5rem; }
  .answer { color: #444; font-size: 0.9rem; white-space: pre-wrap; padding: 0.7rem 0.9rem; background: var(--bg); border-radius: 4px; margin-bottom: 0.7rem; }
  .chunks { display: flex; flex-wrap: wrap; gap: 0.3rem; margin-bottom: 0.7rem; }
  .chunk { background: var(--bg); border: 1px solid var(--border); padding: 0.2rem 0.55rem; font-family: 'DM Mono', monospace; font-size: 0.7rem; border-radius: 3px; color: var(--muted); }
  .chunk-score { color: var(--accent); margin-left: 0.3rem; }
  .actions { display: flex; gap: 0.5rem; align-items: center; }
  button { background: transparent; border: 1px solid var(--border); padding: 0.35rem 0.85rem; cursor: pointer; font-family: 'DM Mono', monospace; font-size: 0.75rem; border-radius: 3px; color: var(--text); }
  button:hover { border-color: var(--accent); color: var(--accent); }
  button.primary { background: var(--accent); color: white; border-color: var(--accent); }
  button.primary:hover { opacity: 0.85; }
  input[type=text] { padding: 0.4rem 0.7rem; border: 1px solid var(--border); border-radius: 3px; font-family: inherit; font-size: 0.85rem; flex: 1; max-width: 400px; }
  .empty { color: var(--muted); padding: 3rem; text-align: center; background: var(--bg-card); border: 1px dashed var(--border); border-radius: 4px; }
  .auth-fail { color: var(--thin); padding: 2rem; }
</style>
</head>
<body>
<h1>chat.electrafrost — admin</h1>
<div class="sub">Question log. Triage thin-retrieval first, then write FAQs into <code>data.json</code>.</div>

<div id="content">Loading…</div>

<script>
  const KEY = new URLSearchParams(location.search).get('key');
  if (!KEY) document.body.innerHTML = '<div class="auth-fail">Missing ?key= parameter.</div>';

  let currentView = 'thin'; // default: surface gaps first

  async function api(path, opts) {
    opts = opts || {};
    const res = await fetch('/admin/api/' + path, Object.assign({}, opts, {
      headers: Object.assign({
        'X-Admin-Key': KEY,
        'Content-Type': 'application/json'
      }, opts.headers || {})
    }));
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(m) {
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m];
    });
  }

  async function load() {
    try {
      const stats = await api('summary');
      const list = await api('list?view=' + currentView);
      render(stats, list.rows);
    } catch (e) {
      document.getElementById('content').innerHTML =
        '<div class="auth-fail">Auth failed or D1 not bound. Check key and DB binding.</div>';
    }
  }

  function render(stats, rows) {
    const html = [];
    html.push('<div class="stats">');
    html.push('<div class="stat"><div class="stat-num">' + stats.total + '</div><div class="stat-label">total questions</div></div>');
    html.push('<div class="stat"><div class="stat-num">' + stats.thin + '</div><div class="stat-label">thin · unaddressed</div></div>');
    html.push('<div class="stat"><div class="stat-num">' + stats.unaddressed + '</div><div class="stat-label">unaddressed</div></div>');
    html.push('<div class="stat"><div class="stat-num">' + stats.addressed + '</div><div class="stat-label">addressed</div></div>');
    html.push('</div>');

    html.push('<div class="views">');
    const views = [['thin','Thin retrieval first'],['unaddressed','All unaddressed'],['all','All chronological'],['addressed','Addressed']];
    for (let i = 0; i < views.length; i++) {
      const v = views[i];
      html.push('<button class="view ' + (v[0] === currentView ? 'active' : '') + '" onclick="setView(\\'' + v[0] + '\\')">' + v[1] + '</button>');
    }
    html.push('</div>');

    if (!rows.length) {
      html.push('<div class="empty">Nothing to show in this view.</div>');
    } else {
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const cls = ['row'];
        if (r.thin_retrieval && !r.addressed) cls.push('thin');
        if (r.addressed) cls.push('addressed');
        html.push('<div class="' + cls.join(' ') + '">');
        html.push('<div class="row-meta">');
        html.push('<span>#' + r.id + '</span>');
        html.push('<span>' + escapeHtml(r.timestamp) + '</span>');
        if (r.top_score !== null) html.push('<span class="badge score">top score: ' + Number(r.top_score).toFixed(3) + '</span>');
        if (r.thin_retrieval) html.push('<span class="badge thin">thin retrieval</span>');
        if (r.addressed) html.push('<span class="badge addressed">addressed' + (r.addressed_note ? ': ' + escapeHtml(r.addressed_note) : '') + '</span>');
        html.push('</div>');
        html.push('<div class="question">' + escapeHtml(r.question) + '</div>');
        html.push('<div class="answer">' + escapeHtml(r.answer) + '</div>');
        try {
          const chunks = JSON.parse(r.chunk_summary || '[]');
          if (chunks.length) {
            html.push('<div class="chunks">');
            for (let j = 0; j < chunks.length; j++) {
              const c = chunks[j];
              html.push('<span class="chunk">' + escapeHtml(c.type) + ': ' + escapeHtml(c.title || c.id) + '<span class="chunk-score">' + c.score + '</span></span>');
            }
            html.push('</div>');
          }
        } catch (e) {}
        html.push('<div class="actions">');
        if (!r.addressed) {
          html.push('<input type="text" id="note-' + r.id + '" placeholder="commit SHA or note (optional)" />');
          html.push('<button class="primary" onclick="markAddressed(' + r.id + ')">Mark addressed</button>');
        } else {
          html.push('<button onclick="unmarkAddressed(' + r.id + ')">Unmark</button>');
        }
        html.push('</div>');
        html.push('</div>');
      }
    }
    document.getElementById('content').innerHTML = html.join('');
  }

  window.setView = function(v) { currentView = v; load(); };
  window.markAddressed = async function(id) {
    const noteEl = document.getElementById('note-' + id);
    const note = noteEl ? noteEl.value : '';
    await api('mark', { method: 'POST', body: JSON.stringify({ id: id, note: note }) });
    load();
  };
  window.unmarkAddressed = async function(id) {
    await api('unmark', { method: 'POST', body: JSON.stringify({ id: id }) });
    load();
  };

  load();
</script>
</body>
</html>`;

// ─── HANDLER ──────────────────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (url.pathname === '/' || url.pathname === '/health') {
      return jsonResponse({ status: 'ok', service: 'electra-chat' }, {}, origin);
    }

    if (url.pathname === '/admin') {
      if (!adminAuthOK(request, url, env)) {
        return new Response('<h1>401</h1><p>Missing or invalid ?key=</p>', {
          status: 401, headers: { 'Content-Type': 'text/html' }
        });
      }
      return new Response(ADMIN_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }

    if (url.pathname.startsWith('/admin/api/')) {
      if (!adminAuthOK(request, url, env)) {
        return jsonResponse({ error: 'unauthorized' }, { status: 401 }, origin);
      }
      const sub = url.pathname.replace('/admin/api/', '');
      if (sub === 'summary') return jsonResponse(await adminCountSummary(env), {}, origin);
      if (sub.startsWith('list')) {
        const view = url.searchParams.get('view') || 'all';
        return jsonResponse(await adminListQuestions(env, { view }), {}, origin);
      }
      if (sub === 'mark' && request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        return jsonResponse(await adminMarkAddressed(env, body), {}, origin);
      }
      if (sub === 'unmark' && request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        return jsonResponse(await adminUnmarkAddressed(env, body), {}, origin);
      }
      return jsonResponse({ error: 'not found' }, { status: 404 }, origin);
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
      const answer = await callClaude(env, question, chunks);
      const citations = formatCitations(chunks);

      // Log Q&A. Logging catches its own errors; /ask never fails because of it.
      await logQuestion(env, { question, answer, chunks, request });

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
