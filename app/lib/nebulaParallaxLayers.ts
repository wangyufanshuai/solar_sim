/**
 * Roadmap A3: illustrative star layers that give the 2D nebula observation image a depth cue
 * when the camera orbits it. The observation image itself is not changed.
 *
 * Positions are in units of the camera-to-nebula distance and centred on the nebula; the
 * renderer scales the group by the current camera distance, so zoom keeps the layout while an
 * orbit moves the camera relative to the layers (parallax).
 *
 * - foreground: a shell of radius 0.18–0.55 around the nebula. Points on the camera side move
 *   against the orbit, faster than the image.
 * - background: a shell of radius 2.2–3.4; only points farther than the nebula are drawn, so they
 *   move with the orbit, more slowly than the foreground.
 *
 * These are presentation stars, not catalogue stars: random positions from a seeded generator,
 * colours from a blackbody of a randomly drawn temperature (a rough main-sequence-like mix — an
 * approximation chosen for appearance, not a stellar population model).
 */
import { blackbodyLinearSRGB } from "./kerr-v4/kerrDiskModel";

export type NebulaParallaxLayer = "foreground" | "background";

export type NebulaParallaxStars = Readonly<{
  positions: Float32Array; // xyz per star, units of camera distance
  colors: Float32Array; // linear sRGB per star, peak-normalised, times brightness
  sizes: Float32Array; // apparent size scale per star (pixels at the nebula's distance)
  layers: Float32Array; // 0 foreground, 1 background
  count: number;
}>;

export const NEBULA_PARALLAX_SHELLS = Object.freeze({
  foreground: Object.freeze({ count: 150, inner: 0.18, outer: 0.55, size: [2.6, 5.6] as const, brightness: [0.65, 1] as const }),
  background: Object.freeze({ count: 420, inner: 2.2, outer: 3.4, size: [0.9, 1.9] as const, brightness: [0.18, 0.5] as const }),
});

/** mulberry32: small deterministic PRNG so a nebula always gets the same layout. */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashObjectId(objectId: string): number {
  let hash = 2166136261;
  for (let i = 0; i < objectId.length; i++) hash = Math.imul(hash ^ objectId.charCodeAt(i), 16777619);
  return hash >>> 0;
}

/** Temperature draw: mostly cool (3500–6500 K), some hot (up to 20000 K). Illustrative mix. */
function drawTemperature(random: () => number): number {
  const u = random();
  return u < 0.75 ? 3500 + 3000 * random() : 6500 + 13500 * random() ** 2;
}

export function buildNebulaParallaxStars(objectId: string): NebulaParallaxStars {
  const random = seededRandom(hashObjectId(objectId));
  const shells = [["foreground", NEBULA_PARALLAX_SHELLS.foreground], ["background", NEBULA_PARALLAX_SHELLS.background]] as const;
  const count = shells.reduce((sum, [, shell]) => sum + shell.count, 0);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const layers = new Float32Array(count);
  let index = 0;
  for (const [name, shell] of shells) {
    for (let k = 0; k < shell.count; k++, index++) {
      // Uniform direction on the sphere; radius uniform in volume between inner and outer.
      const z = 2 * random() - 1;
      const phi = 2 * Math.PI * random();
      const ring = Math.sqrt(1 - z * z);
      const r3 = shell.inner ** 3 + random() * (shell.outer ** 3 - shell.inner ** 3);
      const radius = Math.cbrt(r3);
      positions.set([radius * ring * Math.cos(phi), radius * ring * Math.sin(phi), radius * z], index * 3);
      const [red, green, blue] = blackbodyLinearSRGB(drawTemperature(random));
      const peak = Math.max(red, green, blue) || 1;
      const brightness = shell.brightness[0] + (shell.brightness[1] - shell.brightness[0]) * random() ** 2;
      colors.set([red / peak * brightness, green / peak * brightness, blue / peak * brightness], index * 3);
      sizes[index] = shell.size[0] + (shell.size[1] - shell.size[0]) * random() ** 3;
      layers[index] = name === "foreground" ? 0 : 1;
    }
  }
  return { positions, colors, sizes, layers, count };
}
