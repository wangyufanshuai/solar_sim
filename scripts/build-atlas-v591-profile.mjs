import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { derivePageBuildFingerprintV591 } from "./v591-page-build-identity.mjs";

const requested = process.argv[2];
if (!new Set(["standalone-full", "vercel-lite"]).has(requested)) {
  throw new Error("usage: build-atlas-v591-profile.mjs <standalone-full|vercel-lite>");
}

const suffix = requested === "vercel-lite" ? "lite" : "standalone";
const root = process.cwd();
const sourceManifestPath = resolve(root, "docs/release/v591/source-manifest-v591.json");
if (!existsSync(sourceManifestPath)) throw new Error("v591-build-source-manifest-missing");
const sourceManifest = JSON.parse(readFileSync(sourceManifestPath, "utf8"));
if (sourceManifest.status !== "complete" || !/^[a-f0-9]{64}$/.test(sourceManifest.receiptSha256 ?? "")) {
  throw new Error("v591-build-source-manifest-invalid");
}
for (const file of sourceManifest.files) {
  const path = resolve(root, file.path);
  if (!existsSync(path)) throw new Error(`v591-build-source-missing:${file.path}`);
  const actualSha256 = createHash("sha256").update(readFileSync(path)).digest("hex");
  if (actualSha256 !== file.sha256) throw new Error(`v591-build-source-manifest-drift:${file.path}`);
}

const pageBuildFingerprint = derivePageBuildFingerprintV591({
  sourceManifestSha256: sourceManifest.receiptSha256,
  deliveryTier: requested,
});

const child = spawn(process.execPath, [
  "scripts/build-atlas-profile.mjs",
  "--profile", "local-shadow",
  "--dist-dir", `.next-atlas-v591-${suffix}-current`,
  "--previous-dist-dir", `.next-atlas-v591-${suffix}-previous`,
  "--rotate",
  "--preserve-active-dev",
], {
  cwd: root,
  stdio: "inherit",
  windowsHide: true,
  env: {
    ...process.env,
    ATLAS_LOCAL_SHADOW_ROUTE_VERSION: "v591",
    ATLAS_NODE_HEAP_MB: "8192",
    ATLAS_BUILD_RECEIPT_NAME: `atlas-v591-${suffix}-build-resource.json`,
    ATLAS_CANDIDATE_SOURCE_MANIFEST_SHA256: sourceManifest.receiptSha256,
    ATLAS_CANDIDATE_DELIVERY_TIER: requested,
    NEXT_PUBLIC_ATLAS_CELESTIAL_DELIVERY_TIER: requested,
    NEXT_PUBLIC_ATLAS_V591_SOURCE_MANIFEST_SHA256: sourceManifest.receiptSha256,
    NEXT_PUBLIC_ATLAS_V591_BUILD_FINGERPRINT: pageBuildFingerprint,
  },
});

child.on("error", (error) => {
  console.error(error);
  process.exitCode = 1;
});
child.on("exit", (code, signal) => {
  if (signal) {
    console.error(`v591-${suffix}-build-signal:${signal}`);
    process.exitCode = 1;
    return;
  }
  process.exitCode = code ?? 1;
});
