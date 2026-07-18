import { describe, expect, it } from "vitest";
import {
  RELATIVITY_GUIDED_TOUR_VERSION,
  RELATIVITY_GUIDED_TOUR_WORKFLOW_ID,
  createRelativityGuidedTourSummary,
} from "./relativityGuidedTour";

describe("Relativity Guided Tour v40", () => {
  it("creates deterministic guided steps for the existing v37 observable row ids", () => {
    const first = createRelativityGuidedTourSummary({ diagnostics: null });
    const second = createRelativityGuidedTourSummary({ diagnostics: null });

    expect(first).toEqual(second);
    expect(first.version).toBe(RELATIVITY_GUIDED_TOUR_VERSION);
    expect(first.workflowId).toBe(RELATIVITY_GUIDED_TOUR_WORKFLOW_ID);
    expect(first.status).toBe("ready");
    expect(first.stepCount).toBe(7);
    expect(first.readyCount).toBe(7);
    expect(first.weakFieldStepCount).toBe(4);
    expect(first.strongFieldStepCount).toBe(2);
    expect(first.numericalHealthStepCount).toBe(1);
    expect(first.steps.map((step) => step.observableId)).toEqual([
      "mercury-perihelion-advance",
      "solar-limb-light-deflection",
      "shapiro-radar-delay",
      "gravitational-kinematic-time-dilation",
      "kerr-null-probe-4m-over-b",
      "kerr-isco-split",
      "kerr-hamiltonian-drift",
    ]);
    expect(JSON.stringify(first)).not.toContain("trustScore");
  });

  it("routes weak-field steps to Observable Atlas and Kerr steps to Kerr Studio", () => {
    const summary = createRelativityGuidedTourSummary({ diagnostics: null });
    const weakFieldSteps = summary.steps.filter((step) => step.kind === "weak-field");
    const kerrSteps = summary.steps.filter((step) => step.kind === "strong-field");

    expect(weakFieldSteps).toHaveLength(4);
    expect(weakFieldSteps.every((step) => step.navigatorItemId === "panel:relativity-observables")).toBe(true);
    expect(weakFieldSteps.every((step) => step.validationDomainId === "relativity-explainer")).toBe(true);
    expect(kerrSteps).toHaveLength(2);
    expect(kerrSteps.every((step) => step.navigatorItemId === "panel:kerr-relativity-lab")).toBe(true);
    expect(kerrSteps.every((step) => step.validationDomainId === "kerr-lab")).toBe(true);
  });

  it("preserves Kerr boundaries and keeps Hamiltonian drift as numerical health", () => {
    const summary = createRelativityGuidedTourSummary({ diagnostics: null });
    const nullProbe = summary.steps.find((step) => step.id === "tour-kerr-null-probe");
    const isco = summary.steps.find((step) => step.id === "tour-kerr-isco");
    const drift = summary.steps.find((step) => step.id === "tour-kerr-numerical-health");
    const serialized = JSON.stringify(summary).toLowerCase();

    expect(nullProbe?.source).toContain("eih-1pn+kerr-geodesic-v17");
    expect(nullProbe?.trustedBoundary).toContain("test-particle-null-geodesic-lab");
    expect(isco?.source).toContain("eih-1pn+kerr-geodesic-v17");
    expect(isco?.trustedBoundary).toContain("independent from solar-system EIH 1PN dynamics");
    expect(drift).toEqual(
      expect.objectContaining({
        kind: "numerical-health",
        observableId: "kerr-hamiltonian-drift",
        evidenceClaimId: "kerr-geodesic-lab",
      }),
    );
    expect(drift?.trustedBoundary).toContain("not an astrophysical observable");
    expect(drift?.trustedBoundary).toContain("eih-1pn+kerr-geodesic-v17");
    expect(serialized).not.toContain("online-source");
    expect(serialized).not.toContain("physics mutation applied");
  });
});
