import type { ThreeEvent } from "@react-three/fiber";
import type * as THREE from "three";
import type { MutableRefObject } from "react";
import type { SolarSystemPhysicsRef } from "../lib/solarSystemRef";
import type { OrbitAtlasBodyVisualProfile } from "../lib/orbitAtlasPresentation";
import type {
  AtlasCloseupCompositionProfile,
  AtlasReferenceGradePlanetMaterialProfile,
  AtlasSelectedBodyAtmosphereDepthProfile,
  AtlasSelectedBodyColorGradeProfile,
  AtlasSelectedBodyDepthLightingProfile,
  AtlasSelectedBodyKeyLightProfile,
  AtlasSelectedBodyLightingProfile,
  AtlasSelectedBodyMaterialProfile,
  AtlasSelectedBodyTerminatorProfile,
  AtlasSelectedBodyGasGiantArtProfile,
  AtlasSelectedBodyEarthCloudNightProfile,
  AtlasGlobalColorGradeProfile,
} from "../lib/simulationDiagnosticsTypes";

export type PlanetBodyProps = {
  variant: "planet";
  bodyId?: string;
  radius?: number;
  position?: [number, number, number];
  sunEmissiveIntensity?: number;
  sunCoronaRadiusScale?: number;
  sunCoronaOpacity?: number;
  map?: THREE.Texture | null;
  normalMap?: THREE.Texture | null;
  roughnessMap?: THREE.Texture | null;
  color?: THREE.ColorRepresentation;
  emissive?: THREE.ColorRepresentation;
  emissiveIntensity?: number;
  roughness?: number;
  metalness?: number;
  envMapIntensity?: number;
  sphereSegments?: [number, number];
  sunCastPointLight?: boolean;
  pointLightIntensity?: number;
  pointLightColor?: THREE.ColorRepresentation;
  label?: string;
  labelFadeNear?: number;
  labelFadeFar?: number;
  labelDistanceFactor?: number;
  labelFontSizePx?: number;
  labelBodyIndex?: number;
  labelSurfaceFadeNear?: number;
  labelSurfaceFadeFar?: number;
  labelLodDiscWorldRadius?: number;
  onBodyPointerDown?: (e: ThreeEvent<PointerEvent>) => void;
  onBodyDoubleClick?: (e: ThreeEvent<PointerEvent>) => void;
  selected?: boolean;
  /** When set with `opticsPhysicsRef`, applies Doppler / searchlight from sim velocity vs camera. */
  opticsBodyIndex?: number;
  opticsPhysicsRef?: MutableRefObject<SolarSystemPhysicsRef | null>;
  /** Show atmospheric scattering glow (Earth only). */
  showAtmosphere?: boolean;
  /** Atmosphere glow color (defaults to Earth blue). */
  atmosphereColor?: THREE.ColorRepresentation;
  /** Cloud layer texture (semi-transparent sphere slightly larger than planet). */
  clouds?: THREE.Texture | null;
  /** Optional local alpha mask for the cloud layer. */
  cloudAlphaMap?: THREE.Texture | null;
  /** Optional night-light emissive texture, loaded for selected HD bodies. */
  nightMap?: THREE.Texture | null;
  /** Optional local mask to keep night lights constrained to city-light pixels. */
  nightMaskMap?: THREE.Texture | null;
  /** Optional local gas-giant band contrast mask. */
  bandMask?: THREE.Texture | null;
  /** Sim-driven visual spin angle; affects surface/clouds only, not physics or labels. */
  spinAngleRef?: MutableRefObject<number>;
  /** Keep the textured mesh visible at atlas overview distances. */
  forceSurface?: boolean;
  /** Presentation-only profile used by compressed Orbit Atlas. */
  atlasVisualProfile?: OrbitAtlasBodyVisualProfile;
  /** Presentation-only close-up lighting profile; does not affect physics. */
  cinematicLightingProfile?: AtlasSelectedBodyLightingProfile;
  /** Presentation-only v48 material/readability profile; does not affect physics. */
  referenceGradePlanetMaterialProfile?: AtlasReferenceGradePlanetMaterialProfile;
  /** Presentation-only v49 material composition profile; does not affect physics. */
  selectedBodyMaterialProfile?: AtlasSelectedBodyMaterialProfile;
  /** Presentation-only v49 atmosphere-depth profile; does not affect physics. */
  selectedBodyAtmosphereDepthProfile?: AtlasSelectedBodyAtmosphereDepthProfile;
  /** Presentation-only v49 terminator profile; does not affect physics. */
  selectedBodyTerminatorProfile?: AtlasSelectedBodyTerminatorProfile;
  /** Presentation-only v51 key-light / phase profile; does not affect physics. */
  selectedBodyKeyLightProfile?: AtlasSelectedBodyKeyLightProfile;
  /** Presentation-only v52 depth-lighting / ring-shadow profile; does not affect physics. */
  selectedBodyDepthLightingProfile?: AtlasSelectedBodyDepthLightingProfile;
  /** Presentation-only v53 color-grading profile; does not affect physics. */
  selectedBodyColorGradeProfile?: AtlasSelectedBodyColorGradeProfile;
  /** Presentation-only v55 gas-giant art direction profile; does not affect physics. */
  selectedBodyGasGiantArtProfile?: AtlasSelectedBodyGasGiantArtProfile;
  /** Presentation-only v55 Earth cloud/night profile; does not affect physics. */
  selectedBodyEarthCloudNightProfile?: AtlasSelectedBodyEarthCloudNightProfile;
  /** Presentation-only v55 global color grade; does not affect physics. */
  globalColorGradeProfile?: AtlasGlobalColorGradeProfile;
  /** Presentation-only v50 close-up composition profile; does not affect physics. */
  closeupCompositionProfile?: AtlasCloseupCompositionProfile;
};
