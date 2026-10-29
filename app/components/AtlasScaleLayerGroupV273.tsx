"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { atlasScaleLayerOpacityV273, type AtlasScaleLayerV273 } from "../lib/atlasScalePresentationV273";
import { useAtlasRuntimeStore } from "../lib/atlasRuntimeStore";
import { createMainlineAScaleMaterialTrackerV638 } from "../lib/mainlineAScaleMaterialLifecycleV638";

export default function AtlasScaleLayerGroupV273({ band, children }: { band: AtlasScaleLayerV273 | readonly AtlasScaleLayerV273[]; children: ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);
  const current = useAtlasRuntimeStore((snapshot) => snapshot.scaleBand);
  const journey = useAtlasRuntimeStore((snapshot) => snapshot.scaleJourney);
  const trackerRef = useRef<ReturnType<typeof createMainlineAScaleMaterialTrackerV638> | null>(null);

  useLayoutEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    const tracker = createMainlineAScaleMaterialTrackerV638(group);
    trackerRef.current = tracker;
    return () => {
      tracker.dispose();
      trackerRef.current = null;
    };
  }, []);

  useFrame(() => {
    const bands = Array.isArray(band) ? band : [band];
    const opacity = Math.max(...bands.map((entry) => atlasScaleLayerOpacityV273(entry, current, journey)));
    if (groupRef.current) groupRef.current.visible = opacity > 0.001;
    trackerRef.current?.update(opacity);
  }, -20);

  return <group ref={groupRef} userData={{ atlasScaleBand: Array.isArray(band) ? band.join(",") : band, atlasScaleCompositor: "v273" }}>{children}</group>;
}
