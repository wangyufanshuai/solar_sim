"use client";

import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useMemo, useRef, useEffect } from "react";
import { AU_TO_SCENE } from "../data/planetsJ2000";
import { AU_METERS, DAY_SECONDS, G_SI } from "../lib/physicalConstants";
import {
  kerrOuterHorizonRadiusMeters,
  schwarzschildRadiusMeters,
} from "../lib/kerrGeometry";
import { kerrWeakFieldAcceleration } from "../lib/kerrFrameDraggingAccel";
import { kerrOuterHorizonRadiusM } from "../lib/kerrGeodesicKernel";
import { createKerrGeodesicTrackSet } from "../lib/kerrGeodesicVisualization";
import type {
  KerrGeodesicTrackKind,
  KerrGeodesicRenderMode,
  KerrOrbitPresetId,
  KerrGeodesicTrack,
} from "../lib/simulationDiagnosticsTypes";
import { KerrRayTraceRendererV3 } from "./KerrRayTraceRendererV3";
import type { KerrRayTraceQualityV3 } from "../lib/kerrRayTraceV3";

/** Fixed demo offset (AU) so the BH does not disturb the solar N-body ephemeris. */
export const KERR_BLACK_HOLE_OFFSET_AU: readonly [number, number, number] = [
  0, 0, 0,
];

const SUN_MASS_KG = 1.98847e30;

/** Makes sub-AU horizons visible at scene scale (teaching visualization). */
const LENGTH_EXAGGERATION = 2.8e8;

const PARTICLE_COUNT = 56;

const RK_A1 = new THREE.Vector3();
const RK_A2 = new THREE.Vector3();
const RK_A3 = new THREE.Vector3();
const RK_A4 = new THREE.Vector3();

