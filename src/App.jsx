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



// ─── CV TAB ─────────────────────────────────────────────────────────────────
function CVTab() {
  return (
    <div className="cv-tab">
      <div className="cv-header">
        <h2 className="cv-title">What Electra has done, if you try to put it into a traditional box stack</h2>
      </div>
      <div className="cv-sections">

        <div className="cv-section">
          <h3>Currently</h3>
          <div className="cv-item">
            <div className="cv-item-header"><strong>Researcher & Builder</strong> — Network School, Johor–Singapore SEZ, Malaysia</div>
            <div className="cv-item-date">September 2024 — present (Cohort V1–V2)</div>
            <p>Embedded at Network School designing a network-state-aligned professional accounting faculty and association. Drafting a Global Competencies Framework for a Bitcoin Standard. Running CREDU Academy — an accountants' hackerspace for AI, Bitcoin and open-protocol literacy. Three active research tracks: on-chain P2P credentialing with a new global competency framework; transnational tax coordination for globally mobile people; Bitcoin unit-of-account model for multicurrency settlements.</p>
          </div>
          <div className="cv-item">
            <div className="cv-item-header"><strong>Deputy President, Member Advisory Committee</strong> — Institute of Public Accountants, Malaysia</div>
            <div className="cv-item-date">2025 — present</div>
            <p>Supporting IPA Global's member engagement strategy and the GCPA transdisciplinary accounting qualification in Southeast Asia.</p>
          </div>
        </div>

        <div className="cv-section">
          <h3>Practice</h3>
          <div className="cv-item">
            <div className="cv-item-header"><strong>ElectraFi</strong> — Specialist crypto accounting practice</div>
            <div className="cv-item-date">2022 — 2024</div>
            <p>Pivoted 15-year-old Electra Frost Advisory into ElectraFi — Australia's first specialist Bitcoin and crypto accounting practice. Built crypto chart of accounts, subledger software stacks (Bitwave, Cryptoworth, CTC), and monthly reconciliation workflows for crypto-native businesses, DeFi operators, NFT creators, and Web3 founders. International tax for digital nomads, founders, and globally mobile people. Presented on DeFi taxation nationally. Closed books 2024.</p>
          </div>
          <div className="cv-item">
            <div className="cv-item-header"><strong>Electra Frost Advisory</strong> — Accounting practice for creatives and SMEs</div>
            <div className="cv-item-date">2000 — 2022 (sold 2020, wound up 2022)</div>
            <p>Built from inner-city Sydney, moved fully online to remote Queensland in 2015 — before the pandemic made remote work mainstream. Specialised in creative industries (film, music, arts), tech enterprises, and SMEs. Put Bitcoin on the balance sheet in 2013. Transformed from a 700-client tax practice to a 30-client advisory model in 2020. Sold the practice in 2020 and pivoted to crypto-native services.</p>
          </div>
          <div className="cv-item">
            <div className="cv-item-header"><strong>International Tax & Advisory</strong></div>
            <div className="cv-item-date">Ongoing</div>
            <p>Specialist advisory on Australian international tax, crypto-backed lending, SMSF Bitcoin strategy, AML/CTF compliance for professional services. Presented individual tax obligations for digital nomads in Malaysia. Quoted in IPA publications on Bitcoin as a distinct asset class for SMSF trustees.</p>
          </div>
        </div>

        <div className="cv-section">
          <h3>Founded & Built</h3>
          <div className="cv-item">
            <div className="cv-item-header"><strong>CREDU</strong> — Decentralised credentials for the accounting profession</div>
            <div className="cv-item-date">2023 — present · credu.io</div>
            <p>Decentralised CPD/CPE credentialing system built on Bitcoin Layer 2 (Stacks). Accountants log, verify, and display professional development on-chain — tamper-proof, portable, owned by the practitioner not the institution. Enables peer-to-peer learning and a value-for-value CPD model. The proof-of-concept for decentralised professional association. CREDU Academy at Network School is the live sandbox faculty.</p>
          </div>
          <div className="cv-item">
            <div className="cv-item-header"><strong>Digital Playhouse Foundation Ltd</strong> — Public Benevolent Institution</div>
            <div className="cv-item-date">2021 — present · Agnes Water, Queensland</div>
            <p>Co-founded Australia's first Bitcoin-native registered charity (PBI, advancing social welfare). Operations include The School of Bitcoin, Stacks Australia, and Accountants OnChain. Received Stacks ANZ Chapter Grant. Operating in Agnes Water/1770, Australia's first "digital currency town" (2018). Coding for kids, financial literacy, and blockchain education in regional communities.</p>
          </div>
          <div className="cv-item">
            <div className="cv-item-header"><strong>Accountants OnChain</strong> — Community and knowledge-sharing project</div>
            <div className="cv-item-date">2022 · Digital Playhouse Foundation</div>
            <p>Australia's first community of crypto-curious accountants. Monthly webinars, Discord working groups, and in-person events. Brought together practitioners to collaboratively solve real-world crypto accounting problems. Seeded a generation of Bitcoin-literate Australian accountants.</p>
          </div>
          <div className="cv-item">
            <div className="cv-item-header"><strong>Stacks Australia</strong> — Chapter lead</div>
            <div className="cv-item-date">2022 · Stacks Open Internet Foundation</div>
            <p>Established the Australian and New Zealand chapter of Stacks — Bitcoin Layer 2 ecosystem. Onboarded developers, ran Bitcoin Builders meetups in Brisbane and Melbourne, and hosted the Nakamoto Upgrade launch event.</p>
          </div>
          <div className="cv-item">
            <div className="cv-item-header"><strong>Freo Neuhaus</strong> — Startup society seed node</div>
            <div className="cv-item-date">2025 — present · Fremantle, Western Australia</div>
            <p>Piloting a Network School-aligned startup society node in Fremantle, WA. Bringing together builders, accountants, and technologists to co-live and co-work on internet-first infrastructure in a port city with the cultural conditions for experiment.</p>
          </div>
        </div>

        <div className="cv-section">
          <h3>Professional Qualifications & Registrations</h3>
          <div className="cv-item">
            <ul>
              <li><strong>FIPA</strong> — Fellow, Institute of Public Accountants · 2011–present</li>
              <li><strong>CTA</strong> — Chartered Tax Adviser, The Tax Institute · 2011–present</li>
              <li><strong>FTIA</strong> — Fellow, The Tax Institute · 2007–present</li>
              <li><strong>GCPA</strong> — Global Certificate of Public Accountant, IPA · 2025</li>
              <li><strong>Registered Tax Agent</strong> — Tax Practitioners Board · 25+ years</li>
              <li><strong>Public Practice Certificate</strong> — Institute of Public Accountants</li>
              <li><strong>Member</strong> — Blockchain Australia / Digital Economy Council of Australia</li>
              <li><strong>Founding Member</strong> — Western Australian AI Hub · 2024</li>
            </ul>
          </div>
        </div>

        <div className="cv-section">
          <h3>Education</h3>
          <div className="cv-item">
            <ul>
              <li><strong>Master of International Taxation (MIntTax)</strong> — UNSW Australia</li>
              <li><strong>Advanced Diploma of Applied Blockchain</strong> — Blockchain Collective / TAFE Queensland · 2022</li>
              <li><strong>AGI Strategy</strong> — BlueDot Impact · 2026</li>
              <li><strong>Frontier AI Governance</strong> — BlueDot Impact, inaugural cohort · 2026</li>
              <li><strong>RMIT Blockchain</strong> — Blockchain Innovation Hub, RMIT · 2018</li>
              <li><strong>Bachelor of Business (Accounting)</strong> — undergraduate foundation</li>
            </ul>
          </div>
        </div>

        <div className="cv-section">
          <h3>Writing & Media</h3>
          <div className="cv-item">
            <ul>
              <li><strong>Forbes</strong> — Contributor. Bitcoin as monetary infrastructure and policy. Articles on Bitcoin vs generic cryptoassets (UK FCA), Lightning Network payments, Bitcoin ESG (2023–2025)</li>
              <li><strong>Cointelegraph</strong> — Contributor. Crypto accounting, Indigenous metaverse (Australian first), Stacks and Bitcoin L2s (2022–2023)</li>
              <li><strong>IPA Member Journal</strong> — Featured: "Web3: what is it and how will it transform accountancy?" Quoted on Bitcoin as distinct SMSF asset class</li>
              <li><strong>Xero Future Focus</strong> — Expert interview on crypto in small business accounting (2023)</li>
              <li><strong>Substack</strong> — blog.electrafrost.com. Long-form on separation of powers in the agentic economy, AI governance, CPD structural failure, tax determinism, network residency (2023–present)</li>
              <li><strong>Top 60 Web3 Crypto Accounting Thought Leaders</strong> — Cryptoworth, 2024</li>
            </ul>
          </div>
        </div>

        <div className="cv-section">
          <h3>Speaking & Events</h3>
          <div className="cv-item">
            <ul>
              <li><strong>International Conference on Thinking (ICOT)</strong> — Melbourne, 2024. "Bitcoin and Decentralisation: What Business Leaders Can't Afford to Ignore"</li>
              <li><strong>Token2049 / Network State Conference</strong> — Singapore, 2024</li>
              <li><strong>Bitcoin Nashville</strong> — Enterprise Digital Asset Summit (Bitwave), Bitcoin Builders Conference (Stacks), Bitcoin 2024 Conference. 2024</li>
              <li><strong>Singapore FinTech Festival</strong> — Digital Playhouse Foundation, 2024</li>
              <li><strong>Accounting & Business Show Asia</strong> — Singapore, 2024</li>
              <li><strong>Blockchain Week Australia</strong> — Tax panel, Education panel. 2022, 2023, 2024</li>
              <li><strong>Xerocon Sydney</strong> — Blockchain panel, 2022</li>
              <li><strong>Accounting & Business Expo (ABExpo)</strong> — Sydney and Melbourne. DeFi panel, Web3 tech stack, solo practice panel. Multiple years</li>
              <li><strong>IPA National Conference, Noosa</strong> — Crypto technologies and digital assets in SME accounting, 2023</li>
              <li><strong>Digital Economy & Tax Masterclass</strong> — DeFi Taxation presentation, Cadena Legal / DECA, 2024</li>
              <li><strong>Adopting Bitcoin</strong> — El Salvador (Lightning Summit), 2022</li>
              <li><strong>Network School</strong> — Web3 Accounting Essentials and International Tax workshops, 2024–present</li>
              <li><strong>IPA WA Fellows Lunch</strong> — Decentralised AI and Bitcoin for creative industries, 2024</li>
            </ul>
          </div>
        </div>

        <div className="cv-section">
          <h3>Podcasts & Interviews</h3>
          <div className="cv-item">
            <ul>
              <li>Web3 Weekly — Blockstars Technology (Blockchain & AI)</li>
              <li>Tax Debt Solutions Australia — "Move Over Brokers, Here Comes The Blockchain" (Ep. 6)</li>
              <li>Cloud Stories — Accounting Business Expo</li>
              <li>Crypto Accounting Academy — Accountant Quits (multiple)</li>
              <li>TDSA 5-in-5 — Bitcoin and Web3 for tax practitioners</li>
            </ul>
          </div>
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
