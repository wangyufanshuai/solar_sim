import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  computeKerrBandpassRedshiftCommutatorV534,
  parseKerrBandpassRedshiftCommutatorArtifactV534,
  V534_COMMUTATOR_ABSOLUTE_LIMIT,
  V534_CROSS_DOMAIN_RELATIVE_LIMIT,
  V534_UNIT_REDSHIFT_IDENTITY_LIMIT,
} from "../app/lib/kerrBandpassRedshiftCommutatorV534";
import { parseKerrSciencePhotonBandViewV328 } from "../app/lib/kerrSciencePhotonBandsV328";
import { parseMeasuredVisibleThroughputArtifactV383 } from "../app/lib/measuredVisibleThroughputV383";
import { parseMeasuredVisiblePhotonObservableArtifactV384 } from "../app/lib/measuredVisiblePhotonObservableV384";

const root = process.cwd();
const paths = {
  photon: "dist/science/kerr-science-photon-bands-v328/photon-radiance.json",
  throughput: "dist/science/measured-visible-throughput-v383/manifest.json",
  rawProfile: "dist/staging/measured-authority-v382-visible/raw/svo-hst-wfc3-uvis1-f350lp.xml",
  visible: "dist/science/measured-visible-photon-observable-v384/observable.json",
  oracle: "dist/science/kerr-bandpass-redshift-commutator-v534/python-oracle.json",
  detector: "dist/science/kerr-instrument-authority-matrix-v511/matrix.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  output: "dist/science/kerr-bandpass-redshift-commutator-v534/atlas.json",
} as const;
const transient = new Set([
  "generatedAt", "artifactSha256", "payloadSha256", "evidenceSha256", "pointerSha256", "stageChainSha256",
]);
const bytes = (path: string, maximumBytes = 4 * 1024 * 1024) => {
  const target = resolve(root, path);
  const metadata = statSync(target);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > maximumBytes) throw new Error(`v534-input-size:${path}`);
  return readFileSync(target);
};
const read = (path: string, maximumBytes?: number) => JSON.parse(bytes(path, maximumBytes).toString("utf8"));
const fileSha = (path: string) => createHash("sha256").update(bytes(path)).digest("hex");
const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([key]) => !transient.has(key))
    .sort(([a], [b]) => compare(a, b))
    .map(([key, entry]) => [key, canonicalize(entry)]));
};
const sha = (value: unknown) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const relativeDifference = (left: number, right: number) =>
  Math.abs(left - right) / Math.max(Number.MIN_VALUE, Math.abs(left), Math.abs(right));
const atomic = (path: string, value: unknown) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const part = `${target}.${process.pid}.part`;
  writeFileSync(part, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(part, target);
};

const photon = read(paths.photon, 2 * 1024 * 1024);
const photonView = parseKerrSciencePhotonBandViewV328(photon.view);
const throughput = parseMeasuredVisibleThroughputArtifactV383(read(paths.throughput, 128 * 1024));
const rawProfileBytes = bytes(paths.rawProfile, 2 * 1024 * 1024);
const visible = parseMeasuredVisiblePhotonObservableArtifactV384(read(paths.visible, 256 * 1024));
const oracle = read(paths.oracle, 128 * 1024);
const detector = read(paths.detector, 128 * 1024);
const dense = read(paths.dense, 128 * 1024);
const formal = read(paths.formal, 128 * 1024);
const formalEvidence = read(formal.source, 4 * 1024 * 1024);

if (throughput.input.rawProfileSha256 !== fileSha(paths.rawProfile)
  || throughput.authorityBoundary.normalizedCandidateQualified !== true
  || throughput.authorityBoundary.sourceDossierAvailable !== false
  || throughput.authorityBoundary.visibleMeasuredAuthorityGranted !== false
  || visible.source.v328PhotonArtifactSha256 !== photon.artifactSha256
  || visible.source.v383ThroughputArtifactSha256 !== throughput.artifactSha256
  || oracle.version !== "v534-kerr-bandpass-redshift-frequency-domain-oracle-v1"
  || oracle.source.rawProfileSha256 !== throughput.input.rawProfileSha256
  || oracle.source.v328ArtifactSha256 !== photon.artifactSha256
  || oracle.source.v384ArtifactSha256 !== visible.artifactSha256
  || oracle.rows?.length !== 4
  || detector.counts.measuredCalibrationFiles !== 0
  || detector.counts.requiredMeasuredCalibrationFiles !== 6
  || dense.status !== "incomplete-0-of-49"
  || dense.completedShardCount !== 0
  || dense.attemptConsumed !== false
  || formal.version !== "v263-current-product-evidence-pointer"
  || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn"
  || formalEvidence.contracts?.singleCanvas !== true
  || formalEvidence.contracts?.legacyRootAttributes !== 603
  || formalEvidence.contracts?.evidenceLedgerClaims !== 84) {
  throw new Error("v534-upstream-boundary");
}

