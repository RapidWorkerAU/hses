"use client";

import { useState } from "react";
const MIN_QTY = 1;
const MAX_QTY = 500;

export default function PurchaseCheckoutClient() {
  const [quantity, setQuantity] = useState(MIN_QTY);
  const total = 495 + 89 * quantity;
  const formatter = new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  });

  const decreaseQty = () => {
    setQuantity((value) => Math.max(MIN_QTY, value - 1));
  };

  const increaseQty = () => {
    setQuantity((value) => Math.min(MAX_QTY, value + 1));
  };

  const handleQtyChange = (value: string) => {
    const next = Number(value);
    if (!Number.isFinite(next)) {
      setQuantity(MIN_QTY);
      return;
    }
    setQuantity(Math.max(MIN_QTY, Math.min(MAX_QTY, Math.floor(next))));
  };

  return (
    <section className="diagnostic-hero diagnostic-purchase-hero" id="checkout">
      <div className="diagnostic-container diagnostic-purchase-layout">
        <div className="diagnostic-purchase-intro">
          <p className="diagnostic-kicker">Purchase & onboard</p>
          <img
            src="/images/SELF-Original-Logo.png"
            alt="Safety Energy Loop Framework logo"
            className="diagnostic-self-logo"
          />
          <h1>Safety Management System Diagnostic checkout</h1>
          <p className="diagnostic-lede">
            Confirm what you are buying, then proceed to the secure payment
            page. The diagnostic owner receives a confirmation email with a
            temporary password and dashboard login instructions.
          </p>
        </div>
        <div className="diagnostic-purchase-spacer" aria-hidden="true"></div>
        <div className="diagnostic-purchase-details">
          <div className="diagnostic-price-row">
            <div className="diagnostic-price-card">
              <span>Setup fee</span>
              <strong>$495</strong>
              <p>Diagnostic configuration and governance mapping.</p>
            </div>
            <div className="diagnostic-price-card">
              <span>Per participant</span>
              <strong>$89</strong>
              <p>Anonymous access codes for your selected cohort.</p>
            </div>
          </div>
          <div className="diagnostic-summary-stack">
            <div className="diagnostic-summary-card">
              <h3>What you are buying</h3>
              <ul>
                <li>Anonymous participant access codes.</li>
                <li>Governance theme analytics and insights.</li>
                <li>Action-ready summary outputs.</li>
                <li>Dashboard access for the diagnostic owner.</li>
              </ul>
            </div>
            <div className="diagnostic-summary-card">
              <h3>Access & login</h3>
              <ol>
                <li>Checkout is completed on this page.</li>
                <li>Confirmation email is sent to the diagnostic owner.</li>
                <li>Temporary password is included in that email.</li>
                <li>Log in to the diagnostic dashboard and reset password.</li>
              </ol>
              <p className="diagnostic-panel-note">
                Access is issued only to the nominated setup contact.
              </p>
            </div>
          </div>
          <div className="diagnostic-cta">
            <a
              className="btn btn-primary"
              href={`/sms-diagnostic/checkout?quantity=${quantity}`}
            >
              Proceed to payment
            </a>
            <a className="btn btn-outline" href="/sms-diagnostic">
              Back to diagnostic
            </a>
          </div>
        </div>
        <div className="diagnostic-cart-panel">
          <div className="diagnostic-checkout-copy">
            <p className="diagnostic-eyebrow">Order summary</p>
            <h2>Review your cart</h2>
            <p>
              Setup fee is fixed at 1x. Adjust participant access code quantity
              to match your cohort size.
            </p>
          </div>
          <div className="diagnostic-cart">
            <div className="diagnostic-cart-header">
              <span>Item</span>
              <span className="diagnostic-cart-qty">Qty</span>
              <span className="diagnostic-cart-price">Total</span>
            </div>
            <div className="diagnostic-cart-row">
              <div>
                <strong>Setup fee</strong>
                <span className="diagnostic-cart-meta">Fixed quantity</span>
              </div>
              <div className="diagnostic-cart-qty">1</div>
              <div className="diagnostic-cart-price">{formatter.format(495)}</div>
            </div>
            <div className="diagnostic-cart-row">
              <div>
                <strong>Participant access codes</strong>
                <span className="diagnostic-cart-meta">$89 per participant</span>
              </div>
              <div className="diagnostic-cart-qty">
                <div className="diagnostic-quantity-controls">
                  <button
                    className="qty-btn"
                    type="button"
                    onClick={decreaseQty}
                    aria-label="Decrease participant quantity"
                  >
                    -
                  </button>
                  <input
                    className="qty-input"
                    type="number"
                    min={MIN_QTY}
                    max={MAX_QTY}
                    value={quantity}
                    onChange={(event) => handleQtyChange(event.target.value)}
                    aria-label="Participant quantity"
                  />
                  <button
                    className="qty-btn"
                    type="button"
                    onClick={increaseQty}
                    aria-label="Increase participant quantity"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="diagnostic-cart-price">
                {formatter.format(89 * quantity)}
              </div>
            </div>
            <div className="diagnostic-cart-total">
              <span>Total</span>
              <strong>{formatter.format(total)}</strong>
            </div>
          </div>
          <a
            className="btn btn-primary"
            href={`/sms-diagnostic/checkout?quantity=${quantity}`}
          >
            Continue to payment
          </a>
        </div>
      </div>
    </section>
  );
}
