import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Safety Management System Diagnostic",
};

export default function SmsDiagnosticPage() {
  return (
    <div className="diagnostic-body">
      <header className="site-header">
        <div className="header-inner">
          <div className="header-left">
            <a href="/">
              <img
                src="/images/logo-black.png"
                alt="HSES Industry Partners"
                className="header-logo"
              />
            </a>
          </div>
          <div className="header-actions">
            <button className="btn btn-primary js-open-modal" type="button">
              Book discovery call
            </button>
            <a className="btn btn-outline" href="/login">
              Client portal login
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="diagnostic-hero">
          <div className="diagnostic-container diagnostic-hero-inner">
            <div className="diagnostic-hero-copy">
              <p className="diagnostic-kicker">SELF-linked diagnostic</p>
              <img
                src="/images/SELF-Light-Logo.png"
                alt="Safety Energy Loop Framework logo"
                className="diagnostic-self-logo"
              />
              <h1>Safety Management System Diagnostic</h1>
              <p className="diagnostic-lede">
                A confidential, code-based diagnostic that lets employees speak
                honestly about the current state of your safety management
                system. Built on the Safety Energy Loop Framework&trade; to
                reveal how governance enables (or limits) human energy in the
                workplace.
              </p>
              <div className="diagnostic-price-row">
                <div className="diagnostic-price-card">
                  <span>Setup fee</span>
                  <strong>$495</strong>
                  <p>Launch, configuration, and governance mapping.</p>
                </div>
                <div className="diagnostic-price-card">
                  <span>Per participant</span>
                  <strong>$89</strong>
                  <p>Unique access codes for anonymous feedback.</p>
                </div>
              </div>
              <div className="diagnostic-cta">
                <a className="btn btn-primary" href="/sms-diagnostic/purchase">
                  Purchase diagnostic
                </a>
                <button className="btn btn-outline" type="button">
                  Talk through scope
                </button>
              </div>
              <p className="diagnostic-meta">
                Designed for safety teams, executive leadership, and board
                committees who need real insight, not polished survey scores.
              </p>
            </div>
            <div className="diagnostic-hero-visual">
              <img
                src="/images/sms-diagnostic-hero.png"
                alt="SMS diagnostic portal preview"
                className="diagnostic-hero-image"
              />
              <div className="diagnostic-badges">
                <div>
                  <span className="diagnostic-badge-title">Anonymous</span>
                  <span className="diagnostic-badge-text">
                    Honest narrative feedback, no attribution.
                  </span>
                </div>
                <div>
                  <span className="diagnostic-badge-title">Structured</span>
                  <span className="diagnostic-badge-text">
                    Insights mapped to governance themes.
                  </span>
                </div>
                <div>
                  <span className="diagnostic-badge-title">Actionable</span>
                  <span className="diagnostic-badge-text">
                    Prioritised actions, not just data.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="diagnostic-principle">
          <div className="diagnostic-container diagnostic-principle-grid">
            <div>
              <p className="diagnostic-eyebrow">Why this exists</p>
              <h2>
                Management systems should empower human energy, not drain it.
              </h2>
              <p>
                The Safety Management System Diagnostic is built on the SELF
                governance core so you can see how leadership intent, risk
                clarity, operational delivery, and learning loops show up for
                your people in the real world.
              </p>
              <p>
                This is not a generic survey. It is a system diagnostic designed
                to highlight where your governance architecture is enabling
                resilient, adaptive operations and where it is quietly blocking
                them.
              </p>
            </div>
            <img
              src="/images/diagnostic-graph.png"
              alt="Governance diagnostic graphic"
              className="diagnostic-principle-image"
            />
          </div>
        </section>

        <section className="diagnostic-themes" id="themes">
          <div className="diagnostic-container">
            <div className="diagnostic-section-header">
              <p className="diagnostic-eyebrow">Safety management system effectiveness themes</p>
              <h2>Insights are organised around the four SELF domains.</h2>
              <p>
                Each domain highlights where the system is strong, fragile, or
                missing, so leaders know exactly where to act.
              </p>
            </div>
            <div className="diagnostic-theme-grid">
              <article className="diagnostic-theme-card">
                <img src="/images/leadership-icon.png" alt="" />
                <h3>The Governance Core</h3>
                <p>Ownership, decision rights, and leadership intent.</p>
              </article>
              <article className="diagnostic-theme-card">
                <img src="/images/risk-icon.png" alt="" />
                <h3>The Risk Backbone</h3>
                <p>Hazard clarity, control effectiveness, and priorities.</p>
              </article>
              <article className="diagnostic-theme-card">
                <img src="/images/operations-icon.png" alt="" />
                <h3>The Delivery Engine</h3>
                <p>Work planning, competence, and frontline enablement.</p>
              </article>
              <article className="diagnostic-theme-card">
                <img src="/images/learning-icon.png" alt="" />
                <h3>The Learning Loop</h3>
                <p>Incident learning, assurance, and adaptive improvement.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="diagnostic-process" id="process">
          <div className="diagnostic-container diagnostic-process-grid">
            <div>
              <p className="diagnostic-eyebrow">How it works</p>
              <h2>Fast to launch, precise in what it reveals.</h2>
              <ol className="diagnostic-steps">
                <li>We set up your diagnostic and map it to your governance core.</li>
                <li>You receive unique access codes for a selected employee sample.</li>
                <li>Participants complete the diagnostic anonymously online.</li>
                <li>We analyse narrative feedback and system signals by theme.</li>
                <li>You receive clear insights, priority actions, and executive briefing notes.</li>
              </ol>
              <div className="diagnostic-actions">
                <a className="btn btn-primary" href="/sms-diagnostic/purchase">
                  Purchase diagnostic
                </a>
                <a className="btn btn-outline" href="#outputs">
                  See deliverables
                </a>
              </div>
            </div>
            <div className="diagnostic-process-panel">
              <h3>What participants experience</h3>
              <ul>
                <li>Anonymous commentary with narrative prompts.</li>
                <li>Confidence ratings across governance domains.</li>
                <li>Space to surface hidden friction and energy leaks.</li>
                <li>No login, no tracking, no manager visibility.</li>
              </ul>
              <div className="diagnostic-process-note">
                <strong>Note:</strong> Results are aggregated to protect privacy.
              </div>
            </div>
          </div>
        </section>

        <section className="diagnostic-outputs" id="outputs">
          <div className="diagnostic-container diagnostic-outputs-grid">
            <div>
              <p className="diagnostic-eyebrow">What you receive</p>
              <h2>Clear, board-ready insight tied directly to governance.</h2>
              <ul className="diagnostic-output-list">
                <li>Governance theme scorecards with narrative evidence.</li>
                <li>Heat map of system strengths, gaps, and friction points.</li>
                <li>Priority action plan and decision triggers.</li>
                <li>Executive summary and briefing notes for leaders.</li>
              </ul>
              <div className="diagnostic-output-actions">
                <a className="btn btn-primary" href="/sms-diagnostic/purchase">
                  Purchase diagnostic
                </a>
                <button className="btn btn-ghost" type="button">
                  Request sample output
                </button>
              </div>
            </div>
            <div className="image-placeholder diagnostic-output-image">
              Sample insights report placeholder
            </div>
          </div>
        </section>

        <section className="diagnostic-pricing" id="pricing">
          <div className="diagnostic-container diagnostic-pricing-inner">
            <div>
              <p className="diagnostic-eyebrow">Pricing</p>
              <h2>Simple, transparent access.</h2>
              <p>
                Purchase the diagnostic, select your participant cohort, and we
                do the heavy lifting. Designed to scale for safety, executive,
                and board-level oversight.
              </p>
            </div>
            <div className="diagnostic-pricing-card">
              <div className="diagnostic-pricing-header">
                <h3>Safety Management System Diagnostic</h3>
                <p>SELF-aligned governance diagnostic</p>
              </div>
              <div className="diagnostic-pricing-row">
                <span>Setup fee</span>
                <strong>$495</strong>
              </div>
              <div className="diagnostic-pricing-row">
                <span>Per participant</span>
                <strong>$89</strong>
              </div>
              <ul className="diagnostic-pricing-list">
                <li>Unique access codes for each participant.</li>
                <li>Anonymous narrative feedback.</li>
                <li>Governance theme insights + action plan.</li>
                <li>Executive-ready reporting.</li>
              </ul>
              <a className="btn btn-primary" href="/sms-diagnostic/purchase">
                Purchase diagnostic
              </a>
              <p className="diagnostic-pricing-note">
                Need a custom cohort size? We can tailor the scope.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <span className="footer-copy">&copy; 2025 HSES Industry Partners</span>
          <div className="footer-links">
            <a className="footer-link" href="/privacy">
              Privacy Policy
            </a>
            <a className="footer-link" href="/disclaimer">
              Website Disclaimer
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
