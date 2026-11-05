import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  buildV596SourceManifest,
  canonicalShaV596,
} from "./build-v596-source-manifest.mjs";
import {
  V596_FORMAL_PRODUCT_POINTER,
  V596_OUTPUT_PATHS,
  V596_READY_STATUS,
} from "./build-v596-stellar-visible-leap-candidate.mjs";
import { V596_CLOSURE_SOURCE_PATHS } from "./v596-source-paths.mjs";

const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const BUILD_ID_PATTERN = /^v596b-[0-9a-f]{64}$/;
const TIERS = new Set(["standalone-full", "vercel-lite"]);
const V596_APPROVED_CHECKPOINT_LINEAGE = Object.freeze({
  sourceSetSha256:
    "26c63b2df7aa825270c0ae9fffc8b48225371f311ca8d3837ce37513e20a4bb7",
  buildFingerprint:
    "5f681cdc38f3d669dd0891b5737e90794a8a1e9600941c6a4d34bee8bd46a149",
  checkpointId: "v596-checkpoint-26c63b2df7aa-5f681cdc38f3",
  relationship: "approved-renderer-lineage-not-final-formal-signoff",
});

export const V596_BUILD_RECEIPT_VERSION = "v596-atlas-build-resource-receipt-v1";
export const V596_BUILD_TIMESTAMP_POLICY = "source-manifest-generated-at-explicit";

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function assert(condition, code) {
  if (!condition) throw new Error(code);
}

function readJson(path, label) {
  assert(existsSync(path), `v596-profile-${label}-missing`);
  return JSON.parse(readFileSync(path, "utf8"));
}

function verifySeal(document, field, label) {
  assert(document && typeof document === "object" && !Array.isArray(document),
    `v596-profile-${label}-shape`);
  assert(SHA256_PATTERN.test(document[field] ?? ""), `v596-profile-${label}-seal-value`);
  const unsigned = { ...document };
  const declared = unsigned[field];
  delete unsigned[field];
  assert(canonicalShaV596(unsigned) === declared, `v596-profile-${label}-seal-invalid`);
}

export function deriveV596DeploymentId(sourceManifestSha256, candidateManifestSha256) {
  assert(SHA256_PATTERN.test(sourceManifestSha256 ?? ""), "v596-profile-source-sha");
  assert(SHA256_PATTERN.test(candidateManifestSha256 ?? ""), "v596-profile-candidate-sha");
  return `v596-${sourceManifestSha256.slice(0, 12)}-${candidateManifestSha256.slice(0, 12)}`;
}

export function deriveV596BuildFingerprint(sourceManifestSha256, candidateManifestSha256, tier) {
  assert(SHA256_PATTERN.test(sourceManifestSha256 ?? ""), "v596-profile-source-sha");
  assert(SHA256_PATTERN.test(candidateManifestSha256 ?? ""), "v596-profile-candidate-sha");
  assert(TIERS.has(tier), "v596-profile-tier");
  return sha256(Buffer.from(
    `v596-page-build-identity-v1\n${sourceManifestSha256}\n${candidateManifestSha256}\n${tier}`,
    "utf8",
  ));
}

export function deriveV596BuildId(buildFingerprint) {
  assert(SHA256_PATTERN.test(buildFingerprint ?? ""), "v596-profile-fingerprint-sha");
  return `v596b-${buildFingerprint}`;
}

export function deriveV596ClosureSourceSha(sourcePaths) {
  assert(Array.isArray(sourcePaths), "v596-profile-closure-source-list");
  return canonicalShaV596({ version: "v596-closure-source-list-v1", value: sourcePaths });
}

export function profileWrapperArtifactV596(root = process.cwd()) {
  const path = "scripts/build-atlas-v596-profile.mjs";
  const bytes = readFileSync(resolve(root, path));
  return Object.freeze({ path, bytes: bytes.byteLength, sha256: sha256(bytes) });
}

