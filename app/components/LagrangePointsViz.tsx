"use client";

import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useMemo, useRef, type MutableRefObject } from "react";
import {
  AU_TO_SCENE,
  EARTH_BODY_INDEX,
  MOON_BODY_INDEX,
} from "../data/planetsJ2000";
import { AU_METERS, DAY_SECONDS, G_SI } from "../lib/physicalConstants";
import type { SolarSystemPhysicsRef } from "../lib/solarSystemRef";
import {
  computeLagrangePointsCR3BP,
  type LagrangePointsFive,
} from "../lib/lagrangeCR3BP";

const SUN_BODY_INDEX = 0;
const METER_TO_SCENE = AU_TO_SCENE / AU_METERS;

const equipotentialVertexShader = /* glsl */ `
varying vec3 vWorld;
#include <common>
#include <logdepthbuf_pars_vertex>
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
  #include <logdepthbuf_vertex>
}
`;

const equipotentialFragmentShader = /* glsl */ `
uniform vec3 uBary;
uniform vec3 uEx;
uniform vec3 uEz;
uniform float uR;
uniform float uMu;
uniform float uOpacity;
varying vec3 vWorld;
#include <logdepthbuf_pars_fragment>

void main() {
  vec3 d = vWorld - uBary;
  float x = dot(d, uEx) / max(uR, 1e-8);
  float z = dot(d, uEz) / max(uR, 1e-8);
  float r1 = length(vec2(x + uMu, z));
  float r2 = length(vec2(x - 1.0 + uMu, z));
  if (r1 < 1e-5 || r2 < 1e-5) discard;
  float Omega = 0.5 * (x * x + z * z) + (1.0 - uMu) / r1 + uMu / r2;
  float v = log(1.0 + max(Omega, 0.0));
  float bands = fract(v * 14.0);
  float line = 1.0 - smoothstep(0.0, 0.08, bands) * smoothstep(0.12, 0.2, bands);
  line = max(line, 1.0 - smoothstep(0.88, 0.92, bands) * smoothstep(0.96, 1.0, bands));
  vec3 fillCol = vec3(0.04, 0.08, 0.14);
  vec3 lineCol = vec3(0.25, 0.65, 0.95);
  vec3 rgb = mix(fillCol, lineCol, line * 0.9);
  gl_FragColor = vec4(rgb, uOpacity * (0.35 + 0.4 * line));
  #include <logdepthbuf_fragment>
}
`;

function normalizedToWorldSi(
  lp: LagrangePointsFive,
  key: keyof LagrangePointsFive,
  B: THREE.Vector3,
  ex: THREE.Vector3,
  ez: THREE.Vector3,
  R: number,
  out: THREE.Vector3,
): void {
  const p = lp[key];
  out.copy(B).addScaledVector(ex, p.x * R).addScaledVector(ez, p.y * R);
}

function appendCross(
  positions: number[],
  center: THREE.Vector3,
  ex: THREE.Vector3,
  ez: THREE.Vector3,
  half: number,
): void {
  const ax = ex.clone().multiplyScalar(half);
  const az = ez.clone().multiplyScalar(half);
  const c = center;
  // X-arm along ex
  positions.push(
    c.x - ax.x,
    c.y - ax.y,
    c.z - ax.z,
    c.x + ax.x,
    c.y + ax.y,
    c.z + ax.z,
  );
  // Z-arm along ez
  positions.push(
    c.x - az.x,
    c.y - az.y,
    c.z - az.z,
    c.x + az.x,
    c.y + az.y,
    c.z + az.z,
  );
}

export type LagrangePointsVizProps = {
  physicsRef: MutableRefObject<SolarSystemPhysicsRef | null>;
  earthMoonView: boolean;
  enabled: boolean;
  spawnNonceRef: MutableRefObject<number>;
  isPlaying: boolean;
  daysPerSecond: number;
};

/**
 * CR3BP L1–L5 markers, equipotential contours on the orbital plane, optional test particle.
 * Earth–Moon when `earthMoonView`; Sun–Earth otherwise.
 */
