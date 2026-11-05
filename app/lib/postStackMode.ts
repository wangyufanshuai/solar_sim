import { readLensingEnv } from "../effects/lightBenderBridge";

function isPublicSsaoEnabled(): boolean {
  if (typeof process === "undefined") return false;
  const v = process.env.NEXT_PUBLIC_ENABLE_SSAO?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

/**
 * When true, `UniversePostProcessing` uses pmndrs `EffectComposer` (lensing / SSAO path)
 * instead of `ThreeJsPostPipeline` + `UnrealBloomPass`.
 */
export const USE_PMNDRS_POST_STACK =
  readLensingEnv().enabled || isPublicSsaoEnabled();
