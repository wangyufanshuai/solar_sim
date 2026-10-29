"use client";

import { Billboard } from "@react-three/drei/core/Billboard";
import { useFrame } from "@react-three/fiber";
import { PostV594CdpSoakHtml as Html } from "../lib/v594CdpSoakSurface";
import { useCallback, useLayoutEffect, useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import type { GaiaIndexedStar } from "../lib/gaiaCatalogIndex";
import { useAtlasRuntimeStore } from "../lib/atlasRuntimeStore";
import { selectedSkyTargetDescriptor } from "../lib/selectedSkyTarget";
import {
  isStellarSkyTargetFocusDescriptor,
  SKY_TARGET_DISTANCE_SCENE,
  skyTargetPosition,
  type StellarSkyTargetFocusDescriptor,
} from "../lib/skyTargetFocus";
import { stellarMaterialProfile } from "../lib/stellarMaterialProfile";
import { resolveMainlineAStellarPresentationM2 } from "../lib/mainlineAStellarPresentationM2";
import { createStellarPortraitProfileV7 } from "../lib/stellarPortraitProfileV7";
import {
  STELLAR_HERO_BY_ID_V592,
} from "../lib/stellarHeroesV592";
import { JULIAN_DATE_J2000_V592 } from "../lib/celestialClockV592";
import {
  createStellarPortraitProfileFromRenderContractV594,
  createStellarPortraitRenderContractV594,
  type StellarPortraitRenderModeV594,
} from "../lib/stellarPortraitRenderContractV594";
import {
  STELLAR_PORTRAIT_RENDER_CONTRACT_V596_VERSION,
  createStellarPortraitProfileFromRenderContractV596,
  createStellarPortraitRenderContractV596,
} from "../lib/stellarPortraitRenderContractV596";
import StellarPortraitMaterial, {
  StellarCoronaMaterial,
  StellarHaloMaterial,
  type StellarAbsolutePhaseSourceV594,
} from "./StellarPortraitMaterial";
import StellarPortraitMaterialV596, {
  StellarCoronaMaterialV596,
  StellarHaloMaterialV596,
} from "./StellarPortraitMaterialV596";
import {
  canonicalShaV594Exact,
} from "../lib/v594ExactAbContract";
import { canonicalShaV595Exact } from "../lib/v595ExactAbContract";
import type { AtlasStellarRenderProfile } from "./AtlasCanvasSimulationContract";
import { observeCanonicalStellarLayerV636, useCanonicalProducerV635 } from "../lib/mainlineACanonicalProducerV635";
import { createMainlineARenderVisibilityV638 } from "../lib/mainlineARenderVisibilityV638";
import {
  createMainlineAStellarSurfaceCompositionV638,
  MAINLINE_A_STELLAR_SURFACE_RENDER_ORDER_V638,
} from "../lib/mainlineAStellarSurfaceCompositionV638";

type ScenePosition = [number, number, number];
type SceneScale = readonly [number, number, number];

function multiplyScale(scale: SceneScale, factor: number): [number, number, number] {
  return [scale[0] * factor, scale[1] * factor, scale[2] * factor];
}

function multiplyPosition(
  position: readonly [number, number, number],
  factor: number,
): [number, number, number] {
  return [position[0] * factor, position[1] * factor, position[2] * factor];
}

export default function SelectedSkyTargetProxy({
  selectedCatalogId,
  gaiaIndex,
  enabled,
  simDaysRef,
  stellarRenderProfile,
}: {
  selectedCatalogId: string;
  gaiaIndex: readonly GaiaIndexedStar[];
  enabled: boolean;
  simDaysRef: MutableRefObject<number>;
  stellarRenderProfile?: AtlasStellarRenderProfile;
}) {
  const mode = useAtlasRuntimeStore((snapshot): StellarPortraitRenderModeV594 =>
    snapshot.experienceMode === "research" ? "science" : "cinematic",
  );
  const target = useMemo(() => {
    const descriptor = selectedSkyTargetDescriptor(selectedCatalogId, gaiaIndex);
    if (!descriptor || !isStellarSkyTargetFocusDescriptor(descriptor)) return null;
    const position = skyTargetPosition(descriptor.direction, SKY_TARGET_DISTANCE_SCENE);
    return position ? { descriptor, position } : null;
  }, [gaiaIndex, selectedCatalogId]);
  const material = useMemo(() => target ? stellarMaterialProfile({
    id: target.descriptor.id,
    colorBpRp: target.descriptor.colorBpRp,
    mag: target.descriptor.mag,
    parallaxMas: target.descriptor.parallaxMas,
    fallbackColor: target.descriptor.color
      ?? (target.descriptor.kind === "gaia" ? "#a7f3ff" : "#ffd891"),
  }) : null, [target]);

  if (!enabled || !target || !material) return null;
  return (
    <StellarPortrait
      position={target.position}
      descriptor={target.descriptor}
      material={material}
      mode={mode}
      simDaysRef={simDaysRef}
      stellarRenderProfile={stellarRenderProfile}
    />
  );
}

function StellarPortrait({
  position,
  descriptor,
  material,
  mode,
  simDaysRef,
  stellarRenderProfile,
}: {
  position: ScenePosition;
  descriptor: StellarSkyTargetFocusDescriptor;
  material: ReturnType<typeof stellarMaterialProfile>;
  mode: StellarPortraitRenderModeV594;
  simDaysRef: MutableRefObject<number>;
  stellarRenderProfile?: AtlasStellarRenderProfile;
}) {
  const radius = descriptor.kind === "gaia" ? 142 : 156;
  const surfaceMeshRef = useRef<THREE.Mesh>(null);
  const haloMeshRef = useRef<THREE.Mesh>(null);
  const coronaMeshRef = useRef<THREE.Mesh>(null);
  const surfaceCompositionRef = useRef<ReturnType<typeof createMainlineAStellarSurfaceCompositionV638> | null>(null);
  useLayoutEffect(() => {
    const composition = createMainlineAStellarSurfaceCompositionV638();
    surfaceCompositionRef.current = composition;
    composition.update(surfaceMeshRef.current);
    return () => {
      surfaceCompositionRef.current = null;
      composition.dispose();
    };
  }, []);
  useFrame(() => {
    // Run after the scale compositor (-20): it can restore an opaque queue flag
    // after a fade. Also picks up material replacements before render-list build.
    surfaceCompositionRef.current?.update(surfaceMeshRef.current);
  }, -19);
  const descriptorHero = descriptor.targetType === "stellar-hero"
    ? STELLAR_HERO_BY_ID_V592[descriptor.heroId]
    : null;
  const exactProfile = descriptorHero && stellarRenderProfile?.targetId === descriptorHero.id
    ? stellarRenderProfile
    : null;
  const checkpointProfile = exactProfile?.version === "v596-stellar-render-profile-v1"
    ? exactProfile
    : null;
  const effectiveMode = exactProfile?.mode ?? mode;
  // Exact A/B checkpoints retain their sealed path. Ordinary A-line entry
  // aliases share the same presentation without changing descriptor coordinates.
  const mainlinePresentation = useMemo(() => !exactProfile
    ? resolveMainlineAStellarPresentationM2(descriptor.id, effectiveMode)
    : null, [descriptor.id, effectiveMode, exactProfile]);
  const hero = descriptorHero ?? mainlinePresentation?.hero ?? null;
  const baselineRenderContract = useMemo(() => hero && exactProfile && !checkpointProfile
    ? createStellarPortraitRenderContractV594(hero, effectiveMode)
    : null, [checkpointProfile, effectiveMode, exactProfile, hero]);
  const v596RenderContract = useMemo(() => mainlinePresentation?.contract ?? (hero && (!exactProfile || checkpointProfile)
    ? createStellarPortraitRenderContractV596(hero, effectiveMode)
    : null), [checkpointProfile, effectiveMode, exactProfile, hero, mainlinePresentation]);
  const renderContract = v596RenderContract ?? baselineRenderContract;
  const canonicalProducer = useCanonicalProducerV635(
    "star", hero?.id ?? null, "mainline-a-stellar-parametric", null,
    Boolean(hero && renderContract),
  );
  const renderVisible = useMemo(createMainlineARenderVisibilityV638, []);
  useFrame(({ camera }) => {
    if (!renderVisible(surfaceMeshRef.current, camera)) canonicalProducer.unobserved();
  });
  const v596Portrait = useMemo(() => mainlinePresentation?.portrait ?? (v596RenderContract
    ? createStellarPortraitProfileFromRenderContractV596(v596RenderContract, material)
    : null), [mainlinePresentation, material, v596RenderContract]);
  const baselinePortrait = useMemo(() => baselineRenderContract
    ? createStellarPortraitProfileFromRenderContractV594(baselineRenderContract, material)
    : null, [baselineRenderContract, material]);
  const genericPortrait = useMemo(() => !renderContract ? createStellarPortraitProfileV7({
        material,
        teffK: descriptor.teffK,
        teffLowerK: descriptor.teffLowerK,
        teffUpperK: descriptor.teffUpperK,
        logg: descriptor.logg,
        radiusSolar: descriptor.radiusSolar,
        metallicityDex: descriptor.metallicityDex,
        dataTier: descriptor.dataTier,
        variable: descriptor.variability.knownState === "known"
          ? descriptor.variability.value
          : false,
        spectralType: descriptor.spectralType,
        colorIndexAvailable: descriptor.colorBpRp != null,
      }) : null, [descriptor, material, renderContract]);
  const portrait = (v596Portrait ?? baselinePortrait ?? genericPortrait)!;
  const phaseSource = useMemo<StellarAbsolutePhaseSourceV594>(() => ({
    getJulianDate: () => JULIAN_DATE_J2000_V592 + simDaysRef.current,
  }), [simDaysRef]);
  const geometryScale = renderContract?.geometry.scale ?? [1, 1, 1] as const;
  const spectralLabel = descriptor.spectralType || portrait.atmosphereClass;
  const exactSourceBindingSha256 = useMemo(() => {
    if (!exactProfile) return null;
    if (checkpointProfile && v596RenderContract) return v596RenderContract.contractSha256;
    if (baselineRenderContract) return baselineRenderContract.contractSha256;
    const seal = exactProfile.version === "v595-stellar-render-profile-v1"
      ? canonicalShaV595Exact
      : canonicalShaV594Exact;
    return seal({
      version: `${exactProfile.candidate}-generic-stellar-portrait-source-binding-v1`,
      targetId: exactProfile.targetId,
      portraitVersion: portrait.version,
      portraitDerivation: portrait.derivation,
      atmosphereClass: portrait.atmosphereClass,
    });
  }, [baselineRenderContract, checkpointProfile, exactProfile, portrait.atmosphereClass, portrait.derivation, portrait.version, v596RenderContract]);
  const checkpointMetadata = useMemo(() => checkpointProfile && v596RenderContract && exactSourceBindingSha256
    ? {
         atlasV596VisualCheckpointRuntime: true,
         atlasV596VisualCheckpointVersion: "v596-stellar-visible-leap-checkpoint-v1",
         atlasV596VisualCheckpointNodeId:
           `v596:stellar:${checkpointProfile.targetId}:root`,
         atlasV596VisualCheckpointCaptureRequestId: checkpointProfile.captureRequestId,
        atlasV596VisualCheckpointCandidate: "v596",
        atlasV596VisualCheckpointCheckpointId: checkpointProfile.checkpointId,
        atlasV596VisualCheckpointTargetId: checkpointProfile.targetId,
        atlasV596VisualCheckpointArchetype: checkpointProfile.archetype,
        atlasV596VisualCheckpointMode: checkpointProfile.mode,
        atlasV596VisualCheckpointSourceBindingSha256: exactSourceBindingSha256,
        atlasV596VisualCheckpointMorphologySha256: v596RenderContract.morphology.profileSha256,
        atlasV596VisualCheckpointPresentationAuthority: "none",
        atlasV596VisualCheckpointRelativityAuthority: "shadow-only",
        atlasV596VisualCheckpointDefaultKernel: "legacy-eih-1pn",
        atlasV596VisualCheckpointScientificAuthority: false,
        atlasV596VisualCheckpointMeasuredAuthority: false,
        atlasV596VisualCheckpointGpuAuthority: false,
        atlasV596VisualCheckpointResolvedSurfaceAuthority: false,
        atlasV596VisualCheckpointObservationTextureAuthority: false,
        atlasV596VisualCheckpointRadiativeTransferAuthority: false,
        atlasV596VisualCheckpointGrmhdAuthority: false,
        atlasV596VisualCheckpointFormalEvidence: false,
        atlasV596VisualCheckpointPromotion: "none",
        atlasV596VisualCheckpointSupplementalOnly: true,
        atlasV596VisualCheckpointScientificPayloadWriteback: false,
        atlasV596VisualCheckpointFormalProductPointer: "v263",
      }
    : {}, [checkpointProfile, exactSourceBindingSha256, v596RenderContract]);
  const sceneMetadata = useMemo(() => {
    const base = v596RenderContract ? {
    atlasCandidate: "v596",
    atlasStellarRendererV596: true,
    atlasStellarRendererVersion: v596RenderContract.version,
    atlasStellarRendererContractInheritance: "additive-over-sealed-v594-renderer-contract",
    atlasStellarTargetId: descriptor.id,
    atlasStellarHeroId: v596RenderContract.heroId,
    atlasStellarArchetype: v596RenderContract.archetype,
    atlasStellarMorphologyVersion: v596RenderContract.morphology.version,
    atlasStellarMorphologyTopology: v596RenderContract.morphology.topology,
    atlasStellarMorphologySha256: v596RenderContract.morphology.profileSha256,
    atlasStellarMorphologyShaderBranch: v596RenderContract.morphology.shaderBranch,
    atlasStellarPresentationOrientationPolicy:
      "camera-plane-local-polar-axis-no-scientific-orientation-claim",
    atlasStellarPhenomenologyVersion: v596RenderContract.classificationMetadata.phenomenologyVersion,
    atlasStellarPhenomenologySha256: v596RenderContract.phenomenology.contractSha256,
    atlasStellarVariabilityState: v596RenderContract.phenomenology.variability.state,
    atlasStellarPulsationState: v596RenderContract.phenomenology.pulsation.state,
    atlasStellarBinaryState: v596RenderContract.phenomenology.binary.state,
    atlasStellarBinaryOrbitClaim: false,
    atlasStellarRenderContractSha256: v596RenderContract.contractSha256,
    atlasStellarBaselineV594ContractSha256: v596RenderContract.baselineV594ContractSha256,
    atlasStellarGeometrySignature: v596RenderContract.geometry.signature,
    atlasStellarDeterministicSeed: v596RenderContract.deterministicSeed,
    atlasStellarRenderMode: v596RenderContract.mode,
    atlasStellarAuthoritative: false,
    atlasStellarPresentationOnly: true,
    atlasStellarResolvedSurface: false,
    atlasObservationTextureClaim: false,
    atlasScientificAuthority: false,
    atlasMeasuredAuthority: false,
    atlasGpuAuthority: false,
    atlasRadiativeTransferAuthority: false,
    atlasGrmhdAuthority: false,
    atlasScientificPayloadWriteback: false,
    atlasFormalProductPointer: "v263",
    } : baselineRenderContract ? {
    atlasCandidate: "v595",
    atlasStellarRendererV594: true,
    atlasStellarRendererHostVersion: "v595",
    atlasStellarRendererContractInheritance: "sealed-v594-renderer-contract",
    atlasStellarTargetId: descriptor.id,
    atlasStellarHeroId: baselineRenderContract.heroId,
    atlasStellarArchetype: baselineRenderContract.archetype,
    atlasStellarPhenomenologyVersion: baselineRenderContract.classificationMetadata.phenomenologyVersion,
    atlasStellarPhenomenologySha256: baselineRenderContract.phenomenology.contractSha256,
    atlasStellarVariabilityState: baselineRenderContract.phenomenology.variability.state,
    atlasStellarPulsationState: baselineRenderContract.phenomenology.pulsation.state,
    atlasStellarBinaryState: baselineRenderContract.phenomenology.binary.state,
    atlasStellarBinaryOrbitClaim: false,
    atlasStellarRenderContractSha256: baselineRenderContract.contractSha256,
    atlasStellarGeometrySignature: baselineRenderContract.geometry.signature,
    atlasStellarDeterministicSeed: baselineRenderContract.deterministicSeed,
    atlasStellarRenderMode: baselineRenderContract.mode,
    atlasStellarAuthoritative: false,
    atlasStellarPresentationOnly: true,
    atlasStellarResolvedSurface: false,
    atlasObservationTextureClaim: false,
    atlasScientificPayloadWriteback: false,
    } : {
    atlasStellarTargetId: descriptor.id,
    atlasStellarGenericPortrait: true,
    atlasStellarRenderMode: mode,
    atlasStellarAuthoritative: false,
    atlasStellarPresentationOnly: true,
    atlasStellarResolvedSurface: false,
      atlasObservationTextureClaim: false,
    };
    if (!exactProfile || !exactSourceBindingSha256) return { ...base, ...checkpointMetadata };
    if (checkpointProfile) return { ...base, ...checkpointMetadata };
    return {
      ...base,
      atlasCandidate: exactProfile.candidate,
      atlasExactAbRuntime: true,
      atlasExactAbHostVersion: exactProfile.version.startsWith("v595-") ? "v595" : "v594",
      atlasExactAbCaptureRequestId: exactProfile.captureRequestId,
      atlasExactAbCandidate: exactProfile.candidate,
      atlasExactAbNodeId: `${exactProfile.candidate}:stellar:${exactProfile.targetId}:root`,
      atlasExactAbTargetId: exactProfile.targetId,
      atlasExactAbArchetype: exactProfile.archetype,
      atlasExactAbMode: exactProfile.mode,
      atlasExactAbSourceBindingSha256: exactSourceBindingSha256,
      atlasStellarHeroId: exactProfile.targetId,
      atlasStellarArchetype: exactProfile.archetype,
      atlasStellarRenderContractSha256: exactSourceBindingSha256,
      atlasExactAbPresentationAuthority: "none",
      atlasExactAbRelativityAuthority: "shadow-only",
      atlasExactAbScientificAuthority: false,
      atlasExactAbMeasuredAuthority: false,
      atlasExactAbGpuAuthority: false,
      atlasExactAbRadiativeTransferAuthority: false,
      atlasExactAbGrmhdAuthority: false,
      atlasExactAbPromotion: "none",
      atlasExactAbDefaultKernel: "legacy-eih-1pn",
      atlasExactAbScientificPayloadWriteback: false,
    };
  }, [baselineRenderContract, checkpointMetadata, checkpointProfile, descriptor.id, exactProfile, exactSourceBindingSha256, mode, v596RenderContract]);
  const exactLayerMetadata = useCallback((layer: string, metadata: Record<string, unknown>) => exactProfile
    ? {
        ...metadata,
        ...(checkpointProfile
          ? { atlasV596VisualCheckpointNodeId: `v596:stellar:${checkpointProfile.targetId}:${layer}` }
          : { atlasExactAbNodeId: `${exactProfile.candidate}:stellar:${exactProfile.targetId}:${layer}` }),
      }
    : metadata, [checkpointProfile, exactProfile]);
  const surfaceMeshMetadata = useMemo(() => ({
    ...exactLayerMetadata("surface", sceneMetadata),
    atlasStellarPortraitLayer: "surface",
  }), [exactLayerMetadata, sceneMetadata]);
  const coronaMeshMetadata = useMemo(() => ({
    ...exactLayerMetadata("corona", sceneMetadata),
    atlasStellarPortraitLayer: "corona",
  }), [exactLayerMetadata, sceneMetadata]);
  const haloMeshMetadata = useMemo(() => ({
    ...exactLayerMetadata("halo", sceneMetadata),
    atlasStellarPortraitLayer: "halo",
  }), [exactLayerMetadata, sceneMetadata]);
  const coronaLayerScale = v596RenderContract
    ? 1.17 + v596RenderContract.corona.morphology.layerSeparation * 0.16
    : 1.22;

  return (
    <group position={position} userData={sceneMetadata}>
      {effectiveMode === "cinematic" && (!renderContract || renderContract.halo.enabled) ? (
        <Billboard follow lockX={false} lockY={false} lockZ={false}>
          <mesh
            ref={haloMeshRef}
            renderOrder={45}
            onAfterRender={function (this: THREE.Mesh) {
              if (haloMeshRef.current !== this || !hero || !renderContract) return;
              observeCanonicalStellarLayerV636(this, hero.id, "halo");
            }}
            scale={[
              radius * 3.5 * geometryScale[0],
              radius * 3.5 * geometryScale[1],
              1,
            ]}
            userData={haloMeshMetadata}
          >
            <planeGeometry args={[1, 1]} userData={haloMeshMetadata} />
            {v596RenderContract && v596Portrait ? (
              <StellarHaloMaterialV596
                portrait={v596Portrait}
                renderContract={v596RenderContract}
              />
            ) : baselineRenderContract ? (
              <StellarHaloMaterial
                portrait={baselinePortrait!}
                mode={effectiveMode}
                renderContract={baselineRenderContract}
                phaseSource={phaseSource}
              />
            ) : (
              <StellarHaloMaterial portrait={genericPortrait!} mode={effectiveMode} />
            )}
          </mesh>
        </Billboard>
      ) : null}
      <Billboard
        follow={Boolean(v596RenderContract)}
        lockX={false}
        lockY={false}
        lockZ={false}
        userData={v596RenderContract ? {
          ...sceneMetadata,
          atlasStellarPresentationOrientationPolicy:
            "camera-plane-local-polar-axis-no-scientific-orientation-claim",
        } : undefined}
      >
      <mesh
        ref={surfaceMeshRef}
        renderOrder={MAINLINE_A_STELLAR_SURFACE_RENDER_ORDER_V638}
        onAfterRender={function (this: THREE.Mesh, _renderer, _scene, camera, drawnGeometry, drawnMaterial, group) {
          if (surfaceMeshRef.current !== this || this.geometry !== drawnGeometry || !hero || !renderContract) return;
          if (!renderVisible(this, camera, drawnMaterial, group)) {
            canonicalProducer.unobserved();
            return;
          }
          observeCanonicalStellarLayerV636(this, hero.id, "surface");
          canonicalProducer.rendered();
        }}
        scale={geometryScale as [number, number, number]}
        userData={surfaceMeshMetadata}
      >
        <sphereGeometry args={[radius, 64, 48]} userData={surfaceMeshMetadata} />
        {v596RenderContract && v596Portrait ? (
          <StellarPortraitMaterialV596
            portrait={v596Portrait}
            renderContract={v596RenderContract}
            phaseSource={phaseSource}
          />
        ) : baselineRenderContract ? (
          <StellarPortraitMaterial
            material={material}
            portrait={baselinePortrait!}
            mode={effectiveMode}
            renderContract={baselineRenderContract}
            phaseSource={phaseSource}
          />
        ) : (
          <StellarPortraitMaterial
            material={material}
            portrait={genericPortrait!}
            mode={effectiveMode}
          />
        )}
      </mesh>
      {effectiveMode === "cinematic" && (!renderContract || renderContract.corona.enabled) ? (
        <mesh
          ref={coronaMeshRef}
          renderOrder={46}
          onAfterRender={function (this: THREE.Mesh) {
            if (coronaMeshRef.current !== this || !hero || !renderContract) return;
            observeCanonicalStellarLayerV636(this, hero.id, "corona");
          }}
          scale={multiplyScale(geometryScale, coronaLayerScale)}
          userData={coronaMeshMetadata}
        >
          <sphereGeometry args={[radius, 48, 32]} userData={coronaMeshMetadata} />
          {v596RenderContract && v596Portrait ? (
            <StellarCoronaMaterialV596
              portrait={v596Portrait}
              renderContract={v596RenderContract}
              phaseSource={phaseSource}
            />
          ) : baselineRenderContract ? (
            <StellarCoronaMaterial
              portrait={baselinePortrait!}
              mode={effectiveMode}
              renderContract={baselineRenderContract}
              phaseSource={phaseSource}
            />
          ) : (
            <StellarCoronaMaterial portrait={genericPortrait!} mode={effectiveMode} />
          )}
        </mesh>
      ) : null}
      {renderContract?.companions.enabled
        ? renderContract.companions.entries.filter((entry) => entry.enabled).map((entry) => {
            const companionMetadata = {
              ...exactLayerMetadata(`companion:${entry.id}`, sceneMetadata),
              atlasStellarPortraitLayer: "companion",
              atlasStellarCompanionId: entry.id,
              atlasStellarCompanionPresentationOnly: true,
              atlasStellarCompanionOrbitClaim: false,
            };
            return (
              <mesh
                key={entry.id}
                position={multiplyPosition(entry.positionNormalized, radius)}
                renderOrder={48}
                userData={companionMetadata}
              >
                <sphereGeometry
                  args={[
                    radius * entry.radiusScale * (v596RenderContract ? 0.52 : 1),
                    24,
                    16,
                  ]}
                  userData={companionMetadata}
                />
                <meshBasicMaterial
                  color={material.coreColor}
                  transparent={Boolean(v596RenderContract)}
                  opacity={v596RenderContract ? 0.62 : 1}
                  depthWrite={!v596RenderContract}
                  blending={v596RenderContract
                    ? THREE.AdditiveBlending
                    : THREE.NormalBlending}
                  toneMapped={false}
                  userData={companionMetadata}
                />
              </mesh>
            );
          })
        : null}
      </Billboard>
      <Html center distanceFactor={6.4} style={{ pointerEvents: "none" }} zIndexRange={[55, 0]}>
        <div
          className="relative h-[132px] w-[132px]"
          data-sky-target-proxy="true"
          data-sky-target-proxy-id={descriptor.id}
          data-sky-target-proxy-kind={descriptor.kind}
          data-sky-target-proxy-target-type={descriptor.targetType}
          data-sky-target-proxy-spectral-label={spectralLabel}
          data-stellar-portrait="parameter-derived-presentation-portrait"
          data-stellar-portrait-version={portrait.version}
          data-stellar-portrait-derivation={portrait.derivation}
          data-stellar-atmosphere-class={portrait.atmosphereClass}
          data-stellar-parameter-source={portrait.parameterSource}
          data-stellar-parameter-completeness={portrait.parameterCompleteness}
          data-stellar-data-tier={portrait.dataTier}
          data-stellar-parameter-confidence={portrait.parameterConfidence.toFixed(3)}
          data-stellar-metallicity-dex={portrait.metallicityDex ?? "unknown"}
          data-stellar-color-temperature-k={mainlinePresentation?.portrait.temperatureK ?? material.colorTemperatureK}
          data-mainline-a-stellar-presentation-id={mainlinePresentation ? "m2-shared-v596" : undefined}
          data-mainline-a-stellar-presentation-sha256={mainlinePresentation?.appearance.signatureSha256}
          data-mainline-a-stellar-color-family={mainlinePresentation?.appearance.family}
          data-mainline-a-stellar-color-srgb={mainlinePresentation?.appearance.baseColor}
          data-mainline-a-stellar-model-axis-ratio={mainlinePresentation?.appearance.axisRatio}
          data-stellar-flare-count={portrait.prominenceBudget}
          data-stellar-draw-call-budget={portrait.drawCallBudget}
          data-atlas-candidate={v596RenderContract
            ? "v596"
            : baselineRenderContract ? exactProfile?.candidate ?? "v595" : undefined}
          data-atlas-v596-stellar-renderer={v596RenderContract
            ? STELLAR_PORTRAIT_RENDER_CONTRACT_V596_VERSION
            : undefined}
          data-atlas-v596-stellar-morphology={v596RenderContract?.morphology.version}
          data-atlas-v596-stellar-morphology-topology={v596RenderContract?.morphology.topology}
          data-atlas-v596-stellar-morphology-sha256={v596RenderContract?.morphology.profileSha256}
          data-atlas-v596-stellar-shader-branch={v596RenderContract?.morphology.shaderBranch}
          data-atlas-v596-visual-checkpoint={checkpointProfile
            ? "v596-stellar-visible-leap-checkpoint-v1"
            : undefined}
          data-atlas-v596-visual-checkpoint-id={checkpointProfile?.checkpointId}
          data-atlas-v596-visual-checkpoint-capture-request-id={
            checkpointProfile?.captureRequestId
          }
          data-atlas-v596-visual-checkpoint-source-binding-sha256={
            checkpointProfile ? exactSourceBindingSha256 ?? undefined : undefined
          }
          data-atlas-v596-visual-checkpoint-morphology-sha256={
            checkpointProfile ? v596RenderContract?.morphology.profileSha256 : undefined
          }
          data-atlas-v596-visual-checkpoint-formal-evidence={checkpointProfile ? "false" : undefined}
          data-atlas-v596-visual-checkpoint-promotion={checkpointProfile ? "none" : undefined}
          data-atlas-v596-visual-checkpoint-supplemental-only={checkpointProfile ? "true" : undefined}
          data-atlas-v596-presentation-orientation-policy={v596RenderContract
            ? "camera-plane-local-polar-axis-no-scientific-orientation-claim"
            : undefined}
          data-atlas-v596-baseline-v594-contract-sha256={
            v596RenderContract?.baselineV594ContractSha256
          }
          data-atlas-v596-formal-product-pointer={v596RenderContract ? "v263" : undefined}
          data-atlas-v595-host-candidate={baselineRenderContract ? "v595" : undefined}
          data-atlas-v595-stellar-render-adapter={
            baselineRenderContract ? "sealed-v594-renderer-contract" : undefined
          }
          data-atlas-v594-stellar-render-bridge={baselineRenderContract
            ? "contract-driven"
            : undefined}
          data-stellar-target-id={descriptor.id}
          data-stellar-hero-id={renderContract?.heroId}
          data-stellar-archetype={renderContract?.archetype}
          data-stellar-render-contract-sha256={renderContract?.contractSha256}
          data-stellar-phenomenology-version={renderContract?.classificationMetadata.phenomenologyVersion}
          data-stellar-phenomenology-sha256={renderContract?.phenomenology.contractSha256}
          data-stellar-phenomenology-variability-state={renderContract?.phenomenology.variability.state}
          data-stellar-phenomenology-pulsation-state={renderContract?.phenomenology.pulsation.state}
          data-stellar-phenomenology-binary-state={renderContract?.phenomenology.binary.state}
          data-stellar-phenomenology-binary-orbit-claim={renderContract ? "false" : undefined}
          data-stellar-geometry-signature={renderContract?.geometry.signature}
          data-stellar-deterministic-seed={renderContract?.deterministicSeed}
          data-stellar-render-mode={effectiveMode}
          data-stellar-render-authoritative="false"
          data-stellar-presentation-only="true"
          data-stellar-resolved-surface="false"
          data-stellar-observation-texture="false"
          data-stellar-scientific-authority="false"
          data-stellar-measured-authority="false"
          data-stellar-gpu-authority="false"
          data-stellar-radiative-transfer-authority="false"
          data-stellar-grmhd-authority="false"
          data-stellar-scientific-payload-writeback="false"
          data-stellar-rotation-phase-policy={renderContract?.surface.rotation.phasePolicy}
          data-stellar-rotation-period-days={renderContract?.surface.rotation.periodDays}
          data-stellar-orientation-known-state={renderContract?.fields.orientation.knownState}
          data-stellar-variability-known-state={renderContract?.fields.variability.knownState
            ?? descriptor.variability.knownState}
          data-stellar-pulsation-enabled={renderContract
            ? String(renderContract.surface.pulsation.enabled)
            : "false"}
          data-stellar-corona-enabled={renderContract
            ? String(renderContract.corona.enabled)
            : String(mode === "cinematic")}
          data-stellar-companion-count={renderContract?.companions.entries.length ?? 0}
          data-stellar-companion-policy={renderContract?.companions.reason ?? "not-modeled"}
        >
          <div className="absolute left-1/2 top-full mt-2 min-w-[210px] -translate-x-1/2 rounded-md border border-cyan-100/25 bg-black/72 px-2.5 py-1.5 text-center text-[9px] text-cyan-50 backdrop-blur-md">
            <div className="truncate text-white/90">{descriptor.label}</div>
            <div className="mt-0.5 truncate text-white/50">
              恒星肖像 / {spectralLabel} / {Math.round(portrait.temperatureK)} K
            </div>
            <div className="mt-0.5 truncate text-white/35">
              {renderContract
                ? `${renderContract.archetype} / ${effectiveMode} / 非权威展示`
                : `参数派生展示 / ${portrait.parameterSource} / 非解析表面`}
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
}
