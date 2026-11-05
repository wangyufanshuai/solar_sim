"use client";

import { memo, useMemo } from "react";
import {
  serializeAtlasRuntimeStateV256,
  type AtlasRuntimeStateV256,
} from "../lib/atlasRuntimeStateV256";

function AtlasRuntimeEvidenceSurfaceV256({
  state,
}: {
  state: AtlasRuntimeStateV256;
}) {
  const serialized = useMemo(
    () => serializeAtlasRuntimeStateV256(state),
    [state],
  );
  return (
    <script
      id="atlas-runtime-evidence-v256"
      type="application/json"
      data-atlas-evidence-surface="v256-compact-runtime-state"
      dangerouslySetInnerHTML={{ __html: serialized }}
    />
  );
}

export default memo(AtlasRuntimeEvidenceSurfaceV256);
