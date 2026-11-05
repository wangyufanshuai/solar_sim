import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const requested = process.argv[2];
if (!new Set(["standalone-full", "vercel-lite"]).has(requested)) {
  throw new Error("usage: build-atlas-v593-profile.mjs <standalone-full|vercel-lite>");
}
const root = process.cwd();
const sourceManifestPath = resolve(root, "docs/release/v593/source-manifest-v593.json");
const candidateManifestPath = resolve(root, "public/data/final-art-direction-v593/manifest.json");
if (!existsSync(sourceManifestPath)) throw new Error("v593-build-source-manifest-missing");
if (!existsSync(candidateManifestPath)) throw new Error("v593-build-candidate-manifest-missing");
const sourceManifest = JSON.parse(readFileSync(sourceManifestPath, "utf8"));
const candidateManifest = JSON.parse(readFileSync(candidateManifestPath, "utf8"));
const canonicalize = (value) => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
};
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const unsigned = { ...sourceManifest };
delete unsigned.receiptSha256;
if (
  sourceManifest.version !== "v593-source-manifest-v1"
  || sourceManifest.status !== "complete"
  || sha256(Buffer.from(JSON.stringify(canonicalize(unsigned)), "utf8")) !== sourceManifest.receiptSha256
) throw new Error("v593-build-source-manifest-invalid");
const candidateUnsigned = { ...candidateManifest };
delete candidateUnsigned.manifestSha256;
if (
  candidateManifest.version !== "v593-final-art-direction-product-rc-candidate-v1"
  || candidateManifest.governance?.sourceManifestSha256 !== sourceManifest.receiptSha256
  || !/^[a-f0-9]{64}$/.test(candidateManifest.manifestSha256 ?? "")
  || sha256(Buffer.from(JSON.stringify(canonicalize(candidateUnsigned)), "utf8")) !== candidateManifest.manifestSha256
) throw new Error("v593-build-candidate-manifest-invalid");
for (const file of sourceManifest.files) {
  const path = resolve(root, file.path);
  if (!existsSync(path)) throw new Error(`v593-build-source-missing:${file.path}`);
  const bytes = readFileSync(path);
  if (bytes.byteLength !== file.bytes || sha256(bytes) !== file.sha256) throw new Error(`v593-build-source-drift:${file.path}`);
}

const suffix = requested === "vercel-lite" ? "lite" : "standalone";
const pageBuildFingerprint = sha256(Buffer.from(`v593-page-build-identity-v1\n${sourceManifest.receiptSha256}\n${requested}`, "utf8"));
const deploymentId = `v593-${sourceManifest.receiptSha256.slice(0, 12)}-${candidateManifest.manifestSha256.slice(0, 12)}`;
const closureSlot = `${sourceManifest.receiptSha256.slice(0, 12)}-${candidateManifest.manifestSha256.slice(0, 12)}`;
const child = spawn(process.execPath, [
  "scripts/build-atlas-profile.mjs",
  "--profile", "local-shadow",
  "--dist-dir", `.next-atlas-v593-${suffix}-${closureSlot}`,
  "--previous-dist-dir", `.next-atlas-v593-${suffix}-${closureSlot}-previous`,
  "--rotate",
  "--preserve-active-dev",
], {
  cwd: root,
  stdio: "inherit",
  windowsHide: true,
  env: {
    ...process.env,
    ATLAS_LOCAL_SHADOW_ROUTE_VERSION: "v593",
    ATLAS_NODE_HEAP_MB: "8192",
    ATLAS_BUILD_RECEIPT_NAME: `atlas-v593-${suffix}-build-resource.json`,
    ATLAS_CANDIDATE_SOURCE_MANIFEST_SHA256: sourceManifest.receiptSha256,
    ATLAS_CANDIDATE_DELIVERY_TIER: requested,
    ATLAS_PRESERVE_DIST_DIRS: ".next-atlas-v593-standalone-current;.next-atlas-v593-lite-current",
    NEXT_PUBLIC_ATLAS_CELESTIAL_DELIVERY_TIER: requested,
    NEXT_PUBLIC_ATLAS_V593_BUILD_FINGERPRINT: pageBuildFingerprint,
    NEXT_DEPLOYMENT_ID: deploymentId,
  },
});
child.on("error", (error) => {
  console.error(error);
  process.exitCode = 1;
});
child.on("exit", (code, signal) => {
  if (signal) {
    console.error(`v593-${suffix}-build-signal:${signal}`);
    process.exitCode = 1;
    return;
  }
  process.exitCode = code ?? 1;
});
