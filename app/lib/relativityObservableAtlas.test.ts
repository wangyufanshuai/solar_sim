import { describe, expect, it } from "vitest";
import {
  RELATIVITY_OBSERVABLE_ATLAS_VERSION,
  RELATIVITY_OBSERVABLE_EXPLAINER_VERSION,
  createRelativityObservableAtlasSummary,
  createRelativityObservableExplainerSummary,
} from "./relativityObservableAtlas";
import type { RelativityValidationSummary, SimulationDiagnostics } from "./simulationDiagnosticsTypes";

describe("Relativity Observable Atlas v37", () => {
  it("creates deterministic output with null diagnostics", () => {
    const first = createRelativityObservableAtlasSummary({ diagnostics: null });
    const second = createRelativityObservableAtlasSummary({ diagnostics: null });

    expect(first).toEqual(second);
    expect(first.version).toBe(RELATIVITY_OBSERVABLE_ATLAS_VERSION);
    expect(first.status).toBe("pending");
    expect(first.observableCount).toBe(7);
    expect(first.readyCount).toBe(2);
    expect(first.weakFieldCount).toBe(4);
    expect(first.strongFieldCount).toBe(2);
    expect(first.numericalHealthCount).toBe(1);
    expect(first.rows.map((row) => row.id)).toEqual([
      "mercury-perihelion-advance",
      "solar-limb-light-deflection",
      "shapiro-radar-delay",
      "gravitational-kinematic-time-dilation",
      "kerr-null-probe-4m-over-b",
      "kerr-isco-split",
      "kerr-hamiltonian-drift",
    ]);
    expect(first.rows.map((row) => row.scaleBand)).toEqual([
      "weak-field-precision",
      "weak-field-precision",
      "weak-field-precision",
      "weak-field-precision",
      "strong-field-geometry",
      "strong-field-geometry",
      "numerical-health-boundary",
    ]);
    expect(first.rows.every((row) => row.scaleNote.length > 20)).toBe(true);
    expect(JSON.stringify(first)).not.toContain("trustScore");
    expect(first.boundary).toContain("not full numerical relativity");
    expect(first.boundary).toContain("not online astronomy database validation");
  });

  it("marks weak-field observable rows ready from full diagnostics", () => {
    const summary = createRelativityObservableAtlasSummary({
      diagnostics: fullDiagnostics(),
    });
    const weakRows = summary.rows.filter((row) => row.kind === "weak-field");

    expect(summary.status).toBe("ready");
    expect(summary.readyCount).toBe(6);
    expect(weakRows).toHaveLength(4);
    expect(weakRows.every((row) => row.status === "ready")).toBe(true);
    expect(summary.rows.find((row) => row.id === "mercury-perihelion-advance")?.measuredValue).toContain(
      "42.98 arcsec/century",
    );
    expect(summary.rows.find((row) => row.id === "solar-limb-light-deflection")?.referenceValue).toContain(
      "1.751 arcsec",
    );
    expect(summary.rows.find((row) => row.id === "shapiro-radar-delay")?.measuredValue).toContain(
      "240.00 microseconds",
    );
    expect(summary.rows.find((row) => row.id === "gravitational-kinematic-time-dilation")?.referenceValue).toBe(
      "selected body earth",
    );
  });

  it("preserves Kerr Studio v35 boundary and treats Hamiltonian drift as numerical health", () => {
    const summary = createRelativityObservableAtlasSummary({ diagnostics: null });
    const nullProbe = summary.rows.find((row) => row.id === "kerr-null-probe-4m-over-b");
    const isco = summary.rows.find((row) => row.id === "kerr-isco-split");
    const drift = summary.rows.find((row) => row.id === "kerr-hamiltonian-drift");
    const sources = summary.rows.map((row) => row.source).join("\n");

    expect(nullProbe?.source).toContain("v35-kerr-relativity-studio");
    expect(nullProbe?.source).toContain("eih-1pn+kerr-geodesic-v17");
    expect(nullProbe?.boundary).toContain("test-particle-null-geodesic-lab");
    expect(isco?.source).toContain("v35-kerr-relativity-studio");
    expect(isco?.source).toContain("test-particle-null-geodesic-lab");
    expect(drift).toEqual(
      expect.objectContaining({
        kind: "numerical-health",
        scaleBand: "numerical-health-boundary",
        status: "informational",
        referenceValue: expect.stringContaining("not an astrophysical observable"),
      }),
    );
    expect(drift?.boundary).toContain("Numerical health only");
    expect(sources.toLowerCase()).not.toContain("online");
    expect(JSON.stringify(summary).toLowerCase()).not.toContain("physics mutation applied");
  });
});

