import type { Metadata } from "next";
import DashboardLogoutLink from "./DashboardLogoutLink";
import DashboardPortalTiles from "./DashboardPortalTiles";
import DashboardSessionText from "./DashboardSessionText";

export const metadata: Metadata = {
  title: "Portal Dashboard",
};

export default function DiagnosticDashboardPage() {
  return (
    <div className="diagnostic-body page-stack dashboard-portal dashboard-portal--no-sidebar">
      <header className="site-header">
        <div className="header-inner">
          <div className="header-left">
            <a href="/">
              <img
                src="/images/logo-white.png"
                alt="HSES Industry Partners"
                className="header-logo"
              />
            </a>
          </div>
          <div className="header-actions">
            <div className="dashboard-session-controls">
              <div className="dashboard-session">
                <DashboardSessionText showMenuButton={false} />
              </div>
              <DashboardLogoutLink className="btn btn-outline btn-small" />
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className="dashboard-section dashboard-main">
          <div className="diagnostic-container dashboard-home-container">
            <div className="dashboard-page-header dashboard-page-header--flush">
              <h1>What portal would you like to access today?</h1>
              <p className="dashboard-page-helper">
                HSES Industry Partners hosts many helpful tools &amp; resources for
                different clients. You wil be able to see which tools are available
                for your account below. Click on the tile to access.
              </p>
            </div>

            <DashboardPortalTiles />
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
