import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  buildV595SourceManifest,
  canonicalShaV595,
} from "./build-v595-source-manifest.mjs";
import {
  V595_FORMAL_PRODUCT_POINTER,
  V595_OUTPUT_PATHS,
  V595_READY_STATUS,
} from "./build-v595-stellar-relativity-candidate.mjs";
import { V595_CLOSURE_SOURCE_PATHS } from "./v595-source-paths.mjs";

const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const BUILD_ID_PATTERN = /^v595b-[0-9a-f]{64}$/;
const TIERS = new Set(["standalone-full", "vercel-lite"]);

export const V595_BUILD_RECEIPT_VERSION = "v595-atlas-build-resource-receipt-v1";
export const V595_BUILD_TIMESTAMP_POLICY = "source-manifest-generated-at-explicit";

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function assert(condition, code) {
  if (!condition) throw new Error(code);
}

function readJson(path, label) {
  assert(existsSync(path), `v595-profile-${label}-missing`);
  return JSON.parse(readFileSync(path, "utf8"));
}

function verifySeal(document, field, label) {
  assert(document && typeof document === "object" && !Array.isArray(document),
    `v595-profile-${label}-shape`);
  assert(SHA256_PATTERN.test(document[field] ?? ""), `v595-profile-${label}-seal-value`);
  const unsigned = { ...document };
  const declared = unsigned[field];
  delete unsigned[field];
  assert(canonicalShaV595(unsigned) === declared, `v595-profile-${label}-seal-invalid`);
}

export function deriveV595DeploymentId(sourceManifestSha256, candidateManifestSha256) {
  assert(SHA256_PATTERN.test(sourceManifestSha256 ?? ""), "v595-profile-source-sha");
  assert(SHA256_PATTERN.test(candidateManifestSha256 ?? ""), "v595-profile-candidate-sha");
  return `v595-${sourceManifestSha256.slice(0, 12)}-${candidateManifestSha256.slice(0, 12)}`;
}

export function deriveV595BuildFingerprint(sourceManifestSha256, candidateManifestSha256, tier) {
  assert(SHA256_PATTERN.test(sourceManifestSha256 ?? ""), "v595-profile-source-sha");
  assert(SHA256_PATTERN.test(candidateManifestSha256 ?? ""), "v595-profile-candidate-sha");
  assert(TIERS.has(tier), "v595-profile-tier");
  return sha256(Buffer.from(
    `v595-page-build-identity-v1\n${sourceManifestSha256}\n${candidateManifestSha256}\n${tier}`,
    "utf8",
  ));
}

export function deriveV595BuildId(buildFingerprint) {
  assert(SHA256_PATTERN.test(buildFingerprint ?? ""), "v595-profile-fingerprint-sha");
  return `v595b-${buildFingerprint}`;
}

export function deriveV595ClosureSourceSha(sourcePaths) {
  assert(Array.isArray(sourcePaths), "v595-profile-closure-source-list");
  return canonicalShaV595({ version: "v595-closure-source-list-v1", value: sourcePaths });
}

export function profileWrapperArtifactV595(root = process.cwd()) {
  const path = "scripts/build-atlas-v595-profile.mjs";
  const bytes = readFileSync(resolve(root, path));
  return Object.freeze({ path, bytes: bytes.byteLength, sha256: sha256(bytes) });
}

