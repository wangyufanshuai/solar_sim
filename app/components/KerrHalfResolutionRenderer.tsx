"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { acquireAtlasResource } from "../lib/atlasResourceLifecycle";

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const fragmentShader = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform float uSpin;

float band(float value, float center, float width) {
  return exp(-abs(value - center) / max(width, 0.0001));
}

void main() {
  vec2 p = (vUv - 0.5) * 2.0;
  float r = length(p);
  float angle = atan(p.y, p.x);
  float spin = clamp(uSpin, -0.999, 0.999);
  float shadowRadius = 0.205 - abs(spin) * 0.018;
  float photonRing = band(r, shadowRadius * 1.24, 0.012);

  float warp = 0.055 * sin(angle * 2.0 - uTime * (0.45 + abs(spin)));
  float diskY = p.y + warp * smoothstep(0.16, 0.62, abs(p.x));
  float diskRadius = length(vec2(p.x, diskY * 5.7));
  float diskMask = smoothstep(0.62, 0.18, diskRadius) * smoothstep(0.16, 0.24, diskRadius);
  float filament = 0.58 + 0.42 * sin(angle * 11.0 - uTime * 1.8 + r * 48.0);
  diskMask *= 0.7 + 0.3 * filament;

  float upperArc = band(r, 0.32 + 0.045 * cos(angle), 0.018) * smoothstep(-0.04, 0.18, p.y);
  float doppler = smoothstep(-0.55, 0.55, p.x);
  vec3 hot = mix(vec3(1.0, 0.3, 0.08), vec3(0.38, 0.72, 1.0), doppler);
  vec3 color = hot * diskMask * (1.7 + filament * 0.5);
  color += mix(vec3(1.0, 0.56, 0.18), vec3(0.45, 0.78, 1.0), doppler) * upperArc * 0.9;
  color += vec3(0.78, 0.9, 1.0) * photonRing * 2.5;

  float shadow = 1.0 - smoothstep(shadowRadius - 0.005, shadowRadius + 0.008, r);
  color *= 1.0 - shadow;
  float alpha = clamp(max(max(diskMask, upperArc), photonRing) * 1.45 + shadow, 0.0, 1.0);
  gl_FragColor = vec4(color, alpha);
}
`;

export function KerrHalfResolutionRenderer({
  radiusScene,
  spinA,
}: {
  radiusScene: number;
  spinA: number;
}) {
  const gl = useThree((state) => state.gl);
  const size = useThree((state) => state.size);
  const mobileSafe = size.width < 700 || !gl.capabilities.isWebGL2;
  const resolutionScale = mobileSafe ? 0.5 : 0.75;
  const targetSize = Math.max(
    192,
    Math.min(768, Math.floor(Math.min(size.width, size.height) * resolutionScale)),
  );

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
    return {
      scene,
      camera,
      geometry,
      material,
      uniforms,
      previousClearColor: new THREE.Color(),
    };
  }, [spinA]);

  useEffect(
    () => {
      const releaseTarget = target
        ? acquireAtlasResource("gpu-render-target", "kerr", "kerr-half-resolution", {
          owner: "kerr-presentation",
          estimatedBytes: targetSize * targetSize * 4,
        })
        : () => {};
      const spriteMaterial = spriteMaterialRef.current;
      return () => {
        if (spriteMaterial) {
          spriteMaterial.map = null;
          spriteMaterial.dispose();
        }
        target?.texture.dispose();
        target?.dispose();
        offscreen.geometry.dispose();
        offscreen.material.dispose();
        releaseTarget();
      };
    },
    [offscreen, target, targetSize],
  );

  useFrame((state) => {
    if (mobileSafe) return;
    offscreen.uniforms.uTime.value = state.clock.elapsedTime;
    offscreen.uniforms.uSpin.value = spinA;
    const previous = gl.getRenderTarget();
    gl.getClearColor(offscreen.previousClearColor);
    const previousClearAlpha = gl.getClearAlpha();
    if (!target) return;
    gl.setRenderTarget(target);
    gl.setClearColor(0x000000, 0);
    gl.clear(true, false, false);
    gl.render(offscreen.scene, offscreen.camera);
    gl.setRenderTarget(previous);
    gl.setClearColor(offscreen.previousClearColor, previousClearAlpha);
  }, -0.5);

  if (mobileSafe) {
    return (
      <mesh rotation={[Math.PI / 2, 0, 0]} renderOrder={-16}>
        <torusGeometry args={[radiusScene * 1.28, radiusScene * 0.035, 8, 64]} />
        <meshBasicMaterial
          color="#f5c37a"
          transparent
          opacity={0.7}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    );
  }

  return (
    <sprite scale={[radiusScene * 10, radiusScene * 10, 1]} renderOrder={-16}>
      <spriteMaterial
        ref={spriteMaterialRef}
        map={target?.texture ?? null}
        transparent
        depthWrite={false}
        depthTest
        toneMapped={false}
      />
    </sprite>
  );
}
