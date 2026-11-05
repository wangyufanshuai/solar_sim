import { describe, expect, it } from "vitest";
import {
  createRelativityWorkbenchEvidenceModelV285,
  parseRelativityEvidenceResponseV285,
  serializeRelativityEvidenceCsvV285,
  type AtlasRelativityEvidenceSnapshotV285,
} from "./relativityWorkbenchEvidenceV285";

const sha = "a".repeat(64);
const snapshot: AtlasRelativityEvidenceSnapshotV285 = {
  version: "v285r1-relativity-evidence-snapshot",
  status: "ready",
  phases: {
    v282: { status: "blocked", mismatchCount: 9, artifactSha256: sha },
    v283: { status: "qualified", executionCount: 128, criticalBracketCount: 40, capturedRayCount: 16, degenerateMetricCount: 0, truthReason: null, artifactSha256: sha },
    v284: { status: "incomplete", completedShardCount: 1, plannedShardCount: 49, nextShardIndex: 1, authority: "corrected-v288", artifactSha256: sha },
    v285: { status: "implemented-awaiting-qualification", consumedTokenGroups: ["sky", "solar"], artifactSha256: sha },
  },
  current: {
    v291: { status: "diagnostics-failed", capture02Agreement: true, maxMassShellResidualRaw: 7.4e-8, artifactSha256: sha },
    v292: { status: "geometry-redshift-failed", executionCount: 128, criticalBracketCount: 40, classificationAgreement: 1, failureReasons: ["geometric-residual-threshold-failed"], artifactSha256: sha },
    v293: { status: "blocked-by-geometry", implementationSelfTestPassed: true, applicableExecutionCount: 0, artifactSha256: sha },
    v294: { status: "implemented-awaiting-browser-qualification", scientificPayloadSha256: sha, browserQualificationRun: false },
    v296: { status: "geometry-redshift-qualified", executionCount: 128, criticalBracketCount: 40, artifactSha256: sha },
    v297: { status: "full-kerr-short-authority-qualified", applicableExecutionCount: 16, maxReleaseEvpaDifferenceDeg: 1e-13, maxInternalEvpaDifferenceDeg: 1e-13, artifactSha256: sha },
    v298: { status: "incomplete-0-of-49", completedShardCount: 0, plannedShardCount: 49, nextShardIndex: 0, runNextAvailable: false, artifactSha256: sha },
    v298r1: { status: "incomplete-0-of-49", completedShardCount: 0, plannedShardCount: 49, nextShardIndex: 0, runNextAvailable: true, peakRssBytes: null, peakRssTelemetry: "historical-invalid-zero", auditedShardCount: 0, errorBudgetStatus: "pending", truthAuditStatus: "unavailable", toleranceLadderQualified: false, continuation: "unavailable", artifactSha256: sha },
    v299: { status: "implemented-awaiting-browser-qualification", scienceAuthority: "v296-v297-short-gate-sparse", denseAuthorityAccepted: false, gpuBackend: "bounded-worker", gpuAuthority: "cpu-v296-v297-portable-envelope", scienceDisplay: "linear-no-grade-postfx-bypassed", resourceLifecycle: "static-qualified-browser-baseline-pending", visualAssetRuntime: "licensed-2k-local-shadow-v4-v5-v6-intent-only", visualProfile: "science-cinematic-v5-v299", visualProfileCandidates: ["science-cinematic-v5-v299", "science-cinematic-v6-v300"], artifactSha256: sha },
    v312: { status: "corrected-authority-qualified", executionCount: 128, strictSolverLadderPairCount: 64, expectedSolverLadderPairCount: 64, distinctConvergenceObservableCount: 246, convergenceObservableCount: 256, peakRssGiB: 0.089, polarizationStatus: "requires-v312-locked-polarization-requalification", correctedDenseCampaignCreated: false, artifactSha256: sha },
    v313: { status: "full-kerr-short-authority-qualified", applicableExecutionCount: 16, maxReleaseEvpaDifferenceDeg: 8.24e-13, maxInternalEvpaDifferenceDeg: 1.99e-13, geometryAuthoritySha256: sha, correctedDenseCampaignCreated: false, artifactSha256: sha },
    v314: { status: "incomplete-0-of-49", plannedRayCount: 3097, plannedShardCount: 49, completedShardCount: 0, nextShardIndex: 0, attemptConsumed: false, runNextAvailable: false, aggregateAvailable: false, artifactSha256: sha },
    v315: { status: "implemented-awaiting-browser-qualification", scienceAuthority: "v312-v313-short-gate-sparse", fullShortAuthoritySha256: sha, geometryAuthoritySha256: sha, polarizationAuthoritySha256: sha, rayPlanAuthoritySha256: sha, denseStatus: "incomplete-0-of-49", denseAggregateAccepted: false, browserQualificationRun: false, artifactSha256: sha },
    v316: { status: "static-qualified-browser-pending", requiredFieldCount: 46, declaredFieldCount: 46, runtimeGroupSignature: "resolved-profile-exact-v300", localShadowManualAbOnly: true, browserQualificationRun: false, artifactSha256: sha },
    v317: { status: "static-qualified-browser-pending", scientificTypedArrayCount: 67, digestAlgorithm: "sha-256-field-framed-byte-exact", beforeAfterRasterDigestRequired: true, rasterBufferDisjointRequired: true, interactiveAuthoritySha256: sha, historicalV299MutationApplied: false, webGpuDifferential: "pending", lifecycleBaselineReturnTelemetry: "wired-browser-pending", browserQualificationRun: false, artifactSha256: sha },
    v318: { status: "reference-qualified-hardware-pending", authoritySha256: sha, sampleCount: 16, criticalBracketCount: 40, cpuAuthorityPreserved: true, webGpuDifferential: "pending", browserGate: "authored-not-run", artifactSha256: sha },
    v319: { status: "derived-spectrum-qualified-browser-pending", applicableDiskRayCount: 4, liouvilleInvariantRelativeResidual: 2.4e-16, diskQuadratureRelative: 1.9e-6, formulaSpectralRelative: 5.5e-12, spectralArtifactSha256: sha, denseAggregateAccepted: false, browserQualificationRun: false, artifactSha256: sha },
    v320: { status: "fixed-band-qualified-browser-pending", applicableDiskRayCount: 4, bandCount: 3, bandQuadratureRelativeDifference: 1.08e-6, coveredBolometricFraction: 0.99991, saturatedChannelCount: 0, normalizationPolicy: "fixed-physical-reference-no-data-adaptive-rescale", bandArtifactSha256: sha, denseAggregateAccepted: false, browserQualificationRun: false, artifactSha256: sha },
    v321: { status: "runtime-wired-browser-pending", fixedBandColoredDiskRayCount: 4, fixedBandCount: 3, payloadUnchanged: true, bandViewUnchanged: true, rasterBufferDisjoint: true, cinematicBufferShared: false, rasterArtifactSha256: sha, rasterFileSha256: sha, bandArtifactSha256: sha, bandViewDigestSha256: sha, browserGate: "authored-not-run", denseAggregateAccepted: false, artifactSha256: sha },
    v322: { status: "hud-runtime-wired-browser-pending", profileTokenSources: ["v5", "v6"], displayTransform: "linear-no-grade", diskRayCount: 4, bandCount: 3, saturationCount: 0, payloadUnchanged: true, bandViewUnchanged: true, cinematicBufferShared: false, browserQualificationRun: false, artifactSha256: sha },
    v323: { status: "provenance-export-wired-browser-pending", profileTokenSources: ["v5", "v6"], jsonExport: true, csvExport: true, noRayBuffer: true, noScreenshot: true, objectUrlTracked: true, browserQualificationRun: false, artifactSha256: sha },
  },
  artifacts: [],
  defaultKernel: "legacy-eih-1pn",
  surveyCompleteness: "unavailable",
  boundary: "sanitized-read-only-local-shadow-evidence",
};

