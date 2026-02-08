import type { Metadata } from "next";
import CodesRegisterClient from "./CodesRegisterClient";
import DashboardLogoutLink from "../DashboardLogoutLink";
import DashboardSessionText from "../DashboardSessionText";
import BusinessAdminLink from "../BusinessAdminLink";

export const metadata: Metadata = {
  title: "Diagnostic Code Register",
};

const codes = [
  {
    code: "GC-4471",
    diagnostic: "Governance Core Diagnostic",
    domain: "Governance Core",
    module: "1.1 Leadership & Governance",
    assignedTo: "J. Nguyen",
    assignedEmail: "j.nguyen@client.com",
    issuedAt: "18 Jan 2026",
    status: "Redeemed",
    redeemedAt: "20 Jan 2026",
  },
  {
    code: "GC-4472",
    diagnostic: "Governance Core Diagnostic",
    domain: "Governance Core",
    module: "1.2 Decision Rights & Structure",
    assignedTo: "M. Patel",
    assignedEmail: "m.patel@client.com",
    issuedAt: "18 Jan 2026",
    status: "Assigned",
    redeemedAt: "—",
  },
  {
    code: "GC-4473",
    diagnostic: "Governance Core Diagnostic",
    domain: "Governance Core",
    module: "1.3 Legal & Risk",
    assignedTo: "—",
    assignedEmail: "—",
    issuedAt: "19 Jan 2026",
    status: "Unassigned",
    redeemedAt: "—",
  },
  {
    code: "RB-8121",
    diagnostic: "Risk Backbone Diagnostic",
    domain: "Risk Backbone",
    module: "2.1 Hazard Identification",
    assignedTo: "S. Harper",
    assignedEmail: "s.harper@client.com",
    issuedAt: "10 Jan 2026",
    status: "Redeemed",
    redeemedAt: "12 Jan 2026",
  },
  {
    code: "RB-8123",
    diagnostic: "Risk Backbone Diagnostic",
    domain: "Risk Backbone",
    module: "2.3 Controls (Critical & Standard)",
    assignedTo: "T. Wallace",
    assignedEmail: "t.wallace@client.com",
    issuedAt: "11 Jan 2026",
    status: "Assigned",
    redeemedAt: "—",
  },
  {
    code: "DE-1902",
    diagnostic: "Delivery Engine Diagnostic",
    domain: "Delivery Engine",
    module: "3.2 Competence & Training",
    assignedTo: "L. Baxter",
    assignedEmail: "l.baxter@client.com",
    issuedAt: "04 Jan 2026",
    status: "Redeemed",
    redeemedAt: "09 Jan 2026",
  },
];

export default function CodesRegisterPage() {
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
                <a className="dashboard-sidebar-link is-active" href="/sms-diagnostic/dashboard/codes">
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
