import { deterministicSourceUnitV590 } from "./celestialDeepSpaceV590";

export const STAR_OPTICS_VERSION_V591 = "v591-gaia-moffat-airy-optics-v1" as const;
export const STAR_RENDER_DRAW_POLICY_V591 = "one-point-draw-plus-one-instanced-bright-psf-draw" as const;
export const STAR_SOURCE_POLICY_V591 = "gaia-position-color-magnitude-only" as const;
export const STAR_FAINT_DENSITY_POLICY_V591 = "deterministic-source-id-thinning-anchor-preserving" as const;

export type StarSelectionV591 = Readonly<{
  pointIndices: readonly number[];
  brightIndices: readonly number[];
  inputCounts: Readonly<{ faint: number; catalog: number; brightPsf: number }>;
  renderedCounts: Readonly<{ faint: number; catalog: number; brightPsf: number }>;
  retainedAnchorCount: number;
}>;

function clamp01V591(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function apparentMagnitudeFromFluxV591(flux: number): number {
  return Number.isFinite(flux) && flux > 0 ? -2.5 * Math.log10(flux) : Number.POSITIVE_INFINITY;
}

export function faintStarKeepProbabilityV591(
  apparentFlux: number,
  deviceTier: "desktop" | "mobile",
): number {
  const magnitude = apparentMagnitudeFromFluxV591(apparentFlux);
  const brightness = clamp01V591((15.5 - magnitude) / (15.5 - 8.25));
  const floor = deviceTier === "mobile" ? 0.08 : 0.12;
  const span = deviceTier === "mobile" ? 0.52 : 0.66;
  return clamp01V591(floor + Math.pow(brightness, 1.55) * span);
}

export function selectStarRenderIndicesV591(input: Readonly<{
  apparentFlux: Float32Array;
  psfClass: Uint8Array;
  sourceIds: BigUint64Array;
  constellationAnchorIndex: Int32Array;
  deviceTier: "desktop" | "mobile";
}>): StarSelectionV591 {
  const count = input.psfClass.length;
  if (
    input.apparentFlux.length !== count
    || input.sourceIds.length !== count
    || input.constellationAnchorIndex.length !== count
  ) throw new Error("v591-star-selection-array-length");
  const pointIndices: number[] = [];
  const brightIndices: number[] = [];
  const inputCounts = { faint: 0, catalog: 0, brightPsf: 0 };
  const renderedCounts = { faint: 0, catalog: 0, brightPsf: 0 };
  let retainedAnchorCount = 0;
  for (let index = 0; index < count; index += 1) {
    const psfClass = input.psfClass[index];
    if (psfClass === 2) {
      inputCounts.brightPsf += 1;
      renderedCounts.brightPsf += 1;
      brightIndices.push(index);
      if (input.constellationAnchorIndex[index]! >= 0) retainedAnchorCount += 1;
      continue;
    }
    if (psfClass === 1) {
      inputCounts.catalog += 1;
      renderedCounts.catalog += 1;
      pointIndices.push(index);
      if (input.constellationAnchorIndex[index]! >= 0) retainedAnchorCount += 1;
      continue;
    }
    if (psfClass !== 0) throw new Error(`v591-star-selection-psf-class:${psfClass}`);
    inputCounts.faint += 1;
    const anchor = input.constellationAnchorIndex[index]! >= 0;
    const retained = anchor || deterministicSourceUnitV590(input.sourceIds[index] ?? BigInt(0))
      <= faintStarKeepProbabilityV591(input.apparentFlux[index] ?? 0, input.deviceTier);
    if (!retained) continue;
    renderedCounts.faint += 1;
    pointIndices.push(index);
    if (anchor) retainedAnchorCount += 1;
  }
  return Object.freeze({
    pointIndices: Object.freeze(pointIndices),
    brightIndices: Object.freeze(brightIndices),
    inputCounts: Object.freeze(inputCounts),
    renderedCounts: Object.freeze(renderedCounts),
    retainedAnchorCount,
  });
}

/** Monotonic display response. It never changes the Gaia flux or PSF class. */
export function starDisplayResponseV591(apparentFlux: number, psfClass: 0 | 1 | 2): number {
  const flux = Math.max(0, Number.isFinite(apparentFlux) ? apparentFlux : 0);
  const shoulder = psfClass === 2 ? 96 : psfClass === 1 ? 42 : 18;
  return Math.log1p(flux * shoulder) / Math.log1p(shoulder);
}