describe("Relativity Observable Explainer v39", () => {
  it("creates deterministic derivation cards for the existing v37 observable row ids", () => {
    const first = createRelativityObservableExplainerSummary({ diagnostics: null });
    const second = createRelativityObservableExplainerSummary({ diagnostics: null });

    expect(first).toEqual(second);
    expect(first.version).toBe(RELATIVITY_OBSERVABLE_EXPLAINER_VERSION);
    expect(first.status).toBe("pending");
    expect(first.cardCount).toBe(7);
    expect(first.totalStepCount).toBe(28);
    expect(first.cards.map((card) => card.observableId)).toEqual([
      "mercury-perihelion-advance",
      "solar-limb-light-deflection",
      "shapiro-radar-delay",
      "gravitational-kinematic-time-dilation",
      "kerr-null-probe-4m-over-b",
      "kerr-isco-split",
      "kerr-hamiltonian-drift",
    ]);
    expect(first.cards.every((card) => card.derivationSteps.length === 4)).toBe(true);
    expect(first.cards.every((card) => card.variables.length >= 4)).toBe(true);
    expect(first.boundary).toContain("not scientific certification");
    expect(JSON.stringify(first)).not.toContain("trustScore");
  });

  it("adds weak-field variables, derivation steps and scale explanations", () => {
    const summary = createRelativityObservableExplainerSummary({
      observableAtlasSummary: createRelativityObservableAtlasSummary({ diagnostics: fullDiagnostics() }),
    });
    const mercury = summary.cards.find((card) => card.id === "mercury-perihelion-advance");
    const light = summary.cards.find((card) => card.id === "solar-limb-light-deflection");
    const shapiro = summary.cards.find((card) => card.id === "shapiro-radar-delay");
    const clocks = summary.cards.find((card) => card.id === "gravitational-kinematic-time-dilation");

    expect(mercury?.variables.map((variable) => variable.symbol)).toEqual(
      expect.arrayContaining(["Delta omega", "GM", "a", "e", "c"]),
    );
    expect(light?.formulaExpression).toBe("alpha = 4GM/(c^2 b)");
    expect(shapiro?.variables.map((variable) => variable.symbol)).toEqual(
      expect.arrayContaining(["Delta t", "rE", "rT", "R"]),
    );
    expect(clocks?.derivationSteps.map((step) => step.id)).toEqual(
      expect.arrayContaining(["potential", "kinematic", "combine", "compare"]),
    );
    expect(mercury?.scaleInterpretation).toContain("43 arcseconds per century");
    expect(clocks?.applicability).toContain("not a precision timing certification");
  });

  it("preserves Kerr Studio boundaries and keeps Hamiltonian drift as numerical health", () => {
    const summary = createRelativityObservableExplainerSummary({ diagnostics: null });
    const nullProbe = summary.cards.find((card) => card.id === "kerr-null-probe-4m-over-b");
    const isco = summary.cards.find((card) => card.id === "kerr-isco-split");
    const drift = summary.cards.find((card) => card.id === "kerr-hamiltonian-drift");
    const serialized = JSON.stringify(summary).toLowerCase();

    expect(nullProbe?.source).toContain("v35-kerr-relativity-studio");
    expect(nullProbe?.source).toContain("eih-1pn+kerr-geodesic-v17");
    expect(nullProbe?.trustedBoundary).toContain("test-particle-null-geodesic-lab");
    expect(isco?.source).toContain("v35-kerr-relativity-studio");
    expect(isco?.source).toContain("eih-1pn+kerr-geodesic-v17");
    expect(drift).toEqual(
      expect.objectContaining({
        kind: "numerical-health",
        status: "informational",
        applicability: expect.stringContaining("Numerical health only"),
      }),
    );
    expect(drift?.trustedBoundary).toContain("not an astrophysical observable");
    expect(serialized).not.toContain("online-source");
    expect(serialized).not.toContain("physics mutation applied");
  });
});

function fullDiagnostics(): SimulationDiagnostics {
  return {
    relativityValidation: {
      mercuryPrecession: {
        sameInitialState: true,
        method: "analytic-1pn-from-osculating-state",
        newtonArcsecPerCentury: 0,
        onePnArcsecPerCentury: 42.98,
        targetArcsecPerCentury: 42.98,
        errorPercent: 0,
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
        bodyId: "mars",
        microseconds: 240,
        formulaMicroseconds: 240,
        errorPercent: 0,
        status: "ready",
      },
      timeDilation: {
        bodyId: "earth",
        ratio: 0.9999999993,
        slowdownFraction: 7e-10,
        gravitationalPlusKinematicUsPerDay: -60.5,
        surfaceRedshift: 6.95e-10,
        status: "ready",
      },
      horizons: {
        status: "complete",
        progress: 1,
        source: "JPL Horizons API",
        modes: [],
      },
      semantics: {
        presentation: "orbit-atlas-visual-guide",
        dynamics: "live-nbody-eih-1pn-state",
        validation: "offline-gr-targets-and-jpl-horizons",
        kerr: "independent-strong-field-geodesic-lab",
      },
    } satisfies RelativityValidationSummary,
  } as unknown as SimulationDiagnostics;
}
