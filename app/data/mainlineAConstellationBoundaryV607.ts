import type { ProvenanceV607 } from "../lib/celestialObjectContractV607";
import type { AtlasScaleBand } from "../lib/atlasRuntimeStateV256";
import type { GalacticLodTier } from "../lib/floatingOrigin";

function constellationPresentationLod(args: {
  lodTier: GalacticLodTier;
  presentationScaleBand?: AtlasScaleBand;
}): GalacticLodTier {
  // The atlas dolly uses scene distances below the physical 200 AU LOD gate.
  // Its selected display scale must not mutate the floating-origin state.
  if (args.presentationScaleBand === "galactic") return "far";
  if (args.presentationScaleBand === "stellar" && args.lodTier === "solar") return "mid";
  return args.lodTier;
}

/**
 * IAU boundary text uses RA in sexagesimal hours and Dec in decimal degrees,
 * separated by pipes. The final field is the three-letter IAU constellation
 * code. Lines that do not contain a boundary record are ignored.
 */
export type IauBoundaryVertexV607 = { iauCode: string; raDeg: number; decDeg: number };

/** Presentation-only gate for formal boundary rings; never affects scene physics. */
export function shouldShowMainlineAConstellationBoundariesV607(args: {
  enabled: boolean;
  qualityTier: "mobile" | "balanced" | "dense";
  lodTier: "solar" | "mid" | "far";
  presentationScaleBand?: AtlasScaleBand;
  cinematicCameraProfile: string;
  boundarySegmentCount: number;
}): boolean {
  return args.enabled
    && args.qualityTier !== "mobile"
    && constellationPresentationLod(args) !== "solar"
    && args.cinematicCameraProfile !== "selected-body-cinematic"
    && args.boundarySegmentCount > 0;
}

/**
 * Presentation-only gate for the illustrative stick-figure/asterism layer.
 * Keep this policy next to the formal-boundary gate so quality and LOD
 * decisions remain deterministic and cannot leak into the simulation state.
 */
export function shouldShowMainlineAAsterismsV607(args: {
  enabled: boolean;
  asterismEnabled: boolean;
  qualityTier: "mobile" | "balanced" | "dense";
  lodTier: "solar" | "mid" | "far";
  presentationScaleBand?: AtlasScaleBand;
  cinematicCameraProfile: string;
  asterismSegmentCount: number;
}): boolean {
  return args.enabled
    && args.asterismEnabled
    && args.qualityTier !== "mobile"
    && constellationPresentationLod(args) !== "solar"
    && args.cinematicCameraProfile !== "selected-body-cinematic"
    && args.asterismSegmentCount > 0;
}

/**
 * Resolve the complete presentation-only layer state used by the renderer.
 * Keeping the arithmetic here makes the desktop/mobile and quality-tier
 * contract directly testable without mounting a WebGL canvas.
 */
export function resolveMainlineAConstellationLayerV607(args: {
  enabled: boolean;
  orbitAtlas: boolean;
  asterismEnabled: boolean;
  qualityTier: "mobile" | "balanced" | "dense";
  lodTier: "solar" | "mid" | "far";
  presentationScaleBand?: AtlasScaleBand;
  cinematicCameraProfile: string;
  boundarySegmentCount: number;
  asterismSegmentCount: number;
}): {
  lineOpacity: number;
  nodeOpacity: number;
  asterismOpacity: number;
  boundaryOpacity: number;
  showAsterisms: boolean;
  showBoundaries: boolean;
  presentationLodTier: GalacticLodTier;
} {
  const presentationLodTier = constellationPresentationLod(args);
  const visible = args.enabled && args.cinematicCameraProfile !== "selected-body-cinematic";
  const cinematicScale = args.cinematicCameraProfile === "selected-body-cinematic"
    ? 0.24
    : args.cinematicCameraProfile === "showcase-deep-space" ? 0.78 : 1;
  const constellationMobileScale = args.qualityTier === "mobile" ? 0.62 : 1;
  const constellationDenseScale = args.qualityTier === "dense" ? 1.12 : 1.02;
  const artPolishScale = cinematicScale * constellationMobileScale * constellationDenseScale;
  const lineOpacity = (!visible ? 0 : args.orbitAtlas ? 0.028 : presentationLodTier === "solar" ? 0.014 : presentationLodTier === "mid" ? 0.05 : 0.105) * artPolishScale;
  const nodeOpacity = (!visible ? 0 : args.orbitAtlas ? 0.024 : presentationLodTier === "solar" ? 0.01 : presentationLodTier === "mid" ? 0.044 : 0.098) * artPolishScale;
  const showAsterisms = shouldShowMainlineAAsterismsV607({
    enabled: args.enabled,
    asterismEnabled: args.asterismEnabled,
    qualityTier: args.qualityTier,
    lodTier: presentationLodTier,
    cinematicCameraProfile: args.cinematicCameraProfile,
    asterismSegmentCount: args.asterismSegmentCount,
  });
  const showBoundaries = shouldShowMainlineAConstellationBoundariesV607({
    enabled: args.enabled,
    qualityTier: args.qualityTier,
    lodTier: presentationLodTier,
    cinematicCameraProfile: args.cinematicCameraProfile,
    boundarySegmentCount: args.boundarySegmentCount,
  });
  return {
    lineOpacity,
    nodeOpacity,
    asterismOpacity: showAsterisms ? lineOpacity * (args.qualityTier === "dense" ? 0.72 : 0.48) : 0,
    boundaryOpacity: showBoundaries ? lineOpacity * 0.42 : 0,
    showAsterisms,
    showBoundaries,
    presentationLodTier,
  };
}

export const IAU_BOUNDARY_PROVENANCE_V607: ProvenanceV607 = {
  sourceId: "iau-delporte-boundaries-j2000",
  sourceUrl: "https://iauarchive.eso.org/public/themes/constellations/",
  retrievedAt: "2026-09-09",
  license: "source-attribution-required",
  credit: "International Astronomical Union / Eugène Delporte boundaries",
};

function parseRaHours(value: string): number | null {
  const fields = value.trim().split(/\s+/).map(Number);
  if (fields.length !== 3 || fields.some((field) => !Number.isFinite(field))) return null;
  const [hours, minutes, seconds] = fields;
  if (hours < 0 || hours >= 24 || minutes < 0 || minutes >= 60 || seconds < 0 || seconds >= 60) return null;
  return (hours + minutes / 60 + seconds / 3600) * 15;
}

function parseDecDegrees(value: string): number | null {
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) && parsed >= -90 && parsed <= 90 ? parsed : null;
}

export function parseIauBoundaryTxtV607(raw: string, expectedCode?: string): IauBoundaryVertexV607[] {
  const vertices: IauBoundaryVertexV607[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const fields = line.split("|").map((field) => field.trim());
    if (fields.length < 3 || fields[0].startsWith("#")) continue;
    const raDeg = parseRaHours(fields[0]);
    const decDeg = parseDecDegrees(fields[1]);
    const iauCode = fields[2];
    if (raDeg === null || decDeg === null || !/^[A-Za-z]{3}$/.test(iauCode)) continue;
    if (expectedCode && iauCode.toUpperCase() !== expectedCode.toUpperCase()) continue;
    vertices.push({ iauCode, raDeg, decDeg });
  }
  return vertices;
}

export function groupIauBoundaryTxtV607(raw: string): Record<string, [number, number][]> {
  return parseIauBoundaryTxtV607(raw).reduce<Record<string, [number, number][]>>((groups, vertex) => {
    (groups[vertex.iauCode] ??= []).push([vertex.raDeg, vertex.decDeg]);
    return groups;
  }, {});
}
