"use client";

import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useEffect, useLayoutEffect, useMemo } from "react";
import {
  type ReferenceKeplerOrbitDef,
} from "../data/referenceKeplerOrbits";
import {
  keplerianEllipsePointsAu,
} from "../lib/keplerianOrbit";
import {
  classifyReferenceOrbit,
  mapOrbitAtlasVector,
  orbitAtlasV12OrbitColorForBody,
  ORBIT_ATLAS_ORBIT_RENDERER,
  ORBIT_ATLAS_V12_ORBIT_STYLES,
  type OrbitAtlasRenderBudget,
  type OrbitAtlasScaleMode,
  type OrbitAtlasOrbitLayerStyle,
} from "../lib/orbitAtlasPresentation";

export const atlasProjectedLabelPosition = new THREE.Vector3();

export function hashUnit(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 10000) / 10000;
}

export function jitterAtlasColor(color: THREE.Color, seed: number, amount: number): THREE.Color {
  const hsl = { h: 0, s: 0, l: 0 };
  color.getHSL(hsl);
  hsl.h = (hsl.h + (seed - 0.5) * amount + 1) % 1;
  hsl.s = THREE.MathUtils.clamp(hsl.s * (0.9 + seed * 0.12), 0, 0.36);
  hsl.l = THREE.MathUtils.clamp(hsl.l * (0.94 + (1 - seed) * 0.1), 0.08, 0.68);
  return new THREE.Color().setHSL(hsl.h, hsl.s, hsl.l);
}

type AtlasBatchGeometry = {
  geometry: THREE.BufferGeometry;
  orbitCount: number;
};

const ATLAS_RIBBON_VERTEX = /* glsl */ `
attribute vec3 aStart;
attribute vec3 aEnd;
attribute vec3 aCoreColor;
attribute vec3 aHaloColor;
attribute float aSide;
attribute float aT;
attribute float aCoreAlpha;
attribute float aHaloAlpha;
attribute float aOrbitIndex;
uniform vec2 uResolution;
uniform float uLineWidthPx;
uniform float uCenterFade;
uniform float uHorizonFade;
uniform float uDepthFade;
uniform float uEdgeHold;
uniform float uForegroundBoost;
uniform float uSelectedOrbitIndex;
uniform float uSelectedOpacityMul;
uniform float uContextOpacityMul;
varying vec3 vCoreColor;
varying vec3 vHaloColor;
varying float vCoreAlpha;
varying float vHaloAlpha;
varying float vSide;

void main() {
  vec4 viewStart = modelViewMatrix * vec4(aStart, 1.0);
  vec4 viewEnd = modelViewMatrix * vec4(aEnd, 1.0);
  vec4 clipStart = projectionMatrix * viewStart;
  vec4 clipEnd = projectionMatrix * viewEnd;
  vec2 ndcStart = clipStart.xy / max(clipStart.w, 0.0001);
  vec2 ndcEnd = clipEnd.xy / max(clipEnd.w, 0.0001);
  vec2 dir = ndcEnd - ndcStart;
  vec2 normal = length(dir) > 0.00001 ? normalize(vec2(-dir.y, dir.x)) : vec2(0.0, 1.0);
  vec4 clip = mix(clipStart, clipEnd, aT);
  vec2 midNdc = (ndcStart + ndcEnd) * 0.5;
  vec3 viewMid = (viewStart.xyz + viewEnd.xyz) * 0.5;
  float centerDistance = length(midNdc);
  float edgeDistance = max(abs(midNdc.x), abs(midNdc.y));
  float centerCoreMask = mix(max(uCenterFade, 0.72), 1.0, smoothstep(0.14, 0.6, centerDistance));
  float centerHaloMask = mix(uCenterFade, 1.0, smoothstep(0.16, 0.64, centerDistance));
  float edgeMask = mix(1.0, uEdgeHold, smoothstep(0.52, 0.98, edgeDistance));
  float horizonMask = mix(0.82, uHorizonFade, smoothstep(0.18, 0.92, abs(midNdc.y)));
  float upperMask = mix(1.08, 0.82, smoothstep(0.08, 0.84, midNdc.y));
  float depthMask = mix(uForegroundBoost, uDepthFade, smoothstep(180.0, 1500.0, -viewMid.z));
  float selectedMask = 1.0 - step(0.5, abs(aOrbitIndex - uSelectedOrbitIndex));
  float runtimeOpacityMul = mix(uContextOpacityMul, uSelectedOpacityMul, selectedMask);
  vec2 pixelOffset = normal * aSide * uLineWidthPx / uResolution * clip.w * 2.0;
  clip.xy += pixelOffset;
  vCoreColor = aCoreColor;
  vHaloColor = aHaloColor;
  vCoreAlpha = aCoreAlpha * runtimeOpacityMul * centerCoreMask * horizonMask * edgeMask * upperMask * depthMask;
  vHaloAlpha = aHaloAlpha * runtimeOpacityMul * centerHaloMask * horizonMask * edgeMask * upperMask * depthMask;
  vSide = aSide;
  gl_Position = clip;
}
`;

