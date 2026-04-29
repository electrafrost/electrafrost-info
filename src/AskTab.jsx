// AskTab.jsx — chat interface for graph.electrafrost.com
// Calls the Cloudflare Worker at electra-chat.electrafrost.workers.dev/ask
// Returns natural-language answers grounded in Electra's corpus,
// with citation pills that link back into the graph.

import { useState, useRef, useEffect } from "react";

// Worker endpoint — change here if subdomain ever moves to chat.electrafrost.com
const CHAT_ENDPOINT = "https://electra-chat.electrafrost.workers.dev/ask";

// Era colors — should match those in App.css. Defined inline so AskTab is self-contained.
const ERA_COLORS = {
  "creative-industries": "#8b9dc3",
  "bitcoin-conviction": "#a08bc3",
  "accountants-onchain": "#d4a574",
  "electrafi": "#b08968",
  "bitcoin-esg": "#9eb068",
  "credu-credentials": "#c28b8b",
  "bitcoin-standard": "#c39a8b",
  "network-state": "#7ba591",
  "tax-profession": "#a07b91",
  "cpd-peerlab": "#8b9dc3",
  "ai-governance": "#d4a574",
  "ai-accounting": "#b08968",
  "network-residency": "#7ba591",
  "ai-esg": "#ff6b35",
};

// Topic chips — empty until Electra provides her actual frequently-asked questions.
// The previous chip set was AI-generated guesses that triggered cross-era retrieval
// and pushed the bot toward conflation. Removed pending real ones.
const CHIPS = [];

// ─── SHARED CHAT LOGIC ────────────────────────────────────────────────────────

function useChat() {
  const [messages, setMessages] = useState([]); // { role, body, citations? }
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  async function ask(question) {
    if (!question?.trim() || pending) return;
    const q = question.trim();

    setMessages(m => [...m, { role: "user", body: q }]);
    setPending(true);
    setError(null);

    try {
      const res = await fetch(CHAT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });

      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();

      setMessages(m => [
        ...m,
        { role: "assistant", body: data.answer || "", citations: data.citations || [] },
      ]);
    } catch (err) {
      setError(err.message);
      setMessages(m => [
        ...m,
        { role: "assistant", body: "(Sorry — I couldn't reach the corpus just now. Try again?)", citations: [] },
      ]);
    } finally {
      setPending(false);
    }
  }

  function reset() {
    setMessages([]);
    setError(null);
  }

  return { messages, pending, error, ask, reset };
}

// ─── CHAT MESSAGES ────────────────────────────────────────────────────────────

function Citation({ c }) {
  const era = c.era || "";
  const color = ERA_COLORS[era] || "#666";
  const label = c.title || c.source || c.type || "source";
  const sub = c.date ? `${c.source || c.type} · ${c.date}` : c.source || "";

  const Inner = (
    <>
      <span className="ask-cite-dot" style={{ background: color }} />
      <span className="ask-cite-label">{label}</span>
      {sub && <span className="ask-cite-sub">{sub}</span>}
    </>
  );

  return c.url ? (
    <a className="ask-cite" href={c.url} target="_blank" rel="noopener">{Inner}</a>
  ) : (
    <span className="ask-cite">{Inner}</span>
  );
}

function Message({ m }) {
  return (
    <div className={`ask-msg ask-msg-${m.role}`}>
      <div className="ask-msg-meta">{m.role === "user" ? "› you" : "◆ electra"}</div>
      <div className="ask-msg-body">{m.body}</div>
      {m.citations && m.citations.length > 0 && (
        <div className="ask-citations">
          {m.citations.map(c => <Citation key={c.id} c={c} />)}
        </div>
      )}
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div className="ask-msg ask-msg-assistant">
      <div className="ask-msg-meta">◆ electra</div>
      <div className="ask-msg-body">
        <span className="ask-typing">
          <span></span><span></span><span></span>
        </span>
      </div>
    </div>
  );
}

// ─── ASK TAB (full-page) ──────────────────────────────────────────────────────

