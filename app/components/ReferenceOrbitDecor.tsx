"use client";

import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useEffect, useLayoutEffect, useMemo } from "react";
import { AU_TO_SCENE } from "../data/planetsJ2000";
import { useOptionalBloomSceneActions } from "../context/BloomSceneContext";
import {
  REFERENCE_KEPLER_ORBITS,
  type ReferenceKeplerOrbitDef,
} from "../data/referenceKeplerOrbits";
import {
  keplerianEllipsePointsAu,
  positionAuFromMeanAnomaly,
} from "../lib/keplerianOrbit";
import {
  ORBIT_CINEMATIC_BASE_OPACITY,
  orbitColorForBodyId,
  orbitOpacityMulFromLodWorldRadius,
} from "../lib/orbitCinematicTokens";
import {
  createHairlineOrbitLineBundle,
  setHairlineOrbitBundleOpacity,
  setLineGeometryFromVectors,
} from "../lib/hairlineOrbitLine";
import {
  lodAlphaFromScreenDiameterPx,
  ORBIT_SCREEN_LOD_FADE_END_PX,
  ORBIT_SCREEN_LOD_FADE_START_PX,
  screenDiscDiameterPx,
} from "../lib/screenSpaceBodyLod";
import { MAJOR_PLANET_IDS } from "../data/planetsJ2000";
import {
  classifyOrbitAtlasLayerStyle,
  classifyReferenceOrbit,
  mapOrbitAtlasVector,
  orbitAtlasV12OrbitColorForBody,
  ORBIT_ATLAS_ORBIT_RENDERER,
  ORBIT_ATLAS_V12_ORBIT_STYLES,
  type OrbitAtlasRenderBudget,
  type OrbitAtlasScaleMode,
  type OrbitAtlasOrbitLayerStyle,
  type SolarPresentationMode,
} from "../lib/orbitAtlasPresentation";
import { createOrbitDisplayDocumentV3 } from "../lib/orbitDirectorV3";

const _atlasProjected = new THREE.Vector3();

function hashUnit(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 10000) / 10000;
}

function jitterAtlasColor(color: THREE.Color, seed: number, amount: number): THREE.Color {
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
uniform vec2 uResolution;
uniform float uLineWidthPx;
uniform float uCenterFade;
uniform float uHorizonFade;
uniform float uDepthFade;
uniform float uEdgeHold;
uniform float uForegroundBoost;
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
  vec2 pixelOffset = normal * aSide * uLineWidthPx / uResolution * clip.w * 2.0;
  clip.xy += pixelOffset;
  vCoreColor = aCoreColor;
  vHaloColor = aHaloColor;
  vCoreAlpha = aCoreAlpha * centerCoreMask * horizonMask * edgeMask * upperMask * depthMask;
  vHaloAlpha = aHaloAlpha * centerHaloMask * horizonMask * edgeMask * upperMask * depthMask;
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

function AtlasMinorOrbitBatch({
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
  const inspectOpacityMul = atlasInspectActive ? (style === "major" ? 0.68 : 0.08) : 1;
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
    const vertexPattern: readonly (readonly [number, number])[] = [
      [0, -1],
      [1, -1],
      [1, 1],
      [0, -1],
      [1, 1],
      [0, 1],
    ];
    for (const def of defs) {
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
      const display = createOrbitDisplayDocumentV3({
        objectId: def.id,
        selectedObjectId: selectedBodyId,
        major: MAJOR_PLANET_IDS.has(def.id),
        inspectActive: atlasInspectActive,
        closeupActive: closeupOrbitBudgetActive,
        provenance: "reference-kepler",
      });
      const closeupMul = closeupOrbitBudgetActive
        ? selectedBodyId === def.id ? 0.035 : 0.004
        : 1;
      const coreAlpha = coreAlphaBase * inclinationMul * farOrbitMul * budgetOpacityMul * inspectOpacityMul * closeupMul * display.opacityScale;
      const haloAlpha = haloAlphaBase * inclinationMul * farOrbitMul * budgetOpacityMul * inspectOpacityMul * closeupMul * display.opacityScale;
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
    budgetOpacityMul,
    closeupOrbitBudgetActive,
    inspectOpacityMul,
    atlasInspectActive,
    selectedBodyId,
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
        },
      }),
    [budgetWidthMul, styleToken],
  );

  useFrame(() => {
    material.uniforms.uResolution.value.set(size.width, size.height);
  });

  useEffect(
    () => () => {
      batch.geometry.dispose();
      material.dispose();
    },
    [batch.geometry, material],
  );

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

