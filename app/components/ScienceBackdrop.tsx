"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { useRelativisticOpticsStateRef } from "../context/RelativisticOpticsContext";
import GalaxyEnvironmentSphere from "./GalaxyEnvironmentSphere";
import BrightStarCatalog from "./BrightStarCatalog";
import type { FloatingOriginState } from "../lib/floatingOrigin";
import type { MutableRefObject } from "react";
import type { OrbitAtlasRenderBudget, SolarPresentationMode } from "../lib/orbitAtlasPresentation";
import type {
  AtlasCinematicBackgroundNoiseProfile,
  AtlasCinematicCameraProfile,
  AtlasBackgroundDepthProfile,
  AtlasReferenceGradeSkyLayerProfile,
  AtlasReferenceGradeStarfieldProfile,
  AtlasReferenceGradeSubjectMatteProfile,
  AtlasSelectedBodyLightingProfile,
  AtlasBackgroundArtGradeProfile,
  AtlasGlobalColorGradeProfile,
  AtlasCinematicBackdropNebulaProfile,
  AtlasCinematicBackdropNegativeSpaceProfile,
  AtlasCinematicBackdropStarfieldProfile,
  AtlasSparseDeepSpaceMilkyWayProfile,
  AtlasSparseDeepSpaceNebulaProfile,
  AtlasSparseDeepSpaceNegativeSpaceProfile,
  AtlasSparseDeepSpaceStarfieldProfile,
} from "../lib/simulationDiagnosticsTypes";
import type { AtlasReferenceGradeSubjectState } from "./UniverseScene";

