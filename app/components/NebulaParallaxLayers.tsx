"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { buildNebulaParallaxStars } from "../lib/nebulaParallaxLayers";
import { MAINLINE_A_NEBULA_IMAGE_RENDER_ORDER_V638 } from "../lib/mainlineANebulaCompositionV638";

/**
 * Roadmap A3: the two illustrative star layers around a nebula observation image (see
 * app/lib/nebulaParallaxLayers.ts). The image plane draws with depthTest off at render order 30,
 * so ordering decides occlusion:
 * - "far" pass (order 29, before the image): every star farther from the camera than the nebula;
 *   the opaque image covers those behind it.
 * - "near" pass (order 31, after the image): foreground-shell stars nearer than the nebula,
 *   faded out between 0.5 and 0.35 of the nebula distance so nothing flies into the lens.
 * Background-shell stars nearer than the nebula would sit around the camera and are dropped.
 */
const VERTEX = /* glsl */ `
attribute float aSize;
attribute float aLayer;
attribute vec3 aColor;
uniform float uMode;
uniform float uOpacity;
uniform float uPixelRatio;
varying vec3 vColor;
varying float vAlpha;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float depth = -mv.z;
  float target = -(modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).z;
  float keep = 0.0;
  if (uMode < 0.5) keep = (aLayer < 0.5 && depth < target) ? smoothstep(0.35 * target, 0.5 * target, depth) : 0.0;
  else keep = depth >= target ? 1.0 : 0.0;
  if (keep <= 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; vColor = vec3(0.0); vAlpha = 0.0; return; }
  gl_Position = projectionMatrix * mv;
  // Apparent size grows as 1/depth (perspective); aSize is the size in pixels at the nebula's depth.
  float size = clamp(aSize * target / depth, 0.8, 9.0);
  gl_PointSize = size * uPixelRatio;
  // Sub-2-pixel sprites lose most of their Gaussian core; keep their integrated brightness roughly constant.
  vColor = aColor * max(1.0, 2.0 / size);
  vAlpha = keep * uOpacity;
}`;

const FRAGMENT = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;
void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(p, p);
  if (r2 > 1.0) discard;
  float core = exp(-r2 * 5.0);
  gl_FragColor = vec4(vColor * core * vAlpha, 1.0);
  #include <colorspace_fragment>
}`;

function createLayerMaterial(mode: 0 | 1): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    uniforms: { uMode: { value: mode }, uOpacity: { value: 0 }, uPixelRatio: { value: 1 } },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
}

export default function NebulaParallaxLayers({ objectId, position, visible }: {
  objectId: string;
  position: readonly [number, number, number];
  visible: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const world = useMemo(() => new THREE.Vector3(), []);
  const fade = useRef(0);
  const pixelRatio = useThree((state) => state.viewport.dpr);
  const geometry = useMemo(() => {
    const stars = buildNebulaParallaxStars(objectId);
    const result = new THREE.BufferGeometry();
    result.setAttribute("position", new THREE.BufferAttribute(stars.positions, 3));
    result.setAttribute("aColor", new THREE.BufferAttribute(stars.colors, 3));
    result.setAttribute("aSize", new THREE.BufferAttribute(stars.sizes, 1));
    result.setAttribute("aLayer", new THREE.BufferAttribute(stars.layers, 1));
    // The group is rescaled every frame; never cull against the unit-sized bounds.
    result.boundingSphere = new THREE.Sphere(new THREE.Vector3(), Infinity);
    return result;
  }, [objectId]);
  const far = useMemo(() => createLayerMaterial(1), []);
  const near = useMemo(() => createLayerMaterial(0), []);
  useEffect(() => () => { geometry.dispose(); far.dispose(); near.dispose(); }, [far, geometry, near]);

  useFrame(({ camera }, delta) => {
    const group = groupRef.current;
    if (!group) return;
    group.getWorldPosition(world);
    const distance = camera.position.distanceTo(world);
    if (Number.isFinite(distance) && distance > 0) group.scale.setScalar(distance);
    fade.current = visible ? Math.min(1, fade.current + delta / 0.8) : 0;
    for (const material of [far, near]) {
      material.uniforms.uOpacity.value = fade.current;
      material.uniforms.uPixelRatio.value = pixelRatio;
    }
  });

  return (
    <group ref={groupRef} position={position} userData={{
      atlasLayer: "nebula-parallax-layers-a3",
      atlasObjectId: objectId,
      atlasPresentationOnly: true,
      atlasIllustrativeStars: true,
      atlasCatalogStarsClaimed: false,
      atlasDepthReconstructionClaimed: false,
    }}>
      <points geometry={geometry} material={far} renderOrder={MAINLINE_A_NEBULA_IMAGE_RENDER_ORDER_V638 - 1} frustumCulled={false} raycast={() => null} />
      <points geometry={geometry} material={near} renderOrder={MAINLINE_A_NEBULA_IMAGE_RENDER_ORDER_V638 + 1} frustumCulled={false} raycast={() => null} />
    </group>
  );
}
