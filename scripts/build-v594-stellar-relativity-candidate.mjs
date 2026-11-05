import { createHash } from "node:crypto";
import { existsSync, readFileSync, realpathSync, statSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

import {
  V594_CLOSURE_SOURCE_PATHS,
  V594_SOURCE_PATHS,
} from "./v594-source-paths.mjs";

const GENERATED_AT = process.env.ATLAS_V594_GENERATED_AT ?? "2026-08-25T00:00:00.000Z";
const FORMAL_PRODUCT_POINTER = "v263";
const SHA256_PATTERN = /^[0-9a-f]{64}$/;

const EXPECTED_PARENT_V593 = Object.freeze({
  sourceManifestSha256: "b551589b4356192dffa331794137f1111402941810f65f586e5d72f34e2d96e5",
  manifestSha256: "31c708473846a62951f6aaa4d6cba8c6c6d895ee70035b038baef203a4c67a8d",
  capabilityReportSha256: "839d18d17f0ab9f64eb1b7d417aa910dafbed6cc12bf5af023379d52ab2847da",
  pointerSha256: "b1620997534235f02059b2f6f11e8308e334ed99a9e3cb4fdd84fe05e713ee57",
  currentStateReceiptSha256: "372b0a62f3f88a98b6087ce43398aecd944c430abbfb5cc33df38626a76601c4",
  releaseDossierSha256: "2268ae9c57fdbf9cf1089b55ed94782f9dd23cfbcc5deda602de5effc07a6e48",
});

const PARENT_PATHS = Object.freeze({
  source: "docs/release/v593/source-manifest-v593.json",
  manifest: "public/data/final-art-direction-v593/manifest.json",
  capability: "docs/release/v593/capability-report-v593.json",
  pointer: "dist/release/orbit-atlas-current-product-rc-candidate-v593.json",
  currentState: "docs/release/v593/current-state-receipt-v593.json",
  release: "docs/release/v593/release-export-v593.json",
});

const POST_V593_PATHS = Object.freeze({
  stellarManifest: "public/data/post-v593-stellar-relativity/stellar-provenance-v1.json",
  stellarReceipt: "docs/release/post-v593/stellar-provenance-receipt-v1.json",
  trajectoryEvidence: "public/data/post-v593-stellar-relativity/relativity-trajectory-reference-v3.json",
  trajectoryReceipt: "docs/release/post-v593/relativity-trajectory-reference-receipt-v3.json",
  relativityDossier: "public/data/post-v593-stellar-relativity/relativity-reference-v3.json",
  relativityReceipt: "docs/release/post-v593/relativity-reference-receipt-v3.json",
});

const OUTPUT_PATHS = Object.freeze({
  source: "docs/release/v594/source-manifest-v594.json",
  manifest: "public/data/stellar-relativity-v594/manifest.json",
  currentState: "public/data/stellar-relativity-v594/current-state.json",
  pointer: "docs/release/v594/capability-pointer-v594.json",
});

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

/** Frozen v593-style canonical JSON: recursively sorted object keys. */
export function canonicalizeV594(value) {
  if (Array.isArray(value)) return value.map(canonicalizeV594);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, canonicalizeV594(value[key])]),
  );
}

export function canonicalShaV594(value) {
  return sha256(Buffer.from(JSON.stringify(canonicalizeV594(value)), "utf8"));
}

/** External orbit engine V2 bound serializer (number-e16, references retained). */
function canonicalizeNumberE16(value) {
  if (value === null || typeof value === "boolean" || typeof value === "string") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("v594-number-e16-non-finite");
    if (value === 0 || Object.is(value, -0)) return "0.0000000000000000e+0";
    const [mantissa, exponentText] = value.toExponential(16).split("e");
    const exponent = Number(exponentText);
    return `${mantissa}e${exponent >= 0 ? "+" : ""}${exponent}`;
  }
  if (Array.isArray(value)) return value.map(canonicalizeNumberE16);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, canonicalizeNumberE16(value[key])]),
    );
  }
  throw new Error(`v594-number-e16-unsupported:${typeof value}`);
}

