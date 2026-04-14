// v0.1.1 Ã¢ÂÂ updated description, nodes sorted newest-first
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import data from "./data.json";
import "./App.css";

// Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ HELPERS Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ

const TYPE_ICONS = {
  insight: "Ã¢ÂÂ",
  publication: "Ã¢ÂÂ",
  project: "Ã¢ÂÂ£",
  credential: "Ã¢ÂÂ¦",
  milestone: "Ã¢ÂÂ",
  origin: "Ã¢ÂÂ",
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

// Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ COMPONENTS Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ

function Header({ activeTab, setActiveTab, searchQuery, setSearchQuery }) {
  const tabs = ["GRAPH", "FEED", "INSIGHTS", "ABOUT", "CV"];
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
              placeholder="Search nodes, ideas, publicationsÃ¢ÂÂ¦"
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
  const icon = TYPE_ICONS[node.type] || "Ã¢ÂÂ";
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
  const icon = TYPE_ICONS[node.type] || "Ã¢ÂÂ";
  useEffect(() => {
    const handler = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>Ã¢ÂÂ</button>
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
              {era.label} ÃÂ· {era.range}
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
                  Ã¢ÂÂ {link.label}
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
    nodes.filter((n) => ["thesis", "position", "publication", "insight", "project", "milestone", "spark", "credential"].includes(n.type)).slice(0, 16),
    [nodes]
  );
  if (!featured.length) return null;
  const node = featured[idx * 2];
  const era = eras.find((e) => e.id === node.era);

  return (
    <div className="carousel-section">
      <div className="carousel-label">LATEST THOUGHT LEADERSHIP</div>
      <div className="carousel-nav">
        <button className="carousel-arrow carousel-prev" onClick={() => setIdx(i => (i - 1 + Math.ceil(featured.length / 2)) % Math.ceil(featured.length / 2))} aria-label="Previous">&#8592;</button>
        <div className="carousel-dots">
          {featured.map((_, i) => (
            <button
              key={i}
              className={`carousel-dot ${i === idx ? "active" : ""}`}
              onClick={() => setIdx(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
        <button className="carousel-arrow carousel-next" onClick={() => setIdx(i => (i + 1) % Math.ceil(featured.length / 2))} aria-label="Next">&#8594;</button>
      </div>
      <div className="carousel-track">
        <div
          className="carousel-card featured"
          onClick={() => onNodeClick(node)}
          style={{ "--era-color": era?.color || "#e8621a" }}
        >
          <div className="carousel-card-era" style={{ color: era?.color }}>
            {era?.label?.toUpperCase()} ÃÂ· {node.date?.substring(0, 4)}
          </div>
          <h3 className="carousel-card-title">"{node.title}"</h3>
          <p className="carousel-card-body">{node.body.substring(0, 200)}Ã¢ÂÂ¦</p>
          {node.links?.[0] && (
            <a
              href={node.links[0].url}
              target="_blank"
              rel="noopener noreferrer"
              className="carousel-link"
              onClick={(e) => e.stopPropagation()}
            >
              Ã¢ÂÂ {node.links[0].label}
            </a>
          )}
        </div>
        {featured[idx * 2 + 1] && (() => {
          const n2 = featured[idx * 2 + 1];
          const e2 = eras.find((e) => e.id === n2.era);
          return (
            <div
              className="carousel-card secondary"
              onClick={() => { setIdx(idx + 1); onNodeClick(n2); }}
              style={{ "--era-color": e2?.color || "#e8621a" }}
            >
              <div className="carousel-card-era" style={{ color: e2?.color }}>
                {e2?.label?.toUpperCase()} ÃÂ· {n2.date?.substring(0, 4)}
              </div>
              <h3 className="carousel-card-title">"{n2.title}"</h3>
              <p className="carousel-card-body">{n2.body.substring(0, 120)}Ã¢ÂÂ¦</p>
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
                  <span className="era-range-label">{era.range} ÃÂ· {eraNodes.length} node{eraNodes.length !== 1 ? "s" : ""}</span>
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
          const icon = TYPE_ICONS[node.type] || "Ã¢ÂÂ";
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
                  Ã¢ÂÂ {node.links[0].label}
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
      <Section title="Publications" items={publications} icon="Ã¢ÂÂ" />
      <Section title="Key Insights" items={insights} icon="Ã¢ÂÂ" />
      <Section title="Projects" items={projects} icon="Ã¢ÂÂ£" />
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
            Chartered Tax Adviser (CTA) ÃÂ· Fellow of the Institute of Public Accountants (FIPA) ÃÂ·
            Fellow of the Tax Institute ÃÂ· Creative Accounting Technologist ÃÂ· International Tax ÃÂ·
            AI Governance Researcher ÃÂ· Founder, CREDU
          </p>
          <p className="about-location">
            Currently at Network School V1-V2 ÃÂ· JohorÃ¢ÂÂSingapore Special Economic Zone, Malaysia
          </p>
        </div>

        <div className="about-thesis">
          <h3>Core Thesis</h3>
          <blockquote>
            The accounting profession holds a unique, enforceable, cross-border public interest mandate Ã¢ÂÂ
            and every major technological transition of the last decade is a moment where that mandate
            either gets exercised or gets abandoned. AI safety Ã¢ÂÂ not responsible AI, not operational
            governance, but frontier AI safety Ã¢ÂÂ is a social and governance (S+G) accounting imperative.
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
              infrastructure. It is a machine-readable intellectual provenance graph Ã¢ÂÂ a verifiable,
              open record of ideas, predictions, publications and contributions spanning 25 years
              (2000Ã¢ÂÂ2026), designed to be queried by humans and LLMs alike.
              See <a href="/llms.txt">llms.txt</a> for the full structured summary.
            </p>
          </div>

          <div className="about-section">
            <h3>Professional credentials</h3>
            <ul className="about-list">
              <li>Chartered Tax Adviser (CTA) Ã¢ÂÂ Tax Institute Fellow since 2007</li>
              <li>Fellow of the Institute of Public Accountants (FIPA)</li>
              <li>Associate, Institute of Certified Management Accountants (ICMA)</li>
              <li>Advanced Diploma of Applied Blockchain Ã¢ÂÂ Blockchain Collective</li>
              <li>AGI Strategy Ã¢ÂÂ BlueDot Impact</li>
              <li>Frontier AI Governance Ã¢ÂÂ BlueDot Impact (Cohort 1)</li>
              <li>Mental Health First Aid Certificate</li>
            </ul>
          </div>

          <div className="about-section">
            <h3>Key projects</h3>
            <ul className="about-list">
              <li><a href="https://credu.io" target="_blank" rel="noopener">CREDU</a> Ã¢ÂÂ Decentralised CPD/CPE credentialling platform</li>
              <li>Digital Playhouse Foundation Ã¢ÂÂ Bitcoin education social enterprise</li>
              <li>Accountants OnChain Ã¢ÂÂ Community of crypto-literate accountants</li>
              <li>Stacks Australia Ã¢ÂÂ Bitcoin Layer 2 developer community</li>
              <li>CPD PeerLab Ã¢ÂÂ Member-led CPD marketplace proposal to IPA</li>
              <li>CREDU Academy Ã¢ÂÂ Accountants hackerspace at Network School</li>
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

// Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ ROOT APP Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ



// Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂ CV TAB Ã¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂÃ¢ÂÂ
function CVTab() {
  return (
    <div className="cv-tab">
      <div className="cv-header">
        <h2 className="cv-title">Curriculum Vitae - Electra Frost</h2>
        <p className="cv-contact">Network School, Forest City<br />Gelang Patah, Johor 81500, Malaysia<br />+60 10 666 0556 | mail@electrafrost.com</p>
      </div>
      <div className="cv-sections">

        <div className="cv-section">
          <h3>Current</h3>
          <ul>
            <li><strong>Founding Cohort Member â Network School</strong> (Sep 2024âpresent, Forest City, Malaysia/Singapore). Selected into V1 first cohort of 128 'dark talent' from over 5,000 applications. One of the earlier long-term NS residents. Contributing to peer mentoring and informal learner-programming of the international digital nomad, entrepreneur and founder community. Base for independently building professional accounting ecosystems for an AI-driven decentralised digital economy, and startup-society transnational tax coordination solutions.</li>

            <li><strong>Founder and Lead Architect â Kigumi Solutions</strong> (October 2025âpresent). Developing a platform-based business model and architecture to facilitate AI-assisted client-serving collaboration between public accountants and legal firms for legal, documentation, customer due diligence and corporate secretarial services.</li>

            <li><strong>Operations and Platform Partnerships â Consulta Mirabilis Law</strong> (October 2025âpresent). Leading the operations and strategic partnerships, building the practice's operational infrastructure for integration with Kigumi platform. Engaging SME accounting practices to identify market gaps, while developing service models that define human and AI roles at each workflow touchpoint, and navigating the regulatory and ethical frameworks for agentic practice.</li>

            <li><strong>Founder / Researcher â CREDU</strong> (Feb 2024âpresent). Researching and developing CREDU as a global verified credentialing, audit and procurement platform for accountants' continuous professional education (CPE/CPD) using open source technologies. Solving inefficiencies in aggregating, tracking, verifying and monetising knowledge credibility. Professional bodies and autonomous agents can publicly inspect CPE/CPD compliance and expertise of their membership with proof on open blockchain.</li>

            <li><strong>Deputy President â IPA Malaysia Member Advisory Committee (MMAC), Institute of Public Accountants</strong> (Sep 2025âpresent).</li>
          </ul>
        </div>

        <div className="cv-section">
          <h3>Previous</h3>
          <ul>
            <li><strong>Crypto Accounting Systems and Advisory â ElectraFi</strong> (Rebranded Electra Frost Advisory, Jul 2023âApril 2026, Australia/Online). Advisory led public accounting practice with a fractional finance-team year-round service model for scale-up enterprises. Specialising in bitcoin treasury, crypto operations, international tax and structuring. Led implementations of crypto accounting and financial operations systems with Xero/QB integration. Australian tax agent services. Developed advisory resources and CPD for the accounting industry.</li>

            <li><strong>Public Accounting Practitioner, Business Advisor â Electra Frost Advisory</strong> (May 2008â2022, Sydney-Brisbane, Online/Remote). Sold tax practice during pandemic and rebranded as advisory-led practice. Holistic advisory packages, specialist networks, remote-first with cloud tools and 4-day working week. Long term specialist accounting, tax and business advisory for artistic and creative industries, international tax for Australians abroad.</li>

            <li><strong>Accounting Workflow &amp; App Implementation Consultant â Sorrento Strategic Accounting</strong> (FebâApr 2025, Perth). Increased efficiency and future proofing through improved accounting practice management and cloud tech stack implementation for a boutique accounting practice.</li>

            <li><strong>Co-Founder and Director â Digital Playhouse Foundation</strong> (Apr 2021âpresent, Agnes Water, Queensland). Public Benevolent Institution (PBI) recognised for 'Advancing social or public welfare'. Projects: The School of Bitcoin, Stacks Australia, Accountants On-Chain, Coding 4 Kids, GameChangers.</li>

            <li><strong>Enterprise Engagement â Stacks Australia</strong> (Feb 2024âpresent, Remote). Raising awareness of Stacks as a high-integrity Bitcoin Layer 2 in the Australian blockchain industry. Content creation, public speaking, enterprise stakeholder engagement. Working with Stacks Australia Leads to articulate the value proposition of Bitcoin L1/L2 to decision-makers, investors and partners.</li>

            <li><strong>Project Lead â Accountants On-Chain</strong> (2021â2024, The Internet). Webinars, training, consulting and speaking for crypto-curious accountants, bookkeepers and advisers. Crypto accounting subledger tools, professional services DAO research, blockchain business models, tax practitioner ethics and competencies.</li>

            <li><strong>Blockchain Education Manager â Blockchain Academy International</strong> (FebâJun 2023, Brisbane, Remote). Ensuring high quality delivery of Diploma and Advanced Diploma of Applied Blockchain and AI under the Australian Qualifications Framework. Training, support and career guidance for students entering the field. Conducted competency mapping across the Applied Blockchain and Accounting Diploma qualifications to develop an integrated pathway positioning blockchain and AI technology within accounting practice.</li>

            <li><strong>Principal and Consultant â Discovery Accountants &amp; Advisers</strong> (2016âMay 2020, Agnes Water, Queensland). Accounting, tax and advisory services for SMEs, digital entrepreneurs and remote business operators on the Discovery Coast. Closed May 2020 on consolidation into Electra Frost Advisory.</li>

            <li><strong>Tax Consultant and Accountant â entArt Accounting</strong> (Aug 2002âMay 2008, Bondi Junction, Sydney). Specialist business management and tax services for the music and entertainment industry. Established by Barry Moore CA in the early 1990s.</li>

            <li><strong>Tax Preparer and Bookkeeper</strong> (Jan 2000âJul 2002, Sydney). Formative professional experience at specialist CA practices including Moneypenny Business &amp; Tax Services at Fox Studios and Page Harrison &amp; Co, North Sydney.</li>
          </ul>
        </div>

        <div className="cv-section">
          <h3>Professional Registrations &amp; Designations</h3>
          <ul>
            <li><strong>FIPA</strong> â Fellow, Institute of Public Accountants. FIPA Qualified Accountant, Professional Practice Certificate (2018, MIPA from Jan 2011)</li>
            <li><strong>CTA</strong> â Chartered Tax Adviser, The Tax Institute (issued Jan 2010)</li>
            <li><strong>FTIA</strong> â Fellow, The Tax Institute (issued Nov 2007)</li>
            <li><strong>Registered Tax Agent</strong> â Tax Practitioners Board (issued Jan 2007, 25+ years continuous registration)</li>
          </ul>
        </div>

        <div className="cv-section">
          <h3>Education</h3>
          <ul>
            <li><strong>Master of International Taxation â UNSW Australia</strong> (2012â2015). Australian international tax; USA, Canada, China, NZ, Hong Kong, Singapore, Europe, DTAs, tax system design and structures, transfer pricing, employee remuneration, financial planning tax strategies.</li>

            <li><strong>First Cohort, International/Global Studies â The Network School</strong> (Sep 2024âpresent). Founded by Balaji Srinivasan for co-developing society-as-a-service with peer-to-peer interdisciplinary learning: entrepreneurship, cryptography, Bitcoin, AI, coding, startup growth, digital governance. Contributing Web3 Accounting and business workshops; developing a futurist accounting faculty and a Bitcoin-principled competencies framework.</li>

            <li><strong>Advanced Diploma of Applied Blockchain â Blockchain Academy International / TAFE Queensland</strong> (May 2022âDec 2023). Blockchain framework, decentralised consensus, smart contracts, blockchain governance, interoperability, network stewardship.</li>

            <li><strong>AI Safety: Frontier AI Governance â BlueDot Impact</strong> (issued Mar 2026, first cohort, selective intake). Frontier AI capability assessment, institutional power and dependencies, governance frameworks under crisis and competitive dynamics. Action plan: global public accountants as cross-border AI governance intermediary layer.</li>

            <li><strong>AI Safety: AGI Strategy â BlueDot Impact</strong> (issued Jan 2026, selective intake). 30-hour intensive. Technical AI trends, threat models via kill chain analysis, defence-in-depth frameworks, action plan for beneficial AI outcomes.</li>

            <li><strong>Crypto Accounting Academy â The Accountant Quits</strong> (issued Jul 2024, Credential #18). Block explorers, on-chain accounting, treasury management, tax, audit.</li>

            <li><strong>Master of Business Administration (MBA, incomplete) â Bond University</strong> (2020â2021). Withdrew to study blockchain instead.</li>

            <li><strong>Developing Blockchain Strategy â RMIT University</strong> (2018). Blockchain technology, use cases, value propositions, strategic frameworks.</li>

            <li><strong>Bachelor of Taxation â UNSW</strong> (2002â2007). Tax law, policy and administration, commercial law, economics and accounting.</li>

            <li><strong>Diploma of Financial Planning â Mentor Education</strong> (2012â2014). RG146 compliance for superannuation, SMSF, investments, lending, insurances; limited AFSL (accountants' licence).</li>

            <li><strong>Diploma of Advanced Taxation â The Tax Institute</strong> (2007). CGT, GST, property transactions. Required for FTIA designation.</li>

            <li><strong>Advanced Diploma of Accounting â TAFE NSW</strong> (1999â2001).</li>
          </ul>
        </div>

        <div className="cv-section">
          <h3>Volunteering</h3>
          <ul>
            <li><strong>Deputy President â IPA MAC Malaysia, Institute of Public Accountants</strong> (Sep 2025âpresent)</li>
            <li><strong>Public Officer â Digital Playhouse Foundation</strong> (May 2021âpresent). PBI charity delivering digital skills and financial literacy programs.</li>
            <li><strong>Business Mentor â The School of Bitcoin</strong> (Jul 2021âpresent). Free and open source learning community on Nostr. Value 4 Value lessons, Bitcoin project mentorship and funding.</li>
            <li><strong>Mentoring for Growth (M4G) Consultant â Queensland Government</strong> (Feb 2021âpresent). Panel mentoring for small business startups on financial management, budgeting, cloud accounting tools.</li>
            <li><strong>Vice President â Discovery Coast Tourism and Commerce</strong> (Oct 2020âOct 2021). Strategy, grants, membership, business community relationships.</li>
            <li><strong>Committee Member â 1770 Art Show</strong> (Oct 2019âJan 2022). Annual regional art show, Agnes Water, Qld. Prize pool $10,000+. Worked with QAG/GOMA curator.</li>
            <li><strong>Treasurer â Startup Gladstone Inc.</strong> (Aug 2019âAug 2020). Not-for-profit social enterprise. Digitalised record keeping, online collaboration tools, monthly management reporting.</li>
          </ul>
        </div>

        <div className="cv-section">
          <h3>Organisations</h3>
          <ul>
            <li><strong>Western Australian AI Hub</strong> â Founding Member (2024)</li>
            <li><strong>CryptoCFOs</strong> â Member (Feb 2024âpresent). Premier community for Web3 finance professionals.</li>
            <li><strong>Web3Finance Club</strong> â "First 100" Member (Jan 2022âpresent). Community for finance leaders in Web3. Membership NFT holder.</li>
            <li><strong>Digital Economy Council of Australia</strong> (formerly Blockchain Australia) â Member since 2021</li>
            <li><strong>LawFi DAO</strong> â Member (2022â2023)</li>
          </ul>
        </div>

        <div className="cv-section">
          <h3>Writing &amp; Media</h3>
          <ul>
            <li><strong>Contributor</strong> â Bitcoin policy, monetary infrastructure, UK crypto regulation (2024â2025)</li>
            <li><strong>Contributor</strong> â Crypto accounting, Indigenous metaverse, Web3 for business (2022â2023)</li>
            <li><strong>IPA Member Journal</strong> â "Web3: what is it and how will it transform accountancy?" (2024)</li>
            <li><strong>Xero Future Focus</strong> â Featured expert, crypto in small business (2023)</li>
            <li><strong>Global Crypto Tax Report</strong> â Australian overview, Web3 Accountant (2024, English and Chinese)</li>
            <li><strong>Cryptoworth Top 60</strong> â Top 60 Web3 Leaders of Crypto Accounting globally (2024)</li>
            <li><strong>Substack</strong> â blog.electrafrost.com (2023âpresent)</li>
          </ul>
        </div>

        <div className="cv-section">
          <h3>Skills</h3>
          <p className="cv-skills">International Tax Â· Bitcoin Â· Crypto Accounting Â· Applied Blockchain Â· Web3 Â· DeFi Â· Tax Advisory Â· Business Advisory Â· Accounting Software Â· Financial Reporting Â· Management Accounting Â· Cryptocurrency Regulation Â· ESG Â· AI Governance Â· IT Governance Â· Frontier AI Â· AGI Strategy Â· Strategic Consulting Â· Community Engagement Â· Public Speaking Â· Conference Speaking Â· Training &amp; Development Â· Start-up Consulting Â· Treasury Management Â· Internal Controls Â· Audit Readiness Â· Professional Ethics Â· Tax Audit Representation</p>
        </div>

      </div>
    </div>
  );
}


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
            {activeTab === "CV" && <CVTab />}
      </main>
      <footer className="site-footer">
        <div className="footer-inner">
          <span>electrafrost.com</span>
          <span className="footer-sep">ÃÂ·</span>
          <span>Updated April 2026</span>
          <span className="footer-sep">ÃÂ·</span>
          <a href="/llms.txt">llms.txt</a>
          <span className="footer-sep">ÃÂ·</span>
          <a href="https://github.com/electrafrost" target="_blank" rel="noopener">GitHub</a>
        </div>
      </footer>
    </div>
  );
}
