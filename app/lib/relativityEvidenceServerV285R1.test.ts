import { describe, expect, it } from "vitest";
import { loadAtlasRelativityEvidenceSnapshotV285R1 } from "./relativityEvidenceServerV285R1";

describe("v285.1 relativity evidence server", () => {
  it("loads only sanitized whitelisted evidence with verified SHAs", async () => {
    const snapshot = await loadAtlasRelativityEvidenceSnapshotV285R1();
    expect(snapshot.status).toBe("ready");
    expect(snapshot.phases.v282).toMatchObject({ status: "partial", mismatchCount: 8 });
    expect(snapshot.phases.v283).toMatchObject({ status: "blocked", executionCount: 128, criticalBracketCount: 40 });
    expect(snapshot.phases.v284).toMatchObject({ status: "blocked", completedShardCount: 0, plannedShardCount: 49, nextShardIndex: null, authority: "corrected-v288" });
    expect(snapshot.current.v291).toMatchObject({ status: "diagnostics-qualified", capture02Agreement: true });
    expect(snapshot.current.v292).toMatchObject({ status: "geometry-redshift-failed", executionCount: 128, criticalBracketCount: 40, classificationAgreement: 1 });
    expect(snapshot.current.v293).toMatchObject({ status: "blocked-by-geometry", implementationSelfTestPassed: true, applicableExecutionCount: 0 });
    expect(snapshot.current.v296).toMatchObject({ status: "geometry-redshift-qualified", executionCount: 128, criticalBracketCount: 40 });
    expect(snapshot.current.v297).toMatchObject({ status: "full-kerr-short-authority-qualified", applicableExecutionCount: 16 });
    expect(snapshot.current.v298).toMatchObject({ status: "incomplete-0-of-49", completedShardCount: 0, nextShardIndex: 0, runNextAvailable: false });
    expect(snapshot.current.v298r1).toMatchObject({ status: "incomplete-1-of-49", completedShardCount: 1, runNextAvailable: false, peakRssBytes: null, peakRssTelemetry: "corrected-probe-qualified-shard0-unmeasured", auditedShardCount: 1, errorBudgetStatus: "componentwise-structural-tolerance-withdrawn", truthAuditStatus: "failed-tolerance-ladder-degenerate", toleranceLadderQualified: false, continuation: "requires-corrected-authority-and-new-campaign-namespace" });
    expect(snapshot.current.v299).toMatchObject({ scienceDisplay: "linear-no-grade-postfx-bypassed", gpuAuthority: "cpu-v296-v297-portable-envelope", resourceLifecycle: "static-qualified-browser-baseline-pending", visualAssetRuntime: "licensed-2k-local-shadow-v4-v5-v6-intent-only" });
    expect(snapshot.current.v299.visualProfileCandidates).toEqual(["science-cinematic-v5-v299", "science-cinematic-v6-v300"]);
    expect(snapshot.current.v312).toMatchObject({ status: "corrected-authority-qualified", executionCount: 128, strictSolverLadderPairCount: 64, expectedSolverLadderPairCount: 64, distinctConvergenceObservableCount: 246, convergenceObservableCount: 256, polarizationStatus: "requires-v312-locked-polarization-requalification", correctedDenseCampaignCreated: false });
    expect(snapshot.current.v312.peakRssGiB).toBeGreaterThan(0);
    expect(snapshot.current.v313).toMatchObject({ status: "full-kerr-short-authority-qualified", applicableExecutionCount: 16, correctedDenseCampaignCreated: false, geometryAuthoritySha256: "dec9aa5644e602dd41c82d3a21faf9edf9865d4c2a430010ecae890388e5290e" });
    expect(snapshot.current.v313.maxReleaseEvpaDifferenceDeg).toBeLessThan(0.5);
    expect(snapshot.current.v313.maxInternalEvpaDifferenceDeg).toBeLessThan(0.1);
    expect(snapshot.current.v314).toMatchObject({ status: "incomplete-0-of-49", plannedRayCount: 3097, plannedShardCount: 49, completedShardCount: 0, nextShardIndex: 0, attemptConsumed: false, runNextAvailable: false, aggregateAvailable: false });
    expect(snapshot.current.v315).toMatchObject({
      status: "implemented-awaiting-browser-qualification",
      scienceAuthority: "v312-v313-short-gate-sparse",
      fullShortAuthoritySha256: "99e591c0a8fd1f342ef622239301d04cf9f5cd33cbe1c45f1159e0804f2e81a6",
      geometryAuthoritySha256: "dec9aa5644e602dd41c82d3a21faf9edf9865d4c2a430010ecae890388e5290e",
      polarizationAuthoritySha256: "e4b6044ed828f31b7eb511b4e722bc474414acdcab8cedbdf16484b20216ae6f",
      rayPlanAuthoritySha256: "89ce45769978650c177acb83a0c37ceb1c0a1a6f6db34655448f5c6fcb896c04",
      denseStatus: "incomplete-0-of-49",
      denseAggregateAccepted: false,
      browserQualificationRun: false,
    });
    expect(snapshot.current.v316).toMatchObject({
      status: "static-qualified-browser-pending",
      requiredFieldCount: 46,
      declaredFieldCount: 46,
      runtimeGroupSignature: "resolved-profile-exact-v300",
      localShadowManualAbOnly: true,
      browserQualificationRun: false,
    });
    expect(snapshot.current.v317).toMatchObject({
      status: "static-qualified-browser-pending",
      scientificTypedArrayCount: 67,
      digestAlgorithm: "sha-256-field-framed-byte-exact",
      beforeAfterRasterDigestRequired: true,
      rasterBufferDisjointRequired: true,
      interactiveAuthoritySha256: "99e591c0a8fd1f342ef622239301d04cf9f5cd33cbe1c45f1159e0804f2e81a6",
      historicalV299MutationApplied: false,
      webGpuDifferential: "pending",
      lifecycleBaselineReturnTelemetry: "wired-browser-pending",
      browserQualificationRun: false,
    });
    expect(snapshot.current.v318).toMatchObject({
      status: "reference-qualified-hardware-pending",
      authoritySha256: "99e591c0a8fd1f342ef622239301d04cf9f5cd33cbe1c45f1159e0804f2e81a6",
      sampleCount: 16,
      criticalBracketCount: 40,
      cpuAuthorityPreserved: true,
      webGpuDifferential: "pending",
      browserGate: "authored-not-run",
    });
    expect(snapshot.current.v319).toMatchObject({
      status: "derived-spectrum-qualified-browser-pending",
      applicableDiskRayCount: 4,
      denseAggregateAccepted: false,
      browserQualificationRun: false,
    });
    expect(snapshot.current.v319.liouvilleInvariantRelativeResidual).toBeLessThan(1e-12);
    expect(snapshot.current.v319.diskQuadratureRelative).toBeLessThan(5e-4);
    expect(snapshot.current.v319.formulaSpectralRelative).toBeLessThan(0.02);
    expect(snapshot.current.v319.spectralArtifactSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(snapshot)).not.toContain(process.cwd());
  });
});
