import { describe, expect, it } from "vitest";
import {
  getAtlasRuntimeQualityProfile,
  getLaunchSequenceDirectorPhase,
  launchDirectorPhaseLabel,
  selectAtlasRuntimeQualityTier,
} from "./launchSequenceDirector";
import {
  ATLAS_VISUAL_LAUNCH_PERFORMANCE_VERSION,
  createAtlasVisualLaunchPerformanceSummary,
} from "./atlasVisualLaunchPerformanceLock";
import type {
  AtlasRuntimeQualityTier,
  AtlasVisualLaunchPerformanceAudit,
} from "./simulationDiagnosticsTypes";

const audit = (
  id: AtlasVisualLaunchPerformanceAudit["id"],
  status: AtlasVisualLaunchPerformanceAudit["status"] = "ready",
): AtlasVisualLaunchPerformanceAudit => ({
  id,
  label: id,
  status,
  measured: status,
  expected: "ready",
  trustedBoundary: "test",
});

describe("v114 visual launch performance lock", () => {
  it("exposes deterministic pending metadata by default", () => {
    const summary = createAtlasVisualLaunchPerformanceSummary();
    expect(summary.version).toBe(ATLAS_VISUAL_LAUNCH_PERFORMANCE_VERSION);
    expect(summary.profile).toBe("v114-scene-director-runtime-quality");
    expect(summary.launchDirectorPolicy).toBe("prelaunch-liftoff-maxq-staging-coast-deploy");
    expect(summary.runtimeQualityPolicy).toBe("presentation-only-quality-tier-scheduling");
    expect(summary.launchScenePerformancePolicy).toBe("no-per-frame-dom-query-reuse-three-temporaries");
    expect(summary.openRocketBridgePolicy).toBe("offline-import-no-browser-exe-launch");
    expect(summary.budgetPolicy).toBe("v75-v97-v99-budgets-preserved");
    expect(summary.browserExeLaunch).toBe("not-applied");
    expect(summary.guiAutomationMutation).toBe("not-applied");
  });

  it("classifies focused audit results", () => {
    const ready = createAtlasVisualLaunchPerformanceSummary({
      qualityTier: "launch-cinematic",
      audits: [
        audit("v113-scientific-model-upgrade-contract"),
        audit("visible-copy-lock"),
        audit("launch-sequence-director-lock"),
        audit("runtime-quality-governor-lock"),
        audit("openrocket-offline-bridge-lock"),
        audit("browser-qa-marker-lock"),
        audit("protected-mutation-lock"),
      ],
    });
    expect(ready.status).toBe("ready-visual-launch-performance-locked");
    expect(ready.classification).toBe("visual-launch-performance-pass");
    expect(ready.qualityTier).toBe("launch-cinematic");
  });

  it("selects runtime quality without mutating budgets", () => {
    expect(selectAtlasRuntimeQualityTier({ mobile: true, launchActive: true, closeupActive: false })).toBe(
      "mobile-safe",
    );
    expect(selectAtlasRuntimeQualityTier({ mobile: false, launchActive: true, closeupActive: false })).toBe(
      "launch-cinematic",
    );
    expect(selectAtlasRuntimeQualityTier({ mobile: false, launchActive: false, closeupActive: true })).toBe(
      "closeup-inspect",
    );
    expect(selectAtlasRuntimeQualityTier({ mobile: false, launchActive: false, closeupActive: false })).toBe(
      "balanced",
    );

    const tiers: readonly AtlasRuntimeQualityTier[] = [
      "balanced",
      "mobile-safe",
      "launch-cinematic",
      "closeup-inspect",
    ];
    for (const tier of tiers) {
      const profile = getAtlasRuntimeQualityProfile(tier);
      expect(profile.tier).toBe(tier);
      expect(profile.particleBudget).toBeGreaterThan(0);
      expect(profile.trajectorySampleSeconds).toBeGreaterThan(0);
    }
    expect(getAtlasRuntimeQualityProfile("mobile-safe").particleBudget).toBeLessThan(
      getAtlasRuntimeQualityProfile("launch-cinematic").particleBudget,
    );
  });

  it("maps local telemetry into launch director phases", () => {
    expect(getLaunchSequenceDirectorPhase(null)).toBe("prelaunch");
    expect(
      getLaunchSequenceDirectorPhase({
        phase: "srbBurn",
        missionTimeS: 12,
        altitudeKm: 2,
        dynamicPressurePa: 1200,
        destination: "LEO",
        fuelPercent: 96,
      }),
    ).toBe("liftoff");
    expect(
      getLaunchSequenceDirectorPhase({
        phase: "coreBurn",
        missionTimeS: 70,
        altitudeKm: 18,
        dynamicPressurePa: 31_000,
        destination: "LEO",
        fuelPercent: 72,
      }),
    ).toBe("max-q");
    expect(
      getLaunchSequenceDirectorPhase({
        phase: "staging",
        missionTimeS: 160,
        altitudeKm: 64,
        dynamicPressurePa: 200,
        destination: "LEO",
        fuelPercent: 48,
      }),
    ).toBe("stage-separation");
    expect(
      getLaunchSequenceDirectorPhase({
        phase: "orbitCoast",
        missionTimeS: 690,
        altitudeKm: 220,
        dynamicPressurePa: 0,
        destination: "Moon",
        fuelPercent: 24,
      }),
    ).toBe("coast-insertion");
    expect(
      getLaunchSequenceDirectorPhase({
        phase: "orbitCoast",
        missionTimeS: 900,
        altitudeKm: 550,
        dynamicPressurePa: 0,
        destination: "LEO",
        fuelPercent: 8,
      }),
    ).toBe("payload-deploy");
    expect(launchDirectorPhaseLabel("max-q")).toBe("Max-Q");
  });
});
