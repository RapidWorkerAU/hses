import QuotesListClient from "./QuotesListClient";
import DashboardLogoutLink from "@/app/sms-diagnostic/dashboard/DashboardLogoutLink";
import DashboardSessionText from "@/app/sms-diagnostic/dashboard/DashboardSessionText";
import BusinessAdminLink from "@/app/sms-diagnostic/dashboard/BusinessAdminLink";

export default function QuotesListPage() {
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
                <a className="dashboard-sidebar-link" href="/sms-diagnostic/dashboard">
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
                <BusinessAdminLink className="dashboard-sidebar-link is-active" />
                <DashboardLogoutLink className="dashboard-sidebar-link dashboard-sidebar-link--logout" />
              </div>
            </div>
          </aside>

          <section className="dashboard-section dashboard-main">
            <div className="diagnostic-container">
              <QuotesListClient />
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
