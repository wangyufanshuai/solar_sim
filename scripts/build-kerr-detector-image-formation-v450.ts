import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import {
  canonicalPayloadV450,
  formKerrDetectorExpectedImageFixtureV450,
  parseKerrDetectorExpectedImageArtifactV450,
  type KerrDetectorExpectedImageInputV450,
  type KerrDetectorExpectedImageRowV450,
} from "../app/lib/kerrDetectorExpectedImageFormationV450";

const root = process.cwd();
const paths = {
  wcs: "dist/science/kerr-wcs-projection-availability-v441/wcs-projection-availability.json",
  detector: "dist/science/kerr-detector-geometry-staging-v443/staging-inspect.json",
  electron: "dist/science/kerr-detector-electron-kernel-v447/electron-kernel-qualification.json",
  likelihood: "dist/science/kerr-detector-poisson-gaussian-v449/likelihood-qualification.json",
  fixture: "dist/science/kerr-detector-image-formation-v450/typescript-formation.json",
  oracle: "dist/science/kerr-detector-image-formation-v450/python-oracle.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  output: "dist/science/kerr-detector-image-formation-v450/image-formation-qualification.json",
} as const;
const read = (path: string): Record<string, unknown> =>
  JSON.parse(readFileSync(resolve(root, path), "utf8")) as Record<string, unknown>;
const sha = (value: unknown): string =>
  createHash("sha256").update(canonicalPayloadV450(value)).digest("hex");
const relative = (left: number, right: number): number =>
  Math.abs(left - right) /
  Math.max(Number.MIN_VALUE, Math.abs(left), Math.abs(right));

const wcs = read(paths.wcs);
const detector = read(paths.detector);
const electron = read(paths.electron);
const likelihood = read(paths.likelihood);
const fixture = read(paths.fixture);
const oracle = read(paths.oracle);
const state = read(paths.state);
const formal = read(paths.formal);
const formalSource = read(String(formal.source));
if (
  wcs.status !==
    "qualified-linear-wcs-coordinate-authority-detector-projection-blocked" ||
  !Array.isArray(wcs.rows) ||
  wcs.rows.length !== 4 ||
  detector.status !== "blocked-staging-directory-missing" ||
  detector.readyFileCount !== 0 ||
  detector.measuredAuthorityGranted !== false ||
  detector.runtimeProjectionAllowed !== false ||
  electron.status !==
    "qualified-unit-strict-electron-expectation-kernel-fixture-only-measured-authority-unavailable" ||
  electron.qualification == null ||
  (electron.qualification as Record<string, unknown>).scienceRasterAllowed !== false ||
  likelihood.status !==
    "qualified-exact-poisson-gaussian-reference-fixture-only-normal-approximation-diagnostic" ||
  likelihood.qualification == null ||
  (likelihood.qualification as Record<string, unknown>).scienceRasterAllowed !== false ||
  fixture.status !== "sparse-expected-electron-image-fixture-only" ||
  !Array.isArray(fixture.inputs) ||
  !Array.isArray(fixture.rows) ||
  fixture.rows.length !== 4 ||
  oracle.status !== "qualified-decimal-bilinear-sparse-fixture-only" ||
  oracle.precisionDigits !== 60 ||
  !Array.isArray(oracle.rows) ||
  oracle.rows.length !== 4 ||
  state.status !== "incomplete-0-of-49" ||
  state.completedShardCount !== 0 ||
  state.attemptConsumed !== false ||
  state.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  (formalSource.science as Record<string, unknown>)?.defaultKernel !==
    "legacy-eih-1pn" ||
  (formalSource.contracts as Record<string, unknown>)?.singleCanvas !== true ||
  (formalSource.contracts as Record<string, unknown>)?.legacyRootAttributes !== 603 ||
  (formalSource.contracts as Record<string, unknown>)?.evidenceLedgerClaims !== 84
) {
  throw new Error("v450-source-boundary");
}

const replay = (fixture.inputs as KerrDetectorExpectedImageInputV450[]).map(
  formKerrDetectorExpectedImageFixtureV450,
);
if (sha(replay) !== sha(fixture.rows)) {
  throw new Error("v450-typescript-replay-mismatch");
}

