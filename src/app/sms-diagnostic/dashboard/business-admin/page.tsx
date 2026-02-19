import type { Metadata } from "next";
import BusinessAdminClient from "./BusinessAdminClient";
import DashboardLogoutLink from "../DashboardLogoutLink";
import DashboardSessionText from "../DashboardSessionText";

export const metadata: Metadata = {
  title: "Business Admin",
};

export default function BusinessAdminPage() {
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
            <a className="dashboard-back-link" href="/dashboard">
              <img src="/icons/back.svg" alt="" className="dashboard-back-icon" />
              <span>Back</span>
            </a>
            <div className="dashboard-page-header dashboard-page-header--flush">
              <h1 className="text-3xl font-semibold text-slate-900">Business Admin</h1>
              <p className="dashboard-page-helper">
                Administer proposals, quote acceptance, and internal client management workflows.
              </p>
            </div>
            <BusinessAdminClient />
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

