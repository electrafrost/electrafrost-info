// v0.1.1 — updated description, nodes sorted newest-first
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import data from "./data.json";
import "./App.css";

// âââ HELPERS ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

const TYPE_ICONS = {
  insight: "",
  publication: "",
  project: "",
  credential: "",
  milestone: "",
  origin: "",
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

// âââ COMPONENTS âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

function Header({ activeTab, setActiveTab, searchQuery, setSearchQuery }) {
  const tabs = ["GRAPH", "FEED", "INSIGHTS", "THESIS", "CPD", "CV"];
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
              A specialist public accountant who has been reinventing professional practice at the digital frontier for 25 years This is her aggregated, sovereign and discoverable record of learning and teaching, ideas, predictions, publications, presentations and contributions spanning 25 years (2000–2026), designed to be queried by humans, AI agents and LLMs alike.
            </p>
            <p className="site-llms">
              Enter this URL into your LLM to query and verify a graph of ideas, publications and
              contributions. <a href="/llms.txt" target="_blank" rel="noopener">llms.txt</a>
            </p>
            <p style={{color:"#c0504d",fontWeight:300,fontStyle:"italic",fontSize:"0.82rem",margin:"0.4rem 0 0",padding:0,background:"none",border:"none"}}>Under construction — errors and omissions are being corrected.</p>
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
              placeholder="Search nodes, ideas, publications..."
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
  const icon = TYPE_ICONS[node.type] || "";
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
  const icon = TYPE_ICONS[node.type] || "";
  useEffect(() => {
    const handler = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>â</button>
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
                  â {link.label}
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
            {era?.label?.toUpperCase()} · {node.date?.substring(0, 4)}
          </div>
          <h3 className="carousel-card-title">"{node.title}"</h3>
          <p className="carousel-card-body">{node.body.substring(0, 200)}...</p>
          {node.links?.[0] && (
            <a
              href={node.links[0].url}
              target="_blank"
              rel="noopener noreferrer"
              className="carousel-link"
              onClick={(e) => e.stopPropagation()}
            >
              â {node.links[0].label}
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
                {e2?.label?.toUpperCase()} · {n2.date?.substring(0, 4)}
              </div>
              <h3 className="carousel-card-title">"{n2.title}"</h3>
              <p className="carousel-card-body">{n2.body.substring(0, 120)}...</p>
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
          const icon = TYPE_ICONS[node.type] || "";
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
                  â {node.links[0].label}
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
      <Section title="Publications" items={publications} icon="â" />
      <Section title="Key Insights" items={insights} icon="â" />
      <Section title="Projects" items={projects} icon="â£" />
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
        <div className="about-preamble">
          <h2 className="about-name">Electra Frost’s Thesis</h2>
          <p className="about-location">Currently in development while Electra is in residence at Network School · Johor–Singapore Special Economic Zone, Malaysia.</p>
          <p>This summary of Electra Frost’s thesis and the graph itself is a demonstration of the argument: that the future credibility of the accounting profession requires decentralised credentials, verifiable knowledge graphs, and profession-owned infrastructure. Her thesis is backed by this machine-readable intellectual provenance graph. See <a href="/llms.txt" target="_blank" rel="noopener">llms.txt</a> for the full structured summary.</p>
          <p>The following Core Thesis is a summary snapshot of an extensive blueprint for the accounting profession that will be published in mid-2026.</p>
        </div>
        <div className="about-thesis">
          <div className="core-thesis-kicker">Core Thesis</div>
          <p>Accounting is not defined by today’s service lines. It is the social function of making economic activity legible, accountable, contestable, and trustworthy across distance, time, and conflicting interests.</p>
          <p>That function sits beneath the profession’s visible tasks. Tax, audit, reporting, controls, assurance, and advisory are only different expressions of a deeper requirement society imposes wherever value moves, records are relied upon, and decisions affect other people. The profession’s enduring purpose is to provide accountability, advocacy, and trust where they cannot be left to self-assertion or programming.</p>
          <p>Bitcoin expresses in protocol form several properties accountants have historically been engaged to secure: truthful records, timestamped events, verifiable ownership, constrained authority, and public auditability. It is a ledger-based monetary system that eliminates counterparty trust by moving verification into open, shared infrastructure. Bitcoin does not require regulation. Where other systems depart from Bitcoin’s security model, additional trust assumptions arise. Those assumptions create new risk, new governance requirements, and a stronger case for intervention, assurance, and oversight.</p>
          <p>Around 150 professional bodies globally qualify their members under common codes of ethics and public-interest obligations enforced across borders. Governments are jurisdictionally bounded. Industry is commercially conflicted. The profession is imperfect, but it is already bound by enforceable duties that travel with the practitioner. And the environment those duties now have to operate in runs on open protocols, transnational coordination, and networks that do not stop at borders.</p>
          <p>That mandate either gets exercised where trust is now being produced, or it gets abandoned in practice. It does not survive in standards, licensing, or rhetoric alone.</p>
          <p>Open protocols, network societies, and AI-mediated infrastructure are all moving the site at which trust, control, and accountability have to be established. The profession cannot remain oriented only to reporting after the fact while the systems of coordination are being rebuilt without it.</p>
          <p>Frontier AI safety is the clearest current test. High-impact automated systems have to be made governable. The people affected by them have to be able to contest the outcomes, verify the controls, and appeal the decisions. Robodebt showed what happens when they cannot. That was a failure of accountability architecture.</p>
          <p>As more critical systems are rebuilt with AI, someone with real enforceable duties to the public has to stand between the models and the people they affect. That role requires independent actors with the technical capacity to execute and verify programmable controls.</p>
          <p>The accounting profession is that function. Not as a legacy occupation defending its territory, but as a public-interest verification, assurance, and escalation function for protocol-based economic systems.</p>
          <p>And if economic life is moving onto open ledgers, programmable systems, and machine-speed coordination, then the profession has to move there too.</p>
          <p className="core-thesis-close">Bitcoin is Accountants. Accountants are Bitcoin.</p>
        </div>
      </div>
    </div>
  );
}

function CPDTab({ data }) {
  const cpd = (data.cpd || []).slice().sort((a, b) => b.date.localeCompare(a.date));
  
  // Group by year
  const byYear = {};
  cpd.forEach(item => {
    const year = item.date.slice(0, 4);
    if (!byYear[year]) byYear[year] = [];
    byYear[year].push(item);
  });
  const years = Object.keys(byYear).sort((a, b) => b - a);
  
  const totalHours = cpd.reduce((sum, item) => sum + item.hours, 0);
  const currentYear = new Date().getFullYear().toString();
  const currentYearHours = (byYear[currentYear] || []).reduce((sum, i) => sum + i.hours, 0);

  const formatDate = (dateStr) => {
    const [y, m, d] = dateStr.split('-');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${parseInt(d)} ${months[parseInt(m)-1]} ${y}`;
  };

  return (
    <div className="cpd-tab">
      <div className="cpd-summary">
        <div className="cpd-stat">
          <span className="cpd-stat-number">{currentYearHours}</span>
          <span className="cpd-stat-label">{currentYear} hours</span>
        </div>
        <div className="cpd-stat">
          <span className="cpd-stat-number">{totalHours.toLocaleString()}</span>
          <span className="cpd-stat-label">total hours logged</span>
        </div>
        <div className="cpd-stat">
          <span className="cpd-stat-number">{cpd.length}</span>
          <span className="cpd-stat-label">events recorded</span>
        </div>
      </div>
      <p className="cpd-note">Verified CPD logged with the Institute of Public Accountants since 2011. Additional professional learning included where verifiable. Records are updated contemporaneously.</p>
      {years.map(year => (
        <div key={year} className="cpd-year-group">
          <div className="cpd-year-header">
            <span className="cpd-year-label">{year}</span>
            <span className="cpd-year-hours">{byYear[year].reduce((s, i) => s + i.hours, 0)} hrs</span>
          </div>
          <div className="cpd-entries">
            {byYear[year].map((item, idx) => (
              <div key={idx} className="cpd-entry">
                <div className="cpd-entry-meta">
                  <span className="cpd-entry-date">{formatDate(item.date)}</span>
                  <span className="cpd-entry-hours">{item.hours} hrs</span>
                  {!item.verified && <span className="cpd-entry-unverified">unverified</span>}
                </div>
                <div className="cpd-entry-event">{item.event}</div>
                <div className="cpd-entry-provider">{item.provider}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function CVTab() {
  return (
    <div className="cv-tab">
      <div className="cv-header">
        <div className="cv-contact">
          <h2 className="cv-title">Curriculum Vitae — Electra Frost</h2>
          <p>Network School, Forest City, Gelang Patah, Johor 81500, Malaysia</p>
          <p>+60 10 666 0556 | mail@electrafrost.com</p>
        </div>
      </div>
      <div className="cv-sections">
        <div className="cv-summary">
          <p>Public accounting practitioner and technologist with Australian international tax expertise, self-employed for nearly twenty of the last twenty-five years. Started in the arts and entertainment industries, drawn to accounting to help people of high potential run legitimate, successful businesses. Introduced to Bitcoin through clients’ cross border business activities in 2013, and has been problem-solving at the intersection of frontier technologies, social enterprise and professional practice ever since.</p>
        </div>
        <div className="cv-section">
          <h3>Current</h3>
          <ul>
            <li><strong>Founding Cohort Member — Network School</strong> (Sep 2024–present, Forest City, Malaysia/Singapore). Selected into V1 first cohort of 128 ‘dark talent’ from over 5,000 applications. One of the earlier long-term NS residents. Contributing to peer mentoring and informal learner-programming of the international digital nomad, entrepreneur and founder community. Base for independently building professional accounting ecosystems for an AI-driven decentralised digital economy, and startup-society transnational tax coordination solutions.</li>
            <li><strong>Founder and Lead Architect — Kigumi Solutions</strong> (October 2025–present). Developing a platform-based business model and architecture to facilitate AI-assisted client-serving collaboration between public accountants and legal firms for legal, documentation, customer due diligence and corporate secretarial services.</li>
            <li><strong>Operations and Platform Partnerships — Consulta Mirabilis Law</strong> (October 2025–present). Leading operations and strategic partnerships, building the practice’s operational infrastructure for integration with Kigumi platform. Engaging SME accounting practices to identify market gaps, developing service models that define human and AI roles at each workflow touchpoint.</li>
            <li><strong>Founder / Researcher — CREDU</strong> (Feb 2024–present). Researching and developing CREDU as a global verified credentialing, audit and procurement platform for accountants’ CPE/CPD using open source technologies. Professional bodies and autonomous agents can publicly inspect CPE/CPD compliance with proof on open blockchain.</li>
            <li><strong>Deputy President — IPA Malaysia Member Advisory Committee (MMAC)</strong> (Sep 2025–present).</li>
            <li><strong>Co-Founder and Director — Digital Playhouse Foundation</strong> (Apr 2021–present, Agnes Water, Queensland). Public Benevolent Institution (PBI). Projects: The School of Bitcoin, Stacks Australia, Accountants On-Chain, Coding 4 Kids, GameChangers.</li>
            <li><strong>Enterprise Engagement — Stacks Australia</strong> (Feb 2024–present). Raising awareness of Stacks as a high-integrity Bitcoin Layer 2 in the Australian blockchain industry.</li>
          </ul>
        </div>
        <div className="cv-section">
          <h3>Previous Roles</h3>
          <ul>
            <li><strong>Crypto Accounting Systems and Advisory — ElectraFi</strong> (Jul 2023–April 2026, Australia/Online). Advisory led public accounting practice specialising in bitcoin treasury, crypto operations, international tax and structuring. Led implementations of crypto accounting systems with Xero/QB integration. Developed advisory resources and CPD for the accounting industry.</li>
            <li><strong>Public Accounting Practitioner, Business Advisor — Electra Frost Advisory</strong> (May 2008–2022, Sydney–Brisbane). Long term specialist accounting, tax and business advisory for artistic and creative industries, international tax for Australians abroad.</li>
            <li><strong>Accounting Workflow and App Implementation Consultant — Sorrento Strategic Accounting</strong> (Feb–Apr 2025, Perth).</li>
            <li><strong>Project Lead — Accountants On-Chain</strong> (2021–2024). Webinars, training, consulting and speaking for crypto-curious accountants, bookkeepers and advisers.</li>
            <li><strong>Blockchain Education Manager — Blockchain Academy International</strong> (Feb–Jun 2023, Brisbane). Conducted competency mapping across Applied Blockchain and Accounting Diploma qualifications to develop an integrated pathway positioning blockchain and AI within accounting practice.</li>
            <li><strong>Principal and Consultant — Discovery Accountants and Advisers</strong> (2016–May 2020, Agnes Water, Queensland).</li>
            <li><strong>Tax Consultant and Accountant — entArt Accounting</strong> (Aug 2002–May 2008, Bondi Junction, Sydney). Specialist business management and tax services for the music and entertainment industry.</li>
            <li><strong>Tax Preparer and Bookkeeper</strong> (Jan 2000–Jul 2002, Sydney). Formative professional experience at Moneypenny Business and Tax Services and Page Harrison and Co.</li>
          </ul>
        </div>
        <div className="cv-section">
          <h3>Professional Registrations and Designations</h3>
          <ul>
            <li><strong>FIPA — Fellow, Institute of Public Accountants</strong> (MIPA from Jan 2011)</li>
            <li><strong>CTA — Chartered Tax Adviser, The Tax Institute</strong> (issued Jan 2010)</li>
            <li><strong>FTIA — Fellow, The Tax Institute</strong> (issued Nov 2007)</li>
            <li><strong>Registered Tax Agent — Tax Practitioners Board</strong> (issued Jan 2007, 25+ years continuous registration)</li>
          </ul>
        </div>
        <div className="cv-section">
          <h3>Education</h3>
          <ul>
            <li><strong>Master of International Taxation — UNSW Australia (2012–2015).</strong> Australian international tax; USA, Canada, China, NZ, Hong Kong, Singapore, Europe, DTAs, tax system design, transfer pricing, employee remuneration, financial planning tax strategies.</li>
            <li><strong>First Cohort, International/Global Studies — The Network School (Sep 2024–present).</strong> Founded by Balaji Srinivasan. Contributing Web3 Accounting and business workshops; developing a futurist accounting faculty and a Bitcoin-principled competencies framework.</li>
            <li><strong>Advanced Diploma of Applied Blockchain — Blockchain Academy International / TAFE Queensland (May 2022–Dec 2023).</strong></li>
            <li><strong>AI Safety: Frontier AI Governance — BlueDot Impact (Mar 2026, first cohort, selective intake).</strong> Action plan: global public accountants as cross-border AI governance intermediary layer.</li>
            <li><strong>AI Safety: AGI Strategy — BlueDot Impact (Jan 2026, selective intake).</strong> 30-hour intensive. Technical AI trends, threat models via kill chain analysis, defence-in-depth frameworks.</li>
            <li><strong>Crypto Accounting Academy — The Accountant Quits (Jul 2024, Credential #18).</strong></li>
            <li><strong>Master of Business Administration (MBA, incomplete) — Bond University (2020–2021).</strong> Withdrew to study blockchain instead.</li>
            <li><strong>Developing Blockchain Strategy — RMIT University (2018).</strong></li>
            <li><strong>Bachelor of Taxation — UNSW (2002–2007).</strong></li>
            <li><strong>Diploma of Financial Planning — Mentor Education (2012–2014).</strong></li>
            <li><strong>Diploma of Advanced Taxation — The Tax Institute (2007).</strong></li>
            <li><strong>Advanced Diploma of Accounting — TAFE NSW (1999–2001).</strong></li>
          </ul>
        </div>
        <div className="cv-section">
          <h3>Volunteering</h3>
          <ul>
            <li><strong>Deputy President — IPA MAC Malaysia</strong> (Sep 2025–present)</li>
            <li><strong>Public Officer — Digital Playhouse Foundation</strong> (May 2021–present).</li>
            <li><strong>Business Mentor — The School of Bitcoin</strong> (Jul 2021–present).</li>
            <li><strong>Mentoring for Growth Consultant — Queensland Government</strong> (Feb 2021–present).</li>
            <li><strong>Vice President — Discovery Coast Tourism and Commerce</strong> (Oct 2020–Oct 2021).</li>
            <li><strong>Committee Member — 1770 Art Show</strong> (Oct 2019–Jan 2022).</li>
            <li><strong>Treasurer — Startup Gladstone Inc.</strong> (Aug 2019–Aug 2020).</li>
          </ul>
        </div>
        <div className="cv-section">
          <h3>Organisations</h3>
          <ul>
            <li><strong>Western Australian AI Hub</strong> — Founding Member (2024)</li>
            <li><strong>CryptoCFOs</strong> — Member (Feb 2024–present).</li>
            <li><strong>Web3Finance Club</strong> — “First 100” Member (Jan 2022–present).</li>
            <li><strong>Digital Economy Council of Australia</strong> — Member since 2021</li>
            <li><strong>LawFi DAO</strong> — Member (2022–2023)</li>
          </ul>
        </div>
        <div className="cv-section">
          <h3>Writing and Media</h3>
          <ul>
            <li><strong>Forbes</strong> — Contributor. Bitcoin policy, monetary infrastructure, UK crypto regulation (2024–2025)</li>
            <li><strong>Cointelegraph</strong> — Contributor. Crypto accounting, Indigenous metaverse, Web3 for business (2022–2023)</li>
            <li><strong>IPA Member Journal</strong> — “Web3: what is it and how will it transform accountancy?” (2024)</li>
            <li><strong>Xero Future Focus</strong> — Featured expert, crypto in small business (2023)</li>
            <li><strong>Global Crypto Tax Report</strong> — Australian overview, Web3 Accountant (2024, English and Chinese)</li>
            <li><strong>Cryptoworth Top 60</strong> — Top 60 Web3 Leaders of Crypto Accounting globally (2024)</li>
            <li><strong>Substack</strong> — <a href="https://blog.electrafrost.com" target="_blank" rel="noopener">blog.electrafrost.com</a> (2023–present)</li>
          </ul>
        </div>
        <div className="cv-section">
          <h3>Skills</h3>
          <p>International Tax · Bitcoin · Crypto Accounting · Applied Blockchain · Web3 · DeFi · Tax Advisory · Business Advisory · Accounting Software · Financial Reporting · Management Accounting · Cryptocurrency Regulation · AI Governance · IT Governance · Frontier AI · AGI Strategy · Strategic Consulting · Community Engagement · Public Speaking · Conference Speaking · Training and Development · Start-up Consulting · Treasury Management · Internal Controls · Audit Readiness · Professional Ethics · Tax Audit Representation</p>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const getTabFromHash = () => {
    const hash = window.location.hash.replace('#', '').toUpperCase();
    const valid = ["GRAPH", "FEED", "INSIGHTS", "THESIS", "CPD", "CV"];
    return valid.includes(hash) ? hash : "GRAPH";
  };
  const [activeTab, setActiveTab] = useState(getTabFromHash);
  const [searchQuery, setSearchQuery] = useState("");

  const { nodes, eras } = data;

  useEffect(() => {
    const onHash = () => {
      const tab = getTabFromHash();
      setActiveTab(tab);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  return (
    <div className="app">
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
        setActiveTab(tab);
        window.location.hash = tab.toLowerCase();
      }}
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
        {activeTab === "THESIS" && <AboutTab />}
            {activeTab === "CPD" && <CPDTab data={data} />}
            {activeTab === "CV" && <CVTab />}
      </main>
      <footer className="site-footer">
        <div className="footer-inner">
          <a href="https://electrafrost.com" target="_blank" rel="noopener">electrafrost.com</a>
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
}// ─── CPD TAB ─────────────────────────────────────────────────────────────────
