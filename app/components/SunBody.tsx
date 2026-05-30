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
import { AU_TO_SCENE } from "../data/planetsJ2000";
import type { SolarSystemPhysicsRef } from "../lib/solarSystemRef";
import { useOptionalBloomSceneActions } from "../context/BloomSceneContext";
import { useOptionalLabelOcclusion } from "../context/LabelOcclusionContext";
import {
  DEFAULT_SPHERE_SEGMENTS,
  getSunHaloGlowTexture,
} from "../lib/celestialTextures";

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
  /** Sim-driven visual spin angle; affects the solar disk only. */
  spinAngleRef?: MutableRefObject<number>;
};

const SHADOW_FAR_DIST = 4200;
const SHADOW_MAP_NEAR = 1024;
const SHADOW_MAP_FAR = 512;
const _detailBodyPos = new THREE.Vector3();

export default function SunBody({
  variant: _variant,
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
  detailShadowBodyIndex,
  detailShadowPhysicsRef,
  detailShadowMaxCameraDist,
  spinAngleRef,
}: SunBodyProps) {
  const [wSeg] = sphereSegments;
  const meshRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Sprite>(null);
  const prominenceRef = useRef<THREE.Group>(null);
  const sunLightRef = useRef<THREE.PointLight>(null);
  const lastPointerDownMs = useRef(0);
  const bloomActions = useOptionalBloomSceneActions();
  const labelOcclusion = useOptionalLabelOcclusion();
  const { camera } = useThree();
  const sunWorld = useRef(new THREE.Vector3());
  const shadowMapSizeRef = useRef(SHADOW_MAP_NEAR);
  const shadowMapCooldownRef = useRef(0);
  const [haloTex, setHaloTex] = useState<THREE.CanvasTexture | null>(null);

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
          uColor: { value: new THREE.Color("#ff5a1a") },
          uPower: { value: 2.18 },
          uPulse: { value: 1.0 },
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
          varying vec3 vNrm;
          varying vec3 vView;
          #include <logdepthbuf_pars_fragment>
          void main() {
            float fresnel = pow(1.0 - abs(dot(normalize(vNrm), normalize(-vView))), uPower);
            float shell = smoothstep(0.0, 1.0, fresnel) * uPulse;
            gl_FragColor = vec4(uColor, shell * 0.24);
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

  useFrame((state, _d, frame) => {
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
      halo.scale.setScalar(radius * 4.75 * pulse);
    }
    if (prominenceRef.current) {
      prominenceRef.current.rotation.y += 0.0018;
      prominenceRef.current.rotation.z = Math.sin(t * 0.18) * 0.08;
    }
    glowMat.uniforms.uPulse.value = 0.72 + Math.sin(t * 0.55) * 0.035;

    if (L?.castShadow && mesh && frame % 72 === 0) {
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
          uTime: { value: 0 },
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
          uniform float uTime;
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

            vec3 tex = texture2D(uTexture, vUv).rgb;
            float texLum = dot(tex, vec3(0.299, 0.587, 0.114));
            vec3 texHot = pow(max(tex, vec3(0.0)), vec3(0.72));
            float granules = fbm(vUv * 42.0 + vec2(uTime * 0.012, -uTime * 0.008));
            float cells = fbm(vUv * 94.0 + vec2(-uTime * 0.025, uTime * 0.018));
            float filament = smoothstep(0.26, 0.92, granules) * 0.52 + smoothstep(0.50, 0.98, cells) * 0.22;
            float sunspot = smoothstep(0.34, 0.05, texLum) * 0.75 + smoothstep(0.22, 0.02, granules) * 0.12;
            float activeRegion = smoothstep(0.68, 1.0, texLum) + smoothstep(0.74, 1.0, cells) * 0.42;

            vec3 deep = vec3(0.62, 0.045, 0.0);
            vec3 base = vec3(1.0, 0.34, 0.02);
            vec3 hot = vec3(1.0, 0.86, 0.22);
            vec3 whiteHot = vec3(1.0, 0.98, 0.72);
            vec3 color = mix(base, hot, filament);
            color = mix(color, texHot * vec3(1.45, 0.42, 0.08), 0.78);
            color = mix(color, deep, clamp(sunspot, 0.0, 0.82));
            color += whiteHot * activeRegion * 0.24;
            color = mix(color, deep, (1.0 - mu) * 0.22);
            color *= limb * 0.92;
            color += vec3(0.18, 0.034, 0.0) * pow(1.0 - mu, 1.45);

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
    sunCoreMat.uniforms.uTime.value = state.clock.elapsedTime;
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
          intensity={pointLightIntensity}
          distance={0}
          decay={2}
          castShadow={false}
        />
      ) : null}
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
      <mesh renderOrder={2} frustumCulled={false}>
        <sphereGeometry args={[radius * 1.018, shellSeg, Math.max(36, Math.floor(shellSeg * 0.55))]} />
        <meshBasicMaterial
          color="#ff6a16"
          transparent
          opacity={0.062}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh renderOrder={2} frustumCulled={false}>
        <sphereGeometry args={[radius * 1.055, shellSeg, Math.max(36, Math.floor(shellSeg * 0.55))]} />
        <meshBasicMaterial
          color="#e53508"
          transparent
          opacity={0.034}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh renderOrder={2} frustumCulled={false}>
        <sphereGeometry args={[radius * 1.16, shellSeg, Math.max(36, Math.floor(shellSeg * 0.55))]} />
        <primitive object={glowMat} attach="material" />
      </mesh>
      {haloTex ? (
        <sprite ref={haloRef} renderOrder={0} scale={[radius * 3.7, radius * 3.7, 1]}>
          <spriteMaterial
            map={haloTex}
            color="#ffb86a"
            transparent
            opacity={0.18}
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
            opacity={0.15}
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
            opacity={0.12}
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
            opacity={0.1}
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
            opacity={0.024}
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
