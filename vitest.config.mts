import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "app/**/*.test.{ts,tsx}",
      "app/**/*.spec.{ts,tsx}",
    ],
    exclude: [
      "node_modules/**",
      "tmp/**",
      ".next/**",
      ".next-*/**",
      "dist/**",
      "test-results/**",
      "playwright-report/**",
      "tests/**",
      "**/*.playwright.{ts,tsx}",
      "**/playwright*.{ts,tsx}",
    ],
  },
});
