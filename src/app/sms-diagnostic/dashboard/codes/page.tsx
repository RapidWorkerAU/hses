import type { Metadata } from "next";
import CodesRegisterClient from "./CodesRegisterClient";
import DashboardLogoutLink from "../DashboardLogoutLink";
import DashboardSessionText from "../DashboardSessionText";

export const metadata: Metadata = {
  title: "Diagnostic Code Register",
};

export default function CodesRegisterPage() {
  return (
    <div className="diagnostic-body page-stack dashboard-portal">
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
                <DashboardSessionText />
              </div>
              <DashboardLogoutLink className="btn btn-outline btn-small" />
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
                <a className="dashboard-sidebar-link" href="/dashboard/diagnostics">
                  Diagnostics
                </a>
                <a className="dashboard-sidebar-link is-active" href="/dashboard/codes">
                  Code register
                </a>
                <a className="dashboard-sidebar-link" href="/sms-diagnostic/access">
                  Access landing
                </a>
              </nav>
            </div>
          </aside>

          <section className="dashboard-section dashboard-main">
            <div className="diagnostic-container">
              <div className="dashboard-page-header">
                <img
                  src="/images/SELF-Original-Logo.png"
                  alt="Safety Energy Loop Framework logo"
                  className="dashboard-page-logo"
                />
                <h1>Code register</h1>
                <p className="dashboard-page-helper">
                  A complete table of every diagnostic code issued to your account,
                  across domains, modules, and diagnostics.
                </p>
              </div>
              <CodesRegisterClient />
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
