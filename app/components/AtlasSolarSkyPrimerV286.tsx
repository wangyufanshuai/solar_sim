"use client";

import type { MutableRefObject } from "react";
import type { FloatingOriginState } from "../lib/floatingOrigin";
import { GalacticOverlayGate } from "./AtlasSceneCameraBridges";
import AtlasScaleLayerGroupV273 from "./AtlasScaleLayerGroupV273";
import GalacticLandmarks from "./GalacticLandmarks";
import MajorStarBeacons from "./MajorStarBeacons";

/** Lightweight solar-sky landmarks. It owns no catalog store, Worker, or network request. */
export default function AtlasSolarSkyPrimerV286({
  floatingOriginRef,
}: {
  floatingOriginRef: MutableRefObject<FloatingOriginState>;
}) {
  return (
    <AtlasScaleLayerGroupV273 band={["solar"]}>
      <GalacticOverlayGate floatingOriginRef={floatingOriginRef}>
        <GalacticLandmarks floatingOriginRef={floatingOriginRef} />
        <MajorStarBeacons floatingOriginRef={floatingOriginRef} />
      </GalacticOverlayGate>
    </AtlasScaleLayerGroupV273>
  );
}
