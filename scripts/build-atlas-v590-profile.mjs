import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const requested = process.argv[2];
if (!new Set(["standalone-full", "vercel-lite"]).has(requested)) {
  throw new Error("usage: build-atlas-v590-profile.mjs <standalone-full|vercel-lite>");
}

const suffix = requested === "vercel-lite" ? "lite" : "standalone";
const root = process.cwd();
const sourceManifestPath = resolve(root, "docs/release/v590/source-manifest-v590.json");
if (!existsSync(sourceManifestPath)) throw new Error("v590-build-source-manifest-missing");
const sourceManifest = JSON.parse(readFileSync(sourceManifestPath, "utf8"));
if (sourceManifest.status !== "complete" || !/^[a-f0-9]{64}$/.test(sourceManifest.receiptSha256 ?? "")) {
  throw new Error("v590-build-source-manifest-invalid");
}
for (const file of sourceManifest.files) {
  const path = resolve(root, file.path);
  if (!existsSync(path)) throw new Error(`v590-build-source-missing:${file.path}`);
  const actualSha256 = createHash("sha256").update(readFileSync(path)).digest("hex");
  if (actualSha256 !== file.sha256) throw new Error(`v590-build-source-manifest-drift:${file.path}`);
}
const receiptName = `atlas-v590-${suffix}-build-resource.json`;
const child = spawn(process.execPath, [
  "scripts/build-atlas-profile.mjs",
  "--profile", "local-shadow",
  "--dist-dir", `.next-atlas-v590-${suffix}-current`,
  "--previous-dist-dir", `.next-atlas-v590-${suffix}-previous`,
  "--rotate",
  "--preserve-active-dev",
], {
  cwd: process.cwd(),
  stdio: "inherit",
  windowsHide: true,
  env: {
    ...process.env,
    ATLAS_LOCAL_SHADOW_ROUTE_VERSION: "v590",
    ATLAS_NODE_HEAP_MB: "8192",
    ATLAS_BUILD_RECEIPT_NAME: receiptName,
    ATLAS_CANDIDATE_SOURCE_MANIFEST_SHA256: sourceManifest.receiptSha256,
    ATLAS_CANDIDATE_DELIVERY_TIER: requested,
    NEXT_PUBLIC_ATLAS_CELESTIAL_DELIVERY_TIER: requested,
  },
});

child.on("error", (error) => {
  console.error(error);
  process.exitCode = 1;
});
child.on("exit", (code, signal) => {
  if (signal) {
    console.error(`v590-${suffix}-build-signal:${signal}`);
    process.exitCode = 1;
    return;
  }
  process.exitCode = code ?? 1;
});
