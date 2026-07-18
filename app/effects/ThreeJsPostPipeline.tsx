"use client";

import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useEffect, useLayoutEffect, useRef } from "react";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { createVignetteShaderPass } from "./vignetteShaderPass";
import type { SolarPresentationMode } from "../lib/orbitAtlasPresentation";
import type {
  AtlasReferenceGradeCompositeProfile,
  AtlasGlobalColorGradeProfile,
  AtlasSelectedBodyLightingProfile,
} from "../lib/simulationDiagnosticsTypes";

type PassRefs = {
  composer: EffectComposer;
  bloomPass: UnrealBloomPass;
  vignettePass: ShaderPass;
};

export default function ThreeJsPostPipeline({
  visualEnhance = false,
  presentationMode = "sandbox",
  selectedBodyLightingProfile = "overview",
  cinematicPostFxProfile,
  referenceGradeCompositeProfile,
  globalColorGradeProfile,
}: {
  visualEnhance?: boolean;
  presentationMode?: SolarPresentationMode;
  selectedBodyLightingProfile?: AtlasSelectedBodyLightingProfile;
  cinematicPostFxProfile?: string;
  referenceGradeCompositeProfile?: AtlasReferenceGradeCompositeProfile;
  globalColorGradeProfile?: AtlasGlobalColorGradeProfile;
}) {
  const { gl, scene, camera, size } = useThree();
  const refs = useRef<PassRefs | null>(null);

  useLayoutEffect(() => {
    const composer = new EffectComposer(gl);
    const renderPass = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(size.width, size.height),
      0.14,
      0.16,
      0.96
    );
    const vignettePass = createVignetteShaderPass(0.58, 1.08);
    const outputPass = new OutputPass();

    composer.addPass(renderPass);
    composer.addPass(bloomPass);
    composer.addPass(vignettePass);
    composer.addPass(outputPass);

    composer.setPixelRatio(1);
    composer.setSize(size.width, size.height);

    refs.current = { composer, bloomPass, vignettePass };

    return () => {
      bloomPass.dispose();
      vignettePass.dispose();
      outputPass.dispose();
      composer.dispose();
      refs.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, scene, camera]);

  useEffect(() => {
    const b = refs.current?.bloomPass;
    const v = refs.current?.vignettePass;
    if (!b) return;
    const cinematicCloseup =
      selectedBodyLightingProfile !== "overview" &&
      cinematicPostFxProfile === "aces-vignette-restrained-bloom";
    const referenceGradeCloseup = referenceGradeCompositeProfile === "selected-body-subject-matte";
    const v55GlobalColor = globalColorGradeProfile === "filmic-cool-space-warm-planet-protection";
    const solarCloseup = selectedBodyLightingProfile === "solar-closeup";
    const gasGiantCloseup = selectedBodyLightingProfile === "gas-giant-closeup";
    if (cinematicCloseup) {
      b.strength = v55GlobalColor ? solarCloseup ? 0.038 : gasGiantCloseup ? 0.035 : 0.04 : referenceGradeCloseup ? solarCloseup ? 0.055 : gasGiantCloseup ? 0.048 : 0.052 : solarCloseup ? 0.09 : gasGiantCloseup ? 0.075 : 0.065;
      b.radius = v55GlobalColor ? 0.08 : referenceGradeCloseup ? 0.09 : solarCloseup ? 0.13 : 0.11;
      b.threshold = v55GlobalColor ? solarCloseup ? 0.992 : 0.986 : referenceGradeCloseup ? solarCloseup ? 0.988 : 0.983 : solarCloseup ? 0.982 : 0.975;
    } else if (presentationMode === "orbit-atlas") {
      b.strength = visualEnhance ? 0.08 : 0.045;
      b.radius = 0.12;
      b.threshold = 0.985;
    } else if (visualEnhance) {
      b.strength = 0.2;
      b.radius = 0.2;
      b.threshold = 0.94;
    } else {
      b.strength = 0.14;
      b.radius = 0.16;
      b.threshold = 0.96;
    }
    if (v?.uniforms.darkness && v.uniforms.offset) {
      v.uniforms.darkness.value =
        v55GlobalColor
          ? cinematicCloseup ? presentationMode === "orbit-atlas" ? 0.48 : 0.56 : presentationMode === "orbit-atlas" ? 0.38 : 0.52
          : cinematicCloseup
          ? referenceGradeCloseup ? presentationMode === "orbit-atlas" ? 0.44 : 0.52 : presentationMode === "orbit-atlas" ? 0.38 : 0.5
          : presentationMode === "orbit-atlas" ? 0.34 : visualEnhance ? 0.52 : 0.58;
      v.uniforms.offset.value =
        v55GlobalColor
          ? cinematicCloseup ? gasGiantCloseup ? 0.96 : 0.98 : presentationMode === "orbit-atlas" ? 0.98 : 1.04
          : cinematicCloseup
          ? referenceGradeCloseup ? gasGiantCloseup ? 0.98 : 1.0 : gasGiantCloseup ? 1.02 : 1.04
          : presentationMode === "orbit-atlas" ? 1.0 : visualEnhance ? 0.98 : 1.08;
    }
  }, [cinematicPostFxProfile, globalColorGradeProfile, presentationMode, referenceGradeCompositeProfile, selectedBodyLightingProfile, visualEnhance]);

  useEffect(() => {
    const c = refs.current?.composer;
    if (!c) return;
    c.setPixelRatio(1);
    c.setSize(size.width, size.height);
  }, [gl, size.width, size.height, size]);

  useFrame(() => {
    const composer = refs.current?.composer;
    if (!composer) return;
    composer.render();
  }, 1);

  return null;
}
