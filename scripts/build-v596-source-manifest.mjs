import { createHash } from "node:crypto";
import {
  existsSync,
  lstatSync,
  readFileSync,
  realpathSync,
} from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import {
  V596_ALL_RESERVED_SOURCE_PATHS,
  V596_BASE_SOURCE_MANIFEST_PATH,
  V596_CLOSURE_SOURCE_PATHS,
  V596_DELTA_SOURCE_PATHS,
  V596_PARENT_ARTIFACT_PATHS,
  V596_PARENT_RETIRED_SOURCE_DISPOSITIONS,
  V596_PARENT_RETIRED_SOURCE_PATHS,
  V596_PARENT_VERSION,
} from "./v596-source-paths.mjs";

const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const V595_SOURCE_SHA256 =
  "e06febbe18cd65ad8d24bb618d09c93032ca7fa02d5d69e2d916ea3b8f802186";
const V595_CANDIDATE_SHA256 =
  "332b5ce6a0b5f26a4f9553d44cb9d0eb8d5cc169ae3242b4cd83259b669abae1";
const V595_RELEASE_DOSSIER_SHA256 =
  "ea6a5247cf9708162df26acead217e23159f0d8793466dd98071888831866765";
const V595_RESEAL_RECEIPT_SHA256 =
  "ccf9c5cbfc0418c25295a51fde4efdb1364d9a7206dfa056eb004fb53b5c9a13";
const DEFAULT_OUTPUT_ROOT = "tmp/v596-source-manifest-preflight";

export function canonicalizeV596(value) {
  if (value === undefined) throw new Error("v596-canonical-undefined");
  if (typeof value === "number" && !Number.isFinite(value)) {
    throw new Error("v596-canonical-non-finite");
  }
  if (Array.isArray(value)) return value.map(canonicalizeV596);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, canonicalizeV596(value[key])]),
  );
}

