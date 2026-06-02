import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: false,
  turbopack: {
    root: __dirname,
  },
  async redirects() {
    return [
      {
        source: "/real-work-examples",
        destination: "/",
        permanent: true,
      },
      {
        source: "/safety-hub-2026",
        destination: "/",
        permanent: true,
      },
      {
        source: "/our-safety-bundles",
        destination: "/document-development",
        permanent: true,
      },
      {
        source: "/2026-safety-masterclass",
        destination: "/",
        permanent: true,
      },
      {
        source: "/shop-now__trashed",
        destination: "/",
        permanent: true,
      },
      {
        source: "/privacy-policy",
        destination: "/privacy",
        permanent: true,
      },
      {
        source: "/terms-conditions",
        destination: "/",
        permanent: true,
      },
      {
        source: "/website-disclaimer",
        destination: "/disclaimer",
        permanent: true,
      },
      {
        source: "/sms-diagnostic/dashboard/:path*",
        destination: "/dashboard/:path*",
        permanent: false,
      },
      {
        source: "/consult",
        destination: "/contact",
        permanent: true,
      },
      {
        source: "/consult-thank-you",
        destination: "/contact/success",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
