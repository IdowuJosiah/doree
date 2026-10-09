import type { Metadata } from "next";
import { Cormorant_Garamond, Pinyon_Script, Playfair_Display } from "next/font/google";
import { siteConfig } from "@/lib/config";
import "./globals.css";

// Headings: Playfair Display (bold, gold). Body: Cormorant Garamond (espresso).
const display = Playfair_Display({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-display", display: "swap" });
const body = Cormorant_Garamond({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-body", display: "swap" });
const script = Pinyon_Script({ subsets: ["latin"], weight: "400", variable: "--font-script", display: "swap" });

export const metadata: Metadata = {
  title: { default: `${siteConfig.name} | ${siteConfig.tagline}`, template: `%s | ${siteConfig.name}` },
  description: "Jewelry created with love.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${script.variable}`}>
      <body>{children}</body>
    </html>
  );
}
