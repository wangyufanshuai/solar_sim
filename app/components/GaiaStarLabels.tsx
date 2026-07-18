"use client";

import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { MutableRefObject } from "react";
import type { FloatingOriginState } from "../lib/floatingOrigin";
import {
  gaiaStarToOverlayScenePosition,
  selectGaiaLabelStars,
  type GaiaIndexedStar,
} from "../lib/gaiaCatalogIndex";

export default function GaiaStarLabels({
  floatingOriginRef,
  index,
  enabled,
  selectedSourceId,
  closeupSuppressed,
  onSelectStar,
}: {
  floatingOriginRef: MutableRefObject<FloatingOriginState>;
  index: readonly GaiaIndexedStar[];
  enabled: boolean;
  selectedSourceId: string;
  closeupSuppressed: boolean;
  onSelectStar?: (entry: GaiaIndexedStar) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const size = useThree((state) => state.size);
  const mobile = size.width < 640;
  const labels = useMemo(() => {
    const selectedOnly = closeupSuppressed && selectedSourceId;
    const selected = selectedOnly
      ? index.find((entry) => entry.sourceId === selectedSourceId)
      : null;
    const entries = selected ? [selected] : selectGaiaLabelStars(index, mobile, selectedSourceId);
    return entries.map((entry) => ({
      entry,
      position: gaiaStarToOverlayScenePosition(entry.star),
    }));
  }, [closeupSuppressed, index, mobile, selectedSourceId]);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    group.visible = enabled || Boolean(selectedSourceId);
    group.position.copy(floatingOriginRef.current.offsetScene).multiplyScalar(-1);
  });

  return (
    <group ref={groupRef}>
      {labels.map(({ entry, position }) => {
        const selected = entry.sourceId === selectedSourceId;
        return (
          <Html
            key={entry.sourceId}
            position={position}
            center
            distanceFactor={8}
            style={{ pointerEvents: "auto" }}
            zIndexRange={[22, 0]}
          >
            <button
              type="button"
              aria-label={`聚焦恒星 ${entry.displayName}`}
              onClick={(event) => {
                event.stopPropagation();
                onSelectStar?.(entry);
              }}
              className={`whitespace-nowrap rounded-sm border px-1 py-0.5 text-[8px] ${
                selected
                  ? "border-cyan-100/38 bg-black/72 text-cyan-50 shadow-[0_0_18px_rgba(125,211,252,0.18)]"
                  : "border-white/8 bg-black/28 text-white/48"
              }`}
              data-gaia-star-label={entry.sourceId}
              data-gaia-star-label-selected={selected ? "true" : "false"}
              data-gaia-closeup-suppression={
                closeupSuppressed
                  ? "selected-closeup-nonessential-layer-suppression"
                  : "off"
              }
            >
              {entry.shortLabel}
            </button>
          </Html>
        );
      })}
    </group>
  );
}
