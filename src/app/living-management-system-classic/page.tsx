import type { Metadata } from "next";
import Script from "next/script";
import "../pcd-system.css";

export const metadata: Metadata = {
  title: "Living Management System (Classic)",
  description:
    "Classic layout for the Living Management System learning tool.",
};

export default function LivingManagementSystemClassicPage() {
  return (
    <div className="pcd-system learning-page">
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

      <main id="main" className="learning-shell">
        <section className="learning-topbar">
          <div className="topbar-left">
            <h1>Living Management System</h1>
            <p>
              Follow a defensible WA WHS management system aligned to the WA WHS
              Act and either the general WHS Regulations 2022 or the WHS (Mines)
              Regulations 2022, with structure that supports ISO 45001 intent
              without copying its format.
            </p>
          </div>
          <div className="topbar-controls">
            <div className="control">
              <label htmlFor="roleSelect">Operating context</label>
              <select id="roleSelect"></select>
            </div>
            <div className="control">
              <label htmlFor="regulationSelect">Regulation set</label>
              <select id="regulationSelect"></select>
            </div>
            <div className="control">
              <label htmlFor="journeySelect">Journeys</label>
              <select id="journeySelect"></select>
            </div>
          </div>
        </section>

        <section className="learning-body stacked">
          <div className="journey-map full">
            <div className="journey-head">
              <span className="pill">Journey Map</span>
              <span id="journeySummary" className="journey-summary"></span>
            </div>
            <p id="journeyIntent" className="journey-intent"></p>
            <p className="journey-note">
              Journey selection sets the map order and the walkthrough path.
            </p>
            <div id="mapTrack" className="map-track"></div>
            <div className="map-legend">
              <span className="legend-chip upstream">Feeds into this step</span>
              <span className="legend-chip downstream">Flows to next steps</span>
              <span className="legend-chip feedback">Learning loop</span>
            </div>
          </div>

          <section className="detail-full">
            <div className="detail-header">
              <div>
                <p className="panel-tag">Selected step</p>
                <h2 id="stepTitle"></h2>
                <p id="stepPurpose" className="panel-purpose"></p>
              </div>
              <div className="panel-actions">
                <button id="prevStep" className="button outline small" type="button">
                  Back
                </button>
                <button id="nextStep" className="button small" type="button">
                  Next
                </button>
                <button id="copyChecklist" className="button small" type="button">
                  Copy checklist
                </button>
              </div>
            </div>

            <div className="detail-tabs">
              <div className="tab-list" role="tablist" aria-label="Step information">
                <button className="tab-button is-active" data-tab="actions" type="button">
                  Required actions
                </button>
                <button className="tab-button" data-tab="io" type="button">
                  Inputs &amp; Outputs
                </button>
                <button className="tab-button" data-tab="evidence" type="button">
                  Proof / Evidence
                </button>
                <button className="tab-button" data-tab="defensible" type="button">
                  Minimum defensible detail
                </button>
                <button className="tab-button" data-tab="docs" type="button">
                  Documents &amp; Tools
                </button>
                <button className="tab-button" data-tab="references" type="button">
                  References
                </button>
                <button className="tab-button" data-tab="influences" type="button">
                  Influences
                </button>
                <button className="tab-button" data-tab="triggers" type="button">
                  Update triggers
                </button>
              </div>

              <div className="tab-panels">
                <div className="tab-panel is-active tone-core" data-panel="actions">
                  <h3>Required actions</h3>
                  <ul id="stepActions"></ul>
                </div>
                <div className="tab-panel tone-io" data-panel="io">
                  <div className="io-grid">
                    <div className="io-card tone-inputs">
                      <h3>Inputs</h3>
                      <ul id="stepInputs"></ul>
                    </div>
                    <div className="io-card tone-outputs">
                      <h3>Outputs</h3>
                      <ul id="stepOutputs"></ul>
                    </div>
                  </div>
                  <div className="io-related tone-links">
                    <h3>Related steps</h3>
                    <div className="link-grid">
                      <div>
                        <h4>Feeds into this step</h4>
                        <p className="link-help">
                          These steps supply the inputs used here.
                        </p>
                        <ul id="stepUpstream"></ul>
                      </div>
                      <div>
                        <h4>Flows to next steps</h4>
                        <p className="link-help">
                          These steps use the outputs created here.
                        </p>
                        <ul id="stepDownstream"></ul>
                      </div>
                      <div>
                        <h4>Learning loop</h4>
                        <p className="link-help">
                          These steps feed learning back to earlier parts of the
                          system.
                        </p>
                        <ul id="stepFeedback"></ul>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="tab-panel tone-proof" data-panel="evidence">
                  <h3>Proof / Evidence</h3>
                  <ul id="stepEvidence"></ul>
                </div>
                <div className="tab-panel tone-defensible" data-panel="defensible">
                  <h3>Minimum defensible detail</h3>
                  <ul id="stepDefensible"></ul>
                </div>
                <div className="tab-panel tone-docs" data-panel="docs">
                  <h3>Documents &amp; Tools</h3>
                  <div id="stepDocs" className="chip-list"></div>
                </div>
                <div className="tab-panel tone-references" data-panel="references">
                  <h3>References</h3>
                  <ul id="stepReferences"></ul>
                </div>
                <div
                  className="tab-panel tone-influences"
                  data-panel="influences"
                  id="influencesSection"
                >
                  <h3>Influences</h3>
                  <ul id="stepInfluences"></ul>
                </div>
                <div
                  className="tab-panel tone-triggers"
                  data-panel="triggers"
                  id="triggersSection"
                >
                  <h3>Update triggers</h3>
                  <ul id="stepTriggers"></ul>
                </div>
              </div>
            </div>
          </section>
        </section>
      </main>

      <Script src="/scripts/learning-tool.js" strategy="afterInteractive" />
    </div>
  );
}
