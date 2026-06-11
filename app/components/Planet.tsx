"use client";

import type { ThreeEvent } from "@react-three/fiber";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import BodyLabel from "./BodyLabel";
import EarthAtmosphereGlow from "./EarthAtmosphereGlow";
import { useRelativisticOpticsStateRef } from "../context/RelativisticOpticsContext";
import { AU_TO_SCENE, SOLAR_SYSTEM_BODIES } from "../data/planetsJ2000";
import {
  applyDopplerTint,
  bodyVelScenePerRealSec,
  dopplerFrequencyRatio,
  lineOfSightBeta,
  opticsEffectStrength,
  searchlightBrightnessFactor,
} from "../lib/relativisticOptics";
import type { SolarSystemPhysicsRef } from "../lib/solarSystemRef";
import { useOptionalBloomSceneActions } from "../context/BloomSceneContext";
import { useOptionalLabelOcclusion } from "../context/LabelOcclusionContext";
import {
  DEFAULT_SPHERE_SEGMENTS,
  getSharedPlanetGlowTexture,
  MIN_PLANET_ICON_PX,
  SPRITE_LOD_ENTER_PX,
  SPRITE_LOD_EXIT_PX,
} from "../lib/celestialTextures";
import { VISUAL_CALIBRATION } from "../lib/visualCalibration";
import { solarOcclusionFactor } from "../lib/solarOcclusion";

const OCCLUSION_TARGETS = new Set(["earth", "moon", "jupiter", "saturn"]);
const SOLAR_BODY_IDS = SOLAR_SYSTEM_BODIES.map((body) => body.id);

const illuminatedLayerVertexShader = `
  varying vec2 vUvLayer;
  varying vec3 vNormalWorldLayer;
  #include <common>
  #include <logdepthbuf_pars_vertex>
  void main() {
    vUvLayer = uv;
    vNormalWorldLayer = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    #include <logdepthbuf_vertex>
  }
`;

const nightLayerFragmentShader = `
  uniform sampler2D uMap;
  uniform vec3 uSunDirection;
  uniform float uIntensity;
  uniform float uSolarVisibility;
  uniform float uTerminatorFeather;
  uniform float uNightCutoff;
  varying vec2 vUvLayer;
  varying vec3 vNormalWorldLayer;
  #include <logdepthbuf_pars_fragment>
  void main() {
    vec3 texel = texture2D(uMap, vUvLayer).rgb;
    float sunDot = dot(normalize(vNormalWorldLayer), normalize(uSunDirection));
    float night = 1.0 - smoothstep(-0.16 - uTerminatorFeather, 0.12 + uTerminatorFeather, sunDot);
    night *= 1.0 - uSolarVisibility * smoothstep(-0.03, 0.18, sunDot);
    night *= 1.0 - smoothstep(uNightCutoff, uNightCutoff + 0.24, sunDot);
    float luminance = dot(texel, vec3(0.2126, 0.7152, 0.0722));
    gl_FragColor = vec4(texel * uIntensity * night, luminance * night);
    #include <logdepthbuf_fragment>
  }
`;

const cloudLayerFragmentShader = `
  uniform sampler2D uMap;
  uniform vec3 uSunDirection;
  uniform float uDayOpacity;
  uniform float uNightOpacity;
  uniform float uSolarVisibility;
  uniform float uTerminatorFeather;
  uniform float uSilverLining;
  varying vec2 vUvLayer;
  varying vec3 vNormalWorldLayer;
  #include <logdepthbuf_pars_fragment>
  void main() {
    vec4 texel = texture2D(uMap, vUvLayer);
    float density = max(texel.a, dot(texel.rgb, vec3(0.3333)));
    float sunDot = dot(normalize(vNormalWorldLayer), normalize(uSunDirection));
    float day = smoothstep(-0.22 - uTerminatorFeather, 0.48 + uTerminatorFeather, sunDot) * uSolarVisibility;
    float edge = smoothstep(-0.12, 0.1, sunDot) * (1.0 - smoothstep(0.1, 0.42, sunDot));
    float opacity = mix(uNightOpacity, uDayOpacity, day) * density;
    vec3 color = mix(vec3(0.32, 0.38, 0.46), vec3(1.0, 0.98, 0.94), day);
    color += vec3(0.18, 0.22, 0.28) * edge * uSilverLining * uSolarVisibility;
    gl_FragColor = vec4(color, opacity);
    #include <logdepthbuf_fragment>
  }
`;

