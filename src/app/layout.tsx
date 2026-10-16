import type { Metadata } from "next";
import localFont from "next/font/local";
import { SITE_URL } from "@/lib/site-url";
import { siteConfig } from "@/lib/config";
import "./globals.css";

// Fonts are bundled with the site (open licences in ./fonts), so builds never
// depend on downloading them from Google Fonts.
// Headings and statements: Bodoni Moda (gold headings). Body: Jost (espresso).
const display = localFont({
  src: [
    { path: "./fonts/bodoni-moda-latin-wght-normal.woff2", weight: "400 900", style: "normal" },
    { path: "./fonts/bodoni-moda-latin-wght-italic.woff2", weight: "400 900", style: "italic" },
  ],
  variable: "--font-display",
  display: "swap",
});
const body = localFont({
  src: [{ path: "./fonts/jost-latin-wght-normal.woff2", weight: "100 900", style: "normal" }],
  variable: "--font-body",
  display: "swap",
});
const script = localFont({
  src: [{ path: "./fonts/pinyon-script-latin-400-normal.woff2", weight: "400", style: "normal" }],
  variable: "--font-script",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: `${siteConfig.name} | ${siteConfig.tagline}`, template: `%s | ${siteConfig.name}` },
  description: "Jewelry created with love.",
  metadataBase: new URL(SITE_URL),
  openGraph: { siteName: siteConfig.name, locale: "en_US", type: "website" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${script.variable}`}>
      <body>{children}</body>
    </html>
  );
}
