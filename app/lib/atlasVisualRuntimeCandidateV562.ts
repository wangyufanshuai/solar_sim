import type { OrbitAtlasSkyLayerManifest } from "./orbitAtlasPresentation";

export const ATLAS_VISUAL_RUNTIME_CANDIDATE_VERSION_V562 =
  "v562-active-visual-runtime-candidate" as const;

// The frozen ORBIT_ATLAS_V9_SKY identity remains untouched. The active v562
// candidate intentionally uses only source assets admitted by its own manifest.
// Its star layer also supplies the neutral base so a missing historical V9 base
// cannot trigger a request or silently acquire a replacement identity.
export const ATLAS_VISUAL_RUNTIME_SKY_V562 = Object.freeze({
  desktopBase: "/textures/sky/orbit-atlas-v9-stars-4k.jpg",
  mobileBase: "/textures/sky/orbit-atlas-v9-stars-2k.jpg",
  desktopStars: "/textures/sky/orbit-atlas-v9-stars-4k.jpg",
  mobileStars: "/textures/sky/orbit-atlas-v9-stars-2k.jpg",
  dustMask: "/textures/sky/orbit-atlas-v9-dust-2k.jpg",
  rotation: [-0.34, 4.24, -0.86] as const,
}) satisfies OrbitAtlasSkyLayerManifest;
