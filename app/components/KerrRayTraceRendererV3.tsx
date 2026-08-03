"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { acquireAtlasResource } from "../lib/atlasResourceLifecycle";
import {
  createKerrRayTraceReportV3,
  type KerrRayTraceQualityV3,
} from "../lib/kerrRayTraceV3";

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

// Bounded WebGL2 preview of the independent Kerr reference layer.  The
// scientific reference remains the float64 CPU tracer; this pass only turns
// the same capture/escape and disk-crossing semantics into an interactive
// visual with a 192-step interactive and 1024-step science-still budget.
const fragmentShader = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform float uSpin;
uniform float uCriticalRadius;
uniform float uMaxSteps;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main() {
  vec2 uv = (vUv - 0.5) * 2.0;
  uv.x *= 1.12;
  vec2 p = uv * 3.6;
  vec2 velocity = normalize(-p + vec2(0.0, 0.001));
  float spin = clamp(uSpin, -0.999, 0.999);
  float radius = length(p);
  float captured = 0.0;
  float disk = 0.0;
  float diskRadius = 0.0;
  float path = 0.0;

  for (int i = 0; i < 1024; i++) {
    if (float(i) >= uMaxSteps) break;
    radius = max(length(p), 0.015);
    float invR3 = 1.0 / (radius * radius * radius);
    vec2 perpendicular = vec2(-p.y, p.x);
    vec2 acceleration = -p * (0.018 * invR3);
    acceleration += perpendicular * (0.006 * spin * invR3);
    vec2 previous = p;
    velocity = normalize(velocity + acceleration * 0.18);
    p += velocity * (0.055 + 0.022 * smoothstep(0.0, 1.0, 1.0 / radius));
    path += 0.055;
    if (radius < uCriticalRadius * 0.92) captured = 1.0;
    float crossed = step(previous.y * p.y, 0.0) * step(1.25, radius) * step(radius, 8.0);
    disk = max(disk, crossed * (1.0 - captured));
    diskRadius = mix(diskRadius, radius, crossed);
    if (radius > 8.0 && dot(p, velocity) > 0.0) break;
  }

  float shadow = smoothstep(uCriticalRadius * 0.92, uCriticalRadius * 1.04, length(uv));
  shadow = mix(shadow, 0.0, captured);
  float ring = exp(-abs(length(uv) - uCriticalRadius) / 0.018);
  float diskBand = exp(-abs(uv.y + 0.06 * sin(uv.x * 4.0 + spin)) / 0.038);
  float diskFlux = max(disk, diskBand * smoothstep(0.78, 0.16, length(uv)) * (1.0 - captured));
  float doppler = smoothstep(-0.7, 0.7, uv.x * sign(spin + 0.001));
  vec3 diskColor = mix(vec3(0.95, 0.18, 0.035), vec3(0.35, 0.75, 1.0), doppler);
  float stars = step(0.992, hash21(floor((uv + 1.0) * 180.0))) * (1.0 - captured) * 0.45;
  vec3 color = vec3(0.004, 0.008, 0.02) * shadow;
  color += diskColor * diskFlux * (1.1 + 0.6 * exp(-diskRadius * 0.15));
  color += vec3(0.7, 0.9, 1.0) * ring * (1.0 - captured);
  color += vec3(0.25, 0.42, 0.7) * stars;
  float alpha = clamp(max(max(diskFlux, ring), 0.26 * (1.0 - shadow)), 0.0, 1.0);
  gl_FragColor = vec4(color, alpha);
}
`;

export function KerrRayTraceRendererV3({
  radiusScene,
  spinA,
  quality = "interactive",
}: {
  radiusScene: number;
  spinA: number;
  quality?: KerrRayTraceQualityV3;
}) {
  const gl = useThree((state) => state.gl);
  const size = useThree((state) => state.size);
  const mobileSafe = quality === "mobile-safe" || size.width < 700 || !gl.capabilities.isWebGL2;
  const resolutionScale = quality === "science-still" ? 1 : quality === "interactive" ? 0.75 : 0.5;
  const targetSize = Math.max(192, Math.min(1024, Math.floor(Math.min(size.width, size.height) * resolutionScale)));
  const maxSteps = quality === "science-still" ? 1024 : quality === "interactive" ? 192 : 0;
  const report = useMemo(() => createKerrRayTraceReportV3({ spinA, quality }), [quality, spinA]);
  const target = useMemo(
    () => mobileSafe
      ? null
      : new THREE.WebGLRenderTarget(targetSize, targetSize, {
        depthBuffer: false,
        stencilBuffer: false,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        type: THREE.UnsignedByteType,
      }),
    [mobileSafe, targetSize],
  );
  const spriteMaterialRef = useRef<THREE.SpriteMaterial>(null);
  const offscreen = useMemo(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const uniforms = {
      uTime: { value: 0 },
      uSpin: { value: spinA },
      uCriticalRadius: { value: Math.max(0.1, report.criticalCurveRadiusScreenM / 18) },
      uMaxSteps: { value: maxSteps },
    };
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    const geometry = new THREE.PlaneGeometry(2, 2);
    scene.add(new THREE.Mesh(geometry, material));
    return { scene, camera, geometry, material, uniforms, previousClearColor: new THREE.Color() };
  }, [maxSteps, report.criticalCurveRadiusScreenM, spinA]);

  useEffect(() => {
    const spriteMaterial = spriteMaterialRef.current;
    const release = target ? acquireAtlasResource("gpu-render-target", "kerr", "kerr-ray-trace-v3", {
      owner: "kerr-presentation",
      estimatedBytes: targetSize * targetSize * 4,
    }) : () => {};
    return () => {
      spriteMaterial?.dispose();
      target?.texture.dispose();
      target?.dispose();
      offscreen.geometry.dispose();
      offscreen.material.dispose();
      release();
    };
  }, [offscreen, target, targetSize]);

  useFrame((state) => {
    if (mobileSafe || !target) return;
    offscreen.uniforms.uTime.value = state.clock.elapsedTime;
    offscreen.uniforms.uSpin.value = spinA;
    const previousTarget = gl.getRenderTarget();
    gl.getClearColor(offscreen.previousClearColor);
    const alpha = gl.getClearAlpha();
    gl.setRenderTarget(target);
    gl.setClearColor(0x000000, 0);
    gl.clear(true, false, false);
    gl.render(offscreen.scene, offscreen.camera);
    gl.setRenderTarget(previousTarget);
    gl.setClearColor(offscreen.previousClearColor, alpha);
  }, -0.65);

  if (mobileSafe) {
    return (
      <mesh rotation={[Math.PI / 2, 0, 0]} renderOrder={-16}>
        <torusGeometry args={[radiusScene * 1.28, radiusScene * 0.035, 8, 64]} />
        <meshBasicMaterial color="#f5c37a" transparent opacity={0.7} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    );
  }
  if (!target) return null;
  return (
    <sprite scale={[radiusScene * 10, radiusScene * 10, 1]} renderOrder={-16}>
      <spriteMaterial ref={spriteMaterialRef} map={target.texture} transparent depthWrite={false} depthTest toneMapped={false} />
    </sprite>
  );
}
