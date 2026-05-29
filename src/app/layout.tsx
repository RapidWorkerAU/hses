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
    icon: "/images/favicon.png",
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
        <GoogleTag />
      </head>
      <body>
        <HashRedirector />
        {children}
      </body>
    </html>
  );
}


