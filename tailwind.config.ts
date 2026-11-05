import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "PingFang SC",
          "Microsoft YaHei",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "Fira Code",
          "ui-monospace",
          "monospace",
        ],
      },
      colors: {
        ui: {
          primary: "var(--ui-text-primary)",
          muted: "var(--ui-text-muted)",
          dim: "var(--ui-text-dim)",
          accent: "var(--ui-accent)",
          warn: "var(--ui-warn)",
        },
      },
      backgroundColor: {
        "ui-glass": "var(--ui-glass-bg)",
        "ui-glass-elevated": "var(--ui-glass-bg-elevated)",
        "ui-glass-hover": "var(--ui-glass-bg-hover)",
      },
      borderColor: {
        ui: "var(--ui-glass-border)",
        "ui-strong": "var(--ui-glass-border-strong)",
      },
      ringColor: {
        ui: "var(--ui-glass-border-strong)",
        "ui-strong": "var(--ui-glass-border-strong)",
        "ui-accent": "var(--ui-accent-glow)",
      },
      boxShadow: {
        "ui-panel":
          "0 8px 32px rgba(0, 0, 0, 0.7), 0 0 0.5px rgba(34, 211, 238, 0.12)",
        "ui-side": "4px 0 24px rgba(0, 0, 0, 0.6)",
        "ui-glow": "0 0 12px var(--ui-accent-glow), 0 0 1px var(--ui-accent-glow)",
      },
      backdropBlur: {
        ui: "64px",
      },
      transitionTimingFunction: {
        "ui": "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      transitionDuration: {
        "280": "280ms",
      },
      borderWidth: {
        "0.5": "0.5px",
      },
    },
  },
  plugins: [],
};

export default config;
