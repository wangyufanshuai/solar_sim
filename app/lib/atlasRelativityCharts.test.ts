import { describe, expect, it } from "vitest";
import {
  ORBIT_ATLAS_SKY,
  ORBIT_ATLAS_V9_SKY,
} from "./orbitAtlasPresentation";
import {
  ATLAS_RELATIVITY_CHART_PROFILE,
  ATLAS_RELATIVITY_CHART_VERSION,
  createAtlasRelativityChartSummary,
} from "./atlasRelativityCharts";
import type { SimulationDiagnostics } from "./simulationDiagnosticsTypes";

describe("Atlas Relativity Charts v74", () => {
  it("creates deterministic chart metadata without physics, sky or Kerr mutation", () => {
    const first = createAtlasRelativityChartSummary();
    const second = createAtlasRelativityChartSummary();

    expect(first).toEqual(second);
    expect(first.version).toBe(ATLAS_RELATIVITY_CHART_VERSION);
    expect(first.chartProfile).toBe(ATLAS_RELATIVITY_CHART_PROFILE);
    expect(first.verificationVersion).toBe("v73-relativity-verification-readability");
    expect(first.benchmarkProfile).toBe("v73-weak-field-kerr-benchmark-readout");
    expect(first.kerrKernelId).toBe("eih-1pn+kerr-geodesic-v17");
    expect(first.physicsMutation).toBe("not-applied");
    expect(first.skyAssetMutation).toBe("not-applied");
    expect(first.kerrKernelMutation).toBe("not-applied");
    expect(first.trustedBoundary).toContain("presentation-layer visual aids");
    expect(first.trustedBoundary).toContain("no SolarSystemIntegrator mutation");
    expect(JSON.stringify(first)).not.toContain("trustScore");
  });

  it("locks the Mercury Newtonian vs EIH 1PN curve and Kerr chart readouts", () => {
    const summary = createAtlasRelativityChartSummary();

    expect(summary.mercuryCurve).toEqual([
      { fractionOfCentury: 0, label: "0%", newtonianArcsec: 0, eihOnePnArcsec: 0, targetArcsec: 0 },
      { fractionOfCentury: 0.25, label: "25%", newtonianArcsec: 0, eihOnePnArcsec: 10.745, targetArcsec: 10.745 },
      { fractionOfCentury: 0.5, label: "50%", newtonianArcsec: 0, eihOnePnArcsec: 21.49, targetArcsec: 21.49 },
      { fractionOfCentury: 0.75, label: "75%", newtonianArcsec: 0, eihOnePnArcsec: 32.235, targetArcsec: 32.235 },
      { fractionOfCentury: 1, label: "100%", newtonianArcsec: 0, eihOnePnArcsec: 42.98, targetArcsec: 42.98 },
    ]);
    expect(summary.weakFieldObservableCount).toBe(4);
    expect(summary.weakFieldReadyCount).toBe(0);
    expect(summary.kerrIscoBars.map((bar) => bar.id)).toEqual(["prograde", "retrograde", "split"]);
    expect(summary.kerrIscoBars.every((bar) => bar.radiusM > 0)).toBe(true);
    expect(summary.hamiltonianDrift.classification).toBe("numerical-health-only");
    expect(summary.hamiltonianDrift.boundary).toContain("not an astrophysical observable");
  });

  it("uses local diagnostics for the Mercury curve when available", () => {
    const summary = createAtlasRelativityChartSummary({
      diagnostics: fullDiagnostics(),
    });

    expect(summary.status).toBe("ready");
    expect(summary.weakFieldReadyCount).toBe(4);
    expect(summary.mercuryNewtonianArcsecPerCentury).toBe(0.12);
    expect(summary.mercuryEihOnePnArcsecPerCentury).toBe(42.6);
    expect(summary.mercuryTargetArcsecPerCentury).toBe(42.98);
    expect(summary.mercuryCurve.at(-1)).toEqual({
      fractionOfCentury: 1,
      label: "100%",
      newtonianArcsec: 0.12,
      eihOnePnArcsec: 42.6,
      targetArcsec: 42.98,
    });
  });

  it("keeps the v69/v71 background lock untouched while adding chart readouts", () => {
    expect(ORBIT_ATLAS_SKY).toBe(ORBIT_ATLAS_V9_SKY);
    expect(ORBIT_ATLAS_V9_SKY.desktopBase).toBe("/textures/sky/orbit-atlas-v9-base-8k.jpg");
    expect(ORBIT_ATLAS_V9_SKY.mobileBase).toBe("/textures/sky/orbit-atlas-v9-base-4k.jpg");
    expect(ORBIT_ATLAS_V9_SKY.rotation).toEqual([-0.34, 4.24, -0.86]);
  });
});

function fullDiagnostics(): SimulationDiagnostics {
  return {
    relativityValidation: {
      mercuryPrecession: {
        sameInitialState: true,
        method: "analytic-1pn-from-osculating-state",
        newtonArcsecPerCentury: 0.12,
        onePnArcsecPerCentury: 42.6,
        targetArcsecPerCentury: 42.98,
        errorPercent: 0.88,
        sampledOrbits: 415,
        status: "ready",
      },
      lightDeflection: {
        impactParameterSolarRadii: 1,
        formulaArcsec: 1.751,
        targetArcsec: 1.751,
        errorPercent: 0,
        status: "ready",
      },
      shapiroDelay: {
        bodyId: "mercury",
        microseconds: 240,
        formulaMicroseconds: 240,
        errorPercent: 0,
        status: "ready",
      },
      timeDilation: {
        bodyId: "earth",
        ratio: 0.999999999,
        slowdownFraction: 1e-9,
        gravitationalPlusKinematicUsPerDay: -45.7,
        surfaceRedshift: 6.95e-10,
        status: "ready",
      },
      horizons: {
        status: "pending",
        progress: 0,
        source: "fixture",
        modes: [],
      },
      semantics: {
        presentation: "orbit-atlas-visual-guide",
        dynamics: "live-nbody-eih-1pn-state",
        validation: "offline-gr-targets-and-jpl-horizons",
        kerr: "independent-strong-field-geodesic-lab",
      },
    },
  } as unknown as SimulationDiagnostics;
}
