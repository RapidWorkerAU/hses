import type { Metadata } from "next";
import PurchaseCheckoutClient from "./PurchaseCheckoutClient";

export const metadata: Metadata = {
  title: "Purchase Safety Management System Diagnostic",
};

export default function SmsDiagnosticPurchasePage() {
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
            <a className="btn btn-primary" href="/consult">
              Book discovery call
            </a>
            <a className="btn btn-outline" href="/login">
              Client portal login
            </a>
          </div>
        </div>
      </header>

      <main>
        <PurchaseCheckoutClient />
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