type OracleDeposit = {
  pixelX: number;
  pixelY: number;
  weight: number;
  expectedSourceElectrons: number;
};
type OracleRow = { fixtureId: string; deposits: OracleDeposit[] };
let pythonWeightAbsoluteDifference = 0;
let pythonElectronRelativeDifference = 0;
for (const row of replay) {
  const oracleRow = (oracle.rows as OracleRow[]).find(
    (candidate) => candidate.fixtureId === row.fixtureId,
  );
  if (!oracleRow || oracleRow.deposits.length !== 4) {
    throw new Error(`v450-oracle-row-missing:${row.fixtureId}`);
  }
  for (const deposit of row.deposits) {
    const other = oracleRow.deposits.find(
      (candidate) =>
        candidate.pixelX === deposit.pixelX && candidate.pixelY === deposit.pixelY,
    );
    if (!other) {
      throw new Error(`v450-oracle-deposit-missing:${row.fixtureId}`);
    }
    pythonWeightAbsoluteDifference = Math.max(
      pythonWeightAbsoluteDifference,
      Math.abs(deposit.weight - other.weight),
    );
    pythonElectronRelativeDifference = Math.max(
      pythonElectronRelativeDifference,
      relative(
        deposit.expectedSourceElectrons,
        other.expectedSourceElectrons,
      ),
    );
  }
}
if (
  pythonWeightAbsoluteDifference >= 1e-12 ||
  pythonElectronRelativeDifference >= 1e-12
) {
  throw new Error("v450-python-oracle-comparison");
}

const rows = replay as KerrDetectorExpectedImageRowV450[];
const wcsMaxima = wcs.maxima as Record<string, number>;
const unsigned = {
  version: "v450-kerr-detector-expected-image-formation-artifact-v1",
  generatedAt: "2026-07-30T00:00:00Z",
  status:
    "expected-electron-image-fixture-qualified-detector-projection-blocked",
  source: {
    v441ArtifactSha256: String(wcs.artifactSha256),
    v443ArtifactSha256: String(detector.artifactSha256),
    v447ArtifactSha256: String(electron.artifactSha256),
    v449ArtifactSha256: String(likelihood.artifactSha256),
    pythonOracleArtifactSha256: String(oracle.artifactSha256),
  },
  wcs: {
    name: "KERR-FINITE-ZAMO-LINEAR-384",
    width: 384,
    height: 384,
    pixelConvention: "FITS-one-based-continuous-pixel-centers",
  },
  rows,
  counts: {
    sourceRowCount: 4,
    sparseDepositRowCount: 16,
    measuredDetectorGeometryRows: 0,
    psfRows: 0,
    pixelResponseRows: 0,
    scienceRasterRows: 0,
    observedImageRows: 0,
  },
  maxima: {
    weightConservationAbsolute: Math.max(
      ...rows.map((row) => row.weightConservationAbsolute),
    ),
    electronConservationRelative: Math.max(
      ...rows.map((row) => row.electronConservationRelative),
    ),
    pythonWeightAbsoluteDifference,
    pythonElectronRelativeDifference,
    sourceCoordinateJoinResidualPixel: wcsMaxima.sourceCoordinateJoinResidualPixel,
  },
  qualification: {
    wcsCoordinateAuthorityQualified: true,
    expectedElectronFormationFixtureQualified: true,
    deterministicReplayQualified: true,
    pythonDecimalOracleQualified: true,
    pixelIndexBoundaryQualified: true,
    detectorProjectionAuthority: false,
    psfAuthority: false,
    pixelResponseAuthority: false,
    scienceRasterAuthority: false,
    observedImageAvailable: false,
    browserQualification: "not-run",
  },
  boundary: {
    sparseFixtureOnly: true,
    fullRasterMaterialized: false,
    pngGenerated: false,
    fitsGenerated: false,
    runtimeScienceImageAllowed: false,
    cinematicMayClaimDetectorImage: false,
  },
  formalProductPointer: "v263",
  denseCampaignStatus: "incomplete-0-of-49",
  networkAttempted: false,
  automaticRetryApplied: false,
} as const;
const artifact = parseKerrDetectorExpectedImageArtifactV450({
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
      sourceRows: artifact.counts.sourceRowCount,
      sparseDeposits: artifact.counts.sparseDepositRowCount,
      maximumWeightResidual: artifact.maxima.weightConservationAbsolute,
      maximumElectronResidual: artifact.maxima.electronConservationRelative,
      maximumPythonDifference: Math.max(
        artifact.maxima.pythonWeightAbsoluteDifference,
        artifact.maxima.pythonElectronRelativeDifference,
      ),
      detectorProjectionAuthority: false,
      scienceRasterAuthority: false,
    },
    null,
    2,
  ),
);
