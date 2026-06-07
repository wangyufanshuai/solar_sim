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
import { Component, type ReactNode, useMemo } from "react";
import { BlendFunction, SMAAPreset, ToneMappingMode } from "postprocessing";
import { useBloomScene } from "../context/BloomSceneContext";
import LightBender from "../effects/LightBender";
import ThreeJsPostPipeline from "../effects/ThreeJsPostPipeline";
import { readLensingEnv } from "../effects/lightBenderBridge";
import SunLensFlare from "../effects/SunLensFlare";

const LENSING_ENABLED = readLensingEnv().enabled;

function isPublicSsaoEnabled(): boolean {
  if (typeof process === "undefined") return false;
  const v = process.env.NEXT_PUBLIC_ENABLE_SSAO?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

const SSAO_ENABLED = isPublicSsaoEnabled();

/** When false, use three.js EffectComposer + UnrealBloomPass (ThreeJsPostPipeline). */
const USE_PMNDRS_POST_STACK = LENSING_ENABLED || SSAO_ENABLED;

class PostFxBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

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

/**
 * 统一后处理出口：默认 three.js UnrealBloom 管线；透镜/SSAO 时走 pmndrs SelectiveBloom 等。
 * `useFrame(..., 1)` 于 ThreeJsPostPipeline 内关闭 R3F 默认 gl.render，避免双次场景绘制。
 */
export default function UniversePostProcessing({
  visualEnhance = false,
}: {
  visualEnhance?: boolean;
}) {
  const { bloomTargets, sunLight } = useBloomScene();
  const lights = useMemo(
    () => (sunLight ? [sunLight] : []),
    [sunLight]
  );
  const canSelective = lights.length > 0 && bloomTargets.length > 0;

  const lensingOpts = readLensingEnv();
  const bloom = visualEnhance ? BLOOM_ENHANCE : BLOOM_BASE;

  if (!USE_PMNDRS_POST_STACK) {
    return (
      <PostFxBoundary>
        <ThreeJsPostPipeline visualEnhance={visualEnhance} />
      </PostFxBoundary>
    );
  }

  return (
    <PostFxBoundary>
      <EffectComposer
        multisampling={0}
        depthBuffer
        enableNormalPass={SSAO_ENABLED}
        resolutionScale={SSAO_ENABLED ? 0.5 : undefined}
      >
        {LENSING_ENABLED ? (
          <LightBender
            lensingStrength={lensingOpts.lensingStrength}
            stepCount={lensingOpts.stepCount}
            uvDeflectScale={lensingOpts.uvDeflectScale}
          />
        ) : (
          <></>
        )}
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
        ) : (
          <></>
        )}
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
        ) : (
          <></>
        )}
        {sunLight ? (
          <SunLensFlare sunLight={sunLight} boost={visualEnhance} />
        ) : (
          <></>
        )}
        {/* EffectComposer sets gl.toneMapping = NoToneMapping; ACES runs here (see PmndrsToneMappingExposureSync). */}
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        {visualEnhance ? (
          <BrightnessContrast
            blendFunction={BlendFunction.NORMAL}
            brightness={-0.035}
            contrast={0.24}
          />
        ) : (
          <></>
        )}
        <Vignette
          darkness={visualEnhance ? 0.42 : 0.48}
          offset={visualEnhance ? 1.02 : 1.1}
          eskil={false}
        />
        <SMAA preset={SMAAPreset.HIGH} />
      </EffectComposer>
    </PostFxBoundary>
  );
}
