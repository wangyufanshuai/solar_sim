/**
 * "The True Void" — near-black space; only direct sun should read bright.
 */

/** Hard cap for ambient light intensity in the main universe (must not exceed this). */
export const TRUE_VOID_MAX_AMBIENT_INTENSITY = 0.02;

/**
 * Cinematic shading: minimal ambient so planets show some form on the dark side
 * without flattening the crescent-phase lighting from the sun.
 */
export const TRUE_VOID_CINEMATIC_AMBIENT_INTENSITY = 0.015;

/** @deprecated Prefer {@link TRUE_VOID_CINEMATIC_AMBIENT_INTENSITY} in the main scene. */
export const TRUE_VOID_AMBIENT_INTENSITY = Math.min(
  0.01,
  TRUE_VOID_MAX_AMBIENT_INTENSITY
);

/** Cinematic: very subtle hemisphere fill so dark sides aren't pure black. */
export const TRUE_VOID_CINEMATIC_HEMISPHERE_INTENSITY = 0.008;

/** Fixed WebGLRenderer tone-mapping exposure (ACES). 1.0 for balanced deep-space rendering. */
export const TRUE_VOID_TONE_MAPPING_EXPOSURE = 1.0;

/**
 * Equirect sky `MeshBasicMaterial` tint: texture RGB × this (kept low so the Milky Way
 * backdrop stays behind planets; multiply further with `NEXT_PUBLIC_SKY_EQUIRECT_EXPOSURE`).
 */
export const TRUE_VOID_SKY_TEXTURE_COLOR_SCALE = 0.28;
