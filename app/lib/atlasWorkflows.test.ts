import { describe, expect, it } from "vitest";
import { createAtlasNavigatorSummary } from "./atlasNavigator";
import { ATLAS_WORKFLOW_VERSION, createAtlasWorkflowSummary } from "./atlasWorkflows";
import { createEvidenceLedgerSummary } from "./evidenceLedger";
import type {
  AtlasWorkflowId,
  AtlasWorkflowStep,
  EvidenceLedgerSummary,
} from "./simulationDiagnosticsTypes";

const REQUIRED_WORKFLOWS: readonly AtlasWorkflowId[] = [
  "solar-validation",
  "relativity-lab",
  "relativity-guided-tour",
  "deep-sky-provenance",
  "cosmology-validation",
  "gaia-galactic-context",
];

describe("Atlas Workflows v25", () => {
  it("includes all required workflow ids with stable finite step contracts", () => {
    const navigatorSummary = createNavigatorSummary(true);
    const summary = createAtlasWorkflowSummary({ navigatorSummary });
    const navigatorItemIds = new Set(navigatorSummary.items.map((item) => item.id));

    expect(summary.version).toBe(ATLAS_WORKFLOW_VERSION);
    expect(summary.workflowCount).toBe(REQUIRED_WORKFLOWS.length);
    expect(summary.workflows.map((workflow) => workflow.id)).toEqual(REQUIRED_WORKFLOWS);
    expect(summary.selectedDefaultId).toBe("solar-validation");

    for (const workflow of summary.workflows) {
      expect(workflow.title).toBeTruthy();
      expect(workflow.objective).toBeTruthy();
      expect(workflow.source).toBeTruthy();
      expect(workflow.model).toBeTruthy();
      expect(workflow.boundary).toBeTruthy();
      expect(workflow.stepCount).toBe(workflow.steps.length);
      expect(workflow.steps.length).toBeGreaterThan(0);

      const stepIds = new Set<string>();
      for (const step of workflow.steps) {
        expect(stepIds.has(step.id)).toBe(false);
        stepIds.add(step.id);
        expectStepContract(step);
        if (step.navigatorItemId) {
          expect(navigatorItemIds.has(step.navigatorItemId)).toBe(true);
          expect(step.navigatorItem?.id).toBe(step.navigatorItemId);
        }
      }
    }
  });

  it("keeps blocked Orbit Analysis readable when no Orbit Atlas body is selected", () => {
    const summary = createAtlasWorkflowSummary({
      navigatorSummary: createNavigatorSummary(false),
    });
    const orbitStep = summary.workflows
      .find((workflow) => workflow.id === "solar-validation")
      ?.steps.find((step) => step.id === "open-orbit-analysis");

    expect(orbitStep?.status).toBe("blocked");
    expect(orbitStep?.blockedReason).toContain("Select a solar body");
    expect(orbitStep?.source).toBeTruthy();
    expect(orbitStep?.model).toBeTruthy();
    expect(orbitStep?.boundary).toContain("selected Orbit Atlas body");
  });

  it("maps expected evidence, catalog and Kerr workflow steps to existing Navigator items", () => {
    const summary = createAtlasWorkflowSummary({
      navigatorSummary: createNavigatorSummary(true),
    });
    const allSteps = summary.workflows.flatMap((workflow) => workflow.steps);

    expect(allSteps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "focus-andromeda",
          catalogObjectId: "galaxy:m31",
          navigatorItemId: "celestial-object:galaxy:m31",
        }),
        expect.objectContaining({
          id: "open-frw-evidence",
          evidenceClaimId: "frw-planck2018-lcdm",
          navigatorItemId: "evidence-claim:frw-planck2018-lcdm",
        }),
        expect.objectContaining({
          id: "open-kerr-lab",
          navigatorItemId: "panel:kerr-relativity-lab",
          expectedSurface: "kerr-lab",
        }),
        expect.objectContaining({
          id: "tour-mercury-precession",
          navigatorItemId: "panel:relativity-observables",
          relativityObservableId: "mercury-perihelion-advance",
          relativityGuidedTourStepId: "tour-mercury-precession",
        }),
        expect.objectContaining({
          id: "tour-kerr-numerical-health",
          navigatorItemId: "panel:kerr-relativity-lab",
          expectedSurface: "kerr-lab",
          relativityObservableId: "kerr-hamiltonian-drift",
        }),
        expect.objectContaining({
          id: "open-gaia-evidence",
          evidenceClaimId: "gaia-dr3-catalog",
        }),
      ]),
    );
  });

  it("is deterministic and non-crashing with missing diagnostics or missing Navigator evidence", () => {
    const first = createAtlasWorkflowSummary();
    const second = createAtlasWorkflowSummary();

    expect(first.workflows.map((workflow) => workflow.id)).toEqual(
      second.workflows.map((workflow) => workflow.id),
    );
    expect(first.workflows.flatMap((workflow) => workflow.steps.map((step) => step.id))).toEqual(
      second.workflows.flatMap((workflow) => workflow.steps.map((step) => step.id)),
    );
    expect(first.blockedStepCount).toBeGreaterThan(0);
  });
});

function createNavigatorSummary(orbitAnalysisAvailable: boolean) {
  return createAtlasNavigatorSummary({
    evidenceLedgerSummary: evidenceSummary(),
    orbitAnalysisAvailable,
    maxResults: 2000,
  });
}

function evidenceSummary(): EvidenceLedgerSummary {
  return createEvidenceLedgerSummary({
    diagnostics: null,
    orbitAtlasProfile: "orbit-atlas-v12",
    orbitAtlasRenderer: "cold-body-web-v12",
    gaiaCatalogSource: "gaia-dr3",
    orbitAtlasReady: true,
    presentationMode: "orbit-atlas",
  });
}

function expectStepContract(step: AtlasWorkflowStep) {
  expect(step.id).toMatch(/^[a-z0-9-]+$/);
  expect(step.title).toBeTruthy();
  expect(step.target).toBeTruthy();
  expect(step.source).toBeTruthy();
  expect(step.model).toBeTruthy();
  expect(step.boundary).toBeTruthy();
  expect(step.actionLabel).toBeTruthy();
  expect(["ready", "blocked", "informational"]).toContain(step.status);
}
