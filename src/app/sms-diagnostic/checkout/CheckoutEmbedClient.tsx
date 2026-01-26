"use client";

import { useSearchParams } from "next/navigation";
import EmbeddedCheckoutPanel from "../purchase/EmbeddedCheckout";

type CheckoutEmbedClientProps = {
  quantity: number;
};

export default function CheckoutEmbedClient({ quantity }: CheckoutEmbedClientProps) {
  const searchParams = useSearchParams();
  const rawQuantity = searchParams?.get("quantity");
  const queryQuantity = Number(rawQuantity ?? "0");
  const safeQuantity = Number.isFinite(queryQuantity) && queryQuantity > 0
    ? queryQuantity
    : Number.isFinite(quantity) && quantity > 0
      ? quantity
      : 1;

  return (
    <section className="diagnostic-hero diagnostic-purchase-hero" id="checkout">
      <div className="diagnostic-container diagnostic-purchase-layout">
        <div className="diagnostic-hero-copy">
          <p className="diagnostic-kicker">Secure payment</p>
          <img
            src="/images/SELF-Original-Logo.png"
            alt="Safety Energy Loop Framework logo"
            className="diagnostic-self-logo"
          />
          <h1>Complete your diagnostic purchase</h1>
          <p className="diagnostic-lede">
            Review the payment details below. The setup fee is fixed at 1x and the
            participant access codes match your selected quantity.
          </p>
          <div className="diagnostic-summary-card">
            <h3>Selected participant quantity</h3>
            <p className="diagnostic-panel-note">
              {safeQuantity} access codes will be created after payment.
            </p>
          </div>
          <div className="diagnostic-cta">
            <a className="btn btn-outline" href={`/sms-diagnostic/purchase`}>
              Back to cart
            </a>
          </div>
        </div>
        <div className="diagnostic-checkout-panel">
          <div className="diagnostic-checkout-copy">
            <p className="diagnostic-eyebrow">Stripe checkout</p>
            <h2>Secure payment via Stripe.</h2>
            <p>Adjustments can still be made in Stripe before payment.</p>
          </div>
          <EmbeddedCheckoutPanel quantity={safeQuantity} key={safeQuantity} />
        </div>
      </div>
    </section>
  );
}
