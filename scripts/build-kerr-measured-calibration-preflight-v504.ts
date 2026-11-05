import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  canonicalKerrMeasuredCalibrationPreflightV504,
  KERR_MEASURED_CALIBRATION_PREFLIGHT_VERSION_V504,
  parseKerrMeasuredCalibrationPreflightArtifactV504,
} from "../app/lib/kerrMeasuredCalibrationPreflightV504";
import { inspectKerrMeasuredCalibrationCandidateV504 } from "../app/lib/kerrMeasuredCalibrationPreflightNodeV504";
import {
  KERR_MEASURED_DETECTOR_STAGING_ROOT_V458,
} from "../app/lib/kerrMeasuredDetectorIntakeEnvelopeV458";
import {
  V458_MAX_FILE_BYTES,
  V458_MAX_TOTAL_BYTES,
} from "../app/lib/kerrMeasuredDetectorIntakeValidatorV458";

const root = process.cwd();
const paths = Object.freeze({
  v458: "dist/science/kerr-measured-detector-intake-v458/intake-inspect.json",
  v503: "dist/science/kerr-measured-calibration-readiness-v503/readiness.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  validator: "app/lib/kerrMeasuredDetectorIntakeValidatorV458.ts",
  output:
    "dist/science/kerr-measured-calibration-preflight-v504/preflight.json",
});
const transient = new Set([
  "generatedAt",
  "artifactSha256",
  "payloadSha256",
  "stageChainSha256",
  "evidenceSha256",
  "pointerSha256",
]);
const bytes = (path: string) => readFileSync(resolve(root, path));
const read = (path: string) => JSON.parse(bytes(path).toString("utf8"));
const fileSha = (path: string) =>
  createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : !value || typeof value !== "object"
      ? value
      : Object.fromEntries(
          Object.entries(value as Record<string, unknown>)
            .filter(([key]) => !transient.has(key))
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );
const sha = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path: string, value: unknown) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const part = `${target}.${process.pid}.part`;
  writeFileSync(part, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(part, target);
};

const v458 = read(paths.v458);
const v503 = read(paths.v503);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (
  v458.version !== "v458-kerr-measured-detector-intake-artifact-v1" ||
  sha(v458) !== v458.artifactSha256 ||
  v503.version !== "v503-kerr-measured-calibration-readiness-artifact-v1" ||
  sha(v503) !== v503.artifactSha256 ||
  v503.decision.admitted !== false ||
  dense.status !== "incomplete-0-of-49" ||
  dense.completedShardCount !== 0 ||
  dense.attemptConsumed !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
  formalEvidence.contracts?.singleCanvas !== true ||
  formalEvidence.contracts?.legacyRootAttributes !== 603 ||
  formalEvidence.contracts?.evidenceLedgerClaims !== 84
) {
  throw new Error("v504-upstream-boundary");
}

const observation = inspectKerrMeasuredCalibrationCandidateV504(
  resolve(root, KERR_MEASURED_DETECTOR_STAGING_ROOT_V458),
);
const nextAction = observation.status === "blocked-path-safety"
  ? "resolve-path-safety-violation"
  : observation.missingFileIds.length > 0
    ? "provide-missing-files"
    : observation.invalidFileIds.length > 0
      ? "repair-invalid-files"
      : observation.status === "validation-only"
        ? "replace-synthetic-fixture"
        : "run-independent-validation";
const sourcePaths = [
  paths.v458,
  paths.v503,
  paths.dense,
  paths.formal,
  paths.validator,
  "app/lib/kerrMeasuredCalibrationPreflightV504.ts",
  "app/lib/kerrMeasuredCalibrationPreflightNodeV504.ts",
  "app/lib/kerrMeasuredCalibrationPreflightNodeV504.test.ts",
  "scripts/build-kerr-measured-calibration-preflight-v504.ts",
  "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const unsigned = {
  version: KERR_MEASURED_CALIBRATION_PREFLIGHT_VERSION_V504,
  generatedAt: "2026-08-01T00:00:00Z",
  status: observation.status,
  source: {
    v458ArtifactSha256: v458.artifactSha256,
    v503ReadinessArtifactSha256: v503.artifactSha256,
    validatorFileSha256: fileSha(paths.validator),
  },
  contract: {
    stagingRoot: KERR_MEASURED_DETECTOR_STAGING_ROOT_V458,
    whitelistFileCount: 6 as const,
    maximumFileBytes: V458_MAX_FILE_BYTES,
    maximumTotalBytes: V458_MAX_TOTAL_BYTES,
    explicitCliIntentRequired: true as const,
    readOnlyStagingAccess: true as const,
    regularFilesOnly: true as const,
    symlinkTraversalAllowed: false as const,
    networkAllowed: false as const,
    automaticRetryAllowed: false as const,
    authorityGrantAllowed: false as const,
  },
  observation: {
    stagingRootPresent: observation.stagingRootPresent,
    stagingRootSafe: observation.stagingRootSafe,
    files: observation.files,
    readyFileCount: observation.readyFileCount,
    missingFileIds: observation.missingFileIds,
    invalidFileIds: observation.invalidFileIds,
    pathSafetyViolationIds: observation.pathSafetyViolationIds,
    bytesRead: observation.bytesRead,
    contentClass: observation.contentClass,
    crossFileIdentityQualified: observation.crossFileIdentityQualified,
    provenanceShaLinkageQualified: observation.provenanceShaLinkageQualified,
    licenseBoundaryQualified: observation.licenseBoundaryQualified,
    candidateReadyForIndependentValidation:
      observation.candidateReadyForIndependentValidation,
  },
  decision: {
    preflightQualified: observation.candidateReadyForIndependentValidation,
    canProceedToIndependentValidation:
      observation.candidateReadyForIndependentValidation,
    measuredDetectorAuthorityGranted: false as const,
    runtimeProjectionAllowed: false as const,
    scienceRasterAllowed: false as const,
    nextAction,
  },
  boundary: {
    attemptConsumed: false as const,
    fileContentsPersistedInArtifact: false as const,
    stagingWritePerformed: false as const,
    networkAttempted: false as const,
    automaticRetryApplied: false as const,
    detectorResponseAvailable: false as const,
    observedIntensityAvailable: false as const,
    scienceRasterAvailable: false as const,
    fitsProducts: 0 as const,
    pngProducts: 0 as const,
    denseCampaignStatus: "incomplete-0-of-49" as const,
    browserQualification: "not-run" as const,
  },
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  formalProductPointer: "v263" as const,
  formalDefaultKernel: "legacy-eih-1pn" as const,
};
const artifact = parseKerrMeasuredCalibrationPreflightArtifactV504({
  ...unsigned,
  artifactSha256: createHash("sha256")
    .update(canonicalKerrMeasuredCalibrationPreflightV504(unsigned))
    .digest("hex"),
});
atomic(paths.output, artifact);
console.log(
  JSON.stringify(
    {
      status: artifact.status,
      artifactSha256: artifact.artifactSha256,
      stagingRootPresent: artifact.observation.stagingRootPresent,
      stagingRootSafe: artifact.observation.stagingRootSafe,
      files: `${artifact.observation.readyFileCount}/6`,
      missing: artifact.observation.missingFileIds,
      invalid: artifact.observation.invalidFileIds,
      bytesRead: artifact.observation.bytesRead,
      candidateReadyForIndependentValidation:
        artifact.observation.candidateReadyForIndependentValidation,
      authorityGranted: false,
      nextAction: artifact.decision.nextAction,
    },
    null,
    2,
  ),
);
