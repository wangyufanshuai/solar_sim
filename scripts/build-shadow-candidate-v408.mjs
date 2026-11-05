import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = Object.freeze({
  previousEvidence: "dist/science/orbit-atlas-shadow-v407-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v407.json",
  pythonOracle: "dist/science/kerr-scattering-oracle-v408/numerical-oracle.json",
  portableOracle: "dist/science/kerr-scattering-oracle-v408/portable-envelope.json",
  v407Atmosphere: "dist/science/kerr-scattering-atmosphere-v407/short-gate.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v408-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v408.json",
});
const PREVIOUS = Object.freeze({
  evidenceCanonical: "f8c51cb64b604f343f800338846d332dabffd0d4823aa16959e68afb61e078df",
  pointerCanonical: "ef0889304eaa935b8366be5cf3364c597780463a73ed5f1c17f7b73822c132eb",
  evidenceFile: "f70ba41901edaf66d76c2f8f10ff43fc921ea31cd764d0cda97fee0631042e65",
  pointerFile: "69b60b27d8d70cca3a97b15256e5ca20ba1d682966e806ee7e74e46296fcb969",
});
const PYTHON_SHA = "7fc3772ebde21ddad6beecf8487b0814055d3c133bc14048677e0160a9a6565e";
const V407_ARTIFACT_SHA = "3b493dbf281acc6c93b72d6faaed70ec89e1b2aa12e8f3633b3bf708363c9ae7";
const transient = new Set(["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256", "observedPeakRssGiB"]);
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path).toString("utf8"));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : !value || typeof value !== "object"
    ? value
    : Object.fromEntries(Object.entries(value).filter(([key]) => !transient.has(key)).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path, value) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.part`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(temporary, target);
};

const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const pythonOracle = read(paths.pythonOracle);
const portable = read(paths.portableOracle);
const v407 = read(paths.v407Atmosphere);
const state = read(paths.state);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
const view = portable.view;
const rays = view?.rayComparisons;
const samples = view?.curveEnvelope?.samples;
const signCounts = Array.isArray(samples) ? samples.reduce((counts, sample) => {
  if (sample.signedApproximationError < 0) counts.underestimate += 1;
  else if (sample.signedApproximationError > 0) counts.overestimate += 1;
  else counts.equal += 1;
  return counts;
}, { underestimate: 0, overestimate: 0, equal: 0 }) : null;
const rayUnderestimate = Array.isArray(rays) ? rays.map((ray) => Math.abs(ray.relativeApproximationError)) : [];

if (
  previousEvidence.evidenceSha256 !== PREVIOUS.evidenceCanonical || previousPointer.pointerSha256 !== PREVIOUS.pointerCanonical ||
  fileSha(paths.previousEvidence) !== PREVIOUS.evidenceFile || fileSha(paths.previousPointer) !== PREVIOUS.pointerFile ||
  previousPointer.evidence?.fileSha256 !== PREVIOUS.evidenceFile || previousPointer.evidence?.canonicalSha256 !== PREVIOUS.evidenceCanonical ||
  pythonOracle.evidenceSha256 !== PYTHON_SHA || pythonOracle.status !== "qualified-independent-discrete-ordinates-reference-envelope" ||
  portable.version !== "v408-kerr-scattering-discrete-ordinates-artifact-v1" || sha(portable) !== portable.artifactSha256 ||
  portable.sourcePythonEvidenceSha256 !== PYTHON_SHA || portable.sourceArtifacts?.v407ScatteringAtmosphere !== V407_ARTIFACT_SHA ||
  portable.deterministicReplay !== true || portable.networkAttemptedByPortableBuild !== false || portable.denseShardExecuted !== false ||
  v407.artifactSha256 !== V407_ARTIFACT_SHA || view?.status !== "qualified-independent-discrete-ordinates-reference-envelope" ||
  view.qualified !== true || view.sourceReference?.doi !== "10.1086/149599" || view.sourceReference?.adsBibcode !== "1968ApJ...152..835S" ||
  view.sourceReference?.adsPdfSha256 !== "e6f53fb301aca1378d373c13388966e8eccf923660aafd73670151028cbc0f4b" ||
  view.solver?.configurations?.length !== 6 || view.curveEnvelope?.sampleCount !== 181 || samples?.length !== 181 ||
  rays?.length !== 4 || rays.some((ray) => ray.relativeApproximationError >= 0) ||
  Math.min(...rayUnderestimate) < 0.067 || Math.max(...rayUnderestimate) > 0.091 ||
  signCounts?.underestimate !== 146 || signCounts?.overestimate !== 35 || signCounts?.equal !== 0 ||
  view.maxima?.linearSystemResidual >= 1e-10 || view.maxima?.relativeFluxDrift >= 1e-10 || view.maxima?.kernelEquilibriumResidual >= 1e-13 ||
  view.maxima?.deterministicReplayDifference !== 0 || view.maxima?.rayNumericalUncertaintyLinearSumAbsolute > 6.9e-6 ||
  view.authorityBoundary?.exactChandrasekharHFunctionTableAuthority !== false || view.authorityBoundary?.limbEndpointMuZeroQualified !== false ||
  view.authorityBoundary?.faceOnEndpointMuOneQualified !== false || view.authorityBoundary?.v407HistoricalArtifactMutated !== false ||
  state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
  formalEvidence.contracts?.workerPhysicsMutation !== "not-applied" || formalEvidence.contracts?.eihOnePnMutation !== "not-applied" ||
  formalEvidence.contracts?.singleCanvas !== true || formalEvidence.contracts?.legacyRootAttributes !== 603 || formalEvidence.contracts?.evidenceLedgerClaims !== 84
) throw new Error("v408-boundary");

const sourcePaths = [
  "app/lib/kerrScatteringOracleV408.ts", "app/lib/kerrScatteringOracleV408.test.ts",
  "app/lib/kerrScatteringOracleServerV408.ts", "app/lib/kerrScatteringOracleServerV408.test.ts",
  "app/lib/kerrScatteringOracleClientV408.ts", "app/lib/kerrScatteringOracleClientV408.test.ts",
  "app/api/atlas/relativity-evidence/v408/scattering-oracle/route.ts", "app/api/atlas/relativity-evidence/v408/scattering-oracle/route.test.ts",
  "app/components/KerrScatteringOracleSurfaceV408.tsx", "app/components/KerrScatteringOracleSurfaceV408.test.tsx",
  "app/components/KerrEvidenceObservatoryV405.tsx",
  "app/lib/atlasShadowCapabilityPointerV408.ts", "app/lib/atlasShadowCapabilityPointerV408.test.ts",
  "scripts/run-kerr-scattering-oracle-v408.py", "scripts/build-kerr-scattering-oracle-v408.ts",
  "scripts/build-shadow-candidate-v408.mjs", "scripts/reseal-shadow-evidence-chain-v408.mjs", "scripts/verify-shadow-v408-light.mjs", "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v408-evidence-v1",
  generatedAt: portable.generatedAt,
  status: "independent-scattering-oracle-envelope-qualified-v13-integrated-browser-pending-dense-incomplete-0-of-49",
  dependency: {
    v407EvidenceSha256: PREVIOUS.evidenceCanonical,
    v407PointerSha256: PREVIOUS.pointerCanonical,
    v407ScatteringAtmosphereArtifactSha256: V407_ARTIFACT_SHA,
    pythonOracleEvidenceSha256: PYTHON_SHA,
    pythonOracleFileSha256: fileSha(paths.pythonOracle),
    portableOracleArtifactSha256: portable.artifactSha256,
    portableOracleFileSha256: fileSha(paths.portableOracle),
  },
  sourceReference: {
    title: view.sourceReference.title,
    author: view.sourceReference.author,
    year: view.sourceReference.year,
    doi: view.sourceReference.doi,
    adsBibcode: view.sourceReference.adsBibcode,
    adsPdfSha256: view.sourceReference.adsPdfSha256,
    equationTranscriptionSha256: view.sourceReference.equationTranscriptionSha256,
    verification: view.sourceReference.verification,
  },
  numericalOracle: {
    method: view.solver.method,
    qualifiedMuDomain: view.solver.qualifiedMuDomain,
    configurationCount: view.solver.configurations.length,
    production: { angleCount: 80, depthCount: 121, tauMax: 20 },
    deterministicReplayDifference: view.maxima.deterministicReplayDifference,
    residuals: { linearSystem: view.maxima.linearSystemResidual, relativeFluxDrift: view.maxima.relativeFluxDrift, kernelEquilibrium: view.maxima.kernelEquilibriumResidual },
    finiteSlabTruncationIncluded: true,
    numericalUncertaintyCombination: "linear-no-rss-no-independence-claim",
    maximumRayNumericalUncertaintyLinearSumAbsolute: view.maxima.rayNumericalUncertaintyLinearSumAbsolute,
  },
  fourRayEnvelope: {
    rayCount: rays.length,
    relativeErrors: rays.map((ray) => ({ rayId: ray.rayId, relativeApproximationError: ray.relativeApproximationError, numericalUncertaintyLinearSumAbsolute: ray.numericalUncertainty.linearSumAbsolute })),
    v407UnderestimateRange: [Math.min(...rayUnderestimate), Math.max(...rayUnderestimate)],
    interpretation: "v407-underestimates-the-four-authority-disk-rays-only-not-the-entire-qualified-mu-domain",
  },
  curveEnvelope: {
    sampleCount: 181,
    muDomain: view.curveEnvelope.muDomain,
    signCounts,
    maximumAbsoluteApproximationError: view.curveEnvelope.maximumAbsoluteApproximationError,
    maximumRelativeApproximationError: view.curveEnvelope.maximumRelativeApproximationError,
    approximationUnderestimatesAllSamples: false,
    endpointsQualified: false,
  },
  authorityBoundary: {
    independentNumericalReferenceQualified: true,
    exactChandrasekharHFunctionTableAuthority: false,
    limbEndpointMuZeroQualified: false,
    faceOnEndpointMuOneQualified: false,
    v407HistoricalArtifactMutated: false,
    v407ApproximationPromotionApplied: false,
    recommendedUse: "apply-v408-error-envelope-without-rewriting-v407",
  },
  runtimeIntegration: {
    v13EvidenceObservatory: true,
    summaryOnlyInReactState: true,
    curveSamplesInReactState: false,
    fullArtifactDownloadAvailable: true,
    canvasCreated: false,
    scienceBufferMutation: false,
    cinematicBufferMutation: false,
  },
  qualification: {
    independentScatteringOracleEnvelopeQualified: true,
    exactHFunctionTableQualified: false,
    endpointQualified: false,
    denseScientificImageQualified: false,
    browserQualification: "not-run",
    visualMatrixQualification: "not-run",
    soakQualification: "not-run",
    rtxWebGpuQualification: "not-run",
  },
  resource: { observedPeakRssGiB: portable.observedPeakRssGiB, maximumPeakRssGiB: 2, qualified: true },
  correctedCampaign: { namespace: "v314", status: state.status, completedShardCount: 0, plannedShardCount: state.plannedShardCount, attemptConsumed: false, aggregateAvailable: false, stateSha256: state.stateSha256 },
  networkAttemptedByPortableBuild: false,
  automaticRetryApplied: false,
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  release: {
    formalProductPointer: "v263",
    formalProductPointerSha256: fileSha(paths.formal),
    formalProductPointerAdvanced: false,
    ordinaryStandaloneProfile: "legacy-v9",
    liteProfile: "legacy-v9",
    localShadowDefaultProfile: "legacy-v9",
    localShadowDefaultApplied: false,
    publicDeploymentBlocked: true,
  },
  releaseBoundary: "v408-independent-scattering-reference-envelope-local-shadow-v13-browser-pending-no-exact-table-dense-or-product-promotion",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v408",
  generatedAt: portable.generatedAt,
  status: evidence.status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v407ScatteringAtmosphere: "qualified-closed-form-approximation-boundary-only",
    v408SiewertSource: "verified-doi-ads-equations-1-2",
    v408NumericalOracle: "qualified-independent-discrete-ordinates-reference-envelope",
    v408FourRayErrorEnvelope: "qualified-v407-underestimates-6.77-to-9.02-percent",
    v408FullCurveSign: "mixed-146-underestimate-35-overestimate",
    v408ExactHFunctionTable: "not-qualified",
    v408Endpoints: "not-qualified-mu-0-and-1",
    v408Workbench: "summary-only-181-point-artifact-download",
    v408BrowserQualification: "not-run",
    v408VisualMatrix: "not-run",
    v408Soak: "not-run",
    v408RtxWebGpu: "not-run",
    v314CorrectedDense: "incomplete-0-of-49",
    denseAggregate: "unavailable",
  },
  evidence: { path: paths.evidence, fileSha256: fileSha(paths.evidence), canonicalSha256: evidence.evidenceSha256 },
};
const pointer = { ...pointerUnsigned, pointerSha256: sha(pointerUnsigned) };
atomic(paths.pointer, pointer);
console.log(JSON.stringify({
  status: pointer.status,
  pythonOracleEvidenceSha256: PYTHON_SHA,
  portableOracleArtifactSha256: portable.artifactSha256,
  fourRayUnderestimatePercentRange: evidence.fourRayEnvelope.v407UnderestimateRange.map((value) => value * 100),
  curveSignCounts: signCounts,
  evidenceSha256: evidence.evidenceSha256,
  pointerSha256: pointer.pointerSha256,
  exactHFunctionTable: pointer.capabilities.v408ExactHFunctionTable,
  browser: pointer.capabilities.v408BrowserQualification,
  dense: pointer.capabilities.v314CorrectedDense,
}, null, 2));
