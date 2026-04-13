// v0.1.1 — updated description, nodes sorted newest-first
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import data from "./data.json";
import "./App.css";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const TYPE_ICONS = {
  insight: "◆",
  publication: "◉",
  project: "▣",
  credential: "✦",
  milestone: "★",
  origin: "◎",
};

const TYPE_LABELS = {
  insight: "Insight",
  publication: "Publication",
  project: "Project",
  credential: "Credential",
  milestone: "Milestone",
  origin: "Origin",
};

function formatDate(dateStr) {
  if (!dateStr) return "";
  const [year, month] = dateStr.split("-");
  if (!month) return year;
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(month) - 1]} ${year}`;
}

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

function Header({ activeTab, setActiveTab, searchQuery, setSearchQuery }) {
  const tabs = ["GRAPH", "FEED", "INSIGHTS", "ABOUT"];
  return (
    <header className="site-header">
      <div className="header-inner">
        <div className="header-top">
          <div className="header-title-block">
            <h1 className="site-name">
              electrafrost<span className="site-name-tld">.com</span>
              <span className="version-badge">v0.1</span>
            </h1>
            <p className="site-tagline">{data.meta.tagline}</p>
            <p className="site-description">
              A specialist public accountant who has been reinventing professional practice at the digital frontier for 25 years - before it was called that. This is her aggregated, sovereign and discoverable record of ideas, contributions and predictions: how the thinking developed, where it came from, and where it is going.
            </p>
            <p className="site-llms">
              Enter this URL into your LLM to query and verify a graph of ideas, publications and
              contributions. <a href="/llms.txt" target="_blank" rel="noopener">llms.txt</a>
            </p>
          </div>
        </div>
        <nav className="header-nav">
          {tabs.map((t) => (
            <button
              key={t}
              className={`nav-tab ${activeTab === t ? "active" : ""}`}
              onClick={() => setActiveTab(t)}
            >
              {t}
            </button>
          ))}
        </nav>
        {(activeTab === "GRAPH" || activeTab === "FEED") && (
          <div className="search-row">
            <input
              className="search-input"
              placeholder="Search nodes, ideas, publications…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}
      </div>
    </header>
  );
}

function EraFilter({ eras, activeEra, setActiveEra }) {
  return (
    <div className="era-filter">
      <button
        className={`era-chip ${activeEra === "all" ? "active" : ""}`}
        onClick={() => setActiveEra("all")}
      >
        All Eras
      </button>
      {eras.map((era) => (
        <button
          key={era.id}
          className={`era-chip ${activeEra === era.id ? "active" : ""}`}
          style={activeEra === era.id ? { borderColor: era.color, color: era.color } : {}}
          onClick={() => setActiveEra(activeEra === era.id ? "all" : era.id)}
        >
          {era.label}
          <span className="era-range">{era.range}</span>
        </button>
      ))}
    </div>
  );
}

function NodeCard({ node, era, onClick }) {
  const icon = TYPE_ICONS[node.type] || "◆";
  return (
    <article
      className="node-card"
      onClick={() => onClick(node)}
      style={{ "--era-color": era?.color || "#e8621a" }}
    >
      <div className="node-card-header">
        <div className="node-type-badge">
          <span className="node-icon">{icon}</span>
          <span className="node-type-label">{TYPE_LABELS[node.type] || node.type}</span>
        </div>
        <time className="node-date">{formatDate(node.date)}</time>
      </div>
      <h3 className="node-title">{node.title}</h3>
      <p className="node-subtitle">{node.subtitle}</p>
      <div className="node-tags">
        {node.tags.slice(0, 4).map((tag) => (
          <span key={tag} className="tag">#{tag}</span>
        ))}
      </div>
    </article>
  );
}

function NodeModal({ node, era, onClose }) {
  const icon = TYPE_ICONS[node.type] || "◆";
  useEffect(() => {
    const handler = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-header" style={{ borderTopColor: era?.color || "#e8621a" }}>
          <div className="modal-meta">
            <span className="node-type-badge">
              <span className="node-icon">{icon}</span>
              <span className="node-type-label">{TYPE_LABELS[node.type] || node.type}</span>
            </span>
            <time className="node-date">{formatDate(node.date)}</time>
          </div>
          {era && (
            <div className="modal-era" style={{ color: era.color }}>
              {era.label} · {era.range}
            </div>
          )}
          <h2 className="modal-title">{node.title}</h2>
          <p className="modal-subtitle">{node.subtitle}</p>
        </div>
        <div className="modal-body">
          <p className="modal-text">{node.body}</p>
          {node.links && node.links.length > 0 && (
            <div className="modal-links">
              {node.links.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="modal-link"
                >
                  → {link.label}
                </a>
              ))}
            </div>
          )}
          <div className="modal-tags">
            {node.tags.map((tag) => (
              <span key={tag} className="tag">#{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FeaturedCarousel({ nodes, eras, onNodeClick }) {
  const [idx, setIdx] = useState(0);
  const featured = useMemo(() =>
    nodes.filter((n) => ["publication", "insight", "project"].includes(n.type)).slice(0, 8),
    [nodes]
  );
  if (!featured.length) return null;
  const node = featured[idx];
  const era = eras.find((e) => e.id === node.era);

  return (
    <div className="carousel-section">
      <div className="carousel-label">LATEST THOUGHT LEADERSHIP</div>
      <div className="carousel-dots">
        {featured.map((_, i) => (
          <button
            key={i}
            className={`carousel-dot ${i === idx ? "active" : ""}`}
            onClick={() => setIdx(i)}
          />
        ))}
      </div>
      <div className="carousel-track">
        <div
          className="carousel-card featured"
          onClick={() => onNodeClick(node)}
          style={{ "--era-color": era?.color || "#e8621a" }}
        >
          <div className="carousel-card-era" style={{ color: era?.color }}>
            {era?.label?.toUpperCase()} · {node.date?.substring(0, 4)}
          </div>
          <h3 className="carousel-card-title">"{node.title}"</h3>
          <p className="carousel-card-body">{node.body.substring(0, 200)}…</p>
          {node.links?.[0] && (
            <a
              href={node.links[0].url}
              target="_blank"
              rel="noopener noreferrer"
              className="carousel-link"
              onClick={(e) => e.stopPropagation()}
            >
              → {node.links[0].label}
            </a>
          )}
        </div>
        {featured[idx + 1] && (() => {
          const n2 = featured[idx + 1];
          const e2 = eras.find((e) => e.id === n2.era);
          return (
            <div
              className="carousel-card secondary"
              onClick={() => { setIdx(idx + 1); onNodeClick(n2); }}
              style={{ "--era-color": e2?.color || "#e8621a" }}
            >
              <div className="carousel-card-era" style={{ color: e2?.color }}>
                {e2?.label?.toUpperCase()} · {n2.date?.substring(0, 4)}
              </div>
              <h3 className="carousel-card-title">"{n2.title}"</h3>
              <p className="carousel-card-body">{n2.body.substring(0, 120)}…</p>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

function GraphTab({ nodes, eras, searchQuery }) {
  const [activeEra, setActiveEra] = useState("all");
  const [activeNode, setActiveNode] = useState(null);

  const filtered = useMemo(() => {
    let result = nodes;
    if (activeEra !== "all") result = result.filter((n) => n.era === activeEra);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.subtitle.toLowerCase().includes(q) ||
          n.body.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [nodes, activeEra, searchQuery]);

  const eraMap = useMemo(() => Object.fromEntries(eras.map((e) => [e.id, e])), [eras]);

  // Group by era for timeline view
  const byEra = useMemo(() => {
    const groups = {};
    filtered.forEach((n) => {
      if (!groups[n.era]) groups[n.era] = [];
      groups[n.era].push(n);
    });
    return groups;
  }, [filtered]);

  const eraOrder = eras.map((e) => e.id);

  return (
    <div className="graph-tab">
      <FeaturedCarousel nodes={data.nodes} eras={eras} onNodeClick={setActiveNode} />
      <EraFilter eras={eras} activeEra={activeEra} setActiveEra={setActiveEra} />

      <div className="timeline">
        {eraOrder.map((eraId) => {
          const eraNodes = byEra[eraId];
          if (!eraNodes || !eraNodes.length) return null;
          const era = eraMap[eraId];
          return (
            <section key={eraId} className="era-section">
              <div className="era-header">
                <div className="era-dot" style={{ background: era.color }} />
                <div className="era-label-block">
                  <h2 className="era-name" style={{ color: era.color }}>{era.label}</h2>
                  <span className="era-range-label">{era.range} · {eraNodes.length} node{eraNodes.length !== 1 ? "s" : ""}</span>
                </div>
              </div>
              <p className="era-description">{era.description}</p>
              <div className="node-grid">
                {eraNodes.map((node) => (
                  <NodeCard
                    key={node.id}
                    node={node}
                    era={era}
                    onClick={setActiveNode}
                  />
                ))}
              </div>
            </section>
          );
        })}
        {filtered.length === 0 && (
          <div className="empty-state">
            <p>No nodes match your search.</p>
          </div>
        )}
      </div>

      {activeNode && (
        <NodeModal
          node={activeNode}
          era={eraMap[activeNode.era]}
          onClose={() => setActiveNode(null)}
        />
      )}
    </div>
  );
}

function FeedTab({ nodes, eras, searchQuery }) {
  const [activeNode, setActiveNode] = useState(null);
  const eraMap = useMemo(() => Object.fromEntries(eras.map((e) => [e.id, e])), [eras]);

  const sorted = useMemo(() => {
    let result = [...nodes].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.subtitle.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [nodes, searchQuery]);

  return (
    <div className="feed-tab">
      <div className="feed-list">
        {sorted.map((node) => {
          const era = eraMap[node.era];
          const icon = TYPE_ICONS[node.type] || "◆";
          return (
            <article
              key={node.id}
              className="feed-item"
              onClick={() => setActiveNode(node)}
              style={{ "--era-color": era?.color || "#e8621a" }}
            >
              <div className="feed-item-left">
                <div className="feed-icon" style={{ color: era?.color }}>{icon}</div>
                <div className="feed-timeline-line" />
              </div>
              <div className="feed-item-content">
                <div className="feed-item-meta">
                  <span className="feed-era" style={{ color: era?.color }}>{era?.label}</span>
                  <time className="feed-date">{formatDate(node.date)}</time>
                </div>
                <h3 className="feed-title">{node.title}</h3>
                <p className="feed-subtitle">{node.subtitle}</p>
                <div className="node-tags">
                  {node.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="tag">#{tag}</span>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {activeNode && (
        <NodeModal
          node={activeNode}
          era={eraMap[activeNode.era]}
          onClose={() => setActiveNode(null)}
        />
      )}
    </div>
  );
}

function InsightsTab({ nodes, eras }) {
  const eraMap = useMemo(() => Object.fromEntries(eras.map((e) => [e.id, e])), [eras]);
  const publications = nodes.filter((n) => n.type === "publication");
  const insights = nodes.filter((n) => n.type === "insight");
  const projects = nodes.filter((n) => n.type === "project");
  const [activeNode, setActiveNode] = useState(null);

  const Section = ({ title, items, icon }) => (
    <div className="insights-section">
      <h2 className="insights-section-title">{icon} {title}</h2>
      <div className="insights-grid">
        {items.map((node) => {
          const era = eraMap[node.era];
          return (
            <article
              key={node.id}
              className="insight-card"
              onClick={() => setActiveNode(node)}
              style={{ "--era-color": era?.color || "#e8621a" }}
            >
              <div className="insight-card-meta">
                <span style={{ color: era?.color }}>{era?.label}</span>
                <time>{formatDate(node.date)}</time>
              </div>
              <h3>{node.title}</h3>
              <p>{node.subtitle}</p>
              {node.links?.[0] && (
                <a
                  href={node.links[0].url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="insight-link"
                  onClick={(e) => e.stopPropagation()}
                >
                  → {node.links[0].label}
                </a>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="insights-tab">
      <Section title="Publications" items={publications} icon="◉" />
      <Section title="Key Insights" items={insights} icon="◆" />
      <Section title="Projects" items={projects} icon="▣" />
      {activeNode && (
        <NodeModal
          node={activeNode}
          era={eraMap[activeNode.era]}
          onClose={() => setActiveNode(null)}
        />
      )}
    </div>
  );
}

function AboutTab() {
  return (
    <div className="about-tab">
      <div className="about-content">
        <div className="about-intro">
          <h2 className="about-name">Electra Frost</h2>
          <p className="about-role">
            Chartered Tax Adviser (CTA) · Fellow of the Institute of Public Accountants (FIPA) ·
            Fellow of the Tax Institute · Creative Accounting Technologist · International Tax ·
            AI Governance Researcher · Founder, CREDU
          </p>
          <p className="about-location">
            Currently at Network School V1-V2 · Johor–Singapore Special Economic Zone, Malaysia
          </p>
        </div>

        <div className="about-thesis">
          <h3>Core Thesis</h3>
          <blockquote>
            The accounting profession holds a unique, enforceable, cross-border public interest mandate —
            and every major technological transition of the last decade is a moment where that mandate
            either gets exercised or gets abandoned. AI safety — not responsible AI, not operational
            governance, but frontier AI safety — is a social and governance (S+G) accounting imperative.
            Robodebt crystallised it: two decades of watching automated systems fail people without
            adequate controls or appeal. As more infrastructure is rebuilt with AI, someone with real,
            enforceable duties to the public has to stand between the models and the people they affect.
            The public accountant is the missing human control layer.
          </blockquote>
        </div>

        <div className="about-sections">
          <div className="about-section">
            <h3>What this site is</h3>
            <p>
              This site is itself a demonstration of the argument: that the accounting profession needs
              decentralised credentials, verifiable knowledge graphs, and digital-native professional
              infrastructure. It is a machine-readable intellectual provenance graph — a verifiable,
              open record of ideas, predictions, publications and contributions spanning 25 years
              (2000–2026), designed to be queried by humans and LLMs alike.
              See <a href="/llms.txt">llms.txt</a> for the full structured summary.
            </p>
          </div>

          <div className="about-section">
            <h3>Professional credentials</h3>
            <ul className="about-list">
              <li>Chartered Tax Adviser (CTA) — Tax Institute Fellow since 2007</li>
              <li>Fellow of the Institute of Public Accountants (FIPA)</li>
              <li>Associate, Institute of Certified Management Accountants (ICMA)</li>
              <li>Advanced Diploma of Applied Blockchain — Blockchain Collective</li>
              <li>AGI Strategy — BlueDot Impact</li>
              <li>Frontier AI Governance — BlueDot Impact (Cohort 1)</li>
              <li>Mental Health First Aid Certificate</li>
            </ul>
          </div>

          <div className="about-section">
            <h3>Key projects</h3>
            <ul className="about-list">
              <li><a href="https://credu.io" target="_blank" rel="noopener">CREDU</a> — Decentralised CPD/CPE credentialling platform</li>
              <li>Digital Playhouse Foundation — Bitcoin education social enterprise</li>
              <li>Accountants OnChain — Community of crypto-literate accountants</li>
              <li>Stacks Australia — Bitcoin Layer 2 developer community</li>
              <li>CPD PeerLab — Member-led CPD marketplace proposal to IPA</li>
              <li>CREDU Academy — Accountants hackerspace at Network School</li>
            </ul>
          </div>

          <div className="about-section">
            <h3>Contact & verification</h3>
            <ul className="about-list about-links">
              <li><a href="https://blog.electrafrost.com" target="_blank" rel="noopener">Substack</a></li>
              <li><a href="https://linkedin.com/in/electra-frost" target="_blank" rel="noopener">LinkedIn</a></li>
              <li><a href="https://github.com/electrafrost" target="_blank" rel="noopener">GitHub</a></li>
              <li><a href="/llms.txt" target="_blank">llms.txt</a></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ROOT APP ──────────────────────────────────────────────────────────────────

export default function App() {
  const [activeTab, setActiveTab] = useState("GRAPH");
  const [searchQuery, setSearchQuery] = useState("");

  const { nodes, eras } = data;

  return (
    <div className="app">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      <main className="main-content">
        {activeTab === "GRAPH" && (
          <GraphTab nodes={nodes} eras={eras} searchQuery={searchQuery} />
        )}
        {activeTab === "FEED" && (
          <FeedTab nodes={nodes} eras={eras} searchQuery={searchQuery} />
        )}
        {activeTab === "INSIGHTS" && (
          <InsightsTab nodes={nodes} eras={eras} />
        )}
        {activeTab === "ABOUT" && <AboutTab />}
      </main>
      <footer className="site-footer">
        <div className="footer-inner">
          <span>electrafrost.com</span>
          <span className="footer-sep">·</span>
          <span>Updated April 2026</span>
          <span className="footer-sep">·</span>
          <a href="/llms.txt">llms.txt</a>
          <span className="footer-sep">·</span>
          <a href="https://github.com/electrafrost" target="_blank" rel="noopener">GitHub</a>
        </div>
      </footer>
    </div>
  );
}
