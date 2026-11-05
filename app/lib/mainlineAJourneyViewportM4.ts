import type { AtlasSafeViewportRect } from "./atlasCameraFrameSolverV4";
import type { ConstellationDomMeasurementV638 } from "./mainlineAConstellationLabelOcclusionV638";
import { resolveMainlineAConstellationSafeViewportV638 } from "./mainlineAConstellationCameraV638";

let activeOwner: object | null = null;
let measurementOwner: object | null = null;
let measurement: ConstellationDomMeasurementV638 | null = null;
let cache: { key: string; measurement: ConstellationDomMeasurementV638 | null; rect: AtlasSafeViewportRect | null } | null = null;

/** The journey only declares its presence; the camera's existing DOM observer measures it. */
export function registerMainlineAJourneyViewportM4(): () => void {
  const owner = {};
  activeOwner = owner;
  return () => { if (activeOwner === owner) { activeOwner = null; cache = null; } };
}
export function isMainlineAJourneyViewportActiveM4(): boolean { return activeOwner !== null; }
export function registerMainlineAJourneyMeasurementM4() {
  const owner = {};
  measurementOwner = owner;
  measurement = null; cache = null;
  return {
    publish(next: ConstellationDomMeasurementV638 | null) {
      if (measurementOwner === owner) { measurement = next; cache = null; }
    },
    release() {
      if (measurementOwner === owner) { measurementOwner = null; measurement = null; cache = null; }
    },
  };
}
export function resolveMainlineAJourneyViewportM4(width: number, height: number, base: AtlasSafeViewportRect): AtlasSafeViewportRect | null {
  if (!activeOwner) return base;
  if (!measurement) return null;
  const key = `${width}|${height}|${base.left}|${base.top}|${base.right}|${base.bottom}|${base.viewportWidth}|${base.viewportHeight}`;
  if (cache?.key === key && cache.measurement === measurement) return cache.rect;
  const rect = resolveMainlineAConstellationSafeViewportV638(width, height, base, measurement);
  cache = { key, measurement, rect };
  return rect;
}
