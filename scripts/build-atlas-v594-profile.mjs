import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { canonicalShaV594 } from "./build-v594-stellar-relativity-candidate.mjs";

const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const NEXT_BUILD_ID_PATTERN = /^v594b-[0-9a-f]{64}$/;
const TIERS = new Set(["standalone-full", "vercel-lite"]);
export const V594_BUILD_RECEIPT_VERSION = "v594-atlas-build-resource-receipt-v1";
export const V594_BUILD_TIMESTAMP_POLICY = "source-manifest-generated-at-explicit";
export const V594_REQUIRED_CLOSURE_PATHS = Object.freeze([
  "scripts/build-v594-current-source-lifecycle.mjs",
  "scripts/build-v594-current-source-soak.mjs",
  "scripts/build-v594-current-lite-matrix.mjs",
  "scripts/build-v594-final-sealed-browser-gate.mjs",
  "scripts/build-v594-human-visual-signoff.mjs",
  "scripts/build-v594-closure-dossier.mjs",
  "scripts/seal-v594-stellar-relativity-candidate.mjs",
  "scripts/verify-v594-stellar-relativity-candidate.mjs",
]);

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function assertSeal(document, field, label) {
  const unsigned = { ...document };
  const declared = unsigned[field];
  delete unsigned[field];
  if (!SHA256_PATTERN.test(declared ?? "") || canonicalShaV594(unsigned) !== declared) {
    throw new Error(`v594-build-seal-invalid:${label}`);
  }
}

export function deriveV594DeploymentId(sourceManifestSha256, manifestSha256) {
  if (!SHA256_PATTERN.test(sourceManifestSha256 ?? "")) throw new Error("v594-build-source-sha");
  if (!SHA256_PATTERN.test(manifestSha256 ?? "")) throw new Error("v594-build-manifest-sha");
  return `v594-${sourceManifestSha256.slice(0, 12)}-${manifestSha256.slice(0, 12)}`;
}

export function deriveV594NextBuildId(buildFingerprint) {
  if (!SHA256_PATTERN.test(buildFingerprint ?? "")) throw new Error("v594-build-fingerprint-sha");
  return `v594b-${buildFingerprint}`;
}

export function deriveV594ClosureSourceSha(sourcePaths) {
  if (!Array.isArray(sourcePaths)) throw new Error("v594-build-closure-source-list");
  return canonicalShaV594({ version: "v594-closure-source-list-v1", value: sourcePaths });
}

export function profileWrapperArtifactV594(root = process.cwd()) {
  const path = "scripts/build-atlas-v594-profile.mjs";
  const bytes = readFileSync(resolve(root, path));
  return Object.freeze({ path, bytes: bytes.byteLength, sha256: sha256(bytes) });
}

export function createV594BuildReceipt(identity, {
  root = process.cwd(),
  profileWrapper = profileWrapperArtifactV594(root),
} = {}) {
  const closureSourcePaths = identity.source?.closureSourcePaths;
  if (
    !Array.isArray(closureSourcePaths)
    || JSON.stringify(closureSourcePaths.map((entry) => entry.path)) !== JSON.stringify(V594_REQUIRED_CLOSURE_PATHS)
    || closureSourcePaths.some((entry) => entry.state !== "present")
  ) throw new Error("v594-build-closure-source-order");
  const unsigned = {
    version: V594_BUILD_RECEIPT_VERSION,
    status: "passed",
    generatedAt: identity.source.generatedAt,
    timestampPolicy: V594_BUILD_TIMESTAMP_POLICY,
    sealAlgorithm: "sha256-canonical-json-object-keys-v1",
    sourceManifestSha256: identity.source.receiptSha256,
    candidateManifestSha256: identity.manifest.manifestSha256,
    buildId: identity.buildId,
    buildFingerprint: identity.buildFingerprint,
    deploymentId: identity.deploymentId,
    formalProductPointer: "v263",
    deliveryTier: identity.requested,
    profileWrapper,
    closureSourceSha256: deriveV594ClosureSourceSha(closureSourcePaths),
  };
  if (!NEXT_BUILD_ID_PATTERN.test(unsigned.buildId ?? "")) throw new Error("v594-build-id-contract");
  return Object.freeze({ ...unsigned, receiptSha256: canonicalShaV594(unsigned) });
}

