import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const python = process.platform === "win32"
  ? resolve(root, ".venv-science/Scripts/python.exe")
  : resolve(root, ".venv-science/bin/python");

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed with ${result.status}`);
}

run(python, ["scripts/test-kerr-dense-campaign-v298r1.py"]);
run(python, ["scripts/audit-kerr-dense-shard-v311.py"]);
run(process.execPath, [resolve(root, "node_modules/vitest/vitest.mjs"), "run",
  "app/lib/kerrCampaignV298.test.ts",
  "app/lib/kerrCampaignV298R1.test.ts",
  "app/lib/kerrCriticalCurveV300.test.ts",
  "app/lib/kerrCriticalCurvePlotV300.test.ts",
  "app/lib/kerrObserverEmitterReplayV301.test.ts",
  "app/lib/kerrEventTimelineV302.test.ts",
  "app/lib/kerrErrorBudgetV303.test.ts",
  "app/lib/kerrPolarizationViewV304.test.ts",
  "app/lib/strongGravityRenderingV299.test.ts",
  "app/lib/kerrStrongGravityVisualV305.test.ts",
  "app/lib/kerrScienceObservablesV306.test.ts",
  "app/lib/kerrScienceRasterV307.test.ts",
  "app/lib/atlasResourceScopeV308.test.ts",
  "app/lib/atlasStrongGravityTelemetryV309.test.ts",
  "app/lib/atlasStrongGravityBrowserGateV310.test.ts",
  "app/lib/kerrDenseShardTruthV311.test.ts",
  "app/lib/kerrInteractiveComputeV299.test.ts",
  "app/lib/kerrSciencePayloadClientV299.test.ts",
  "app/lib/atlasVisualProfileV299.test.ts",
  "app/lib/atlasVisualRuntimeTokenAuditV285R1.test.ts",
  "app/lib/atlasVisualRuntimeConsumptionV300.test.ts",
  "app/lib/atlasResourceLifecycleV275.test.ts",
  "app/lib/atlasResourceLifecycleV173.test.ts",
  "app/lib/atlasBrowserObservabilityV294.test.ts",
  "app/lib/relativityWorkbenchEvidenceV285.test.ts",
  "app/lib/relativityEvidenceServerV285R1.test.ts",
  "app/lib/atlasShadowCapabilityPointerV299.test.ts",
  "app/lib/atlasShadowHeavyQualificationGateV300.test.ts",
  "app/lib/atlasResourcePreflightV300.test.ts",
  "app/lib/atlasPerformanceQualificationV300.test.ts",
  "app/api/atlas/relativity-evidence/artifacts/[artifact]/route.test.ts",
]);

const worker = readFileSync(resolve(root, "app/workers/kerrInteractiveCompute.worker.ts"), "utf8");
const renderer = readFileSync(resolve(root, "app/components/KerrStrongGravityRendererV299.tsx"), "utf8");
const computeContract = readFileSync(resolve(root, "app/lib/kerrInteractiveComputeV299.ts"), "utf8");
const kerrScene = readFileSync(resolve(root, "app/components/KerrBlackHole.tsx"), "utf8");
const ab = readFileSync(resolve(root, "app/components/AtlasVisualABControlV261.tsx"), "utf8");
const postFxGate = readFileSync(resolve(root, "app/components/PostProcessingGate.tsx"), "utf8");
const universeRuntime = readFileSync(resolve(root, "app/components/AtlasUniverseSceneRuntime.tsx"), "utf8");
const browserObservability = readFileSync(resolve(root, "app/lib/atlasBrowserObservabilityV294.ts"), "utf8");
const sciencePayloadClient = readFileSync(resolve(root, "app/lib/kerrSciencePayloadClientV299.ts"), "utf8");
const launchResources = readFileSync(resolve(root, "app/components/useLaunchSceneResources.ts"), "utf8");
const visualRuntimeConsumption = readFileSync(resolve(root, "app/lib/atlasVisualRuntimeConsumptionV300.ts"), "utf8");
const resourceLifecycle = readFileSync(resolve(root, "app/lib/atlasResourceLifecycle.ts"), "utf8");
const performanceQualification = readFileSync(resolve(root, "app/lib/atlasPerformanceQualificationV300.ts"), "utf8");
const criticalCurve = readFileSync(resolve(root, "app/lib/kerrCriticalCurveV300.ts"), "utf8");
const relativityArtifactRoute = readFileSync(resolve(root, "app/api/atlas/relativity-evidence/artifacts/[artifact]/route.ts"), "utf8");
const criticalCurveWorkbench = readFileSync(resolve(root, "app/components/KerrCriticalCurveWorkbenchV300.tsx"), "utf8");
const observerEmitterReplay = readFileSync(resolve(root, "app/lib/kerrObserverEmitterReplayV301.ts"), "utf8");
const observerEmitterWorkbench = readFileSync(resolve(root, "app/components/KerrObserverEmitterWorkbenchV301.tsx"), "utf8");
const eventTimeline = readFileSync(resolve(root, "app/lib/kerrEventTimelineV302.ts"), "utf8");
const eventTimelineWorkbench = readFileSync(resolve(root, "app/components/KerrEventTimelineWorkbenchV302.tsx"), "utf8");
const errorBudget = readFileSync(resolve(root, "app/lib/kerrErrorBudgetV303.ts"), "utf8");
const errorBudgetWorkbench = readFileSync(resolve(root, "app/components/KerrErrorBudgetWorkbenchV303.tsx"), "utf8");
const polarizationView = readFileSync(resolve(root, "app/lib/kerrPolarizationViewV304.ts"), "utf8");
const polarizationWorkbench = readFileSync(resolve(root, "app/components/KerrPolarizationWorkbenchV304.tsx"), "utf8");
const strongGravityVisual = readFileSync(resolve(root, "app/lib/kerrStrongGravityVisualV305.ts"), "utf8");
const scienceObservables = readFileSync(resolve(root, "app/lib/kerrScienceObservablesV306.ts"), "utf8");
const scienceObservablesWorkbench = readFileSync(resolve(root, "app/components/KerrScienceObservablesWorkbenchV306.tsx"), "utf8");
const scienceRaster = readFileSync(resolve(root, "app/lib/kerrScienceRasterV307.ts"), "utf8");
const resourceScope = readFileSync(resolve(root, "app/lib/atlasResourceScopeV308.ts"), "utf8");
const strongGravityTelemetry = readFileSync(resolve(root, "app/lib/atlasStrongGravityTelemetryV309.ts"), "utf8");
const strongGravityBrowserGate = readFileSync(resolve(root, "app/lib/atlasStrongGravityBrowserGateV310.ts"), "utf8");
const lifecycleBrowserSpec = readFileSync(resolve(root, "tests/atlas-browser/atlas-v300-resource-lifecycle.spec.ts"), "utf8");
const denseShardTruth = readFileSync(resolve(root, "app/lib/kerrDenseShardTruthV311.ts"), "utf8");
const denseTruthWorkbench = readFileSync(resolve(root, "app/components/KerrDenseShardTruthWorkbenchV311.tsx"), "utf8");
const denseTruthAuditScript = readFileSync(resolve(root, "scripts/audit-kerr-dense-shard-v311.py"), "utf8");
const assertions = {
  realWgslCompute: worker.includes("@compute @workgroup_size(64)") && worker.includes("navigator.gpu.requestAdapter") && worker.includes("dispatchWorkgroups"),
  workerFallback: worker.includes("cpuFallback(request)"),
  computeInputBoundary: worker.includes("validateKerrInteractiveComputeRequestV299(request).passed"),
  gpuAuthorityLock: computeContract.includes("KERR_SHORT_AUTHORITY_ENVELOPE_SHA256_V299") && renderer.includes("KERR_SHORT_AUTHORITY_ENVELOPE_SHA256_V299"),
  gpuLifecycle: worker.includes("parameters.destroy()") && worker.includes("output.destroy()") && worker.includes("readback.destroy()") && worker.includes("device.destroy()"),
  oneShotWorkerLifecycle: renderer.includes("stopWorker = () =>") && renderer.includes("worker.terminate()") && renderer.includes('scope.add("cinematic-worker-registry"'),
  scienceCinematicSplit: renderer.includes("ScienceSparseRenderer") && renderer.includes("CinematicComputeRenderer"),
  scienceLinearDisplay: renderer.includes("texture.colorSpace = THREE.NoColorSpace") && renderer.includes("atlasDisplayTransform: contract.displayTransform") && renderer.includes("toneMapped={contract.toneMapped}") && strongGravityVisual.includes('displayTransform: "linear-no-grade"') && strongGravityVisual.includes("scienceBufferMutationAllowed: false") && postFxGate.includes("if (!ready || scienceDisplayMode) return null") && universeRuntime.includes("scienceDisplayMode={showKerrSceneVisual"),
  strongGravityVisualV305: strongGravityVisual.includes("createKerrScienceRgbaV305") && strongGravityVisual.includes("createKerrCinematicRgbaV305") && strongGravityVisual.includes("sampleAtlasCinematicDetailV299") && renderer.includes("contract.bloom > 0") && renderer.includes("THREE.AdditiveBlending") && renderer.includes("legacy-visual-approximation-not-science-authority") && !strongGravityVisual.includes("Math.random("),
  boundedScienceObservablesV306: scienceObservables.includes("16-canonical-rays-not-dense-transfer-map") && scienceObservables.includes("componentwise-no-rss-no-scalar-total") && scienceObservables.includes("missingObservableEncoding: \"null-not-zero\"") && scienceObservablesWorkbench.includes("v306-science-observables") && relativityArtifactRoute.includes('"v306-science-observables"'),
  deterministicScienceRasterV307: scienceRaster.includes("zamo-screen-180deg-line") && scienceRaster.includes("exact-v306-workbench-only-not-rasterized") && scienceRaster.includes("cinematicBufferShared: false") && renderer.includes("createKerrScienceRasterV307(payload)") && !scienceRaster.includes("Math.random("),
  transactionalResourceScopeV308: resourceScope.includes("for (let index = entries.length - 1") && resourceScope.includes("if (released) releaseEntry(entry)") && renderer.includes('releaseAtlasResourceScopeV309(scope, "kerr-science-sparse-texture", "science-load-failed")') && renderer.includes('releaseAtlasResourceScopeV309(scope, "kerr-cinematic-compute-texture", "cinematic-response-materialization-failed")'),
  strongGravityTelemetryV309: strongGravityTelemetry.includes("new WeakSet<AtlasResourceScopeV308>()") && strongGravityTelemetry.includes("publishKerrScienceRasterTelemetryV309") && strongGravityTelemetry.includes("releaseAtlasResourceScopeV309") && browserObservability.includes("atlasScienceRasterVersionV309") && browserObservability.includes("atlasResourceScopeFailureCountV309") && browserObservability.includes("subscribeAtlasStrongGravityTelemetryV309") && renderer.includes("publishKerrScienceRasterTelemetryV309(materialized.raster)"),
  strongGravityBrowserGateV310: strongGravityBrowserGate.includes("after-exit-resource-${key}-drift") && strongGravityBrowserGate.includes("science-scope-release-not-observed") && strongGravityBrowserGate.includes("local-shadow-browser-qualification-only-no-product-promotion") && lifecycleBrowserSpec.includes("evaluateAtlasStrongGravityBrowserGateV310") && lifecycleBrowserSpec.includes("Science · sparse authority"),
  denseShardTruthV311: denseShardTruth.includes("failed-tolerance-ladder-degenerate") && denseShardTruth.includes("strictSolverLadderPairCount: 0") && denseTruthWorkbench.includes("tolerance convergence withdrawn") && relativityArtifactRoute.includes('"v311-shard0-truth-audit"') && denseTruthAuditScript.includes("strict_solver_ladder_pair_count") && denseTruthAuditScript.includes("atomic_json(OUTPUT, output)"),
  runtimeObservability: browserObservability.includes("atlasStrongGravityRenderModeV294") && browserObservability.includes("atlasEstimatedGpuBytesV294") && browserObservability.includes("startAtlasBrowserObservabilityResourceBridgeV300") && browserObservability.includes("atlasResourceRevisionV300") && browserObservability.includes("atlasRayPlanAuthorityShaV300") && browserObservability.includes("atlasScienceAuthorityKindV300") && browserObservability.includes("atlasScienceErrorBudgetVersionV300") && sciencePayloadClient.includes("geometryAuthoritySha256") && sciencePayloadClient.includes("polarizationAuthoritySha256") && sciencePayloadClient.includes("rayPlanAuthoritySha256") && sciencePayloadClient.includes("denseAggregateSha256") && sciencePayloadClient.includes("scienceErrorBudgetVersion"),
  deterministicKerrNoise: !kerrScene.includes("Math.random()") && kerrScene.includes("createKerrFlowNoiseTextureV299"),
  deterministicV5V6LaunchDetail: launchResources.includes("sampleAtlasCinematicDetailV299") && launchResources.includes("visualRendererProfile.v5TokensApplied || visualRendererProfile.v6TokensApplied"),
  visualRuntimeConsumerAudit: visualRuntimeConsumption.includes("registerAtlasVisualRuntimeConsumerV300") && visualRuntimeConsumption.includes("resolveAtlasExpectedVisualTokenSignatureV300") && visualRuntimeConsumption.includes("resolved-profile-exact-v300") && visualRuntimeConsumption.includes("atlasVisualRuntimeObservedV300") && visualRuntimeConsumption.includes("completeProfiles"),
  resourceIdentityAudit: resourceLifecycle.includes("identityDigest") && resourceLifecycle.includes("contentSha256") && resourceLifecycle.includes("manifestSha256") && resourceLifecycle.includes("identityChanged") && browserObservability.includes("atlasResourceIdentityDigestV300"),
  performanceQualificationContract: performanceQualification.includes("requiredSamplePairs: 10") && performanceQualification.includes("heapSlopeMaximumBytesPerCycle: 262_144") && performanceQualification.includes("catalogGpuMaximumBytes: 33_554_432") && performanceQualification.includes("kerrDesktopGpuMaximumBytes: 100_663_296"),
  boundedCriticalCurveAuthority: criticalCurve.includes("KERR_CRITICAL_CURVE_BRACKET_COUNT_V300 = 40") && criticalCurve.includes("critical-curve-width-conservation-failed") && relativityArtifactRoute.includes('"v296-critical-brackets"') && criticalCurveWorkbench.includes("parseKerrCriticalCurveViewV300") && criticalCurveWorkbench.includes("data-atlas-critical-curve-authority-sha"),
  observerEmitterRedshiftReplay: observerEmitterReplay.includes("resolveKerrZamoObserverFrameV301") && observerEmitterReplay.includes("resolveKerrEmitterRedshiftV301") && observerEmitterWorkbench.includes("data-atlas-observer-source-sha") && relativityArtifactRoute.includes('"v301-observer-emitter-replay"'),
  canonicalEventTimelineReplay: eventTimeline.includes("v302-earliest-valid-event-conservation-failed") && eventTimeline.includes("formula-parameters-are-not-cross-compared") && eventTimelineWorkbench.includes("data-atlas-event-timeline-authority-sha") && relativityArtifactRoute.includes('"v302-event-timelines"'),
  layeredErrorBudget: errorBudget.includes("componentwise-reporting-no-rss-no-cross-dimension-sum") && errorBudget.includes("shard-budget-is-not-dense-aggregate-qualification") && errorBudgetWorkbench.includes("data-atlas-error-budget-shard-audit-sha") && relativityArtifactRoute.includes('"v303-error-budget"'),
  boundedPolarizationAuthority: polarizationView.includes("replayProjectedPolarizationV304") && polarizationView.includes("v304-branch-determinism-failed") && polarizationWorkbench.includes("data-atlas-polarization-authority-sha") && relativityArtifactRoute.includes('"v304-polarization-view"'),
  v5LocalShadowOnly: ab.includes('const showV5 = deliveryProfile === "local-shadow"'),
  oldV3BoundaryRetained: renderer.includes("KerrRayTraceRendererV3"),
};
if (Object.values(assertions).some((passed) => !passed)) throw new Error(`v299 static audit failed: ${JSON.stringify(assertions)}`);
console.log(JSON.stringify({ status: "passed-v299-low-memory-light", assertions }, null, 2));