export function createV595BuildReceipt(identity, options = {}) {
  const root = resolve(options.root ?? process.cwd());
  const closureSourcePaths = identity.source?.closureSourcePaths;
  assert(Array.isArray(closureSourcePaths)
    && closureSourcePaths.map((entry) => entry.path).join("|")
      === V595_CLOSURE_SOURCE_PATHS.join("|")
    && closureSourcePaths.every((entry) => entry.state === "present"
      && Number.isInteger(entry.bytes) && entry.bytes > 0
      && SHA256_PATTERN.test(entry.sha256 ?? "")),
  "v595-profile-closure-source-order");
  const unsigned = {
    version: V595_BUILD_RECEIPT_VERSION,
    status: "passed",
    generatedAt: identity.source.generatedAt,
    timestampPolicy: V595_BUILD_TIMESTAMP_POLICY,
    sealAlgorithm: "sha256-canonical-json-object-keys-v1",
    sourceManifestSha256: identity.source.receiptSha256,
    candidateManifestSha256: identity.manifest.manifestSha256,
    buildId: identity.buildId,
    buildFingerprint: identity.buildFingerprint,
    deploymentId: identity.deploymentId,
    formalProductPointer: V595_FORMAL_PRODUCT_POINTER,
    deliveryTier: identity.requested,
    profileWrapper: options.profileWrapper ?? profileWrapperArtifactV595(root),
    closureSourceSha256: deriveV595ClosureSourceSha(closureSourcePaths),
    parentV594: {
      sourceManifestSha256: identity.source.baseSourceManifestSha256,
      candidateManifestSha256: identity.source.baseCandidateManifestSha256,
      relationship: "sealed-parent-not-current-build",
    },
    authority: {
      scientificAuthorityGranted: false,
      measuredAuthorityGranted: false,
      gpuAuthorityGranted: false,
      productionPromotionAllowed: false,
    },
  };
  assert(BUILD_ID_PATTERN.test(unsigned.buildId), "v595-profile-build-id-contract");
  return Object.freeze({ ...unsigned, receiptSha256: canonicalShaV595(unsigned) });
}

export function serializeV595BuildReceipt(receipt) {
  return `${JSON.stringify(receipt, null, 2)}\n`;
}

export function writeV595BuildReceipt(identity, options = {}) {
  const root = resolve(options.root ?? process.cwd());
  const receipt = createV595BuildReceipt(identity, { ...options, root });
  const path = resolve(root, "dist", "release", `atlas-v595-${identity.suffix}-build-resource.json`);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, serializeV595BuildReceipt(receipt), { encoding: "utf8", flag: "w" });
  return Object.freeze({ path, receipt });
}

export function loadV595ProfileIdentity({
  root = process.cwd(),
  artifactRoot = root,
  requested = "standalone-full",
  requireReady = true,
} = {}) {
  assert(TIERS.has(requested), "v595-profile-tier");
  const workspace = resolve(root);
  const artifacts = resolve(artifactRoot);
  const source = readJson(resolve(artifacts, V595_OUTPUT_PATHS.source), "source");
  const manifest = readJson(resolve(artifacts, V595_OUTPUT_PATHS.manifest), "manifest");
  const pointer = readJson(resolve(artifacts, V595_OUTPUT_PATHS.pointer), "pointer");
  verifySeal(source, "receiptSha256", "source");
  verifySeal(manifest, "manifestSha256", "manifest");
  verifySeal(pointer, "pointerSha256", "pointer");
  const rebuiltSource = buildV595SourceManifest(workspace, { generatedAt: source.generatedAt });
  assert(canonicalShaV595(source) === canonicalShaV595(rebuiltSource),
    "v595-profile-source-byte-boundary-drift");
  assert(source.version === "v595-source-manifest-v1"
    && source.formalProductPointer === V595_FORMAL_PRODUCT_POINTER
    && manifest.version === "v595-stellar-relativity-additive-candidate-v1"
    && manifest.formalProductPointer === V595_FORMAL_PRODUCT_POINTER
    && manifest.governance?.sourceManifestSha256 === source.receiptSha256
    && manifest.governance?.parentV594Immutable === true
    && manifest.governance?.priorV594HumanDecisionInherited === false
    && manifest.authority?.productionReleaseAuthorized === false
    && manifest.authority?.scientificPayloadMutationAllowed === false
    && pointer.formalProductPointer === V595_FORMAL_PRODUCT_POINTER
    && pointer.sourceManifestSha256 === source.receiptSha256
    && pointer.manifestSha256 === manifest.manifestSha256
    && pointer.productionPromotionAllowed === false,
  "v595-profile-candidate-binding-invalid");
  if (requireReady) {
    assert(source.pendingClosurePaths?.length === 0
      && source.closureSourcePaths?.every((entry) => entry.state === "present")
      && manifest.status === V595_READY_STATUS
      && manifest.closure?.toolingComplete === true,
    "v595-profile-closure-source-pending");
  }
  const deploymentId = deriveV595DeploymentId(source.receiptSha256, manifest.manifestSha256);
  assert(pointer.deploymentId === deploymentId, "v595-profile-deployment-drift");
  const buildFingerprint = deriveV595BuildFingerprint(
    source.receiptSha256,
    manifest.manifestSha256,
    requested,
  );
  const suffix = requested === "vercel-lite" ? "lite" : "standalone";
  const closureSlot = `${source.receiptSha256.slice(0, 12)}-${manifest.manifestSha256.slice(0, 12)}`;
  return Object.freeze({
    source,
    manifest,
    pointer,
    requested,
    suffix,
    deploymentId,
    buildFingerprint,
    buildId: deriveV595BuildId(buildFingerprint),
    closureSlot,
    pendingClosurePaths: source.pendingClosurePaths ?? [],
  });
}

