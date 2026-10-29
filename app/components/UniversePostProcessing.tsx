"use client";

import { Component, lazy, Suspense, type ReactNode } from "react";
import ThreeJsPostPipeline from "../effects/ThreeJsPostPipeline";
import { readLensingEnv } from "../effects/lightBenderBridge";
import type { SolarPresentationMode } from "../lib/orbitAtlasPresentation";
import type {
  AtlasGlobalColorGradeProfile,
  AtlasReferenceGradeCompositeProfile,
  AtlasSelectedBodyLightingProfile,
} from "../lib/simulationDiagnosticsTypes";

const PmndrsPostProcessing = lazy(
  () => import("./UniversePmndrsPostProcessing"),
);
const LENSING_ENABLED = readLensingEnv().enabled;

function isPublicSsaoEnabled(): boolean {
  if (typeof process === "undefined") return false;
  const value = process.env.NEXT_PUBLIC_ENABLE_SSAO?.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes";
}

const SSAO_ENABLED = isPublicSsaoEnabled();
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

export type UniversePostProcessingProps = {
  visualEnhance?: boolean;
  presentationMode?: SolarPresentationMode;
  selectedBodyLightingProfile?: AtlasSelectedBodyLightingProfile;
  cinematicPostFxProfile?: string;
  referenceGradeCompositeProfile?: AtlasReferenceGradeCompositeProfile;
  globalColorGradeProfile?: AtlasGlobalColorGradeProfile;
};

function ThreeJsFallback(props: UniversePostProcessingProps) {
  return (
    <ThreeJsPostPipeline
      visualEnhance={props.visualEnhance ?? false}
      presentationMode={props.presentationMode ?? "sandbox"}
      selectedBodyLightingProfile={props.selectedBodyLightingProfile ?? "overview"}
      cinematicPostFxProfile={props.cinematicPostFxProfile}
      referenceGradeCompositeProfile={props.referenceGradeCompositeProfile}
      globalColorGradeProfile={props.globalColorGradeProfile}
    />
  );
}

/**
 * Default rendering stays on the existing Three.js pipeline. The optional
 * pmndrs lensing/SSAO stack is requested only when its public feature switch
 * is enabled, keeping N8AO blue-noise and postprocessing code off the cold
 * Canvas path without changing either rendering policy.
 */
export default function UniversePostProcessing(props: UniversePostProcessingProps) {
  const presentationMode = props.presentationMode ?? "sandbox";
  if (presentationMode === "orbit-atlas" || !USE_PMNDRS_POST_STACK) {
    return (
      <PostFxBoundary>
        <ThreeJsFallback {...props} presentationMode={presentationMode} />
      </PostFxBoundary>
    );
  }

  return (
    <PostFxBoundary>
      <Suspense fallback={<ThreeJsFallback {...props} presentationMode={presentationMode} />}>
        <PmndrsPostProcessing {...props} presentationMode={presentationMode} />
      </Suspense>
    </PostFxBoundary>
  );
}