function createFlowNoiseTexture(): THREE.DataTexture {
  const w = 64;
  const h = 64;
  const data = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    data[i * 4] = Math.floor(Math.random() * 256);
    data[i * 4 + 1] = Math.floor(Math.random() * 256);
    data[i * 4 + 2] = Math.floor(Math.random() * 200 + 28);
    data[i * 4 + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, w, h, THREE.RGBAFormat);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

const ergosphereVert = /* glsl */ `
uniform float uChi;
uniform float uHorizonRadius;
varying float vCosTheta;
varying vec3 vLocalPos;
varying vec3 vViewNormal;
varying float vFresnel;
#include <common>
#include <logdepthbuf_pars_vertex>

void main() {
  vec3 dir = normalize(position);
  vLocalPos = dir;
  vCosTheta = dir.z;
  float chi = clamp(uChi, 0.0, 0.9999);
  float rPlus = 1.0 + sqrt(max(0.0, 1.0 - chi * chi));
  float rSl = 1.0 + sqrt(max(0.0, 1.0 - chi * chi * vCosTheta * vCosTheta));
  float ratio = rSl / rPlus;
  vec3 displaced = dir * uHorizonRadius * ratio;
  vec4 mvPos = modelViewMatrix * vec4(displaced, 1.0);
  vViewNormal = normalize(normalMatrix * dir);
  vFresnel = 1.0 - abs(dot(normalize(-mvPos.xyz), vViewNormal));
  gl_Position = projectionMatrix * mvPos;
  #include <logdepthbuf_vertex>
}
`;

const ergosphereFrag = /* glsl */ `
varying float vCosTheta;
varying vec3 vLocalPos;
varying vec3 vViewNormal;
varying float vFresnel;

uniform float uOpacity;
uniform float uChi;
uniform float uHorizonRadius;
uniform float uRgScene;
uniform float uTime;
uniform float uFlowSpeed;
uniform float uFlowStrength;
uniform sampler2D uFlowNoise;
#include <logdepthbuf_pars_fragment>

void main() {
  float band = smoothstep(0.15, 0.95, abs(vCosTheta));
  vec3 baseCol = mix(vec3(0.42, 0.1, 0.52), vec3(0.08, 0.48, 0.82), band);
  float aBase = uOpacity * (0.18 + 0.5 * vFresnel);

  vec3 p = normalize(vLocalPos);
  float phi = atan(p.y, p.x);
  float theta = acos(clamp(p.z, -1.0, 1.0));
  float t = uTime * uFlowSpeed;
  vec2 spiralUv = vec2(phi * 0.22 + t * 0.1, theta * 0.42 + t * 0.035);
  spiralUv += vec2(sin(theta * 3.2 + phi), cos(phi * 2.1 - theta)) * 0.12;
  vec2 nxy = texture2D(uFlowNoise, spiralUv * 2.8).xy * 2.0 - 1.0;
  float azimuthWave = sin(phi * 7.0 - t * 2.6 + nxy.x * 1.9);
  float latWave = cos(theta * 5.5 + phi * 2.3 + t * 1.55 + nxy.y * 1.4);
  float flowMix = (azimuthWave * 0.58 + latWave * 0.36) * uFlowStrength;
  float chiSpin = smoothstep(0.035, 0.22, abs(uChi));
  flowMix *= chiSpin;

  vec3 flowCol = vec3(0.35, 0.88, 1.0) * max(0.0, flowMix) * 0.32;
  flowCol += vec3(0.75, 0.25, 0.95) * max(0.0, -flowMix) * 0.14;
  vec3 col = baseCol + flowCol;
  float rpOverRg = uHorizonRadius / max(uRgScene, 1e-5);
  aBase *= mix(0.94, 1.06, smoothstep(1.08, 1.95, rpOverRg));

  float a = aBase + abs(flowMix) * 0.1 * uOpacity * chiSpin;

  gl_FragColor = vec4(col, a);
  #include <logdepthbuf_fragment>
}
`;

function horizonRadiusScene(massSolar: number, aOverM: number): number {
  const mKg = massSolar * SUN_MASS_KG;
  const rPlusM = kerrOuterHorizonRadiusMeters(mKg, aOverM);
  const au = rPlusM / AU_METERS;
  let rScene = au * AU_TO_SCENE * LENGTH_EXAGGERATION;
  const rgM = schwarzschildRadiusMeters(mKg);
  rScene = Math.max(rScene, (rgM / AU_METERS) * AU_TO_SCENE * LENGTH_EXAGGERATION * 0.25);
  return THREE.MathUtils.clamp(rScene, 0.28, 14);
}

/** Schwarzschild radius r_g in scene units (same exaggeration as horizon). */
function schwarzschildRadiusScene(massSolar: number): number {
  const mKg = massSolar * SUN_MASS_KG;
  const rgM = schwarzschildRadiusMeters(mKg);
  const rScene = (rgM / AU_METERS) * AU_TO_SCENE * LENGTH_EXAGGERATION;
  return THREE.MathUtils.clamp(rScene, 0.12, 10);
}

function integrateParticles(
  pos: Float32Array,
  vel: Float32Array,
  dtSimS: number,
  massKg: number,
  aOverM: number,
  teachingScale: number,
  mps: number,
  spin: THREE.Vector3,
  tmpR: THREE.Vector3,
  tmpV: THREE.Vector3
): void {
  const h = dtSimS;
  const h2 = h * 0.5;

  const accel = (
    px: number,
    py: number,
    pz: number,
    pvx: number,
    pvy: number,
    pvz: number,
    out: THREE.Vector3
  ) => {
    tmpR.set(px, py, pz);
    tmpV.set(pvx, pvy, pvz);
    out.copy(
      kerrWeakFieldAcceleration(tmpR, tmpV, massKg, aOverM, spin, teachingScale)
    );
  };

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const o = i * 3;
    let x = pos[o]! * mps;
    let y = pos[o + 1]! * mps;
    let z = pos[o + 2]! * mps;
    let vx = vel[o]! * mps;
    let vy = vel[o + 1]! * mps;
    let vz = vel[o + 2]! * mps;

    accel(x, y, z, vx, vy, vz, RK_A1);
    const k1x = vx;
    const k1y = vy;
    const k1z = vz;

    const x2 = x + h2 * k1x;
    const y2 = y + h2 * k1y;
    const z2 = z + h2 * k1z;
    const vx2 = vx + h2 * RK_A1.x;
    const vy2 = vy + h2 * RK_A1.y;
    const vz2 = vz + h2 * RK_A1.z;
    accel(x2, y2, z2, vx2, vy2, vz2, RK_A2);
    const k2x = vx2;
    const k2y = vy2;
    const k2z = vz2;

    const x3 = x + h2 * k2x;
    const y3 = y + h2 * k2y;
    const z3 = z + h2 * k2z;
    const vx3 = vx + h2 * RK_A2.x;
    const vy3 = vy + h2 * RK_A2.y;
    const vz3 = vz + h2 * RK_A2.z;
    accel(x3, y3, z3, vx3, vy3, vz3, RK_A3);
    const k3x = vx3;
    const k3y = vy3;
    const k3z = vz3;

    const x4 = x + h * k3x;
    const y4 = y + h * k3y;
    const z4 = z + h * k3z;
    const vx4 = vx + h * RK_A3.x;
    const vy4 = vy + h * RK_A3.y;
    const vz4 = vz + h * RK_A3.z;
    accel(x4, y4, z4, vx4, vy4, vz4, RK_A4);
    const k4x = vx4;
    const k4y = vy4;
    const k4z = vz4;

    vx += (h / 6) * (RK_A1.x + 2 * RK_A2.x + 2 * RK_A3.x + RK_A4.x);
    vy += (h / 6) * (RK_A1.y + 2 * RK_A2.y + 2 * RK_A3.y + RK_A4.y);
    vz += (h / 6) * (RK_A1.z + 2 * RK_A2.z + 2 * RK_A3.z + RK_A4.z);
    x += (h / 6) * (k1x + 2 * k2x + 2 * k3x + k4x);
    y += (h / 6) * (k1y + 2 * k2y + 2 * k3y + k4y);
    z += (h / 6) * (k1z + 2 * k2z + 2 * k3z + k4z);

    pos[o] = x / mps;
    pos[o + 1] = y / mps;
    pos[o + 2] = z / mps;
    vel[o] = vx / mps;
    vel[o + 1] = vy / mps;
    vel[o + 2] = vz / mps;
  }
}

