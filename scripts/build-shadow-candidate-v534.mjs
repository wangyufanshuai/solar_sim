import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v533-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v533.json",
  artifact: "dist/science/kerr-bandpass-redshift-commutator-v534/atlas.json",
  runtime: "dist/science/kerr-bandpass-redshift-commutator-v534/runtime-audit.json",
  detector: "dist/science/kerr-instrument-authority-matrix-v511/matrix.json",
  intake: "dist/science/kerr-measured-detector-intake-v458/intake-inspect.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v534-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v534.json",
};
const transient = new Set([
  "generatedAt", "artifactSha256", "payloadSha256", "evidenceSha256", "pointerSha256", "stageChainSha256",
]);
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path).toString("utf8"));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const canonicalize = (value) => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !transient.has(key))
    .sort(([a], [b]) => compare(a, b))
    .map(([key, entry]) => [key, canonicalize(entry)]));
};
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path, value) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const part = `${target}.${process.pid}.part`;
  writeFileSync(part, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(part, target);
};

const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const artifact = read(paths.artifact);
const runtime = read(paths.runtime);
const detector = read(paths.detector);
const intake = read(paths.intake);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);

if (previousEvidence.version !== "orbit-atlas-shadow-v533-evidence-v1"
  || sha(previousEvidence) !== previousEvidence.evidenceSha256
  || previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v533"
  || sha(previousPointer) !== previousPointer.pointerSha256
  || artifact.version !== "v534-kerr-bandpass-redshift-commutator-atlas-v1"
  || sha(artifact) !== artifact.artifactSha256
  || runtime.version !== "v534-kerr-bandpass-redshift-runtime-audit-v1"
  || sha(runtime) !== runtime.artifactSha256
  || runtime.source.bandpassRedshiftArtifactSha256 !== artifact.artifactSha256
  || artifact.counts.commutatorRowCount !== 4
  || artifact.counts.electronExpectationRowCount !== 0
  || artifact.counts.observedCountRowCount !== 0
  || artifact.counts.sciencePixelRowCount !== 0
  || artifact.maxima.v384ObserverBandpassRelativeDifference >= 1e-7
  || artifact.maxima.pythonFrequencyDomainRelativeDifference >= 1e-7
  || artifact.maxima.pythonCommutatorAbsoluteDifference >= 1e-7
  || artifact.maxima.unitRedshiftIdentityResidual >= 1e-12
  || artifact.qualification.bandpassRedshiftOperatorQualified !== true
  || artifact.qualification.nonCommutativityDetected !== true
  || artifact.qualification.measuredDetectorAuthorityGranted !== false
  || artifact.boundary.sourceDossierStatus !== "incomplete-1-of-7"
  || runtime.runtime.automaticRequestCount !== 0
  || runtime.runtime.explicitRequestCount !== 1
  || runtime.runtime.singleFlightConsumerCount !== 2
  || runtime.runtime.finalResourceStatus !== "baseline"
  || runtime.detailCatalog.detailCount !== 36
  || runtime.visualProfile.scientificGeometryInputCount !== 4
  || runtime.visualProfile.numericScientificStyleInputCount !== 0
  || detector.counts.measuredCalibrationFiles !== 0
  || intake.inspect.readyFileCount !== 0
  || dense.status !== "incomplete-0-of-49"
  || dense.completedShardCount !== 0
  || dense.attemptConsumed !== false
  || formal.version !== "v263-current-product-evidence-pointer"
  || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn"
  || formalEvidence.contracts?.singleCanvas !== true
  || formalEvidence.contracts?.legacyRootAttributes !== 603
  || formalEvidence.contracts?.evidenceLedgerClaims !== 84) {
  throw new Error("v534-evidence-boundary");
}

