"use client";

import { memo, type ReactNode } from "react";
import type { CelestialDeviceTierV590, CelestialModeV590 } from "../lib/celestialRenderingV590";
import UniverseCanvas from "./UniverseCanvas";

function UniverseCanvasOverrideHostV591({
  children,
  mode,
  deviceTier,
  onCanvasReady,
}: Readonly<{
  children: ReactNode;
  mode: CelestialModeV590;
  deviceTier: CelestialDeviceTierV590;
  onCanvasReady?: () => void;
}>) {
  return (
    <UniverseCanvas
      sceneOverride={children}
      observationProfile={{
        sceneMode: "kerr",
        mode,
        visualEnhance: deviceTier === "desktop",
        qualityTier: deviceTier === "mobile" ? "mobile-safe" : "balanced",
        onCanvasReady,
      }}
    />
  );
}

export default memo(UniverseCanvasOverrideHostV591);
