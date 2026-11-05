import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const readJson = (path: string) => JSON.parse(readFileSync(resolve(root, path), "utf8")) as Record<string, unknown>;
const fileSha = (path: string) => createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex");

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([key]) => !["generatedAt", "pid", "host", "absolutePath", "peakRssGiB"].includes(key))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => [key, canonicalize(entry)]));
}

const canonicalSha = (value: unknown) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");

describe("v299 local-shadow capability pointer", () => {
  it("locks the incomplete dense boundary without advancing the formal product", () => {
    const evidencePath = "dist/science/orbit-atlas-shadow-v299-evidence.json";
    const pointerPath = "dist/release/orbit-atlas-current-local-shadow-candidate-v299.json";
    const evidence = readJson(evidencePath);
    const pointer = readJson(pointerPath);
    const evidenceUnsigned = { ...evidence };
    const pointerUnsigned = { ...pointer };
    delete evidenceUnsigned.evidenceSha256;
    delete pointerUnsigned.pointerSha256;
    expect(evidence.evidenceSha256).toBe(canonicalSha(evidenceUnsigned));
    expect(pointer.pointerSha256).toBe(canonicalSha(pointerUnsigned));
    expect(pointer).toMatchObject({
      formalProductPointer: "v263",
      formalProductPointerAdvanced: false,
      localShadowDefaultApplied: false,
      publicDeploymentBlocked: true,
      capabilities: {
        v296: "geometry-redshift-qualified",
        v297: "full-kerr-short-authority-qualified",
        v296ToleranceConvergence: "withdrawn-same-effective-solver-tolerance",
        v298r1: "quarantined-1-of-49-tolerance-ladder-degenerate",
        denseShardAudits: "structural-qualified-1-of-1-truth-audit-failed",
        denseToleranceConvergenceV311: "withdrawn-0-of-256-strict-solver-ladder-pairs",
        denseRssTelemetry: "corrected-probe-qualified-historical-shard0-unmeasured",
        criticalCurve: "bounded-40-bracket-sha-locked-browser-view",
        observerEmitterRedshift: "bounded-four-disk-ray-independent-browser-replay",
        eventTimelines: "bounded-16-ray-dual-formula-earliest-valid-event-replay",
        errorBudget: "layered-sparse-qualified-dense-shard-only-no-rss",
        polarizationView: "bounded-four-ray-projected-wp-independent-ks-transport-replay",
        strongGravityVisualV305: "v6-all-token-consumed-science-cinematic-buffer-isolated",
        scienceObservablesV306: "bounded-16-ray-componentwise-null-not-zero-workbench-view",
        scienceRasterV307: "deterministic-classification-redshift-evpa-image-order-sparse-raster",
        resourceScopeV308: "idempotent-reverse-order-failure-rollback-for-strong-gravity-resources",
        strongGravityTelemetryV309: "non-react-science-raster-and-resource-rollback-browser-observability",
        strongGravityBrowserGateV310: "fail-closed-science-authority-raster-lifecycle-spec-authored-not-run",
        visualAssetsExisting2K: "qualified-manifest-license-output-sha-texture-provenance-local-shadow-intent-only",
        heavyQualification: "blocked-heavy-qualification",
        visualV6: "manual-local-shadow-only-not-default",
        browserQualification: "not-run",
      },
      evidence: {
        path: evidencePath,
        fileSha256: fileSha(evidencePath),
        canonicalSha256: evidence.evidenceSha256,
      },
    });
    expect(evidence).toMatchObject({
      runtime: { denseAuthorityAccepted: false, partialAggregateAccepted: false, visualProfileDefaultApplied: false },
      campaign: {
        completedShardCount: 1,
        auditedShardCount: 1,
        plannedShardCount: 49,
        nextShardIndex: 1,
        peakRssBytes: null,
        peakRssTelemetry: { status: "corrected-probe-qualified-shard0-unmeasured", gate: false, probeGate: true, historicalShardRssQualified: false },
        aggregateAvailable: false,
        truthAuditStatus: "failed-tolerance-ladder-degenerate",
        toleranceLadderQualified: false,
        strictSolverLadderPairCount: 0,
        expectedSolverLadderPairCount: 256,
        continuation: "requires-corrected-authority-and-new-campaign-namespace",
      },
      formalProductPointer: { version: "v263", advanced: false },
      science: { defaultKernel: "legacy-eih-1pn", workerPhysicsMutation: "not-applied", legacyKerrMutation: "not-applied" },
    });
    expect(evidence).toMatchObject({
      runtime: {
        denseErrorBudget: "componentwise-structural-audit-preserved-tolerance-convergence-withdrawn",
        heavyQualification: { status: "blocked-heavy-qualification", authorized: false, observed: { evidenceVersion: "v275r1-resource-stability-preflight-v1", campaignStatus: "incomplete-1-of-49", completedShardCount: 1, aggregateAvailable: false, denseToleranceConvergenceStatus: "withdrawn" } },
      },
      authority: {
        correctedRssProbe: { path: "dist/science/kerr-campaign-v298r1/rss-probe-v2.json" },
        shardTruthAudit: { path: "dist/science/kerr-campaign-v298r1/audits/shard-00.truth-audit-v311.json", status: "failed-tolerance-ladder-degenerate" },
        shardAudits: [{ shardIndex: 0, errorBudgetVersion: "v298r1-dense-kerr-error-budget-v1" }],
        licensedExistingAssets: {
          runtimeProfiles: ["science-cinematic-v4-v285", "science-cinematic-v5-v299", "science-cinematic-v6-v300"],
          delivery: "local-shadow-deep-space-intent-only",
          entries: [
            { id: "nasa-svs-milky-way-mobile-2k", outputSha256: "53ff92ed692d56058854e5216e9204f3f6437c8a9b7de6aeae40758db326fff5" },
            { id: "nasa-svs-bright-stars-mobile-2k", outputSha256: "62ccea2d5b83ab96e362c42a847b42530a9f13e806ae0c4b700928d6053a112d" },
          ],
        },
        resourcePreflight: { path: "dist/science/resource-preflight-v275r1-evidence.json" },
      },
    });
    const sourceManifest = (evidence.authority as { sourceManifest: Array<{ path: string; sha256: string }>; sourceSha256: string }).sourceManifest;
    const sourcePaths = sourceManifest.map((entry) => entry.path);
    expect(sourcePaths).toContain("app/lib/atlasResourceLifecycle.ts");
    expect(sourcePaths).toContain("app/lib/kerrCriticalCurveV300.ts");
    expect(sourcePaths).toContain("app/lib/kerrObserverEmitterReplayV301.ts");
    expect(sourcePaths).toContain("app/lib/kerrObserverEmitterReplayServerV301.ts");
    expect(sourcePaths).toContain("app/components/KerrObserverEmitterWorkbenchV301.tsx");
    expect(sourcePaths).toContain("app/lib/kerrEventTimelineV302.ts");
    expect(sourcePaths).toContain("app/components/KerrEventTimelineWorkbenchV302.tsx");
    expect(sourcePaths).toContain("app/lib/kerrErrorBudgetV303.ts");
    expect(sourcePaths).toContain("app/lib/kerrErrorBudgetServerV303.ts");
    expect(sourcePaths).toContain("app/components/KerrErrorBudgetWorkbenchV303.tsx");
    expect(sourcePaths).toContain("app/lib/kerrPolarizationViewV304.ts");
    expect(sourcePaths).toContain("app/lib/kerrPolarizationViewServerV304.ts");
    expect(sourcePaths).toContain("app/components/KerrPolarizationWorkbenchV304.tsx");
    expect(sourcePaths).toContain("app/lib/kerrStrongGravityVisualV305.ts");
    expect(sourcePaths).toContain("app/lib/kerrScienceObservablesV306.ts");
    expect(sourcePaths).toContain("app/components/KerrScienceObservablesWorkbenchV306.tsx");
    expect(sourcePaths).toContain("app/lib/kerrScienceRasterV307.ts");
    expect(sourcePaths).toContain("app/lib/atlasResourceScopeV308.ts");
    expect(sourcePaths).toContain("app/lib/atlasStrongGravityTelemetryV309.ts");
    expect(sourcePaths).toContain("app/lib/atlasStrongGravityBrowserGateV310.ts");
    expect(sourcePaths).toContain("scripts/audit-kerr-dense-shard-v311.py");
    expect(sourcePaths).toContain("app/lib/kerrDenseShardTruthV311.ts");
    expect(sourcePaths).toContain("app/components/KerrDenseShardTruthWorkbenchV311.tsx");
    expect(sourcePaths).toContain("app/components/useLaunchSceneResources.ts");
    for (const source of sourceManifest) expect(source.sha256).toBe(fileSha(source.path));
    expect((evidence.authority as { sourceSha256: string }).sourceSha256).toBe(canonicalSha(sourceManifest));
  });
});