export function serializeV594BuildReceipt(receipt) {
  return `${JSON.stringify(receipt, null, 2)}\n`;
}

export function writeV594BuildReceipt(identity, options = {}) {
  const root = resolve(options.root ?? process.cwd());
  const receipt = createV594BuildReceipt(identity, { ...options, root });
  const path = resolve(root, "dist", "release", `atlas-v594-${identity.suffix}-build-resource.json`);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, serializeV594BuildReceipt(receipt), { encoding: "utf8", flag: "w" });
  return Object.freeze({ path, receipt });
}

export function loadV594ProfileIdentity({
  root = process.cwd(),
  requested = "standalone-full",
  requireReady = true,
} = {}) {
  if (!TIERS.has(requested)) throw new Error("v594-build-delivery-tier");
  const workspace = resolve(root);
  const sourcePath = resolve(workspace, "docs/release/v594/source-manifest-v594.json");
  const manifestPath = resolve(workspace, "public/data/stellar-relativity-v594/manifest.json");
  const pointerPath = resolve(workspace, "docs/release/v594/capability-pointer-v594.json");
  for (const [label, path] of [["source", sourcePath], ["manifest", manifestPath], ["pointer", pointerPath]]) {
    if (!existsSync(path)) throw new Error(`v594-build-${label}-missing`);
  }
  const source = readJson(sourcePath);
  const manifest = readJson(manifestPath);
  const pointer = readJson(pointerPath);
  assertSeal(source, "receiptSha256", "source");
  assertSeal(manifest, "manifestSha256", "manifest");
  assertSeal(pointer, "pointerSha256", "pointer");
  if (
    source.version !== "v594-source-manifest-v1"
    || source.formalProductPointer !== "v263"
    || manifest.version !== "v594-stellar-relativity-additive-candidate-v1"
    || manifest.formalProductPointer !== "v263"
    || manifest.governance?.sourceManifestSha256 !== source.receiptSha256
    || manifest.governance?.parentV593Immutable !== true
    || manifest.authority?.productionReleaseAuthorized !== false
    || manifest.authority?.scientificPayloadMutationAllowed !== false
    || pointer.formalProductPointer !== "v263"
    || pointer.sourceManifestSha256 !== source.receiptSha256
    || pointer.manifestSha256 !== manifest.manifestSha256
    || pointer.productionPromotionAllowed !== false
  ) throw new Error("v594-build-candidate-binding-invalid");

  for (const file of source.files ?? []) {
    const path = resolve(workspace, file.path);
    if (!existsSync(path)) throw new Error(`v594-build-source-missing:${file.path}`);
    const bytes = readFileSync(path);
    if (bytes.byteLength !== file.bytes || sha256(bytes) !== file.sha256) {
      throw new Error(`v594-build-source-drift:${file.path}`);
    }
  }
  const pendingClosurePaths = (source.closureSourcePaths ?? [])
    .filter((entry) => entry.state !== "present")
    .map((entry) => entry.path);
  if (requireReady) {
    if (pendingClosurePaths.length > 0 || manifest.closure?.toolingComplete !== true) {
      throw new Error(`v594-build-closure-source-pending:${pendingClosurePaths.join(",")}`);
    }
    if (manifest.relativity?.adaptiveConvergenceQualified !== true) {
      throw new Error("v594-build-kerr-adaptive-convergence-not-qualified");
    }
  }

  const deploymentId = deriveV594DeploymentId(source.receiptSha256, manifest.manifestSha256);
  if (pointer.deploymentId !== deploymentId) throw new Error("v594-build-deployment-drift");
  const buildFingerprint = sha256(Buffer.from(
    `v594-page-build-identity-v1\n${source.receiptSha256}\n${manifest.manifestSha256}\n${requested}`,
    "utf8",
  ));
  const suffix = requested === "vercel-lite" ? "lite" : "standalone";
  const closureSlot = `${source.receiptSha256.slice(0, 12)}-${manifest.manifestSha256.slice(0, 12)}`;
  const buildId = deriveV594NextBuildId(buildFingerprint);
  return Object.freeze({
    source,
    manifest,
    pointer,
    requested,
    suffix,
    deploymentId,
    buildFingerprint,
    buildId,
    closureSlot,
    pendingClosurePaths,
  });
}

