import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";

const root = realpathSync(process.cwd());
const generatedAt = process.env.ATLAS_RELATIVITY_DOSSIER_GENERATED_AT
  ?? "2026-08-25T00:00:00Z";
const requestedExternalRoot = process.env.ORBIT_RELATIVITY_ENGINE_ROOT
  ? resolve(root, process.env.ORBIT_RELATIVITY_ENGINE_ROOT)
  : resolve(root, "..", "..", "orbit-relativity-engine");
const externalRoot = realDirectory(requestedExternalRoot, "external-engine-root");
const externalDistRoot = realDirectory(resolve(externalRoot, "dist"), "external-engine-dist-root");
const requestedCandidateDir = process.env.ORBIT_RELATIVITY_CANDIDATE_DIR
  ? resolve(root, process.env.ORBIT_RELATIVITY_CANDIDATE_DIR)
  : resolve(
    externalDistRoot,
    "observation-v3-post-v593-convergence-d8-1f35420354d5",
  );
const candidateDir = realDirectory(requestedCandidateDir, "external-candidate-directory");
assertStrictDescendant(externalDistRoot, candidateDir, "external-candidate-directory-boundary");

const observationPath = safeExistingRelativeFile(candidateDir, "observation.json", "observation");
const summaryPath = safeExistingRelativeFile(
  candidateDir,
  "observation-summary.json",
  "observation-summary",
);
const receiptPath = safeExistingRelativeFile(
  candidateDir,
  "observation-verification-receipt.json",
  "observation-verification-receipt",
);
const engineManifestPath = safeExistingRelativeFile(
  candidateDir,
  "engine-manifest.json",
  "engine-manifest",
);
const convergencePath = safeExistingRelativeFile(
  candidateDir,
  "convergence-report.json",
  "convergence-report",
);
const reverificationReceiptPath = safeExistingRelativeFile(
  candidateDir,
  "observation-reverification-receipt.json",
  "observation-reverification-receipt",
);
const inputManifestPath = safeExistingRelativeFile(
  candidateDir,
  "input-manifest.json",
  "input-manifest",
);
const sourceManifestPath = safeExistingRelativeFile(
  candidateDir,
  "source-manifest.json",
  "source-manifest",
);
const licenseManifestPath = safeExistingRelativeFile(
  candidateDir,
  "license-manifest.json",
  "license-manifest",
);

const trajectoryEvidenceRelativePath =
  "public/data/post-v593-stellar-relativity/relativity-trajectory-reference-v3.json";
const trajectoryReceiptRelativePath =
  "docs/release/post-v593/relativity-trajectory-reference-receipt-v3.json";
const trajectoryEvidencePath = safeExistingRelativeFile(
  root,
  trajectoryEvidenceRelativePath,
  "trajectory-evidence",
);
const trajectoryReceiptPath = safeExistingRelativeFile(
  root,
  trajectoryReceiptRelativePath,
  "trajectory-receipt",
);
const outputPath = resolve(
  root,
  "public/data/post-v593-stellar-relativity/relativity-reference-v3.json",
);
const receiptOutputPath = resolve(
  root,
  "docs/release/post-v593/relativity-reference-receipt-v3.json",
);

const SHA256 = /^[a-f0-9]{64}$/;
const EXTERNAL_STATUS = "qualified-cpu-float64-kerr-observation-reference";
const EXTERNAL_CANONICAL_SERIALIZATION =
  "orbit-canonical-json-v2-bound-references-number-e16";
const CONVERGENCE_THRESHOLD = 0.001;
const EXPECTED_RAY_COUNT = 17_876;
const EXPECTED_EVENT_COUNT = 57_273;
const EXPECTED_ORACLE_RAY_COUNT = 64;
const TRAJECTORY_STATUS =
  "qualified-shadow-only-three-kernel-full-trajectory-reference";
const EXPECTED_TRAJECTORY_SOURCE_PATHS = [
  "app/lib/relativityTrajectoryReferenceV3.ts",
  "app/lib/physicsEngine.ts",
  "app/lib/relativityForceModelV2.ts",
  "app/lib/physicalConstants.ts",
  "app/lib/sha256BrowserV566.ts",
  "scripts/build-post-v593-relativity-trajectory-evidence.ts",
];
const TRAJECTORY_GATES = [
  "deterministicReplay",
  "callerArraysUnchanged",
  "threeKernelObservedOrderQualified",
  "fullTrajectoryReverseTimeQualified",
  "v2ReverseSpinPolicyQualified",
  "perBodyQualified",
  "aggregateQualified",
  "effectIsolationQualified",
  "boundaryQualified",
  "allQualified",
];
const TRANSIENT_EXTERNAL_KEYS = new Set([
  "generatedAt",
  "artifactSha256",
  "canonicalSha256",
  "manifestSha256",
  "capabilitySha256",
  "resultSha256",
]);
const fileIdentityCache = new Map();

function fail(label) {
  throw new Error(`post-v593-relativity-dossier:${label}`);
}

