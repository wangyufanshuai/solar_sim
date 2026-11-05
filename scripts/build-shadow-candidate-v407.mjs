import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = Object.freeze({ previousEvidence: "dist/science/orbit-atlas-shadow-v406-evidence.json", previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v406.json", atmosphere: "dist/science/kerr-scattering-atmosphere-v407/short-gate.json", v406Stokes: "dist/science/kerr-stokes-transfer-v406/short-gate.json", state: "dist/science/kerr-campaign-v314/campaign-state.json", formal: "dist/release/orbit-atlas-current-product-evidence-v263.json", evidence: "dist/science/orbit-atlas-shadow-v407-evidence.json", pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v407.json" });
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"].includes(key)).sort(([first], [second]) => first.localeCompare(second)).map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path, value) => { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); const temporary = `${target}.${process.pid}.part`; writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`); renameSync(temporary, target); };

const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const atmosphere = read(paths.atmosphere);
const v406Stokes = read(paths.v406Stokes);
const state = read(paths.state);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
const angle = atmosphere.view?.angleAudit;
const maxima = atmosphere.view?.maxima;
if (previousPointer.evidence?.fileSha256 !== fileSha(paths.previousEvidence) || previousPointer.evidence?.canonicalSha256 !== previousEvidence.evidenceSha256 || previousPointer.capabilities?.v406StokesTransfer !== "qualified-24-samples-3-bands-2-independent-transports" || v406Stokes.artifactSha256 !== "92830ac3ac89856664fcfbfd00f698b02aa6daa851463de9dc019bfc207e8038" || sha(v406Stokes) !== v406Stokes.artifactSha256 || atmosphere.version !== "v407-kerr-sparse-scattering-atmosphere-artifact-v1" || sha(atmosphere) !== atmosphere.artifactSha256 || atmosphere.view?.status !== "qualified-sparse-scattering-atmosphere-approximation" || atmosphere.view.authority?.v406StokesArtifactSha256 !== v406Stokes.artifactSha256 || atmosphere.view.authority.denseAggregateSha256 !== null || atmosphere.view.model?.qualification !== "closed-form-approximation-boundary-only" || atmosphere.view.model.exactHFunctionTableAccuracy !== "not-qualified" || atmosphere.view.model.observerInclinationSubstituted !== false || atmosphere.view.model.screenBetaSubstituted !== false || atmosphere.view.model.historicalV406FixedFraction !== 0.12 || atmosphere.view.model.circularPolarization !== "unavailable-not-modeled" || atmosphere.view.model.faradayRotation !== "unavailable-not-modeled" || atmosphere.view.model.absorptionOpacity !== "unavailable-not-modeled" || angle?.records?.length !== 4 || angle.curveSampleCount !== 4097 || angle.endpointFaceOn !== 0 || angle.endpointLimb !== 0.1171 || angle.maxMonotonicIncrease !== 0 || angle.maxToleranceMuDifference >= 1e-12 || angle.maxAbCanonicalMuDifference !== 0 || angle.maxLocalFrameResidual >= 1e-12 || atmosphere.view.counts?.stokesSampleCount !== 24 || atmosphere.view.counts.pathComparisonCount !== 12 || maxima?.intensityInvariantRelative >= 1e-12 || maxima.linearAmplitudeInvariantRelative >= 1e-12 || maxima.linearFractionAbsolute >= 1e-12 || maxima.inverseRotationRelative >= 1e-12 || maxima.normalizedStokesQuDifference >= 1e-10 || maxima.releaseEvpaDifferenceDeg >= 0.5 || maxima.internalEvpaDifferenceDeg >= 0.1 || maxima.abCanonicalDifference !== 0 || atmosphere.deterministicReplay !== true || atmosphere.networkAttemptedByBuild !== false || atmosphere.denseShardExecuted !== false || state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false || formal.version !== "v263-current-product-evidence-pointer" || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" || formalEvidence.contracts?.workerPhysicsMutation !== "not-applied" || formalEvidence.contracts?.eihOnePnMutation !== "not-applied" || formalEvidence.contracts?.singleCanvas !== true || formalEvidence.contracts?.legacyRootAttributes !== 603 || formalEvidence.contracts?.evidenceLedgerClaims !== 84) throw new Error("v407-boundary");

const sourcePaths = [
  "app/lib/kerrScatteringAtmosphereV407.ts", "app/lib/kerrScatteringAtmosphereV407.test.ts",
  "app/lib/kerrScatteringAtmosphereServerV407.ts", "app/lib/kerrScatteringAtmosphereServerV407.test.ts",
  "app/lib/kerrScatteringAtmosphereClientV407.ts", "app/lib/kerrScatteringAtmosphereClientV407.test.ts",
  "app/api/atlas/relativity-evidence/v407/scattering-atmosphere/route.ts", "app/api/atlas/relativity-evidence/v407/scattering-atmosphere/route.test.ts",
  "app/components/KerrScatteringAtmosphereSurfaceV407.tsx", "app/components/KerrScatteringAtmosphereSurfaceV407.test.tsx",
  "app/components/KerrEvidenceObservatoryV405.tsx",
  "app/lib/atlasShadowCapabilityPointerV407.ts", "app/lib/atlasShadowCapabilityPointerV407.test.ts",
  "scripts/build-kerr-scattering-atmosphere-v407.ts", "scripts/build-shadow-candidate-v407.mjs",
  "scripts/reseal-shadow-evidence-chain-v407.mjs", "scripts/verify-shadow-v407-light.mjs", "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v407-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: "sparse-scattering-atmosphere-approximation-qualified-v13-integrated-browser-pending-dense-incomplete-0-of-49",
  dependency: { v406EvidenceSha256: previousEvidence.evidenceSha256, v406PointerSha256: previousPointer.pointerSha256, v406StokesArtifactSha256: v406Stokes.artifactSha256, scatteringAtmosphereArtifactSha256: atmosphere.artifactSha256, scatteringAtmosphereArtifactFileSha256: fileSha(paths.atmosphere), geometryEvidenceSha256: atmosphere.view.authority.geometryEvidenceSha256, polarizationEvidenceSha256: atmosphere.view.authority.polarizationEvidenceSha256 },
  localEmissionAngle: { definition: atmosphere.view.model.emissionAngle, observerInclinationSubstituted: false, screenBetaSubstituted: false, diskRayCount: 4, muRange: [angle.minimumMu, angle.maximumMu], maxLocalFrameResidual: angle.maxLocalFrameResidual, maxToleranceMuDifference: angle.maxToleranceMuDifference, maxAbCanonicalMuDifference: angle.maxAbCanonicalMuDifference },
  scatteringAtmosphere: { formula: atmosphere.view.model.approximation, status: atmosphere.view.status, qualification: atmosphere.view.model.qualification, exactHFunctionTableAccuracy: atmosphere.view.model.exactHFunctionTableAccuracy, curveSampleCount: angle.curveSampleCount, endpoints: { faceOn: angle.endpointFaceOn, limb: angle.endpointLimb }, maxMonotonicIncrease: angle.maxMonotonicIncrease, polarizationFractionRange: [angle.minimumFraction, angle.maximumFraction], historicalV406FixedFraction: atmosphere.view.model.historicalV406FixedFraction },
  stokesTransfer: { frequencyCount: 3, transportMethodCount: 2, stokesSampleCount: 24, pathComparisonCount: 12, maxima, thresholds: atmosphere.view.thresholds, uncertaintyCombination: atmosphere.view.uncertaintyCombination },
  referenceBoundary: { primaryProblemFamilyReferences: 2, secondaryMetadataReferenceCount: 1, exactCoefficientFitVerifiedAgainstPrimaryTable: false, exactTableAccuracyClaimed: false, closedFormApproximationClaimed: true },
  modelBoundary: { emittedBasis: "projected-disk-normal", vacuumPropagation: true, circularPolarization: "unavailable-not-modeled", faradayRotation: "unavailable-not-modeled", absorptionOpacity: "unavailable-not-modeled", plasmaTransferClaimed: false, exactAtmosphereClaimed: false },
  runtimeIntegration: { v13EvidenceObservatory: true, summaryOnlyInReactState: true, angleExecutionArrayInReactState: false, fullSampleArrayInReactState: false, fullArtifactDownloadAvailable: true, canvasCreated: false, scienceBufferMutation: false, cinematicBufferMutation: false },
  qualification: { sparseScatteringAtmosphereApproximationQualified: true, exactHFunctionAtmosphereQualified: false, fullDenseStokesQualified: false, browserQualification: "not-run", visualMatrixQualification: "not-run", soakQualification: "not-run", rtxWebGpuQualification: "not-run" },
  correctedCampaign: { namespace: "v314", status: state.status, completedShardCount: state.completedShardCount, plannedShardCount: state.plannedShardCount, attemptConsumed: state.attemptConsumed, aggregateAvailable: state.aggregateAvailable, stateSha256: state.stateSha256 },
  buildNetworkAttempted: false,
  automaticRetryApplied: false,
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  release: { formalProductPointer: "v263", formalProductPointerSha256: fileSha(paths.formal), formalProductPointerAdvanced: false, ordinaryStandaloneProfile: "legacy-v9", liteProfile: "legacy-v9", localShadowDefaultProfile: "legacy-v9", localShadowDefaultApplied: false, publicDeploymentBlocked: true },
  releaseBoundary: "v407-sparse-scattering-atmosphere-approximation-local-shadow-v13-browser-pending-no-dense-or-product-promotion",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v407",
  generatedAt: new Date().toISOString(),
  status: evidence.status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: { v406StokesTransfer: "qualified-24-samples-3-bands-2-independent-transports", v407LocalEmissionAngle: "qualified-4-disk-rays-no-observer-or-screen-substitution", v407ScatteringAtmosphere: "qualified-closed-form-approximation-boundary-only", v407ExactHFunctionAccuracy: "not-qualified", v407StokesTransfer: "qualified-24-angle-dependent-samples", v407Workbench: "summary-only-full-angle-and-sample-artifact-download", v407BrowserQualification: "not-run", v407VisualMatrix: "not-run", v407Soak: "not-run", v407RtxWebGpu: "not-run", v314CorrectedDense: "incomplete-0-of-49", denseAggregate: "unavailable" },
  evidence: { path: paths.evidence, fileSha256: fileSha(paths.evidence), canonicalSha256: evidence.evidenceSha256 },
};
const pointer = { ...pointerUnsigned, pointerSha256: sha(pointerUnsigned) };
atomic(paths.pointer, pointer);
console.log(JSON.stringify({ status: pointer.status, artifactSha256: atmosphere.artifactSha256, muRange: evidence.localEmissionAngle.muRange, polarizationFractionRange: evidence.scatteringAtmosphere.polarizationFractionRange, samples: 24, comparisons: 12, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, exactHFunctionAccuracy: pointer.capabilities.v407ExactHFunctionAccuracy, browser: pointer.capabilities.v407BrowserQualification, dense: pointer.capabilities.v314CorrectedDense }, null, 2));