function MajorOrbitTick({ position, color }: { position: THREE.Vector3; color: THREE.Color }) {
  const line = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      position.clone().multiplyScalar(0.985),
      position.clone().multiplyScalar(1.02),
    ]);
    const material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.6,
      depthTest: true,
      depthWrite: false,
      toneMapped: true,
    });
    const next = new THREE.Line(geometry, material);
    next.renderOrder = -34;
    return next;
  }, [color, position]);

  useEffect(() => () => {
    line.geometry.dispose();
    (line.material as THREE.Material).dispose();
  }, [line]);

  return <primitive object={line} />;
}

const BALANCED_ATLAS_ORBIT_IDS = new Set([
  "mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto",
  "ceres", "vesta", "pallas", "hygiea", "juno", "hebe", "iris", "flora", "eros", "itokawa",
  "haumea", "quaoar", "salacia", "varuna", "ixion", "pholus", "chiron", "chariklo", "orcus",
  "makemake", "eris", "sedna", "c1996e1",
]);

function DecorOrbit({
  def,
  presentationMode,
  scaleMode,
  atlasInspectActive,
  closeupOrbitBudgetActive,
  selectedBodyId,
}: {
  def: ReferenceKeplerOrbitDef;
  presentationMode: SolarPresentationMode;
  scaleMode: OrbitAtlasScaleMode;
  atlasInspectActive?: boolean;
  closeupOrbitBudgetActive?: boolean;
  selectedBodyId?: string;
}) {
  const bloomActions = useOptionalBloomSceneActions();
  const { camera, size } = useThree();
  const isMajor = MAJOR_PLANET_IDS.has(def.id);
  const orbitClass = classifyReferenceOrbit(def.id, def.aAu);
  const atlasLayerStyle = classifyOrbitAtlasLayerStyle(def.id, def.aAu, def.e, def.incDeg);
  const atlasStyle = ORBIT_ATLAS_V12_ORBIT_STYLES[atlasLayerStyle];
  const orbitAtlas = presentationMode === "orbit-atlas";
  const showLabel = !orbitAtlas && (isMajor || def.opacity >= 0.32);

  const mutedColor = useMemo(
    () => orbitColorForBodyId(def.id),
    [def.id]
  );
  const atlasColor = useMemo(() => {
    if (!orbitAtlas) return mutedColor;
    const colorToken = orbitAtlasV12OrbitColorForBody(def.id, def.color, atlasLayerStyle);
    return jitterAtlasColor(new THREE.Color(colorToken.core), hashUnit(def.id), atlasStyle.hueJitter);
  }, [atlasLayerStyle, atlasStyle.hueJitter, def.color, def.id, mutedColor, orbitAtlas]);

  const atlasHaloColor = useMemo(() => {
    if (!orbitAtlas) return atlasColor.clone().lerp(new THREE.Color("#fff0bd"), 0.18);
    const colorToken = orbitAtlasV12OrbitColorForBody(def.id, def.color, atlasLayerStyle);
    return new THREE.Color(colorToken.halo);
  }, [atlasColor, atlasLayerStyle, def.color, def.id, orbitAtlas]);

  const flatScratch = useMemo(
    () => new Float32Array((def.segments + 2) * 3),
    [def.segments]
  );

  const bundle = useMemo(
    () =>
      createHairlineOrbitLineBundle(atlasColor, {
        linewidthPx: orbitAtlas ? atlasStyle.linewidthPx : (isMajor ? 0.64 : 0.42),
        glowWidthPx: orbitAtlas ? atlasStyle.glowWidthPx : (isMajor ? 1.38 : 0.92),
        renderOrder: -37,
      }),
    [atlasColor, atlasStyle, isMajor, orbitAtlas]
  );

  useLayoutEffect(() => {
    const line = bundle.glowLine;
    if (!bloomActions || orbitAtlas) return;
    bloomActions.registerBloomTarget(line);
    return () => bloomActions.unregisterBloomTarget(line);
  }, [bloomActions, bundle.glowLine, orbitAtlas]);

  const linePointsScene = useMemo(() => {
    const s = AU_TO_SCENE;
    const au = keplerianEllipsePointsAu(
      def.aAu,
      def.e,
      def.incDeg,
      def.lanDeg,
      def.argPeriDeg,
      def.segments
    );
    return au.map((p) =>
      orbitAtlas ? mapOrbitAtlasVector(p, scaleMode) : p.clone().multiplyScalar(s),
    );
  }, [def, orbitAtlas, scaleMode]);

  const closed = useMemo(() => {
    if (linePointsScene.length < 2) return [] as THREE.Vector3[];
    return [...linePointsScene, linePointsScene[0].clone()];
  }, [linePointsScene]);

  const markerPos = useMemo(() => {
    if (orbitAtlas && !isMajor) return null;
    if (def.markerRadiusScene == null || def.meanAnomalyRad == null) return null;
    const s = AU_TO_SCENE;
    const positionAu = positionAuFromMeanAnomaly(
      def.aAu,
      def.e,
      def.incDeg,
      def.lanDeg,
      def.argPeriDeg,
      def.meanAnomalyRad
    );
    return orbitAtlas ? mapOrbitAtlasVector(positionAu, scaleMode) : positionAu.multiplyScalar(s);
  }, [def, isMajor, orbitAtlas, scaleMode]);

  const majorTicks = useMemo(() => {
    if (!orbitAtlas || !isMajor) return null;
    const map = (meanAnomalyRad: number) => {
      const point = positionAuFromMeanAnomaly(
        def.aAu, def.e, def.incDeg, def.lanDeg, def.argPeriDeg, meanAnomalyRad,
      );
      return mapOrbitAtlasVector(point, scaleMode);
    };
    return { perihelion: map(0), aphelion: map(Math.PI) };
  }, [def, isMajor, orbitAtlas, scaleMode]);

  const labelAnchor = useMemo(() => {
    if (markerPos) {
      return markerPos.clone().multiplyScalar(1.06);
    }
    let best = linePointsScene[0]?.clone() ?? new THREE.Vector3();
    let d = 0;
    for (const p of linePointsScene) {
      const l = p.length();
      if (l > d) {
        d = l;
        best = p.clone();
      }
    }
    return best.multiplyScalar(1.05);
  }, [markerPos, linePointsScene]);

  const lodRadiusScene = useMemo(() => {
    const s = AU_TO_SCENE;
    return Math.max(3, def.aAu * s * 0.06);
  }, [def.aAu]);

  const bodyDiscForOpacity = def.markerRadiusScene ?? 0.032;

  useEffect(() => {
    bundle.root.userData.orbitClass = orbitClass;
    bundle.root.userData.orbitId = def.id;
    bundle.root.userData.orbitLayerStyle = atlasLayerStyle;
    bundle.root.userData.atlasOrbitRenderer = orbitAtlas ? ORBIT_ATLAS_ORBIT_RENDERER : undefined;
    bundle.coreMaterial.depthTest = orbitAtlas ? atlasStyle.depthTest : false;
    bundle.glowMaterial.depthTest = orbitAtlas ? atlasStyle.depthTest : false;
    bundle.coreMaterial.toneMapped = orbitAtlas;
    bundle.glowMaterial.toneMapped = orbitAtlas;
    bundle.coreMaterial.color.copy(atlasColor);
    bundle.glowMaterial.color.copy(atlasHaloColor);
    setLineGeometryFromVectors(bundle, closed, closed.length, false, flatScratch);
    return () => {
      bundle.geometry.dispose();
      bundle.coreMaterial.dispose();
      bundle.glowMaterial.dispose();
    };
  }, [atlasColor, atlasHaloColor, atlasLayerStyle, atlasStyle.depthTest, bundle, closed, def.id, flatScratch, orbitAtlas, orbitClass]);

  useFrame(() => {
    bundle.coreMaterial.resolution.set(size.width, size.height);
    bundle.glowMaterial.resolution.set(size.width, size.height);
    const cam = camera as THREE.PerspectiveCamera;
    const discPx = screenDiscDiameterPx(cam, size.height, labelAnchor, lodRadiusScene);
    const lodA = orbitAtlas ? 1 : lodAlphaFromScreenDiameterPx(
      discPx,
      ORBIT_SCREEN_LOD_FADE_START_PX,
      ORBIT_SCREEN_LOD_FADE_END_PX
    );
    const sizeMul = orbitOpacityMulFromLodWorldRadius(bodyDiscForOpacity);
    const orbitTierMul = THREE.MathUtils.lerp(0.58, 0.94, def.opacity);
    const orbitMajorMul = isMajor ? 1.06 : 0.78;
    const classOpacity = orbitClass === "planet" ? 1 : orbitClass === "asteroid" ? 0.78 : orbitClass === "centaur" ? 0.58 : orbitClass === "tno" ? 0.48 : 0.42;
    const highInclinationFade = !isMajor && orbitAtlas
      ? THREE.MathUtils.lerp(1, atlasStyle.inclinationFade, THREE.MathUtils.clamp(Math.abs(def.incDeg) / 48, 0, 1))
      : 1;
    const farOrbitFade = !isMajor && orbitAtlas && def.aAu > 22 ? 0.72 : 1;
    _atlasProjected.copy(labelAnchor).project(cam);
    const centerDistance = Math.hypot(_atlasProjected.x, _atlasProjected.y);
    const centerFade = !isMajor && orbitAtlas
      ? THREE.MathUtils.lerp(atlasStyle.centerFade, 1, THREE.MathUtils.smoothstep(centerDistance, 0.18, 0.56))
      : 1;
    const horizonFade = !isMajor && orbitAtlas
      ? THREE.MathUtils.lerp(0.78, 1.08, THREE.MathUtils.clamp(Math.abs(_atlasProjected.y) * 0.9 + 0.18, 0, 1))
      : 1;
    const atlasOpacity = (isMajor
      ? THREE.MathUtils.lerp(atlasStyle.coreAlpha[0], atlasStyle.coreAlpha[1], def.opacity)
      : THREE.MathUtils.lerp(atlasStyle.coreAlpha[0], atlasStyle.coreAlpha[1], def.opacity)) *
      highInclinationFade *
      farOrbitFade *
      centerFade *
      horizonFade;
    const selectedMajorOrbit = selectedBodyId === def.id;
    const inspectFade = orbitAtlas && closeupOrbitBudgetActive
      ? selectedMajorOrbit ? 0.035 : 0.006
      : orbitAtlas && atlasInspectActive ? (isMajor ? 0.2 : 0.12) : 1;
    const op = THREE.MathUtils.clamp(
      orbitAtlas
      ? atlasOpacity * classOpacity * inspectFade
        : ORBIT_CINEMATIC_BASE_OPACITY * 0.64 * sizeMul * lodA * orbitTierMul * orbitMajorMul,
      0,
      1
    );
    setHairlineOrbitBundleOpacity(bundle, op);
    if (orbitAtlas) {
      const haloOp = THREE.MathUtils.lerp(atlasStyle.haloAlpha[0], atlasStyle.haloAlpha[1], def.opacity);
      const closeupHaloCap = closeupOrbitBudgetActive ? 0.025 : 0.09;
      bundle.glowMaterial.opacity = THREE.MathUtils.clamp(haloOp * inspectFade, 0, closeupHaloCap);
    }
    bundle.root.visible = closeupOrbitBudgetActive ? op > 0.012 : op > 0.02;
  });

  if (closed.length < 4) return null;

  return (
    <group renderOrder={-38}>
      <primitive object={bundle.root} />
      {markerPos != null && def.markerRadiusScene != null && !closeupOrbitBudgetActive ? (
        <mesh position={markerPos}>
          <sphereGeometry args={[def.markerRadiusScene, 18, 18]} />
          <meshStandardMaterial
            color={atlasColor}
            emissive={atlasColor}
            emissiveIntensity={orbitAtlas ? 0.2 : 0.22}
            roughness={0.88}
            metalness={0.04}
          />
        </mesh>
      ) : null}
      {majorTicks && !closeupOrbitBudgetActive ? <>
        <MajorOrbitTick position={majorTicks.perihelion} color={atlasColor} />
        <MajorOrbitTick position={majorTicks.aphelion} color={atlasColor} />
      </> : null}
      {showLabel ? (
        <Html
          position={[labelAnchor.x, labelAnchor.y, labelAnchor.z]}
          center={false}
          distanceFactor={20}
          style={{ pointerEvents: "none" }}
        >
          <span
            className="whitespace-nowrap"
            style={{
              fontFamily: "inherit",
              fontSize: 11,
              fontWeight: 400,
              letterSpacing: "0.02em",
              color: isMajor ? "rgba(231,224,211,0.60)" : "rgba(214,210,198,0.42)",
              textShadow:
                "0 0 10px rgba(0,0,0,0.85), 0 1px 3px rgba(0,0,0,0.75)",
              transform: "translate(15px, -15px)",
              transformOrigin: "0 0",
            }}
          >
            {def.label}
          </span>
        </Html>
      ) : null}
    </group>
  );
}

