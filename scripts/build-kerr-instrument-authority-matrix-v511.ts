import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  canonicalKerrInstrumentAuthorityMatrixV511,
  parseKerrInstrumentAuthorityMatrixArtifactV511,
} from "../app/lib/kerrInstrumentAuthorityMatrixV511";

const root = process.cwd();
const paths = Object.freeze({
  v444: "dist/science/kerr-photon-response-envelope-v444/photon-response-envelope.json",
  v445: "dist/science/kerr-detector-electron-expectation-v445/electron-expectation-preflight.json",
  v452: "dist/science/kerr-detector-response-composition-v452/response-composition-qualification.json",
  v458: "dist/science/kerr-measured-detector-intake-v458/intake-inspect.json",
  v465: "dist/science/kerr-detector-response-v465/response-contract.json",
  v510: "dist/science/kerr-detector-provenance-envelope-v510/envelope-audit.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  output: "dist/science/kerr-instrument-authority-matrix-v511/matrix.json",
});
const transient = new Set([
  "generatedAt",
  "artifactSha256",
  "payloadSha256",
  "evidenceSha256",
  "pointerSha256",
  "stageChainSha256",
]);
const bytes = (path: string) => readFileSync(resolve(root, path));
const read = (path: string) => JSON.parse(bytes(path).toString("utf8"));
const fileSha = (path: string) => createHash("sha256").update(bytes(path)).digest("hex");
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

const v444 = read(paths.v444);
const v445 = read(paths.v445);
const v452 = read(paths.v452);
const v458 = read(paths.v458);
const v465 = read(paths.v465);
const v510 = read(paths.v510);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (
  sha(v444) !== v444.artifactSha256 ||
  v444.qualification?.photonObservableQualified !== true ||
  v444.qualification?.detectorElectronExpectationAvailable !== false ||
  v444.counts?.responseRowCount !== 4 ||
  sha(v445) !== v445.artifactSha256 ||
  v445.status !== "blocked-detector-calibration-unavailable" ||
  v445.counts?.computationalElectronExpectationRows !== 0 ||
  sha(v452) !== v452.artifactSha256 ||
  v452.qualification?.unitResponseCompositionQualified !== true ||
  v452.qualification?.measuredDetectorAuthorityGranted !== false ||
  v452.counts?.fixtureRowCount !== 4 ||
  v452.counts?.measuredRowCount !== 0 ||
  sha(v458) !== v458.artifactSha256 ||
  v458.inspect?.readyFileCount !== 0 ||
  v458.inspect?.missingFileIds?.length !== 6 ||
  v458.productionAdmission?.measuredDetectorAuthorityGranted !== false ||
  sha(v465) !== v465.artifactSha256 ||
  v465.qualification?.responseContractQualified !== true ||
  v465.qualification?.productionResponseQualified !== false ||
  sha(v510) !== v510.artifactSha256 ||
  v510.envelope?.chain?.readyStageCount !== 3 ||
  v510.boundary?.measuredCalibrationFiles !== "0/6" ||
  v510.boundary?.detectorAuthority !== false ||
  dense.status !== "incomplete-0-of-49" ||
  dense.completedShardCount !== 0 ||
  dense.attemptConsumed !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
  formalEvidence.contracts?.singleCanvas !== true ||
  formalEvidence.contracts?.legacyRootAttributes !== 603 ||
  formalEvidence.contracts?.evidenceLedgerClaims !== 84
) {
  throw new Error("v511-instrument-source-boundary");
}

const sourcePaths = [
  paths.v444,
  paths.v445,
  paths.v452,
  paths.v458,
  paths.v465,
  paths.v510,
  paths.dense,
  paths.formal,
  "app/lib/kerrInstrumentAuthorityMatrixV511.ts",
  "scripts/build-kerr-instrument-authority-matrix-v511.ts",
];
const sourceManifest = sourcePaths
  .map((path) => ({ path, sha256: fileSha(path) }))
  .sort((left, right) => left.path.localeCompare(right.path));
