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
} from "react";
import BodyLabel from "./BodyLabel";
import { AU_TO_SCENE } from "../data/planetsJ2000";
import { useOptionalBloomSceneActions } from "../context/BloomSceneContext";
import { useOptionalLabelOcclusion } from "../context/LabelOcclusionContext";
import {
  DEFAULT_SPHERE_SEGMENTS,
  getSunHaloGlowTexture,
} from "../lib/celestialTextures";
import { V76_CLOSEUP_VISUAL_BUDGETS } from "../lib/atlasCloseupVisualFidelity";
import type { SunBodyProps } from "./SunBodyProps";
import { useAtlasRuntimeStore } from "../lib/atlasRuntimeStore";
import { resolveAtlasVisualProfileV299 } from "../lib/atlasVisualProfileV299";
export type { SunBodyProps } from "./SunBodyProps";

const SHADOW_FAR_DIST = 4200;
const SHADOW_MAP_NEAR = 1024;
const SHADOW_MAP_FAR = 512;
const _detailBodyPos = new THREE.Vector3();
const _solarBackdropDir = new THREE.Vector3();
const _solarBackdropLocal = new THREE.Vector3();
const _solarBackdropOrigin = new THREE.Vector3();

export default function SunBody({
  radius = 1,
  position = [0, 0, 0],
  map = null,
  sunCastPointLight = true,
  pointLightIntensity = 1200,
  pointLightColor = "#fff4e6",
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
  detailShadowBodyIndex,
  detailShadowPhysicsRef,
  detailShadowMaxCameraDist,
  spinAngleRef,
  atlasVisualProfile,
  cinematicLightingProfile = "overview",
  referenceGradePlanetMaterialProfile = "overview-local-hd",
  selectedBodyMaterialProfile = "overview-local-material",
  selectedBodyAtmosphereDepthProfile = "overview-atmosphere",
  selectedBodyTerminatorProfile = "overview-terminator",
  selectedBodyKeyLightProfile = "overview-natural-phase",
  selectedBodyDepthLightingProfile = "overview-no-depth-lighting",
  selectedBodyColorGradeProfile = "overview-neutral-color",
  selectedBodySolarSurfaceProfile = "overview-no-solar-surface-art",
  globalColorGradeProfile = "overview-neutral-grade",
}: SunBodyProps) {
  const [wSeg] = sphereSegments;
  const meshRef = useRef<THREE.Mesh>(null);
  const solarBackdropRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Sprite>(null);
  const prominenceRef = useRef<THREE.Group>(null);
  const sunLightRef = useRef<THREE.PointLight>(null);
  const lastPointerDownMs = useRef(0);
  const bloomActions = useOptionalBloomSceneActions();
  const labelOcclusion = useOptionalLabelOcclusion();
  const { camera, size } = useThree();
  const visualRendererProfile = useAtlasRuntimeStore((snapshot) => resolveAtlasVisualProfileV299(snapshot.visualProfile));
  const sunWorld = useRef(new THREE.Vector3());
  const shadowMapSizeRef = useRef(SHADOW_MAP_NEAR);
  const shadowMapCooldownRef = useRef(0);
  const shadowAuditFrameRef = useRef(0);
  const [haloTex, setHaloTex] = useState<THREE.CanvasTexture | null>(null);
  const atlasSun = atlasVisualProfile === "sun";
  const solarCloseup = selected || cinematicLightingProfile === "solar-closeup";
  const referenceSolar = referenceGradePlanetMaterialProfile === "solar-edge-controlled";
  const v49SolarMaterial = selectedBodyMaterialProfile === "solar-granulation-depth";
  const v49SolarAtmosphere = selectedBodyAtmosphereDepthProfile === "solar-edge-controlled-depth";
  const v49SolarTerminator = selectedBodyTerminatorProfile === "solar-limb-darkening";
  const v51SolarKey = selectedBodyKeyLightProfile === "solar-surface-edge-key";
  const v52SolarDepth = selectedBodyDepthLightingProfile === "solar-granulation-limb-depth";
  const v53SolarColor = selectedBodyColorGradeProfile === "solar-photosphere-color-depth";
  const v55SolarSurface = selectedBodySolarSurfaceProfile === "solar-granulation-controlled-corona-art";
  const v55GlobalColor = globalColorGradeProfile === "filmic-cool-space-warm-planet-protection";
  const v49SolarEdge = v49SolarAtmosphere || v49SolarTerminator;
  const mobileSolarCloseup = solarCloseup && size.width < 640;
  const mobileSolarAttenuation = mobileSolarCloseup ? 0.28 : 1;

  const glowMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
        side: THREE.FrontSide,
        uniforms: {
          uColor: { value: new THREE.Color("#ff4a12") },
          uPower: { value: 1.95 },
          uPulse: { value: 1.0 },
          uOpacity: { value: 0.32 },
        },
        vertexShader: `
          varying vec3 vNrm;
          varying vec3 vView;
          #include <common>
          #include <logdepthbuf_pars_vertex>
          void main() {
            vNrm = normalize(normalMatrix * normal);
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vView = mv.xyz;
            gl_Position = projectionMatrix * mv;
            #include <logdepthbuf_vertex>
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          uniform float uPower;
          uniform float uPulse;
          uniform float uOpacity;
          varying vec3 vNrm;
          varying vec3 vView;
          #include <logdepthbuf_pars_fragment>
          void main() {
            float fresnel = pow(1.0 - abs(dot(normalize(vNrm), normalize(-vView))), uPower);
            float shell = smoothstep(0.0, 1.0, fresnel) * uPulse;
            gl_FragColor = vec4(uColor, shell * uOpacity);
            #include <logdepthbuf_fragment>
          }
        `,
      }),
    [],
  );

  useLayoutEffect(() => {
    setHaloTex(getSunHaloGlowTexture());
  }, []);

  useLayoutEffect(() => {
    if (!bloomActions || !sunCastPointLight) return;
    bloomActions.bindSunLight(sunLightRef.current);
    return () => bloomActions.bindSunLight(null);
  }, [bloomActions, sunCastPointLight]);

  useLayoutEffect(() => {
    const L = sunLightRef.current;
    if (!L || !sunCastPointLight) return;
    L.shadow.mapSize.setScalar(SHADOW_MAP_NEAR);
    L.shadow.bias = -0.0001;
    L.shadow.normalBias = 0.09;
    const cam = L.shadow.camera;
    cam.near = 0.5;
    cam.far = 10000;
  }, [sunCastPointLight]);

  useFrame((state) => {
    shadowAuditFrameRef.current += 1;
    const L = sunLightRef.current;
    const mesh = meshRef.current;
    const halo = haloRef.current;
    const t = state.clock.elapsedTime;

    if (mesh) {
      if (spinAngleRef) {
        mesh.rotation.y = spinAngleRef.current;
      } else {
        mesh.rotation.y += 0.0012;
      }
    }
    if (halo) {
      const pulse = 1 + Math.sin(t * 0.7) * 0.02;
      halo.scale.setScalar(radius * (solarCloseup ? v55SolarSurface ? 1.07 : v53SolarColor ? 1.12 : v52SolarDepth ? 1.18 : v51SolarKey ? 1.26 : v49SolarMaterial ? 1.36 : referenceSolar ? 1.5 : 1.72 : atlasSun ? 3.4 : 4.75) * pulse);
    }
    if (prominenceRef.current) {
      prominenceRef.current.visible = !solarCloseup;
      prominenceRef.current.rotation.y += 0.0018;
      prominenceRef.current.rotation.z = Math.sin(t * 0.18) * 0.08;
    }
    if (solarBackdropRef.current) {
      const backdrop = solarBackdropRef.current;
      backdrop.visible = solarCloseup;
      if (solarCloseup && camera instanceof THREE.PerspectiveCamera) {
        const distance = 18;
        camera.getWorldDirection(_solarBackdropDir);
        _solarBackdropOrigin.set(position[0], position[1], position[2]);
        _solarBackdropLocal
          .copy(camera.position)
          .addScaledVector(_solarBackdropDir, distance)
          .sub(_solarBackdropOrigin);
        backdrop.position.copy(_solarBackdropLocal);
        backdrop.quaternion.copy(camera.quaternion);
        const fov = THREE.MathUtils.degToRad(camera.fov);
        const height = 2 * Math.tan(fov * 0.5) * distance;
        const width = height * (size.width / Math.max(1, size.height));
        backdrop.scale.set(width * 1.08, height * 1.08, 1);
      }
    }
    glowMat.uniforms.uColor.value.set(solarCloseup ? "#ffb15f" : "#ff4a12");
    glowMat.uniforms.uPower.value = solarCloseup ? v55SolarSurface ? 6.2 : v53SolarColor ? 5.8 : v52SolarDepth ? 5.45 : v51SolarKey ? 5.1 : v49SolarEdge ? 4.8 : referenceSolar ? 4.45 : 4.1 : 1.95;
    glowMat.uniforms.uOpacity.value = (solarCloseup ? (mobileSolarCloseup ? V76_CLOSEUP_VISUAL_BUDGETS.sun.mobileGlowOpacity : V76_CLOSEUP_VISUAL_BUDGETS.sun.glowOpacity) : 0.32) * visualRendererProfile.groups.solar.sunSurfaceLuminance;
    glowMat.uniforms.uPulse.value = solarCloseup ? 0.55 + Math.sin(t * 0.32) * 0.025 : 0.72 + Math.sin(t * 0.55) * 0.035;

    if (L?.castShadow && mesh && shadowAuditFrameRef.current % 72 === 0) {
      mesh.getWorldPosition(sunWorld.current);
      const d = camera.position.distanceTo(sunWorld.current);
      let want = d > SHADOW_FAR_DIST ? SHADOW_MAP_FAR : SHADOW_MAP_NEAR;
      if (
        detailShadowBodyIndex != null &&
        detailShadowBodyIndex >= 0 &&
        detailShadowPhysicsRef?.current
      ) {
        const pr = detailShadowPhysicsRef.current;
        const bi = detailShadowBodyIndex;
        if (bi < pr.n) {
          const j = bi * 3;
          const u = AU_TO_SCENE;
          _detailBodyPos.set(
            pr.posAu[j]! * u,
            pr.posAu[j + 1]! * u,
            pr.posAu[j + 2]! * u,
          );
          if (
            camera.position.distanceTo(_detailBodyPos) <
            (detailShadowMaxCameraDist ?? 1400)
          ) {
            want = SHADOW_MAP_NEAR;
          }
        }
      }
      if (want !== shadowMapSizeRef.current) {
        const now = performance.now();
        if (now - shadowMapCooldownRef.current > 2000) {
          shadowMapCooldownRef.current = now;
          shadowMapSizeRef.current = want;
          const sh = L.shadow;
          sh.map?.dispose();
          sh.map = null;
          sh.mapSize.setScalar(want);
          sh.needsUpdate = true;
        }
      }
    }
  });

  const pickRadius = useMemo(() => Math.max(radius * 2.5, 4), [radius]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || labelBodyIndex === undefined || !labelOcclusion) return;
    labelOcclusion.registerOccluder(mesh, labelBodyIndex);
    return () => labelOcclusion.unregisterOccluder(mesh);
  }, [labelOcclusion, labelBodyIndex]);

  useLayoutEffect(() => {
    return () => {
      glowMat.dispose();
    };
  }, [glowMat]);

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
    [onBodyDoubleClick, onBodyPointerDown],
  );

  const diskSeg = Math.max(72, wSeg);
  const shellSeg = Math.max(56, Math.floor(wSeg * 0.72));

  const sunCoreMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: false,
        depthWrite: true,
        depthTest: true,
        toneMapped: false,
        uniforms: {
          uTexture: { value: map },
          uHasTexture: { value: map ? 1 : 0 },
          uTime: { value: 0 },
          uCloseup: { value: 0 },
          uMaterialDepth: { value: 0 },
          uV55SolarArt: { value: 0 },
          uV55GlobalColor: { value: 0 },
          uExposure: { value: 1 },
        },
        vertexShader: `
          varying vec2 vUv;
          varying vec3 vNrm;
          varying vec3 vView;
          #include <common>
          #include <logdepthbuf_pars_vertex>
          void main() {
            vUv = uv;
            vNrm = normalize(normalMatrix * normal);
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vView = mv.xyz;
            gl_Position = projectionMatrix * mv;
            #include <logdepthbuf_vertex>
          }
        `,
        fragmentShader: `
          uniform sampler2D uTexture;
          uniform float uHasTexture;
          uniform float uTime;
          uniform float uCloseup;
          uniform float uMaterialDepth;
          uniform float uV55SolarArt;
          uniform float uV55GlobalColor;
          uniform float uExposure;
          varying vec2 vUv;
          varying vec3 vNrm;
          varying vec3 vView;
          #include <logdepthbuf_pars_fragment>
          float hash(vec2 p) {
            p = fract(p * vec2(123.34, 345.45));
            p += dot(p, p + 34.345);
            return fract(p.x * p.y);
          }
          float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            float a = hash(i);
            float b = hash(i + vec2(1.0, 0.0));
            float c = hash(i + vec2(0.0, 1.0));
            float d = hash(i + vec2(1.0, 1.0));
            return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
          }
          float fbm(vec2 p) {
            float v = 0.0;
            float a = 0.5;
            for (int i = 0; i < 4; i++) {
              v += noise(p) * a;
              p = p * 2.02 + vec2(17.3, 9.1);
              a *= 0.5;
            }
            return v;
          }
          void main() {
            vec3 n = normalize(vNrm);
            vec3 v = normalize(-vView);
            float cosTheta = max(dot(n, v), 0.0);

            float mu = cosTheta;
            float limb = 0.18 + 0.82 * pow(mu, 0.52);

            float granules = fbm(vUv * mix(42.0, ${V76_CLOSEUP_VISUAL_BUDGETS.sun.granuleFrequencyMax.toFixed(1)}, uMaterialDepth) + vec2(uTime * 0.012, -uTime * 0.008));
            float cells = fbm(vUv * mix(94.0, ${V76_CLOSEUP_VISUAL_BUDGETS.sun.cellFrequencyMax.toFixed(1)}, uMaterialDepth) + vec2(-uTime * 0.025, uTime * 0.018));
            vec3 tex = uHasTexture > 0.5
              ? texture2D(uTexture, vUv).rgb
              : vec3(0.95, 0.34 + granules * 0.18, 0.035);
            float texLum = uHasTexture > 0.5
              ? dot(tex, vec3(0.299, 0.587, 0.114))
              : (0.44 + granules * 0.34 + cells * 0.18);
            vec3 texHot = uHasTexture > 0.5
              ? pow(max(tex, vec3(0.0)), vec3(0.72))
              : vec3(1.0, 0.42 + granules * 0.16, 0.08);
            float filament = smoothstep(0.24, 0.9, granules) * mix(0.5, mix(0.66, 0.84, max(uMaterialDepth, uV55SolarArt)), uCloseup) + smoothstep(0.48, 0.97, cells) * mix(0.18, mix(0.32, 0.5, max(uMaterialDepth, uV55SolarArt)), uCloseup);
            float sunspot = smoothstep(0.34, 0.05, texLum) * mix(0.75, 0.9, max(uMaterialDepth, uV55SolarArt)) + smoothstep(0.22, 0.02, granules) * mix(0.12, 0.24, max(uMaterialDepth, uV55SolarArt));
            float activeRegion = smoothstep(0.68, 1.0, texLum) + smoothstep(0.74, 1.0, cells) * 0.42;

            vec3 deep = vec3(0.48, 0.035, 0.0);
            vec3 base = vec3(0.96, 0.31, 0.025);
            vec3 hot = vec3(1.0, 0.72, 0.18);
            vec3 whiteHot = vec3(1.0, 0.88, 0.48);
            vec3 color = mix(base, hot, filament);
            color = mix(color, texHot * vec3(1.24, 0.38, 0.08), mix(0.66, 0.56, uCloseup));
            color = mix(color, deep, clamp(sunspot, 0.0, 0.82));
            color += whiteHot * activeRegion * mix(0.24, mix(0.09, 0.034, max(uMaterialDepth, uV55SolarArt)), uCloseup);
            color = mix(color, deep, (1.0 - mu) * mix(0.2, mix(0.34, 0.52, max(uMaterialDepth, uV55SolarArt)), uCloseup));
            color *= limb * mix(1.04, mix(0.76, 0.58, max(uMaterialDepth, uV55SolarArt)), uCloseup);
            color += vec3(0.22, 0.045, 0.0) * pow(1.0 - mu, mix(1.35, mix(1.8, 2.48, max(uMaterialDepth, uV55SolarArt)), uCloseup)) * mix(1.0, 0.62, uV55SolarArt);
            color = mix(color, color * vec3(0.96, 0.9, 0.82), uV55GlobalColor * 0.18);
            color *= uExposure;

            gl_FragColor = vec4(color, 1.0);
            #include <logdepthbuf_fragment>
          }
        `,
      }),
    [map],
  );

  useFrame((state) => {
    if (sunCoreMat.uniforms.uTexture.value !== map) {
      sunCoreMat.uniforms.uTexture.value = map;
    }
    sunCoreMat.uniforms.uHasTexture.value = map ? 1 : 0;
    sunCoreMat.uniforms.uTime.value = state.clock.elapsedTime;
    sunCoreMat.uniforms.uCloseup.value = solarCloseup ? 1 : 0;
    sunCoreMat.uniforms.uMaterialDepth.value = v55SolarSurface ? V76_CLOSEUP_VISUAL_BUDGETS.sun.materialDepth : v53SolarColor ? 1.34 : v52SolarDepth ? 1.18 : v49SolarMaterial ? 1 : 0;
    sunCoreMat.uniforms.uV55SolarArt.value = v55SolarSurface ? 1 : 0;
    sunCoreMat.uniforms.uV55GlobalColor.value = v55GlobalColor ? 1 : 0;
    sunCoreMat.uniforms.uExposure.value = mobileSolarCloseup ? V76_CLOSEUP_VISUAL_BUDGETS.sun.mobileExposure : solarCloseup ? V76_CLOSEUP_VISUAL_BUDGETS.sun.exposure : 1;
  });

  useLayoutEffect(() => {
    return () => { sunCoreMat.dispose(); };
  }, [sunCoreMat]);

  return (
    <group position={position} frustumCulled={false}>
      {sunCastPointLight ? (
        <pointLight
          ref={sunLightRef}
          color={pointLightColor}
          intensity={pointLightIntensity * visualRendererProfile.groups.solar.sunSurfaceLuminance}
          distance={0}
          decay={2}
          castShadow={false}
        />
      ) : null}
      <mesh
        ref={solarBackdropRef}
        visible={solarCloseup}
        renderOrder={0}
        frustumCulled={false}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          color="#020304"
          depthWrite={false}
          depthTest={false}
          toneMapped={false}
        />
      </mesh>
      <mesh
        ref={meshRef}
        renderOrder={1}
        castShadow={false}
        receiveShadow={false}
        frustumCulled={false}
      >
        <sphereGeometry args={[radius, diskSeg, Math.max(48, Math.floor(diskSeg * 0.6))]} />
        <primitive object={sunCoreMat} attach="material" />
      </mesh>
      <mesh renderOrder={2} visible={!solarCloseup} frustumCulled={false}>
        <sphereGeometry args={[radius * 1.018, shellSeg, Math.max(36, Math.floor(shellSeg * 0.55))]} />
        <meshBasicMaterial
          color="#ff6a16"
          transparent
          opacity={(solarCloseup ? (v55SolarSurface ? 0.004 : v53SolarColor ? 0.006 : v52SolarDepth ? 0.008 : v51SolarKey ? 0.012 : v49SolarEdge ? 0.014 : 0) : atlasSun ? 0.075 : 0.11) * mobileSolarAttenuation}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh renderOrder={2} visible={!solarCloseup} frustumCulled={false}>
        <sphereGeometry args={[radius * 1.055, shellSeg, Math.max(36, Math.floor(shellSeg * 0.55))]} />
        <meshBasicMaterial
          color="#e53508"
          transparent
          opacity={(solarCloseup ? (v55SolarSurface ? 0.0015 : v53SolarColor ? 0.003 : v52SolarDepth ? 0.004 : v51SolarKey ? 0.006 : v49SolarEdge ? 0.008 : 0) : atlasSun ? 0.042 : 0.065) * mobileSolarAttenuation}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh renderOrder={2} visible={!solarCloseup} frustumCulled={false}>
        <sphereGeometry args={[radius * (v55SolarSurface ? 1.075 : 1.16), shellSeg, Math.max(36, Math.floor(shellSeg * 0.55))]} />
        <primitive object={glowMat} attach="material" />
      </mesh>
      {haloTex ? (
        <sprite ref={haloRef} visible={!solarCloseup} renderOrder={0} scale={[radius * 3.7, radius * 3.7, 1]}>
          <spriteMaterial
            map={haloTex}
            color="#ffb86a"
            transparent
            opacity={(solarCloseup ? v55SolarSurface ? 0.01 : v53SolarColor ? 0.012 : v52SolarDepth ? 0.014 : v51SolarKey ? 0.016 : v49SolarMaterial ? 0.018 : referenceSolar ? 0.028 : 0.04 : atlasSun ? 0.16 : 0.32) * mobileSolarAttenuation}
            toneMapped={false}
            depthWrite={false}
            depthTest={false}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
      ) : null}
      <group ref={prominenceRef} rotation={[0.24, -0.5, 0.42]} renderOrder={2}>
        <mesh position={[radius * 0.74, radius * 0.66, 0]} rotation={[0.15, 0.42, -0.58]}>
          <torusGeometry args={[radius * 0.78, radius * 0.018, 8, 96, Math.PI * 1.15]} />
          <meshBasicMaterial
            color="#ff3b0b"
            transparent
            opacity={atlasSun ? 0.12 : 0.2}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[-radius * 0.62, -radius * 0.58, 0]} rotation={[0.34, -0.2, 2.35]}>
          <torusGeometry args={[radius * 0.42, radius * 0.012, 8, 72, Math.PI * 0.95]} />
          <meshBasicMaterial
            color="#ff8a22"
            transparent
            opacity={atlasSun ? 0.1 : 0.16}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[radius * 0.2, -radius * 0.92, radius * 0.18]} rotation={[0.4, -0.1, 1.1]}>
          <torusGeometry args={[radius * 0.58, radius * 0.01, 8, 88, Math.PI * 0.78]} />
          <meshBasicMaterial
            color="#ffd08a"
            transparent
            opacity={atlasSun ? 0.08 : 0.13}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        <mesh renderOrder={1}>
          <sphereGeometry args={[radius * 1.34, shellSeg, Math.max(30, Math.floor(shellSeg * 0.5))]} />
          <meshBasicMaterial
            color="#ff9b42"
            transparent
            opacity={atlasSun ? 0.022 : 0.035}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            depthTest={false}
            side={THREE.BackSide}
            toneMapped={false}
          />
        </mesh>
      </group>
      <mesh renderOrder={3} onPointerDown={handlePickPointerDown}>
        <sphereGeometry args={[pickRadius, Math.max(20, wSeg / 6), Math.max(20, wSeg / 6)]} />
        <meshBasicMaterial
          transparent
          opacity={0}
          depthWrite={false}
          depthTest
          side={THREE.DoubleSide}
        />
      </mesh>
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
          labelTone="sun"
        />
      ) : null}
    </group>
  );
}