const cloudShadowFragmentShader = `
  uniform sampler2D uMap;
  uniform vec3 uSunDirection;
  uniform float uSolarVisibility;
  varying vec2 vUvLayer;
  varying vec3 vNormalWorldLayer;
  #include <logdepthbuf_pars_fragment>
  void main() {
    vec4 texel = texture2D(uMap, vUvLayer);
    float density = max(texel.a, dot(texel.rgb, vec3(0.3333)));
    float sunDot = dot(normalize(vNormalWorldLayer), normalize(uSunDirection));
    float day = smoothstep(-0.08, 0.42, sunDot) * uSolarVisibility;
    float shadow = density * day * 0.2;
    gl_FragColor = vec4(vec3(0.12), shadow);
    #include <logdepthbuf_fragment>
  }
`;

export type PlanetBodyProps = {
  variant: "planet";
  bodyId?: string;
  radius?: number;
  position?: [number, number, number];
  sunEmissiveIntensity?: number;
  sunCoronaRadiusScale?: number;
  sunCoronaOpacity?: number;
  map?: THREE.Texture | null;
  nightMap?: THREE.Texture | null;
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
  illuminationBodyIndex?: number;
  illuminationPhysicsRef?: MutableRefObject<SolarSystemPhysicsRef | null>;
  normalScaleIntensity?: number;
  calibratedEnvMapIntensity?: number;
  calibratedFillIntensity?: number;
  calibratedRimIntensity?: number;
  calibratedBandContrast?: number;
  calibratedCloudSilverLining?: number;
  calibratedNightTerminatorCutoff?: number;
  /** Sim-driven visual spin angle; affects surface/clouds only, not physics or labels. */
  spinAngleRef?: MutableRefObject<number>;
};