const unsigned = {
  version: "v511-kerr-instrument-authority-matrix-v1" as const,
  generatedAt: "2026-08-01T00:00:00Z",
  status: "instrument-authority-matrix-qualified-measured-response-blocked" as const,
  source: Object.freeze({
    v444ArtifactSha256: v444.artifactSha256,
    v445ArtifactSha256: v445.artifactSha256,
    v452ArtifactSha256: v452.artifactSha256,
    v458ArtifactSha256: v458.artifactSha256,
    v465ArtifactSha256: v465.artifactSha256,
    v510ArtifactSha256: v510.artifactSha256,
    v510EnvelopeSha256: v510.envelope.canonicalSha256,
  }),
  stages: Object.freeze([
    {
      id: "v444-photon-response" as const,
      sourceVersion: v444.version,
      sourceArtifactSha256: v444.artifactSha256,
      authorityClass: "computational-photon-observable" as const,
      inputRows: 4,
      outputRows: 4,
      measuredRows: 0 as const,
      authorityGranted: true,
      detectorResponseAvailable: false as const,
      observedCountsAvailable: false as const,
      scienceRasterAvailable: false as const,
      reason: "sparse-photon-radiance-qualified-no-detector-projection",
    },
    {
      id: "v445-electron-preflight" as const,
      sourceVersion: v445.version,
      sourceArtifactSha256: v445.artifactSha256,
      authorityClass: "blocked-prerequisites" as const,
      inputRows: 4,
      outputRows: 0,
      measuredRows: 0 as const,
      authorityGranted: false,
      detectorResponseAvailable: false as const,
      observedCountsAvailable: false as const,
      scienceRasterAvailable: false as const,
      reason: "collecting-area-solid-angle-exposure-calibration-missing",
    },
    {
      id: "v452-response-composition" as const,
      sourceVersion: v452.version,
      sourceArtifactSha256: v452.artifactSha256,
      authorityClass: "validation-fixture-only" as const,
      inputRows: 4,
      outputRows: 4,
      measuredRows: 0 as const,
      authorityGranted: false,
      detectorResponseAvailable: false as const,
      observedCountsAvailable: false as const,
      scienceRasterAvailable: false as const,
      reason: "unit-composition-fixture-qualified-not-measured",
    },
    {
      id: "v458-measured-intake" as const,
      sourceVersion: v458.version,
      sourceArtifactSha256: v458.artifactSha256,
      authorityClass: "measured-intake-blocked" as const,
      inputRows: 6,
      outputRows: 0,
      measuredRows: 0 as const,
      authorityGranted: false,
      detectorResponseAvailable: false as const,
      observedCountsAvailable: false as const,
      scienceRasterAvailable: false as const,
      reason: "six-measured-calibration-files-missing",
    },
    {
      id: "v465-response-contract" as const,
      sourceVersion: v465.version,
      sourceArtifactSha256: v465.artifactSha256,
      authorityClass: "response-contract-only" as const,
      inputRows: 0,
      outputRows: 0,
      measuredRows: 0 as const,
      authorityGranted: false,
      detectorResponseAvailable: false as const,
      observedCountsAvailable: false as const,
      scienceRasterAvailable: false as const,
      reason: "contract-qualified-production-calibration-blocked",
    },
    {
      id: "v510-portable-provenance" as const,
      sourceVersion: v510.version,
      sourceArtifactSha256: v510.artifactSha256,
      authorityClass: "portable-provenance" as const,
      inputRows: 3,
      outputRows: 1,
      measuredRows: 0 as const,
      authorityGranted: false,
      detectorResponseAvailable: false as const,
      observedCountsAvailable: false as const,
      scienceRasterAvailable: false as const,
      reason: "evidence-portable-authority-remains-blocked",
    },
  ]),
  dimensionalContract: Object.freeze({
    sourceObservable: "photon-radiance-per-second-per-square-metre-per-steradian" as const,
    electronExpectationEquation:
      "integral-Lph-times-area-times-solid-angle-times-exposure-times-response-plus-backgrounds" as const,
    responseAppliedExactlyOnce: true as const,
    collectingAreaGeometricOnly: true as const,
    gainAppliedAfterElectronExpectation: true as const,
    psfAndDistortionAppliedBeforeRasterQualification: true as const,
    missingQuantityPolicy: "null-not-zero" as const,
  }),
  transitions: Object.freeze([
    {
      id: "radiance-to-electrons" as const,
      status: "blocked" as const,
      missingAuthorities: Object.freeze([
        "collecting-area",
        "pixel-solid-angle",
        "exposure",
        "measured-spectral-response",
      ]),
      syntheticFallbackAllowed: false as const,
    },
    {
      id: "electrons-to-adu" as const,
      status: "blocked" as const,
      missingAuthorities: Object.freeze([
        "measured-gain",
        "read-noise",
        "dark-current",
        "full-well-and-saturation",
      ]),
      syntheticFallbackAllowed: false as const,
    },
    {
      id: "adu-to-science-raster" as const,
      status: "blocked" as const,
      missingAuthorities: Object.freeze([
        "measured-distortion",
        "measured-psf",
        "pixel-response",
        "observed-detector-frame",
      ]),
      syntheticFallbackAllowed: false as const,
    },
  ]),
  counts: Object.freeze({
    stageCount: 6 as const,
    sourcePhotonRows: 4 as const,
    computationalFixtureRows: 4 as const,
    measuredCalibrationFiles: 0 as const,
    requiredMeasuredCalibrationFiles: 6 as const,
    measuredResponseRows: 0 as const,
    electronExpectationRows: 0 as const,
    observedCountRows: 0 as const,
    sciencePixelRows: 0 as const,
  }),
  qualification: Object.freeze({
    sourceChainCanonicalShaQualified: true as const,
    dimensionalContractQualified: true as const,
    responseDoubleCountingFirewallQualified: true as const,
    syntheticAuthorityFirewallQualified: true as const,
    portableProvenanceQualified: true as const,
    measuredDetectorAuthorityGranted: false as const,
    productionResponseQualified: false as const,
    scienceRasterQualified: false as const,
    browserQualification: "not-run" as const,
  }),
  boundary: Object.freeze({
    detectorResponseAvailable: false as const,
    observedCountsAvailable: false as const,
    observedIntensityAvailable: false as const,
    scienceRasterAvailable: false as const,
    fitsProducts: 0 as const,
    pngProducts: 0 as const,
    denseCampaignStatus: "incomplete-0-of-49" as const,
    sciencePayloadMutationAllowed: false as const,
    cinematicScienceWritebackAllowed: false as const,
    formalProductPointer: "v263" as const,
    formalDefaultKernel: "legacy-eih-1pn" as const,
  }),
  sourceManifest,
  sourceSha256: sha(sourceManifest),
};
const artifactSha256 = createHash("sha256")
  .update(canonicalKerrInstrumentAuthorityMatrixV511(unsigned))
  .digest("hex");
const artifact = parseKerrInstrumentAuthorityMatrixArtifactV511({
  ...unsigned,
  artifactSha256,
});
atomic(paths.output, artifact);
console.log(
  JSON.stringify(
    {
      status: artifact.status,
      artifactSha256: artifact.artifactSha256,
      stageCount: artifact.counts.stageCount,
      sourcePhotonRows: artifact.counts.sourcePhotonRows,
      measuredFiles: `${artifact.counts.measuredCalibrationFiles}/${artifact.counts.requiredMeasuredCalibrationFiles}`,
      measuredResponseRows: artifact.counts.measuredResponseRows,
      observedCountRows: artifact.counts.observedCountRows,
      sciencePixelRows: artifact.counts.sciencePixelRows,
      detectorAuthority: artifact.qualification.measuredDetectorAuthorityGranted,
      denseCampaign: artifact.boundary.denseCampaignStatus,
    },
    null,
    2,
  ),
);
