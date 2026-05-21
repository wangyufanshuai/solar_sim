/**
 * Kerr black hole geometry in SI-friendly form.
 *
 * Dimensionless spin χ = a/M in (0,1). Length scale r_g = GM/c².
 * Outer horizon: r₊ = r_g (1 + √(1 − χ²)).
 * Outer static limit (ergosphere boundary): r_sl(θ) = r_g (1 + √(1 − χ² cos²θ)).
 *
 * These are exact for Kerr in Boyer–Lindquist coordinates with our identification a = χ r_g.
 */

import { C_LIGHT, G_SI } from "./physicalConstants";

/** Schwarzschild radius GM/c² [m]. */
export function schwarzschildRadiusMeters(massKg: number): number {
  return (G_SI * massKg) / (C_LIGHT * C_LIGHT);
}

/** Kerr parameter a = χ GM/c² [m], |χ| < 1. */
export function kerrSpinLengthMeters(massKg: number, aOverM: number): number {
  const rg = schwarzschildRadiusMeters(massKg);
  return Math.min(Math.abs(aOverM), 0.999999) * rg;
}

/** Outer event horizon radius [m]. */
export function kerrOuterHorizonRadiusMeters(
  massKg: number,
  aOverM: number
): number {
  const rg = schwarzschildRadiusMeters(massKg);
  const chi = Math.min(Math.abs(aOverM), 0.999999);
  return rg * (1 + Math.sqrt(Math.max(0, 1 - chi * chi)));
}

/**
 * Outer boundary of ergosphere (static limit) [m], θ from spin axis (0 = north pole).
 */
export function kerrStaticLimitRadiusMeters(
  massKg: number,
  aOverM: number,
  cosTheta: number
): number {
  const rg = schwarzschildRadiusMeters(massKg);
  const chi = Math.min(Math.abs(aOverM), 0.999999);
  const c = Math.min(1, Math.max(-1, cosTheta));
  return rg * (1 + Math.sqrt(Math.max(0, 1 - chi * chi * c * c)));
}

/** Total angular momentum magnitude J = χ GM²/c [kg·m²/s] for the standard Kerr identification. */
export function kerrAngularMomentumSI(massKg: number, aOverM: number): number {
  const chi = Math.min(Math.abs(aOverM), 0.999999);
  return (chi * G_SI * massKg * massKg) / C_LIGHT;
}

/** Ratio r_sl(θ)/r₊ for shape-only scaling (spin axis = z, cosTheta = uz). */
export function staticLimitOverHorizon(aOverM: number, cosTheta: number): number {
  const chi = Math.min(Math.abs(aOverM), 0.999999);
  const c = Math.min(1, Math.max(-1, cosTheta));
  const inner = 1 + Math.sqrt(Math.max(0, 1 - chi * chi));
  const outer = 1 + Math.sqrt(Math.max(0, 1 - chi * chi * c * c));
  return outer / inner;
}

/** r₊ / r_g = 1 + √(1 − χ²); matches ergosphere vertex scale in Boyer–Lindquist units. */
export function kerrHorizonOverRg(aOverM: number): number {
  const chi = Math.min(Math.abs(aOverM), 0.999999);
  return 1 + Math.sqrt(Math.max(0, 1 - chi * chi));
}
