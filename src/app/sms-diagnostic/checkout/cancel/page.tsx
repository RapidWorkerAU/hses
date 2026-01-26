import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout Canceled",
};

export default function CheckoutCancelPage() {
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
            <a className="btn btn-outline" href="/sms-diagnostic/purchase">
              Return to cart
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="diagnostic-hero diagnostic-purchase-hero">
          <div className="diagnostic-container diagnostic-purchase-layout">
            <div className="diagnostic-purchase-intro">
              <p className="diagnostic-kicker">Checkout canceled</p>
              <img
                src="/images/SELF-Original-Logo.png"
                alt="Safety Energy Loop Framework logo"
                className="diagnostic-self-logo"
              />
              <h1>Your payment was not completed.</h1>
              <p className="diagnostic-lede">
                You can return to the cart to adjust quantities or try the
                payment again whenever you are ready.
              </p>
              <div className="diagnostic-summary-card">
                <h3>Need help?</h3>
                <p className="diagnostic-panel-note">
                  Contact ask@hses.com.au if you encountered any issues.
                </p>
              </div>
              <div className="diagnostic-cta">
                <a className="btn btn-primary" href="/sms-diagnostic/purchase">
                  Return to cart
                </a>
                <a className="btn btn-outline" href="/sms-diagnostic">
                  Back to diagnostic
                </a>
              </div>
            </div>
            <div className="diagnostic-purchase-spacer" aria-hidden="true"></div>
            <div className="diagnostic-cart-panel">
              <div className="diagnostic-checkout-copy">
                <p className="diagnostic-eyebrow">Payment status</p>
                <h2>No charge made.</h2>
                <p>
                  Your order has not been processed. You can safely retry the
                  payment from the cart at any time.
                </p>
              </div>
              <div className="diagnostic-cart">
                <div className="diagnostic-cart-row">
                  <div>
                    <strong>Status</strong>
                    <span className="diagnostic-cart-meta">
                      Checkout canceled
                    </span>
                  </div>
                  <div className="diagnostic-cart-qty">—</div>
                  <div className="diagnostic-cart-price">No charge</div>
                </div>
                <div className="diagnostic-cart-total">
                  <span>Next step</span>
                  <strong>Return to cart</strong>
                </div>
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
