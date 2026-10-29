import type {
  AtlasWorkbenchAccessibilitySummary,
  AtlasWorkbenchAccessibilitySurfaceId,
  AtlasWorkbenchAccessibilityVersion,
} from "./simulationDiagnosticsTypes";

export const ATLAS_WORKBENCH_ACCESSIBILITY_VERSION: AtlasWorkbenchAccessibilityVersion =
  "v41-atlas-workbench-accessibility";

export const ATLAS_WORKBENCH_ACCESSIBILITY_BOUNDARY =
  "Local Atlas workbench accessibility metadata only; it does not report runtime scan results, CI status, or external conformance certification.";

export const ATLAS_WORKBENCH_ACCESSIBILITY_SURFACES: readonly AtlasWorkbenchAccessibilitySurfaceId[] = [
  "navigator",
  "atlas-workflows",
  "relativity-observables",
  "kerr-relativity-studio",
  "evidence-ledger",
  "validation-console",
  "report-studio",
  "mission-hub",
  "observatory-deck",
];

export function createAtlasWorkbenchAccessibilitySummary(): AtlasWorkbenchAccessibilitySummary {
  return {
    version: ATLAS_WORKBENCH_ACCESSIBILITY_VERSION,
    status: "informational",
    scope: "atlas-workbench-and-entry-controls",
    standardTarget: "wcag-2.2-aa-target",
    surfaceCount: ATLAS_WORKBENCH_ACCESSIBILITY_SURFACES.length,
    surfaces: ATLAS_WORKBENCH_ACCESSIBILITY_SURFACES,
    minimumTargetSizePx: 24,
    focusPolicy: "navigator-modal-focus-trap;workbench-nonmodal-focus-entry",
    motionPolicy: "prefers-reduced-motion",
    runtimeAuditStatus: "not-claimed-in-app",
    trustedBoundary: ATLAS_WORKBENCH_ACCESSIBILITY_BOUNDARY,
  };
}
