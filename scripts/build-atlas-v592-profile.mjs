import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const requested = process.argv[2];
if (!new Set(["standalone-full", "vercel-lite"]).has(requested)) {
  throw new Error("usage: build-atlas-v592-profile.mjs <standalone-full|vercel-lite>");
}

const root = process.cwd();
const sourceManifestPath = resolve(root, "docs/release/v592/source-manifest-v592.json");
if (!existsSync(sourceManifestPath)) throw new Error("v592-build-source-manifest-missing");
const sourceManifest = JSON.parse(readFileSync(sourceManifestPath, "utf8"));
const canonicalize = (value) => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
};
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const unsignedSourceManifest = { ...sourceManifest };
delete unsignedSourceManifest.receiptSha256;
if (
  sourceManifest.version !== "v592-source-manifest-v2"
  || sourceManifest.status !== "complete"
  || sourceManifest.postBuildEvidencePolicy?.excludedFromRuntimeSourceIdentity !== true
  || sourceManifest.postBuildEvidencePolicy?.verificationScope !== "capability-and-readonly-verifier"
  || sourceManifest.postBuildEvidencePolicy?.scientificPayloadWriteback !== false
  || !/^[a-f0-9]{64}$/.test(sourceManifest.receiptSha256 ?? "")
  || sha256(Buffer.from(JSON.stringify(canonicalize(unsignedSourceManifest)), "utf8")) !== sourceManifest.receiptSha256
  || !Array.isArray(sourceManifest.files)
) throw new Error("v592-build-source-manifest-invalid");

for (const file of sourceManifest.files) {
  const path = resolve(root, file.path);
  if (!existsSync(path)) throw new Error(`v592-build-source-missing:${file.path}`);
  const bytes = readFileSync(path);
  if (bytes.byteLength !== file.bytes || sha256(bytes) !== file.sha256) {
    throw new Error(`v592-build-source-manifest-drift:${file.path}`);
  }
}

const suffix = requested === "vercel-lite" ? "lite" : "standalone";
const pageBuildFingerprint = sha256(Buffer.from(`v592-page-build-identity-v1\n${sourceManifest.receiptSha256}\n${requested}`, "utf8"));
const child = spawn(process.execPath, [
  "scripts/build-atlas-profile.mjs",
  "--profile", "local-shadow",
  "--dist-dir", `.next-atlas-v592-${suffix}-current`,
  "--previous-dist-dir", `.next-atlas-v592-${suffix}-previous`,
  "--rotate",
  "--preserve-active-dev",
], {
  cwd: root,
  stdio: "inherit",
  windowsHide: true,
  env: {
    ...process.env,
    ATLAS_LOCAL_SHADOW_ROUTE_VERSION: "v592",
    ATLAS_NODE_HEAP_MB: "8192",
    ATLAS_BUILD_RECEIPT_NAME: `atlas-v592-${suffix}-build-resource.json`,
    ATLAS_CANDIDATE_SOURCE_MANIFEST_SHA256: sourceManifest.receiptSha256,
    ATLAS_CANDIDATE_DELIVERY_TIER: requested,
    NEXT_PUBLIC_ATLAS_CELESTIAL_DELIVERY_TIER: requested,
    NEXT_PUBLIC_ATLAS_V592_BUILD_FINGERPRINT: pageBuildFingerprint,
  },
});

child.on("error", (error) => {
  console.error(error);
  process.exitCode = 1;
});
child.on("exit", (code, signal) => {
  if (signal) {
    console.error(`v592-${suffix}-build-signal:${signal}`);
    process.exitCode = 1;
    return;
  }
  process.exitCode = code ?? 1;
});
