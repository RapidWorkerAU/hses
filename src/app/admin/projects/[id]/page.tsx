import type { Metadata } from "next";
import DashboardSessionText from "@/app/sms-diagnostic/dashboard/DashboardSessionText";
import ProjectDetailClient from "../ProjectDetailClient";

export const metadata: Metadata = {
  title: "Project Schedule Builder",
};

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams?.id;
  return (
    <div className="diagnostic-body page-stack dashboard-portal dashboard-portal--no-sidebar dashboard-portal--admin-project-detail">
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
        <section className="dashboard-section dashboard-main">
          <div className="diagnostic-container">
            {id ? (
              <ProjectDetailClient projectId={id} />
            ) : (
              <div className="dashboard-panel">Missing project id.</div>
            )}
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