function assert(condition, label) {
  if (!condition) fail(label);
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function assertRecord(value, label) {
  assert(isRecord(value), `${label}-object`);
  return value;
}

function assertHex(value, label) {
  assert(typeof value === "string" && SHA256.test(value), `${label}-sha256`);
  return value;
}

function realDirectory(path, label) {
  assert(existsSync(path), `${label}-missing`);
  const resolved = realpathSync(path);
  assert(statSync(resolved).isDirectory(), `${label}-not-directory`);
  return resolved;
}

function assertStrictDescendant(parent, child, label) {
  const pathFromParent = relative(parent, child);
  assert(
    pathFromParent !== ""
      && pathFromParent !== "."
      && pathFromParent !== ".."
      && !pathFromParent.startsWith(`..${sep}`)
      && !isAbsolute(pathFromParent),
    label,
  );
}

function safeExistingRelativeFile(base, relativePath, label) {
  assert(
    typeof relativePath === "string"
      && relativePath.length > 0
      && relativePath === relativePath.trim()
      && !relativePath.includes("\\"),
    `${label}-relative-path`,
  );
  const parts = relativePath.split("/");
  assert(
    !isAbsolute(relativePath)
      && !parts.some((part) => part === "" || part === "." || part === ".."),
    `${label}-relative-path`,
  );
  const candidate = resolve(base, ...parts);
  assertStrictDescendant(base, candidate, `${label}-path-boundary`);
  assert(existsSync(candidate), `${label}-missing`);
  const resolved = realpathSync(candidate);
  assertStrictDescendant(base, resolved, `${label}-realpath-boundary`);
  assert(statSync(resolved).isFile(), `${label}-not-file`);
  return resolved;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function fileIdentity(path) {
  const resolved = realpathSync(path);
  const cached = fileIdentityCache.get(resolved);
  if (cached) return cached;
  const buffer = readFileSync(resolved);
  const identity = Object.freeze({
    bytes: buffer.byteLength,
    sha256: sha256(buffer),
  });
  fileIdentityCache.set(resolved, identity);
  return identity;
}

function readJsonDocument(path, label) {
  const resolved = realpathSync(path);
  const buffer = readFileSync(resolved);
  fileIdentityCache.set(resolved, Object.freeze({
    bytes: buffer.byteLength,
    sha256: sha256(buffer),
  }));
  let value;
  try {
    value = JSON.parse(buffer.toString("utf8"));
  } catch {
    fail(`${label}-json`);
  }
  return assertRecord(value, label);
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]),
    );
  }
  assert(
    value === null
      || typeof value === "string"
      || typeof value === "boolean"
      || (typeof value === "number" && Number.isFinite(value)),
    "canonical-value",
  );
  return value;
}

function canonicalSha(value) {
  return sha256(JSON.stringify(canonicalize(value)));
}

function canonicalExternalNumber(value) {
  assert(Number.isFinite(value), "external-canonical-number-finite");
  if (value === 0 || Object.is(value, -0)) return "0.0000000000000000e+0";
  const [mantissa, exponentText] = value.toExponential(16).split("e");
  const exponent = Number(exponentText);
  return `${mantissa}e${exponent >= 0 ? "+" : ""}${exponent}`;
}

function canonicalizeExternal(value, bound) {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") return canonicalExternalNumber(value);
  if (Array.isArray(value)) return value.map((entry) => canonicalizeExternal(entry, bound));
  assertRecord(value, "external-canonical");
  return Object.fromEntries(
    Object.keys(value)
      .filter((key) => bound || !TRANSIENT_EXTERNAL_KEYS.has(key))
      .sort()
      .map((key) => [key, canonicalizeExternal(value[key], bound)]),
  );
}

function canonicalExternalSha(value, bound = true) {
  return sha256(JSON.stringify(canonicalizeExternal(value, bound)));
}

function unsignedRoot(document, field) {
  const unsigned = { ...document };
  delete unsigned[field];
  return unsigned;
}

function assertLocalSeal(document, field, label) {
  const declared = assertHex(document[field], `${label}-${field}`);
  assert(declared === canonicalSha(unsignedRoot(document, field)), `${label}-seal`);
  return declared;
}

function assertExternalSeal(document, field, label) {
  const declared = assertHex(document[field], `${label}-${field}`);
  assert(
    declared === canonicalExternalSha(unsignedRoot(document, field), true),
    `${label}-seal`,
  );
  return declared;
}

function deepIdentityEqual(left, right) {
  return canonicalSha(left) === canonicalSha(right);
}

function omitKeyDeep(value, omittedKey) {
  if (Array.isArray(value)) return value.map((entry) => omitKeyDeep(entry, omittedKey));
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.keys(value)
      .filter((key) => key !== omittedKey)
      .map((key) => [key, omitKeyDeep(value[key], omittedKey)]),
  );
}

function assertFalseWebAuthority(authority, label) {
  assertRecord(authority, label);
  assert(authority.defaultKernel === "legacy-eih-1pn", `${label}-default-kernel`);
  assert(authority.v2Mode === "shadow", `${label}-v2-mode`);
  for (const field of [
    "promotionDecision",
    "measuredAuthorityGranted",
    "gpuAuthorityGranted",
    "scientificPayloadMutationAllowed",
    "productionReleaseAuthorized",
  ]) {
    assert(authority[field] === false, `${label}-${field}`);
  }
}

