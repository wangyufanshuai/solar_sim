import { MeshBasicMaterial, NormalBlending } from "three";

export const MAINLINE_A_NEBULA_IMAGE_RENDER_ORDER_V638 = 30;

/**
 * JPEG observation rectangles must draw after the transparent background star
 * catalog. Raising renderOrder on an opaque material cannot cross Three's
 * opaque/transparent queue boundary. Normal alpha=1 preserves the source pixel;
 * the existing scale transition may still blend while its opacity is below 1.
 */
export function createMainlineANebulaImageMaterialV638(): MeshBasicMaterial {
  return new MeshBasicMaterial({
    transparent: true,
    opacity: 1,
    blending: NormalBlending,
    toneMapped: false,
    depthWrite: false,
    depthTest: false,
  });
}
