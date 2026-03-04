import "../quote-builder.css";
import QuoteBuilderClient from "../QuoteBuilderClient";
import DashboardSessionText from "@/app/sms-diagnostic/dashboard/DashboardSessionText";

export default async function QuoteBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="diagnostic-body page-stack dashboard-portal dashboard-portal--no-sidebar quote-builder dashboard-portal--quote-builder">
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

      <div className="mobile-blocked-message" role="status" aria-live="polite">
        Quote builder is not available on mobile. Please use a desktop device.
      </div>

      <main>
        <section className="dashboard-section dashboard-main">
          <div className="diagnostic-container">
            <QuoteBuilderClient quoteId={id} />
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

