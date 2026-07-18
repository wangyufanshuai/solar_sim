import { describe, expect, it } from "vitest";
import { createAtlasMissionCapsule, restoreAtlasMissionCapsule } from "./atlasMissionCapsule";
import { createAtlasMissionHubSummary } from "./atlasMissionHub";
import { createAtlasNavigatorSummary } from "./atlasNavigator";
import {
  ATLAS_OBSERVATORY_DECK_VERSION,
  createAtlasObservatoryDeckSummary,
} from "./atlasObservatoryDeck";
import {
  createAtlasReportStudioSummary,
  createAtlasScientificReportSummary,
} from "./atlasScientificReport";
import { createAtlasValidationConsoleSummary } from "./atlasValidationConsole";
import { createAtlasWorkflowSummary } from "./atlasWorkflows";
import { createEvidenceLedgerSummary } from "./evidenceLedger";
import {
  createRelativityObservableAtlasSummary,
  createRelativityObservableExplainerSummary,
} from "./relativityObservableAtlas";
import { createRelativityGuidedTourSummary } from "./relativityGuidedTour";
import { createAtlasPlanetaryVisualFidelitySummary } from "./atlasPlanetaryVisualFidelity";
import { createAtlasCinematicLightingCompositionSummary } from "./atlasCinematicLightingComposition";
import { createAtlasChineseDeepSpaceFidelitySummary } from "./atlasChineseDeepSpaceFidelity";
import { createAtlasCinematicDeepSpaceCameraSummary } from "./atlasCinematicDeepSpaceCamera";
import { createAtlasUniverseSandboxReferenceBackdropSummary } from "./atlasUniverseSandboxReferenceBackdrop";
import { createAtlasReferenceGradeSpaceArtSummary } from "./atlasReferenceGradeSpaceArt";
import { createAtlasPlanetaryMaterialCompositionSummary } from "./atlasPlanetaryMaterialComposition";
import { createAtlasPlanetaryDepthLightingSummary } from "./atlasPlanetaryDepthLighting";
import { createAtlasPlanetaryColorGradingSummary } from "./atlasPlanetaryColorGrading";
import { createAtlasNumericalIntegritySummary } from "./atlasNumericalIntegrity";
import { createAtlasCinematicPlanetaryArtDirectionSummary } from "./atlasCinematicPlanetaryArtDirection";
import { createAtlasCinematicDeepSpaceBackdropSummary } from "./atlasCinematicDeepSpaceBackdrop";
import { createAtlasSparseDeepSpaceDirectorSummary } from "./atlasSparseDeepSpaceDirector";
import { createAtlasCloseupPresentationTruthSummary } from "./atlasCloseupPresentationTruth";
import type {
  AtlasMissionCapsule,
  AtlasMissionCapsuleRestoreSummary,
  AtlasMissionHubSummary,
  AtlasNavigatorSummary,
  AtlasObservatoryDeckSummary,
  AtlasObservatoryZoneId,
  AtlasReportStudioSummary,
  AtlasValidationConsoleSummary,
  AtlasWorkflowSummary,
  EvidenceLedgerSummary,
  RelativityGuidedTourSummary,
  RelativityObservableAtlasSummary,
  RelativityObservableExplainerSummary,
  AtlasPlanetaryVisualFidelitySummary,
  AtlasCinematicLightingCompositionSummary,
  AtlasChineseDeepSpaceFidelitySummary,
  AtlasCinematicDeepSpaceCameraSummary,
  AtlasUniverseSandboxReferenceBackdropSummary,
  AtlasReferenceGradeSpaceArtSummary,
  AtlasPlanetaryMaterialCompositionSummary,
  AtlasPlanetaryDepthLightingSummary,
  AtlasPlanetaryColorGradingSummary,
  AtlasNumericalIntegritySummary,
  AtlasCinematicPlanetaryArtDirectionSummary,
  AtlasCinematicDeepSpaceBackdropSummary,
  AtlasSparseDeepSpaceDirectorSummary,
  AtlasCloseupPresentationTruthSummary,
} from "./simulationDiagnosticsTypes";

const REQUIRED_ZONES: readonly AtlasObservatoryZoneId[] = [
  "current-target",
  "trust-matrix",
  "mission-path",
  "report-export",
];

