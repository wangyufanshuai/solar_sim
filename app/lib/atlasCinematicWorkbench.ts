import type {
  AtlasCinematicWorkbenchSummary,
  AtlasCinematicWorkbenchVersion,
} from "./simulationDiagnosticsTypes";

export const ATLAS_CINEMATIC_WORKBENCH_VERSION: AtlasCinematicWorkbenchVersion =
  "v42-cinematic-science-workbench";

export const ATLAS_CINEMATIC_WORKBENCH_BOUNDARY =
  "Local visual presentation metadata only; it preserves the v41 AA workbench boundary and does not claim runtime certification, scientific certification, WCAG certification, online validation, or physics mutation.";

export function createAtlasCinematicWorkbenchSummary(): AtlasCinematicWorkbenchSummary {
  return {
    version: ATLAS_CINEMATIC_WORKBENCH_VERSION,
    status: "informational",
    visualTarget: "scientific-instrument-cinematic",
    qualityTarget: "aaa-inspired-local-art-direction",
    aaBoundaryPreserved: "v41-aa-boundary-preserved",
    scope: "presentation-rendering-and-workbench-skin",
    scenePolicy: "existing-assets-only",
    physicsMutation: "not-applied",
    runtimeCertificationStatus: "not-claimed-in-app",
    trustedBoundary: ATLAS_CINEMATIC_WORKBENCH_BOUNDARY,
  };
}
