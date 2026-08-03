"use client";

import { Html } from "@react-three/drei/web/Html";
import { useThree } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import { CONSTELLATION_LINES } from "../data/constellationCatalog";

const CONSTELLATION_DISTANCE_SCENE = 9500;
const FEATURED_CODES = [
  "Ori",
  "UMa",
  "Cas",
  "Cyg",
  "Lyr",
  "Aql",
  "Sco",
  "Sgr",
  "Tau",
  "Gem",
  "Leo",
  "And",
] as const;

export default function ConstellationLabels({
  enabled,
  selectedCatalogId,
  closeupSuppressed,
}: {
  enabled: boolean;
  selectedCatalogId: string;
  closeupSuppressed: boolean;
}) {
  const size = useThree((state) => state.size);
  const mobile = size.width < 640;
  const selectedCode = selectedCatalogId.startsWith("constellation:")
    ? selectedCatalogId.slice("constellation:".length)
    : "";
  const labels = useMemo(() => {
    const ranked = [...CONSTELLATION_LINES].sort((a, b) => {
      const aRank = FEATURED_CODES.indexOf(a.iauCode as (typeof FEATURED_CODES)[number]);
      const bRank = FEATURED_CODES.indexOf(b.iauCode as (typeof FEATURED_CODES)[number]);
      if (aRank >= 0 || bRank >= 0) {
        if (aRank < 0) return 1;
        if (bRank < 0) return -1;
        return aRank - bRank;
      }
      return a.iauCode.localeCompare(b.iauCode);
    });
    const budget = mobile ? 8 : 24;
    const visible = closeupSuppressed
      ? ranked.filter((entry) => entry.iauCode === selectedCode)
      : ranked.slice(0, budget);
    const selected = ranked.find((entry) => entry.iauCode === selectedCode);
    if (selected && !visible.some((entry) => entry.iauCode === selectedCode)) {
      visible.unshift(selected);
      visible.length = Math.min(visible.length, budget);
    }
    return visible.map((entry) => ({
      entry,
      position: constellationCentroid(entry.waypoints),
    }));
  }, [closeupSuppressed, mobile, selectedCode]);

  if (!enabled && !selectedCode) return null;
  return (
    <group>
      {labels.map(({ entry, position }) => {
        const selected = entry.iauCode === selectedCode;
        return (
          <Html
            key={entry.iauCode}
            position={position}
            center
            distanceFactor={8}
            style={{ pointerEvents: "none" }}
            zIndexRange={[18, 0]}
          >
            <div
              className={`whitespace-nowrap text-[8px] uppercase ${
                selected
                  ? "rounded-sm border border-cyan-100/30 bg-black/64 px-1 py-0.5 text-cyan-50/88"
                  : "text-white/36 drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)]"
              }`}
              data-constellation-label={entry.iauCode}
              data-constellation-label-selected={selected ? "true" : "false"}
            >
              {entry.nameCn || entry.name}
            </div>
          </Html>
        );
      })}
    </group>
  );
}

function constellationCentroid(
  waypoints: readonly [number, number][],
): THREE.Vector3 {
  const centroid = new THREE.Vector3();
  for (const [raDeg, decDeg] of waypoints) {
    const ra = (raDeg * Math.PI) / 180;
    const dec = (decDeg * Math.PI) / 180;
    centroid.add(
      new THREE.Vector3(
        Math.cos(dec) * Math.cos(ra),
        Math.sin(dec),
        Math.cos(dec) * Math.sin(ra),
      ),
    );
  }
  return centroid.normalize().multiplyScalar(CONSTELLATION_DISTANCE_SCENE);
}
