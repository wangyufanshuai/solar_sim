import { MAINLINE_A1_IAU_BOUNDARIES } from "../data/mainlineAConstellationBoundaryDataV607";
import { MAINLINE_A_CURRENT_IAU_BOUNDARIES } from "../data/mainlineAConstellationCurrentBoundaryDataV607";
import type { IauBoundaryVertexV607 } from "../data/mainlineAConstellationBoundaryV607";

const PALETTE = Object.freeze({
  lineColor: "#b9dff6", anchorColor: "#ecf7ff", activeAnchorColor: "#e8d7b0",
  boundaryColor: "#8a9cad", boundaryOpacity: 0.42, boundaryWidthCssPx: 1,
  boundaryDashCssPx: 4, boundaryGapCssPx: 5, activeRingWidthCssPx: 0.8,
});

const APPEARANCES = Object.freeze({
  desktop: Object.freeze({ ...PALETTE, lineWidthCssPx: 1.65, lineOpacity: 0.7, anchorDiameterCssPx: 5.5 }),
  mobile: Object.freeze({ ...PALETTE, lineWidthCssPx: 1.8, lineOpacity: 0.78, anchorDiameterCssPx: 6 }),
});

/** A shared display vocabulary; it neither edits the catalog nor supplies coordinates. */
export function mainlineAConstellationAppearanceM4(mobile = false) {
  return APPEARANCES[mobile ? "mobile" : "desktop"];
}

export type MainlineAConstellationAppearanceM4 = Readonly<{
  code: string;
  catalogId: string;
  style: ReturnType<typeof mainlineAConstellationAppearanceM4>;
  boundary: readonly IauBoundaryVertexV607[];
  boundarySource: "a1" | "current";
  presentationOnly: true;
  scientificPayloadWriteback: false;
}>;

/** Exact canonical aliases only. Historical source arrays retain their identity. */
export function resolveMainlineAConstellationAppearanceM4(
  codeOrCatalogId: string,
  mobile = false,
): MainlineAConstellationAppearanceM4 | null {
  const code = codeOrCatalogId.startsWith("constellation:") ? codeOrCatalogId.slice(14) : codeOrCatalogId;
  const current = Object.hasOwn(MAINLINE_A_CURRENT_IAU_BOUNDARIES, code);
  const a1 = Object.hasOwn(MAINLINE_A1_IAU_BOUNDARIES, code);
  if (!current && !a1) return null;
  const boundary = current ? MAINLINE_A_CURRENT_IAU_BOUNDARIES[code] : MAINLINE_A1_IAU_BOUNDARIES[code];
  return Object.freeze({ code, catalogId: `constellation:${code}`, style: mainlineAConstellationAppearanceM4(mobile),
    boundary, boundarySource: current ? "current" : "a1", presentationOnly: true, scientificPayloadWriteback: false });
}

/** Perspective conversion for thin dashed boundaries; dash lengths stay readable while zooming. */
export function mainlineAConstellationBoundaryDashScaleM4(
  viewportHeight: number, projectionScaleY: number, cameraDistance: number,
): number {
  if (![viewportHeight, projectionScaleY, cameraDistance].every((value) => Number.isFinite(value) && value > 0)) return 0;
  const scale = viewportHeight * projectionScaleY / (2 * cameraDistance);
  return Number.isFinite(scale) ? scale : 0;
}