export function canonicalShaV596(value) {
  return createHash("sha256")
    .update(JSON.stringify(canonicalizeV596(value)), "utf8")
    .digest("hex");
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function assertWorkspaceFile(root, relativePath, label) {
  const workspace = resolve(root);
  const absolute = resolve(workspace, relativePath);
  const boundary = relative(workspace, absolute);
  if (boundary === "" || boundary === ".." || boundary.startsWith(`..${sep}`)
    || isAbsolute(boundary)) {
    throw new Error(`v596-workspace-boundary:${label}:${relativePath}`);
  }
  if (!existsSync(absolute)) {
    throw new Error(`v596-required-file-missing:${label}:${relativePath}`);
  }
  const metadata = lstatSync(absolute);
  if (!metadata.isFile() || metadata.isSymbolicLink()) {
    throw new Error(`v596-required-file-not-regular:${label}:${relativePath}`);
  }
  const realWorkspace = realpathSync(workspace);
  const realFile = realpathSync(absolute);
  const realBoundary = relative(realWorkspace, realFile);
  if (realBoundary === "" || realBoundary === ".."
    || realBoundary.startsWith(`..${sep}`) || isAbsolute(realBoundary)) {
    throw new Error(`v596-workspace-realpath-boundary:${label}:${relativePath}`);
  }
  return absolute;
}

function fileRecord(root, relativePath, label = "source") {
  const absolute = assertWorkspaceFile(root, relativePath, label);
  const bytes = readFileSync(absolute);
  return Object.freeze({
    path: relativePath.replaceAll("\\", "/"),
    bytes: bytes.byteLength,
    sha256: sha256(bytes),
  });
}

export function buildV596SourceBoundaryRecords(root, paths = V596_DELTA_SOURCE_PATHS) {
  return Object.freeze(paths.map((path) => fileRecord(resolve(root), path, "delta-source"))
    .sort((left, right) => left.path.localeCompare(right.path)));
}

function assertCanonicalSeal(document, field, label) {
  if (!document || typeof document !== "object" || !SHA256_PATTERN.test(document[field] ?? "")) {
    throw new Error(`v596-seal-shape:${label}`);
  }
  const unsigned = { ...document };
  const declared = unsigned[field];
  delete unsigned[field];
  if (canonicalShaV596(unsigned) !== declared) throw new Error(`v596-seal-invalid:${label}`);
}

function readSealedDocument(root, relativePath, field, label) {
  const absolute = assertWorkspaceFile(root, relativePath, label);
  const document = readJson(absolute);
  assertCanonicalSeal(document, field, label);
  return document;
}

function assertFalseAuthority(authority, fields, label) {
  if (!authority || typeof authority !== "object") {
    throw new Error(`v596-authority-missing:${label}`);
  }
  for (const field of fields) {
    if (authority[field] !== false) {
      throw new Error(`v596-authority-not-denied:${label}:${field}`);
    }
  }
}

function parentRows(source) {
  return [...source.files, ...source.closureSourcePaths];
}

function loadAndVerifyV595Parent(root) {
  const source = readSealedDocument(
    root, V596_PARENT_ARTIFACT_PATHS.sourceManifest, "receiptSha256", "v595-source",
  );
  const candidate = readSealedDocument(
    root, V596_PARENT_ARTIFACT_PATHS.candidateManifest, "manifestSha256", "v595-candidate",
  );
  const release = readSealedDocument(
    root, V596_PARENT_ARTIFACT_PATHS.releaseDossier, "dossierSha256", "v595-release",
  );
  const reseal = readSealedDocument(
    root, V596_PARENT_ARTIFACT_PATHS.resealReceipt, "receiptSha256", "v595-reseal",
  );

  if (source.version !== "v595-source-manifest-v1"
    || source.status !== "complete-explicit-v595-delta-and-closure-boundary"
    || source.formalProductPointer !== "v263"
    || source.receiptSha256 !== V595_SOURCE_SHA256
    || source.files?.length !== 74
    || source.closureSourcePaths?.length !== 8
    || source.pendingClosurePaths?.length !== 0) {
    throw new Error("v596-v595-source-parent-invalid");
  }
  if (candidate.version !== "v595-stellar-relativity-additive-candidate-v1"
    || candidate.manifestSha256 !== V595_CANDIDATE_SHA256
    || candidate.formalProductPointer !== "v263"
    || release.dossierSha256 !== V595_RELEASE_DOSSIER_SHA256
    || release.qualification?.status
      !== "qualified-additive-v595-stellar-relativity-candidate"
    || release.candidate?.candidateManifestSha256 !== candidate.manifestSha256
    || release.candidate?.sourceManifestSha256 !== source.receiptSha256
    || release.productionPromotionAllowed !== false
    || reseal.receiptSha256 !== V595_RESEAL_RECEIPT_SHA256
    || reseal.status !== "passed-double-byte-identical-current-v595-reseal"
    || reseal.candidate?.candidateManifestSha256 !== candidate.manifestSha256
    || reseal.candidate?.sourceManifestSha256 !== source.receiptSha256) {
    throw new Error("v596-v595-parent-identity-invalid");
  }
  for (const [document, label] of [
    [candidate, "v595-candidate"], [release, "v595-release"], [reseal, "v595-reseal"],
  ]) assertFalseAuthority(document.authority, [
    "scientificPayloadMutationAllowed",
    "scientificAuthorityGranted",
    "measuredAuthorityGranted",
    "gpuAuthorityGranted",
    "productionReleaseAuthorized",
    "productionPromotionAllowed",
  ].filter((field) => field in document.authority), label);

  const records = parentRows(source);
  const recordsByPath = new Map(records.map((record) => [record.path, record]));
  if (recordsByPath.size !== records.length) throw new Error("v596-v595-parent-record-duplicate");
  for (const record of records) {
    if (!record || typeof record.path !== "string" || !SHA256_PATTERN.test(record.sha256 ?? "")
      || !Number.isSafeInteger(record.bytes) || record.bytes <= 0) {
      throw new Error("v596-v595-parent-record-invalid");
    }
    const retired = V596_PARENT_RETIRED_SOURCE_PATHS.includes(record.path);
    const delta = V596_DELTA_SOURCE_PATHS.includes(record.path);
    if (retired) {
      if (existsSync(resolve(root, record.path))) {
        throw new Error(`v596-retired-parent-source-reappeared:${record.path}`);
      }
      continue;
    }
    const current = fileRecord(root, record.path, "v595-parent-current");
    const same = current.bytes === record.bytes && current.sha256 === record.sha256;
    if (!same && !delta) throw new Error(`v596-v595-base-byte-drift:${record.path}`);
    if (same && delta) throw new Error(`v596-byte-identical-parent-file-not-delta:${record.path}`);
  }
  for (const path of V596_PARENT_RETIRED_SOURCE_PATHS) {
    if (!recordsByPath.has(path)) throw new Error(`v596-retired-path-not-parent-bound:${path}`);
  }

  return Object.freeze({ source, candidate, release, reseal, recordsByPath });
}

export function buildV596ParentRetirementRecords(parent) {
  return Object.freeze(V596_PARENT_RETIRED_SOURCE_PATHS.map((path) => {
    const record = parent.recordsByPath.get(path);
    const disposition = V596_PARENT_RETIRED_SOURCE_DISPOSITIONS[path];
    return Object.freeze({
      path,
      parentBytes: record.bytes,
      parentSha256: record.sha256,
      currentState: "absent",
      disposition: disposition.state,
      replacements: disposition.replacements,
    });
  }));
}

function assertDeltaContract(root) {
  if (new Set(V596_ALL_RESERVED_SOURCE_PATHS).size
    !== V596_ALL_RESERVED_SOURCE_PATHS.length) throw new Error("v596-delta-duplicate");
  for (const path of V596_DELTA_SOURCE_PATHS) assertWorkspaceFile(root, path, "delta-source");
  for (const disposition of Object.values(V596_PARENT_RETIRED_SOURCE_DISPOSITIONS)) {
    for (const replacement of disposition.replacements) {
      if (!V596_ALL_RESERVED_SOURCE_PATHS.includes(replacement)) {
        throw new Error(`v596-retired-replacement-not-reserved:${replacement}`);
      }
    }
  }
}

export function buildV596SourceManifest(root = process.cwd(), options = {}) {
  const workspaceRoot = resolve(root);
  const parent = loadAndVerifyV595Parent(workspaceRoot);
  assertDeltaContract(workspaceRoot);
  const deltaRecords = buildV596SourceBoundaryRecords(workspaceRoot);
  const generatedAt = options.generatedAt ?? process.env.ATLAS_V596_GENERATED_AT
    ?? "2026-08-31T00:00:00.000Z";
  if (typeof generatedAt !== "string" || !Number.isFinite(Date.parse(generatedAt))) {
    throw new Error("v596-generated-at-invalid");
  }
  const closureSourcePaths = V596_CLOSURE_SOURCE_PATHS.map((path) => (
    existsSync(resolve(workspaceRoot, path))
      ? Object.freeze({ ...fileRecord(workspaceRoot, path, "closure-source"), state: "present" })
      : Object.freeze({ path, state: "pending" })
  ));
  const pendingClosurePaths = closureSourcePaths
    .filter((entry) => entry.state === "pending")
    .map((entry) => entry.path);
  const manifest = {
    version: "v596-source-manifest-v1",
    generatedAt,
    identityStage: "ready-for-v596-delta-source-identity",
    status: pendingClosurePaths.length === 0
      ? "complete-explicit-v596-delta-retirement-and-closure-boundary"
      : "complete-explicit-v596-delta-retirement-boundary-closure-reservations-pending",
    sealAlgorithm: "sha256-canonical-json-object-keys-v1",
    formalProductPointer: "v263",
    parentVersion: V596_PARENT_VERSION,
    baseSourceManifestSha256: parent.source.receiptSha256,
    baseCandidateManifestSha256: parent.candidate.manifestSha256,
    baseReleaseDossierSha256: parent.release.dossierSha256,
    baseResealReceiptSha256: parent.reseal.receiptSha256,
    parentV595: {
      sourceManifestSha256: parent.source.receiptSha256,
      candidateManifestSha256: parent.candidate.manifestSha256,
      releaseDossierSha256: parent.release.dossierSha256,
      resealReceiptSha256: parent.reseal.receiptSha256,
      deploymentId: parent.release.candidate.deploymentId,
      buildId: parent.release.candidate.buildId,
      qualifiedStatus: parent.release.qualification.status,
      sourceFiles: parent.source.files.length,
      closureSourcePaths: parent.source.closureSourcePaths.length,
      sourceManifestPath: V596_PARENT_ARTIFACT_PATHS.sourceManifest,
      candidateManifestPath: V596_PARENT_ARTIFACT_PATHS.candidateManifest,
      releaseDossierPath: V596_PARENT_ARTIFACT_PATHS.releaseDossier,
      resealReceiptPath: V596_PARENT_ARTIFACT_PATHS.resealReceipt,
    },
    baseCounts: {
      files: parent.source.files.length,
      closureSourcePaths: parent.source.closureSourcePaths.length,
      retiredOrReplacedPaths: V596_PARENT_RETIRED_SOURCE_PATHS.length,
    },
    parentRetiredOrReplacedPaths: buildV596ParentRetirementRecords(parent),
    files: deltaRecords,
    closureSourcePaths,
    pendingClosurePaths,
  };
  return Object.freeze({ ...manifest, receiptSha256: canonicalShaV596(manifest) });
}

export async function writeV596SourceManifest(
  root = process.cwd(), outputRoot = DEFAULT_OUTPUT_ROOT, options = {},
) {
  const workspaceRoot = resolve(root);
  const outputDirectory = resolve(workspaceRoot, outputRoot);
  const outputRelation = relative(workspaceRoot, outputDirectory);
  if (outputDirectory !== workspaceRoot
    && (outputRelation === ".." || outputRelation.startsWith(`..${sep}`)
      || isAbsolute(outputRelation))) {
    throw new Error("v596-output-root-boundary");
  }
  const formalOutput = resolve(workspaceRoot, "docs/release/v596");
  if (outputDirectory === formalOutput || outputDirectory.startsWith(`${formalOutput}${sep}`)) {
    throw new Error("v596-formal-output-forbidden");
  }
  const manifest = buildV596SourceManifest(workspaceRoot, options);
  await mkdir(outputDirectory, { recursive: true });
  const outputPath = resolve(outputDirectory, "source-manifest-v596.json");
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
    else throw new Error(`v596-unknown-arg:${arg}`);
  }
  return args;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2));
  if (!args) {
    console.log("Usage: node scripts/build-v596-source-manifest.mjs [--root PATH] [--output-root PATH] [--generated-at ISO]");
  } else {
    const result = await writeV596SourceManifest(args.root, args.outputRoot, args);
    console.log(JSON.stringify({
      status: "v596-source-manifest-preflight-written",
      output: result.outputPath,
      receiptSha256: result.manifest.receiptSha256,
      parentVersion: result.manifest.parentVersion,
      deltaFiles: result.manifest.files.length,
      retiredOrReplacedPaths: result.manifest.parentRetiredOrReplacedPaths.length,
    }, null, 2));
  }
}
