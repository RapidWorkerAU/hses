"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

type GoogleContactConversionProps = {
  conversionId?: string;
  conversionLabel?: string;
};

export default function GoogleContactConversion({
  conversionId,
  conversionLabel,
}: GoogleContactConversionProps) {
  useEffect(() => {
    if (!conversionId || !conversionLabel || typeof window.gtag !== "function") {
      return;
    }

    window.gtag("event", "conversion", {
      send_to: `${conversionId}/${conversionLabel}`,
    });
  }, [conversionId, conversionLabel]);

  return null;
}
