import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout Success",
};

export default function CheckoutSuccessPage() {
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
          <div className="header-actions">
            <a className="btn btn-outline" href="/sms-diagnostic">
              Back to diagnostic
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="diagnostic-hero diagnostic-purchase-hero">
          <div className="diagnostic-container diagnostic-purchase-layout">
            <div className="diagnostic-purchase-intro">
              <p className="diagnostic-kicker">Payment received</p>
              <img
                src="/images/SELF-Original-Logo.png"
                alt="Safety Energy Loop Framework logo"
                className="diagnostic-self-logo"
              />
              <h1>Thank you. Your diagnostic is being set up.</h1>
              <p className="diagnostic-lede">
                A confirmation email is on its way to the diagnostic owner with
                temporary login details and next steps.
              </p>
            </div>
            <div className="diagnostic-purchase-spacer" aria-hidden="true"></div>
            <div className="diagnostic-cart-panel diagnostic-cart-panel--left">
              <div className="diagnostic-checkout-copy">
                <p className="diagnostic-eyebrow">Confirmation</p>
                <h2>Order submitted.</h2>
                <p>
                  Your payment has been received. The diagnostic owner will
                  receive instructions to access the dashboard shortly.
                </p>
              </div>
              <div className="diagnostic-cart">
                <div className="diagnostic-cart-row">
                  <div>
                    <strong>Status</strong>
                    <span className="diagnostic-cart-meta">
                      Payment successful
                    </span>
                  </div>
                  <div className="diagnostic-cart-qty">✓</div>
                  <div className="diagnostic-cart-price">Complete</div>
                </div>
                <div className="diagnostic-cart-total">
                  <span>Next step</span>
                  <strong>Check your email</strong>
                </div>
              </div>
            </div>
            <div className="diagnostic-purchase-details diagnostic-purchase-details--right">
              <div className="diagnostic-summary-card">
                <h3>What happens next</h3>
                <ol>
                  <li>Check your inbox for the confirmation email.</li>
                  <li>Log in to the diagnostic dashboard.</li>
                  <li>Issue participant access codes and launch.</li>
                </ol>
                <p className="diagnostic-panel-note">
                  If you need help, contact ask@hses.com.au.
                </p>
              </div>
              <div className="diagnostic-cta diagnostic-cta-spaced">
                <a className="btn btn-primary" href="/">
                  Back to home
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
        </div>
      </footer>
    </div>
  );
}
