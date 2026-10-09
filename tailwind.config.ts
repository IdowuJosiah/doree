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
        sans: ["var(--font-body)", "Georgia", "serif"],
        script: ["var(--font-script)", "cursive"],
      },
      // Cormorant Garamond reads smaller than most fonts at the same size, so
      // the small steps are set up a notch to stay comfortable to read.
      fontSize: {
        xs: ["0.875rem", { lineHeight: "1.4" }],
        sm: ["1rem", { lineHeight: "1.5" }],
        base: ["1.125rem", { lineHeight: "1.6" }],
        lg: ["1.25rem", { lineHeight: "1.6" }],
      },
      maxWidth: { container: "1200px" },
      letterSpacing: { label: "0.08em" },
    },
  },
  plugins: [],
};

export default config;