function seedParticles(
  pos: Float32Array,
  vel: Float32Array,
  horizonScene: number,
  massKg: number,
  mps: number
): void {
  const ringR = Math.max(horizonScene * 9, 2.5);
  const vCirc =
    Math.sqrt((G_SI * massKg) / Math.max(ringR * mps, 1e-6)) * 0.92;

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const o = i * 3;
    const ang = (i / PARTICLE_COUNT) * Math.PI * 2 + i * 0.17;
    const x = Math.cos(ang) * ringR;
    const y = Math.sin(ang) * ringR;
    const z = (i % 5 - 2) * horizonScene * 0.35;
    pos[o] = x;
    pos[o + 1] = y;
    pos[o + 2] = z;

    const tx = -Math.sin(ang);
    const ty = Math.cos(ang);
    const tz = 0;
    vel[o] = (tx * vCirc) / mps;
    vel[o + 1] = (ty * vCirc) / mps;
    vel[o + 2] = (tz * vCirc) / mps;
  }
}

function KerrGeodesicTrackVisual({
  track,
  scaleMToScene,
  opacityScale,
  pointScale,
}: {
  track: KerrGeodesicTrack;
  scaleMToScene: number;
  opacityScale: number;
  pointScale: number;
}) {
  const geometry = useMemo(() => {
    const positions = new Float32Array(track.samples.length * 3);
    for (let i = 0; i < track.samples.length; i++) {
      const sample = track.samples[i]!;
      const o = i * 3;
      positions[o] = sample.x * scaleMToScene;
      positions[o + 1] = sample.y * scaleMToScene;
      positions[o + 2] = sample.z * scaleMToScene;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, [scaleMToScene, track.samples]);

  const haloLineMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: track.haloColor,
        transparent: true,
        opacity: track.opacity * 0.28 * opacityScale,
        depthTest: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [opacityScale, track.haloColor, track.opacity],
  );

  const coreLineMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: track.color,
        transparent: true,
        opacity: track.opacity * opacityScale,
        depthTest: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [opacityScale, track.color, track.opacity],
  );

  const haloLine = useMemo(() => {
    const line = new THREE.Line(geometry, haloLineMaterial);
    line.renderOrder = -15;
    line.frustumCulled = false;
    return line;
  }, [geometry, haloLineMaterial]);

  const coreLine = useMemo(() => {
    const line = new THREE.Line(geometry, coreLineMaterial);
    line.renderOrder = -13;
    line.frustumCulled = false;
    return line;
  }, [coreLineMaterial, geometry]);

  useEffect(
    () => () => {
      geometry.dispose();
      haloLineMaterial.dispose();
      coreLineMaterial.dispose();
    },
    [coreLineMaterial, geometry, haloLineMaterial],
  );

  const pointSize = Math.max(1.05, track.width * 1.08 * pointScale);

  return (
    <group renderOrder={-15} frustumCulled={false}>
      <primitive object={haloLine} />
      <points geometry={geometry} renderOrder={-14} frustumCulled={false}>
        <pointsMaterial
          color={track.haloColor}
          size={pointSize * 2.7}
          sizeAttenuation={false}
          transparent
          opacity={track.opacity * 0.13 * opacityScale}
          depthTest={false}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <primitive object={coreLine} />
      <points geometry={geometry} renderOrder={-12} frustumCulled={false}>
        <pointsMaterial
          color={track.color}
          size={pointSize}
          sizeAttenuation={false}
          transparent
          opacity={track.opacity * 0.82 * opacityScale}
          depthTest={false}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

export type KerrBlackHoleRuntimeProps = {
  massSolar: number;
  aOverM: number;
  impactParameterM: number;
  orbitPresetId: KerrOrbitPresetId;
  highlightTrackKind: KerrGeodesicTrackKind | null;
  frameDragTeachingScale: number;
  renderMode: KerrGeodesicRenderMode;
  isPlaying: boolean;
  daysPerSecond: number;
  rayTraceQuality?: KerrRayTraceQualityV3;
};

export default function KerrBlackHole({
  massSolar,
  aOverM,
  impactParameterM,
  orbitPresetId,
  highlightTrackKind,
  frameDragTeachingScale,
  renderMode,
  isPlaying,
  daysPerSecond,
  rayTraceQuality = "interactive",
}: KerrBlackHoleRuntimeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const ergoMatRef = useRef<THREE.ShaderMaterial>(null);

  const posBuf = useRef<Float32Array>(new Float32Array(PARTICLE_COUNT * 3));
  const velBuf = useRef<Float32Array>(new Float32Array(PARTICLE_COUNT * 3));

  const tmpR = useRef(new THREE.Vector3());
  const tmpV = useRef(new THREE.Vector3());
  const spinAxis = useRef(new THREE.Vector3(0, 0, 1));

  const mps = AU_METERS / AU_TO_SCENE;
  const massKg = Math.max(0.05, massSolar) * SUN_MASS_KG;

  const horizonScene = useMemo(
    () => horizonRadiusScene(Math.max(0.05, massSolar), aOverM),
    [massSolar, aOverM]
  );

  const rgScene = useMemo(
    () => schwarzschildRadiusScene(Math.max(0.05, massSolar)),
    [massSolar]
  );

  const trackSet = useMemo(
    () => createKerrGeodesicTrackSet({ spinA: aOverM, impactParameterM, presetId: orbitPresetId }),
    [aOverM, impactParameterM, orbitPresetId],
  );
  const scaleMToScene = useMemo(
    () =>
      Math.max(
        horizonScene / Math.max(1e-6, kerrOuterHorizonRadiusM(aOverM)),
        Math.min(1.25, horizonScene * 2.8),
      ),
    [aOverM, horizonScene],
  );
  const showGeodesicTracks = renderMode !== "teaching-particles";
  const showTeachingParticles = renderMode !== "geodesic-tracks";

  const flowNoiseTex = useMemo(() => createFlowNoiseTexture(), []);

  useEffect(
    () => () => {
      const material = ergoMatRef.current;
      if (material) {
        material.uniforms.uFlowNoise.value = null;
        material.dispose();
      }
      flowNoiseTex.dispose();
    },
    [flowNoiseTex]
  );

  const ergoUniforms = useMemo(
    () => ({
      uChi: { value: 0 },
      uHorizonRadius: { value: 1 },
      uRgScene: { value: 1 },
      uOpacity: { value: 0.48 },
      uTime: { value: 0 },
      uFlowSpeed: { value: 0.85 },
      uFlowStrength: { value: 1.0 },
      uFlowNoise: { value: flowNoiseTex },
    }),
    [flowNoiseTex]
  );

  const pointsGeom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.BufferAttribute(posBuf.current, 3).setUsage(THREE.DynamicDrawUsage)
    );
    return g;
  }, []);

  useEffect(() => () => pointsGeom.dispose(), [pointsGeom]);

  useEffect(() => {
    seedParticles(posBuf.current, velBuf.current, horizonScene, massKg, mps);
    const attr = pointsGeom.getAttribute("position") as THREE.BufferAttribute;
    attr.needsUpdate = true;
  }, [horizonScene, massSolar, aOverM, massKg, mps, pointsGeom]);

  useFrame((state, dtWall) => {
    const chi = THREE.MathUtils.clamp(aOverM, 0, 0.999);
    const mat = ergoMatRef.current;
    if (mat) {
      mat.uniforms.uChi.value = chi;
      mat.uniforms.uHorizonRadius.value = horizonScene;
      mat.uniforms.uRgScene.value = rgScene;
      mat.uniforms.uTime.value = state.clock.elapsedTime;
    }

    if (!showTeachingParticles || !isPlaying || daysPerSecond <= 0) return;

    const dtSim = dtWall * daysPerSecond * DAY_SECONDS;
    if (dtSim <= 0) return;

    integrateParticles(
      posBuf.current,
      velBuf.current,
      dtSim,
      massKg,
      aOverM,
      frameDragTeachingScale,
      mps,
      spinAxis.current,
      tmpR.current,
      tmpV.current
    );
    const attr = pointsGeom.getAttribute("position") as THREE.BufferAttribute;
    attr.needsUpdate = true;
  });

  const worldPos = useMemo(
    () =>
      new THREE.Vector3(
        KERR_BLACK_HOLE_OFFSET_AU[0] * AU_TO_SCENE,
        KERR_BLACK_HOLE_OFFSET_AU[1] * AU_TO_SCENE,
        KERR_BLACK_HOLE_OFFSET_AU[2] * AU_TO_SCENE
      ),
    []
  );

  return (
    <group ref={groupRef} position={worldPos}>
      <KerrRayTraceRendererV3 radiusScene={horizonScene} spinA={aOverM} quality={rayTraceQuality} />
      <mesh renderOrder={-18}>
        <sphereGeometry args={[horizonScene * 1.002, 48, 48]} />
        <meshBasicMaterial color="#030308" depthWrite />
      </mesh>
      <mesh renderOrder={-17}>
        <sphereGeometry args={[1, 96, 96]} />
        <shaderMaterial
          ref={ergoMatRef}
          uniforms={ergoUniforms}
          vertexShader={ergosphereVert}
          fragmentShader={ergosphereFrag}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.NormalBlending}
        />
      </mesh>
      {showGeodesicTracks
        ? trackSet.tracks.map((track) => {
            const highlighted = highlightTrackKind == null || track.kind === highlightTrackKind;
            return (
              <KerrGeodesicTrackVisual
                key={track.id}
                track={track}
                scaleMToScene={scaleMToScene}
                opacityScale={highlighted ? 1.12 : 0.34}
                pointScale={highlighted ? 1.22 : 0.82}
              />
            );
          })
        : null}
      {showTeachingParticles ? (
        <points geometry={pointsGeom} renderOrder={-16} frustumCulled={false}>
          <pointsMaterial
            color="#7dd3fc"
            size={Math.max(0.45, horizonScene * 0.14)}
            sizeAttenuation
            transparent
            opacity={renderMode === "both" ? 0.34 : 0.92}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
      ) : null}
    </group>
  );
}
