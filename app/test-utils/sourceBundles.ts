import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export const SIMULATION_DIAGNOSTICS_TYPES_SOURCE_FILES = [
  "app/lib/simulationDiagnosticsTypes.ts",
  "app/lib/simulationDiagnosticsTypes/visual.ts",
  "app/lib/simulationDiagnosticsTypes/workbench.ts",
  "app/lib/simulationDiagnosticsTypes/catalog.ts",
  "app/lib/simulationDiagnosticsTypes/relativity.ts",
  "app/lib/simulationDiagnosticsTypes/evidence.ts",
  "app/lib/simulationDiagnosticsTypes/release.ts",
  "app/lib/simulationDiagnosticsTypes/physics.ts",
] as const;

export const EVIDENCE_LEDGER_SOURCE_FILES = [
  "app/lib/evidenceLedger.ts",
  "app/lib/evidenceLedger/core.ts",
  "app/lib/evidenceLedger/shared.ts",
  "app/lib/evidenceLedger/productClaims.ts",
  "app/lib/evidenceLedger/workbenchClaims.ts",
  "app/lib/evidenceLedger/visualClaims.ts",
  "app/lib/evidenceLedger/catalogClaims.ts",
  "app/lib/evidenceLedger/weakFieldClaims.ts",
  "app/lib/evidenceLedger/kerrClaims.ts",
] as const;

export const RELATIVITY_OBSERVABLE_ATLAS_PANEL_SOURCE_FILES = [
  "app/components/RelativityObservableAtlasPanel.tsx",
  "app/components/RelativityObservableOverviewSection.tsx",
  "app/components/RelativityObservableBoundarySection.tsx",
  "app/components/RelativityObservableBoundaryStatusSection.tsx",
  "app/components/RelativityObservableProductBoundaryTables.tsx",
  "app/components/RelativityObservableScienceBoundaryTables.tsx",
  "app/components/RelativityObservableChartSection.tsx",
  "app/components/RelativityObservableReadoutSection.tsx",
  "app/components/RelativityResearchWorkspaceSection.tsx",
] as const;

function readFiles(files: readonly string[]): string {
  return files.map((file) => readFileSync(resolve(process.cwd(), file), "utf8")).join("\n");
}

export function readProjectSourceBundle(file: string): string {
  if (file === "app/lib/evidenceLedger.ts") return readFiles(EVIDENCE_LEDGER_SOURCE_FILES);
  if (file === "app/lib/simulationDiagnosticsTypes.ts") return readFiles(SIMULATION_DIAGNOSTICS_TYPES_SOURCE_FILES);
  if (file === "app/components/RelativityObservableAtlasPanel.tsx") {
    return readFiles(RELATIVITY_OBSERVABLE_ATLAS_PANEL_SOURCE_FILES);
  }
  return readFileSync(resolve(process.cwd(), file), "utf8");
}
