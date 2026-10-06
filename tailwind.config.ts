import type { Config } from "tailwindcss";

// Colors, radii and shadows come from the NextNest design system tokens,
// defined as CSS variables in src/app/globals.css (light + dark).
const token = (name: string) => `var(--${name})`;

const colorNames = [
  "surface",
  "surface-raised",
  "surface-sunken",
  "line",
  "line-subtle",
  "ink",
  "ink-muted",
  "ink-faint",
  "nest",
  "nest-bold",
  "nest-soft",
  "on-nest",
  "sky",
  "sky-soft",
  "amber",
  "amber-soft",
  "red",
  "red-soft",
  "score",
  "score-track"
];

const config: Config = {
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}", "./src/lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: Object.fromEntries(colorNames.map((name) => [name, token(name)])),
      borderRadius: {
        sm: token("radius-sm"),
        md: token("radius-md"),
        lg: token("radius-lg"),
        xl: token("radius-xl")
      },
      boxShadow: {
        sm: token("shadow-sm"),
        md: token("shadow-md"),
        lg: token("shadow-lg")
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"]
      },
      fontSize: {
        "display-lg": ["40px", { lineHeight: "48px", letterSpacing: "-0.02em", fontWeight: "700" }],
        display: ["32px", { lineHeight: "40px", letterSpacing: "-0.015em", fontWeight: "700" }],
        "heading-lg": ["24px", { lineHeight: "32px", letterSpacing: "-0.01em", fontWeight: "600" }],
        heading: ["20px", { lineHeight: "28px", fontWeight: "600" }],
        "heading-sm": ["16px", { lineHeight: "24px", fontWeight: "600" }],
        body: ["15px", { lineHeight: "24px" }],
        "body-sm": ["13px", { lineHeight: "20px" }],
        caption: ["12px", { lineHeight: "16px", letterSpacing: "0.01em", fontWeight: "500" }],
        overline: ["11px", { lineHeight: "16px", letterSpacing: "0.06em", fontWeight: "600" }]
      }
    }
  },
  plugins: []
};

export default config;
