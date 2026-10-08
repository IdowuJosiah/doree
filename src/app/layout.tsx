import type { Metadata } from "next";
import { Bodoni_Moda, Jost, Pinyon_Script } from "next/font/google";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { siteConfig } from "@/lib/config";
import "./globals.css";

const display = Bodoni_Moda({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-display", display: "swap" });
const body = Jost({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-body", display: "swap" });
const script = Pinyon_Script({ subsets: ["latin"], weight: "400", variable: "--font-script", display: "swap" });

export const metadata: Metadata = {
  title: { default: `${siteConfig.name} | ${siteConfig.tagline}`, template: `%s | ${siteConfig.name}` },
  description: "Jewelry created with love.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${script.variable}`}>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
