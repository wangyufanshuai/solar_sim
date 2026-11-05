export const ATLAS_RELEASE_SOURCE_POLICY_V241_VERSION =
  "v241-project-source-allowlist";

export const PROJECT_SOURCE_ROOTS_V241 = Object.freeze([
  { path: "app", category: "application-source" },
  { path: "docs", category: "documentation" },
  { path: "scripts", category: "build-test-research-source" },
  { path: "tests", category: "test-source" },
  { path: "desktop-shell", category: "desktop-shell-source" },
  { path: "src-tauri/src", category: "tauri-source" },
  { path: "src-tauri/capabilities", category: "tauri-capabilities" },
  { path: "src-tauri/icons", category: "tauri-icons" },
  { path: "public/atlas-lite", category: "vercel-lite-assets" },
]);

export const PROJECT_SOURCE_FILES_V241 = Object.freeze([
  ".env.example",
  ".gitignore",
  ".vercelignore",
  "README.md",
  "eslint.config.mjs",
  "next-env.d.ts",
  "next.config.mjs",
  "package-lock.json",
  "package.json",
  "postcss.config.mjs",
  "proxy.ts",
  "requirements-science.txt",
  "tailwind.config.ts",
  "tsconfig.json",
  "vercel.json",
  "public/favicon.ico",
  "public/textures/sky/README.md",
  "public/textures/sky/orbit-atlas-v9-base-8k.jpg",
  "public/textures/sky/orbit-atlas-v9-stars-4k.jpg",
  "public/textures/sky/orbit-atlas-v9-dust-2k.jpg",
  "src-tauri/build.rs",
  "src-tauri/Cargo.lock",
  "src-tauri/Cargo.toml",
  "src-tauri/sign-artifact.ps1",
  "src-tauri/tauri.artifact-signing.conf.json",
  "src-tauri/tauri.conf.json",
  "src-tauri/tauri.v186.conf.json",
  "src-tauri/tauri.v192.conf.json",
  "src-tauri/tauri.v200.conf.json",
]);

export const PROJECT_SOURCE_TOP_LEVEL_PATTERNS_V241 = Object.freeze([
  /^playwright\..+\.config\.ts$/,
]);

export const FROZEN_V9_SHA256_V241 = Object.freeze({
  "public/textures/sky/orbit-atlas-v9-base-8k.jpg":
    "9d52abb4774cdca473606f514158b72a5af5950fa283e53d703b983a83ff1df2",
  "public/textures/sky/orbit-atlas-v9-stars-4k.jpg":
    "4c22311b7b87d2b003312a548aca2c904bbade5d9edfaf8cca8b085928cd873c",
  "public/textures/sky/orbit-atlas-v9-dust-2k.jpg":
    "8011f424415f9e8b3841f6a36ce2a63dcdbc5b5161395dc484104e352d9169ce",
});

export const EXCLUDED_PROJECT_PREFIXES_V241 = Object.freeze([
  ".agents/",
  ".cache/",
  ".claude/",
  ".codex/",
  ".git/",
  ".next",
  ".playwright-cli/",
  ".playwright-mcp/",
  ".venv-science/",
  "deploy-artifacts/",
  "dist/",
  "node_modules/",
  "output/",
  "playwright-report/",
  "research-cache/",
  "src-tauri/gen/",
  "src-tauri/runtime/",
  "src-tauri/server/",
  "src-tauri/target/",
  "test-results/",
  "tmp/",
  "tools/",
]);

export function sourceCategoryV241(file) {
  const normalized = file.replaceAll("\\", "/");
  const root = PROJECT_SOURCE_ROOTS_V241.find(
    (entry) => normalized === entry.path || normalized.startsWith(`${entry.path}/`),
  );
  if (root) return root.category;
  if (normalized.startsWith("public/textures/sky/")) return "frozen-v9-assets";
  if (normalized.startsWith("src-tauri/")) return "tauri-config";
  if (normalized.startsWith("playwright.")) return "browser-test-config";
  if (normalized.startsWith("public/")) return "public-config-asset";
  return "project-config";
}

