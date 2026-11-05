import { describe, expect, it } from "vitest";
import {
  ORBIT_ATLAS_SKY,
  ORBIT_ATLAS_V9_SKY,
} from "./orbitAtlasPresentation";
import {
  ATLAS_RELATIVITY_BENCHMARK_PROFILE,
  ATLAS_RELATIVITY_KERNEL_ID,
  ATLAS_RELATIVITY_VERIFICATION_VERSION,
  createAtlasRelativityVerificationSummary,
} from "./atlasRelativityVerification";

describe("Atlas Relativity Verification v73", () => {
  it("creates deterministic readability metadata without physics, sky or Kerr mutation", () => {
    const first = createAtlasRelativityVerificationSummary();
    const second = createAtlasRelativityVerificationSummary();

    expect(first).toEqual(second);
    expect(first.version).toBe(ATLAS_RELATIVITY_VERIFICATION_VERSION);
    expect(first.benchmarkProfile).toBe(ATLAS_RELATIVITY_BENCHMARK_PROFILE);
    expect(first.observableAtlasVersion).toBe("v37-relativity-observable-atlas");
    expect(first.explainerVersion).toBe("v39-relativity-observable-explainer");
    expect(first.guidedTourVersion).toBe("v40-relativity-guided-tour");
    expect(first.kerrStudioVersion).toBe("v35-kerr-relativity-studio");
    expect(first.kerrKernelId).toBe(ATLAS_RELATIVITY_KERNEL_ID);
    expect(first.physicsMutation).toBe("not-applied");
    expect(first.skyAssetMutation).toBe("not-applied");
    expect(first.kerrKernelMutation).toBe("not-applied");
    expect(first.trustedBoundary).toContain("not numerical relativity");
    expect(first.trustedBoundary).toContain("not an online data refresh");
    expect(first.trustedBoundary).toContain("does not modify SolarSystemIntegrator");
    expect(JSON.stringify(first)).not.toContain("trustScore");
  });

  it("locks weak-field, Kerr and numerical-health readout counts and classifications", () => {
    const summary = createAtlasRelativityVerificationSummary();

    expect(summary.readoutCount).toBe(7);
    expect(summary.weakFieldObservableCount).toBe(4);
    expect(summary.strongFieldObservableCount).toBe(2);
    expect(summary.numericalHealthMetricCount).toBe(1);
    expect(summary.readouts.map((readout) => readout.id)).toEqual([
      "mercury-perihelion-advance",
      "solar-limb-light-deflection",
      "shapiro-radar-delay",
      "gravitational-kinematic-time-dilation",
      "kerr-null-probe-4m-over-b",
      "kerr-isco-split",
      "kerr-hamiltonian-drift",
    ]);
    expect(summary.readouts.map((readout) => readout.classification)).toEqual([
      "weak-field-observable",
      "weak-field-observable",
      "weak-field-observable",
      "weak-field-observable",
      "kerr-test-particle-reference",
      "kerr-test-particle-reference",
      "numerical-health-only",
    ]);
    expect(
      summary.readouts.find((readout) => readout.id === "kerr-hamiltonian-drift"),
    ).toEqual(
      expect.objectContaining({
        kind: "numerical-health",
        route: "kerr-studio-and-guided-tour",
        boundary: expect.stringContaining("numerical-health-only"),
      }),
    );
  });

  it("keeps the v69/v71 background lock untouched while adding the v73 contract", () => {
    expect(ORBIT_ATLAS_SKY).toBe(ORBIT_ATLAS_V9_SKY);
    expect(ORBIT_ATLAS_V9_SKY.desktopBase).toBe("/textures/sky/orbit-atlas-v9-base-8k.jpg");
    expect(ORBIT_ATLAS_V9_SKY.mobileBase).toBe("/textures/sky/orbit-atlas-v9-base-4k.jpg");
    expect(ORBIT_ATLAS_V9_SKY.desktopStars).toBe("/textures/sky/orbit-atlas-v9-stars-4k.jpg");
    expect(ORBIT_ATLAS_V9_SKY.mobileStars).toBe("/textures/sky/orbit-atlas-v9-stars-2k.jpg");
    expect(ORBIT_ATLAS_V9_SKY.dustMask).toBe("/textures/sky/orbit-atlas-v9-dust-2k.jpg");
    expect(ORBIT_ATLAS_V9_SKY.rotation).toEqual([-0.34, 4.24, -0.86]);
  });
});