export function v594ProfileInvocation(identity) {
  const distDir = `.next-atlas-v594-${identity.suffix}-${identity.closureSlot}`;
  return Object.freeze({
    command: process.execPath,
    args: Object.freeze([
      "scripts/build-atlas-profile.mjs",
      "--profile", identity.requested,
      "--dist-dir", distDir,
      "--previous-dist-dir", `${distDir}-previous`,
      "--rotate",
      "--preserve-active-dev",
    ]),
    env: Object.freeze({
      ATLAS_NODE_HEAP_MB: "8192",
      ATLAS_NEXT_BUILD_ID: identity.buildId,
      ATLAS_BUILD_RECEIPT_NAME: `atlas-v594-${identity.suffix}-build-resource.json`,
      ATLAS_CANDIDATE_SOURCE_MANIFEST_SHA256: identity.source.receiptSha256,
      ATLAS_CANDIDATE_DELIVERY_TIER: identity.requested,
      ATLAS_CANDIDATE_DEPLOYMENT_ID: identity.deploymentId,
      ATLAS_PRESERVE_DIST_DIRS: ".next-atlas-v594-standalone-current;.next-atlas-v594-lite-current",
      NEXT_PUBLIC_ATLAS_CELESTIAL_DELIVERY_TIER: identity.requested,
      NEXT_PUBLIC_ATLAS_V594_SOURCE_MANIFEST_SHA256: identity.source.receiptSha256,
      NEXT_PUBLIC_ATLAS_V594_CANDIDATE_MANIFEST_SHA256: identity.manifest.manifestSha256,
      NEXT_PUBLIC_ATLAS_V594_BUILD_FINGERPRINT: identity.buildFingerprint,
      NEXT_PUBLIC_ATLAS_V594_BUILD_ID: identity.buildId,
      NEXT_PUBLIC_ATLAS_V594_DEPLOYMENT_ID: identity.deploymentId,
    }),
    unsetEnv: Object.freeze(["NEXT_DEPLOYMENT_ID"]),
  });
}

export function runV594Profile(requested, { root = process.cwd(), checkOnly = false } = {}) {
  const identity = loadV594ProfileIdentity({ root, requested, requireReady: true });
  const invocation = v594ProfileInvocation(identity);
  if (checkOnly) return Promise.resolve(Object.freeze({ identity, invocation, checked: true }));
  return new Promise((resolvePromise, reject) => {
    const childEnvironment = { ...process.env, ...invocation.env };
    for (const name of invocation.unsetEnv) delete childEnvironment[name];
    const child = spawn(invocation.command, invocation.args, {
      cwd: resolve(root),
      stdio: "inherit",
      windowsHide: true,
      env: childEnvironment,
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`v594-${identity.suffix}-build-signal:${signal}`));
        return;
      }
      if (code !== 0) {
        reject(new Error(`v594-${identity.suffix}-build-exit:${code ?? "null"}`));
        return;
      }
      try {
        const distDir = invocation.args[invocation.args.indexOf("--dist-dir") + 1];
        const emittedBuildId = readFileSync(resolve(root, distDir, "BUILD_ID"), "utf8").trim();
        if (emittedBuildId !== identity.buildId) {
          throw new Error(`v594-build-id-drift:${emittedBuildId || "empty"}`);
        }
        const buildReceipt = writeV594BuildReceipt(identity, { root });
        resolvePromise(Object.freeze({ identity, invocation, buildReceipt, checked: false }));
      } catch (error) {
        reject(error);
      }
    });
  });
}

async function main() {
  const requested = process.argv[2];
  if (!TIERS.has(requested)) {
    throw new Error("usage: build-atlas-v594-profile.mjs <standalone-full|vercel-lite> [--check]");
  }
  const result = await runV594Profile(requested, { checkOnly: process.argv.includes("--check") });
  if (result.checked) {
    console.log(JSON.stringify({
      status: "passed-v594-profile-preflight",
      deploymentId: result.identity.deploymentId,
      requested: result.identity.requested,
      buildId: result.identity.buildId,
      distDir: result.invocation.args[result.invocation.args.indexOf("--dist-dir") + 1],
    }, null, 2));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack : error);
    process.exitCode = 1;
  });
}
