"use client";

import { useEffect } from "react";

export default function PrintOnLoad() {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.print();
    }, 300);

    return () => window.clearTimeout(timer);
  }, []);

  return null;
}
