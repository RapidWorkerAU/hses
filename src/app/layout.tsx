import type { Metadata } from "next";
import "./globals.css";
import "./public-shared.css";
import HashRedirector from "./HashRedirector";
import GoogleTag from "./GoogleTag";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.hses.com.au"),
  title: {
    default: "HSES Industry Partners",
    template: "%s | HSES Industry Partners",
  },
  description:
    "HSES Industry Partners provides safety document development, safety management system design and safety technology for high-risk businesses in Perth and across Australia.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
        <link rel="icon" href="/icon-192.png" type="image/png" sizes="192x192" />
        <GoogleTag />
      </head>
      <body>
        <HashRedirector />
        {children}
      </body>
    </html>
  );
}


