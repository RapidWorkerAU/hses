import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Set Your Password",
};

export default function SetPasswordPage() {
  return (
    <div className="diagnostic-body page-stack">
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
        </div>
      </header>

      <main>
        <section className="diagnostic-hero diagnostic-purchase-hero">
          <div className="diagnostic-container diagnostic-purchase-layout">
            <div className="diagnostic-purchase-intro">
              <p className="diagnostic-kicker">Set your password</p>
              <img
                src="/images/SELF-Original-Logo.png"
                alt="Safety Energy Loop Framework logo"
                className="diagnostic-self-logo"
              />
              <h1>Finish setting up your diagnostic account.</h1>
              <p className="diagnostic-lede">
                Your invite link has authenticated your account. Set your
                password to access the diagnostic dashboard.
              </p>
              <div className="diagnostic-summary-card">
                <h3>Next step</h3>
                <p className="diagnostic-panel-note">
                  If you are not prompted automatically, you can proceed to the
                  dashboard and set your password in account settings.
                </p>
              </div>
              <div className="diagnostic-cta diagnostic-cta-spaced">
                <a className="btn btn-primary" href="/sms-diagnostic/dashboard">
                  Go to dashboard
                </a>
              </div>
            </div>
            <div className="diagnostic-purchase-spacer" aria-hidden="true"></div>
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
