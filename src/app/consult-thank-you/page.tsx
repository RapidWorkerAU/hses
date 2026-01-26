import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Request Sent",
};

export default function ConsultThankYouPage() {
  return (
    <div className="page-stack no-radius">
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
            <a className="btn btn-primary" href="/">
              Back to site
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="section">
          <div className="container">
            <div className="form-panel">
              <h1>Thanks, we received your request.</h1>
              <p>We respond within 48 hours to confirm next steps.</p>
              <div className="hero-ctas">
                <a className="btn btn-primary" href="/">
                  Return to the homepage
                </a>
              </div>
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
          <button
            className="footer-menu-toggle"
            type="button"
            aria-label="Open footer menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <div className="footer-menu">
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


