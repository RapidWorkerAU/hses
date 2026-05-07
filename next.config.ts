import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  async redirects() {
    return [
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
