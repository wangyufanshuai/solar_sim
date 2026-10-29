"use client";

import * as THREE from "three";
import { useEffect, useMemo } from "react";
import { useAtlasRuntimeStore } from "../lib/atlasRuntimeStore";
import { resolveAtlasVisualProfileV299 } from "../lib/atlasVisualProfileV299";
import { V76_CLOSEUP_VISUAL_BUDGETS } from "../lib/atlasCloseupVisualFidelity";
import type {
  AtlasCloseupRingShowcaseProfile,
  AtlasReferenceGradePlanetMaterialProfile,
  AtlasSelectedBodyColorGradeProfile,
  AtlasSelectedBodyDepthLightingProfile,
  AtlasSelectedBodyKeyLightProfile,
  AtlasSelectedBodyRingProfile,
  AtlasSelectedBodySaturnRingArtProfile,
  AtlasGlobalColorGradeProfile,
} from "../lib/simulationDiagnosticsTypes";

export function AtlasSaturnRings({
  radiusScene,
  referenceGrade = false,
  v49Ring = false,
  v50Showcase = false,
  v51RingKeyFill = false,
  v52RingDepth = false,
  v53RingColor = false,
  v55RingArt = false,
}: {
  radiusScene: number;
  referenceGrade?: boolean;
  v49Ring?: boolean;
  v50Showcase?: boolean;
  v51RingKeyFill?: boolean;
  v52RingDepth?: boolean;
  v53RingColor?: boolean;
  v55RingArt?: boolean;
}) {
  const visualRendererProfile = useAtlasRuntimeStore((snapshot) => resolveAtlasVisualProfileV299(snapshot.visualProfile));
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        depthTest: !v50Showcase,
        side: THREE.DoubleSide,
        toneMapped: !v50Showcase,
        uniforms: {
          uColorInner: { value: new THREE.Color("#8f846d") },
          uColorOuter: { value: new THREE.Color("#c2b18d") },
          uReferenceGrade: { value: referenceGrade ? 1 : 0 },
          uMaterialDepth: { value: v49Ring ? 1 : 0 },
          uShowcase: { value: v50Showcase ? 1 : 0 },
          uKeyFill: { value: v51RingKeyFill ? 1 : 0 },
          uDepthLighting: { value: v52RingDepth ? 1 : 0 },
          uColorGrade: { value: v53RingColor ? 1 : 0 },
          uV55RingArt: { value: v55RingArt ? 1 : 0 },
          uProfileOpticalDepth: { value: visualRendererProfile.groups.solar.ringOpticalDepth },
          uProfileShadowStrength: { value: visualRendererProfile.groups.solar.ringShadowStrength },
        },
        vertexShader: `
          varying vec2 vRingUv;
          void main() {
            vRingUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 uColorInner;
          uniform vec3 uColorOuter;
          uniform float uReferenceGrade;
          uniform float uMaterialDepth;
          uniform float uShowcase;
          uniform float uKeyFill;
          uniform float uDepthLighting;
          uniform float uColorGrade;
          uniform float uV55RingArt;
          uniform float uProfileOpticalDepth;
          uniform float uProfileShadowStrength;
          varying vec2 vRingUv;
          void main() {
            float r = length(vRingUv - 0.5) * 2.0;
            float envelope = smoothstep(0.455, 0.50, r) * (1.0 - smoothstep(0.965, 1.0, r));
            float depth = max(max(uReferenceGrade, uMaterialDepth), max(max(uShowcase, uKeyFill), max(max(uDepthLighting, uColorGrade), uV55RingArt)));
            float fineBands = 0.74 + sin(r * 150.0) * mix(0.08, 0.155, depth) + sin(r * 420.0) * mix(0.035, 0.082, max(depth, uV55RingArt));
            float cassini = 1.0 - smoothstep(0.752, 0.772, r) * (1.0 - smoothstep(0.792, 0.816, r)) * mix(0.92, 0.999, max(depth, uV55RingArt));
            float cRing = mix(0.36, 0.9, smoothstep(0.50, 0.63, r));
            float outerFade = 1.0 - smoothstep(0.88, 0.98, r) * mix(0.52, 0.28, max(uMaterialDepth, uShowcase));
            vec3 color = mix(uColorInner, uColorOuter, smoothstep(0.48, 0.92, r));
            color = mix(color, color * vec3(1.08, 1.02, 0.88), uMaterialDepth * 0.42);
            color = mix(color, color * vec3(1.14, 1.08, 0.92), uShowcase * 0.46);
            float shadowBand = smoothstep(0.61, 0.68, r) * (1.0 - smoothstep(0.82, 0.9, r));
            color = mix(color, color * vec3(1.18, 1.10, 0.94), uKeyFill * 0.36);
            color = mix(color, color * mix(vec3(0.72, 0.68, 0.6), vec3(1.16, 1.08, 0.92), shadowBand), uDepthLighting * 0.32 * uProfileShadowStrength);
            color = mix(color, color * mix(vec3(0.66, 0.62, 0.54), vec3(1.20, 1.10, 0.90), smoothstep(0.54, 0.86, r)), uColorGrade * 0.22);
            color = mix(color, color * mix(vec3(0.52, 0.50, 0.48), vec3(1.26, 1.12, 0.86), smoothstep(0.50, 0.90, r)), uV55RingArt * 0.3);
            float alpha = envelope * fineBands * cassini * cRing * outerFade * mix(0.62, 0.94, depth) * mix(1.0, 1.12, uKeyFill) * mix(1.0, 1.08, uDepthLighting) * mix(1.0, 0.74, uColorGrade) * mix(1.0, ${V76_CLOSEUP_VISUAL_BUDGETS.saturnRing.shaderArtAlphaBoost.toFixed(2)}, uV55RingArt);
            gl_FragColor = vec4(color, clamp(alpha * uProfileOpticalDepth, 0.0, 1.0));
          }
        `,
      }),
    [referenceGrade, v49Ring, v50Showcase, v51RingKeyFill, v52RingDepth, v53RingColor, v55RingArt, visualRendererProfile],
  );

  useEffect(() => () => material.dispose(), [material]);

  const ringRotation: [number, number, number] = [
    v50Showcase ? 0.56 : Math.PI / 2 + (v55RingArt ? 0.68 : v49Ring ? 0.72 : 0),
    v50Showcase ? 0.12 : 0,
    v50Showcase ? -0.34 : v55RingArt ? -0.22 : v49Ring ? -0.18 : 0,
  ];
  const outerRadius = radiusScene * (v50Showcase ? (v53RingColor ? 2.92 : 3.18) : v55RingArt ? 2.9 : v49Ring ? 2.62 : 2.42);

  return (
    <group>
      <mesh
        rotation={ringRotation}
        renderOrder={5}
        castShadow={false}
        receiveShadow={false}
      >
        <ringGeometry args={[radiusScene * 1.05, outerRadius, 224]} />
        <primitive object={material} attach="material" />
      </mesh>
      {v50Showcase ? (
        <mesh
          rotation={ringRotation}
          renderOrder={6}
          castShadow={false}
          receiveShadow={false}
        >
          <ringGeometry args={[radiusScene * 1.12, radiusScene * 3.24, 224]} />
          <meshBasicMaterial
            color={v53RingColor ? "#d8bd8c" : v51RingKeyFill ? "#efd7a8" : "#e4ca8d"}
            transparent
            opacity={v53RingColor ? 0.14 : v51RingKeyFill ? 0.42 : 0.48}
            side={THREE.DoubleSide}
            depthWrite={false}
            depthTest={false}
            toneMapped={false}
          />
        </mesh>
      ) : null}
    </group>
  );
}

