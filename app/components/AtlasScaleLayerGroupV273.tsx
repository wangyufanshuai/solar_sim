"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { atlasScaleLayerOpacityV273, type AtlasScaleLayerV273 } from "../lib/atlasScalePresentationV273";
import { useAtlasRuntimeStore } from "../lib/atlasRuntimeStore";

type MaterialState = {
  opacity: number;
  transparent: boolean;
  depthWrite: boolean;
  uniformOpacity: number | null;
  appliedScale: number;
};

export default function AtlasScaleLayerGroupV273({ band, children }: { band: AtlasScaleLayerV273 | readonly AtlasScaleLayerV273[]; children: ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);
  const current = useAtlasRuntimeStore((snapshot) => snapshot.scaleBand);
  const journey = useAtlasRuntimeStore((snapshot) => snapshot.scaleJourney);
  const visualProfile = useAtlasRuntimeStore((snapshot) => snapshot.visualProfile);
  const materialStatesRef = useRef(new Map<THREE.Material, MaterialState>());
  const previousOpacityRef = useRef(-1);

  const apply = (opacity: number) => {
    const group = groupRef.current;
    if (!group) return;
    group.visible = opacity > 0.001;
    group.traverse((object) => {
      const mesh = object as THREE.Mesh;
      const materials = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
      for (const material of materials) {
        const shader = material as THREE.ShaderMaterial;
        let state = materialStatesRef.current.get(material);
        if (!state) {
          state = {
            opacity: material.opacity,
            transparent: material.transparent,
            depthWrite: material.depthWrite,
            uniformOpacity: shader.uniforms?.uOpacity && typeof shader.uniforms.uOpacity.value === "number"
              ? shader.uniforms.uOpacity.value
              : null,
            appliedScale: 1,
          };
          materialStatesRef.current.set(material, state);
        } else if (state.uniformOpacity !== null && shader.uniforms?.uOpacity) {
          const currentUniform = shader.uniforms.uOpacity.value as number;
          const expectedUniform = state.uniformOpacity * state.appliedScale;
          if (Math.abs(currentUniform - expectedUniform) > 1e-5) state.uniformOpacity = currentUniform;
        } else {
          const expectedOpacity = state.opacity * state.appliedScale;
          if (Math.abs(material.opacity - expectedOpacity) > 1e-5) state.opacity = material.opacity;
        }
        if (state.uniformOpacity !== null && shader.uniforms?.uOpacity) shader.uniforms.uOpacity.value = state.uniformOpacity * opacity;
        else material.opacity = state.opacity * opacity;
        state.appliedScale = opacity;
        const transparent = state.transparent || opacity < 0.999;
        if (material.transparent !== transparent) {
          material.transparent = transparent;
          material.needsUpdate = true;
        }
        material.depthWrite = opacity < 0.999 ? false : state.depthWrite;
      }
    });
  };

  useFrame(() => {
    const bands = Array.isArray(band) ? band : [band];
    const opacity = Math.max(...bands.map((entry) => atlasScaleLayerOpacityV273(entry, current, journey)));
    if (Math.abs(previousOpacityRef.current - opacity) < 0.002) return;
    previousOpacityRef.current = opacity;
    apply(opacity);
  }, -20);

  useEffect(() => {
    // Visual profile consumers may replace their full-opacity value while the
    // scale layer is stable. Force one compositor pass so that value becomes
    // the new base instead of reviving the mount-time opacity.
    previousOpacityRef.current = -1;
  }, [visualProfile]);

  useEffect(() => () => {
    for (const [material, state] of materialStatesRef.current) {
      const shader = material as THREE.ShaderMaterial;
      material.opacity = state.opacity;
      material.transparent = state.transparent;
      material.depthWrite = state.depthWrite;
      if (state.uniformOpacity !== null && shader.uniforms?.uOpacity) shader.uniforms.uOpacity.value = state.uniformOpacity;
      material.needsUpdate = true;
    }
    materialStatesRef.current.clear();
  }, []);

  return <group ref={groupRef} userData={{ atlasScaleBand: Array.isArray(band) ? band.join(",") : band, atlasScaleCompositor: "v273" }}>{children}</group>;
}
