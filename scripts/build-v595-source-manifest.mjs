import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import {
  V595_ALL_RESERVED_SOURCE_PATHS,
  V595_BASE_SOURCE_MANIFEST_PATH,
  V595_CLOSURE_SOURCE_PATHS,
  V595_DELTA_SOURCE_PATHS,
  V595_PARENT_ARTIFACT_PATHS,
  V595_PARENT_VERSION,
} from "./v595-source-paths.mjs";

const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const V594_SOURCE_SHA256 = "6599398a6fab78a1367b234d3a3e9ed428027879a1df4838f76b97ff279b981f";
const V594_CANDIDATE_SHA256 = "e92484940ba9a812d0936bbd67b29c4cb3c3ac20d9477cd04a949e35efd33bad";
const V594_RELEASE_DOSSIER_SHA256 = "a70645f4a124b6fb6d1eb3a061eb15cf66618154c1a2884acc1730cb41bd3865";
const V594_RESEAL_RECEIPT_SHA256 = "406bb72a58aade66c877c75f4bea220e8b42181217efee1e4d9a1d20b46e4664";
const DEFAULT_OUTPUT_ROOT = "tmp/v595-source-manifest-preflight";

export function canonicalizeV595(value) {
  if (Array.isArray(value)) return value.map(canonicalizeV595);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, canonicalizeV595(value[key])]),
  );
}

