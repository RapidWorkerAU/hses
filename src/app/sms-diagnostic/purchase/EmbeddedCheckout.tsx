"use client";

import { loadStripe } from "@stripe/stripe-js";
import type { StripeEmbeddedCheckout } from "@stripe/stripe-js";
import { useEffect, useRef, useState } from "react";

type EmbeddedCheckoutPanelProps = {
  quantity: number;
};

export default function EmbeddedCheckoutPanel({
  quantity,
}: EmbeddedCheckoutPanelProps) {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
  const containerRef = useRef<HTMLDivElement | null>(null);
  const checkoutRef = useRef<StripeEmbeddedCheckout | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!publishableKey) return;
    let isActive = true;

    const mountCheckout = async () => {
      try {
        const response = await fetch("/api/stripe/embedded-checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ quantity }),
        });
        if (!response.ok) {
          throw new Error("Failed to create checkout session.");
        }
        const data = (await response.json()) as { clientSecret?: string };
        if (!data.clientSecret) {
          throw new Error("Missing client secret.");
        }

        if (!isActive) return;

        const stripe = await loadStripe(publishableKey);
        if (!stripe) {
          throw new Error("Stripe failed to initialize.");
        }

        if (checkoutRef.current?.destroy) {
          checkoutRef.current.destroy();
          checkoutRef.current = null;
        }

        checkoutRef.current = await stripe.initEmbeddedCheckout({
          clientSecret: data.clientSecret,
        });

        if (containerRef.current) {
          checkoutRef.current.mount(containerRef.current);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Checkout failed.";
        setError(message);
      }
    };

    mountCheckout();

    return () => {
      isActive = false;
      if (checkoutRef.current?.destroy) {
        checkoutRef.current.destroy();
        checkoutRef.current = null;
      }
    };
  }, [publishableKey, quantity]);

  if (!publishableKey) {
    return (
      <div className="diagnostic-checkout-placeholder">
        Add `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to render checkout.
      </div>
    );
  }

  if (error) {
    return <div className="diagnostic-checkout-placeholder">{error}</div>;
  }

  return <div className="stripe-embedded-checkout" ref={containerRef} />;
}
