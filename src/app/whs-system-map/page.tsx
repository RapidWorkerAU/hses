import type { Metadata } from "next";
import Script from "next/script";
import "../pcd-system.css";

export const metadata: Metadata = {
  title: "WHS System Architecture",
  description:
    "Three-layer safety system architecture map showing system logic, data flow, and documents/tools.",
};

export default function WhsSystemMapPage() {
  return (
    <div className="pcd-system map-page">
      <a className="skip-link" href="#main">Skip to content</a>

      <header className="site-header">
        <div className="container header-inner">
          <a href="/">
            <img
              className="logo"
              src="/images/logo-black.png"
              alt="HSES Industry Partners"
            />
          </a>
          <nav className="nav">
            <a href="/self-framework">SELF Framework</a>
            <a href="/living-management-system">Living System</a>
            <a href="/whs-system-map">WHS System Map</a>
            <a href="/login">Client Portal</a>
          </nav>
        </div>
      </header>

      <main id="main">
        <section className="map-hero">
          <div className="container">
            <p className="eyebrow">WHS system architecture</p>
            <h1>Integrated Health &amp; Safety Management System</h1>
            <p className="lead">
              Three-layer architecture: system logic (top), data flow (middle),
              documents &amp; tools (bottom). No crossing arrows and no overlapping
              text.
            </p>
            <div className="map-hero-actions">
              <a className="button outline small" href="/living-management-system">
                Open the living management system
              </a>
            </div>
          </div>
        </section>

        <section className="map-section full-bleed">
          <div className="flow-map">
            <div className="map-scroll">
              <svg
                viewBox="0 0 2400 1400"
                role="img"
                aria-label="WHS safety system data architecture map"
              >
                <defs>
                  <marker
                    id="arrow"
                    markerWidth="10"
                    markerHeight="10"
                    refX="8"
                    refY="5"
                    orient="auto"
                  >
                    <path d="M0,0 L10,5 L0,10 z" fill="#111111" />
                  </marker>
                  <marker
                    id="arrow-strong"
                    markerWidth="12"
                    markerHeight="12"
                    refX="9"
                    refY="6"
                    orient="auto"
                  >
                    <path d="M0,0 L12,6 L0,12 z" fill="#0b4f6c" />
                  </marker>
                </defs>

                <rect className="band band-logic" x="30" y="30" width="2340" height="210" rx="12" />
                <rect className="band band-data" x="30" y="280" width="2340" height="220" rx="12" />
                <rect className="band band-docs" x="30" y="550" width="2340" height="800" rx="12" />

                <text className="band-title" x="60" y="70">SYSTEM LOGIC</text>
                <text className="band-title" x="60" y="320">DATA FLOW</text>
                <text className="band-title" x="60" y="590">DOCUMENTS &amp; TOOLS</text>

                <g className="logic">
                  <g className="logic-point" data-keys="dangers">
                    <rect className="logic-box" x="60" y="100" width="330" height="110" rx="10" />
                    <text className="logic-title" x="80" y="165">Legal &amp; System Design</text>
                  </g>
                  <g className="logic-point" data-keys="risk">
                    <rect className="logic-box" x="420" y="100" width="330" height="110" rx="10" />
                    <text className="logic-title" x="440" y="165">Risk Definition</text>
                  </g>
                  <g className="logic-point" data-keys="steps">
                    <rect className="logic-box" x="780" y="100" width="330" height="110" rx="10" />
                    <text className="logic-title" x="800" y="165">Operational Control</text>
                  </g>
                  <g className="logic-point" data-keys="checks">
                    <rect className="logic-box" x="1140" y="100" width="330" height="110" rx="10" />
                    <text className="logic-title" x="1160" y="165">Field Verification</text>
                  </g>
                  <g className="logic-point" data-keys="findings,lessons">
                    <rect className="logic-box" x="1500" y="100" width="330" height="110" rx="10" />
                    <text className="logic-title" x="1520" y="165">Assurance</text>
                  </g>
                  <g className="logic-point" data-keys="decisions">
                    <rect className="logic-box" x="1860" y="100" width="330" height="110" rx="10" />
                    <text className="logic-title" x="1880" y="165">Improvement</text>
                  </g>
                </g>

                <g className="logic-connector">
                  <line className="logic-link" data-key="dangers" x1="225" y1="210" x2="225" y2="325" />
                  <line className="logic-link" data-key="risk" x1="585" y1="210" x2="585" y2="325" />
                  <line className="logic-link" data-key="steps" x1="945" y1="210" x2="945" y2="325" />
                  <line className="logic-link" data-key="checks" x1="1305" y1="210" x2="1305" y2="325" />
                  <line className="logic-link" data-key="findings" x1="1665" y1="210" x2="1665" y2="325" />
                  <line className="logic-link" data-key="decisions" x1="2025" y1="210" x2="2025" y2="325" />
                </g>

                <g className="data-flow">
                  <g className="data-point" data-key="dangers">
                    <circle className="data-node" cx="225" cy="385" r="24" />
                    <text className="data-label" x="225" y="430">
                      <tspan x="225" y="430">The dangers we know</tspan>
                      <tspan x="225" y="444">exist in drilling work</tspan>
                    </text>
                  </g>
                  <g className="data-point" data-key="risk">
                    <circle className="data-node" cx="585" cy="385" r="24" />
                    <text className="data-label" x="585" y="430">
                      <tspan x="585" y="430">How risky each drilling</tspan>
                      <tspan x="585" y="444">task is because of</tspan>
                      <tspan x="585" y="458">those dangers</tspan>
                    </text>
                  </g>
                  <g className="data-point" data-key="steps">
                    <circle className="data-node" cx="945" cy="385" r="24" />
                    <text className="data-label" x="945" y="430">
                      <tspan x="945" y="430">The exact safe work steps</tspan>
                      <tspan x="945" y="444">we create because of that risk</tspan>
                    </text>
                  </g>
                  <g className="data-point" data-key="checks">
                    <circle className="data-node" cx="1305" cy="385" r="24" />
                    <text className="data-label" x="1305" y="430">
                      <tspan x="1305" y="430">The critical things workers</tspan>
                      <tspan x="1305" y="444">must check every day</tspan>
                    </text>
                  </g>
                  <g className="data-point" data-key="findings">
                    <circle className="data-node" cx="1665" cy="385" r="24" />
                    <text className="data-label" x="1665" y="430">
                      <tspan x="1665" y="430">What workers and supervisors</tspan>
                      <tspan x="1665" y="444">actually find</tspan>
                      <tspan x="1665" y="458">in the field</tspan>
                    </text>
                  </g>
                  <g className="data-point" data-key="lessons">
                    <circle className="data-node" cx="1845" cy="385" r="24" />
                    <text className="data-label" x="1845" y="430">
                      <tspan x="1845" y="430">What incidents, mistakes</tspan>
                      <tspan x="1845" y="444">and exposure results</tspan>
                      <tspan x="1845" y="458">teach us</tspan>
                    </text>
                  </g>
                  <g className="data-point" data-key="decisions">
                    <circle className="data-node" cx="2025" cy="385" r="24" />
                    <text className="data-label" x="2025" y="430">
                      <tspan x="2025" y="430">The decisions leaders make</tspan>
                      <tspan x="2025" y="444">to change hazards, risks</tspan>
                      <tspan x="2025" y="458">and procedures</tspan>
                    </text>
                  </g>

                  <line className="data-arrow" data-key="risk" x1="249" y1="385" x2="561" y2="385" />
                  <line className="data-arrow" data-key="steps" x1="609" y1="385" x2="921" y2="385" />
                  <line className="data-arrow" data-key="checks" x1="969" y1="385" x2="1281" y2="385" />
                  <line className="data-arrow" data-key="findings" x1="1329" y1="385" x2="1641" y2="385" />
                  <line className="data-arrow" data-key="lessons" x1="1689" y1="385" x2="1821" y2="385" />
                  <line className="data-arrow" data-key="decisions" x1="1869" y1="385" x2="2001" y2="385" />

                  <path
                    className="data-loop"
                    data-keys="dangers,risk,steps,checks,findings,lessons,decisions"
                    d="M2025 415 L2025 325 L225 325 L225 415"
                  />

                  <text className="data-arrow-label" data-key="risk" x="405" y="362">
                    Dangers drive risk
                  </text>
                  <text className="data-arrow-label" data-key="steps" x="765" y="362">
                    Risk drives safe steps
                  </text>
                  <text className="data-arrow-label" data-key="checks" x="1125" y="362">
                    Steps drive daily checks
                  </text>
                  <text className="data-arrow-label" data-key="findings" x="1485" y="362">
                    Checks create field findings
                  </text>
                  <text className="data-arrow-label" data-key="lessons" x="1755" y="362">
                    Field findings create lessons
                  </text>
                  <text className="data-arrow-label" data-key="decisions" x="1935" y="362">
                    Lessons drive decisions
                  </text>

                  <text
                    className="data-loop-label"
                    data-keys="dangers,risk,steps,checks,findings,lessons,decisions"
                    x="1125"
                    y="305"
                  >
                    Decisions update dangers, risks and procedures
                  </text>
                </g>

                <g className="docs">
                  <g className="doc-item" data-keys="dangers">
                    <rect className="doc-box" x="60" y="640" width="330" height="70" rx="8" />
                    <text className="doc-title" x="80" y="682">N1 Legal Duties &amp; System Map</text>
                  </g>
                  <g className="doc-item" data-keys="dangers">
                    <rect className="doc-box" x="60" y="730" width="330" height="70" rx="8" />
                    <text className="doc-title" x="80" y="772">N2 HSE Manual (MSMS)</text>
                  </g>

                  <g className="doc-item" data-keys="risk">
                    <rect className="doc-box" x="420" y="640" width="330" height="70" rx="8" />
                    <text className="doc-title" x="440" y="682">N3 Risk Management Procedure</text>
                  </g>
                  <g className="doc-item" data-keys="dangers">
                    <rect className="doc-box" x="420" y="730" width="330" height="70" rx="8" />
                    <text className="doc-title" x="440" y="772">N4 Hazard Register &amp; Critical Controls</text>
                  </g>
                  <g className="doc-item" data-keys="risk">
                    <rect className="doc-box" x="420" y="820" width="330" height="70" rx="8" />
                    <text className="doc-title" x="440" y="862">N5 Activity Risk Registers</text>
                  </g>
                  <g className="doc-item" data-keys="risk">
                    <rect className="doc-box" x="420" y="910" width="330" height="70" rx="8" />
                    <text className="doc-title" x="440" y="952">N6 Principal Mining Hazard Plans</text>
                  </g>

                  <g className="doc-item" data-keys="steps">
                    <rect className="doc-box" x="780" y="640" width="330" height="70" rx="8" />
                    <text className="doc-title" x="800" y="682">N7 Work Procedures</text>
                  </g>
                  <g className="doc-item" data-keys="steps">
                    <rect className="doc-box" x="780" y="730" width="330" height="70" rx="8" />
                    <text className="doc-title" x="800" y="772">N9 Training &amp; Competency Matrix</text>
                  </g>
                  <g className="doc-item" data-keys="steps">
                    <rect className="doc-box" x="780" y="820" width="330" height="70" rx="8" />
                    <text className="doc-title" x="800" y="862">N10 Client &amp; Contractor Interface</text>
                  </g>
                  <g className="doc-item" data-keys="steps">
                    <rect className="doc-box" x="780" y="910" width="330" height="70" rx="8" />
                    <text className="doc-title" x="800" y="952">N14 Emergency Plan</text>
                  </g>
                  <g className="doc-item" data-keys="checks">
                    <rect className="doc-box" x="780" y="1000" width="330" height="70" rx="8" />
                    <text className="doc-title" x="800" y="1042">N15 Document Control System</text>
                  </g>
                  <g className="doc-item" data-keys="checks">
                    <rect className="doc-box" x="780" y="1090" width="330" height="70" rx="8" />
                    <text className="doc-title" x="800" y="1132">N17 Training &amp; Rollout</text>
                  </g>

                  <g className="doc-item" data-keys="checks">
                    <rect className="doc-box" x="1140" y="640" width="330" height="70" rx="8" />
                    <text className="doc-title" x="1160" y="682">N8 Field Tools (Prestart, Take 5)</text>
                  </g>
                  <g className="doc-item" data-keys="findings">
                    <rect className="doc-box" x="1140" y="730" width="330" height="70" rx="8" />
                    <text className="doc-title" x="1160" y="772">N16 Digital Forms &amp; Records</text>
                  </g>

                  <g className="doc-item" data-keys="findings">
                    <rect className="doc-box" x="1500" y="640" width="330" height="70" rx="8" />
                    <text className="doc-title" x="1520" y="682">N11 Inspection &amp; Audit Plan</text>
                  </g>
                  <g className="doc-item" data-keys="lessons">
                    <rect className="doc-box" x="1500" y="730" width="330" height="70" rx="8" />
                    <text className="doc-title" x="1520" y="772">N12 Incident Management</text>
                  </g>
                  <g className="doc-item" data-keys="lessons">
                    <rect className="doc-box" x="1500" y="820" width="330" height="70" rx="8" />
                    <text className="doc-title" x="1520" y="862">N13 Health Monitoring Plan</text>
                  </g>

                  <g className="doc-item" data-keys="decisions">
                    <rect className="doc-box" x="1860" y="640" width="330" height="70" rx="8" />
                    <text className="doc-title" x="1880" y="682">N18 Internal Audit</text>
                  </g>
                  <g className="doc-item" data-keys="decisions">
                    <rect className="doc-box" x="1860" y="730" width="330" height="70" rx="8" />
                    <text className="doc-title" x="1880" y="772">N19 Management Review</text>
                  </g>

                  <line className="connector-create" data-key="dangers" x1="225" y1="415" x2="225" y2="640" />
                  <line className="connector-create" data-key="risk" x1="585" y1="415" x2="585" y2="640" />
                  <line className="connector-create" data-key="steps" x1="945" y1="415" x2="945" y2="640" />
                  <line className="connector-create" data-key="checks" x1="1305" y1="415" x2="1305" y2="640" />
                  <line className="connector-create" data-key="findings" x1="1665" y1="415" x2="1665" y2="640" />
                  <line className="connector-create" data-key="lessons" x1="1845" y1="415" x2="1845" y2="640" />
                  <line className="connector-create" data-key="decisions" x1="2025" y1="415" x2="2025" y2="640" />

                  <line className="connector-use" data-key="dangers" x1="225" y1="820" x2="225" y2="415" />
                  <line className="connector-use" data-key="risk" x1="585" y1="910" x2="585" y2="415" />
                  <line className="connector-use" data-key="steps" x1="945" y1="1000" x2="945" y2="415" />
                  <line className="connector-use" data-key="checks" x1="1305" y1="730" x2="1305" y2="415" />
                  <line className="connector-use" data-key="findings" x1="1665" y1="820" x2="1665" y2="415" />
                  <line className="connector-use" data-key="lessons" x1="1845" y1="820" x2="1845" y2="415" />
                  <line className="connector-use" data-key="decisions" x1="2025" y1="730" x2="2025" y2="415" />
                </g>
              </svg>
            </div>
            <p className="map-footnote">
              System logic at the top, data flow in the middle, documents and tools below. Hover
              a node to highlight related elements; click a data node to lock focus, click the
              background to reset.
            </p>
          </div>
        </section>
      </main>

      <Script src="/scripts/system-map.js" strategy="afterInteractive" />
    </div>
  );
}
