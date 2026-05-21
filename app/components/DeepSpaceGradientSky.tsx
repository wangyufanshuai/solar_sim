"use client";

import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useLayoutEffect, useMemo, useRef } from "react";

/**
 * Procedural deep blue–black gradient sphere (fallback when no equirect loads).
 * Inward-facing, no texture; gives depth vs flat clear color alone.
 *
 * Uses a fixed large radius (490000) so it works with logarithmicDepthBuffer
 * regardless of camera position. The log-depth shader handles the precision.
 */
const SKY_SPHERE_RADIUS = 9500;

export default function DeepSpaceGradientSky({ visible = true }: { visible?: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);

  const { vertexShader, fragmentShader } = useMemo(
    () => ({
      vertexShader: `
        varying vec3 vDir;
        #include <common>
        #include <logdepthbuf_pars_vertex>
        void main() {
          vDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          #include <logdepthbuf_vertex>
        }
      `,
      fragmentShader: `
        precision highp float;
        varying vec3 vDir;
        #include <logdepthbuf_pars_fragment>

        float hash(vec3 p) {
          p = fract(p * 0.3183099 + vec3(0.11, 0.17, 0.23));
          p *= 17.0;
          return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
        }

        float noise(vec3 p) {
          vec3 i = floor(p);
          vec3 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          float n000 = hash(i + vec3(0.0, 0.0, 0.0));
          float n100 = hash(i + vec3(1.0, 0.0, 0.0));
          float n010 = hash(i + vec3(0.0, 1.0, 0.0));
          float n110 = hash(i + vec3(1.0, 1.0, 0.0));
          float n001 = hash(i + vec3(0.0, 0.0, 1.0));
          float n101 = hash(i + vec3(1.0, 0.0, 1.0));
          float n011 = hash(i + vec3(0.0, 1.0, 1.0));
          float n111 = hash(i + vec3(1.0, 1.0, 1.0));
          float nx00 = mix(n000, n100, f.x);
          float nx10 = mix(n010, n110, f.x);
          float nx01 = mix(n001, n101, f.x);
          float nx11 = mix(n011, n111, f.x);
          float nxy0 = mix(nx00, nx10, f.y);
          float nxy1 = mix(nx01, nx11, f.y);
          return mix(nxy0, nxy1, f.z);
        }

        void main() {
          vec3 dir = normalize(vDir);
          float h = abs(dir.y);
          vec3 bandNormal = normalize(vec3(0.36, 0.84, -0.40));
          float band = smoothstep(0.28, 0.98, 1.0 - abs(dot(dir, bandNormal)));
          float filamentA = noise(dir * 11.0 + vec3(4.1, 1.7, 0.4));
          float filamentB = noise(dir * 26.0 + vec3(0.3, 7.4, 2.8));
          float dust = smoothstep(0.34, 0.88, filamentA) * 0.68 + smoothstep(0.46, 0.98, filamentB) * 0.32;
          float darkLane = smoothstep(0.40, 0.92, noise(dir * 15.0 + vec3(8.3, 2.2, 5.1)));
          vec3 zenith = vec3(0.00035, 0.00065, 0.0018);
          vec3 horizon = vec3(0.0010, 0.0018, 0.0042);
          vec3 bandCool = vec3(0.010, 0.019, 0.036) * pow(band, 1.55) * (0.26 + dust * 0.62);
          vec3 bandWarm = vec3(0.014, 0.011, 0.007) * pow(band, 4.8) * smoothstep(0.55, 1.0, filamentA) * 0.12;
          float t = pow(h, 0.58);
          vec3 col = mix(horizon, zenith, t) + bandCool + bandWarm;
          col *= mix(1.0, 0.54, pow(band, 2.2) * darkLane * 0.55);
          col = min(col, vec3(0.020, 0.030, 0.050));
          gl_FragColor = vec4(col, 1.0);
          #include <logdepthbuf_fragment>
        }
      `,
    }),
    []
  );

  useLayoutEffect(() => {
    const m = meshRef.current;
    if (m) m.raycast = () => {};
  }, []);

  if (!visible) return null;

  return (
    <mesh
      ref={meshRef}
      frustumCulled={false}
      renderOrder={-610}
      scale={[SKY_SPHERE_RADIUS, SKY_SPHERE_RADIUS, SKY_SPHERE_RADIUS] as [number, number, number]}
    >
      <sphereGeometry args={[1, 36, 24]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        side={THREE.BackSide}
        depthWrite={false}
        depthTest
        toneMapped
      />
    </mesh>
  );
}