export function AskTab() {
  const { messages, pending, ask, reset } = useChat();
  const [input, setInput] = useState("");
  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, pending]);

  function submit() {
    const q = input.trim();
    if (!q) return;
    ask(q);
    setInput("");
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="ask-tab">
      <div className="ask-intro">
        Ask the corpus directly. <strong>658 posts, 55 thesis nodes, 88 CPD records, 14 eras spanning 2000–2026.</strong>
        Answers are grounded in what I have actually written — citations link to the source.
        If the corpus is thin on something, the bot says so rather than inventing.
      </div>

      {messages.length === 0 && CHIPS.length > 0 && (
        <div className="ask-chips">
          {CHIPS.map(c => (
            <button
              key={c.label}
              className="ask-chip"
              onClick={() => ask(c.q)}
              disabled={pending}
            >
              <span className="ask-chip-hash">#</span>{c.label}
            </button>
          ))}
        </div>
      )}

      <div className="ask-messages" ref={scrollRef}>
        {messages.map((m, i) => <Message key={i} m={m} />)}
        {pending && <ThinkingIndicator />}
      </div>

      <div className="ask-input-row">
        <span className="ask-prompt">›</span>
        <textarea
          ref={inputRef}
          className="ask-input"
          placeholder="ask about the thesis, CREDU, the Network State, AI governance…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          rows={1}
          disabled={pending}
        />
        <button className="ask-submit" onClick={submit} disabled={pending || !input.trim()}>
          ASK ↵
        </button>
      </div>

      {messages.length > 0 && (
        <button className="ask-reset" onClick={reset}>clear conversation</button>
      )}

      <div className="ask-hint">
        Enter to send · Shift+Enter for new line · answers grounded in Electra's own corpus
      </div>

      <div className="ask-privacy-notice">
        Questions are logged so the corpus can be improved over time.
        Don't include personal information.
      </div>
    </div>
  );
}

// ─── FLOATING WIDGET (overlay on any tab) ────────────────────────────────────

export function FloatingAskWidget() {
  const [open, setOpen] = useState(false);
  const { messages, pending, ask, reset } = useChat();
  const [input, setInput] = useState("");

  function submit() {
    const q = input.trim();
    if (!q) return;
    ask(q);
    setInput("");
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  if (!open) {
    return (
      <button
        className="ask-fab"
        onClick={() => setOpen(true)}
        aria-label="Ask Electra's corpus"
      >
        <span className="ask-fab-pulse" />
        ASK
      </button>
    );
  }

  return (
    <div className="ask-widget">
      <div className="ask-widget-header">
        <div className="ask-widget-title">
          ask <span className="ask-widget-tld">electrafrost</span>
        </div>
        <button className="ask-widget-close" onClick={() => setOpen(false)} aria-label="Close">×</button>
      </div>

      <div className="ask-widget-body">
        {messages.length === 0 && (
          <>
            <div className="ask-widget-intro">
              Ask the corpus. 658 posts, 55 thesis nodes, every era from 2000–2026.
              Answers grounded in what I've actually written.
            </div>
            {CHIPS.length > 0 && (
              <div className="ask-chips ask-chips-compact">
                {CHIPS.slice(0, 5).map(c => (
                  <button
                    key={c.label}
                    className="ask-chip"
                    onClick={() => ask(c.q)}
                    disabled={pending}
                  >
                    <span className="ask-chip-hash">#</span>{c.label}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
        {messages.map((m, i) => <Message key={i} m={m} />)}
        {pending && <ThinkingIndicator />}
      </div>

      <div className="ask-input-row ask-input-row-widget">
        <span className="ask-prompt">›</span>
        <input
          className="ask-input"
          placeholder="ask anything…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          disabled={pending}
        />
      </div>

      <div className="ask-widget-footer">
        <a href="#ask" onClick={() => { setOpen(false); window.location.hash = "ask"; }}>Open full ASK tab →</a>
        <div className="ask-privacy-notice ask-privacy-notice-widget">
          Questions logged. No personal info.
        </div>
      </div>
    </div>
  );
}
