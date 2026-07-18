"use client";

import {
  BrightnessContrast,
  EffectComposer,
  SelectiveBloom,
  SMAA,
  SSAO,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo } from "react";
import { BlendFunction, SMAAPreset, ToneMappingMode } from "postprocessing";
import { useBloomScene } from "../context/BloomSceneContext";
import LightBender from "../effects/LightBender";
import { readLensingEnv } from "../effects/lightBenderBridge";
import SunLensFlare from "../effects/SunLensFlare";
import { TRUE_VOID_TONE_MAPPING_EXPOSURE } from "../lib/trueVoid";
import type { UniversePostProcessingProps } from "./UniversePostProcessing";

const LENSING_ENABLED = readLensingEnv().enabled;
const SSAO_ENABLED = (() => {
  if (typeof process === "undefined") return false;
  const value = process.env.NEXT_PUBLIC_ENABLE_SSAO?.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes";
})();

const BLOOM_BASE = {
  luminanceThreshold: 0.96,
  luminanceSmoothing: 0.28,
  intensity: 0.18,
  radius: 0.16,
  levels: 7,
} as const;
const BLOOM_ENHANCE = {
  luminanceThreshold: 0.93,
  luminanceSmoothing: 0.34,
  intensity: 0.26,
  radius: 0.22,
  levels: 8,
} as const;
const BLOOM_CINEMATIC_CLOSEUP = {
  luminanceThreshold: 0.955,
  luminanceSmoothing: 0.32,
  intensity: 0.2,
  radius: 0.18,
  levels: 7,
} as const;

function PmndrsToneMappingExposureSync() {
  const gl = useThree((state) => state.gl);
  useFrame(() => {
    gl.toneMappingExposure = TRUE_VOID_TONE_MAPPING_EXPOSURE;
  });
  return null;
}

export default function UniversePmndrsPostProcessing({
  visualEnhance = false,
  selectedBodyLightingProfile = "overview",
  cinematicPostFxProfile,
  referenceGradeCompositeProfile,
  globalColorGradeProfile,
}: UniversePostProcessingProps) {
  const { bloomTargets, sunLight } = useBloomScene();
  const lights = useMemo(() => (sunLight ? [sunLight] : []), [sunLight]);
  const canSelective = lights.length > 0 && bloomTargets.length > 0;
  const lensingOptions = readLensingEnv();
  const cinematicCloseup = selectedBodyLightingProfile !== "overview"
    && cinematicPostFxProfile === "aces-vignette-restrained-bloom";
  const referenceGradeCloseup = referenceGradeCompositeProfile === "selected-body-subject-matte";
  const v55GlobalColor = globalColorGradeProfile === "filmic-cool-space-warm-planet-protection";
  const bloom = cinematicCloseup
    ? v55GlobalColor
      ? { ...BLOOM_CINEMATIC_CLOSEUP, luminanceThreshold: 0.982, intensity: 0.105, radius: 0.105 }
      : referenceGradeCloseup
        ? { ...BLOOM_CINEMATIC_CLOSEUP, luminanceThreshold: 0.972, intensity: 0.15, radius: 0.14 }
        : BLOOM_CINEMATIC_CLOSEUP
    : visualEnhance ? BLOOM_ENHANCE : BLOOM_BASE;

  return (
    <EffectComposer
      multisampling={0}
      depthBuffer
      enableNormalPass={SSAO_ENABLED}
      resolutionScale={SSAO_ENABLED ? 0.5 : undefined}
    >
      <PmndrsToneMappingExposureSync />
      {LENSING_ENABLED ? (
        <LightBender
          lensingStrength={lensingOptions.lensingStrength}
          stepCount={lensingOptions.stepCount}
          uvDeflectScale={lensingOptions.uvDeflectScale}
        />
      ) : <></>}
      {SSAO_ENABLED ? (
        <SSAO
          blendFunction={BlendFunction.MULTIPLY}
          samples={12}
          rings={6}
          intensity={0.12}
          radius={0.1}
          bias={0.028}
          fade={0.02}
          luminanceInfluence={0.32}
          depthAwareUpsampling
          worldDistanceThreshold={22000}
          worldDistanceFalloff={4500}
          worldProximityThreshold={4}
          worldProximityFalloff={0.5}
        />
      ) : <></>}
      {canSelective ? (
        <SelectiveBloom
          lights={lights}
          selection={bloomTargets}
          luminanceThreshold={bloom.luminanceThreshold}
          luminanceSmoothing={bloom.luminanceSmoothing}
          intensity={bloom.intensity}
          radius={bloom.radius}
          levels={bloom.levels}
          mipmapBlur
          ignoreBackground
        />
      ) : <></>}
      {sunLight ? <SunLensFlare sunLight={sunLight} boost={visualEnhance} /> : <></>}
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      {visualEnhance ? (
        <BrightnessContrast
          blendFunction={BlendFunction.NORMAL}
          brightness={v55GlobalColor ? -0.04 : referenceGradeCloseup ? -0.03 : cinematicCloseup ? -0.025 : -0.035}
          contrast={v55GlobalColor ? 0.2 : referenceGradeCloseup ? 0.16 : cinematicCloseup ? 0.18 : 0.24}
        />
      ) : <></>}
      <Vignette
        darkness={v55GlobalColor ? (cinematicCloseup ? 0.5 : 0.46) : cinematicCloseup ? 0.44 : visualEnhance ? 0.42 : 0.48}
        offset={v55GlobalColor ? (cinematicCloseup ? 0.98 : 1.0) : referenceGradeCloseup ? 1.0 : cinematicCloseup ? 1.04 : visualEnhance ? 1.02 : 1.1}
        eskil={false}
      />
      <SMAA preset={SMAAPreset.HIGH} />
    </EffectComposer>
  );
}
