import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import {
  canonicalPayloadV450,
} from "../app/lib/kerrDetectorExpectedImageFormationV450";
import {
  parseKerrDetectorInputAdmissionArtifactV451,
  type KerrDetectorInputFileV451,
} from "../app/lib/kerrDetectorInputAdmissionV451";

const root = process.cwd();
const paths = {
  v443: "dist/science/kerr-detector-geometry-staging-v443/staging-inspect.json",
  v450:
    "dist/science/kerr-detector-image-formation-v450/image-formation-qualification.json",
  v447: "dist/science/kerr-detector-electron-kernel-v447/electron-kernel-qualification.json",
  v449: "dist/science/kerr-detector-poisson-gaussian-v449/likelihood-qualification.json",
  output:
    "dist/science/kerr-detector-input-admission-v451/input-admission-qualification.json",
};
const read = (path: string): Record<string, unknown> =>
  JSON.parse(readFileSync(resolve(root, path), "utf8")) as Record<string, unknown>;
const sha = (value: unknown): string =>
  createHash("sha256").update(canonicalPayloadV450(value)).digest("hex");

const v443 = read(paths.v443);
const v450 = read(paths.v450);
const v447 = read(paths.v447);
const v449 = read(paths.v449);
if (
  v443.version !== "v443-kerr-detector-geometry-staging-inspect-v1" ||
  !Array.isArray(v443.files) ||
  v443.files.length !== 6 ||
  v450.status !==
    "expected-electron-image-fixture-qualified-detector-projection-blocked" ||
  v450.qualification == null ||
  (v450.qualification as Record<string, unknown>)
    .expectedElectronFormationFixtureQualified !== true ||
  v447.status !==
    "qualified-unit-strict-electron-expectation-kernel-fixture-only-measured-authority-unavailable" ||
  v449.status !==
    "qualified-exact-poisson-gaussian-reference-fixture-only-normal-approximation-diagnostic"
) {
  throw new Error("v451-source-boundary");
}

const files = (v443.files as KerrDetectorInputFileV451[]).map((file) => ({
  id: file.id,
  fileName: file.fileName,
  format: file.format,
  status: file.status,
  bytes: file.bytes,
  sha256: file.sha256,
  reasons: file.reasons,
}));
const missingFileIds = files
  .filter((file) => file.status === "missing")
  .map((file) => file.id);
const invalidFileIds = files
  .filter((file) => file.status === "invalid")
  .map((file) => file.id);
const inputInventoryQualified = missingFileIds.length === 0 && invalidFileIds.length === 0;
const provenanceShaLinkageQualified =
  inputInventoryQualified && v443.hashLinkagePassed === true;
const structuralStatus =
  missingFileIds.length > 0
    ? ("blocked-v443-detector-inputs-missing" as const)
    : invalidFileIds.length > 0
      ? ("blocked-v443-detector-inputs-invalid" as const)
      : ("blocked-independent-validation-not-run" as const);
const unsigned = {
  version: "v451-kerr-detector-input-admission-artifact-v1",
  generatedAt: "2026-07-30T00:00:00Z",
  status: structuralStatus,
  source: {
    v443ArtifactSha256: String(v443.artifactSha256),
    v450ArtifactSha256: String(v450.artifactSha256),
    v447ArtifactSha256: String(v447.artifactSha256),
    v449ArtifactSha256: String(v449.artifactSha256),
  },
  detector: {
    stagingPath: "dist/staging/kerr-detector-projection-v443",
    requiredFileCount: 6,
    readyFileCount: files.filter((file) => file.status === "ready").length,
    missingFileIds,
    invalidFileIds,
    files,
  },
  semanticContract: {
    collectingAreaMeansGeometricAreaWithoutThroughput: true,
    throughputNotMultipliedTwice: true,
    photonToElectronSemanticsExplicit: true,
    v447ElectronExpectationFixtureOnly: true,
    v449ExactLikelihoodReferenceFixtureOnly: true,
    observedCountsAvailable: false,
    scienceRasterAllowed: false,
  },
  gateDependencies: {
    v441WcsCoordinateAuthority: "qualified",
    v443StructuralInspection:
      inputInventoryQualified ? "ready-for-independent-validation" : "blocked",
    independentV372ToV374Validation: "required-not-run",
    explicitMeasuredAuthorityAdmission: "required-not-granted",
  },
  qualification: {
    inputInventoryQualified,
    provenanceShaLinkageQualified,
    unitSemanticBoundaryQualified: true,
    independentValidationQualified: false,
    measuredDetectorAuthorityGranted: false,
    runtimeProjectionAllowed: false,
    psfAuthority: false,
    pixelResponseAuthority: false,
    scienceRasterAuthority: false,
    observedImageAvailable: false,
    browserQualification: "not-run",
  },
  boundary: {
    currentInputRowsAreMeasured: false,
    fixtureExpectedElectronsMayBeJoined: true,
    detectorProjectionMayRun: false,
    scienceImageMayBeMaterialized: false,
    cinematicMayClaimDetectorImage: false,
    networkAttempted: false,
    automaticRetryApplied: false,
  },
  formalProductPointer: "v263",
  denseCampaignStatus: "incomplete-0-of-49",
};
const artifact = parseKerrDetectorInputAdmissionArtifactV451({
  ...unsigned,
  artifactSha256: sha(unsigned),
});
const target = resolve(root, paths.output);
mkdirSync(dirname(target), { recursive: true });
const part = `${target}.${process.pid}.part`;
writeFileSync(part, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
renameSync(part, target);
console.log(
  JSON.stringify(
    {
      status: artifact.status,
      artifactSha256: artifact.artifactSha256,
      requiredFileCount: artifact.detector.requiredFileCount,
      readyFileCount: artifact.detector.readyFileCount,
      missingFileIds: artifact.detector.missingFileIds,
      invalidFileIds: artifact.detector.invalidFileIds,
      measuredDetectorAuthorityGranted:
        artifact.qualification.measuredDetectorAuthorityGranted,
      scienceRasterAllowed: artifact.qualification.scienceRasterAuthority,
    },
    null,
    2,
  ),
);
