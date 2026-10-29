import type { ThreeEvent } from "@react-three/fiber";
import type * as THREE from "three";
import type { MutableRefObject } from "react";
import type { SolarSystemPhysicsRef } from "../lib/solarSystemRef";
import type { OrbitAtlasBodyVisualProfile } from "../lib/orbitAtlasPresentation";
import type {
  AtlasReferenceGradePlanetMaterialProfile,
  AtlasSelectedBodyAtmosphereDepthProfile,
  AtlasSelectedBodyColorGradeProfile,
  AtlasSelectedBodyDepthLightingProfile,
  AtlasSelectedBodyKeyLightProfile,
  AtlasSelectedBodyLightingProfile,
  AtlasSelectedBodyMaterialProfile,
  AtlasSelectedBodyTerminatorProfile,
  AtlasSelectedBodySolarSurfaceProfile,
  AtlasGlobalColorGradeProfile,
} from "../lib/simulationDiagnosticsTypes";

export type SunBodyProps = {
  variant: "sun";
  radius?: number;
  position?: [number, number, number];
  map?: THREE.Texture | null;
  normalMap?: THREE.Texture | null;
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
  opticsBodyIndex?: number;
  opticsPhysicsRef?: MutableRefObject<SolarSystemPhysicsRef | null>;
  detailShadowBodyIndex?: number;
  detailShadowPhysicsRef?: MutableRefObject<SolarSystemPhysicsRef | null>;
  detailShadowMaxCameraDist?: number;
  spinAngleRef?: MutableRefObject<number>;
  atlasVisualProfile?: OrbitAtlasBodyVisualProfile;
  cinematicLightingProfile?: AtlasSelectedBodyLightingProfile;
  referenceGradePlanetMaterialProfile?: AtlasReferenceGradePlanetMaterialProfile;
  selectedBodyMaterialProfile?: AtlasSelectedBodyMaterialProfile;
  selectedBodyAtmosphereDepthProfile?: AtlasSelectedBodyAtmosphereDepthProfile;
  selectedBodyTerminatorProfile?: AtlasSelectedBodyTerminatorProfile;
  selectedBodyKeyLightProfile?: AtlasSelectedBodyKeyLightProfile;
  selectedBodyDepthLightingProfile?: AtlasSelectedBodyDepthLightingProfile;
  selectedBodyColorGradeProfile?: AtlasSelectedBodyColorGradeProfile;
  selectedBodySolarSurfaceProfile?: AtlasSelectedBodySolarSurfaceProfile;
  globalColorGradeProfile?: AtlasGlobalColorGradeProfile;
  forceSurface?: boolean;
};
