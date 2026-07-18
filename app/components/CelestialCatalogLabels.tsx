"use client";

import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import {
  celestialCatalogLabelEntries,
  celestialDisplayNameZh,
  celestialKindLabelZh,
} from "../lib/celestialCatalog";
import type { FloatingOriginState } from "../lib/floatingOrigin";
import type { MutableRefObject } from "react";

const LABEL_DISTANCE_SCENE = 10_200;
function raDecToVector(raHours: number, decDeg: number): THREE.Vector3 {
  const ra = (raHours * 15 * Math.PI) / 180;
  const dec = (decDeg * Math.PI) / 180;
  return new THREE.Vector3(
    Math.cos(dec) * Math.cos(ra) * LABEL_DISTANCE_SCENE,
    Math.sin(dec) * LABEL_DISTANCE_SCENE,
    Math.cos(dec) * Math.sin(ra) * LABEL_DISTANCE_SCENE,
  );
}

export default function CelestialCatalogLabels({
  floatingOriginRef,
  enabled,
  orbitAtlas,
  selectedCatalogId,
  labelBudget,
  onSelectCatalogObject,
}: {
  floatingOriginRef: MutableRefObject<FloatingOriginState>;
  enabled: boolean;
  orbitAtlas: boolean;
  selectedCatalogId: string;
  labelBudget?: number;
  onSelectCatalogObject?: (catalogId: string) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const lastCatalogLabelVisibilityRef = useRef<boolean | null>(null);
  const size = useThree((state) => state.size);
  const mobile = size.width < 640;
  const labels = useMemo(
    () =>
      celestialCatalogLabelEntries({ selectedCatalogId, orbitAtlas, mobile, labelBudget })
        .filter(
          (entry) =>
            selectedCatalogId === entry.id ||
            !orbitAtlas ||
            (entry.labelPriority ?? 0) >= (mobile ? 10 : 9),
        )
        .map((entry) => ({
          entry,
          position: raDecToVector(entry.raHours!, entry.decDeg!),
        })),
    [labelBudget, mobile, orbitAtlas, selectedCatalogId],
  );

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    const tier = floatingOriginRef.current.lodTier;
    const visible = enabled && (orbitAtlas || tier !== "solar");
    if (lastCatalogLabelVisibilityRef.current === visible) return;
    lastCatalogLabelVisibilityRef.current = visible;
    // label-dom-visible-style-write-dedupe
    group.visible = visible;
  });

  return (
    <group ref={groupRef}>
      {labels.map(({ entry, position }) => (
        <Html
          key={entry.id}
          position={position}
          center
          distanceFactor={orbitAtlas ? 7.5 : 10}
          style={{ pointerEvents: "auto" }}
          zIndexRange={[20, 0]}
        >
          <button
            type="button"
            aria-label={`聚焦天体 ${celestialDisplayNameZh(entry)}`}
            onClick={(event) => {
              event.stopPropagation();
              onSelectCatalogObject?.(entry.id);
            }}
            className={`whitespace-nowrap rounded px-1.5 py-0.5 text-[9px] uppercase tracking-[0.08em] ${
              selectedCatalogId === entry.id
                ? "border border-[rgba(211,179,110,0.42)] bg-black/70 text-[var(--atlas-cine-text)] shadow-[0_0_24px_rgba(211,179,110,0.16)]"
                : "border border-transparent bg-transparent text-[rgba(239,232,214,0.48)] drop-shadow-[0_1px_5px_rgba(0,0,0,0.96)]"
            }`}
            data-deep-sky-label-id={entry.id}
            data-deep-sky-label-kind={entry.kind}
            data-deep-sky-selected-label={selectedCatalogId === entry.id ? "true" : "false"}
          >
            <span className="text-white/76">{celestialDisplayNameZh(entry)}</span>
            <span className="ml-1 text-white/34">{celestialKindLabelZh(entry.kind)}</span>
          </button>
        </Html>
      ))}
    </group>
  );
}
