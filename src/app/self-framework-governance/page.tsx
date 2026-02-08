import type { Metadata } from "next";
import Script from "next/script";
import "../self-governance.css";

export const metadata: Metadata = {
  title: "SELF Governance Domain",
  description:
    "Governance domain of the Safety Energy Loop Framework (SELF): intent, maturity, and defensible practice.",
};

export default function SelfGovernancePage() {
  return (
    <div className="self-governance">
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

      <main id="main" className="gov-shell">
        <section className="gov-hero">
          <div className="gov-hero-copy">
            <p className="gov-eyebrow">SELF Governance Domain</p>
            <h1>Make safety governance visible, defensible, and decisive.</h1>
            <p className="gov-lede">
              The Governance Core sets how safety decisions are made, owned, and
              verified. Use this lens to build a system, diagnose failure, or
              prove critical control oversight.
            </p>
            <div className="gov-hero-actions">
              <span className="gov-tag">Build</span>
              <span className="gov-tag">Diagnose</span>
              <span className="gov-tag">Audit readiness</span>
            </div>
          </div>
          <div className="gov-hero-panel">
            <h2>How to use this page</h2>
            <ol>
              <li>Select the maturity level that best matches reality.</li>
              <li>Compare the intent and criteria for each category.</li>
              <li>Note the evidence you must show to be defensible.</li>
            </ol>
          </div>
        </section>

        <section className="gov-ladder">
          <div className="gov-section-head gov-section-head--tight">
            <h2>Maturity ladder</h2>
            <p>
              Move from reactive compliance to resilient, risk-led governance.
            </p>
          </div>
          <div className="gov-ladder-grid">
            <article className="gov-ladder-card">
              <span className="gov-pill gov-pill--reactive">Reactive</span>
              <p>Fragmented ownership. Compliance driven. Decisions are slow or unclear.</p>
            </article>
            <article className="gov-ladder-card">
              <span className="gov-pill gov-pill--proactive">Proactive</span>
              <p>Defined roles and routines. Risk decisions are structured and traceable.</p>
            </article>
            <article className="gov-ladder-card">
              <span className="gov-pill gov-pill--resilient">Resilient</span>
              <p>Leadership owns safety. Risk decisions are embedded in operations.</p>
            </article>
          </div>
        </section>

          <section className="gov-journey">
            <div className="gov-section-head">
              <h2>Governance journey</h2>
              <p>
                Follow a step-by-step path to build strong governance or pressure-test
                it when something feels wrong.
              </p>
            </div>

            <div className="gov-controls">
              <div className="gov-control">
                <label htmlFor="govJourneySelect">Journey</label>
                <select id="govJourneySelect"></select>
              </div>
              <div className="gov-control">
                <span className="gov-summary-title">Journey intent</span>
                <p id="govJourneyIntent" className="gov-summary-text"></p>
              </div>
              <div className="gov-map gov-controls-map">
                <div id="govMapTrack" className="gov-map-track"></div>
                <div className="gov-legend">
                  <span className="gov-legend-chip upstream">Feeds into this step</span>
                  <span className="gov-legend-chip downstream">Flows to next steps</span>
                  <span className="gov-legend-chip feedback">Learning loop</span>
                </div>
              </div>
            </div>

          <section className="gov-detail">
            <div className="gov-detail-header">
              <div>
                <p className="gov-tagline">Selected step</p>
                <h3 id="govStepTitle"></h3>
                <p id="govStepPurpose" className="gov-step-purpose"></p>
              </div>
              <div className="gov-detail-actions">
                <button id="govPrevStep" className="gov-button outline" type="button">
                  Back
                </button>
                <button id="govNextStep" className="gov-button" type="button">
                  Next
                </button>
              </div>
              </div>

              <div className="gov-tabs" role="tablist" aria-label="Governance step information">
                <button className="gov-tab is-active" data-tab="actions" type="button">
                  Required actions
                </button>
              <button className="gov-tab" data-tab="io" type="button">
                Inputs &amp; Outputs
              </button>
              <button className="gov-tab" data-tab="evidence" type="button">
                Proof / Evidence
              </button>
              <button className="gov-tab" data-tab="defensible" type="button">
                Minimum defensible detail
                </button>
                <button className="gov-tab" data-tab="docs" type="button">
                  Documents &amp; Processes
                </button>
                <button className="gov-tab" data-tab="maturity" type="button">
                  Levels of maturity
                </button>
              </div>

            <div className="gov-tab-panels">
              <div className="gov-tab-panel is-active" data-panel="actions">
                <ul id="govStepActions"></ul>
              </div>
              <div className="gov-tab-panel" data-panel="io">
                <div className="gov-io-grid">
                  <div>
                    <p className="gov-kicker">Inputs</p>
                    <ul id="govStepInputs"></ul>
                  </div>
                  <div>
                    <p className="gov-kicker">Outputs</p>
                    <ul id="govStepOutputs"></ul>
                  </div>
                </div>
                <div className="gov-io-links">
                  <div>
                    <p className="gov-kicker">Feeds into</p>
                    <ul id="govStepUpstream"></ul>
                  </div>
                  <div>
                    <p className="gov-kicker">Flows to</p>
                    <ul id="govStepDownstream"></ul>
                  </div>
                  <div>
                    <p className="gov-kicker">Learning loop</p>
                    <ul id="govStepFeedback"></ul>
                  </div>
                </div>
              </div>
              <div className="gov-tab-panel" data-panel="evidence">
                <ul id="govStepEvidence"></ul>
              </div>
              <div className="gov-tab-panel" data-panel="defensible">
                <ul id="govStepDefensible"></ul>
              </div>
                <div className="gov-tab-panel" data-panel="docs">
                  <div id="govStepDocs" className="gov-chip-list"></div>
                </div>
                <div className="gov-tab-panel" data-panel="maturity">
                  <div className="gov-maturity-grid">
                    <div className="gov-maturity-card">
                      <span className="gov-pill gov-pill--reactive">Reactive</span>
                      <ul id="govStepMaturityReactiveList"></ul>
                    </div>
                    <div className="gov-maturity-card">
                      <span className="gov-pill gov-pill--proactive">Proactive</span>
                      <ul id="govStepMaturityProactiveList"></ul>
                    </div>
                    <div className="gov-maturity-card">
                      <span className="gov-pill gov-pill--resilient">Resilient</span>
                      <ul id="govStepMaturityResilientList"></ul>
                    </div>
                  </div>
                </div>
              </div>
            </section>
        </section>

      </main>
      <Script src="/scripts/self-governance-journey.js" strategy="afterInteractive" />
    </div>
  );
}
