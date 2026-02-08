import type { Metadata } from "next";
import DashboardLogoutLink from "./DashboardLogoutLink";
import DashboardSessionText from "./DashboardSessionText";
import BusinessAdminLink from "./BusinessAdminLink";

export const metadata: Metadata = {
  title: "Diagnostic Dashboard",
};

export default function DiagnosticDashboardPage() {
  return (
    <div className="diagnostic-body page-stack dashboard-portal">
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
            <div className="dashboard-session">
              <DashboardSessionText />
            </div>
          </div>
        </div>
      </header>

      <main>
        <div className="dashboard-shell">
          <aside className="dashboard-sidebar" aria-label="Dashboard navigation">
            <div className="dashboard-sidebar-inner">
              <div className="dashboard-sidebar-title">Client portal</div>
              <nav className="dashboard-sidebar-nav">
                <a className="dashboard-sidebar-link is-active" href="/sms-diagnostic/dashboard">
                  Overview
                </a>
                <a className="dashboard-sidebar-link" href="/sms-diagnostic/dashboard/diagnostics">
                  Diagnostics
                </a>
                <a className="dashboard-sidebar-link" href="/sms-diagnostic/dashboard/codes">
                  Code register
                </a>
                <a className="dashboard-sidebar-link" href="/sms-diagnostic/access">
                  Access landing
                </a>
              </nav>
              <div className="dashboard-sidebar-footer">
                <BusinessAdminLink className="dashboard-sidebar-link" />
                <DashboardLogoutLink className="dashboard-sidebar-link dashboard-sidebar-link--logout" />
              </div>
            </div>
          </aside>
          <section className="diagnostic-hero diagnostic-purchase-hero dashboard-main">
            <div className="diagnostic-container diagnostic-purchase-layout">
              <div className="diagnostic-purchase-intro">
                <div className="dashboard-page-header dashboard-page-header--flush">
                  <img
                    src="/images/SELF-Original-Logo.png"
                    alt="Safety Energy Loop Framework logo"
                    className="dashboard-page-logo"
                  />
                  <h1>Your diagnostic dashboard</h1>
                  <p className="dashboard-page-helper">
                    Launch diagnostics, track participation, and review results aligned
                    to the Safety Energy Loop Framework.
                  </p>
                </div>
                <div className="diagnostic-summary-card">
                  <h3>What you can do here</h3>
                  <ul>
                    <li>Launch your diagnostic and issue participant access codes.</li>
                    <li>Track participation across teams and modules.</li>
                    <li>Review insights and export results for action planning.</li>
                  </ul>
                </div>
                <div className="dashboard-quick-nav">
                  <a className="dashboard-quick-card" href="/sms-diagnostic/dashboard/diagnostics">
                    <h4>Your diagnostics</h4>
                    <p>View diagnostics you have purchased and drill into details.</p>
                    <span className="dashboard-quick-link">Open diagnostics</span>
                  </a>
                  <a className="dashboard-quick-card" href="/sms-diagnostic/dashboard/codes">
                    <h4>All access codes</h4>
                    <p>See every code issued to you across diagnostics and domains.</p>
                    <span className="dashboard-quick-link">View code table</span>
                  </a>
                </div>
              </div>
              <div className="diagnostic-purchase-spacer" aria-hidden="true"></div>
            </div>
          </section>
        </div>
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
