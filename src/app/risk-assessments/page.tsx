import type { Metadata } from "next";
import Link from "next/link";
import DashboardLogoutLink from "../sms-diagnostic/dashboard/DashboardLogoutLink";
import DashboardSessionText from "../sms-diagnostic/dashboard/DashboardSessionText";
import RiskAssessmentsListClient from "./RiskAssessmentsListClient";

export const metadata: Metadata = {
  title: "Risk Assessments",
};

export default function RiskAssessmentsPage() {
  return (
    <div className="diagnostic-body page-stack dashboard-portal dashboard-portal--business-admin dashboard-portal--no-sidebar system-maps-page">
      <header className="site-header">
        <div className="header-inner">
          <div className="header-left">
            <Link href="/">
              <img
                src="/images/logo-white.png"
                alt="HSES Industry Partners"
                className="header-logo"
              />
            </Link>
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
            <Link className="dashboard-back-link" href="/dashboard">
              <img src="/icons/back.svg" alt="" className="dashboard-back-icon" />
              <span>Back</span>
            </Link>
            <div className="dashboard-page-header dashboard-page-header--flush">
              <h1>Risk Assessments</h1>
              <p className="dashboard-page-helper">
                View and manage risk assessments associated with your account.
              </p>
            </div>
            <RiskAssessmentsListClient />
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <span className="footer-copy">&copy; 2025 HSES Industry Partners</span>
          <div className="footer-links">
            <Link className="footer-link" href="/privacy">
              Privacy Policy
            </Link>
            <Link className="footer-link" href="/disclaimer">
              Website Disclaimer
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
