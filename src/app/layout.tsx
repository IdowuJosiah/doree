import type { Metadata } from "next";
import { Bodoni_Moda, Jost, Pinyon_Script, Playfair_Display } from "next/font/google";
import { siteConfig } from "@/lib/config";
import "./globals.css";

// Headings: Playfair Display (bold, gold). Body: Jost (espresso).
const display = Playfair_Display({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-display", display: "swap" });
const body = Jost({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-body", display: "swap" });
// The home page brand statement keeps the original Bodoni Moda.
const statement = Bodoni_Moda({ subsets: ["latin"], weight: "400", variable: "--font-statement", display: "swap" });
const script = Pinyon_Script({ subsets: ["latin"], weight: "400", variable: "--font-script", display: "swap" });

export const metadata: Metadata = {
  title: { default: `${siteConfig.name} | ${siteConfig.tagline}`, template: `%s | ${siteConfig.name}` },
  description: "Jewelry created with love.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${script.variable} ${statement.variable}`}>
      <body>{children}</body>
    </html>
  );
}