const sourcePaths = [
  paths.previousEvidence,
  paths.previousPointer,
  paths.artifact,
  paths.runtime,
  paths.detector,
  paths.intake,
  paths.dense,
  paths.formal,
  "app/lib/kerrBandpassRedshiftCommutatorV534.ts",
  "app/lib/kerrBandpassRedshiftCommutatorV534.test.ts",
  "app/lib/kerrBandpassRedshiftCommutatorServerV534.ts",
  "app/lib/kerrBandpassRedshiftCommutatorServerV534.test.ts",
  "app/lib/kerrBandpassRedshiftCommutatorClientV534.ts",
  "app/lib/kerrBandpassRedshiftCommutatorClientV534.test.ts",
  "app/api/atlas/relativity-evidence/v534/bandpass-redshift/route.ts",
  "app/api/atlas/relativity-evidence/v534/bandpass-redshift/route.test.ts",
  "app/components/KerrBandpassRedshiftCommutatorV534.tsx",
  "app/components/KerrBandpassRedshiftCommutatorV534.test.tsx",
  "app/components/kerrPhotonMetrologyDetailCatalogV534.ts",
  "app/components/kerrPhotonMetrologyDetailCatalogV534.test.ts",
  "app/lib/kerrPhotonMetrologyObservatoryIntentV534.ts",
  "app/components/KerrPhotonMetrologyObservatoryIntentV534.tsx",
  "app/components/KerrPhotonMetrologyObservatoryIntentV534.test.tsx",
  "app/components/KerrPhotonMetrologyObservatoryIntentV533.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "app/lib/atlasResourceLifecycle.ts",
  "scripts/run-kerr-bandpass-redshift-commutator-oracle-v534.py",
  "scripts/test-kerr-bandpass-redshift-commutator-v534.py",
  "scripts/build-kerr-bandpass-redshift-commutator-v534.ts",
  "scripts/build-kerr-bandpass-redshift-commutator-v534.mjs",
  "scripts/build-kerr-bandpass-redshift-runtime-v534.ts",
  "scripts/build-shadow-candidate-v534.mjs",
  "scripts/build-shadow-v534.mjs",
  "scripts/verify-shadow-v534-light.mjs",
  "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) })).sort((a, b) => compare(a.path, b.path));
const status = "v534-bandpass-redshift-commutator-qualified-candidate-throughput-measured-authority-withheld-heavy-browser-pending";
const unsigned = {
  version: "orbit-atlas-shadow-v534-evidence-v1",
  generatedAt: "2026-08-02T00:00:00Z",
  status,
  dependency: {
    v533EvidenceSha256: previousEvidence.evidenceSha256,
    v533PointerSha256: previousPointer.pointerSha256,
    v534BandpassRedshiftArtifactSha256: artifact.artifactSha256,
    v534RuntimeArtifactSha256: runtime.artifactSha256,
    v314StateSha256: dense.stateSha256,
  },
  operator: artifact.operator,
  rows: artifact.rows,
  counts: artifact.counts,
  maxima: artifact.maxima,
  minima: artifact.minima,
  algorithms: artifact.algorithms,
  qualification: artifact.qualification,
  runtime: runtime.runtime,
  detailCatalog: runtime.detailCatalog,
  visualProfile: runtime.visualProfile,
  scienceBoundary: artifact.boundary,
  denseCampaign: {
    namespace: "v314",
    status: dense.status,
    completedShardCount: dense.completedShardCount,
    plannedShardCount: dense.plannedShardCount,
    attemptConsumed: dense.attemptConsumed,
    aggregateAvailable: dense.aggregateAvailable,
  },
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  qualificationStatement: "v534-qualifies-four-kerr-disk-ray-observer-bandpass-versus-frozen-emitter-bandpass-commutators-with-independent-wavelength-and-frequency-domain-integrators",
  boundaryStatement: "The non-zero commutator is a physical candidate-response ordering effect, not a measured detector response. The source dossier remains 1/7 and no collecting area, exposure, electrons, counts, calibrated pixels, FITS image, or production promotion is claimed.",
};
const evidence = { ...unsigned, evidenceSha256: sha(unsigned) };
atomic(paths.evidence, evidence);

const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v534",
  generatedAt: "2026-08-02T00:00:00Z",
  status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v533GridAxisInfluence: "qualified-preserved",
    v534BandpassRedshiftRows: "qualified-4-of-4",
    v534ObserverWavelengthIntegrator: "qualified-typescript-irregular-trapezoid-neumaier",
    v534ObserverFrequencyOracle: "qualified-python-simpson-262144",
    v534UnitRedshiftIdentity: "qualified-4-of-4",
    v534NonCommutativity: "qualified-nonzero-physical-candidate-response-effect",
    v534ScientificGeometry: "qualified-4-identical-science-cinematic",
    v534SharedDetailCatalog: "qualified-36-of-36-one-new-lazy-import",
    v534SourceDossier: "incomplete-1-of-7",
    v534MeasuredFileContract: "incomplete-0-of-6",
    v534ElectronExpectation: "unavailable-0-rows",
    v534ObservedCounts: "unavailable-0-rows",
    v534ScienceRaster: "unavailable-0-pixels",
    v534RuntimeRequestPolicy: "qualified-auto-0-explicit-1-single-flight-2-consumers",
    v534Lifecycle: "qualified-baseline",
    v534BrowserQualification: "not-run",
    v534VisualMatrixQualification: "not-run",
    v314DenseCampaign: "incomplete-0-of-49",
  },
  promotion: {
    promotionAllowed: false,
    measuredDetectorPromotionAllowed: false,
    electronExpectationAllowed: false,
    observedCountPayloadAllowed: false,
    scienceRasterPayloadAllowed: false,
    localShadowDefaultApplied: false,
  },
  evidence: {
    path: paths.evidence,
    fileSha256: fileSha(paths.evidence),
    canonicalSha256: evidence.evidenceSha256,
  },
};
const pointer = { ...pointerUnsigned, pointerSha256: sha(pointerUnsigned) };
atomic(paths.pointer, pointer);

console.log(JSON.stringify({
  status,
  bandpassRedshiftArtifactSha256: artifact.artifactSha256,
  runtimeArtifactSha256: runtime.artifactSha256,
  evidenceSha256: evidence.evidenceSha256,
  pointerSha256: pointer.pointerSha256,
  commutatorRows: 4,
  commutatorRange: [artifact.minima.redshiftBandpassCommutatorRelative, artifact.maxima.redshiftBandpassCommutatorRelative],
  detailCatalog: "36/36",
  sourceDossier: "1/7",
  measuredCalibration: "0/6",
  electronExpectationRows: 0,
  denseCampaign: "0/49",
  browserQualification: "not-run",
  formalProductPointer: "v263",
}, null, 2));