describe("Atlas Observatory Deck v31", () => {
  it("creates a deterministic four-zone scientific control workbench", () => {
    const fixture = baseSummaries();
    const first = createDeckSummary(fixture);
    const second = createDeckSummary(fixture);

    expect(first.version).toBe(ATLAS_OBSERVATORY_DECK_VERSION);
    expect(first).toEqual(second);
    expect(first.zoneCount).toBe(4);
    expect(first.zones.map((zone) => zone.id)).toEqual(REQUIRED_ZONES);
    expect(first.readinessStatus).toBe(fixture.validationConsoleSummary.status);
    expect(first.reportTemplateId).toBe(fixture.reportStudioSummary.settings.templateId);

    for (const zone of first.zones) {
      expect(zone.title).toBeTruthy();
      expect(zone.source).toBeTruthy();
      expect(zone.model).toBeTruthy();
      expect(zone.primaryMetric).toBeTruthy();
      expect(zone.boundary).toBeTruthy();
      expect(zone.metrics.length).toBeGreaterThan(0);
      expect(zone.actions.length).toBeGreaterThan(0);
      for (const action of zone.actions) {
        expect(action.id).toBeTruthy();
        expect(action.label).toBeTruthy();
        expect(action.source).toBeTruthy();
        expect(action.model).toBeTruthy();
        expect(action.primaryMetric).toBeTruthy();
        expect(action.boundary).toBeTruthy();
      }
    }
  });

  it("reflects current target, trust matrix, mission step and report export context", () => {
    const fixture = baseSummaries({
      capsuleWarnings: [
        {
          code: "stale-id",
          field: "selected.evidenceClaimId",
          message: "Evidence claim id is stale.",
        },
      ],
    });
    const summary = createDeckSummary(fixture, {
      selectedBodyId: "mars",
      selectedCatalogObjectId: "nearby-star:sirius",
      selectedEvidenceClaimId: "frw-planck2018-lcdm",
      selectedWorkflowId: "relativity-lab",
      activeWorkflowStepId: "open-kerr-lab",
    });
    const target = summary.zones.find((zone) => zone.id === "current-target")!;
    const trust = summary.zones.find((zone) => zone.id === "trust-matrix")!;
    const mission = summary.zones.find((zone) => zone.id === "mission-path")!;
    const report = summary.zones.find((zone) => zone.id === "report-export")!;

    expect(summary.currentKind).toBe("workflow-step");
    expect(summary.currentId).toBe("workflow-step:relativity-lab:open-kerr-lab");
    expect(target.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "selected-body", value: "mars" }),
        expect.objectContaining({ id: "selected-catalog", value: "nearby-star:sirius" }),
        expect.objectContaining({ id: "selected-evidence", value: "frw-planck2018-lcdm" }),
        expect.objectContaining({ id: "kerr-ui", value: expect.stringContaining("capture-cone") }),
        expect.objectContaining({ id: "kerr-ui", value: expect.stringContaining("mode probe") }),
      ]),
    );
    expect(trust.primaryMetric).toContain(`blockers ${fixture.validationConsoleSummary.blockerCount}`);
    expect(trust.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "relativity-observables", value: "2/7 ready" }),
        expect.objectContaining({ id: "relativity-explainer", value: "7 cards; 28 steps" }),
        expect.objectContaining({ id: "relativity-tour", value: "7/7 ready" }),
        expect.objectContaining({
          id: "planetary-visual-fidelity",
          value: expect.stringContaining("selected-body-closeup-realism"),
        }),
        expect.objectContaining({
          id: "cinematic-lighting",
          value: expect.stringContaining("filmic-closeup-balanced"),
        }),
        expect.objectContaining({
          id: "chinese-deep-space-fidelity",
          value: expect.stringContaining("zh-CN"),
        }),
        expect.objectContaining({
          id: "cinematic-deep-space-camera",
          value: expect.stringContaining("stable-high-fidelity"),
        }),
        expect.objectContaining({
          id: "universe-sandbox-reference-backdrop",
          value: expect.stringContaining("sparse-stars-layered-milky-way"),
        }),
        expect.objectContaining({
          id: "reference-grade-space-art",
          value: expect.stringContaining("selected-body-subject-matte"),
        }),
        expect.objectContaining({
          id: "planetary-material-composition",
          value: expect.stringContaining("closeup-body-material-depth"),
        }),
        expect.objectContaining({
          id: "planetary-material-composition",
          value: expect.stringContaining("saturn-cassini-layered-ring"),
        }),
        expect.objectContaining({
          id: "planetary-depth-lighting",
          value: expect.stringContaining("saturn-ring-shadow-depth"),
        }),
        expect.objectContaining({
          id: "planetary-color-grading",
          value: expect.stringContaining("saturn-ring-occlusion-color-grade"),
        }),
        expect.objectContaining({
          id: "numerical-integrity",
          value: expect.stringContaining("informational"),
        }),
        expect.objectContaining({
          id: "cinematic-planetary-art-direction",
          value: expect.stringContaining("filmic-cool-space-warm-planet-protection"),
        }),
        expect.objectContaining({
          id: "cinematic-deep-space-backdrop",
          value: expect.stringContaining("orbit-atlas-v56"),
        }),
        expect.objectContaining({
          id: "sparse-deep-space-director",
          value: expect.stringContaining("orbit-atlas-v57"),
        }),
        expect.objectContaining({
          id: "closeup-presentation-truth",
          value: expect.stringContaining("selected-body-sidebar-preview"),
        }),
        expect.objectContaining({ id: "ready-count", value: String(fixture.validationConsoleSummary.readyCount) }),
        expect.objectContaining({ id: "claims", value: String(fixture.evidenceLedgerSummary.claimCount) }),
      ]),
    );
    expect(trust.actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "panel-action",
          navigatorItemId: "panel:relativity-observables",
        }),
        expect.objectContaining({
          kind: "panel-action",
          navigatorItemId: "panel:atlas-workflows",
        }),
      ]),
    );
    expect(mission.actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "workflow-step",
          workflowId: "relativity-lab",
          workflowStepId: "open-kerr-lab",
          navigatorItemId: "panel:kerr-relativity-lab",
        }),
      ]),
    );
    expect(report.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "template", value: "mission-dossier" }),
        expect.objectContaining({ id: "capsule-restore", value: expect.stringContaining("warnings 1") }),
      ]),
    );
  });

  it("keeps every action tied to an existing Navigator item or Workflow step", () => {
    const fixture = baseSummaries();
    const summary = createDeckSummary(fixture);
    const navigatorIds = new Set(fixture.navigatorSummary.items.map((item) => item.id));
    const workflowStepIds = new Set(
      fixture.workflowSummary.workflows.flatMap((workflow) =>
        workflow.steps.map((step) => `${workflow.id}:${step.id}`),
      ),
    );

    for (const action of summary.zones.flatMap((zone) => zone.actions)) {
      if (action.navigatorItemId) expect(navigatorIds.has(action.navigatorItemId)).toBe(true);
      if (action.workflowId && action.workflowStepId) {
        expect(workflowStepIds.has(`${action.workflowId}:${action.workflowStepId}`)).toBe(true);
      }
    }
  });

  it("handles empty or missing context without throwing", () => {
    const fixture = baseSummaries({ emptyMissionContext: true });

    expect(() => createDeckSummary(fixture)).not.toThrow();
    const summary = createDeckSummary(fixture);

    expect(summary.currentKind).toBe("");
    expect(summary.currentId).toBe("");
    expect(summary.zones).toHaveLength(4);
    expect(summary.zones.find((zone) => zone.id === "current-target")?.status).toBe("informational");
  });

  it.each(["observatory", "deck", "workbench", "control room", "dashboard"])(
    "lets Navigator search %s open the Observatory Deck panel",
    (query) => {
      const { evidenceLedgerSummary } = baseSummaries();
      const navigator = createAtlasNavigatorSummary({
        query,
        evidenceLedgerSummary,
        orbitAnalysisAvailable: true,
        maxResults: 8,
      });

      expect(navigator.results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: "panel:observatory-deck",
            panelId: "observatory-deck",
            action: "open-panel",
          }),
        ]),
      );
    },
  );

  it("adds the observatory-deck-workbench informational evidence passport", () => {
    const { evidenceLedgerSummary } = baseSummaries();

    expect(evidenceLedgerSummary.groups).toContain("observatory-deck-workbench");
    expect(evidenceLedgerSummary.claims).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "observatory-deck-workbench",
          status: "informational",
          passport: expect.objectContaining({
            metrics: expect.arrayContaining([
              expect.objectContaining({ id: "deck-version", value: "v31-observatory-deck" }),
            ]),
          }),
        }),
      ]),
    );
  });
});

