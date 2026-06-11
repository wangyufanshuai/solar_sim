import { SPACECRAFT_GALLERY_LIGHTING_PROFILE } from "./closeupRenderProfile";
import type { SpacecraftResourcePackItem } from "./resourcePackTypes";

export type GalleryCoverMetadata = {
  kind: "solar-sim-gallery-cover";
  version: 3;
  spacecraftId: string;
  title: string;
  scaleLabel: string;
  sourceCredit: string;
  category: SpacecraftResourcePackItem["category"];
  renderProfile: typeof SPACECRAFT_GALLERY_LIGHTING_PROFILE.coverShotProfile;
  capturedAt: string;
};

export function createGalleryCoverMetadata(item: SpacecraftResourcePackItem, capturedAt = new Date().toISOString()): GalleryCoverMetadata {
  return {
    kind: "solar-sim-gallery-cover",
    version: 3,
    spacecraftId: item.id,
    title: item.title,
    scaleLabel: item.scaleLabel,
    sourceCredit: item.sourceCreditShort,
    category: item.category,
    renderProfile: SPACECRAFT_GALLERY_LIGHTING_PROFILE.coverShotProfile,
    capturedAt,
  };
}