export function SaturnRings({
  radiusScene,
  orbitAtlas = false,
  referenceGradePlanetMaterialProfile = "overview-local-hd",
  selectedBodyRingProfile = "no-ring-profile",
  selectedBodyKeyLightProfile = "overview-natural-phase",
  selectedBodyDepthLightingProfile = "overview-no-depth-lighting",
  selectedBodyColorGradeProfile = "overview-neutral-color",
  selectedBodySaturnRingArtProfile = "no-ring-art-profile",
  globalColorGradeProfile = "overview-neutral-grade",
  closeupRingShowcaseProfile = "no-ring-showcase",
  ringColorMap = null,
  ringAlphaMap = null,
}: {
  radiusScene: number;
  orbitAtlas?: boolean;
  referenceGradePlanetMaterialProfile?: AtlasReferenceGradePlanetMaterialProfile;
  selectedBodyRingProfile?: AtlasSelectedBodyRingProfile;
  selectedBodyKeyLightProfile?: AtlasSelectedBodyKeyLightProfile;
  selectedBodyDepthLightingProfile?: AtlasSelectedBodyDepthLightingProfile;
  selectedBodyColorGradeProfile?: AtlasSelectedBodyColorGradeProfile;
  selectedBodySaturnRingArtProfile?: AtlasSelectedBodySaturnRingArtProfile;
  globalColorGradeProfile?: AtlasGlobalColorGradeProfile;
  closeupRingShowcaseProfile?: AtlasCloseupRingShowcaseProfile;
  ringColorMap?: THREE.Texture | null;
  ringAlphaMap?: THREE.Texture | null;
}) {
  const visualRendererProfile = useAtlasRuntimeStore((snapshot) => resolveAtlasVisualProfileV299(snapshot.visualProfile));
  const referenceGrade = referenceGradePlanetMaterialProfile === "gas-giant-ring-readability";
  const v49Ring = selectedBodyRingProfile === "saturn-cassini-layered-ring";
  const v51RingKeyFill = selectedBodyKeyLightProfile === "saturn-ring-key-fill";
  const v52RingDepth = selectedBodyDepthLightingProfile === "saturn-ring-shadow-depth";
  const v53RingColor = selectedBodyColorGradeProfile === "saturn-ring-occlusion-color-grade";
  const v55RingArt = selectedBodySaturnRingArtProfile === "saturn-cassini-backlit-ring-art";
  const v55GlobalGrade = globalColorGradeProfile === "filmic-cool-space-warm-planet-protection";
  const v50Showcase = closeupRingShowcaseProfile === "saturn-wide-tilted-ring-showcase";
  if (orbitAtlas) return <AtlasSaturnRings radiusScene={radiusScene} referenceGrade={referenceGrade} v49Ring={v49Ring} v50Showcase={v50Showcase} v51RingKeyFill={v51RingKeyFill} v52RingDepth={v52RingDepth} v53RingColor={v53RingColor} v55RingArt={v55RingArt} />;
  const opacityMul = (v50Showcase ? (v55RingArt ? V76_CLOSEUP_VISUAL_BUDGETS.saturnRing.showcaseOpacityMultiplier : v53RingColor ? 1.72 : v51RingKeyFill ? 1.64 : 1.86) : v55RingArt ? V76_CLOSEUP_VISUAL_BUDGETS.saturnRing.artOpacityMultiplier : v49Ring ? 1.52 : referenceGrade ? 1.18 : orbitAtlas ? 0.72 : 1) * visualRendererProfile.groups.solar.ringOpticalDepth;
  const mainRingColor = v55RingArt ? "#dbc08a" : v53RingColor ? "#d9c08f" : v52RingDepth ? "#dcc79b" : v51RingKeyFill ? "#e6cea0" : v50Showcase ? "#e0c990" : v49Ring ? "#d8c59a" : orbitAtlas ? "#b7aa8e" : "#d4c4a4";
  return (
    <group rotation={v50Showcase ? [-1.08, 0.12, -0.34] : v55RingArt ? [0.7, 0, -0.22] : v49Ring ? [0.72, 0, -0.18] : [0, 0, 0]}>
      {/* D Ring 鈥?faint inner ring */}
      <mesh
        rotation={[Math.PI / 2, 0, 0]}
        renderOrder={5}
        castShadow={false}
        receiveShadow={false}
      >
        <ringGeometry args={[radiusScene * 1.11, radiusScene * 1.24, 96]} />
        <meshStandardMaterial
          color="#9a8e78"
          transparent
          opacity={0.15 * opacityMul}
          side={THREE.DoubleSide}
          depthWrite={false}
          metalness={0.0}
          roughness={1}
        />
      </mesh>
      {/* C Ring 鈥?semi-transparent */}
      <mesh
        rotation={[Math.PI / 2, 0, 0]}
        renderOrder={5}
        castShadow={false}
        receiveShadow={false}
      >
        <ringGeometry args={[radiusScene * 1.24, radiusScene * 1.53, 96]} />
        <meshStandardMaterial
          color="#b8a888"
          emissive={v55RingArt ? "#7e6a48" : v51RingKeyFill ? "#b89d6b" : v50Showcase ? "#9a875d" : "#000000"}
          emissiveIntensity={v55RingArt ? 0.08 : v51RingKeyFill ? 0.2 : v50Showcase ? 0.16 : 0}
          transparent
          opacity={0.28 * opacityMul}
          side={THREE.DoubleSide}
          depthWrite={false}
          metalness={0.0}
          roughness={0.95}
        />
      </mesh>
      {/* B Ring 鈥?brightest, main ring */}
      <mesh
        rotation={[Math.PI / 2, 0, 0]}
        renderOrder={5}
        castShadow={false}
        receiveShadow={false}
      >
        <ringGeometry args={[radiusScene * 1.53, radiusScene * (v50Showcase ? 2.12 : v49Ring ? 2.02 : 1.95), 160]} />
        <meshStandardMaterial
          color={mainRingColor}
          map={ringColorMap ?? undefined}
          alphaMap={ringAlphaMap ?? undefined}
          emissive={v51RingKeyFill ? mainRingColor : v50Showcase ? mainRingColor : "#000000"}
          emissiveIntensity={v51RingKeyFill ? 0.25 : v50Showcase ? 0.22 : 0}
          transparent
          opacity={(v55RingArt ? V76_CLOSEUP_VISUAL_BUDGETS.saturnRing.mainRingOpacity : v50Showcase ? 0.68 : v52RingDepth ? 0.66 : 0.62) * opacityMul}
          side={THREE.DoubleSide}
          depthWrite={false}
          metalness={0.02}
          roughness={0.92}
        />
      </mesh>
      {/* Cassini Division gap 鈥?dark ring */}
      <mesh
        rotation={[Math.PI / 2, 0, 0]}
        renderOrder={5}
        castShadow={false}
        receiveShadow={false}
      >
        <ringGeometry args={[radiusScene * 1.98, radiusScene * 2.06, 128]} />
        <meshStandardMaterial
          color={v55RingArt ? "#211d18" : "#3a352e"}
          transparent
          opacity={v55RingArt ? V76_CLOSEUP_VISUAL_BUDGETS.saturnRing.cassiniGapOpacity : v50Showcase ? 0.08 : v49Ring ? 0.18 : orbitAtlas ? 0.2 : 0.12}
          side={THREE.DoubleSide}
          depthWrite={false}
          metalness={0.0}
          roughness={1}

        />
      </mesh>
      {/* A Ring 鈥?second brightest */}
      <mesh
        rotation={[Math.PI / 2, 0, 0]}
        renderOrder={5}
        castShadow={false}
        receiveShadow={false}
      >
        <ringGeometry args={[radiusScene * 2.06, radiusScene * (v50Showcase ? 2.58 : v55RingArt ? 2.52 : v49Ring ? 2.42 : 2.27), 160]} />
        <meshStandardMaterial
          color={v55RingArt ? "#cab58d" : "#c8b898"}
          emissive={v55RingArt ? "#8c7550" : v51RingKeyFill ? "#d7c49a" : v50Showcase ? "#c8b898" : "#000000"}
          emissiveIntensity={v55RingArt ? 0.06 : v51RingKeyFill ? 0.21 : v50Showcase ? 0.18 : 0}
          transparent
          opacity={(v55RingArt ? 0.44 : v50Showcase ? 0.56 : 0.5) * opacityMul}
          side={THREE.DoubleSide}
          depthWrite={false}
          metalness={0.02}
          roughness={0.94}
        />
      </mesh>
      {/* Encke Gap + F Ring 鈥?faint outer */}
      <mesh
        rotation={[Math.PI / 2, 0, 0]}
        renderOrder={5}
        castShadow={false}
        receiveShadow={false}
      >
        <ringGeometry args={[radiusScene * 2.43, radiusScene * (v50Showcase ? 3.05 : v55RingArt ? 2.92 : v49Ring ? 2.72 : 2.42), 160]} />
        <meshStandardMaterial
          color={v55RingArt ? "#ad9871" : "#a89878"}
          emissive={v55RingArt ? "#715d3e" : v50Showcase ? "#a89878" : "#000000"}
          emissiveIntensity={v55RingArt ? 0.045 : v50Showcase ? 0.1 : 0}
          transparent
          opacity={(v55GlobalGrade ? V76_CLOSEUP_VISUAL_BUDGETS.saturnRing.outerRingOpacity : 0.18) * opacityMul}
          side={THREE.DoubleSide}
          depthWrite={false}
          metalness={0.0}
          roughness={0.98}
        />
      </mesh>
    </group>
  );
}

/** Per-body refs needed for position updates, stored in a flat array. */