function createDeckSummary(
  fixture: ReturnType<typeof baseSummaries>,
  selected: Partial<Parameters<typeof createAtlasObservatoryDeckSummary>[0]> = {},
): AtlasObservatoryDeckSummary {
  return createAtlasObservatoryDeckSummary({
    missionHubSummary: fixture.missionHubSummary,
    validationConsoleSummary: fixture.validationConsoleSummary,
    reportStudioSummary: fixture.reportStudioSummary,
    navigatorSummary: fixture.navigatorSummary,
    workflowSummary: fixture.workflowSummary,
    evidenceLedgerSummary: fixture.evidenceLedgerSummary,
    relativityObservableAtlasSummary: fixture.relativityObservableAtlasSummary,
    relativityObservableExplainerSummary: fixture.relativityObservableExplainerSummary,
    relativityGuidedTourSummary: fixture.relativityGuidedTourSummary,
    planetaryVisualFidelitySummary: fixture.planetaryVisualFidelitySummary,
    cinematicLightingSummary: fixture.cinematicLightingSummary,
    chineseDeepSpaceFidelitySummary: fixture.chineseDeepSpaceFidelitySummary,
    cinematicDeepSpaceCameraSummary: fixture.cinematicDeepSpaceCameraSummary,
    universeSandboxReferenceBackdropSummary: fixture.universeSandboxReferenceBackdropSummary,
    referenceGradeSpaceArtSummary: fixture.referenceGradeSpaceArtSummary,
    planetaryMaterialCompositionSummary: fixture.planetaryMaterialCompositionSummary,
    planetaryDepthLightingSummary: fixture.planetaryDepthLightingSummary,
    planetaryColorGradingSummary: fixture.planetaryColorGradingSummary,
    numericalIntegritySummary: fixture.numericalIntegritySummary,
    cinematicPlanetaryArtDirectionSummary: fixture.cinematicPlanetaryArtDirectionSummary,
    cinematicDeepSpaceBackdropSummary: fixture.cinematicDeepSpaceBackdropSummary,
    sparseDeepSpaceDirectorSummary: fixture.sparseDeepSpaceDirectorSummary,
    closeupPresentationTruthSummary: fixture.closeupPresentationTruthSummary,
    kerrLab: fixture.capsule.kerrLab,
    ...selected,
  });
}