export function v595ProfileInvocation(identity) {
  const distDir = `.next-atlas-v595-${identity.suffix}-${identity.closureSlot}`;
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
      ATLAS_BUILD_RECEIPT_NAME: `atlas-v595-${identity.suffix}-build-resource.json`,
      ATLAS_CANDIDATE_SOURCE_MANIFEST_SHA256: identity.source.receiptSha256,
      ATLAS_CANDIDATE_DELIVERY_TIER: identity.requested,
      ATLAS_CANDIDATE_DEPLOYMENT_ID: identity.deploymentId,
      ATLAS_PRESERVE_DIST_DIRS: ".next-atlas-v595-standalone-current;.next-atlas-v595-lite-current",
      NEXT_PUBLIC_ATLAS_CELESTIAL_DELIVERY_TIER: identity.requested,
      NEXT_PUBLIC_ATLAS_V595_SOURCE_MANIFEST_SHA256: identity.source.receiptSha256,
      NEXT_PUBLIC_ATLAS_V595_CANDIDATE_MANIFEST_SHA256: identity.manifest.manifestSha256,
      NEXT_PUBLIC_ATLAS_V595_BUILD_FINGERPRINT: identity.buildFingerprint,
      NEXT_PUBLIC_ATLAS_V595_BUILD_ID: identity.buildId,
      NEXT_PUBLIC_ATLAS_V595_DEPLOYMENT_ID: identity.deploymentId,
    }),
    unsetEnv: Object.freeze([
      "NEXT_DEPLOYMENT_ID",
      "NEXT_PUBLIC_ATLAS_V594_SOURCE_MANIFEST_SHA256",
      "NEXT_PUBLIC_ATLAS_V594_CANDIDATE_MANIFEST_SHA256",
      "NEXT_PUBLIC_ATLAS_V594_BUILD_FINGERPRINT",
      "NEXT_PUBLIC_ATLAS_V594_BUILD_ID",
      "NEXT_PUBLIC_ATLAS_V594_DEPLOYMENT_ID",
    ]),
  });
}

export function runV595Profile(requested, { root = process.cwd(), checkOnly = false } = {}) {
  const identity = loadV595ProfileIdentity({ root, requested, requireReady: true });
  const invocation = v595ProfileInvocation(identity);
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
      if (signal) return reject(new Error(`v595-${identity.suffix}-build-signal:${signal}`));
      if (code !== 0) return reject(new Error(`v595-${identity.suffix}-build-exit:${code ?? "null"}`));
      try {
        const distDir = invocation.args[invocation.args.indexOf("--dist-dir") + 1];
        const emittedBuildId = readFileSync(resolve(root, distDir, "BUILD_ID"), "utf8").trim();
        assert(emittedBuildId === identity.buildId,
          `v595-profile-build-id-drift:${emittedBuildId || "empty"}`);
        const buildReceipt = writeV595BuildReceipt(identity, { root });
        resolvePromise(Object.freeze({ identity, invocation, buildReceipt, checked: false }));
      } catch (error) {
        reject(error);
      }
    });
  });
}

async function main() {
  const requested = process.argv[2];
  assert(TIERS.has(requested),
    "usage: build-atlas-v595-profile.mjs <standalone-full|vercel-lite> [--check]");
  const result = await runV595Profile(requested, { checkOnly: process.argv.includes("--check") });
  if (result.checked) process.stdout.write(`${JSON.stringify({
    status: "passed-v595-profile-preflight",
    deploymentId: result.identity.deploymentId,
    requested: result.identity.requested,
    buildId: result.identity.buildId,
    distDir: result.invocation.args[result.invocation.args.indexOf("--dist-dir") + 1],
  }, null, 2)}\n`);
}

if (process.argv[1]
  && pathToFileURL(resolve(process.argv[1])).href === pathToFileURL(fileURLToPath(import.meta.url)).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack : String(error));
    process.exitCode = 1;
  });
}
