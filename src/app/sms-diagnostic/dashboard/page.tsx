import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Diagnostic Dashboard",
};

export default function DiagnosticDashboardPage() {
  return (
    <div className="diagnostic-body page-stack">
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
            <a className="btn btn-outline" href="/sms-diagnostic">
              Back to diagnostic
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="diagnostic-hero diagnostic-purchase-hero">
          <div className="diagnostic-container diagnostic-purchase-layout">
            <div className="diagnostic-purchase-intro">
              <p className="diagnostic-kicker">Dashboard</p>
              <img
                src="/images/SELF-Original-Logo.png"
                alt="Safety Energy Loop Framework logo"
                className="diagnostic-self-logo"
              />
              <h1>Your diagnostic dashboard is being configured.</h1>
              <p className="diagnostic-lede">
                We are finalising your access codes and reporting workspace.
                You will be able to issue codes and track progress here.
              </p>
              <div className="diagnostic-summary-card">
                <h3>Coming next</h3>
                <ul>
                  <li>Issue participant access codes.</li>
                  <li>Track code redemption.</li>
                  <li>Review insights and export results.</li>
                </ul>
              </div>
            </div>
            <div className="diagnostic-purchase-spacer" aria-hidden="true"></div>
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
