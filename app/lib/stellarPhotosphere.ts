/**
 * Photosphere inputs for the stellar surface shader (roadmap A2).
 *
 * Colour: the linear-sRGB chromaticity of a Planck spectrum at T_eff, integrated against the
 * CIE 1931 2° observer (Wyman–Sloan–Shirley multi-lobe fit) — see kerr-v4/kerrDiskModel.
 * A real photosphere is not a blackbody, so this is an approximation of the visible colour.
 *
 * Limb darkening: quadratic law  I(mu)/I(1) = 1 − u1 (1 − mu) − u2 (1 − mu)^2.
 * The coefficients below are representative visible-band values chosen to follow the known
 * trend (strong darkening for cool stars, weak for hot stars). They are an APPROXIMATION,
 * linearly interpolated in T_eff, not values fitted from a published model-atmosphere table.
 */
import { blackbodyLinearSRGB } from "./kerr-v4/kerrDiskModel";

const LIMB_TABLE: readonly (readonly [number, number, number])[] = [
  // [T_eff K, u1, u2]
  [3_000, 0.78, 0.14],
  [3_500, 0.75, 0.15],
  [4_500, 0.65, 0.18],
  [5_800, 0.47, 0.23],
  [7_500, 0.35, 0.28],
  [10_000, 0.25, 0.3],
  [15_000, 0.2, 0.3],
  [25_000, 0.15, 0.3],
  [40_000, 0.12, 0.28],
];

export function limbDarkeningQuadratic(teffK: number): readonly [number, number] {
  const t = Math.min(LIMB_TABLE.at(-1)![0], Math.max(LIMB_TABLE[0][0], teffK));
  for (let i = 1; i < LIMB_TABLE.length; i += 1) {
    const [t1, a1, b1] = LIMB_TABLE[i];
    if (t > t1) continue;
    const [t0, a0, b0] = LIMB_TABLE[i - 1];
    const f = (t - t0) / (t1 - t0);
    return [a0 + (a1 - a0) * f, b0 + (b1 - b0) * f];
  }
  return [LIMB_TABLE.at(-1)![1], LIMB_TABLE.at(-1)![2]];
}

export function limbIntensity(mu: number, [u1, u2]: readonly [number, number]): number {
  const x = 1 - Math.min(1, Math.max(0, mu));
  return Math.max(0, 1 - u1 * x - u2 * x * x);
}

/** Linear-sRGB photosphere colour with luminance Y = 1. */
export function photosphereLinearColor(teffK: number): readonly [number, number, number] {
  return blackbodyLinearSRGB(Math.min(40_000, Math.max(1_500, teffK)));
}