const computed = computeKerrBandpassRedshiftCommutatorV534(photonView, rawProfileBytes.toString("utf8"));
let maximumV384Difference = 0;
let maximumPythonDifference = 0;
let maximumPythonCommutatorDifference = 0;
let maximumIdentityResidual = 0;
const rows = Object.freeze(computed.map((row) => {
  const visibleRow = visible.rows.find((entry) => entry.rayIndex === row.rayIndex);
  const oracleRow = oracle.rows.find((entry: { rayIndex?: unknown }) => entry.rayIndex === row.rayIndex);
  if (!visibleRow || !oracleRow) throw new Error(`v534-row-identity:${row.rayIndex}`);
  const v384ObserverBandpassRelativeDifference = relativeDifference(
    row.observerBandpassPhotonRadiancePerSM2Sr,
    visibleRow.throughputWeightedPhotonRadiancePerSM2Sr,
  );
  const pythonObserverDifference = relativeDifference(
    row.observerBandpassPhotonRadiancePerSM2Sr,
    Number(oracleRow.observerBandpassPhotonRadiancePerSM2Sr),
  );
  const pythonFrozenDifference = relativeDifference(
    row.frozenEmitterBandpassPhotonRadiancePerSM2Sr,
    Number(oracleRow.frozenEmitterBandpassPhotonRadiancePerSM2Sr),
  );
  const pythonCommutatorRelativeDifference = relativeDifference(
    row.redshiftBandpassCommutatorRelative,
    Number(oracleRow.redshiftBandpassCommutatorRelative),
  );
  const pythonCommutatorAbsoluteDifference = Math.abs(
    row.redshiftBandpassCommutatorRelative - Number(oracleRow.redshiftBandpassCommutatorRelative),
  );
  const pythonFrequencyDomainRelativeDifference = Math.max(
    pythonObserverDifference,
    pythonFrozenDifference,
  );
  maximumV384Difference = Math.max(maximumV384Difference, v384ObserverBandpassRelativeDifference);
  maximumPythonDifference = Math.max(maximumPythonDifference, pythonFrequencyDomainRelativeDifference);
  maximumPythonCommutatorDifference = Math.max(
    maximumPythonCommutatorDifference,
    pythonCommutatorAbsoluteDifference,
  );
  maximumIdentityResidual = Math.max(maximumIdentityResidual, row.unitRedshiftIdentityResidual);
  if (v384ObserverBandpassRelativeDifference >= V534_CROSS_DOMAIN_RELATIVE_LIMIT
    || pythonFrequencyDomainRelativeDifference >= V534_CROSS_DOMAIN_RELATIVE_LIMIT
    || pythonCommutatorAbsoluteDifference >= V534_COMMUTATOR_ABSOLUTE_LIMIT
    || row.unitRedshiftIdentityResidual >= V534_UNIT_REDSHIFT_IDENTITY_LIMIT) {
    throw new Error(
      `v534-row-gate:${row.rayIndex}:${v384ObserverBandpassRelativeDifference}:${pythonObserverDifference}:${pythonFrozenDifference}:${pythonCommutatorRelativeDifference}:${pythonCommutatorAbsoluteDifference}:${row.unitRedshiftIdentityResidual}`,
    );
  }
  return Object.freeze({
    ...row,
    v384ObserverBandpassRelativeDifference,
    pythonFrequencyDomainRelativeDifference,
    pythonCommutatorAbsoluteDifference,
  });
}));

const sourcePaths = [
  paths.photon,
  paths.throughput,
  paths.rawProfile,
  paths.visible,
  paths.oracle,
  paths.detector,
  paths.dense,
  paths.formal,
  "app/lib/kerrBandpassRedshiftCommutatorV534.ts",
  "app/lib/kerrBandpassRedshiftCommutatorV534.test.ts",
  "scripts/run-kerr-bandpass-redshift-commutator-oracle-v534.py",
  "scripts/test-kerr-bandpass-redshift-commutator-v534.py",
  "scripts/build-kerr-bandpass-redshift-commutator-v534.ts",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) })).sort((a, b) => compare(a.path, b.path));