export default function ReferenceOrbitDecor({
  presentationMode = "sandbox",
  scaleMode = "physical",
  renderBudget = "dense",
  atlasInspectActive = false,
  closeupOrbitBudgetActive = false,
  selectedBodyId,
}: {
  presentationMode?: SolarPresentationMode;
  scaleMode?: OrbitAtlasScaleMode;
  renderBudget?: OrbitAtlasRenderBudget;
  atlasInspectActive?: boolean;
  closeupOrbitBudgetActive?: boolean;
  selectedBodyId?: string;
}) {
  const visibleOrbits = useMemo(
    () =>
      presentationMode === "orbit-atlas" && renderBudget === "balanced"
        ? REFERENCE_KEPLER_ORBITS.filter((def) =>
            BALANCED_ATLAS_ORBIT_IDS.has(def.id),
          )
        : REFERENCE_KEPLER_ORBITS,
    [presentationMode, renderBudget],
  );
  const atlasGroups = useMemo(() => {
    const groups = new Map<OrbitAtlasOrbitLayerStyle, ReferenceKeplerOrbitDef[]>();
    for (const def of visibleOrbits) {
      const style = classifyOrbitAtlasLayerStyle(def.id, def.aAu, def.e, def.incDeg);
      const entries = groups.get(style) ?? [];
      entries.push(def);
      groups.set(style, entries);
    }
    return groups;
  }, [visibleOrbits]);
  if (presentationMode === "orbit-atlas") {
    const major = atlasGroups.get("major") ?? [];
    const minorStyles: OrbitAtlasOrbitLayerStyle[] = [
      "inner-minor",
      "outer-minor",
      "high-inclination",
      "background-crossing",
    ];
    return (
      <>
        {major.length > 0 ? (
          <AtlasMinorOrbitBatch
            defs={major}
            style="major"
            scaleMode={scaleMode}
            renderBudget={renderBudget}
            atlasInspectActive={atlasInspectActive}
            closeupOrbitBudgetActive={closeupOrbitBudgetActive}
            selectedBodyId={selectedBodyId}
          />
        ) : null}
        {!closeupOrbitBudgetActive ? minorStyles.map((style) => {
          const defs = atlasGroups.get(style) ?? [];
          return defs.length > 0 ? (
            <AtlasMinorOrbitBatch
              key={style}
              defs={defs}
              style={style}
              scaleMode={scaleMode}
              renderBudget={renderBudget}
              atlasInspectActive={atlasInspectActive}
            />
          ) : null;
        }) : null}
      </>
    );
  }
  return (
    <>
      {visibleOrbits.map((def) => (
        <DecorOrbit key={def.id} def={def} presentationMode={presentationMode} scaleMode={scaleMode} atlasInspectActive={atlasInspectActive} closeupOrbitBudgetActive={closeupOrbitBudgetActive} selectedBodyId={selectedBodyId} />
      ))}
    </>
  );
}
