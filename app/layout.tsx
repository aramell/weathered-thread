import type { Metadata } from "next";
import { Anton, Fraunces, IBM_Plex_Mono, Libre_Franklin } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
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
// body/body-sm tokens), applied sitewide on body/body-sm-scaled text.
// Headline/display-sized text and mono/label elements stay on Fraunces/IBM
// Plex Mono — only paragraph-length copy uses `font-body`.
const libreFranklin = Libre_Franklin({
  variable: "--font-libre-franklin",
  subsets: ["latin"],
  weight: ["400"],
});

// Anton is for location wording only (place names such as "SEA ISLE"): never headlines in
// general and never the logo (Master Brand Guidelines, Nov 2026).
const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Weathered Thread — Made to Remember. Stitched in.",
  description: "Embroidered apparel for the towns worth remembering.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${ibmPlexMono.variable} ${libreFranklin.variable} ${anton.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-display">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