const unsigned = {
  version: "v534-kerr-bandpass-redshift-commutator-atlas-v1" as const,
  generatedAt: "2026-08-02T00:00:00Z",
  status: "candidate-bandpass-redshift-commutator-qualified-measured-authority-withheld" as const,
  source: Object.freeze({
    v328PhotonArtifactSha256: photon.artifactSha256 as string,
    v328FullShortAuthoritySha256: photonView.source.fullShortAuthoritySha256,
    v383ThroughputArtifactSha256: throughput.artifactSha256,
    v383RawProfileSha256: throughput.input.rawProfileSha256,
    v384ObservableArtifactSha256: visible.artifactSha256,
    v534PythonOracleSha256: oracle.artifactSha256 as string,
    denseAggregateSha256: null,
  }),
  operator: Object.freeze({
    observerResponse: "eta(lambda_observer)" as const,
    frozenEmitterApproximation: "eta(g-times-lambda-observer)" as const,
    photonFrequencyTransform: "N_nu_observer=g_squared-times-N_nu_emitter(nu_observer/g)" as const,
    photonWavelengthTransform: "N_lambda_observer=g_fourth-times-N_lambda_emitter(g-times-lambda_observer)" as const,
    exactVariableSubstitution: "d-lambda-emitter=g-times-d-lambda-observer-total-photon-factor-g-cubed" as const,
    commutatorMeaning: "response-redshift-ordering-bias-under-frozen-emitter-bandpass" as const,
    responseAppliedExactlyOnce: true as const,
  }),
  rows,
  counts: Object.freeze({
    authorityDiskRayCount: 4 as const,
    observerBandpassIntegralCount: 4 as const,
    frozenBandpassIntegralCount: 4 as const,
    unitRedshiftIdentityFixtureCount: 4 as const,
    commutatorRowCount: 4 as const,
    electronExpectationRowCount: 0 as const,
    observedCountRowCount: 0 as const,
    sciencePixelRowCount: 0 as const,
  }),
  maxima: Object.freeze({
    v384ObserverBandpassRelativeDifference: maximumV384Difference,
    pythonFrequencyDomainRelativeDifference: maximumPythonDifference,
    pythonCommutatorAbsoluteDifference: maximumPythonCommutatorDifference,
    unitRedshiftIdentityResidual: maximumIdentityResidual,
    redshiftBandpassCommutatorRelative: Math.max(...rows.map((row) => row.redshiftBandpassCommutatorRelative)),
  }),
  minima: Object.freeze({
    redshiftBandpassCommutatorRelative: Math.min(...rows.map((row) => row.redshiftBandpassCommutatorRelative)),
  }),
  algorithms: Object.freeze({
    typescript: "observer-wavelength-irregular-trapezoid-neumaier" as const,
    python: "observer-frequency-fixed-simpson-262144" as const,
    integrationDomainIndependent: true as const,
    parserIndependent: true as const,
    deterministicReplay: true as const,
    randomnessUsed: false as const,
  }),
  qualification: Object.freeze({
    bandpassRedshiftOperatorQualified: true as const,
    crossDomainOracleQualified: true as const,
    unitRedshiftIdentityQualified: true as const,
    nonCommutativityDetected: true as const,
    physicalInterpretationQualified: true as const,
    measuredDetectorAuthorityGranted: false as const,
    productionInstrumentResponseQualified: false as const,
    scienceRasterQualified: false as const,
  }),
  boundary: Object.freeze({
    candidateThroughputOnly: true as const,
    sourceDossierStatus: "incomplete-1-of-7" as const,
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
const artifact = parseKerrBandpassRedshiftCommutatorArtifactV534({ ...unsigned, artifactSha256: sha(unsigned) });
atomic(paths.output, artifact);
console.log(JSON.stringify({
  status: artifact.status,
  artifactSha256: artifact.artifactSha256,
  rows: artifact.counts.commutatorRowCount,
  commutatorRange: [artifact.minima.redshiftBandpassCommutatorRelative, artifact.maxima.redshiftBandpassCommutatorRelative],
  maximumPythonFrequencyDomainRelativeDifference: artifact.maxima.pythonFrequencyDomainRelativeDifference,
  maximumUnitRedshiftIdentityResidual: artifact.maxima.unitRedshiftIdentityResidual,
  measuredCalibration: "0/6",
  electronExpectationRows: 0,
}, null, 2));
