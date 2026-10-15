import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    screens: { sm: "640px", lg: "1024px", xl: "1280px" },
    extend: {
      colors: {
        gold: "var(--gold)",
        "gold-heading": "var(--gold-heading)",
        "gold-text": "var(--gold-text)",
        parchment: "var(--parchment)",
        cream: "var(--cream)",
        ink: "var(--ink)",
        "cream-deep": "var(--cream-deep)",
        line: "var(--line)",
        black: "var(--black)",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        statement: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-body)", "sans-serif"],
        script: ["var(--font-script)", "cursive"],
      },
      maxWidth: { container: "1200px" },
      letterSpacing: { label: "0.08em" },
    },
  },
  plugins: [],
};

export default config;
