import type { Metadata } from "next";
import "./globals.css";
import "./public-shared.css";
import "./diagnostic-public.css";
import HashRedirector from "./HashRedirector";
import GoogleTag from "./GoogleTag";

export const metadata: Metadata = {
  title: {
    default: "HSES Industry Partners",
    template: "%s | HSES Industry Partners",
  },
  description: "Work Health and Safety management systems for high-risk businesses.",
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
      <body>
        <GoogleTag tagId={process.env.NEXT_PUBLIC_GOOGLE_TAG_ID} />
        <HashRedirector />
        {children}
      </body>
    </html>
  );
}


