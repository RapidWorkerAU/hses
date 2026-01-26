import type { Metadata } from "next";
import CheckoutEmbedClient from "./CheckoutEmbedClient";

export const metadata: Metadata = {
  title: "Diagnostic Checkout",
};

export const dynamic = "force-dynamic";

type CheckoutPageProps = {
  searchParams?: {
    quantity?: string | string[];
  };
};

export default function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const rawQuantity = Array.isArray(searchParams?.quantity)
    ? searchParams?.quantity[0]
    : searchParams?.quantity;
  const quantity = Number(rawQuantity ?? "1");
  const safeQuantity = Number.isFinite(quantity) && quantity > 0 ? quantity : 1;

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
              Back to cart
            </a>
          </div>
        </div>
      </header>

      <main>
        <CheckoutEmbedClient quantity={safeQuantity} />
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