function assertExternalReferenceAuthority(authority, label) {
  assertRecord(authority, label);
  assert(authority.geometryReferenceGranted === true, `${label}-geometry-reference`);
  assert(
    authority.polarizationTransportReferenceGranted === true,
    `${label}-polarization-reference`,
  );
  for (const field of [
    "radiativeTransferGranted",
    "measuredAuthorityGranted",
    "gpuAuthorityGranted",
    "sciencePayloadMutationAllowed",
  ]) {
    assert(authority[field] === false, `${label}-${field}`);
  }
}

function assertManifestEntry(entry, label) {
  assertRecord(entry, label);
  assert(
    Object.keys(entry).every((key) => ["path", "bytes", "sha256"].includes(key)),
    `${label}-unknown-field`,
  );
  assert(Number.isSafeInteger(entry.bytes) && entry.bytes > 0, `${label}-bytes`);
  assertHex(entry.sha256, `${label}-sha`);
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

const trajectoryEvidence = readJsonDocument(
  trajectoryEvidencePath,
  "trajectory-evidence",
);
const trajectoryReceipt = readJsonDocument(
  trajectoryReceiptPath,
  "trajectory-receipt",
);
assertLocalSeal(trajectoryEvidence, "evidenceSha256", "trajectory-evidence");
assertLocalSeal(trajectoryReceipt, "receiptSha256", "trajectory-receipt");
assert(
  trajectoryEvidence.version === "post-v593-relativity-trajectory-evidence-v3",
  "trajectory-evidence-version",
);
assert(
  trajectoryReceipt.version
    === "post-v593-relativity-trajectory-reference-receipt-v3",
  "trajectory-receipt-version",
);
assert(trajectoryEvidence.status === TRAJECTORY_STATUS, "trajectory-evidence-status");
assert(trajectoryReceipt.status === TRAJECTORY_STATUS, "trajectory-receipt-status");
assert(trajectoryEvidence.formalProductPointer === "v263", "trajectory-evidence-pointer");
assert(trajectoryReceipt.formalProductPointer === "v263", "trajectory-receipt-pointer");
assertFalseWebAuthority(trajectoryEvidence.authority, "trajectory-evidence-authority");
assertFalseWebAuthority(trajectoryReceipt.authority, "trajectory-receipt-authority");
assert(
  trajectoryReceipt.productionReleaseAuthorized === false,
  "trajectory-receipt-production-authority",
);
assert(
  trajectoryReceipt.evidencePath === trajectoryEvidenceRelativePath,
  "trajectory-receipt-evidence-path",
);
assert(
  trajectoryReceipt.evidenceSha256 === trajectoryEvidence.evidenceSha256,
  "trajectory-receipt-evidence-binding",
);
assertRecord(trajectoryEvidence.runner, "trajectory-runner");
assertRecord(trajectoryEvidence.result, "trajectory-result");
assert(
  trajectoryEvidence.runner.version === "post-v593-relativity-trajectory-reference-v1",
  "trajectory-runner-version",
);
assert(
  trajectoryEvidence.runner.boundary
    === "offline-fixed-step-rk4-shadow-no-live-or-worker-state-mutation",
  "trajectory-runner-boundary",
);
assert(
  trajectoryEvidence.result.version === trajectoryEvidence.runner.version
    && trajectoryEvidence.result.boundary === trajectoryEvidence.runner.boundary,
  "trajectory-result-runner-binding",
);
const trajectoryResultSha256 = assertHex(
  trajectoryEvidence.result.resultSha256,
  "trajectory-result",
);
assert(
  trajectoryResultSha256
    === canonicalExternalSha(
      omitKeyDeep(trajectoryEvidence.result, "resultSha256"),
      true,
    ),
  "trajectory-result-seal",
);
assert(
  trajectoryEvidence.runner.resultSha256 === trajectoryResultSha256
    && trajectoryReceipt.resultSha256 === trajectoryResultSha256,
  "trajectory-result-identity-binding",
);
assert(
  trajectoryEvidence.result.mode === "shadow-read-only"
    && trajectoryEvidence.result.deterministic === true
    && trajectoryEvidence.result.callerStateMutated === false
    && trajectoryEvidence.result.liveStateMutated === false
    && trajectoryEvidence.result.workerStateMutated === false
    && trajectoryEvidence.result.scientificPayloadWriteback === false
    && trajectoryEvidence.result.promotion === "not-a-promotion-decision",
  "trajectory-result-boundary",
);
assertRecord(trajectoryEvidence.gates, "trajectory-evidence-gates");
assertRecord(trajectoryReceipt.gates, "trajectory-receipt-gates");
assert(
  Object.keys(trajectoryEvidence.gates).sort().join(",")
    === [...TRAJECTORY_GATES].sort().join(","),
  "trajectory-evidence-gates-schema",
);
assert(
  Object.keys(trajectoryReceipt.gates).sort().join(",")
    === [...TRAJECTORY_GATES].sort().join(","),
  "trajectory-receipt-gates-schema",
);
for (const gate of TRAJECTORY_GATES) {
  assert(trajectoryEvidence.gates[gate] === true, `trajectory-evidence-gate-${gate}`);
  assert(trajectoryReceipt.gates[gate] === true, `trajectory-receipt-gate-${gate}`);
}
assert(
  deepIdentityEqual(trajectoryEvidence.gates, trajectoryReceipt.gates),
  "trajectory-gates-binding",
);
assertRecord(trajectoryEvidence.source, "trajectory-source");
assert(Array.isArray(trajectoryEvidence.source.files), "trajectory-source-files");
assert(
  trajectoryEvidence.source.files.map((entry) => entry?.path).join("\n")
    === EXPECTED_TRAJECTORY_SOURCE_PATHS.join("\n"),
  "trajectory-source-files-schema",
);
const seenTrajectorySourcePaths = new Set();
for (const [index, entry] of trajectoryEvidence.source.files.entries()) {
  assertRecord(entry, `trajectory-source-${index}`);
  assert(
    Object.keys(entry).every((key) => ["path", "bytes", "sha256"].includes(key)),
    `trajectory-source-${index}-unknown-field`,
  );
  assert(!seenTrajectorySourcePaths.has(entry.path), `trajectory-source-${index}-duplicate`);
  seenTrajectorySourcePaths.add(entry.path);
  const sourcePath = safeExistingRelativeFile(root, entry.path, `trajectory-source-${index}`);
  const identity = fileIdentity(sourcePath);
  assertHex(entry.sha256, `trajectory-source-${index}`);
  assert(entry.sha256 === identity.sha256, `trajectory-source-${index}-sha-binding`);
  if (Object.hasOwn(entry, "bytes")) {
    assert(
      Number.isSafeInteger(entry.bytes) && entry.bytes === identity.bytes,
      `trajectory-source-${index}-bytes-binding`,
    );
  }
}
const trajectorySourceBundleSha256 = canonicalSha(trajectoryEvidence.source.files);
assert(
  trajectoryEvidence.source.sourceBundleSha256 === trajectorySourceBundleSha256
    && trajectoryReceipt.sourceBundleSha256 === trajectorySourceBundleSha256,
  "trajectory-source-bundle-binding",
);

const engineManifest = readJsonDocument(engineManifestPath, "engine-manifest");
const observation = readJsonDocument(observationPath, "observation");
const summary = readJsonDocument(summaryPath, "observation-summary");
const externalReceipt = readJsonDocument(receiptPath, "observation-verification-receipt");
const convergence = readJsonDocument(convergencePath, "convergence-report");
const reverificationReceipt = readJsonDocument(
  reverificationReceiptPath,
  "observation-reverification-receipt",
);
const inputManifest = readJsonDocument(inputManifestPath, "input-manifest");
const sourceManifest = readJsonDocument(sourceManifestPath, "source-manifest");
const licenseManifest = readJsonDocument(licenseManifestPath, "license-manifest");

assertExternalSeal(engineManifest, "manifestSha256", "engine-manifest");
assertExternalSeal(observation, "artifactSha256", "observation");
assertExternalSeal(summary, "summarySha256", "observation-summary");
assertExternalSeal(
  externalReceipt,
  "receiptSha256",
  "observation-verification-receipt",
);
assertExternalSeal(convergence, "reportSha256", "convergence-report");
assertExternalSeal(
  reverificationReceipt,
  "resultSha256",
  "observation-reverification-receipt",
);
assertExternalSeal(inputManifest, "manifestSha256", "input-manifest");
assertExternalSeal(sourceManifest, "manifestSha256", "source-manifest");
assertExternalSeal(licenseManifest, "manifestSha256", "license-manifest");

assert(
  engineManifest.version === "v3-orbit-relativity-engine-observation-manifest",
  "engine-manifest-version",
);
assert(engineManifest.engineVersion === "v3-kerr-observation-reference", "engine-version");
assert(engineManifest.authorityState === EXTERNAL_STATUS, "engine-manifest-status");
assertRecord(engineManifest.config, "engine-config");
assert(engineManifest.config.metric === "kerr", "engine-config-metric");
assert(engineManifest.config.scienceMode === "cpu-authority", "engine-config-science-mode");
assertRecord(engineManifest.config.sampling, "engine-config-sampling");
assert(engineManifest.config.sampling.maxDepth === 8, "engine-config-depth");
assert(
  engineManifest.inputSha256
    === canonicalExternalSha(engineManifest.config, false),
  "engine-manifest-input-sha",
);
assert(Array.isArray(engineManifest.sourceManifest), "engine-manifest-source-manifest");
assert(
  engineManifest.sourceSha256
    === canonicalExternalSha(engineManifest.sourceManifest, false),
  "engine-manifest-source-sha",
);
assert(Array.isArray(engineManifest.files), "engine-manifest-files");
assert(engineManifest.files.length === 19, "engine-manifest-file-count");
const manifestEntries = new Map();
for (const [index, entry] of engineManifest.files.entries()) {
  assertManifestEntry(entry, `engine-manifest-file-${index}`);
  assert(!manifestEntries.has(entry.path), `engine-manifest-file-${index}-duplicate`);
  const path = safeExistingRelativeFile(
    candidateDir,
    entry.path,
    `engine-manifest-file-${index}`,
  );
  const identity = fileIdentity(path);
  assert(identity.bytes === entry.bytes, `engine-manifest-file-${index}-bytes-binding`);
  assert(identity.sha256 === entry.sha256, `engine-manifest-file-${index}-sha-binding`);
  manifestEntries.set(entry.path, entry);
}
for (const requiredPath of [
  "observation.json",
  "observation-summary.json",
  "observation-verification-receipt.json",
  "convergence-report.json",
  "observation.h5",
  "observables.fits",
  "input-manifest.json",
  "source-manifest.json",
  "license-manifest.json",
]) {
  assert(manifestEntries.has(requiredPath), `engine-manifest-required-${requiredPath}`);
}
assert(
  !manifestEntries.has("observation-reverification-receipt.json"),
  "engine-manifest-reverification-circular-entry",
);

assert(inputManifest.version === "v3-kerr-observation-input-manifest", "input-version");
assert(
  inputManifest.inputSha256 === engineManifest.inputSha256
    && deepIdentityEqual(inputManifest.config, engineManifest.config),
  "input-manifest-engine-binding",
);
assert(
  sourceManifest.version === "v3-kerr-observation-source-manifest",
  "source-version",
);
assert(
  sourceManifest.sourceSha256 === engineManifest.sourceSha256
    && deepIdentityEqual(sourceManifest.files, engineManifest.sourceManifest),
  "source-manifest-engine-binding",
);
assert(
  licenseManifest.version === "v3-kerr-observation-license-manifest"
    && licenseManifest.sourceCodeLicense === "unavailable"
    && licenseManifest.publicDataLicense
      === "not-applicable-no-measured-payload-acquired"
    && licenseManifest.reuseGrantInvented === false,
  "license-manifest-boundary",
);

assert(observation.version === "v3-kerr-observation-artifact", "observation-version");
assert(observation.schemaVersion === "orbit-observation-artifact/v3", "observation-schema");
assert(observation.engineVersion === engineManifest.engineVersion, "observation-engine");
assert(observation.metric === "kerr", "observation-metric");
assert(
  observation.canonicalSerialization === EXTERNAL_CANONICAL_SERIALIZATION,
  "observation-canonical-serialization",
);
assert(observation.authorityState === EXTERNAL_STATUS, "observation-status");
assertExternalReferenceAuthority(observation.authority, "observation-authority");
assert(
  observation.artifactSha256 === engineManifest.artifactSha256,
  "observation-manifest-artifact-binding",
);
assert(
  observation.inputSha256 === engineManifest.inputSha256
    && observation.sourceSha256 === engineManifest.sourceSha256
    && deepIdentityEqual(observation.sourceManifest, engineManifest.sourceManifest),
  "observation-manifest-provenance-binding",
);
const observationCoreUnsigned = { ...observation };
delete observationCoreUnsigned.artifactSha256;
delete observationCoreUnsigned.observationCoreSha256;
assert(
  observation.observationCoreSha256
    === canonicalExternalSha(observationCoreUnsigned, true),
  "observation-core-seal",
);
assert(Array.isArray(observation.rays), "observation-rays");
assert(Array.isArray(observation.events), "observation-events");
assert(observation.rays.length === EXPECTED_RAY_COUNT, "observation-ray-count");
assert(observation.events.length === EXPECTED_EVENT_COUNT, "observation-event-count");
assertRecord(observation.counts, "observation-counts");
assert(
  observation.counts.rayCount === EXPECTED_RAY_COUNT
    && observation.counts.eventCount === EXPECTED_EVENT_COUNT
    && observation.counts.unresolvedCellCount === 0,
  "observation-count-binding",
);
assertRecord(observation.counts.classification, "observation-classification-counts");
assert(
  observation.counts.classification.incomplete === 0
    && observation.counts.classification.numerical_failure === 0,
  "observation-terminal-classification",
);

assert(summary.version === "ObservationSummaryV3", "summary-version");
assert(summary.status === EXTERNAL_STATUS, "summary-status");
assert(summary.presentationOnly === true, "summary-presentation-boundary");
assert(summary.authorityReference === observation.artifactSha256, "summary-artifact-binding");
assertExternalReferenceAuthority(summary.authority, "summary-authority");
assert(deepIdentityEqual(summary.counts, observation.counts), "summary-count-binding");
assert(Array.isArray(summary.fields) && summary.fields.length > 0, "summary-fields");
for (const [index, field] of summary.fields.entries()) {
  assertRecord(field, `summary-field-${index}`);
  assert(field.presentationOnly === true, `summary-field-${index}-presentation`);
  const entry = manifestEntries.get(field.path);
  assert(entry, `summary-field-${index}-manifest-entry`);
  assert(
    entry.sha256 === field.sha256 && entry.bytes === field.bytes,
    `summary-field-${index}-manifest-binding`,
  );
}
assertRecord(summary.fits, "summary-fits");
const fitsEntry = manifestEntries.get("observables.fits");
assert(
  summary.fits.path === "observables.fits"
    && summary.fits.sha256 === fitsEntry.sha256
    && summary.fits.bytes === fitsEntry.bytes,
  "summary-fits-binding",
);

assert(
  externalReceipt.version === "v3-kerr-observation-verification-receipt",
  "external-receipt-version",
);
assert(externalReceipt.status === EXTERNAL_STATUS, "external-receipt-status");
assertExternalReferenceAuthority(externalReceipt.authority, "external-receipt-authority");
for (const field of [
  "measuredAuthorityGranted",
  "radiativeTransferGranted",
  "gpuAuthorityGranted",
  "sciencePayloadMutationAllowed",
]) {
  assert(externalReceipt[field] === false, `external-receipt-${field}`);
}
assert(
  externalReceipt.artifactSha256 === observation.artifactSha256
    && externalReceipt.observationCoreSha256 === observation.observationCoreSha256
    && externalReceipt.summarySha256 === summary.summarySha256
    && externalReceipt.inputSha256 === engineManifest.inputSha256
    && externalReceipt.sourceSha256 === engineManifest.sourceSha256,
  "external-receipt-identity-binding",
);
assert(
  externalReceipt.hdf5Sha256 === manifestEntries.get("observation.h5").sha256
    && externalReceipt.fitsSha256 === fitsEntry.sha256
    && externalReceipt.convergenceReportSha256
      === manifestEntries.get("convergence-report.json").sha256,
  "external-receipt-file-binding",
);
assert(
  engineManifest.summarySha256 === summary.summarySha256,
  "engine-summary-identity-binding",
);

assert(
  convergence.version === "v3-kerr-observation-convergence-report",
  "convergence-version",
);
assert(
  convergence.method === "deterministic-adaptive-quadtree-area-sequence",
  "convergence-method",
);
assert(convergence.status === "qualified", "convergence-status");
assert(convergence.qualified === true, "convergence-qualified");
assert(convergence.unresolvedCellCount === 0, "convergence-unresolved");
assert(convergence.threshold === CONVERGENCE_THRESHOLD, "convergence-threshold");
assert(Array.isArray(convergence.rows) && convergence.rows.length >= 2, "convergence-rows");
assert(
  Array.isArray(convergence.changes)
    && convergence.changes.length === convergence.rows.length - 1,
  "convergence-changes",
);
const finalConvergenceRow = convergence.rows.at(-1);
const finalConvergenceChange = convergence.changes.at(-1);
assertRecord(finalConvergenceRow, "convergence-final-row");
assertRecord(finalConvergenceChange, "convergence-final-change");
assert(finalConvergenceRow.depth === 8, "convergence-final-depth");
assert(finalConvergenceRow.incompleteAreaM2 === 0, "convergence-final-incomplete-area");
assert(
  finalConvergenceChange.fromDepth === 7
    && finalConvergenceChange.toDepth === 8,
  "convergence-final-depth-pair",
);
for (const field of [
  "captureAreaRelativeChange",
  "diskHitAreaRelativeChange",
  "maximumRelativeChange",
]) {
  assert(
    typeof finalConvergenceChange[field] === "number"
      && Number.isFinite(finalConvergenceChange[field])
      && finalConvergenceChange[field] >= 0,
    `convergence-final-${field}-finite`,
  );
}
assert(
  finalConvergenceChange.maximumRelativeChange
    === Math.max(
      finalConvergenceChange.captureAreaRelativeChange,
      finalConvergenceChange.diskHitAreaRelativeChange,
    ),
  "convergence-final-maximum-binding",
);
assert(
  finalConvergenceChange.maximumRelativeChange <= CONVERGENCE_THRESHOLD,
  "convergence-final-threshold",
);

const oracle = assertRecord(
  observation.benchmarks?.kerrSchildOracle,
  "observation-oracle",
);
const summaryOracle = assertRecord(
  summary.benchmarks?.kerrSchildOracle,
  "summary-oracle",
);
const oracleSummaryView = { ...oracle };
delete oracleSummaryView.rows;
assert(deepIdentityEqual(oracleSummaryView, summaryOracle), "oracle-summary-binding");
assert(
  oracle.status === "qualified"
    && oracle.qualified === true
    && oracle.requiredRayCount === EXPECTED_ORACLE_RAY_COUNT
    && oracle.requestedRayCount === EXPECTED_ORACLE_RAY_COUNT
    && oracle.executedRayCount === EXPECTED_ORACLE_RAY_COUNT
    && oracle.classificationAgreement === true
    && oracle.parallelTransportQualified === true,
  "oracle-qualification",
);
assert(oracle.selection?.stratificationQualified === true, "oracle-stratification");
assert(
  Array.isArray(oracle.rows) && oracle.rows.length === EXPECTED_ORACLE_RAY_COUNT,
  "oracle-row-count",
);
for (const [index, row] of oracle.rows.entries()) {
  assertRecord(row, `oracle-row-${index}`);
  assert(
    row.classificationMatch === true
      && row.primaryClassification === row.independentClassification,
    `oracle-row-${index}-classification`,
  );
  if (row.primaryClassification === "disk_hit") {
    assert(
      row.parallelTransport?.status === "qualified"
        && row.parallelTransport?.success === true,
      `oracle-row-${index}-parallel-transport`,
    );
  }
}

assert(
  reverificationReceipt.version
    === "v3-orbit-relativity-engine-observation-reverification-receipt",
  "reverification-version",
);
assert(
  reverificationReceipt.status
    === "passed-current-worktree-observation-manifest-and-scientific-roundtrip",
  "reverification-status",
);
assert(
  reverificationReceipt.manifestPath === "engine-manifest.json"
    && reverificationReceipt.manifestSha256 === engineManifest.manifestSha256
    && reverificationReceipt.fileCount === engineManifest.files.length,
  "reverification-manifest-binding",
);
for (const field of [
  "radiativeTransferGranted",
  "measuredAuthorityGranted",
  "gpuAuthorityGranted",
]) {
  assert(reverificationReceipt[field] === false, `reverification-${field}`);
}
const scientificVerification = assertRecord(
  reverificationReceipt.scientificVerification,
  "reverification-scientific",
);
assert(
  scientificVerification.version === "v3-kerr-observation-product-verification"
    && scientificVerification.verified === true
    && scientificVerification.manifestSha256 === engineManifest.manifestSha256
    && scientificVerification.artifactSha256 === observation.artifactSha256
    && scientificVerification.rayCount === EXPECTED_RAY_COUNT
    && scientificVerification.eventCount === EXPECTED_EVENT_COUNT
    && scientificVerification.hdf5RoundTripQualified === true
    && scientificVerification.fitsRoundTripQualified === true
    && scientificVerification.deterministicReplayQualified === true,
  "reverification-scientific-binding",
);
assertExternalReferenceAuthority(
  scientificVerification.authority,
  "reverification-scientific-authority",
);

const observationIdentity = fileIdentity(observationPath);
const summaryIdentity = fileIdentity(summaryPath);
const externalReceiptIdentity = fileIdentity(receiptPath);
const engineManifestIdentity = fileIdentity(engineManifestPath);
const convergenceIdentity = fileIdentity(convergencePath);
const reverificationIdentity = fileIdentity(reverificationReceiptPath);
const hdf5Identity = fileIdentity(
  safeExistingRelativeFile(candidateDir, "observation.h5", "observation-hdf5"),
);
const fitsIdentity = fileIdentity(
  safeExistingRelativeFile(candidateDir, "observables.fits", "observation-fits"),
);
assert(
  convergenceIdentity.sha256 === externalReceipt.convergenceReportSha256
    && convergenceIdentity.sha256
      === manifestEntries.get("convergence-report.json").sha256
    && convergenceIdentity.bytes
      === manifestEntries.get("convergence-report.json").bytes,
  "convergence-file-identity-binding",
);
assert(
  hdf5Identity.sha256 === externalReceipt.hdf5Sha256
    && fitsIdentity.sha256 === externalReceipt.fitsSha256,
  "scientific-roundtrip-file-identity-binding",
);

const dossierUnsigned = {
  version: "post-v593-relativity-reference-dossier-v3",
  generatedAt,
  status: "qualified-independent-kerr-schild-64-ray-reference-and-adaptive-convergence",
  source: {
    engineRoot: externalRoot,
    candidateDir,
    observationPath,
    summaryPath,
    receiptPath,
    engineManifestPath,
    convergencePath,
    reverificationReceiptPath,
    sourceSha256: engineManifest.sourceSha256,
    inputSha256: engineManifest.inputSha256,
    artifactSha256: observation.artifactSha256,
    observationCoreSha256: observation.observationCoreSha256,
    summarySha256: summary.summarySha256,
    receiptSha256: externalReceipt.receiptSha256,
    engineManifestSha256: engineManifest.manifestSha256,
    convergenceFileSha256: convergenceIdentity.sha256,
    convergenceReportDocumentSha256: convergence.reportSha256,
    convergenceReceiptFileSha256: externalReceipt.convergenceReportSha256,
    convergenceManifestFileSha256:
      manifestEntries.get("convergence-report.json").sha256,
    reverificationResultSha256: reverificationReceipt.resultSha256,
    observationFile: observationIdentity,
    summaryFile: summaryIdentity,
    verificationReceiptFile: externalReceiptIdentity,
    engineManifestFile: engineManifestIdentity,
    convergenceFile: convergenceIdentity,
    reverificationReceiptFile: reverificationIdentity,
    hdf5File: hdf5Identity,
    fitsFile: fitsIdentity,
    manifestFileCount: engineManifest.files.length,
    externalIdentityBound: true,
  },
  independentReference: {
    webRunnerVersion: "v3-relativity-reference-runner-shadow-read-only",
    webRunnerBoundary:
      "independent-v2-reference-runner-no-live-or-worker-physics-mutation",
    trajectoryRunnerVersion: trajectoryEvidence.runner.version,
    trajectoryRunnerBoundary: trajectoryEvidence.runner.boundary,
    trajectoryEvidencePath: trajectoryEvidenceRelativePath,
    trajectoryReceiptPath: trajectoryReceiptRelativePath,
    trajectoryEvidenceSha256: trajectoryEvidence.evidenceSha256,
    trajectoryReceiptSha256: trajectoryReceipt.receiptSha256,
    trajectoryResultSha256,
    trajectorySourceBundleSha256,
    externalEngineVersion: summary.engineVersion,
    externalAuthorityReference: summary.authorityReference,
    externalGeometryReferenceQualified: true,
    externalPolarizationTransportReferenceQualified: true,
    externalReferenceDoesNotGrantWebProductAuthority: true,
  },
  kerr: {
    externalStatus: summary.status,
    oracleStatus: oracle.status,
    requestedRayCount: oracle.requestedRayCount,
    executedRayCount: oracle.executedRayCount,
    requiredRayCount: oracle.requiredRayCount,
    classificationAgreement: oracle.classificationAgreement,
    stratificationQualified: oracle.selection.stratificationQualified,
    parallelTransportQualified: oracle.parallelTransportQualified,
    maxEndpointDifferenceM: oracle.maxEndpointDifferenceM,
    maxRedshiftRelativeDifference: oracle.maxRedshiftRelativeDifference,
    maxEvpaDifferenceRad: oracle.maxEvpaDifferenceRad,
    maxNormalizedHamiltonian: oracle.maxNormalizedHamiltonian,
    convergenceQualified: true,
    convergenceStatus: convergence.status,
    convergenceThreshold: convergence.threshold,
    convergenceMaximumRelativeChange:
      finalConvergenceChange.maximumRelativeChange,
    convergenceFromDepth: finalConvergenceChange.fromDepth,
    convergenceToDepth: finalConvergenceChange.toDepth,
    convergenceIdentityBound: true,
    convergenceUnresolvedCellCount: convergence.unresolvedCellCount,
    oracleQualified: true,
    externalIdentityBound: true,
    reverificationStatus: reverificationReceipt.status,
    reverificationRayCount: scientificVerification.rayCount,
    reverificationEventCount: scientificVerification.eventCount,
    hdf5RoundTripQualified: scientificVerification.hdf5RoundTripQualified,
    fitsRoundTripQualified: scientificVerification.fitsRoundTripQualified,
    deterministicReplayQualified:
      scientificVerification.deterministicReplayQualified,
    externalGeometryReferenceQualified: true,
    externalPolarizationTransportReferenceQualified: true,
    noHardCodedZeroDrift: true,
    threeDimensionalThetaDynamics: true,
    nullAndTimelikeContract:
      "external-observation-ray-lane; web geodesic teaching kernel remains non-authority",
  },
  weakField: {
    defaultKernel: "legacy-eih-1pn",
    v2Mode: "shadow",
    promotionApplied: false,
    scientificPayloadWriteback: false,
    trajectoryStatus: trajectoryEvidence.status,
    trajectorySealsQualified: true,
    trajectorySourceIdentityBound: true,
    trajectoryQualified: true,
    deterministicReplayQualified:
      trajectoryEvidence.gates.deterministicReplay,
    threeKernelObservedOrderQualified:
      trajectoryEvidence.gates.threeKernelObservedOrderQualified,
    fullTrajectoryReverseTimeQualified:
      trajectoryEvidence.gates.fullTrajectoryReverseTimeQualified,
    v2ReverseSpinPolicyQualified:
      trajectoryEvidence.gates.v2ReverseSpinPolicyQualified,
    perBodyQualified: trajectoryEvidence.gates.perBodyQualified,
    aggregateQualified: trajectoryEvidence.gates.aggregateQualified,
    effectIsolationQualified:
      trajectoryEvidence.gates.effectIsolationQualified,
    trajectoryPromotionDecision: false,
    ephemerisPromotionGates: "not-run-by-this-dossier",
  },
  authority: {
    geometryReferenceGranted: false,
    polarizationTransportReferenceGranted: false,
    radiativeTransferGranted: false,
    measuredAuthorityGranted: false,
    gpuAuthorityGranted: false,
    grmhdGranted: false,
    scientificPayloadMutationAllowed: false,
    productionReleaseAuthorized: false,
  },
  formalProductPointer: "v263",
  unresolved: [
    "full-3d-kerr-reference-is-not-the-browser-teaching-track",
    "weak-field-v2-ephemeris-promotion-gates-not-run-by-this-dossier",
  ],
};
const dossier = {
  ...dossierUnsigned,
  dossierSha256: canonicalSha(dossierUnsigned),
};
const receiptUnsignedOut = {
  version: "post-v593-relativity-reference-receipt-v3",
  generatedAt,
  status: dossier.status,
  dossierPath:
    "public/data/post-v593-stellar-relativity/relativity-reference-v3.json",
  dossierSha256: dossier.dossierSha256,
  source: dossier.source,
  authority: dossier.authority,
  formalProductPointer: dossier.formalProductPointer,
  productionReleaseAuthorized: false,
};
const receiptOut = {
  ...receiptUnsignedOut,
  receiptSha256: canonicalSha(receiptUnsignedOut),
};

writeJson(outputPath, dossier);
writeJson(receiptOutputPath, receiptOut);
console.log(JSON.stringify({
  status: dossier.status,
  oracleQualified: dossier.kerr.oracleQualified,
  convergenceQualified: dossier.kerr.convergenceQualified,
  externalIdentityBound: dossier.kerr.externalIdentityBound,
  requestedRayCount: dossier.kerr.requestedRayCount,
  executedRayCount: dossier.kerr.executedRayCount,
  reverificationRayCount: dossier.kerr.reverificationRayCount,
  reverificationEventCount: dossier.kerr.reverificationEventCount,
  dossierSha256: dossier.dossierSha256,
  receiptSha256: receiptOut.receiptSha256,
}, null, 2));