export function createV596BuildReceipt(identity, options = {}) {
  const root = resolve(options.root ?? process.cwd());
  const closureSourcePaths = identity.source?.closureSourcePaths;
  assert(Array.isArray(closureSourcePaths)
    && closureSourcePaths.map((entry) => entry.path).join("|")
      === V596_CLOSURE_SOURCE_PATHS.join("|")
    && closureSourcePaths.every((entry) => entry.state === "present"
      && Number.isInteger(entry.bytes) && entry.bytes > 0
      && SHA256_PATTERN.test(entry.sha256 ?? "")),
  "v596-profile-closure-source-order");
  const unsigned = {
    version: V596_BUILD_RECEIPT_VERSION,
    status: "passed",
    generatedAt: identity.source.generatedAt,
    timestampPolicy: V596_BUILD_TIMESTAMP_POLICY,
    sealAlgorithm: "sha256-canonical-json-object-keys-v1",
    sourceManifestSha256: identity.source.receiptSha256,
    candidateManifestSha256: identity.manifest.manifestSha256,
    buildId: identity.buildId,
    buildFingerprint: identity.buildFingerprint,
    deploymentId: identity.deploymentId,
    formalProductPointer: V596_FORMAL_PRODUCT_POINTER,
    deliveryTier: identity.requested,
    rendererLineage: {
      ...V596_APPROVED_CHECKPOINT_LINEAGE,
      runtimeTier: identity.requested,
      formalEvidence: false,
      inheritedAsFinalHumanSignoff: false,
    },
    profileWrapper: options.profileWrapper ?? profileWrapperArtifactV596(root),
    closureSourceSha256: deriveV596ClosureSourceSha(closureSourcePaths),
    parentV595: {
      sourceManifestSha256: identity.source.baseSourceManifestSha256,
      candidateManifestSha256: identity.source.baseCandidateManifestSha256,
      relationship: "sealed-parent-not-current-build",
    },
    authority: {
      scientificAuthorityGranted: false,
      scientificPayloadMutationAllowed: false,
      measuredAuthorityGranted: false,
      gpuAuthorityGranted: false,
      resolvedSurfaceAuthorityGranted: false,
      observationTextureAuthorityGranted: false,
      radiativeTransferGranted: false,
      grmhdGranted: false,
      productionPromotionAllowed: false,
    },
  };
  assert(BUILD_ID_PATTERN.test(unsigned.buildId), "v596-profile-build-id-contract");
  return Object.freeze({ ...unsigned, receiptSha256: canonicalShaV596(unsigned) });
}

export function serializeV596BuildReceipt(receipt) {
  return `${JSON.stringify(receipt, null, 2)}\n`;
}

export function writeV596BuildReceipt(identity, options = {}) {
  const root = resolve(options.root ?? process.cwd());
  const receipt = createV596BuildReceipt(identity, { ...options, root });
  const path = resolve(root, "dist", "release", `atlas-v596-${identity.suffix}-build-resource.json`);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, serializeV596BuildReceipt(receipt), { encoding: "utf8", flag: "w" });
  return Object.freeze({ path, receipt });
}

export function loadV596ProfileIdentity({
  root = process.cwd(),
  artifactRoot = root,
  requested = "standalone-full",
  requireReady = true,
} = {}) {
  assert(TIERS.has(requested), "v596-profile-tier");
  const workspace = resolve(root);
  const artifacts = resolve(artifactRoot);
  const source = readJson(resolve(artifacts, V596_OUTPUT_PATHS.source), "source");
  const manifest = readJson(resolve(artifacts, V596_OUTPUT_PATHS.manifest), "manifest");
  const pointer = readJson(resolve(artifacts, V596_OUTPUT_PATHS.pointer), "pointer");
  verifySeal(source, "receiptSha256", "source");
  verifySeal(manifest, "manifestSha256", "manifest");
  verifySeal(pointer, "pointerSha256", "pointer");
  const rebuiltSource = buildV596SourceManifest(workspace, { generatedAt: source.generatedAt });
  assert(canonicalShaV596(source) === canonicalShaV596(rebuiltSource),
    "v596-profile-source-byte-boundary-drift");
  assert(source.version === "v596-source-manifest-v1"
    && source.formalProductPointer === V596_FORMAL_PRODUCT_POINTER
    && manifest.version === "v596-stellar-visible-leap-additive-candidate-v1"
    && manifest.formalProductPointer === V596_FORMAL_PRODUCT_POINTER
    && manifest.governance?.sourceManifestSha256 === source.receiptSha256
    && manifest.governance?.parentV595Immutable === true
    && manifest.governance?.priorV595HumanDecisionInherited === false
    && manifest.governance?.checkpointDecisionInheritedAsFinalSignoff === false
    && manifest.authority?.productionReleaseAuthorized === false
    && manifest.authority?.scientificPayloadMutationAllowed === false
    && pointer.formalProductPointer === V596_FORMAL_PRODUCT_POINTER
    && pointer.sourceManifestSha256 === source.receiptSha256
    && pointer.manifestSha256 === manifest.manifestSha256
    && pointer.productionPromotionAllowed === false,
  "v596-profile-candidate-binding-invalid");
  if (requireReady) {
    assert(source.pendingClosurePaths?.length === 0
      && source.closureSourcePaths?.every((entry) => entry.state === "present")
      && manifest.status === V596_READY_STATUS
      && manifest.closure?.toolingComplete === true,
    "v596-profile-closure-source-pending");
  }
  const deploymentId = deriveV596DeploymentId(source.receiptSha256, manifest.manifestSha256);
  assert(pointer.deploymentId === deploymentId, "v596-profile-deployment-drift");
  const buildFingerprint = deriveV596BuildFingerprint(
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
    buildId: deriveV596BuildId(buildFingerprint),
    closureSlot,
    pendingClosurePaths: source.pendingClosurePaths ?? [],
  });
}

