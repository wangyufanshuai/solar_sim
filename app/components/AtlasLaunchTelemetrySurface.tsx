"use client";

import { useEffect, useState, type MutableRefObject } from "react";
import type { LaunchSimState } from "../lib/launchTelemetryTypes";
import type { LocalTelemetry } from "../lib/localLaunchPhysics";
import { getAtlasRuntimeQualityProfile } from "../lib/launchSequenceDirector";
import LaunchDirectorOverlay from "./LaunchDirectorOverlay";
import LaunchTelemetryStrip from "./LaunchTelemetryStrip";

export default function AtlasLaunchTelemetrySurface({
  state,
  telemetryRef,
  qualityTier,
}: {
  state: LaunchSimState;
  telemetryRef: MutableRefObject<LocalTelemetry | null>;
  qualityTier: Parameters<typeof getAtlasRuntimeQualityProfile>[0];
}) {
  const hudUpdateMs = getAtlasRuntimeQualityProfile(qualityTier).hudUpdateMs;
  const [telemetry, setTelemetry] = useState<LocalTelemetry | null>(() => telemetryRef.current);

  useEffect(() => {
    const publish = () => setTelemetry(telemetryRef.current);
    publish();
    const intervalId = window.setInterval(publish, hudUpdateMs);
    return () => window.clearInterval(intervalId);
  }, [hudUpdateMs, telemetryRef]);

  return (
    <>
      <LaunchDirectorOverlay telemetry={telemetry} qualityTier={qualityTier} />
      <LaunchTelemetryStrip state={state} localTelemetry={telemetry} />
    </>
  );
}
