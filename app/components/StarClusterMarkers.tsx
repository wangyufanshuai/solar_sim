"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { MutableRefObject } from "react";
import type { FloatingOriginState } from "../lib/floatingOrigin";
import type { AtlasCinematicCameraProfile } from "../lib/simulationDiagnosticsTypes";
import { STAR_CLUSTERS } from "../data/starClusterCatalog";
import type { StarClusterDef } from "../data/starClusterCatalog";
import { getStarClustersV255Sync, loadStarClustersV255 } from "../lib/deepSkyCatalogRuntimeV255";
import { useAtlasRuntimeStore } from "../lib/atlasRuntimeStore";
import { resolveAtlasVisualProfileV299 } from "../lib/atlasVisualProfileV299";

const GALAXY_VISUAL_SCALE = 36;

const CLUSTER_VERTEX = /* glsl */ `
attribute vec3 aColor;
attribute float aSize;
attribute float aIntensity;
varying vec3 vColor;
varying float vIntensity;
varying float vPS;
uniform float uPixelRatio;
#include <common>
#include <logdepthbuf_pars_vertex>
void main() {
  vColor = aColor;
  vIntensity = aIntensity;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float dist = max(-mv.z, 1.0);
  gl_PointSize = aSize * uPixelRatio * (33000.0 / dist);
  gl_PointSize = clamp(gl_PointSize, 4.0, 72.0);
  vPS = gl_PointSize;
  gl_Position = projectionMatrix * mv;
  #include <logdepthbuf_vertex>
}
`;

const CLUSTER_FRAGMENT = /* glsl */ `
varying vec3 vColor;
varying float vIntensity;
varying float vPS;
uniform float uOpacity;
#include <logdepthbuf_pars_fragment>
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  float rays = pow(abs(c.x * c.y) * 4.0, 0.55);
  float speckle = step(0.93, fract(sin(dot(c, vec2(91.7, 37.3))) * 43758.5453));
  float core = exp(-d * d * 28.0);
  float halo = exp(-d * d * 3.2) * 0.38;
  float crown = exp(-d * d * 11.0) * rays * 0.34;
  float edge = smoothstep(0.5, 0.18, d);
  float alpha = (core * 0.78 + halo + crown * 0.72 + speckle * 0.12) * edge * vIntensity * uOpacity;
  vec3 col = mix(vColor, vec3(0.92, 0.9, 0.8), 0.12) * (0.5 + core * 1.18 + speckle * 0.7);
  gl_FragColor = vec4(col, alpha);
  #include <logdepthbuf_fragment>
}
`;

function galacticToScene(lonDeg: number, latDeg: number, distPc: number): [number, number, number] {
  const l = (lonDeg * Math.PI) / 180;
  const b = (latDeg * Math.PI) / 180;
  const s = GALAXY_VISUAL_SCALE;
  const x = -distPc * Math.cos(b) * Math.cos(l) * s;
  const y = distPc * Math.sin(b) * s;
  const z = distPc * Math.cos(b) * Math.sin(l) * s;
  return [x, y, z];
}

export default function StarClusterMarkers({
  floatingOriginRef,
  enabled = true,
  orbitAtlas = false,
  cinematicCameraProfile = "overview-atlas",
}: {
  floatingOriginRef: MutableRefObject<FloatingOriginState>;
  enabled?: boolean;
  orbitAtlas?: boolean;
  cinematicCameraProfile?: AtlasCinematicCameraProfile;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const profileOpacity = useAtlasRuntimeStore((snapshot) => resolveAtlasVisualProfileV299(snapshot.visualProfile).groups.catalog.deepSkyMarkerOpacity);
  const [starClusters, setStarClusters] = useState<readonly StarClusterDef[]>(() => getStarClustersV255Sync());

  useEffect(() => {
    if (!enabled) return;
    let disposed = false;
    void loadStarClustersV255()
      .then((next) => {
        if (!disposed && next.length > STAR_CLUSTERS.length) setStarClusters((previous) => previous === next ? previous : next);
      })
      .catch(() => undefined);
    return () => {
      disposed = true;
    };
  }, [enabled]);

  const { geometry, material } = useMemo(() => {
    const count = starClusters.length;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const intensities = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const c = starClusters[i]!;
      const pos = galacticToScene(c.galLonDeg, c.galLatDeg, c.distancePc);
      positions[i * 3] = pos[0];
      positions[i * 3 + 1] = pos[1];
      positions[i * 3 + 2] = pos[2];

      const col = new THREE.Color(c.color);
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;

      sizes[i] = c.kind === "globular" ? Math.max(11, 26 - c.magV * 0.52) : Math.max(7, 17 - c.magV * 0.5);
      intensities[i] = Math.min(1.05, c.intensity * 0.74);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute("aIntensity", new THREE.BufferAttribute(intensities, 1));

    const mat = new THREE.ShaderMaterial({
      vertexShader: CLUSTER_VERTEX,
      fragmentShader: CLUSTER_FRAGMENT,
      uniforms: {
        uPixelRatio: { value: Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 2) },
        uOpacity: { value: 0.0 },
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      toneMapped: false,
      blending: THREE.AdditiveBlending,
    });

    return { geometry: geo, material: mat };
  }, [starClusters]);

  useFrame(() => {
    const pts = pointsRef.current;
    if (!pts) return;
    const tier = floatingOriginRef.current.lodTier;
    pts.visible = enabled && (orbitAtlas || tier !== "solar");
    const mat = pts.material as THREE.ShaderMaterial;
    const cinematicScale =
      cinematicCameraProfile === "selected-body-cinematic"
        ? 0.42
        : cinematicCameraProfile === "showcase-deep-space"
          ? 0.76
          : 1;
    const baseOpacity = orbitAtlas ? 0.012 : tier === "solar" ? 0 : tier === "mid" ? 0.072 : 0.24;
    mat.uniforms.uOpacity.value = !enabled ? 0 : baseOpacity * cinematicScale * profileOpacity;
  });

  return (
    <group>
      <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} renderOrder={-445} />
    </group>
  );
}
