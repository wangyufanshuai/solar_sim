"use client";

import { useMemo, useRef } from "react";
import type { AtlasRuntimeEvidenceCompositionScopeV190 } from "./atlasRuntimeEvidenceCompositionV190";
import { createAtlasLegacyRootAttributesV256 } from "./atlasLegacyRootCompatibilityV256";

function useShallowStableScope(
  scope: AtlasRuntimeEvidenceCompositionScopeV190,
): AtlasRuntimeEvidenceCompositionScopeV190 {
  const ref = useRef(scope);
  const previous = ref.current;
  const keys = Object.keys(scope) as (keyof AtlasRuntimeEvidenceCompositionScopeV190)[];
  const previousKeys = Object.keys(previous);
  if (
    keys.length !== previousKeys.length ||
    keys.some((key) => !Object.is(previous[key], scope[key]))
  ) {
    ref.current = scope;
  }
  return ref.current;
}

export function useAtlasLegacyRootAttributesV256(
  scope: AtlasRuntimeEvidenceCompositionScopeV190,
) {
  const stableScope = useShallowStableScope(scope);
  return useMemo(
    () => createAtlasLegacyRootAttributesV256(stableScope),
    [stableScope],
  );
}
