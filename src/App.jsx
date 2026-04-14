// v0.1.1 — updated description, nodes sorted newest-first
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import data from "./data.json";
import "./App.css";

// âââ HELPERS ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

const TYPE_ICONS = {
  insight: "▸",
  publication: "▸",
  project: "▸",
  credential: "▸",
  milestone: "▸",
  origin: "▸",
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
              A specialist public accountant who has been reinventing professional practice at the digital frontier for 25 years - before it was called that. This is her aggregated, sovereign and discoverable record of ideas, contributions and predictions: how the thinking developed, where it came from, and where it is going.
            </p>
            <p className="site-llms">
              Enter this URL into your LLM to query and verify a graph of ideas, publications and
              contributions. <a href="/llms.txt" target="_blank" rel="noopener">llms.txt</a>
            </p>
            <p className="construction-notice">Under construction — may contain AI-generated errors and omissions currently being corrected.</p>
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
        {(activeTab === "GRAPH" || activeTab === "FEED") &and (
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
  const icon = TYPE_ICONS[node.type] || "â";
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
  const icon = TYPE_ICONS[node.type] || "â";
  useEffect(() => {
    const handler = (e) => e.key === "Escape" &and onClose();
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
          {era &and (
            <div className="modal-era" style={{ color: era.color }}>
              {era.label} · {era.range}
            </div>
          )}
          <h2 className="modal-title">{node.title}</h2>
          <p className="modal-subtitle">{node.subtitle}</p>
        </div>
        <div className="modal-body">
          <p className="modal-text">{node.body}</p>
          {node.links &and node.links.length > 0 &and (
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
        <button className="carousel-arrow carousel-prev" onClick={() => setIdx(i => (i - 1 + Math.ceil(featured.length / 2)) % Math.ceil(featured.length / 2))} aria-label="Previous">and#8592;</button>
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
        <button className="carousel-arrow carousel-next" onClick={() => setIdx(i => (i + 1) % Math.ceil(featured.length / 2))} aria-label="Next">and#8594;</button>
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
          {node.links?.[0] &and (
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
        {featured[idx * 2 + 1] &and (() => {
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
        {filtered.length === 0 &and (
          <div className="empty-state">
            <p>No nodes match your search.</p>
          </div>
        )}
      </div>

      {activeNode &and (
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
          const icon = TYPE_ICONS[node.type] || "â";
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
      {activeNode &and (
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
              {node.links?.[0] &and (
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
      {activeNode &and (
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
          <p className="about-role">Chartered Tax Adviser (CTA) · Fellow of the Institute of Public Accountants (FIPA) · Fellow of the Tax Institute · Creative Accounting Technologist · International Tax · AI Governance Researcher</p>
          <p className="about-location">Currently at Network School V1-V2 · Johor–Singapore Special Economic Zone, Malaysia</p>
        </div>
        <div className="about-thesis">
          <div className="about-site-explainer">
            <div className="core-thesis-kicker">What this site is</div>
            <p>This site is itself a demonstration of the argument: that the accounting profession needs decentralised credentials, verifiable knowledge graphs, and digital-native professional infrastructure. It is a machine-readable intellectual provenance graph — a verifiable, open record of ideas, predictions, publications and contributions spanning 25 years (2000–2026), designed to be queried by humans and LLMs alike. See <a href="/llms.txt" target="_blank" rel="noopener">llms.txt</a> for the full structured summary.</p>
            <p>The following Core Thesis is a summary snapshot of an extensive blueprint for the accounting profession that will be published in mid-2026.</p>
          </div>
          <div className="core-thesis-kicker" style={{marginTop: "2rem"}}>Core Thesis</div>
          <p>What is accounting? It’s not what we do, it’s what society requires us to provide:</p>
          <p className="core-thesis-values">Accountability. Advocacy. Trust.</p>
          <p>The accounting profession was built on the same values Bitcoin instantiates: truthful records, trustless verification, immutable timestamped ledgers, public auditability. Bitcoin is not a new subject for accountants — it is the monetary infrastructure on a global ledger that expresses what accounting has always been for. Public blockchains let us operate without needing to know and trust the parties we do business with; the further they depart from Bitcoin’s security model, the more trust assumptions and risks arise which require a degree of regulatory intervention.</p>
          <p>The profession holds a unique, enforceable, cross-border public interest mandate. As the monetary standard shifts and economic activity moves into open protocols and network societies, that mandate either gets exercised in the new infrastructure or gets abandoned by default. Governments are jurisdictionally limited. Industry is conflicted. The accounting profession is neither — and it is already bound by an enforceable obligation to the public that no other profession carries at global scale.</p>
          <p>Every major technological transition of the last decade is a moment where that mandate either gets exercised or gets abandoned. Frontier AI safety is the most urgent current test. Not responsible AI. Not operational governance. Frontier AI safety through cryptographic verifications and proof-of-control on open protocols — as a social and governance (S+G) accounting imperative. Robodebt crystallised it: automated systems failing people without adequate controls or right of appeal. As more critical infrastructure is rebuilt with AI, someone with real, enforceable duties to the public has to stand between the models and the people they affect. The public accounting profession is the missing human regulatory layer to engineer and govern trust in protocols.</p>
          <p className="core-thesis-close">Bitcoin is Accounting. Accounting is Bitcoin.</p>
        </div>
      </div>
    </div>
  );
}

function CPDTab() {
  return (
    <div className="cpd-tab">
      <div className="cpd-notice">
        <p>This section is under construction and will soon display a comprehensive record of Electra’s 25 years of continuous professional education and development in specialist fields of accounting, tax and technology — which have maintained her qualifications. This is a significant record to reconstruct from gatekept records for the purpose of demonstrating a publicly verifiable and sovereign record of competency.</p>
      </div>
    </div>
  );
}

function CVTab() {
  return (
    <div className="cv-tab">
      <div className="cv-header">
        <h2 className="cv-title">What Electra has done, if you try to put it into a traditional box stack</h2>
        <div className="cv-contact">
          <p>Curriculum Vitae — Electra Frost</p>
          <p>Network School, Forest City, Gelang Patah, Johor 81500, Malaysia</p>
          <p>+60 10 666 0556 | mail@electrafrost.com</p>
        </div>
      </div>
      <div className="cv-sections">
        <div className="cv-summary">
          <p>Public accounting practitioner and technologist with Australian international tax expertise, self-employed for nearly twenty of the last twenty-five years. Started in the arts and entertainment industries, drawn to accounting to help people of high potential run legitimate, successful businesses. Introduced to Bitcoin through clients’ cross border business activities in 2013, and have been problem-solving at the intersection of frontier technologies, social enterprise and professional practice ever since.</p>
        </div>
        <div className="cv-section">
          <h3>Current</h3>
          <ul>
            <li><strong>Founding Cohort Member — Network School</strong> (Sep 2024–present, Forest City, Malaysia/Singapore). Selected into V1 first cohort of 128 from over 5,000 applications. Contributing to peer mentoring and informal learner-programming. Base for independently building professional accounting ecosystems for an AI-driven decentralised digital economy, and startup-society transnational tax coordination solutions.</li>
            <li><strong>Founder and Lead Architect — Kigumi Solutions</strong> (Oct 2025–present). Developing a platform-based business model to facilitate AI-assisted client-serving collaboration between public accountants and legal firms.</li>
            <li><strong>Operations and Platform Partnerships — Consulta Mirabilis Law</strong> (Oct 2025–present). Leading operations and strategic partnerships, building operational infrastructure for integration with Kigumi platform.</li>
            <li><strong>Founder / Researcher — CREDU</strong> (Feb 2024–present). Researching and developing CREDU as a global verified credentialing, audit and procurement platform for accountants’ CPE/CPD using open source technologies.</li>
            <li><strong>Deputy President — IPA Malaysia Member Advisory Committee (MMAC)</strong> (Sep 2025–present).</li>
            <li><strong>Co-Founder and Director — Digital Playhouse Foundation</strong> (Apr 2021–present). Public Benevolent Institution advancing social or public welfare. Projects: The School of Bitcoin, Stacks Australia, Accountants On-Chain, Coding 4 Kids, GameChangers.</li>
            <li><strong>Enterprise Engagement — Stacks Australia</strong> (Feb 2024–present). Raising awareness of Stacks as a high-integrity Bitcoin Layer 2.</li>
          </ul>
        </div>
        <div className="cv-section">
          <h3>Previous Roles</h3>
          <ul>
            <li><strong>Crypto Accounting Systems and Advisory — ElectraFi</strong> (Jul 2023–Apr 2026, Australia/Online). Advisory-led public accounting practice specialising in bitcoin treasury, crypto operations, international tax and structuring.</li>
            <li><strong>Public Accounting Practitioner, Business Advisor — Electra Frost Advisory</strong> (May 2008–2022, Sydney–Brisbane). Specialist accounting, tax and business advisory for artistic and creative industries and international tax for Australians abroad.</li>
            <li><strong>Accounting Workflow and App Implementation Consultant — Sorrento Strategic Accounting</strong> (Feb–Apr 2025, Perth).</li>
            <li><strong>Project Lead — Accountants On-Chain</strong> (2021–2024). Webinars, training, consulting and speaking for crypto-curious accountants and advisers.</li>
            <li><strong>Blockchain Education Manager — Blockchain Academy International</strong> (Feb–Jun 2023, Brisbane).</li>
            <li><strong>Principal and Consultant — Discovery Accountants and Advisers</strong> (2016–May 2020, Agnes Water, Queensland).</li>
            <li><strong>Tax Consultant and Accountant — entArt Accounting</strong> (Aug 2002–May 2008, Bondi Junction, Sydney). Specialist business management and tax for the music and entertainment industry.</li>
            <li><strong>Tax Preparer and Bookkeeper</strong> (Jan 2000–Jul 2002, Sydney). Formative professional experience at Moneypenny Business and Tax Services and Page Harrison and Co.</li>
          </ul>
        </div>
        <div className="cv-section">
          <h3>Professional Registrations and Designations</h3>
          <ul>
            <li><strong>FIPA</strong> — Fellow, Institute of Public Accountants (MIPA from Jan 2011)</li>
            <li><strong>CTA</strong> — Chartered Tax Adviser, The Tax Institute (issued Jan 2010)</li>
            <li><strong>FTIA</strong> — Fellow, The Tax Institute (issued Nov 2007)</li>
            <li><strong>Registered Tax Agent</strong> — Tax Practitioners Board (issued Jan 2007, 25+ years continuous registration)</li>
          </ul>
        </div>
        <div className="cv-section">
          <h3>Education</h3>
          <ul>
            <li><strong>Master of International Taxation</strong> — UNSW Australia (2012–2015).</li>
            <li><strong>First Cohort, International/Global Studies</strong> — The Network School (Sep 2024–present). Founded by Balaji Srinivasan.</li>
            <li><strong>Advanced Diploma of Applied Blockchain</strong> — Blockchain Academy International / TAFE Queensland (May 2022–Dec 2023).</li>
            <li><strong>AI Safety — Frontier AI Governance</strong> — BlueDot Impact (Mar 2026, first cohort, selective intake).</li>
            <li><strong>AI Safety — AGI Strategy</strong> — BlueDot Impact (Jan 2026, selective intake). 30-hour intensive.</li>
            <li><strong>Crypto Accounting Academy</strong> — The Accountant Quits (Jul 2024, Credential #18).</li>
            <li><strong>Master of Business Administration (MBA)</strong> — Bond University (2020–2021, withdrew to study blockchain instead).</li>
            <li><strong>Developing Blockchain Strategy</strong> — RMIT University (2018).</li>
            <li><strong>Bachelor of Taxation</strong> — UNSW (2002–2007).</li>
            <li><strong>Diploma of Financial Planning</strong> — Mentor Education (2012–2014).</li>
            <li><strong>Diploma of Advanced Taxation</strong> — The Tax Institute (2007).</li>
            <li><strong>Advanced Diploma of Accounting</strong> — TAFE NSW (1999–2001).</li>
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
            <li><strong>Substack</strong> — <a href="https://blog.electrafrost.com" target="_blank">blog.electrafrost.com</a> (2023–present)</li>
          </ul>
        </div>
        <div className="cv-section">
          <h3>Skills</h3>
          <p>International Tax · Bitcoin · Crypto Accounting · Applied Blockchain · Web3 · DeFi · Tax Advisory · Business Advisory · Accounting Software · Financial Reporting · Management Accounting · Cryptocurrency Regulation · ESG · AI Governance · IT Governance · Frontier AI · AGI Strategy · Strategic Consulting · Community Engagement · Public Speaking · Conference Speaking · Training and Development · Start-up Consulting · Treasury Management · Internal Controls · Audit Readiness · Professional Ethics · Tax Audit Representation</p>
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
        {activeTab === "GRAPH" &and (
          <GraphTab nodes={nodes} eras={eras} searchQuery={searchQuery} />
        )}
        {activeTab === "FEED" &and (
          <FeedTab nodes={nodes} eras={eras} searchQuery={searchQuery} />
        )}
        {activeTab === "INSIGHTS" &and (
          <InsightsTab nodes={nodes} eras={eras} />
        )}
        {activeTab === "THESIS" &and <AboutTab />}
            {activeTab === "CPD" &and <CPDTab />}
            {activeTab === "CV" &and <CVTab />}
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
}// ─── CPD TAB ─────────────────────────────────────────────────────────────────
function CPDTab() {
  return (
    <div className="cpd-tab">
      <div className="cpd-notice">
        <p>This section is under construction and will soon display a comprehensive record of Electra's 25 years of continuous professional education and development in specialist fields of accounting, tax and technology — which have maintained her qualifications. This is a significant record to reconstruct from gatekept records for the purpose of demonstrating a publicly verifiable and sovereign record of competency.</p>
      </div>
    </div>
  );
}