describe("v285.1 workbench evidence model", () => {
  it("maps real v282-v285 metrics without hard-coded qualification", () => {
    const model = createRelativityWorkbenchEvidenceModelV285(snapshot, "ready");
    expect(model.rows.find((row) => row.id === "v282")).toMatchObject({ status: "blocked", metric: "9 target mismatches" });
    expect(model.rows.find((row) => row.id === "v283")?.metric).toContain("128/128");
    expect(model.campaignProgress).toMatchObject({ completed: 0, planned: 49, nextShardIndex: 0 });
    expect(model.currentRows.find((row) => row.id === "v292")).toMatchObject({ status: "geometry-redshift-failed" });
    expect(model.currentRows.find((row) => row.id === "v293")?.metric).toContain("self-test passed");
    expect(model.currentRows.find((row) => row.id === "v297")).toMatchObject({ status: "full-kerr-short-authority-qualified" });
    expect(model.currentRows.find((row) => row.id === "v298r1")?.metric).toContain("RSS historical-invalid-zero");
    expect(model.currentRows.find((row) => row.id === "v299")?.metric).toContain("linear-no-grade-postfx-bypassed");
    expect(model.currentRows.find((row) => row.id === "v299")?.metric).toContain("cpu-v296-v297-portable-envelope");
    expect(model.currentRows.find((row) => row.id === "v299")?.metric).toContain("licensed-2k-local-shadow-v4-v5-v6-intent-only");
    expect(model.currentRows.find((row) => row.id === "v312")).toMatchObject({ status: "corrected-authority-qualified" });
    expect(model.currentRows.find((row) => row.id === "v312")?.metric).toContain("ladder 64/64");
    expect(model.currentRows.find((row) => row.id === "v313")).toMatchObject({ status: "full-kerr-short-authority-qualified" });
    expect(model.currentRows.find((row) => row.id === "v313")?.metric).toContain("16/16");
    expect(model.currentRows.find((row) => row.id === "v314")?.metric).toContain("0/49 shards");
    expect(model.currentRows.find((row) => row.id === "v315")?.metric).toContain("v312-v313-short-gate-sparse");
    expect(model.currentRows.find((row) => row.id === "v316")?.metric).toContain("46/46 fields");
    expect(model.currentRows.find((row) => row.id === "v317")?.metric).toContain("67/67 arrays");
    expect(model.currentRows.find((row) => row.id === "v317")?.metric).toContain("WebGPU differential pending");
    expect(model.currentRows.find((row) => row.id === "v318")?.metric).toContain("16/16 rays + 40/40 brackets");
    expect(model.currentRows.find((row) => row.id === "v318")?.metric).toContain("CPU authority preserved");
    expect(model.currentRows.find((row) => row.id === "v319")?.metric).toContain("4/4 disk rays");
    expect(model.currentRows.find((row) => row.id === "v319")?.metric).toContain("dense rejected");
    expect(model.currentRows.find((row) => row.id === "v320")).toMatchObject({ status: "fixed-band-qualified-browser-pending" });
    expect(model.currentRows.find((row) => row.id === "v320")?.metric).toContain("3/3 bands");
    expect(model.currentRows.find((row) => row.id === "v320")?.metric).toContain("fixed reference");
    expect(model.currentRows.find((row) => row.id === "v321")).toMatchObject({ status: "runtime-wired-browser-pending" });
    expect(model.currentRows.find((row) => row.id === "v321")?.metric).toContain("4/4 colored disk rays");
    expect(model.currentRows.find((row) => row.id === "v321")?.metric).toContain("cinematic shared false");
    expect(model.currentRows.find((row) => row.id === "v322")).toMatchObject({ status: "hud-runtime-wired-browser-pending" });
    expect(model.currentRows.find((row) => row.id === "v322")?.metric).toContain("v5+v6");
    expect(model.currentRows.find((row) => row.id === "v323")).toMatchObject({ status: "provenance-export-wired-browser-pending" });
    expect(model.currentRows.find((row) => row.id === "v323")?.metric).toContain("ray buffer excluded");
    expect(model.missionCapsuleBoundary).toBe("scenario-and-artifact-sha-only");
  });

  it("keeps the quarantined v298r1 truth failure separate from corrected v314 progress", () => {
    const failed = structuredClone(snapshot);
    failed.current.v298r1.truthAuditStatus = "failed-tolerance-ladder-degenerate";
    failed.current.v298r1.errorBudgetStatus = "componentwise-structural-tolerance-withdrawn";
    failed.current.v298r1.continuation = "requires-corrected-authority-and-new-campaign-namespace";
    const model = createRelativityWorkbenchEvidenceModelV285(failed, "ready");
    expect(model.campaignProgress).toMatchObject({ status: "incomplete", completed: 0, planned: 49, nextShardIndex: 0 });
    expect(model.currentRows.find((row) => row.id === "v298r1")?.metric).toContain("truth failed-tolerance-ladder-degenerate");
  });

  it("sanitizes artifact links and exports provenance CSV", () => {
    const response = parseRelativityEvidenceResponseV285({ version: "v285r1-relativity-evidence-response", available: true, reason: "ready", snapshot: { ...snapshot, artifacts: [
      { kind: "PNG", label: "outside", url: "file:///secret.png", sha256: sha },
      { kind: "FITS", label: "science", url: "/api/atlas/relativity-evidence/artifacts/science-fits", sha256: sha },
    ] } });
    expect(response.snapshot?.artifacts).toHaveLength(1);
    expect(serializeRelativityEvidenceCsvV285(response.snapshot!)).toContain("v284");
    expect(serializeRelativityEvidenceCsvV285(response.snapshot!)).toContain("v293");
  });

  it("keeps workbench resource telemetry live without putting registry snapshots in React state", () => {
    const source = readFileSync("app/components/RelativityResearchWorkbenchV280.tsx", "utf8");
    expect(source).toContain("subscribeAtlasResourceSnapshot(publish)");
    expect(source).toContain("writeWorkbenchResourceTelemetryV300");
    expect(source).not.toContain("useAtlasResourceSnapshot");
    expect(source.indexOf("getAtlasResourceSnapshot()", source.lastIndexOf("  return ("))).toBe(-1);
    for (const attribute of [
      "data-atlas-kerr-resource-workers",
      "data-atlas-kerr-resource-gpu-buffers",
      "data-atlas-kerr-resource-gpu-pipelines",
      "data-atlas-kerr-resource-object-urls",
      "data-atlas-kerr-camera-leases",
      "data-atlas-kerr-estimated-gpu-bytes",
      "data-atlas-kerr-resource-revision",
    ]) expect(source).toContain(attribute);
  });
});
import { readFileSync } from "node:fs";
