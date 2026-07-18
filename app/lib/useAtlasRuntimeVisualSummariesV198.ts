import { useEffect, useState } from "react";
import {
  ATLAS_RUNTIME_VISUAL_COMPACT_SUMMARIES_V198,
  type AtlasRuntimeVisualStaticSummariesV198,
} from "./atlasRuntimeVisualCompactV198";

/** Restores collection-rich visual evidence only for report/evidence surfaces. */
export function useAtlasRuntimeVisualSummariesV198(requested: boolean) {
  const [details, setDetails] = useState<AtlasRuntimeVisualStaticSummariesV198 | null>(null);
  useEffect(() => {
    if (!requested || details) return;
    let active = true;
    void import("./atlasRuntimeVisualCompatibilityV198").then((module) => {
      if (active) setDetails(module.ATLAS_RUNTIME_VISUAL_STATIC_SUMMARIES_V198);
    });
    return () => {
      active = false;
    };
  }, [details, requested]);
  return details ?? ATLAS_RUNTIME_VISUAL_COMPACT_SUMMARIES_V198;
}