function numberE16Sha(value) {
  return sha256(Buffer.from(JSON.stringify(canonicalizeNumberE16(value)), "utf8"));
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function assertWorkspaceFile(root, relativePath, label) {
  const path = resolve(root, relativePath);
  const boundary = relative(root, path);
  if (
    boundary === ""
    || boundary === ".."
    || boundary.startsWith(`..${sep}`)
    || isAbsolute(boundary)
  ) throw new Error(`v594-workspace-boundary:${label}:${relativePath}`);
  if (!existsSync(path) || !statSync(path).isFile()) {
    throw new Error(`v594-required-file-missing:${label}:${relativePath}`);
  }
  return path;
}

function fileRecord(root, relativePath, label = "source") {
  const path = assertWorkspaceFile(root, relativePath, label);
  const bytes = readFileSync(path);
  return Object.freeze({ path: relativePath, bytes: bytes.byteLength, sha256: sha256(bytes) });
}

export function buildV594SourceBoundaryRecords(root, paths = V594_SOURCE_PATHS) {
  const records = paths.map((path) => fileRecord(resolve(root), path, "source-boundary"))
    .sort((left, right) => left.path.localeCompare(right.path));
  return Object.freeze(records);
}

function documentRecord(root, relativePath, sealField, document) {
  const record = fileRecord(root, relativePath, "evidence-document");
  return Object.freeze({
    ...record,
    version: document.version,
    status: document.status,
    sealField,
    seal: document[sealField],
  });
}

function assertCanonicalSeal(document, field, label) {
  if (!document || typeof document !== "object" || !SHA256_PATTERN.test(document[field] ?? "")) {
    throw new Error(`v594-seal-shape:${label}`);
  }
  const unsigned = { ...document };
  const declared = unsigned[field];
  delete unsigned[field];
  if (canonicalShaV594(unsigned) !== declared) throw new Error(`v594-seal-invalid:${label}`);
}

function assertNumberE16Seal(document, field, label) {
  if (!document || typeof document !== "object" || !SHA256_PATTERN.test(document[field] ?? "")) {
    throw new Error(`v594-number-e16-seal-shape:${label}`);
  }
  const unsigned = { ...document };
  const declared = unsigned[field];
  delete unsigned[field];
  if (numberE16Sha(unsigned) !== declared) throw new Error(`v594-number-e16-seal-invalid:${label}`);
}

function readCanonicalEvidence(root, relativePath, field, label) {
  const path = assertWorkspaceFile(root, relativePath, label);
  const document = readJson(path);
  assertCanonicalSeal(document, field, label);
  return document;
}

function assertFalseAuthority(authority, fields, label) {
  if (!authority || typeof authority !== "object") throw new Error(`v594-authority-missing:${label}`);
  for (const field of fields) {
    if (authority[field] !== false) throw new Error(`v594-authority-not-denied:${label}:${field}`);
  }
}

function loadParentV593(root) {
  const source = readCanonicalEvidence(root, PARENT_PATHS.source, "receiptSha256", "parent-source");
  const manifest = readCanonicalEvidence(root, PARENT_PATHS.manifest, "manifestSha256", "parent-manifest");
  const capability = readCanonicalEvidence(root, PARENT_PATHS.capability, "reportSha256", "parent-capability");
  const pointer = readCanonicalEvidence(root, PARENT_PATHS.pointer, "pointerSha256", "parent-pointer");
  const currentState = readCanonicalEvidence(root, PARENT_PATHS.currentState, "receiptSha256", "parent-current-state");
  const release = readCanonicalEvidence(root, PARENT_PATHS.release, "dossierSha256", "parent-release");

  const actual = {
    sourceManifestSha256: source.receiptSha256,
    manifestSha256: manifest.manifestSha256,
    capabilityReportSha256: capability.reportSha256,
    pointerSha256: pointer.pointerSha256,
    currentStateReceiptSha256: currentState.receiptSha256,
    releaseDossierSha256: release.dossierSha256,
  };
  for (const [field, expected] of Object.entries(EXPECTED_PARENT_V593)) {
    if (actual[field] !== expected) throw new Error(`v594-parent-v593-identity-drift:${field}`);
  }
  if (
    source.version !== "v593-source-manifest-v1"
    || source.status !== "complete"
    || manifest.formalProductPointer !== FORMAL_PRODUCT_POINTER
    || manifest.governance?.sourceManifestSha256 !== source.receiptSha256
    || capability.status !== "qualified-additive-v593-visual-candidate"
    || capability.candidate?.manifestSha256 !== manifest.manifestSha256
    || pointer.status !== capability.status
    || pointer.formalProductPointer !== FORMAL_PRODUCT_POINTER
    || pointer.manifestSha256 !== manifest.manifestSha256
    || pointer.capabilityReportSha256 !== capability.reportSha256
    || pointer.productionPromotionAllowed !== false
    || currentState.status !== capability.status
    || currentState.candidate?.manifestSha256 !== manifest.manifestSha256
    || release.status !== "passed-current-identity-export-matrices-mount-lifecycle-same-realm-and-cdp-heap-human-signoff-approved"
    || release.candidate?.sourceManifestSha256 !== source.receiptSha256
    || release.candidate?.manifestSha256 !== manifest.manifestSha256
    || release.candidate?.formalProductPointer !== FORMAL_PRODUCT_POINTER
  ) throw new Error("v594-parent-v593-relational-binding-invalid");
  assertFalseAuthority(release.authority, [
    "scientificPayloadWriteback",
    "scientificAuthorityChanged",
    "radiativeTransferGranted",
    "measuredAuthorityGranted",
    "gpuAuthorityGranted",
    "productionReleaseAuthorized",
  ], "parent-release");

  return Object.freeze({
    identity: Object.freeze({
      ...actual,
      buildId: release.candidate.buildId,
      deploymentId: release.candidate.deploymentId,
      formalProductPointer: FORMAL_PRODUCT_POINTER,
    }),
    documents: Object.freeze({
      source: documentRecord(root, PARENT_PATHS.source, "receiptSha256", source),
      manifest: documentRecord(root, PARENT_PATHS.manifest, "manifestSha256", manifest),
      capability: documentRecord(root, PARENT_PATHS.capability, "reportSha256", capability),
      pointer: documentRecord(root, PARENT_PATHS.pointer, "pointerSha256", pointer),
      currentState: documentRecord(root, PARENT_PATHS.currentState, "receiptSha256", currentState),
      release: documentRecord(root, PARENT_PATHS.release, "dossierSha256", release),
    }),
  });
}

function loadPostV593Evidence(root) {
  const stellarManifest = readCanonicalEvidence(root, POST_V593_PATHS.stellarManifest, "manifestSha256", "stellar-manifest");
  const stellarReceipt = readCanonicalEvidence(root, POST_V593_PATHS.stellarReceipt, "receiptSha256", "stellar-receipt");
  const trajectoryEvidence = readCanonicalEvidence(root, POST_V593_PATHS.trajectoryEvidence, "evidenceSha256", "trajectory-evidence");
  const trajectoryReceipt = readCanonicalEvidence(root, POST_V593_PATHS.trajectoryReceipt, "receiptSha256", "trajectory-receipt");
  const relativityDossier = readCanonicalEvidence(root, POST_V593_PATHS.relativityDossier, "dossierSha256", "relativity-dossier");
  const relativityReceipt = readCanonicalEvidence(root, POST_V593_PATHS.relativityReceipt, "receiptSha256", "relativity-receipt");

  const stellarHeroes = Array.isArray(stellarManifest.heroes) ? stellarManifest.heroes : [];
  const stellarHeroIds = new Set(stellarHeroes.map((hero) => hero.id));
  const stellarAdmissionFromHeroes = {
    rosterCount: stellarHeroes.length,
    schemaCompleteCount: stellarHeroes.filter((hero) => hero.schemaAdmission === "schema-complete").length,
    identityBoundCount: stellarHeroes.filter((hero) => hero.identityStatus === "identity-bound").length,
    renderAnchorOnlyCount: stellarHeroes.filter((hero) => hero.identityStatus === "render-anchor-only").length,
    measurementAdmittedCount: stellarHeroes.filter((hero) => hero.measurementAdmission === "measurement-admitted").length,
    provenanceAdmittedCount: stellarHeroes.filter((hero) => hero.provenanceAdmission === "admitted").length,
    presentationAdmittedCount: stellarHeroes.filter((hero) => hero.presentationAdmission === "presentation-only-allowed").length,
  };
  const stellarAdmissionMatchesHeroes = Object.entries(stellarAdmissionFromHeroes)
    .every(([key, value]) => stellarManifest.admission?.[key] === value);

  if (
    stellarManifest.version !== "post-v593-stellar-provenance-candidate-v1"
    || stellarReceipt.version !== "post-v593-stellar-provenance-receipt-v1"
    || stellarReceipt.manifestSha256 !== stellarManifest.manifestSha256
    || stellarReceipt.manifestPath !== POST_V593_PATHS.stellarManifest
    || stellarReceipt.formalProductPointer !== FORMAL_PRODUCT_POINTER
    || stellarReceipt.productionReleaseAuthorized !== false
    || stellarManifest.policy?.firstRosterCount !== 24
    || stellarManifest.policy?.renderAnchorIdentityClaimAllowed !== false
    || stellarManifest.policy?.simbadSystemResolutionMayNotBindComponentIdentity !== true
    || stellarManifest.policy?.schemaCompleteDoesNotImplyMeasurementAdmission !== true
    || stellarManifest.policy?.unknownFieldsBlockMeasurementAdmission !== true
    || stellarManifest.policy?.unknownAndSearchNotFoundAreNotZeroOrFalse !== true
    || stellarManifest.policy?.zeroParallaxIsNotPhysicalDistance !== true
    || stellarAdmissionFromHeroes.rosterCount !== 24
    || stellarHeroIds.size !== 24
    || !stellarAdmissionMatchesHeroes
    || stellarAdmissionFromHeroes.schemaCompleteCount !== 24
    || stellarAdmissionFromHeroes.presentationAdmittedCount !== 24
    || stellarAdmissionFromHeroes.identityBoundCount + stellarAdmissionFromHeroes.renderAnchorOnlyCount !== 24
    || stellarAdmissionFromHeroes.measurementAdmittedCount !== 0
    || stellarManifest.admission?.provenanceAdmittedCount !== 0
    || stellarHeroes.some((hero) => hero.identityBinding?.gaiaRenderAnchorUsedForIdentity !== false)
  ) throw new Error("v594-stellar-evidence-binding-invalid");
  assertFalseAuthority(stellarManifest.authority, [
    "scientificPayloadWriteback",
    "scientificAuthorityChanged",
    "measuredAuthorityGranted",
    "gpuAuthorityGranted",
    "observationTextureClaim",
  ], "stellar-manifest");
  assertFalseAuthority(stellarReceipt.authority, [
    "scientificPayloadWriteback",
    "scientificAuthorityChanged",
    "measuredAuthorityGranted",
    "gpuAuthorityGranted",
    "observationTextureClaim",
  ], "stellar-receipt");

  if (
    trajectoryEvidence.version !== "post-v593-relativity-trajectory-evidence-v3"
    || trajectoryReceipt.version !== "post-v593-relativity-trajectory-reference-receipt-v3"
    || trajectoryReceipt.evidencePath !== POST_V593_PATHS.trajectoryEvidence
    || trajectoryReceipt.evidenceSha256 !== trajectoryEvidence.evidenceSha256
    || trajectoryReceipt.resultSha256 !== trajectoryEvidence.runner?.resultSha256
    || trajectoryReceipt.formalProductPointer !== FORMAL_PRODUCT_POINTER
    || trajectoryEvidence.formalProductPointer !== FORMAL_PRODUCT_POINTER
    || trajectoryEvidence.gates?.allQualified !== true
    || trajectoryReceipt.gates?.allQualified !== true
    || trajectoryEvidence.status !== "qualified-shadow-only-three-kernel-full-trajectory-reference"
    || trajectoryReceipt.status !== trajectoryEvidence.status
  ) throw new Error("v594-trajectory-evidence-binding-invalid");
  for (const [label, authority] of [
    ["trajectory-evidence", trajectoryEvidence.authority],
    ["trajectory-receipt", trajectoryReceipt.authority],
  ]) {
    if (authority?.defaultKernel !== "legacy-eih-1pn" || authority?.v2Mode !== "shadow") {
      throw new Error(`v594-trajectory-kernel-boundary:${label}`);
    }
    assertFalseAuthority(authority, [
      "promotionDecision",
      "measuredAuthorityGranted",
      "gpuAuthorityGranted",
      "scientificPayloadMutationAllowed",
      "productionReleaseAuthorized",
    ], label);
  }

  if (
    relativityDossier.version !== "post-v593-relativity-reference-dossier-v3"
    || relativityReceipt.version !== "post-v593-relativity-reference-receipt-v3"
    || relativityReceipt.dossierPath !== POST_V593_PATHS.relativityDossier
    || relativityReceipt.dossierSha256 !== relativityDossier.dossierSha256
    || relativityReceipt.status !== relativityDossier.status
    || relativityDossier.formalProductPointer !== FORMAL_PRODUCT_POINTER
    || relativityReceipt.formalProductPointer !== FORMAL_PRODUCT_POINTER
    || relativityDossier.weakField?.defaultKernel !== "legacy-eih-1pn"
    || relativityDossier.weakField?.v2Mode !== "shadow"
    || relativityDossier.weakField?.promotionApplied !== false
    || relativityDossier.weakField?.trajectoryQualified !== true
    || relativityDossier.kerr?.oracleQualified !== true
  ) throw new Error("v594-relativity-evidence-binding-invalid");
  for (const [label, authority] of [
    ["relativity-dossier", relativityDossier.authority],
    ["relativity-receipt", relativityReceipt.authority],
  ]) assertFalseAuthority(authority, [
    "geometryReferenceGranted",
    "polarizationTransportReferenceGranted",
    "radiativeTransferGranted",
    "measuredAuthorityGranted",
    "gpuAuthorityGranted",
    "grmhdGranted",
    "scientificPayloadMutationAllowed",
    "productionReleaseAuthorized",
  ], label);

  return Object.freeze({
    stellarManifest,
    stellarReceipt,
    trajectoryEvidence,
    trajectoryReceipt,
    relativityDossier,
    relativityReceipt,
    documents: Object.freeze({
      stellarManifest: documentRecord(root, POST_V593_PATHS.stellarManifest, "manifestSha256", stellarManifest),
      stellarReceipt: documentRecord(root, POST_V593_PATHS.stellarReceipt, "receiptSha256", stellarReceipt),
      trajectoryEvidence: documentRecord(root, POST_V593_PATHS.trajectoryEvidence, "evidenceSha256", trajectoryEvidence),
      trajectoryReceipt: documentRecord(root, POST_V593_PATHS.trajectoryReceipt, "receiptSha256", trajectoryReceipt),
      relativityDossier: documentRecord(root, POST_V593_PATHS.relativityDossier, "dossierSha256", relativityDossier),
      relativityReceipt: documentRecord(root, POST_V593_PATHS.relativityReceipt, "receiptSha256", relativityReceipt),
    }),
  });
}

function externalFileRecord(candidateDir, relativePath) {
  const path = resolve(candidateDir, relativePath);
  const boundary = relative(candidateDir, path);
  if (boundary === "" || boundary === ".." || boundary.startsWith(`..${sep}`) || isAbsolute(boundary)) {
    throw new Error(`v594-external-boundary:${relativePath}`);
  }
  if (!existsSync(path) || !statSync(path).isFile()) throw new Error(`v594-external-file-missing:${relativePath}`);
  const bytes = readFileSync(path);
  return Object.freeze({ path: relativePath, bytes: bytes.byteLength, sha256: sha256(bytes) });
}

function loadExternalKerrIdentity(root, post) {
  const engineRoot = process.env.ORBIT_RELATIVITY_ENGINE_ROOT
    ? resolve(root, process.env.ORBIT_RELATIVITY_ENGINE_ROOT)
    : resolve(root, "..", "..", "orbit-relativity-engine");
  const candidateDir = resolve(post.relativityDossier.source?.candidateDir ?? "");
  const engineBoundary = relative(engineRoot, candidateDir);
  if (
    engineBoundary === ""
    || engineBoundary === ".."
    || engineBoundary.startsWith(`..${sep}`)
    || isAbsolute(engineBoundary)
  ) throw new Error("v594-external-candidate-boundary");

  const records = Object.fromEntries([
    "observation.json",
    "observation-summary.json",
    "observation-verification-receipt.json",
    "engine-manifest.json",
    "convergence-report.json",
  ].map((path) => [path, externalFileRecord(candidateDir, path)]));
  const artifact = readJson(resolve(candidateDir, "observation.json"));
  const summary = readJson(resolve(candidateDir, "observation-summary.json"));
  const receipt = readJson(resolve(candidateDir, "observation-verification-receipt.json"));
  const manifest = readJson(resolve(candidateDir, "engine-manifest.json"));
  const convergence = readJson(resolve(candidateDir, "convergence-report.json"));
  assertNumberE16Seal(artifact, "artifactSha256", "external-artifact");
  assertNumberE16Seal(summary, "summarySha256", "external-summary");
  assertNumberE16Seal(receipt, "receiptSha256", "external-receipt");
  assertNumberE16Seal(manifest, "manifestSha256", "external-manifest");
  assertNumberE16Seal(convergence, "reportSha256", "external-convergence");

  const manifestFiles = new Map((manifest.files ?? []).map((entry) => [entry.path, entry]));
  for (const [path, record] of Object.entries(records)) {
    if (path === "engine-manifest.json") continue;
    const entry = manifestFiles.get(path);
    if (!entry || entry.bytes !== record.bytes || entry.sha256 !== record.sha256) {
      throw new Error(`v594-external-manifest-file-drift:${path}`);
    }
  }
  if (
    manifest.version !== "v3-orbit-relativity-engine-observation-manifest"
    || receipt.version !== "v3-kerr-observation-verification-receipt"
    || convergence.version !== "v3-kerr-observation-convergence-report"
    || artifact.artifactSha256 !== receipt.artifactSha256
    || artifact.artifactSha256 !== manifest.artifactSha256
    || summary.summarySha256 !== receipt.summarySha256
    || summary.summarySha256 !== manifest.summarySha256
    || receipt.sourceSha256 !== manifest.sourceSha256
    || receipt.convergenceReportSha256 !== records["convergence-report.json"].sha256
    || receipt.receiptSha256 !== post.relativityDossier.source?.receiptSha256
    || manifest.manifestSha256 !== post.relativityDossier.source?.engineManifestSha256
    || artifact.artifactSha256 !== post.relativityDossier.source?.artifactSha256
    || summary.summarySha256 !== post.relativityDossier.source?.summarySha256
    || convergence.reportSha256 !== post.relativityDossier.source?.convergenceReportDocumentSha256
    || records["convergence-report.json"].sha256 !== post.relativityDossier.source?.convergenceFileSha256
    || summary.authorityReference !== artifact.artifactSha256
    || summary.benchmarks?.kerrSchildOracle?.qualified !== true
    || summary.benchmarks?.kerrSchildOracle?.executedRayCount < 64
  ) throw new Error("v594-external-kerr-relational-binding-invalid");
  assertFalseAuthority(receipt.authority, [
    "radiativeTransferGranted",
    "measuredAuthorityGranted",
    "gpuAuthorityGranted",
    "sciencePayloadMutationAllowed",
  ], "external-receipt");

  return Object.freeze({
    engine: "orbit-relativity-engine",
    artifactDirectory: engineBoundary.replaceAll("\\", "/"),
    canonicalSerialization: "orbit-canonical-json-v2-bound-references-number-e16",
    status: receipt.status,
    sourceSha256: receipt.sourceSha256,
    artifactSha256: receipt.artifactSha256,
    summarySha256: receipt.summarySha256,
    verificationReceiptSha256: receipt.receiptSha256,
    engineManifestSha256: manifest.manifestSha256,
    convergenceReportSha256: convergence.reportSha256,
    convergenceFileSha256: records["convergence-report.json"].sha256,
    oracleRayCount: summary.benchmarks.kerrSchildOracle.executedRayCount,
    oracleQualified: true,
    adaptiveConvergenceQualified: convergence.qualified === true
      && convergence.unresolvedCellCount === 0,
    files: Object.values(records),
  });
}

async function writeJson(outputRoot, relativePath, value) {
  const path = resolve(outputRoot, relativePath);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function buildV594StellarRelativityCandidate(options = {}) {
  const root = resolve(options.root ?? process.cwd());
  const outputRoot = resolve(options.outputRoot ?? root);
  const outputRelation = relative(root, outputRoot);
  if (outputRoot !== root && (outputRelation === ".."
    || outputRelation.startsWith(`..${sep}`) || isAbsolute(outputRelation))) {
    throw new Error("v594-output-root-boundary");
  }
  const realRoot = realpathSync(root);
  const realOutputRoot = realpathSync(outputRoot);
  const realOutputRelation = relative(realRoot, realOutputRoot);
  if (realOutputRoot !== realRoot && (realOutputRelation === ".."
    || realOutputRelation.startsWith(`..${sep}`) || isAbsolute(realOutputRelation))) {
    throw new Error("v594-output-root-realpath-boundary");
  }
  const parent = loadParentV593(root);
  const post = loadPostV593Evidence(root);
  const external = loadExternalKerrIdentity(root, post);

  const files = buildV594SourceBoundaryRecords(root);
  const closureSourcePaths = V594_CLOSURE_SOURCE_PATHS.map((path) => (
    existsSync(resolve(root, path))
      ? Object.freeze({ ...fileRecord(root, path, "closure-source"), state: "present" })
      : Object.freeze({ path, state: "pending" })
  ));
  const pendingClosurePaths = closureSourcePaths
    .filter((entry) => entry.state === "pending")
    .map((entry) => entry.path);
  const sourceUnsigned = {
    version: "v594-source-manifest-v1",
    generatedAt: GENERATED_AT,
    identityStage: "ready-for-formal-evidence-source-identity",
    status: pendingClosurePaths.length === 0
      ? "complete-current-implementation-and-closure-tools"
      : "complete-current-implementation-closure-reservations-pending",
    sealAlgorithm: "sha256-canonical-json-object-keys-v1",
    formalProductPointer: FORMAL_PRODUCT_POINTER,
    parentV593: parent.identity,
    files,
    closureSourcePaths,
    pendingClosurePaths,
  };
  const source = { ...sourceUnsigned, receiptSha256: canonicalShaV594(sourceUnsigned) };

  const convergenceQualified = post.relativityDossier.kerr?.convergenceQualified === true
    && external.adaptiveConvergenceQualified === true
    && post.relativityDossier.status.startsWith("qualified-");
  const closureToolingComplete = pendingClosurePaths.length === 0;
  const unresolved = [
    ...(post.stellarManifest.admission.provenanceAdmittedCount === 24
      ? []
      : ["stellar-provenance-scientific-admission-remains-fail-closed-0-of-24"]),
    ...(convergenceQualified ? [] : ["kerr-adaptive-convergence-not-qualified"]),
    ...pendingClosurePaths.map((path) => `closure-source-pending:${path}`),
    "full-lite-browser-lifecycle-same-realm-cdp-and-human-signoff-not-yet-bound",
  ];
  const status = !convergenceQualified && !closureToolingComplete
    ? "blocked-pending-kerr-adaptive-convergence-and-v594-formal-closure"
    : !convergenceQualified
      ? "blocked-pending-kerr-adaptive-convergence"
      : !closureToolingComplete
        ? "blocked-pending-v594-formal-closure"
        : "ready-for-v594-formal-evidence-not-promoted";
  const authority = Object.freeze({
    defaultKernel: "legacy-eih-1pn",
    v2Mode: "shadow-only",
    scientificAuthorityGranted: false,
    scientificPayloadMutationAllowed: false,
    measuredAuthorityGranted: false,
    gpuAuthorityGranted: false,
    radiativeTransferGranted: false,
    grmhdGranted: false,
    geometryReferenceGranted: false,
    polarizationTransportReferenceGranted: false,
    productionReleaseAuthorized: false,
    productionPromotionAllowed: false,
  });
  const manifestUnsigned = {
    version: "v594-stellar-relativity-additive-candidate-v1",
    generatedAt: GENERATED_AT,
    identityStage: "ready-for-formal-evidence-candidate-identity",
    status,
    route: "/",
    namespace: "stellar-relativity-v594",
    formalProductPointer: FORMAL_PRODUCT_POINTER,
    governance: {
      additiveOnly: true,
      parentV593Immutable: true,
      parentSourceManifestSha256: parent.identity.sourceManifestSha256,
      parentManifestSha256: parent.identity.manifestSha256,
      sourceManifestSha256: source.receiptSha256,
      legacyDefaultKernelFrozen: true,
      v2ShadowOnly: true,
    },
    parentV593: parent,
    stellar: {
      status: post.stellarManifest.status,
      admission: post.stellarManifest.admission,
      manifestSha256: post.stellarManifest.manifestSha256,
      receiptSha256: post.stellarReceipt.receiptSha256,
      sourceRegistrySha256: post.stellarManifest.sourceRegistrySha256,
      evidence: {
        manifest: post.documents.stellarManifest,
        receipt: post.documents.stellarReceipt,
      },
      presentationOnly: true,
      observationTextureClaim: false,
    },
    relativity: {
      status: post.relativityDossier.status,
      trajectoryStatus: post.trajectoryEvidence.status,
      trajectoryEvidenceSha256: post.trajectoryEvidence.evidenceSha256,
      trajectoryReceiptSha256: post.trajectoryReceipt.receiptSha256,
      trajectoryResultSha256: post.trajectoryEvidence.runner.resultSha256,
      dossierSha256: post.relativityDossier.dossierSha256,
      receiptSha256: post.relativityReceipt.receiptSha256,
      kerr: external,
      evidence: {
        trajectory: post.documents.trajectoryEvidence,
        trajectoryReceipt: post.documents.trajectoryReceipt,
        dossier: post.documents.relativityDossier,
        dossierReceipt: post.documents.relativityReceipt,
      },
      adaptiveConvergenceQualified: convergenceQualified,
      promotionDecision: false,
    },
    closure: {
      toolingComplete: closureToolingComplete,
      sourcePaths: closureSourcePaths,
      formalEvidenceBound: false,
      fullBuild: "pending",
      liteBuild: "pending",
      browserMatrix: "pending",
      lifecycle: "pending",
      sameRealmSceneExit: "pending",
      cdpHeapSoak: "pending",
      exactAb: "pending",
      humanVisualSignoff: "pending",
      doubleByteIdenticalReseal: "pending",
      readonlyVerifier: "pending",
    },
    authority,
    unresolved,
  };
  const manifest = { ...manifestUnsigned, manifestSha256: canonicalShaV594(manifestUnsigned) };
  const deploymentId = `v594-${source.receiptSha256.slice(0, 12)}-${manifest.manifestSha256.slice(0, 12)}`;
  if (!/^v594-[0-9a-f]{12}-[0-9a-f]{12}$/.test(deploymentId)) {
    throw new Error("v594-deployment-identity-invalid");
  }

  const currentStateUnsigned = {
    version: "v594-stellar-relativity-current-state-v1",
    generatedAt: GENERATED_AT,
    identityStage: "ready-for-formal-evidence-current-state-identity",
    status,
    candidate: {
      route: "/",
      namespace: manifest.namespace,
      deploymentId,
      sourceManifestSha256: source.receiptSha256,
      manifestSha256: manifest.manifestSha256,
      parentV593ManifestSha256: parent.identity.manifestSha256,
      formalProductPointer: FORMAL_PRODUCT_POINTER,
    },
    gates: {
      parentV593ImmutableReceiptsBound: true,
      stellarRosterPresentationAdmitted24Of24: true,
      stellarProvenanceScientificAdmission: "blocked:0/24",
      weakFieldTrajectoryReferenceQualified: true,
      kerrSchildOracle64Of64Qualified: external.oracleQualified,
      kerrAdaptiveConvergenceQualified: convergenceQualified,
      closureToolingComplete,
      formalClosureEvidenceBound: false,
    },
    qualificationLayer:
      "external-release-export-and-readonly-verifier-do-not-reseal-source-or-candidate-identity",
    evidence: {
      stellarManifestSha256: post.stellarManifest.manifestSha256,
      stellarReceiptSha256: post.stellarReceipt.receiptSha256,
      trajectoryEvidenceSha256: post.trajectoryEvidence.evidenceSha256,
      trajectoryReceiptSha256: post.trajectoryReceipt.receiptSha256,
      relativityDossierSha256: post.relativityDossier.dossierSha256,
      relativityReceiptSha256: post.relativityReceipt.receiptSha256,
      kerrArtifactSha256: external.artifactSha256,
      kerrVerificationReceiptSha256: external.verificationReceiptSha256,
      kerrEngineManifestSha256: external.engineManifestSha256,
    },
    authority,
    unresolved,
  };
  const currentState = {
    ...currentStateUnsigned,
    receiptSha256: canonicalShaV594(currentStateUnsigned),
  };
  const pointerUnsigned = {
    version: "v594-stellar-relativity-capability-pointer-v1",
    generatedAt: GENERATED_AT,
    identityStage: "ready-for-formal-evidence-capability-pointer-identity",
    status,
    route: "/",
    namespace: manifest.namespace,
    deploymentId,
    sourceManifestSha256: source.receiptSha256,
    manifestSha256: manifest.manifestSha256,
    currentStateReceiptSha256: currentState.receiptSha256,
    parentV593PointerSha256: parent.identity.pointerSha256,
    parentV593ReleaseDossierSha256: parent.identity.releaseDossierSha256,
    formalProductPointer: FORMAL_PRODUCT_POINTER,
    authority,
    productionPromotionAllowed: false,
  };
  const pointer = { ...pointerUnsigned, pointerSha256: canonicalShaV594(pointerUnsigned) };

  await writeJson(outputRoot, OUTPUT_PATHS.source, source);
  await writeJson(outputRoot, OUTPUT_PATHS.manifest, manifest);
  await writeJson(outputRoot, OUTPUT_PATHS.currentState, currentState);
  await writeJson(outputRoot, OUTPUT_PATHS.pointer, pointer);

  return Object.freeze({
    status,
    sourceManifestSha256: source.receiptSha256,
    manifestSha256: manifest.manifestSha256,
    currentStateReceiptSha256: currentState.receiptSha256,
    pointerSha256: pointer.pointerSha256,
    deploymentId,
    pendingClosurePathCount: pendingClosurePaths.length,
    convergenceQualified,
    outputs: OUTPUT_PATHS,
  });
}

async function main() {
  const result = await buildV594StellarRelativityCandidate();
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack : error);
    process.exitCode = 1;
  });
}
