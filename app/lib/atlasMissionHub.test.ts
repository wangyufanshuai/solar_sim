import { describe, expect, it } from "vitest";
import { createAtlasNavigatorSummary } from "./atlasNavigator";
import {
  ATLAS_MISSION_HUB_VERSION,
  createAtlasMissionHubSummary,
  navigatorItemToMissionHubStoredItem,
  parseAtlasMissionHubStoredState,
  recordAtlasMissionHubRecent,
  serializeAtlasMissionHubStoredState,
  toggleAtlasMissionHubPinned,
  workflowStepToMissionHubStoredItem,
} from "./atlasMissionHub";
import { createAtlasWorkflowSummary } from "./atlasWorkflows";
import { createEvidenceLedgerSummary } from "./evidenceLedger";
import type {
  AtlasMissionHubStoredState,
  AtlasNavigatorSummary,
  AtlasWorkflowSummary,
  EvidenceLedgerSummary,
} from "./simulationDiagnosticsTypes";

describe("Atlas Mission Hub v26", () => {
  it("creates a non-crashing empty summary with deterministic recommendations", () => {
    const summary = createSummary();

    expect(summary.version).toBe(ATLAS_MISSION_HUB_VERSION);
    expect(summary.current.currentKind).toBe("");
    expect(summary.recentCount).toBe(0);
    expect(summary.pinnedCount).toBe(0);
    expect(summary.recommendedItems.map((item) => item.id)).toEqual(
      expect.arrayContaining([
        "panel:atlas-workflows",
        "panel:evidence-ledger",
        "panel:kerr-relativity-lab",
      ]),
    );
    for (const item of summary.recommendedItems) expectExecutableContract(item);
  });

  it("deduplicates recents and keeps newest first with a bounded count", () => {
    const { navigatorSummary, workflowSummary } = baseSummaries();
    const mars = navigatorSummary.items.find((item) => item.id === "solar-body:mars")!;
    const frw = navigatorSummary.items.find((item) => item.id === "evidence-claim:frw-planck2018-lcdm")!;
    let state: AtlasMissionHubStoredState = { recentActions: [], pinnedItems: [] };

    state = recordAtlasMissionHubRecent(state, navigatorItemToMissionHubStoredItem(mars, 10), 10);
    state = recordAtlasMissionHubRecent(state, navigatorItemToMissionHubStoredItem(frw, 20), 20);
    state = recordAtlasMissionHubRecent(state, navigatorItemToMissionHubStoredItem(mars, 30), 30);
    for (let index = 0; index < 20; index += 1) {
      state = recordAtlasMissionHubRecent(
        state,
        { id: `panel:test-${index}`, kind: "panel-action" },
        100 + index,
      );
    }

    const summary = createAtlasMissionHubSummary({
      navigatorSummary,
      workflowSummary,
      storedState: state,
    });

    expect(summary.recentCount).toBe(12);
    expect(summary.recentItems[0]?.timestamp).toBeGreaterThan(summary.recentItems[1]?.timestamp ?? 0);
    expect(summary.recentItems.filter((item) => item.id === "solar-body:mars")).toHaveLength(0);
    expect(summary.recentItems.some((item) => item.stale)).toBe(true);
  });

  it("keeps pinned ids stable and renders stale pinned items readably", () => {
    const { navigatorSummary, workflowSummary } = baseSummaries();
    let state: AtlasMissionHubStoredState = { recentActions: [], pinnedItems: [] };
    state = toggleAtlasMissionHubPinned(
      state,
      { id: "celestial-object:nearby-star:sirius", kind: "celestial-object" },
      40,
    );
    state = toggleAtlasMissionHubPinned(
      state,
      { id: "evidence-claim:missing-future-claim", kind: "evidence-claim" },
      41,
    );

    const summary = createAtlasMissionHubSummary({
      navigatorSummary,
      workflowSummary,
      storedState: state,
    });

    expect(summary.pinnedCount).toBe(2);
    expect(summary.pinnedItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "celestial-object:nearby-star:sirius",
          pinned: true,
          stale: false,
        }),
        expect.objectContaining({
          id: "evidence-claim:missing-future-claim",
          title: "Unavailable local item",
          stale: true,
        }),
      ]),
    );
  });

  it("reflects selected body, catalog, evidence and workflow step context", () => {
    expect(createSummary({ selectedBodyId: "mars" }).current).toEqual(
      expect.objectContaining({ currentKind: "solar-body", currentId: "solar-body:mars" }),
    );
    expect(createSummary({ selectedCatalogObjectId: "galaxy:m31" }).current).toEqual(
      expect.objectContaining({ currentKind: "celestial-object", currentId: "celestial-object:galaxy:m31" }),
    );
    expect(createSummary({ selectedEvidenceClaimId: "frw-planck2018-lcdm" }).current).toEqual(
      expect.objectContaining({
        currentKind: "evidence-claim",
        currentId: "evidence-claim:frw-planck2018-lcdm",
      }),
    );
    expect(
      createSummary({
        selectedWorkflowId: "deep-sky-provenance",
        activeWorkflowStepId: "focus-andromeda",
      }).current,
    ).toEqual(
      expect.objectContaining({
        currentKind: "workflow-step",
        currentId: "workflow-step:deep-sky-provenance:focus-andromeda",
      }),
    );
  });

  it("serializes and parses local storage state safely", () => {
    expect(parseAtlasMissionHubStoredState("{bad json")).toEqual({
      recentActions: [],
      pinnedItems: [],
    });
    const state = parseAtlasMissionHubStoredState(
      JSON.stringify({
        recentActions: [
          { id: "panel:mission-hub", kind: "panel-action", timestamp: 2 },
          { id: "", kind: "panel-action", timestamp: 3 },
        ],
        pinnedItems: [{ id: "workflow-step:relativity-lab:open-kerr-lab", kind: "workflow-step", timestamp: 1 }],
      }),
    );

    expect(state.recentActions).toHaveLength(1);
    expect(state.pinnedItems).toHaveLength(1);
    expect(JSON.parse(serializeAtlasMissionHubStoredState(state))).toEqual(state);
  });

  it("records workflow steps and recommends existing next actions", () => {
    const { navigatorSummary, workflowSummary } = baseSummaries();
    const state = recordAtlasMissionHubRecent(
      { recentActions: [], pinnedItems: [] },
      workflowStepToMissionHubStoredItem("deep-sky-provenance", "focus-andromeda", 50),
      50,
    );
    const summary = createAtlasMissionHubSummary({
      navigatorSummary,
      workflowSummary,
      storedState: state,
      selectedWorkflowId: "deep-sky-provenance",
      activeWorkflowStepId: "focus-andromeda",
    });

    expect(summary.recentItems[0]).toEqual(
      expect.objectContaining({
        id: "workflow-step:deep-sky-provenance:focus-andromeda",
        navigatorItemId: "celestial-object:galaxy:m31",
      }),
    );
    expect(summary.recommendedItems.every((item) => item.stale === false)).toBe(true);
    expect(summary.recommendedItems.some((item) => item.navigatorItemId)).toBe(true);
  });
});

function createSummary(args: Partial<Parameters<typeof createAtlasMissionHubSummary>[0]> = {}) {
  const { navigatorSummary, workflowSummary } = baseSummaries();
  return createAtlasMissionHubSummary({
    navigatorSummary,
    workflowSummary,
    ...args,
  });
}

function baseSummaries(): {
  navigatorSummary: AtlasNavigatorSummary;
  workflowSummary: AtlasWorkflowSummary;
} {
  const navigatorSummary = createAtlasNavigatorSummary({
    evidenceLedgerSummary: evidenceSummary(),
    orbitAnalysisAvailable: true,
    maxResults: 2000,
  });
  return {
    navigatorSummary,
    workflowSummary: createAtlasWorkflowSummary({ navigatorSummary }),
  };
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

function expectExecutableContract(item: {
  id: string;
  title: string;
  source: string;
  model: string;
  primaryMetric: string;
  boundary: string;
}) {
  expect(item.id).toBeTruthy();
  expect(item.title).toBeTruthy();
  expect(item.source).toBeTruthy();
  expect(item.model).toBeTruthy();
  expect(item.primaryMetric).toBeTruthy();
  expect(item.boundary).toBeTruthy();
}
