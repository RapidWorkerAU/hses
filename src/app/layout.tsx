import type { Metadata } from "next";
import "./globals.css";
import HashRedirector from "./HashRedirector";

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
    <html lang="en">
      <body>
        <HashRedirector />
        {children}
      </body>
    </html>
  );
}