function baseSummaries(options: {
  capsuleWarnings?: readonly AtlasMissionCapsuleRestoreSummary["warnings"][number][];
  emptyMissionContext?: boolean;
} = {}): {
  capsule: AtlasMissionCapsule;
  evidenceLedgerSummary: EvidenceLedgerSummary;
  navigatorSummary: AtlasNavigatorSummary;
  workflowSummary: AtlasWorkflowSummary;
  missionHubSummary: AtlasMissionHubSummary;
  reportStudioSummary: AtlasReportStudioSummary;
  validationConsoleSummary: AtlasValidationConsoleSummary;
  relativityObservableAtlasSummary: RelativityObservableAtlasSummary;
  relativityObservableExplainerSummary: RelativityObservableExplainerSummary;
  relativityGuidedTourSummary: RelativityGuidedTourSummary;
  planetaryVisualFidelitySummary: AtlasPlanetaryVisualFidelitySummary;
  cinematicLightingSummary: AtlasCinematicLightingCompositionSummary;
  chineseDeepSpaceFidelitySummary: AtlasChineseDeepSpaceFidelitySummary;
  cinematicDeepSpaceCameraSummary: AtlasCinematicDeepSpaceCameraSummary;
  universeSandboxReferenceBackdropSummary: AtlasUniverseSandboxReferenceBackdropSummary;
  referenceGradeSpaceArtSummary: AtlasReferenceGradeSpaceArtSummary;
  planetaryMaterialCompositionSummary: AtlasPlanetaryMaterialCompositionSummary;
  planetaryDepthLightingSummary: AtlasPlanetaryDepthLightingSummary;
  planetaryColorGradingSummary: AtlasPlanetaryColorGradingSummary;
  numericalIntegritySummary: AtlasNumericalIntegritySummary;
  cinematicPlanetaryArtDirectionSummary: AtlasCinematicPlanetaryArtDirectionSummary;
  cinematicDeepSpaceBackdropSummary: AtlasCinematicDeepSpaceBackdropSummary;
  sparseDeepSpaceDirectorSummary: AtlasSparseDeepSpaceDirectorSummary;
  closeupPresentationTruthSummary: AtlasCloseupPresentationTruthSummary;
} {
  const evidenceLedgerSummary = createEvidenceLedgerSummary({
    diagnostics: null,
    orbitAtlasProfile: "orbit-atlas-v12",
    orbitAtlasRenderer: "cold-body-web-v12",
    gaiaCatalogSource: "gaia-dr3",
    orbitAtlasReady: true,
    presentationMode: "orbit-atlas",
  });
  const navigatorSummary = createAtlasNavigatorSummary({
    evidenceLedgerSummary,
    orbitAnalysisAvailable: true,
    maxResults: 2000,
  });
  const workflowSummary = createAtlasWorkflowSummary({ navigatorSummary });
  const relativityObservableAtlasSummary = createRelativityObservableAtlasSummary({
    diagnostics: null,
  });
  const relativityObservableExplainerSummary = createRelativityObservableExplainerSummary({
    observableAtlasSummary: relativityObservableAtlasSummary,
  });
  const relativityGuidedTourSummary = createRelativityGuidedTourSummary({
    observableAtlasSummary: relativityObservableAtlasSummary,
    explainerSummary: relativityObservableExplainerSummary,
  });
  const planetaryVisualFidelitySummary = createAtlasPlanetaryVisualFidelitySummary();
  const cinematicLightingSummary = createAtlasCinematicLightingCompositionSummary();
  const chineseDeepSpaceFidelitySummary = createAtlasChineseDeepSpaceFidelitySummary();
  const cinematicDeepSpaceCameraSummary = createAtlasCinematicDeepSpaceCameraSummary();
  const universeSandboxReferenceBackdropSummary = createAtlasUniverseSandboxReferenceBackdropSummary();
  const referenceGradeSpaceArtSummary = createAtlasReferenceGradeSpaceArtSummary();
  const planetaryMaterialCompositionSummary = createAtlasPlanetaryMaterialCompositionSummary();
  const planetaryDepthLightingSummary = createAtlasPlanetaryDepthLightingSummary();
  const planetaryColorGradingSummary = createAtlasPlanetaryColorGradingSummary();
  const numericalIntegritySummary = createAtlasNumericalIntegritySummary(null);
  const cinematicPlanetaryArtDirectionSummary = createAtlasCinematicPlanetaryArtDirectionSummary();
  const cinematicDeepSpaceBackdropSummary = createAtlasCinematicDeepSpaceBackdropSummary();
  const sparseDeepSpaceDirectorSummary = createAtlasSparseDeepSpaceDirectorSummary();
  const closeupPresentationTruthSummary = createAtlasCloseupPresentationTruthSummary();
  const selectedWorkflowId = options.emptyMissionContext ? "" : "relativity-lab";
  const activeWorkflowStepId = options.emptyMissionContext ? "" : "open-kerr-lab";
  const capsule = createAtlasMissionCapsule({
    presentationMode: "orbit-atlas",
    scaleMode: "compressed",
    renderBudget: "balanced",
    viewSettings: {
      showConstellationLines: true,
      showDeepSkyObjects: true,
      showCatalogLabels: false,
      showKerrBlackHole: true,
    },
    selectedBodyId: options.emptyMissionContext ? "" : "mars",
    selectedCatalogObjectId: options.emptyMissionContext ? "" : "nearby-star:sirius",
    selectedEvidenceClaimId: options.emptyMissionContext ? "" : "frw-planck2018-lcdm",
    selectedWorkflowId,
    activeWorkflowStepId,
    missionHubStoredState: {
      recentActions: [
        { id: "panel:kerr-relativity-lab", kind: "panel-action", timestamp: 20 },
      ],
      pinnedItems: [
        { id: "evidence-claim:frw-planck2018-lcdm", kind: "evidence-claim", timestamp: 31 },
      ],
    },
    kerrLab: {
      showKerrBlackHole: true,
      spinA: 0.73,
      impactParameterM: 4.2,
      orbitPresetId: "capture-cone",
      renderMode: "both",
      studioMode: "probe",
    },
    createdAt: "2026-06-25T12:00:00.000Z",
  });
  const restoreSummary = restoreAtlasMissionCapsule({
    capsule,
    warnings: options.capsuleWarnings,
    source: options.capsuleWarnings?.length ? "json-import" : "copy-link",
    navigatorSummary,
    workflowSummary,
  });
  const missionHubSummary = createAtlasMissionHubSummary({
    navigatorSummary,
    workflowSummary,
    storedState: options.emptyMissionContext
      ? { recentActions: [], pinnedItems: [] }
      : capsule.missionHub,
    capsuleRestoreSummary: restoreSummary,
    selectedBodyId: options.emptyMissionContext ? "" : "mars",
    selectedCatalogObjectId: options.emptyMissionContext ? "" : "nearby-star:sirius",
    selectedEvidenceClaimId: options.emptyMissionContext ? "" : "frw-planck2018-lcdm",
    selectedWorkflowId,
    activeWorkflowStepId,
  });
  const reportSummary = createAtlasScientificReportSummary({
    missionCapsule: capsule,
    missionHubSummary,
    evidenceLedgerSummary,
    selectedObjectPassport: null,
    workflowSummary,
    selectedBodyId: options.emptyMissionContext ? "" : "mars",
    selectedEvidenceClaimId: options.emptyMissionContext ? "" : "frw-planck2018-lcdm",
    selectedWorkflowId,
    activeWorkflowStepId,
    kerrLab: capsule.kerrLab,
    relativityObservableAtlasSummary,
    relativityObservableExplainerSummary,
    relativityGuidedTourSummary,
    planetaryVisualFidelitySummary,
    cinematicLightingSummary,
    chineseDeepSpaceFidelitySummary,
    cinematicDeepSpaceCameraSummary,
    universeSandboxReferenceBackdropSummary,
    referenceGradeSpaceArtSummary,
    planetaryMaterialCompositionSummary,
    planetaryDepthLightingSummary,
    planetaryColorGradingSummary,
    numericalIntegritySummary,
    cinematicPlanetaryArtDirectionSummary,
    cinematicDeepSpaceBackdropSummary,
    sparseDeepSpaceDirectorSummary,
    closeupPresentationTruthSummary,
    createdAt: "2026-06-25T12:30:00.000Z",
  });
  const reportStudioSummary = createAtlasReportStudioSummary({
    reportSummary,
    settings: {
      templateId: "mission-dossier",
      exportFormat: "html",
    },
  });
  const validationConsoleSummary = createAtlasValidationConsoleSummary({
    evidenceLedgerSummary,
    missionHubSummary,
    reportStudioSummary,
    navigatorSummary,
    workflowSummary,
    selectedBodyId: options.emptyMissionContext ? "" : "mars",
    selectedCatalogObjectId: options.emptyMissionContext ? "" : "nearby-star:sirius",
    selectedEvidenceClaimId: options.emptyMissionContext ? "" : "frw-planck2018-lcdm",
    selectedWorkflowId,
    activeWorkflowStepId,
  });

  return {
    capsule,
    evidenceLedgerSummary,
    navigatorSummary,
    workflowSummary,
    missionHubSummary,
    reportStudioSummary,
    validationConsoleSummary,
    relativityObservableAtlasSummary,
    relativityObservableExplainerSummary,
    relativityGuidedTourSummary,
    planetaryVisualFidelitySummary,
    cinematicLightingSummary,
    chineseDeepSpaceFidelitySummary,
    cinematicDeepSpaceCameraSummary,
    universeSandboxReferenceBackdropSummary,
    referenceGradeSpaceArtSummary,
    planetaryMaterialCompositionSummary,
    planetaryDepthLightingSummary,
    planetaryColorGradingSummary,
    numericalIntegritySummary,
    cinematicPlanetaryArtDirectionSummary,
    cinematicDeepSpaceBackdropSummary,
    sparseDeepSpaceDirectorSummary,
    closeupPresentationTruthSummary,
  };
}
