import type { Metadata } from "next";
import DashboardLogoutLink from "../../DashboardLogoutLink";
import DashboardSessionText from "../../DashboardSessionText";

export const metadata: Metadata = {
  title: "Management System Design Dashboard",
};

export default function ManagementSystemDesignDashboardPage() {
  return (
    <div className="diagnostic-body page-stack dashboard-portal dashboard-portal--business-admin dashboard-portal--no-sidebar">
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
          <div className="diagnostic-container">
            <a className="dashboard-back-link" href="/dashboard/business-admin">
              <img src="/icons/back.svg" alt="" className="dashboard-back-icon" />
              <span>Back</span>
            </a>
            <div className="dashboard-page-header dashboard-page-header--flush">
              <h1>Management System Design Dashboard</h1>
              <p className="dashboard-page-helper">
                Placeholder page. Content for this dashboard will be added next.
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

