"use client";

import { useThree } from "@react-three/fiber";
import { useEffect, useState } from "react";
import type { WebGLRenderer } from "three";
import UniversePostProcessing from "./UniversePostProcessing";
import type { SolarPresentationMode } from "../lib/orbitAtlasPresentation";
import type {
  AtlasReferenceGradeCompositeProfile,
  AtlasSelectedBodyLightingProfile,
  AtlasGlobalColorGradeProfile,
} from "../lib/simulationDiagnosticsTypes";

/**
 * pmndrs/postprocessing reads `gl.getContext().getContextAttributes().alpha` with no null check.
 * `getContextAttributes()` is null when the WebGL context is lost — mounting EffectComposer then throws.
 */
function webGlContextAttributesReady(gl: WebGLRenderer): boolean {
  const ctx = gl.getContext?.() as WebGLRenderingContext | WebGL2RenderingContext | null;
  if (!ctx) return false;
  const attrs = ctx.getContextAttributes?.();
  return attrs != null;
}

/**
 * Renders postprocessing only when the GL context reports valid attributes; re-checks after
 * `webglcontextlost` / `webglcontextrestored`.
 */
export default function PostProcessingGate({
  visualEnhance,
  presentationMode,
  selectedBodyLightingProfile = "overview",
  cinematicPostFxProfile,
  referenceGradeCompositeProfile,
  globalColorGradeProfile,
  scienceDisplayMode = false,
}: {
  visualEnhance: boolean;
  presentationMode: SolarPresentationMode;
  selectedBodyLightingProfile?: AtlasSelectedBodyLightingProfile;
  cinematicPostFxProfile?: string;
  referenceGradeCompositeProfile?: AtlasReferenceGradeCompositeProfile;
  globalColorGradeProfile?: AtlasGlobalColorGradeProfile;
  scienceDisplayMode?: boolean;
}) {
  const gl = useThree((s) => s.gl);
  const [, setCtxTick] = useState(0);
  const ready = webGlContextAttributesReady(gl);

  useEffect(() => {
    const el = gl.domElement;
    const bump = () => setCtxTick((n) => n + 1);
    el.addEventListener("webglcontextrestored", bump);
    el.addEventListener("webglcontextlost", bump);
    return () => {
      el.removeEventListener("webglcontextrestored", bump);
      el.removeEventListener("webglcontextlost", bump);
    };
  }, [gl]);

  if (!ready || scienceDisplayMode) return null;
  return (
    <UniversePostProcessing
      visualEnhance={visualEnhance}
      presentationMode={presentationMode}
      selectedBodyLightingProfile={selectedBodyLightingProfile}
      cinematicPostFxProfile={cinematicPostFxProfile}
      referenceGradeCompositeProfile={referenceGradeCompositeProfile}
      globalColorGradeProfile={globalColorGradeProfile}
    />
  );
}
