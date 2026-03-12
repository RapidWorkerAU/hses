import type { Metadata } from "next";
import Link from "next/link";
import DashboardLogoutLink from "../../sms-diagnostic/dashboard/DashboardLogoutLink";
import DashboardSessionText from "../../sms-diagnostic/dashboard/DashboardSessionText";
import RiskAssessmentBuilderClient from "../RiskAssessmentBuilderClient";

export const metadata: Metadata = {
  title: "Risk Assessment",
};

export default async function RiskAssessmentDetailPage({
  params,
}: {
  params: Promise<{ assessmentId: string }>;
}) {
  const { assessmentId } = await params;
  return (
    <div className="diagnostic-body page-stack dashboard-portal dashboard-portal--business-admin dashboard-portal--no-sidebar system-maps-page">
      <header className="site-header">
        <div className="header-inner">
          <div className="header-left">
            <Link href="/">
              <img src="/images/logo-white.png" alt="HSES Industry Partners" className="header-logo" />
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
            <Link className="dashboard-back-link" href="/risk-assessments">
              <img src="/icons/back.svg" alt="" className="dashboard-back-icon" />
              <span>Back</span>
            </Link>
            <div className="dashboard-page-header dashboard-page-header--flush">
              <h1>Risk Assessment Builder</h1>
              <p className="dashboard-page-helper">Edit assessment details and continue building risk records.</p>
            </div>
            <RiskAssessmentBuilderClient initialAssessmentId={assessmentId} />
          </div>
        </section>
      </main>
    </div>
  );
}
