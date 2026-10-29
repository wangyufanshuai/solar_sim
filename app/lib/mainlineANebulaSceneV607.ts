import {
  type MainlineANebulaVisualAssetV607All as MainlineANebulaVisualAssetV607,
} from "../data/mainlineANebulaVisualAssetsV607.all.generated";
import { getMainlineANebulaVisualAssetV607 as getMainlineANebulaVisualAssetV607FirstSet } from "../data/mainlineANebulaVisualAssetsV607.generated";
import { getMainlineANebulaVisualAssetV607All } from "../data/mainlineANebulaVisualAssetsV607.all.generated";
import { celestialDisplayNameZh, celestialEntryToDirection, selectCelestialCatalogEntry } from "./celestialCatalog";
import { MAINLINE_A_WEB_NEBULA_PREVIEWS_V648, mainlineAWebNebulaPreviewV648 } from "./mainlineAWebNebulaPreviewV648";
import { SKY_TARGET_DISTANCE_SCENE, skyTargetPosition } from "./skyTargetFocus";

export const MAINLINE_A_NEBULA_SCENE_OWNER_V607 = "mainline-a-nebula-scene-v607";
export const MAINLINE_A_NEBULA_MAX_EDGE_V607 = 2048;
export const MAINLINE_A_NEBULA_MAX_FILE_BYTES_V607 = 8 * 1024 * 1024;
export const MAINLINE_A_NEBULA_MAX_SCENE_EDGE_V607 = 680;

export type MainlineANebulaSceneGateV607 = Readonly<{
  enabled: boolean;
  research: boolean;
  closeupSuppressed: boolean;
  launchActive: boolean;
  kerrActive: boolean;
  sceneMode: string;
}>;

export function mainlineANebulaSceneEnabledV607(gate: MainlineANebulaSceneGateV607): boolean {
  return gate.enabled && !gate.research && !gate.closeupSuppressed && !gate.launchActive && !gate.kerrActive
    && (gate.sceneMode === "atlas" || gate.sceneMode === "inspect");
}

export function isMainlineANebulaSceneAssetV607(asset: MainlineANebulaVisualAssetV607): boolean {
  const preview = mainlineAWebNebulaPreviewV648(asset.objectId);
  return MAINLINE_A_WEB_NEBULA_PREVIEWS_V648.valid && preview?.available === true
    && preview.displayAdmission === "candidate-preview"
    && preview.humanRightsSignoff === "pending"
    && preview.releaseAdmission === "candidate-only"
    && preview.scientificPayloadWriteback === false
    && preview.imageId === asset.imageId
    && preview.localPath === asset.src
    && preview.localSha256 === asset.sha256
    && preview.sourcePage === asset.sourcePage
    && preview.sourceLicenseLabel === asset.license
    && preview.sourceCredit === asset.credit
    && asset.credit.trim().length > 0
    && /^\/textures\/mainline-a\/[a-z0-9-]+\.jpg$/.test(asset.src)
    && /^[a-f0-9]{64}$/.test(asset.sha256)
    && Number.isInteger(asset.byteSize) && asset.byteSize > 0 && asset.byteSize <= MAINLINE_A_NEBULA_MAX_FILE_BYTES_V607
    && [asset.dimensions.width, asset.dimensions.height].every((edge) => Number.isInteger(edge)
      && edge > 0 && edge <= MAINLINE_A_NEBULA_MAX_EDGE_V607);
}

export function resolveMainlineANebulaSceneTargetV607(selectedCatalogId: string) {
  const entry = selectCelestialCatalogEntry(selectedCatalogId);
  if (!entry || entry.kind !== "nebula") return null;
  const objectId = entry.id.replace(/^nebula:/, "");
  // Preserve object identity for the established first six while allowing the
  // all-assets registry to admit the six extension records.
  const asset = getMainlineANebulaVisualAssetV607FirstSet(objectId) ?? getMainlineANebulaVisualAssetV607All(objectId);
  if (!asset || !isMainlineANebulaSceneAssetV607(asset)) return null;
  const direction = celestialEntryToDirection(entry);
  const position = direction ? skyTargetPosition(direction, SKY_TARGET_DISTANCE_SCENE) : null;
  return position ? { asset, position, title: celestialDisplayNameZh(entry), catalogId: entry.id } : null;
}

/** The plane is an inspection illustration; its size never represents catalog angular extent. */
export function mainlineANebulaSceneSizeV607(
  dimensions: Readonly<{ width: number; height: number }>,
  viewport: Readonly<{ width: number; height: number }>,
): Readonly<{ width: number; height: number }> {
  if (![dimensions.width, dimensions.height, viewport.width, viewport.height].every((value) => Number.isFinite(value) && value > 0)) {
    return { width: 0, height: 0 };
  }
  const scale = Math.min(
    MAINLINE_A_NEBULA_MAX_SCENE_EDGE_V607 / Math.max(dimensions.width, dimensions.height),
    viewport.width * 0.62 / dimensions.width,
    viewport.height * 0.42 / dimensions.height,
  );
  return { width: dimensions.width * scale, height: dimensions.height * scale };
}
