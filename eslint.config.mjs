import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    // Next 16 ships React Compiler diagnostics through the hooks plugin even
    // when the compiler is not enabled.  Preserve the established React 19
    // runtime contract during this framework-only migration; these rules are
    // tracked as a separate refactor instead of rewriting frozen runtime code.
    rules: {
      "react-hooks/refs": "off",
      "react-hooks/immutability": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/static-components": "off",
      "react-hooks/use-memo": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "@typescript-eslint/no-unused-expressions": "warn",
      "prefer-const": "warn",
    },
  },
  globalIgnores([
    ".next*/**",
    "dist/**",
    "desktop-shell/**",
    "output/**",
    "test-results/**",
    "src-tauri/gen/**",
    "src-tauri/target/**",
  ]),
]);
