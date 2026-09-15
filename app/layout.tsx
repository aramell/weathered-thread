import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono, Libre_Franklin } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

// Libre Franklin is the canonical `font-body` typeface (DESIGN.md's
// body/body-sm tokens) — wired here so the CSS variable is available
// sitewide, but the `font-body` utility (globals.css) is only applied on
// About's new copy for now. Existing pages keep rendering Fraunces for body
// text; this addition must not change their output.
const libreFranklin = Libre_Franklin({
  variable: "--font-libre-franklin",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Weathered Thread — Made to Remember. Stitched in.",
  description: "Embroidered apparel for the towns worth remembering.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${ibmPlexMono.variable} ${libreFranklin.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-display">{children}</body>
    </html>
  );
}
