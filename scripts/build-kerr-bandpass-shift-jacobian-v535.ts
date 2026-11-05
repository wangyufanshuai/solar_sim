import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  computeKerrBandpassShiftJacobianV535,
  parseKerrBandpassShiftJacobianArtifactV535,
  V535_JACOBIAN_ABSOLUTE_LIMIT,
} from "../app/lib/kerrBandpassShiftJacobianV535";
import { parseKerrSciencePhotonBandViewV328 } from "../app/lib/kerrSciencePhotonBandsV328";
import { parseKerrBandpassRedshiftCommutatorArtifactV534 } from "../app/lib/kerrBandpassRedshiftCommutatorV534";

const root = process.cwd();
const paths = {
  photon: "dist/science/kerr-science-photon-bands-v328/photon-radiance.json",
  rawProfile: "dist/staging/measured-authority-v382-visible/raw/svo-hst-wfc3-uvis1-f350lp.xml",
  v534: "dist/science/kerr-bandpass-redshift-commutator-v534/atlas.json",
  oracle: "dist/science/kerr-bandpass-shift-jacobian-v535/python-oracle.json",
  detector: "dist/science/kerr-instrument-authority-matrix-v511/matrix.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  output: "dist/science/kerr-bandpass-shift-jacobian-v535/atlas.json",
} as const;
const transient = new Set(["generatedAt", "artifactSha256", "payloadSha256", "evidenceSha256", "pointerSha256", "stageChainSha256"]);
const bytes = (path: string, maximumBytes = 4 * 1024 * 1024) => {
  const target = resolve(root, path);
  const metadata = statSync(target);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > maximumBytes) throw new Error(`v535-input-size:${path}`);
  return readFileSync(target);
};
const read = (path: string, maximumBytes?: number) => JSON.parse(bytes(path, maximumBytes).toString("utf8"));
const fileSha = (path: string) => createHash("sha256").update(bytes(path)).digest("hex");
const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !transient.has(key))
    .sort(([a], [b]) => compare(a, b)).map(([key, entry]) => [key, canonicalize(entry)]));
};
const sha = (value: unknown) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path: string, value: unknown) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const part = `${target}.${process.pid}.part`;
  writeFileSync(part, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(part, target);
};

const photon = read(paths.photon, 2 * 1024 * 1024);
const photonView = parseKerrSciencePhotonBandViewV328(photon.view);
const raw = bytes(paths.rawProfile, 2 * 1024 * 1024);
const v534 = parseKerrBandpassRedshiftCommutatorArtifactV534(read(paths.v534, 128 * 1024));
const oracle = read(paths.oracle, 128 * 1024);
const detector = read(paths.detector, 128 * 1024);
const dense = read(paths.dense, 128 * 1024);
const formal = read(paths.formal, 128 * 1024);
const formalEvidence = read(formal.source);
if (oracle.version !== "v535-kerr-bandpass-shift-frequency-domain-jacobian-oracle-v1"
  || oracle.source.rawProfileSha256 !== fileSha(paths.rawProfile)
  || oracle.source.v328ArtifactSha256 !== photon.artifactSha256
  || oracle.source.v534ArtifactSha256 !== v534.artifactSha256
  || oracle.rows?.length !== 4
  || oracle.diagnosticBoundary?.centralDifferenceQualifiedAsAuthority !== false
  || detector.counts.measuredCalibrationFiles !== 0
  || dense.status !== "incomplete-0-of-49"
  || dense.completedShardCount !== 0
  || dense.attemptConsumed !== false
  || formal.version !== "v263-current-product-evidence-pointer"
  || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn"
  || formalEvidence.contracts?.singleCanvas !== true
  || formalEvidence.contracts?.legacyRootAttributes !== 603
  || formalEvidence.contracts?.evidenceLedgerClaims !== 84) {
  throw new Error("v535-upstream-boundary");
}

const computed = computeKerrBandpassShiftJacobianV535(photonView, raw.toString("utf8"), v534);
let maximumJacobianDifference = 0;
let maximumCentralDifferenceConvergence = 0;
const rows = Object.freeze(computed.map((row) => {
  const oracleRow = oracle.rows.find((entry: { rayIndex?: unknown }) => entry.rayIndex === row.rayIndex);
  if (!oracleRow) throw new Error(`v535-oracle-row:${row.rayIndex}`);
  const pythonResponseShiftLogJacobian = Number(oracleRow.responseShiftLogJacobian);
  const jacobianAbsoluteDifference = Math.abs(row.analyticResponseShiftLogJacobian - pythonResponseShiftLogJacobian);
  const centralDifferenceConvergenceAbsolute = Number(oracleRow.centralDifferenceConvergenceAbsolute);
  maximumJacobianDifference = Math.max(maximumJacobianDifference, jacobianAbsoluteDifference);
  maximumCentralDifferenceConvergence = Math.max(maximumCentralDifferenceConvergence, centralDifferenceConvergenceAbsolute);
  if (jacobianAbsoluteDifference >= V535_JACOBIAN_ABSOLUTE_LIMIT) {
    throw new Error(`v535-jacobian-gate:${row.rayIndex}:${jacobianAbsoluteDifference}`);
  }
  return Object.freeze({
    ...row,
    pythonResponseShiftLogJacobian,
    jacobianAbsoluteDifference,
    centralDifferenceConvergenceAbsolute,
    measuredWavelengthCalibrationSigmaLn: null,
    projectedInstrumentUncertaintyRelative: null,
    totalScientificUncertaintyRelative: "unavailable" as const,
  });
}));