const ATLAS_RIBBON_FRAGMENT = /* glsl */ `
varying vec3 vCoreColor;
varying vec3 vHaloColor;
varying float vCoreAlpha;
varying float vHaloAlpha;
varying float vSide;
uniform float uEdgeSoftness;

void main() {
  float dist = abs(vSide);
  float core = 1.0 - smoothstep(0.04, uEdgeSoftness, dist);
  float halo = 1.0 - smoothstep(0.26, 1.0, dist);
  core *= 1.0 - smoothstep(0.72, 1.0, dist) * 0.24;
  halo *= 0.82;
  vec3 color = mix(vHaloColor, vCoreColor, core);
  float alpha = vCoreAlpha * core + vHaloAlpha * halo * (1.0 - core * 0.48);
  gl_FragColor = vec4(color, alpha);
}
`;

export default function AtlasMinorOrbitBatch({
  defs,
  style,
  scaleMode,
  renderBudget,
  atlasInspectActive,
  closeupOrbitBudgetActive = false,
  selectedBodyId,
}: {
  defs: ReferenceKeplerOrbitDef[];
  style: OrbitAtlasOrbitLayerStyle;
  scaleMode: OrbitAtlasScaleMode;
  renderBudget: OrbitAtlasRenderBudget;
  atlasInspectActive: boolean;
  closeupOrbitBudgetActive?: boolean;
  selectedBodyId?: string;
}) {
  const { size } = useThree();
  const styleToken = ORBIT_ATLAS_V12_ORBIT_STYLES[style];
  const budgetOpacityMul = renderBudget === "dense" ? 1.02 : 1;
  const budgetWidthMul = renderBudget === "dense" ? 1.03 : 1;
  const selectedOrbitIndex = useMemo(
    () => defs.findIndex((def) => def.id === selectedBodyId),
    [defs, selectedBodyId],
  );
  const opacityMultipliers = closeupOrbitBudgetActive
    ? style === "major"
      ? { selected: 0.68 * 0.035, context: 0.68 * 0.004 * 0.12 }
      : { selected: 0.08 * 0.035, context: 0.08 * 0.004 * 0.025 }
    : atlasInspectActive
      ? style === "major"
        ? { selected: 0.68, context: 0.68 * 0.44 }
        : { selected: 0.08, context: 0.08 * 0.08 }
      : style === "major"
        ? { selected: 0.9, context: 0.9 }
        : { selected: 0.22, context: 0.22 };
  const batch = useMemo<AtlasBatchGeometry>(() => {
    const positions: number[] = [];
    const starts: number[] = [];
    const ends: number[] = [];
    const sides: number[] = [];
    const ts: number[] = [];
    const coreColors: number[] = [];
    const haloColors: number[] = [];
    const coreAlphas: number[] = [];
    const haloAlphas: number[] = [];
    const orbitIndices: number[] = [];
    const vertexPattern: readonly (readonly [number, number])[] = [
      [0, -1],
      [1, -1],
      [1, 1],
      [0, -1],
      [1, 1],
      [0, 1],
    ];
    for (let orbitIndex = 0; orbitIndex < defs.length; orbitIndex += 1) {
      const def = defs[orbitIndex]!;
      const segmentBudget =
        style === "major" ? Math.min(def.segments, 288) : Math.min(def.segments, 112);
      const points = keplerianEllipsePointsAu(
        def.aAu,
        def.e,
        def.incDeg,
        def.lanDeg,
        def.argPeriDeg,
        segmentBudget,
      ).map((point) => mapOrbitAtlasVector(point, scaleMode));
      const orbitClass = classifyReferenceOrbit(def.id, def.aAu);
      const seed = hashUnit(`${def.id}:${style}`);
      const colorToken = orbitAtlasV12OrbitColorForBody(def.id, def.color, style);
      const coreColor = jitterAtlasColor(new THREE.Color(colorToken.core), seed, styleToken.hueJitter);
      const haloColor = new THREE.Color(colorToken.halo);
      const classOpacity =
        orbitClass === "asteroid"
          ? 1
          : orbitClass === "centaur"
            ? 0.9
            : orbitClass === "tno"
              ? 0.84
              : orbitClass === "comet"
                ? 0.8
                : 1;
      const alphaJitter = THREE.MathUtils.lerp(
        1 - styleToken.alphaJitter,
        1 + styleToken.alphaJitter,
        hashUnit(`${def.id}:alpha`),
      );
      const coreAlphaBase = THREE.MathUtils.lerp(
        styleToken.coreAlpha[0],
        styleToken.coreAlpha[1],
        def.opacity,
      ) * classOpacity * alphaJitter;
      const haloAlphaBase = THREE.MathUtils.lerp(
        styleToken.haloAlpha[0],
        styleToken.haloAlpha[1],
        def.opacity,
      ) * classOpacity * alphaJitter;
      const inclinationMul = THREE.MathUtils.lerp(
        1,
        styleToken.inclinationFade,
        THREE.MathUtils.clamp(Math.abs(def.incDeg) / 48, 0, 1),
      );
      const farOrbitMul = def.aAu > 22 ? 0.86 : 1;
      const coreAlpha = coreAlphaBase * inclinationMul * farOrbitMul;
      const haloAlpha = haloAlphaBase * inclinationMul * farOrbitMul;
      for (let i = 0; i < points.length; i++) {
        const a = points[i]!;
        const b = points[(i + 1) % points.length]!;
        for (const [t, side] of vertexPattern) {
          const position = t === 0 ? a : b;

          positions.push(position.x, position.y, position.z);
          starts.push(a.x, a.y, a.z);
          ends.push(b.x, b.y, b.z);
          sides.push(side);
          ts.push(t);
          coreColors.push(coreColor.r, coreColor.g, coreColor.b);
          haloColors.push(haloColor.r, haloColor.g, haloColor.b);
          coreAlphas.push(coreAlpha);
          haloAlphas.push(haloAlpha);
          orbitIndices.push(orbitIndex);
        }
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geometry.setAttribute("aStart", new THREE.Float32BufferAttribute(starts, 3));
    geometry.setAttribute("aEnd", new THREE.Float32BufferAttribute(ends, 3));
    geometry.setAttribute("aSide", new THREE.Float32BufferAttribute(sides, 1));
    geometry.setAttribute("aT", new THREE.Float32BufferAttribute(ts, 1));
    geometry.setAttribute(
      "aCoreColor",
      new THREE.Float32BufferAttribute(coreColors, 3),
    );
    geometry.setAttribute("aHaloColor", new THREE.Float32BufferAttribute(haloColors, 3));
    geometry.setAttribute("aCoreAlpha", new THREE.Float32BufferAttribute(coreAlphas, 1));
    geometry.setAttribute("aHaloAlpha", new THREE.Float32BufferAttribute(haloAlphas, 1));
    geometry.setAttribute("aOrbitIndex", new THREE.Float32BufferAttribute(orbitIndices, 1));
    geometry.computeBoundingSphere();
    return { geometry, orbitCount: defs.length };
  }, [
    defs,
    scaleMode,
    styleToken.coreAlpha,
    styleToken.haloAlpha,
    styleToken.alphaJitter,
    styleToken.hueJitter,
    styleToken.inclinationFade,
    style,
  ]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: ATLAS_RIBBON_VERTEX,
        fragmentShader: ATLAS_RIBBON_FRAGMENT,
        transparent: true,
        depthTest: styleToken.depthTest,
        depthWrite: false,
        toneMapped: true,
        blending: THREE.NormalBlending,
        uniforms: {
          uResolution: { value: new THREE.Vector2(1, 1) },
          uLineWidthPx: { value: styleToken.linewidthPx * budgetWidthMul },
          uCenterFade: { value: styleToken.centerFade },
          uHorizonFade: { value: styleToken.horizonFade },
          uDepthFade: { value: styleToken.depthFade },
          uEdgeHold: { value: styleToken.edgeHold },
          uForegroundBoost: { value: styleToken.foregroundBoost },
          uEdgeSoftness: { value: styleToken.edgeSoftness },
          uSelectedOrbitIndex: { value: -1 },
          uSelectedOpacityMul: { value: 1 },
          uContextOpacityMul: { value: 1 },
        },
      }),
    [budgetWidthMul, styleToken],
  );

  useLayoutEffect(() => {
    material.uniforms.uSelectedOrbitIndex.value = selectedOrbitIndex;
    material.uniforms.uSelectedOpacityMul.value = opacityMultipliers.selected * budgetOpacityMul;
    material.uniforms.uContextOpacityMul.value = opacityMultipliers.context * budgetOpacityMul;
  }, [
    budgetOpacityMul,
    material,
    opacityMultipliers.context,
    opacityMultipliers.selected,
    selectedOrbitIndex,
  ]);

  useFrame(() => {
    material.uniforms.uResolution.value.set(size.width, size.height);
  });

  useEffect(() => () => batch.geometry.dispose(), [batch.geometry]);
  useEffect(() => () => material.dispose(), [material]);

  return (
    <mesh
      geometry={batch.geometry}
      material={material}
      frustumCulled={false}
      renderOrder={style === "major" ? -38 : -39}
      userData={{
        atlasOrbitRenderer: ORBIT_ATLAS_ORBIT_RENDERER,
        orbitLayerStyle: style,
        orbitCount: batch.orbitCount,
      }}
    />
  );
}