export default function LagrangePointsViz({
  physicsRef,
  earthMoonView,
  enabled,
  spawnNonceRef,
  isPlaying,
  daysPerSecond,
}: LagrangePointsVizProps) {
  const planeRef = useRef<THREE.Mesh>(null);
  const crossesRef = useRef<THREE.LineSegments>(null);
  const particleRef = useRef<THREE.Mesh>(null);

  const posM = useRef(new THREE.Vector3());
  const velM = useRef(new THREE.Vector3());
  const particleActive = useRef(false);
  const lastSpawnNonce = useRef(0);

  const scratch = useMemo(
    () => ({
      p1: new THREE.Vector3(),
      p2: new THREE.Vector3(),
      v1: new THREE.Vector3(),
      v2: new THREE.Vector3(),
      B: new THREE.Vector3(),
      ex: new THREE.Vector3(),
      ey: new THREE.Vector3(),
      ez: new THREE.Vector3(),
      rEm: new THREE.Vector3(),
      wRel: new THREE.Vector3(),
      h: new THREE.Vector3(),
      tmp: new THREE.Vector3(),
      Lsi: new THREE.Vector3(),
      Ls: [
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
      ],
    }),
    [],
  );

  const planeGeom = useMemo(() => new THREE.PlaneGeometry(1, 1, 1, 1), []);
  const crossGeom = useMemo(() => new THREE.BufferGeometry(), []);
  const crossMat = useMemo(
    () =>
      new THREE.LineDashedMaterial({
        color: new THREE.Color(0x7dd3fc),
        transparent: true,
        opacity: 0.55,
        dashSize: 0.06,
        gapSize: 0.045,
        depthWrite: false,
      }),
    [],
  );

  const shaderUniforms = useMemo(
    () => ({
      uBary: { value: new THREE.Vector3() },
      uEx: { value: new THREE.Vector3(1, 0, 0) },
      uEz: { value: new THREE.Vector3(0, 0, 1) },
      uR: { value: 1 },
      uMu: { value: 0.01 },
      uOpacity: { value: 0.38 },
    }),
    [],
  );

  const equipMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: shaderUniforms,
        vertexShader: equipotentialVertexShader,
        fragmentShader: equipotentialFragmentShader,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    [shaderUniforms],
  );

  useFrame((state, delta) => {
    if (!enabled) return;
    const p = physicsRef.current;
    if (!p) return;

    const i1 = earthMoonView ? EARTH_BODY_INDEX : SUN_BODY_INDEX;
    const i2 = earthMoonView ? MOON_BODY_INDEX : EARTH_BODY_INDEX;
    if (i1 < 0 || i2 < 0 || i1 >= p.n || i2 >= p.n) return;

    const m1 = p.mass[i1]!;
    const m2 = p.mass[i2]!;
    const mu = m2 / (m1 + m2);

    const s = scratch;
    readBodyM(p, i1, s.p1);
    readBodyM(p, i2, s.p2);
    readVelM(p, i1, s.v1);
    readVelM(p, i2, s.v2);

    s.rEm.subVectors(s.p2, s.p1);
    const R = s.rEm.length();
    if (R < 1e6) return;

    s.ex.copy(s.rEm).multiplyScalar(1 / R);
    s.wRel.subVectors(s.v2, s.v1);
    s.h.crossVectors(s.rEm, s.wRel);
    if (s.h.lengthSq() < 1e-20) {
      s.h.set(0, 1, 0).cross(s.ex);
      if (s.h.lengthSq() < 1e-20) s.h.set(0, 0, 1);
    }
    s.ey.copy(s.h).normalize();
    s.ez.crossVectors(s.ey, s.ex).normalize();

    s.B.set(0, 0, 0).addScaledVector(s.p1, m1).addScaledVector(s.p2, m2);
    s.B.multiplyScalar(1 / (m1 + m2));

    const lp = computeLagrangePointsCR3BP(mu);
    const keys: (keyof LagrangePointsFive)[] = [
      "L1",
      "L2",
      "L3",
      "L4",
      "L5",
    ];
    for (let k = 0; k < 5; k++) {
      normalizedToWorldSi(lp, keys[k]!, s.B, s.ex, s.ez, R, s.Ls[k]!);
    }

    const Rscene = R * METER_TO_SCENE;
    const baryScene = s.B.clone().multiplyScalar(METER_TO_SCENE);

    if (planeRef.current) {
      planeRef.current.position.copy(baryScene);
      const q = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        s.ey,
      );
      planeRef.current.quaternion.copy(q);
      const scale = Math.min(5.5 * Rscene, earthMoonView ? 48 : 620);
      planeRef.current.scale.set(scale, scale, 1);
    }

    const u = equipMat.uniforms;
    u.uBary.value.copy(baryScene);
    u.uEx.value.copy(s.ex);
    u.uEz.value.copy(s.ez);
    u.uR.value = Rscene;
    u.uMu.value = mu;
    u.uOpacity.value = earthMoonView ? 0.42 : 0.28;

    const half = Math.min(0.1 * Rscene, earthMoonView ? 0.55 : 2.8);
    const posArr: number[] = [];
    for (let k = 0; k < 5; k++) {
      const c = s.Ls[k]!.clone().multiplyScalar(METER_TO_SCENE);
      appendCross(posArr, c, s.ex, s.ez, half);
    }
    crossGeom.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(posArr, 3),
    );
    crossGeom.computeBoundingSphere();
    if (crossesRef.current) {
      crossesRef.current.computeLineDistances();
    }

    const nonce = spawnNonceRef.current;
    if (nonce > lastSpawnNonce.current) {
      lastSpawnNonce.current = nonce;
      const spawnKey: keyof LagrangePointsFive = earthMoonView ? "L4" : "L1";
      normalizedToWorldSi(lp, spawnKey, s.B, s.ex, s.ez, R, s.Lsi);
      const omega = s.h.length() / (R * R);
      const rFromB = new THREE.Vector3().subVectors(s.Lsi, s.B);
      const vCo = new THREE.Vector3().crossVectors(
        s.ey.clone().multiplyScalar(omega),
        rFromB,
      );
      const pert = new THREE.Vector3()
        .copy(s.ez)
        .multiplyScalar(earthMoonView ? 12 : 180)
        .addScaledVector(s.ex, earthMoonView ? -6 : 40);
      posM.current.copy(s.Lsi).add(pert);
      velM.current.copy(vCo);
      particleActive.current = true;
      if (particleRef.current) particleRef.current.visible = true;
    }

    if (particleActive.current && particleRef.current && isPlaying) {
      const dtSimS = delta * Math.max(daysPerSecond, 0) * DAY_SECONDS;
      if (dtSimS > 0 && dtSimS < 1e6) {
        integrateParticleTwoBody(
          posM.current,
          velM.current,
          s.p1,
          s.p2,
          m1,
          m2,
          dtSimS,
          scratch.tmp,
          earthMoonView ? 1e6 : 1e14,
        );
      }
      particleRef.current.position.copy(posM.current).multiplyScalar(METER_TO_SCENE);
    }

    if (particleRef.current && !particleActive.current) {
      particleRef.current.visible = false;
    }
  });

  if (!enabled) return null;

  return (
    <group renderOrder={-30}>
      <mesh
        ref={planeRef}
        geometry={planeGeom}
        material={equipMat}
        frustumCulled={false}
      />
      <lineSegments ref={crossesRef} geometry={crossGeom} material={crossMat} />
      <mesh ref={particleRef} visible={false} renderOrder={8}>
        <sphereGeometry args={[earthMoonView ? 0.045 : 0.22, 16, 16]} />
        <meshBasicMaterial
          color="#fde68a"
          transparent
          opacity={0.92}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function readBodyM(
  p: SolarSystemPhysicsRef,
  i: number,
  out: THREE.Vector3,
): void {
  const k = 3 * i;
  out.set(p.posM[k]!, p.posM[k + 1]!, p.posM[k + 2]!);
}

function readVelM(
  p: SolarSystemPhysicsRef,
  i: number,
  out: THREE.Vector3,
): void {
  const k = 3 * i;
  out.set(p.velM[k]!, p.velM[k + 1]!, p.velM[k + 2]!);
}

function integrateParticleTwoBody(
  pos: THREE.Vector3,
  vel: THREE.Vector3,
  p1: THREE.Vector3,
  p2: THREE.Vector3,
  m1: number,
  m2: number,
  dt: number,
  acc: THREE.Vector3,
  softM2: number,
): void {
  acc.set(0, 0, 0);
  addGravityAccel(acc, pos, p1, m1, softM2);
  addGravityAccel(acc, pos, p2, m2, softM2);
  vel.addScaledVector(acc, dt);
  pos.addScaledVector(vel, dt);
}

function addGravityAccel(
  acc: THREE.Vector3,
  pos: THREE.Vector3,
  body: THREE.Vector3,
  mass: number,
  softM2: number,
): void {
  const dx = body.x - pos.x;
  const dy = body.y - pos.y;
  const dz = body.z - pos.z;
  const r2 = dx * dx + dy * dy + dz * dz + softM2;
  const r = Math.sqrt(r2);
  const a = (G_SI * mass) / r2 / r;
  acc.x += a * dx;
  acc.y += a * dy;
  acc.z += a * dz;
}
