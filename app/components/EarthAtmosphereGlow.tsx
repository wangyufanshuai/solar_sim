"use client";

/**
 * Atmospheric scattering glow shell around planets.
 *
 * Fresnel-based shader that simulates Rayleigh scattering (blue/white limb glow
 * on the lit side, dim red residual on the dark side) and Mie scattering
 * (white forward-scatter near the terminator).
 *
 * When no explicit `sunDirection` prop is provided, the component computes
 * the sun direction each frame from the parent group's world position (the
 * sun sits at or near the scene origin due to floating origin).
 */

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type Props = {
  radius: number;
  sunDirection?: THREE.Vector3;
  atmosphereColor?: THREE.ColorRepresentation;
  atmospherePower?: number;
  atmosphereIntensity?: number;
};

const _tmpWorldPos = new THREE.Vector3();

const vertexShader = `
  varying vec3 vNormalWorld;
  varying vec3 vPositionWorld;
  #include <common>
  #include <logdepthbuf_pars_vertex>
  void main() {
    vNormalWorld = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    vPositionWorld = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    #include <logdepthbuf_vertex>
  }
`;

const fragmentShader = `
  uniform vec3 uAtmosphereColor;
  uniform float uPower;
  uniform float uIntensity;
  uniform vec3 uSunDirection;
  varying vec3 vNormalWorld;
  varying vec3 vPositionWorld;
  #include <logdepthbuf_pars_fragment>

  void main() {
    vec3 viewDir = normalize(cameraPosition - vPositionWorld);
    float rim = 1.0 - abs(dot(vNormalWorld, viewDir));
    float fresnel = pow(rim, uPower);
    float outerBloom = pow(rim, max(0.8, uPower * 0.48));

    // Sun-facing brightness: day side glows, night side dim
    float sunDot = dot(vNormalWorld, uSunDirection);
    float dayFactor = smoothstep(-0.2, 0.6, sunDot);

    // Rayleigh terminator: warm red on dark side, blue-white on lit side
    vec3 terminatorColor = mix(
      vec3(0.12, 0.04, 0.025),
      uAtmosphereColor * 1.65,
      dayFactor
    );

    // Mie forward scatter near terminator
    vec3 viewSun = normalize(uSunDirection);
    float mie = pow(max(0.0, dot(viewDir, viewSun)), 7.0) * 0.28;
    terminatorColor += vec3(1.0, 0.95, 0.9) * mie * dayFactor;

    float alpha = (fresnel * 0.72 + outerBloom * 0.12) * uIntensity * (0.42 + 0.36 * dayFactor);
    gl_FragColor = vec4(terminatorColor, alpha);
    #include <logdepthbuf_fragment>
  }
`;

export default function EarthAtmosphereGlow({
  radius,
  sunDirection: sunDirProp,
  atmosphereColor = "#4488ff",
  atmospherePower = 3.15,
  atmosphereIntensity = 0.36,
}: Props) {
  const meshRef = useRef<THREE.Mesh>(null);

  const sunDir = useMemo(
    () => sunDirProp ?? new THREE.Vector3(1, 0.2, 0.5).normalize(),
    [sunDirProp]
  );

  const uniforms = useMemo(
    () => ({
      uAtmosphereColor: { value: new THREE.Color(atmosphereColor) },
      uPower: { value: atmospherePower },
      uIntensity: { value: atmosphereIntensity },
      uSunDirection: { value: sunDir.clone() },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [atmosphereColor, atmospherePower, atmosphereIntensity]
  );

  // Update sun direction each frame
  useFrame(() => {
    if (sunDirProp) {
      uniforms.uSunDirection.value.copy(sunDirProp);
    } else {
      const mesh = meshRef.current;
      if (mesh) {
        const parent = mesh.parent;
        if (parent) {
          parent.getWorldPosition(_tmpWorldPos);
          _tmpWorldPos.negate().normalize();
          uniforms.uSunDirection.value.copy(_tmpWorldPos);
        }
      }
    }
  });

  const glowRadius = radius * 1.022;
  const segments = 96;

  return (
    <mesh ref={meshRef} renderOrder={-10}>
      <sphereGeometry args={[glowRadius, segments, segments]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.FrontSide}
        toneMapped={false}
      />
    </mesh>
  );
}
