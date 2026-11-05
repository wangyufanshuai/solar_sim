import type { OrbitAtlasSkyLayerManifest } from "./orbitAtlasPresentation";

export const ATLAS_VISUAL_RUNTIME_CANDIDATE_VERSION_V562 =
  "v562-active-visual-runtime-candidate" as const;
export const ATLAS_VISUAL_RUNTIME_CANDIDATE_AUTHORITY_V562 =
  "candidate-v562-derived-no-legacy-v9-authority" as const;

// The frozen ORBIT_ATLAS_V9_SKY identity remains untouched. These URLs live in
// an independent candidate namespace. Their manifest records the byte-preserving
// derivation from admitted sources without inheriting the historical authority.
export const ATLAS_VISUAL_RUNTIME_SKY_V562 = Object.freeze({
  desktopBase: "/textures/candidate-v562/sky/sky-base-desktop-8k.jpg",
  mobileBase: "/textures/candidate-v562/sky/sky-base-mobile-4k.jpg",
  desktopStars: "/textures/candidate-v562/sky/sky-stars-desktop-4k.jpg",
  mobileStars: "/textures/candidate-v562/sky/sky-stars-mobile-2k.jpg",
  dustMask: "/textures/candidate-v562/sky/sky-dust-shared-2k.jpg",
  rotation: [-0.34, 4.24, -0.86] as const,
}) satisfies OrbitAtlasSkyLayerManifest;
