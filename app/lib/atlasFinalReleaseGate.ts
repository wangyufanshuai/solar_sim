import { CATALOG_V5_TARGET } from "./catalogV5";
import { createScientificPromotionEvidenceV3 } from "./atlasReleaseProgram";

export const ATLAS_FINAL_RELEASE_GATE_VERSION = "v140-public-1.0-release-gate" as const;

export type AtlasFinalReleaseGateInput = {
  catalogRows: number;
  coreInstalledBytes: number;
  consoleErrors: number;
  rendererFaults: number;
  resourceLeaks: number;
  desktopOverviewMedianFps: number;
  desktopSceneMedianFps: number;
  idleWorkingSetMb: number;
  peakWorkingSetMb: number;
  science?: Parameters<typeof createScientificPromotionEvidenceV3>[0];
};

export function createAtlasFinalReleaseGate(input: AtlasFinalReleaseGateInput) {
  const blockers: string[] = [];
  if (input.catalogRows < CATALOG_V5_TARGET) blockers.push("catalog-below-one-million");
  if (input.coreInstalledBytes > 300 * 1024 * 1024) blockers.push("core-pack-over-300-mib");
  if (input.consoleErrors > 0) blockers.push("console-errors");
  if (input.rendererFaults > 0) blockers.push("renderer-faults");
  if (input.resourceLeaks > 0) blockers.push("resource-lifecycle-leaks");
  if (input.desktopOverviewMedianFps < 55) blockers.push("overview-performance-gate");
  if (input.desktopSceneMedianFps < 45) blockers.push("scene-performance-gate");
  if (input.idleWorkingSetMb > 1_200) blockers.push("idle-memory-gate");
  if (input.peakWorkingSetMb > 3_000) blockers.push("peak-memory-gate");
  const science = createScientificPromotionEvidenceV3(input.science);
  return { version: ATLAS_FINAL_RELEASE_GATE_VERSION, ready: blockers.length === 0, blockers, science, releaseChannel: blockers.length === 0 ? "public-1.0" as const : "development" as const };
}