export default function Planet({
  variant: _variant,
  bodyId,
  radius = 1,
  position = [0, 0, 0],
  map = null,
  nightMap = null,
  normalMap = null,
  roughnessMap = null,
  color,
  emissive,
  emissiveIntensity = 0,
  roughness = 0.82,
  metalness = 0.04,
  envMapIntensity = 0,
  sphereSegments = DEFAULT_SPHERE_SEGMENTS,
  label,
  labelFadeNear,
  labelFadeFar,
  labelDistanceFactor,
  labelFontSizePx,
  labelBodyIndex,
  labelSurfaceFadeNear,
  labelSurfaceFadeFar,
  labelLodDiscWorldRadius,
  onBodyPointerDown,
  onBodyDoubleClick,
  selected = false,
  opticsBodyIndex,
  opticsPhysicsRef,
  showAtmosphere = false,
  atmosphereColor = "#4488ff",
  clouds = null,
  illuminationBodyIndex,
  illuminationPhysicsRef,
  normalScaleIntensity = 1.9,
  calibratedEnvMapIntensity,
  calibratedFillIntensity,
  calibratedRimIntensity,
  calibratedBandContrast,
  calibratedCloudSilverLining,
  calibratedNightTerminatorCutoff,
  spinAngleRef,
}: PlanetBodyProps) {
  const [wSeg, hSeg] = sphereSegments;
  const visualRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const cloudShadowRef = useRef<THREE.Mesh>(null);
  const nightLayerRef = useRef<THREE.Mesh>(null);
  const nightMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const cloudMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const cloudShadowMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const spriteRef = useRef<THREE.Sprite>(null);
  const lastPointerDownMs = useRef(0);
  const bloomActions = useOptionalBloomSceneActions();
  const labelOcclusion = useOptionalLabelOcclusion();
  const { camera, size } = useThree();
  const opticsStateRef = useRelativisticOpticsStateRef();
  const worldPos = useMemo(() => new THREE.Vector3(), []);
  const baseColorStore = useRef(new THREE.Color());
  const baseEmissiveStore = useRef(0);
  const tmpBodyVel = useRef(new THREE.Vector3());
  const tmpRel = useRef(new THREE.Vector3());
  const tmpN = useRef(new THREE.Vector3());
  const shiftedColor = useRef(new THREE.Color());
  const spriteLodRef = useRef(false);
  const [spriteTex, setSpriteTex] = useState<THREE.CanvasTexture | null>(null);
  const closeQualityRef = useRef(false);
  const closeLightRef = useRef(0);
  const solarVisibilityRef = useRef(1);
  const occlusionFrameRef = useRef(0);
  const sunDirectionWorld = useRef(new THREE.Vector3(1, 0, 0));
  const nightUniforms = useMemo(() => ({
    uMap: { value: nightMap },
    uSunDirection: { value: sunDirectionWorld.current.clone() },
    uIntensity: { value: VISUAL_CALIBRATION.closeups.earth.nightIntensity },
    uSolarVisibility: { value: 1 },
    uTerminatorFeather: { value: VISUAL_CALIBRATION.closeups.earth.terminatorFeather },
    uNightCutoff: { value: calibratedNightTerminatorCutoff ?? VISUAL_CALIBRATION.closeups.earth.nightTerminatorCutoff },
  }), [calibratedNightTerminatorCutoff, nightMap]);
  const cloudUniforms = useMemo(() => ({
    uMap: { value: clouds },
    uSunDirection: { value: sunDirectionWorld.current.clone() },
    uDayOpacity: { value: VISUAL_CALIBRATION.closeups.earth.cloudDayOpacity },
    uNightOpacity: { value: VISUAL_CALIBRATION.closeups.earth.cloudNightOpacity },
    uSolarVisibility: { value: 1 },
    uTerminatorFeather: { value: VISUAL_CALIBRATION.closeups.earth.terminatorFeather },
    uSilverLining: { value: calibratedCloudSilverLining ?? VISUAL_CALIBRATION.closeups.earth.cloudSilverLining },
  }), [calibratedCloudSilverLining, clouds]);
  const cloudShadowUniforms = useMemo(() => ({
    uMap: { value: clouds },
    uSunDirection: { value: sunDirectionWorld.current.clone() },
    uSolarVisibility: { value: 1 },
  }), [clouds]);

  useLayoutEffect(() => {
    setSpriteTex(getSharedPlanetGlowTexture());
  }, []);

  // Track which bloom targets are currently registered (imperative, no React re-render).
  const bloomMeshRegistered = useRef(false);
  const bloomSpriteRegistered = useRef(false);

  // Register initial bloom target (mesh mode) and clean up on unmount.
  useLayoutEffect(() => {
    const mesh = visualRef.current;
    if (!bloomActions || !mesh) return;
    if (!spriteLodRef.current) {
      bloomActions.registerBloomTarget(mesh);
      bloomMeshRegistered.current = true;
    }
    return () => {
      if (bloomMeshRegistered.current) {
        bloomActions.unregisterBloomTarget(mesh);
        bloomMeshRegistered.current = false;
      }
      const sp = spriteRef.current;
      if (sp && bloomSpriteRegistered.current) {
        bloomActions.unregisterBloomTarget(sp);
        bloomSpriteRegistered.current = false;
      }
    };
  }, [bloomActions]);

  useFrame((_, dt) => {
    const mesh = visualRef.current;
    if (!mesh) return;
    if (spinAngleRef) {
      mesh.rotation.y = spinAngleRef.current;
      if (cloudsRef.current) cloudsRef.current.rotation.y = spinAngleRef.current * 1.018;
      if (cloudShadowRef.current) cloudShadowRef.current.rotation.y = spinAngleRef.current * 1.018;
      if (nightLayerRef.current) nightLayerRef.current.rotation.y = spinAngleRef.current;
    }
    const illumination = illuminationPhysicsRef?.current;
    if (
      illumination &&
      illuminationBodyIndex !== undefined &&
      illuminationBodyIndex >= 0 &&
      illuminationBodyIndex < illumination.n
    ) {
      const offset = illuminationBodyIndex * 3;
      sunDirectionWorld.current.set(
        (illumination.posAu[0] ?? 0) - (illumination.posAu[offset] ?? 0),
        (illumination.posAu[1] ?? 0) - (illumination.posAu[offset + 1] ?? 0),
        (illumination.posAu[2] ?? 0) - (illumination.posAu[offset + 2] ?? 0),
      ).normalize();
      nightMaterialRef.current?.uniforms.uSunDirection.value.copy(sunDirectionWorld.current);
      cloudMaterialRef.current?.uniforms.uSunDirection.value.copy(sunDirectionWorld.current);
      cloudShadowMaterialRef.current?.uniforms.uSunDirection.value.copy(sunDirectionWorld.current);
      occlusionFrameRef.current += 1;
      if (occlusionFrameRef.current % 12 === 1) {
        solarVisibilityRef.current =
          bodyId && OCCLUSION_TARGETS.has(bodyId)
            ? solarOcclusionFactor(illumination, illuminationBodyIndex, SOLAR_BODY_IDS)
            : 1;
      }
      if (cloudMaterialRef.current) {
        cloudMaterialRef.current.uniforms.uSolarVisibility.value = solarVisibilityRef.current;
      }
      if (cloudShadowMaterialRef.current) {
        cloudShadowMaterialRef.current.uniforms.uSolarVisibility.value = solarVisibilityRef.current;
      }
      if (nightMaterialRef.current) {
        nightMaterialRef.current.uniforms.uSolarVisibility.value = solarVisibilityRef.current;
        nightMaterialRef.current.uniforms.uNightCutoff.value =
          calibratedNightTerminatorCutoff ?? VISUAL_CALIBRATION.closeups.earth.nightTerminatorCutoff;
      }
      limbMaterial.uniforms.uOpacity.value =
        (showAtmosphere ? 0.32 : 0.13) *
        (calibratedRimIntensity ?? VISUAL_CALIBRATION.planets.rimIntensity) *
        (0.18 + 0.82 * solarVisibilityRef.current);
    }
    mesh.getWorldPosition(worldPos);
    const dist = worldPos.distanceTo(camera.position);
    const persp = camera as THREE.PerspectiveCamera;
    if (!persp.isPerspectiveCamera || dist < 1e-8) return;
    const vFov = (persp.fov * Math.PI) / 180;
    const frustumH = 2 * Math.tan(vFov / 2) * dist;
    const diameterPx = ((2 * radius) / frustumH) * size.height;

  const wasSprite = spriteLodRef.current;
    let next = wasSprite;
    closeQualityRef.current = selected || diameterPx > 92;
    if (closeQualityRef.current) {
      next = false;
    } else if (!wasSprite && diameterPx < SPRITE_LOD_ENTER_PX) next = true;
    if (wasSprite && diameterPx > SPRITE_LOD_EXIT_PX) next = false;
    if (next !== wasSprite) {
      spriteLodRef.current = next;
      // Imperative visibility toggle — no React setState, no re-render flicker.
      mesh.visible = !next;
      const sp = spriteRef.current;
      if (sp) sp.visible = next;
      // Handle bloom registration imperatively.
      if (bloomActions) {
        if (next) {
          // Switching to sprite: unregister mesh, register sprite.
          if (bloomMeshRegistered.current) {
            bloomActions.unregisterBloomTarget(mesh);
            bloomMeshRegistered.current = false;
          }
          if (sp && !bloomSpriteRegistered.current) {
            bloomActions.registerBloomTarget(sp);
            bloomSpriteRegistered.current = true;
          }
        } else {
          // Switching to mesh: unregister sprite, register mesh.
          if (sp && bloomSpriteRegistered.current) {
            bloomActions.unregisterBloomTarget(sp);
            bloomSpriteRegistered.current = false;
          }
          if (!bloomMeshRegistered.current) {
            bloomActions.registerBloomTarget(mesh);
            bloomMeshRegistered.current = true;
          }
        }
      }
    }

    if (next && spriteRef.current && frustumH > 1e-8) {
      const targetPx = Math.max(MIN_PLANET_ICON_PX, diameterPx);
      const world = (targetPx / size.height) * frustumH;
      spriteRef.current.scale.setScalar(world);
    }

    const mat = mesh?.material as THREE.MeshPhysicalMaterial | undefined;
    const closeLight = closeQualityRef.current ? 1 : 0;
    closeLightRef.current = THREE.MathUtils.lerp(
      closeLightRef.current,
      closeLight,
      1 - Math.pow(0.0015, Math.max(0.001, dt))
    );
    const fillBase = calibratedFillIntensity ?? (showAtmosphere ? 0.18 : 0.1);
    const textureFill = nightMap
      ? fillBase * (0.55 + closeLightRef.current * 1.15)
      : map
        ? closeLightRef.current * fillBase * (showAtmosphere ? 1.6 : 1.25)
        : 0;
    const st = opticsStateRef?.current;
    const spMat = spriteRef.current?.material as THREE.SpriteMaterial | undefined;
    if (
      opticsBodyIndex === undefined ||
      !opticsPhysicsRef ||
      !mat ||
      !st
    ) {
      if (mat) mat.color.copy(baseColorStore.current).multiplyScalar(0.42 + 0.58 * solarVisibilityRef.current);
      if (mat) mat.emissiveIntensity = Math.max(baseEmissiveStore.current, textureFill) * (0.45 + 0.55 * solarVisibilityRef.current);
      if (spMat) spMat.color.copy(baseColorStore.current);
      return;
    }
    if (!st.active) {
      mat.color.copy(baseColorStore.current).multiplyScalar(0.42 + 0.58 * solarVisibilityRef.current);
      mat.emissiveIntensity = Math.max(baseEmissiveStore.current, textureFill) * (0.45 + 0.55 * solarVisibilityRef.current);
      if (spMat) spMat.color.copy(baseColorStore.current);
      return;
    }
    const p = opticsPhysicsRef.current;
    if (!p || opticsBodyIndex < 0 || opticsBodyIndex >= p.n) {
      mat.color.copy(baseColorStore.current).multiplyScalar(0.42 + 0.58 * solarVisibilityRef.current);
      mat.emissiveIntensity = Math.max(baseEmissiveStore.current, textureFill) * (0.45 + 0.55 * solarVisibilityRef.current);
      if (spMat) spMat.color.copy(baseColorStore.current);
      return;
    }
    const k = 3 * opticsBodyIndex;
    tmpBodyVel.current.set(
      p.velM[k]!,
      p.velM[k + 1]!,
      p.velM[k + 2]!,
    );
    bodyVelScenePerRealSec(
      tmpBodyVel.current,
      AU_TO_SCENE,
      st.daysPerSecond,
      tmpBodyVel.current,
    );
    const betaLos = lineOfSightBeta(
      worldPos,
      tmpBodyVel.current,
      camera.position,
      st.camVelScenePerReal,
      st.cEffScenePerReal,
      tmpRel.current,
      tmpN.current,
    );
    const strength = opticsEffectStrength(
      betaLos,
      st.daysPerSecond,
      st.relativityPhysicsOn,
    );
    const ratio = dopplerFrequencyRatio(betaLos);
    applyDopplerTint(baseColorStore.current, ratio, strength, shiftedColor.current);
    const g = searchlightBrightnessFactor(betaLos, strength);
    const bright = THREE.MathUtils.clamp(Math.sqrt(g), 0.62, 1.5);
    mat.color.copy(shiftedColor.current).multiplyScalar(bright);
    mat.emissiveIntensity = THREE.MathUtils.clamp(
      Math.max(baseEmissiveStore.current * g, textureFill * 0.78),
      0,
      3,
    );
    if (spMat) {
      spMat.color.copy(shiftedColor.current).multiplyScalar(bright);
    }
  });

  const pickRadius = useMemo(
    () => Math.max(radius * 10, 0.72),
    [radius]
  );

  useLayoutEffect(() => {
    const mesh = visualRef.current;
    if (!mesh || labelBodyIndex === undefined || !labelOcclusion) return;
    labelOcclusion.registerOccluder(mesh, labelBodyIndex);
    return () => labelOcclusion.unregisterOccluder(mesh);
  }, [labelOcclusion, labelBodyIndex, radius]);

  const planetColor = useMemo(() => {
    if (color !== undefined) return new THREE.Color(color);
    return new THREE.Color("#c8c8d8");
  }, [color]);

  const emissiveBaseColor = useMemo(() => {
    if (emissive !== undefined && emissive !== null) {
      const ec = new THREE.Color(emissive as THREE.ColorRepresentation);
      if (ec.r + ec.g + ec.b > 1e-5) return ec;
    }
    return planetColor.clone();
  }, [emissive, planetColor]);

  useLayoutEffect(() => {
    baseColorStore.current.copy(planetColor);
    baseEmissiveStore.current = emissiveIntensity;
  }, [planetColor, emissiveIntensity]);

  const spriteTint = useMemo(() => {
    const c = planetColor.clone();
    const t = Math.min(0.58, emissiveIntensity * 0.14 + 0.32);
    c.lerp(emissiveBaseColor, t);
    return c;
  }, [planetColor, emissiveBaseColor, emissiveIntensity]);

  const normalScale = useMemo(
    () => new THREE.Vector2(normalScaleIntensity, normalScaleIntensity),
    [normalScaleIntensity]
  );

  const limbMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        depthTest: true,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
        side: THREE.FrontSide,
        uniforms: {
          uColor: { value: planetColor.clone().lerp(new THREE.Color("#9fc8ff"), showAtmosphere ? 0.62 : 0.24) },
          uOpacity: { value: (showAtmosphere ? 0.32 : 0.13) * (calibratedRimIntensity ?? VISUAL_CALIBRATION.planets.rimIntensity) },
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vView;
          #include <common>
          #include <logdepthbuf_pars_vertex>
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vView = mv.xyz;
            gl_Position = projectionMatrix * mv;
            #include <logdepthbuf_vertex>
          }
        `,
        fragmentShader: `
          varying vec3 vNormal;
          varying vec3 vView;
          uniform vec3 uColor;
          uniform float uOpacity;
          #include <logdepthbuf_pars_fragment>
          void main() {
            float rim = pow(1.0 - max(dot(normalize(vNormal), normalize(-vView)), 0.0), 2.7);
            float edge = smoothstep(0.18, 1.0, rim);
            gl_FragColor = vec4(uColor, edge * uOpacity);
            #include <logdepthbuf_fragment>
          }
        `,
      }),
    [calibratedRimIntensity, planetColor, showAtmosphere]
  );

  useLayoutEffect(() => {
    return () => {
      limbMaterial.dispose();
    };
  }, [limbMaterial]);

  const handlePickPointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      onBodyPointerDown?.(e);
      const now = performance.now();
      if (now - lastPointerDownMs.current < 420) {
        lastPointerDownMs.current = 0;
        onBodyDoubleClick?.(e);
      } else {
        lastPointerDownMs.current = now;
      }
    },
    [onBodyPointerDown, onBodyDoubleClick]
  );

  return (
    <group position={position} frustumCulled={false}>
      <mesh renderOrder={3} onPointerDown={handlePickPointerDown}>
        <sphereGeometry args={[pickRadius, Math.max(20, wSeg / 6), Math.max(20, hSeg / 6)]} />
        <meshBasicMaterial
          transparent
          opacity={0}
          depthWrite={false}
          depthTest
          side={THREE.DoubleSide}
          wireframe={false}
        />
      </mesh>
      <mesh
        ref={visualRef}
        renderOrder={2}
        visible={true}
        castShadow
        receiveShadow
        frustumCulled={false}
      >
        <sphereGeometry args={[radius, wSeg, hSeg]} />
        <meshPhysicalMaterial
          color={planetColor}
          map={map ?? undefined}
          normalMap={normalMap ?? undefined}
          normalScale={normalMap ? normalScale : undefined}
          bumpMap={!normalMap && map ? map : undefined}
          bumpScale={!normalMap && map ? radius * 0.024 : 0}
          roughnessMap={roughnessMap ?? undefined}
          roughness={Math.max(0.48, roughness)}
          metalness={metalness}
          emissive={map ? "#ffffff" : emissiveBaseColor}
          emissiveMap={map ?? undefined}
          emissiveIntensity={Math.max(emissiveIntensity * (selected ? 0.68 : 0.5), selected ? (map ? 0.12 : 0.1) : 0)}
          envMapIntensity={calibratedEnvMapIntensity ?? (selected ? Math.min(Math.max(envMapIntensity, 0.18), 0.32) : Math.min(Math.max(envMapIntensity, 0.08), 0.2))}
          clearcoat={selected ? 0.2 : showAtmosphere ? 0.18 : 0.055}
          clearcoatRoughness={showAtmosphere ? 0.38 : 0.78}
          sheen={showAtmosphere ? 0.16 : 0.035}
          sheenRoughness={0.72}
          iridescence={bodyId === "jupiter" || bodyId === "saturn" ? Math.min(0.1, calibratedBandContrast ?? 0) : 0}
          iridescenceIOR={1.2}
          wireframe={false}
        />
      </mesh>
      <mesh renderOrder={3} frustumCulled={false}>
        <sphereGeometry args={[radius * (showAtmosphere ? 1.018 : 1.01), wSeg, hSeg]} />
        <primitive object={limbMaterial} attach="material" />
      </mesh>
      {spriteTex ? (
        <sprite ref={spriteRef} visible={false} renderOrder={2}>
          <spriteMaterial
            map={spriteTex}
            color={planetColor}
            transparent
            opacity={1}
            toneMapped={false}
            depthTest
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
      ) : null}
      {showAtmosphere ? (
        <EarthAtmosphereGlow
          radius={radius}
          atmosphereColor={atmosphereColor}
          atmosphereIntensity={bodyId === "earth" ? VISUAL_CALIBRATION.closeups.earth.atmosphereIntensity : undefined}
        />
      ) : null}
      {bodyId === "earth" && nightMap ? (
        <mesh ref={nightLayerRef} renderOrder={4} frustumCulled={false}>
          <sphereGeometry args={[radius * 1.002, wSeg, hSeg]} />
          <shaderMaterial
            ref={nightMaterialRef}
            vertexShader={illuminatedLayerVertexShader}
            fragmentShader={nightLayerFragmentShader}
            uniforms={nightUniforms}
            transparent
            depthWrite={false}
            depthTest
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      ) : null}
      {bodyId === "earth" && clouds ? (
        <>
          <mesh ref={cloudShadowRef} renderOrder={3} frustumCulled={false}>
            <sphereGeometry args={[radius * 1.0035, wSeg, hSeg]} />
            <shaderMaterial
              ref={cloudShadowMaterialRef}
              vertexShader={illuminatedLayerVertexShader}
              fragmentShader={cloudShadowFragmentShader}
              uniforms={cloudShadowUniforms}
              transparent
              depthWrite={false}
              depthTest
              blending={THREE.MultiplyBlending}
            />
          </mesh>
          <mesh ref={cloudsRef} renderOrder={4} frustumCulled={false}>
            <sphereGeometry args={[radius * 1.008, wSeg, hSeg]} />
            <shaderMaterial
              ref={cloudMaterialRef}
              vertexShader={illuminatedLayerVertexShader}
              fragmentShader={cloudLayerFragmentShader}
              uniforms={cloudUniforms}
              transparent
              depthWrite={false}
              depthTest
              blending={THREE.NormalBlending}
            />
          </mesh>
        </>
      ) : clouds ? (
        <mesh ref={cloudsRef} renderOrder={4} frustumCulled={false}>
          <sphereGeometry args={[radius * 1.008, wSeg, hSeg]} />
          <meshStandardMaterial
            map={clouds}
            transparent
            opacity={0.5 * VISUAL_CALIBRATION.planets.cloudIntensity}
            depthWrite={false}
            depthTest
            metalness={0}
            roughness={1}
          />
        </mesh>
      ) : null}
      {label ? (
        <BodyLabel
          text={label}
          position={[0, radius * 1.32, 0]}
          fadeNear={labelFadeNear}
          fadeFar={labelFadeFar}
          distanceFactor={labelDistanceFactor}
          fontSizePx={labelFontSizePx}
          bodyIndex={labelBodyIndex}
          surfaceFadeNear={labelSurfaceFadeNear}
          surfaceFadeFar={labelSurfaceFadeFar}
          lodDiscWorldRadius={labelLodDiscWorldRadius ?? radius}
        />
      ) : null}
    </group>
  );
}