export default function ScienceBackdrop({
  brightStarTier2 = false,
  presentationMode = "sandbox",
  renderBudget = "balanced",
  closeupActive = false,
  skyCloseupProfile = "overview-layered-deep-space",
  selectedBodyLightingProfile = "overview",
  cinematicCameraProfile = "overview-atlas",
  cinematicBackgroundNoiseProfile = "atlas-balanced-low-noise",
  backgroundDepthProfile = "overview-sparse-layered-milky-way",
  referenceGradeSkyLayerProfile = "v48-local-generated-layered-sky",
  referenceGradeStarfieldProfile = "sparse-primary-stars",
  referenceGradeSubjectMatteProfile = "overview-no-subject-matte",
  backgroundArtGradeProfile = "overview-balanced-starfield",
  globalColorGradeProfile = "overview-neutral-grade",
  cinematicBackdropStarfieldProfile = "sparse-primary-stars-faint-distant-field",
  cinematicBackdropNebulaProfile = "soft-local-nebula-haze-layer",
  cinematicBackdropNegativeSpaceProfile = "layered-milky-way-negative-space",
  sparseDeepSpaceStarfieldProfile = "sparse-primary-stars-ultrafaint-distant-field",
  sparseDeepSpaceMilkyWayProfile = "deep-cold-gray-blue-dark-lanes",
  sparseDeepSpaceNebulaProfile = "barely-visible-local-haze",
  sparseDeepSpaceNegativeSpaceProfile = "overview-wide-negative-space",
  subjectMatteRef,
  onSkyReady,
}: {
  floatingOriginRef?: MutableRefObject<FloatingOriginState>;
  brightStarTier2?: boolean;
  presentationMode?: SolarPresentationMode;
  renderBudget?: OrbitAtlasRenderBudget;
  closeupActive?: boolean;
  skyCloseupProfile?: string;
  selectedBodyLightingProfile?: AtlasSelectedBodyLightingProfile;
  cinematicCameraProfile?: AtlasCinematicCameraProfile;
  cinematicBackgroundNoiseProfile?: AtlasCinematicBackgroundNoiseProfile;
  backgroundDepthProfile?: AtlasBackgroundDepthProfile;
  referenceGradeSkyLayerProfile?: AtlasReferenceGradeSkyLayerProfile;
  referenceGradeStarfieldProfile?: AtlasReferenceGradeStarfieldProfile;
  referenceGradeSubjectMatteProfile?: AtlasReferenceGradeSubjectMatteProfile;
  backgroundArtGradeProfile?: AtlasBackgroundArtGradeProfile;
  globalColorGradeProfile?: AtlasGlobalColorGradeProfile;
  cinematicBackdropStarfieldProfile?: AtlasCinematicBackdropStarfieldProfile;
  cinematicBackdropNebulaProfile?: AtlasCinematicBackdropNebulaProfile;
  cinematicBackdropNegativeSpaceProfile?: AtlasCinematicBackdropNegativeSpaceProfile;
  sparseDeepSpaceStarfieldProfile?: AtlasSparseDeepSpaceStarfieldProfile;
  sparseDeepSpaceMilkyWayProfile?: AtlasSparseDeepSpaceMilkyWayProfile;
  sparseDeepSpaceNebulaProfile?: AtlasSparseDeepSpaceNebulaProfile;
  sparseDeepSpaceNegativeSpaceProfile?: AtlasSparseDeepSpaceNegativeSpaceProfile;
  subjectMatteRef?: MutableRefObject<AtlasReferenceGradeSubjectState>;
  onSkyReady?: (ready: boolean) => void;
}) {
  const rootRef = useRef<THREE.Group>(null);
  const opticsRef = useRelativisticOpticsStateRef();
  const camera = useThree((s) => s.camera);
  const v55BackgroundArt = backgroundArtGradeProfile !== "overview-balanced-starfield";
  const v55CloseupMatte = backgroundArtGradeProfile === "closeup-subject-star-noise-matte";
  const v57CloseupSparseBackdrop =
    sparseDeepSpaceStarfieldProfile === "closeup-primary-stars-subject-matte" ||
    sparseDeepSpaceNegativeSpaceProfile === "selected-body-clean-negative-space";
  const v57SparseBackdrop =
    v57CloseupSparseBackdrop ||
    sparseDeepSpaceStarfieldProfile === "sparse-primary-stars-ultrafaint-distant-field";
  const baseBrightStarOpacity =
    cinematicCameraProfile === "selected-body-cinematic"
      ? presentationMode === "orbit-atlas"
        ? v55CloseupMatte ? 0.00022 : 0.00045
        : v55CloseupMatte ? 0.00055 : 0.001
      : cinematicCameraProfile === "showcase-deep-space"
        ? presentationMode === "orbit-atlas"
          ? v55BackgroundArt ? 0.12 : 0.16
          : v55BackgroundArt ? 0.18 : 0.24
        : closeupActive
          ? presentationMode === "orbit-atlas"
            ? v55BackgroundArt ? 0.00042 : 0.0008
            : v55BackgroundArt ? 0.0012 : 0.0022
          : presentationMode === "orbit-atlas"
            ? v55BackgroundArt ? 0.48 : 0.56
            : 1;
  const brightStarOpacity =
    baseBrightStarOpacity * (v57CloseupSparseBackdrop ? 0.42 : v57SparseBackdrop ? 0.68 : 1);

  useFrame(() => {
    const root = rootRef.current;
    if (!root) return;
    const optics = opticsRef?.current;
    root.position.copy(camera.position);
    if (optics?.active) root.quaternion.copy(optics.aberrationQuat);
    else root.quaternion.identity();
  }, -999);

  return (
    <group ref={rootRef} renderOrder={-500}>
      <GalaxyEnvironmentSphere
        visible
        presentationMode={presentationMode}
        renderBudget={renderBudget}
        closeupActive={closeupActive}
        skyCloseupProfile={skyCloseupProfile}
        selectedBodyLightingProfile={selectedBodyLightingProfile}
        cinematicCameraProfile={cinematicCameraProfile}
        cinematicBackgroundNoiseProfile={cinematicBackgroundNoiseProfile}
        backgroundDepthProfile={backgroundDepthProfile}
        referenceGradeSkyLayerProfile={referenceGradeSkyLayerProfile}
        referenceGradeStarfieldProfile={referenceGradeStarfieldProfile}
        referenceGradeSubjectMatteProfile={referenceGradeSubjectMatteProfile}
        backgroundArtGradeProfile={backgroundArtGradeProfile}
        globalColorGradeProfile={globalColorGradeProfile}
        cinematicBackdropStarfieldProfile={cinematicBackdropStarfieldProfile}
        cinematicBackdropNebulaProfile={cinematicBackdropNebulaProfile}
        cinematicBackdropNegativeSpaceProfile={cinematicBackdropNegativeSpaceProfile}
        sparseDeepSpaceStarfieldProfile={sparseDeepSpaceStarfieldProfile}
        sparseDeepSpaceMilkyWayProfile={sparseDeepSpaceMilkyWayProfile}
        sparseDeepSpaceNebulaProfile={sparseDeepSpaceNebulaProfile}
        sparseDeepSpaceNegativeSpaceProfile={sparseDeepSpaceNegativeSpaceProfile}
        subjectMatteRef={subjectMatteRef}
        onTextureState={onSkyReady}
      />
      <BrightStarCatalog
        opacity={brightStarOpacity}
        tier2Loaded={
          presentationMode === "orbit-atlas" ||
          closeupActive ||
          cinematicCameraProfile === "selected-body-cinematic"
            ? false
            : brightStarTier2
        }
      />
    </group>
  );
}
