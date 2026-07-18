"use client";

import { Html } from "@react-three/drei";
import { useMemo } from "react";
import { celestialEntryToDirection, selectCelestialCatalogEntry } from "../lib/celestialCatalog";

const FOCUS_MARKER_DISTANCE_SCENE = 10_260;

const KIND_LABELS: Record<string, string> = {
  "nearby-star": "star",
  "bright-star": "star",
  nebula: "nebula",
  "star-cluster": "cluster",
  galaxy: "galaxy",
  pulsar: "pulsar",
  constellation: "constellation",
};

export default function CelestialCatalogFocusMarker({
  selectedCatalogId,
  enabled,
  orbitAtlas,
}: {
  selectedCatalogId: string;
  enabled: boolean;
  orbitAtlas: boolean;
}) {
  const marker = useMemo(() => {
    const entry = selectCelestialCatalogEntry(selectedCatalogId);
    if (!entry) return null;
    const direction = celestialEntryToDirection(entry);
    if (!direction) return null;
    return {
      entry,
      position: direction.map((component) => component * FOCUS_MARKER_DISTANCE_SCENE) as [
        number,
        number,
        number,
      ],
    };
  }, [selectedCatalogId]);

  if (!enabled || !marker) return null;

  return (
    <Html
      position={marker.position}
      center
      distanceFactor={orbitAtlas ? 7.4 : 9.4}
      style={{ pointerEvents: "none" }}
      zIndexRange={[35, 0]}
    >
      <div
        className="relative h-[76px] w-[76px]"
        data-deep-sky-focus-marker="true"
        data-deep-sky-focus-id={marker.entry.id}
        data-deep-sky-focus-kind={marker.entry.kind}
      >
        <div className="absolute inset-0 rounded-full border border-cyan-200/48 shadow-[0_0_28px_rgba(103,232,249,0.32)]" />
        <div className="absolute inset-2 rounded-full border border-cyan-100/18" />
        <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-100 shadow-[0_0_16px_rgba(103,232,249,0.75)]" />
        <div className="absolute left-1/2 top-full mt-1.5 min-w-[138px] -translate-x-1/2 rounded border border-cyan-100/22 bg-black/58 px-2 py-1 text-center text-[9px] uppercase tracking-[0.08em] text-cyan-50 shadow-[0_0_24px_rgba(103,232,249,0.20)] backdrop-blur-md">
          <div className="truncate text-white/84">{marker.entry.primaryName}</div>
          <div className="mt-0.5 truncate text-white/42">
            {KIND_LABELS[marker.entry.kind]} / {marker.entry.source}
          </div>
        </div>
      </div>
    </Html>
  );
}
