import { describe, expect, it } from "vitest";

import {
  EVIDENCE_LEDGER_SOURCE_FILES,
  RELATIVITY_OBSERVABLE_ATLAS_PANEL_SOURCE_FILES,
  SIMULATION_DIAGNOSTICS_TYPES_SOURCE_FILES,
  readProjectSourceBundle,
} from "./sourceBundles";

describe("v250 source bundle compatibility reader", () => {
  it("keeps the diagnostics facade and seven domain modules in canonical order", () => {
    expect(SIMULATION_DIAGNOSTICS_TYPES_SOURCE_FILES).toEqual([
      "app/lib/simulationDiagnosticsTypes.ts",
      "app/lib/simulationDiagnosticsTypes/visual.ts",
      "app/lib/simulationDiagnosticsTypes/workbench.ts",
      "app/lib/simulationDiagnosticsTypes/catalog.ts",
      "app/lib/simulationDiagnosticsTypes/relativity.ts",
      "app/lib/simulationDiagnosticsTypes/evidence.ts",
      "app/lib/simulationDiagnosticsTypes/release.ts",
      "app/lib/simulationDiagnosticsTypes/physics.ts",
    ]);

    const source = readProjectSourceBundle("app/lib/simulationDiagnosticsTypes.ts");
    expect(source).toContain('export type * from "./simulationDiagnosticsTypes/physics"');
    expect(source).toContain("export type SimulationDiagnostics =");
    expect(source).toContain("export type AtlasNavigatorPanelId =");
  });

  it("keeps the ledger facade and claim factories visible as one audit surface", () => {
    expect(EVIDENCE_LEDGER_SOURCE_FILES).toEqual([
      "app/lib/evidenceLedger.ts",
      "app/lib/evidenceLedger/core.ts",
      "app/lib/evidenceLedger/shared.ts",
      "app/lib/evidenceLedger/productClaims.ts",
      "app/lib/evidenceLedger/workbenchClaims.ts",
      "app/lib/evidenceLedger/visualClaims.ts",
      "app/lib/evidenceLedger/catalogClaims.ts",
      "app/lib/evidenceLedger/weakFieldClaims.ts",
      "app/lib/evidenceLedger/kerrClaims.ts",
    ]);

    const source = readProjectSourceBundle("app/lib/evidenceLedger.ts");
    expect(source).toContain("export { EVIDENCE_LEDGER_VERSION, createEvidenceLedgerSummary, selectEvidenceClaim }");
    expect(source).toContain("export function createEvidenceLedgerSummary(");
    expect(source).toContain("export function selectEvidenceClaim(");
    expect(source).toContain("export function kerrStrongFieldClaim(");
  });

  it("keeps the v252 Relativity Observable sections visible as one audit surface", () => {
    expect(RELATIVITY_OBSERVABLE_ATLAS_PANEL_SOURCE_FILES).toEqual([
      "app/components/RelativityObservableAtlasPanel.tsx",
      "app/components/RelativityObservableOverviewSection.tsx",
      "app/components/RelativityObservableBoundarySection.tsx",
      "app/components/RelativityObservableBoundaryStatusSection.tsx",
      "app/components/RelativityObservableProductBoundaryTables.tsx",
      "app/components/RelativityObservableScienceBoundaryTables.tsx",
      "app/components/RelativityObservableChartSection.tsx",
      "app/components/RelativityObservableReadoutSection.tsx",
      "app/components/RelativityResearchWorkspaceSection.tsx",
    ]);

    const source = readProjectSourceBundle("app/components/RelativityObservableAtlasPanel.tsx");
    expect(source).toContain("data-relativity-observable-panel-version");
    expect(source).toContain("data-atlas-physics-benchmark-gate-strip");
    expect(source).toContain("RelativityWeakFieldChartSection");
    expect(source).toContain("RelativityKerrChartSection");
    expect(source).toContain('lazy(() => import("./RelativityResearchWorkspaceV9"))');
  });
});