export function canonicalShaV595(value) {
  return createHash("sha256")
    .update(JSON.stringify(canonicalizeV595(value)), "utf8")
    .digest("hex");
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function assertWorkspaceFile(root, relativePath, label) {
  const absolute = resolve(root, relativePath);
  const boundary = relative(resolve(root), absolute);
  if (boundary === "" || boundary === ".." || boundary.startsWith(`..${sep}`) || isAbsolute(boundary)) {
    throw new Error(`v595-workspace-boundary:${label}:${relativePath}`);
  }
  if (!existsSync(absolute) || !statSync(absolute).isFile()) {
    throw new Error(`v595-required-file-missing:${label}:${relativePath}`);
  }
  return absolute;
}

function fileRecord(root, relativePath, label = "source") {
  const absolute = assertWorkspaceFile(root, relativePath, label);
  const bytes = readFileSync(absolute);
  return Object.freeze({ path: relativePath, bytes: bytes.byteLength, sha256: sha256(bytes) });
}

export function buildV595SourceBoundaryRecords(root, paths = V595_DELTA_SOURCE_PATHS) {
  return Object.freeze(paths.map((path) => fileRecord(resolve(root), path, "delta-source"))
    .sort((left, right) => left.path.localeCompare(right.path)));
}

function assertCanonicalSeal(document, field, label) {
  if (!document || typeof document !== "object" || !SHA256_PATTERN.test(document[field] ?? "")) {
    throw new Error(`v595-seal-shape:${label}`);
  }
  const unsigned = { ...document };
  const declared = unsigned[field];
  delete unsigned[field];
  if (canonicalShaV595(unsigned) !== declared) throw new Error(`v595-seal-invalid:${label}`);
}

function readSealedDocument(root, relativePath, field, label) {
  const absolute = assertWorkspaceFile(root, relativePath, label);
  const document = readJson(absolute);
  assertCanonicalSeal(document, field, label);
  return document;
}

function assertFalseAuthority(authority, fields, label) {
  if (!authority || typeof authority !== "object") throw new Error(`v595-authority-missing:${label}`);
  for (const field of fields) {
    if (authority[field] !== false) throw new Error(`v595-authority-not-denied:${label}:${field}`);
  }
}

function loadAndVerifyV594Base(root, allowedDriftPaths = []) {
  const source = readSealedDocument(root, V595_PARENT_ARTIFACT_PATHS.sourceManifest, "receiptSha256", "v594-source");
  const candidate = readSealedDocument(root, V595_PARENT_ARTIFACT_PATHS.candidateManifest, "manifestSha256", "v594-candidate");
  const release = readSealedDocument(root, V595_PARENT_ARTIFACT_PATHS.releaseDossier, "dossierSha256", "v594-release");
  const reseal = readSealedDocument(root, V595_PARENT_ARTIFACT_PATHS.resealReceipt, "receiptSha256", "v594-reseal");

  if (
    source.version !== "v594-source-manifest-v1"
    || source.status !== "complete-current-implementation-and-closure-tools"
    || source.formalProductPointer !== "v263"
    || source.receiptSha256 !== V594_SOURCE_SHA256
    || !Array.isArray(source.files)
    || source.files.length !== 107
    || !Array.isArray(source.closureSourcePaths)
    || source.closureSourcePaths.length !== 8
    || source.pendingClosurePaths?.length !== 0
  ) throw new Error("v595-v594-source-base-invalid");

  for (const record of [...source.files, ...source.closureSourcePaths]) {
    if (!record || typeof record.path !== "string" || !SHA256_PATTERN.test(record.sha256 ?? "") || !Number.isInteger(record.bytes)) {
      throw new Error("v595-v594-source-record-invalid");
    }
    const current = fileRecord(root, record.path, "v594-base");
    if (current.bytes !== record.bytes || current.sha256 !== record.sha256) {
      if (allowedDriftPaths.includes(record.path)) continue;
      throw new Error(`v595-v594-base-byte-drift:${record.path}`);
    }
  }

  if (
    candidate.version !== "v594-stellar-relativity-additive-candidate-v1"
    || candidate.manifestSha256 !== V594_CANDIDATE_SHA256
    || candidate.formalProductPointer !== "v263"
    || release.dossierSha256 !== V594_RELEASE_DOSSIER_SHA256
    || reseal.receiptSha256 !== V594_RESEAL_RECEIPT_SHA256
    || reseal.status !== "passed-double-byte-identical-reseal"
    || reseal.byteIdentical !== true
    || release.candidate?.candidateManifestSha256 !== candidate.manifestSha256
    || release.candidate?.sourceManifestSha256 !== source.receiptSha256
    || release.candidate?.formalProductPointer !== "v263"
    || release.productionPromotionAllowed !== false
    || reseal.productionPromotionAllowed !== false
  ) throw new Error("v595-v594-parent-identity-invalid");

  assertFalseAuthority(release.authority, [
    "scientificPayloadMutationAllowed",
    "scientificAuthorityGranted",
    "measuredAuthorityGranted",
    "gpuAuthorityGranted",
    "productionReleaseAuthorized",
  ], "v594-release");
  assertFalseAuthority(reseal.authority, [
    "scientificPayloadMutationAllowed",
    "measuredAuthorityGranted",
    "gpuAuthorityGranted",
    "productionPromotionAllowed",
  ], "v594-reseal");

  return Object.freeze({
    sourceManifestSha256: source.receiptSha256,
    candidateManifestSha256: candidate.manifestSha256,
    releaseDossierSha256: release.dossierSha256,
    resealReceiptSha256: reseal.receiptSha256,
    sourceFiles: source.files.length,
    closureSourcePaths: source.closureSourcePaths.length,
  });
}

function assertDeltaContract(root, base) {
  const basePaths = new Set([...base.files ?? [], ...base.closureSourcePaths ?? []].map((record) => record.path));
  for (const path of V595_ALL_RESERVED_SOURCE_PATHS) {
    if (basePaths.has(path) && !V595_DELTA_SOURCE_PATHS.includes(path)) {
      throw new Error(`v595-unlisted-base-drift:${path}`);
    }
  }
  for (const path of V595_DELTA_SOURCE_PATHS) assertWorkspaceFile(root, path, "delta-source");
  if (new Set(V595_DELTA_SOURCE_PATHS).size !== V595_DELTA_SOURCE_PATHS.length) {
    throw new Error("v595-delta-duplicate");
  }
}

export function buildV595SourceManifest(root = process.cwd(), options = {}) {
  const workspaceRoot = resolve(root);
  const base = readSealedDocument(workspaceRoot, V595_BASE_SOURCE_MANIFEST_PATH, "receiptSha256", "v594-source");
  const parent = loadAndVerifyV594Base(workspaceRoot, V595_DELTA_SOURCE_PATHS);
  assertDeltaContract(workspaceRoot, base);
  const deltaRecords = buildV595SourceBoundaryRecords(workspaceRoot);
  const generatedAt = options.generatedAt ?? process.env.ATLAS_V595_GENERATED_AT ?? "2026-08-28T00:00:00.000Z";
  const closureSourcePaths = V595_CLOSURE_SOURCE_PATHS.map((path) => (
    existsSync(resolve(workspaceRoot, path))
      ? Object.freeze({ ...fileRecord(workspaceRoot, path, "closure-source"), state: "present" })
      : Object.freeze({ path, state: "pending" })
  ));
  const pendingClosurePaths = closureSourcePaths
    .filter((entry) => entry.state === "pending")
    .map((entry) => entry.path);
  const manifest = {
    version: "v595-source-manifest-v1",
    generatedAt,
    identityStage: "ready-for-v595-delta-source-identity",
    status: pendingClosurePaths.length === 0
      ? "complete-explicit-v595-delta-and-closure-boundary"
      : "complete-explicit-v595-delta-boundary-closure-reservations-pending",
    sealAlgorithm: "sha256-canonical-json-object-keys-v1",
    formalProductPointer: "v263",
    parentVersion: V595_PARENT_VERSION,
    baseSourceManifestSha256: parent.sourceManifestSha256,
    baseCandidateManifestSha256: parent.candidateManifestSha256,
    baseReleaseDossierSha256: parent.releaseDossierSha256,
    baseResealReceiptSha256: parent.resealReceiptSha256,
    parentV594: {
      ...parent,
      sourceManifestPath: V595_PARENT_ARTIFACT_PATHS.sourceManifest,
      candidateManifestPath: V595_PARENT_ARTIFACT_PATHS.candidateManifest,
      releaseDossierPath: V595_PARENT_ARTIFACT_PATHS.releaseDossier,
      resealReceiptPath: V595_PARENT_ARTIFACT_PATHS.resealReceipt,
    },
    baseCounts: {
      files: parent.sourceFiles,
      closureSourcePaths: parent.closureSourcePaths,
    },
    files: deltaRecords,
    closureSourcePaths,
    pendingClosurePaths,
  };
  return Object.freeze({ ...manifest, receiptSha256: canonicalShaV595(manifest) });
}

export async function writeV595SourceManifest(root = process.cwd(), outputRoot = DEFAULT_OUTPUT_ROOT, options = {}) {
  const workspaceRoot = resolve(root);
  const outputDirectory = resolve(workspaceRoot, outputRoot);
  const formalOutput = resolve(workspaceRoot, "docs/release/v595");
  if (outputDirectory === formalOutput || outputDirectory.startsWith(`${formalOutput}${sep}`)) {
    throw new Error("v595-formal-output-forbidden");
  }
  const manifest = buildV595SourceManifest(workspaceRoot, options);
  await mkdir(outputDirectory, { recursive: true });
  const outputPath = resolve(outputDirectory, "source-manifest-v595.json");
  await writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return Object.freeze({ outputPath, manifest });
}

function parseArgs(argv) {
  const args = { root: process.cwd(), outputRoot: DEFAULT_OUTPUT_ROOT };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--root") args.root = argv[++index];
    else if (arg === "--output-root") args.outputRoot = argv[++index];
    else if (arg === "--generated-at") args.generatedAt = argv[++index];
    else if (arg === "--help") return null;
    else throw new Error(`v595-unknown-arg:${arg}`);
  }
  return args;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2));
  if (!args) {
    console.log("Usage: node scripts/build-v595-source-manifest.mjs [--root PATH] [--output-root PATH] [--generated-at ISO]");
  } else {
    const result = await writeV595SourceManifest(args.root, args.outputRoot, args);
    console.log(JSON.stringify({
      status: "v595-source-manifest-preflight-written",
      output: result.outputPath,
      receiptSha256: result.manifest.receiptSha256,
      parentVersion: result.manifest.parentVersion,
      deltaFiles: result.manifest.files.length,
    }, null, 2));
  }
}