const sourcePaths = [
  paths.photon, paths.rawProfile, paths.v534, paths.oracle, paths.detector, paths.dense, paths.formal,
  "app/lib/kerrBandpassShiftJacobianV535.ts",
  "app/lib/kerrBandpassShiftJacobianV535.test.ts",
  "scripts/run-kerr-bandpass-shift-jacobian-oracle-v535.py",
  "scripts/test-kerr-bandpass-shift-jacobian-v535.py",
  "scripts/build-kerr-bandpass-shift-jacobian-v535.ts",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) })).sort((a, b) => compare(a.path, b.path));
const unsigned = {
  version: "v535-kerr-bandpass-shift-jacobian-atlas-v1" as const,
  generatedAt: "2026-08-02T00:00:00Z",
  status: "bandpass-shift-jacobian-qualified-absolute-instrument-uncertainty-unavailable" as const,
  source: Object.freeze({
    v328PhotonArtifactSha256: photon.artifactSha256 as string,
    v383RawProfileSha256: fileSha(paths.rawProfile),
    v534BandpassRedshiftArtifactSha256: v534.artifactSha256,
    v535PythonOracleSha256: oracle.artifactSha256 as string,
    denseAggregateSha256: null,
  }),
  definition: Object.freeze({
    quantity: "d-ln-band-photon-radiance-over-d-ln-response-wavelength" as const,
    responsePerturbation: "eta(exp(delta)-times-lambda-observer)" as const,
    analyticDerivative: "integral-N-lambda-times-lambda-times-d-eta-d-lambda-over-integral-N-lambda-times-eta" as const,
    finiteDisplacement: "delta-equals-ln-redshift-factor" as const,
    uncertaintyProjection: "absolute-J-times-sigma-ln-lambda-only-after-measured-sigma-exists" as const,
    rssApplied: false as const,
    unavailableTreatedAsZero: false as const,
  }),
  rows,
  uncertaintyLedger: Object.freeze({
    quantifiedComputationalComponents: Object.freeze([
      "v534-wavelength-versus-frequency-integral-difference",
      "v535-wavelength-versus-frequency-jacobian-difference",
      "v535-finite-shift-nonlinear-remainder",
    ]),
    unavailablePhysicalComponents: Object.freeze([
      Object.freeze({ id: "response-wavelength-calibration", reason: "no-measured-wavelength-zero-point-covariance", numericalPlaceholderUsed: false as const }),
      Object.freeze({ id: "throughput-amplitude-calibration", reason: "source-dossier-incomplete-no-repeat-calibration-covariance", numericalPlaceholderUsed: false as const }),
      Object.freeze({ id: "source-model-systematic", reason: "thin-disk-temperature-and-model-discrepancy-not-closed", numericalPlaceholderUsed: false as const }),
    ]),
    combinationRule: "linear-sum-without-independence-proof" as const,
    totalScientificUncertaintyAvailable: false as const,
  }),
  counts: Object.freeze({
    authorityDiskRayCount: 4 as const,
    analyticJacobianCount: 4 as const,
    independentOracleJacobianCount: 4 as const,
    nonlinearRemainderCount: 4 as const,
    physicalUncertaintyIntervalCount: 0 as const,
    electronExpectationRowCount: 0 as const,
    observedCountRowCount: 0 as const,
    sciencePixelRowCount: 0 as const,
  }),
  maxima: Object.freeze({
    jacobianAbsoluteDifference: maximumJacobianDifference,
    centralDifferenceConvergenceAbsolute: maximumCentralDifferenceConvergence,
    nonlinearRemainderFractionOfActual: Math.max(...rows.map((row) => row.nonlinearRemainderFractionOfActual)),
  }),
  qualification: Object.freeze({
    analyticResponseShiftJacobianQualified: true as const,
    independentFrequencyDomainOracleQualified: true as const,
    finiteShiftNonlinearityQuantified: true as const,
    computationalErrorBudgetQualified: true as const,
    absoluteInstrumentUncertaintyQualified: false as const,
    measuredDetectorAuthorityGranted: false as const,
    scienceRasterQualified: false as const,
  }),
  boundary: Object.freeze({
    candidateThroughputOnly: true as const,
    sourceDossierStatus: "incomplete-1-of-7" as const,
    measuredWavelengthCalibrationSigmaAvailable: false as const,
    measuredCalibrationFiles: 0 as const,
    requiredMeasuredCalibrationFiles: 6 as const,
    electronExpectationAvailable: false as const,
    observedCountsAvailable: false as const,
    scienceRasterAvailable: false as const,
    sciencePayloadMutationAllowed: false as const,
    cinematicScienceWritebackAllowed: false as const,
    networkAttempted: false as const,
    automaticRetryApplied: false as const,
    denseCampaignStatus: "incomplete-0-of-49" as const,
    browserQualification: "not-run" as const,
    formalProductPointer: "v263" as const,
    formalDefaultKernel: "legacy-eih-1pn" as const,
  }),
  sourceManifest,
  sourceSha256: sha(sourceManifest),
};
const artifact = parseKerrBandpassShiftJacobianArtifactV535({ ...unsigned, artifactSha256: sha(unsigned) });
atomic(paths.output, artifact);
console.log(JSON.stringify({
  status: artifact.status,
  artifactSha256: artifact.artifactSha256,
  jacobianRange: [
    Math.min(...rows.map((row) => row.analyticResponseShiftLogJacobian)),
    Math.max(...rows.map((row) => row.analyticResponseShiftLogJacobian)),
  ],
  maximumJacobianAbsoluteDifference: artifact.maxima.jacobianAbsoluteDifference,
  centralDifferenceDiagnosticConvergence: artifact.maxima.centralDifferenceConvergenceAbsolute,
  physicalUncertaintyIntervals: 0,
}, null, 2));