export function v596ProfileInvocation(identity, { root = process.cwd() } = {}) {
  const distDir = `.next-atlas-v596-${identity.suffix}-${identity.closureSlot}`;
  const temporaryDirectory = resolve(root, "..", "v596-temp-runtime-native-final");
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
      ATLAS_BUILD_CPUS: "4",
      ATLAS_NEXT_BUILD_ID: identity.buildId,
      ATLAS_BUILD_RECEIPT_NAME: `atlas-v596-${identity.suffix}-build-resource.json`,
      ATLAS_CANDIDATE_SOURCE_MANIFEST_SHA256: identity.source.receiptSha256,
      ATLAS_CANDIDATE_DELIVERY_TIER: identity.requested,
      ATLAS_CANDIDATE_DEPLOYMENT_ID: identity.deploymentId,
      ATLAS_PRESERVE_DIST_DIRS: ".next-atlas-v596-standalone-current;.next-atlas-v596-lite-current",
      NEXT_PUBLIC_ATLAS_CELESTIAL_DELIVERY_TIER: identity.requested,
      NEXT_PUBLIC_ATLAS_V596_DELIVERY_TIER: identity.requested,
      NEXT_PUBLIC_ATLAS_V596_SOURCE_MANIFEST_SHA256: identity.source.receiptSha256,
      NEXT_PUBLIC_ATLAS_V596_CANDIDATE_MANIFEST_SHA256: identity.manifest.manifestSha256,
      NEXT_PUBLIC_ATLAS_V596_BUILD_FINGERPRINT: identity.buildFingerprint,
      NEXT_PUBLIC_ATLAS_V596_BUILD_ID: identity.buildId,
      NEXT_PUBLIC_ATLAS_V596_DEPLOYMENT_ID: identity.deploymentId,
      NEXT_PUBLIC_ATLAS_V596_CHECKPOINT_SOURCE_SET_SHA256:
        V596_APPROVED_CHECKPOINT_LINEAGE.sourceSetSha256,
      NEXT_PUBLIC_ATLAS_V596_CHECKPOINT_BUILD_FINGERPRINT:
        V596_APPROVED_CHECKPOINT_LINEAGE.buildFingerprint,
      NEXT_PUBLIC_ATLAS_V596_CHECKPOINT_ID:
        V596_APPROVED_CHECKPOINT_LINEAGE.checkpointId,
      NEXT_PUBLIC_ATLAS_V596_CHECKPOINT_RUNTIME_TIER: identity.requested,
      TEMP: temporaryDirectory,
      TMP: temporaryDirectory,
    }),
    unsetEnv: Object.freeze([
      "NEXT_DEPLOYMENT_ID",
      "NEXT_PUBLIC_ATLAS_V594_SOURCE_MANIFEST_SHA256",
      "NEXT_PUBLIC_ATLAS_V594_CANDIDATE_MANIFEST_SHA256",
      "NEXT_PUBLIC_ATLAS_V594_BUILD_FINGERPRINT",
      "NEXT_PUBLIC_ATLAS_V594_BUILD_ID",
      "NEXT_PUBLIC_ATLAS_V594_DEPLOYMENT_ID",
      "NEXT_PUBLIC_ATLAS_V595_SOURCE_MANIFEST_SHA256",
      "NEXT_PUBLIC_ATLAS_V595_CANDIDATE_MANIFEST_SHA256",
      "NEXT_PUBLIC_ATLAS_V595_BUILD_FINGERPRINT",
      "NEXT_PUBLIC_ATLAS_V595_BUILD_ID",
      "NEXT_PUBLIC_ATLAS_V595_DEPLOYMENT_ID",
    ]),
  });
}

export function runV596Profile(requested, { root = process.cwd(), checkOnly = false } = {}) {
  const identity = loadV596ProfileIdentity({ root, requested, requireReady: true });
  const invocation = v596ProfileInvocation(identity, { root });
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
      if (signal) return reject(new Error(`v596-${identity.suffix}-build-signal:${signal}`));
      if (code !== 0) return reject(new Error(`v596-${identity.suffix}-build-exit:${code ?? "null"}`));
      try {
        const distDir = invocation.args[invocation.args.indexOf("--dist-dir") + 1];
        const emittedBuildId = readFileSync(resolve(root, distDir, "BUILD_ID"), "utf8").trim();
        assert(emittedBuildId === identity.buildId,
          `v596-profile-build-id-drift:${emittedBuildId || "empty"}`);
        const buildReceipt = writeV596BuildReceipt(identity, { root });
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
    "usage: build-atlas-v596-profile.mjs <standalone-full|vercel-lite> [--check]");
  const result = await runV596Profile(requested, { checkOnly: process.argv.includes("--check") });
  if (result.checked) process.stdout.write(`${JSON.stringify({
    status: "passed-v596-profile-preflight",
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
