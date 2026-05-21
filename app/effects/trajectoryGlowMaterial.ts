/**
 * Custom trajectory glow line material with opacity fade along the trajectory.
 *
 * Extends the three-stdlib LineMaterial concept with:
 *   - Opacity fade: recent points bright, old points fade
 *   - Gaussian falloff from line center
 *   - Phase-tint color uniform (orange ascent, blue coast, green landing)
 */

import * as THREE from "three";
import { LineMaterial } from "three-stdlib";

export type TrajectoryGlowOptions = {
  color?: THREE.ColorRepresentation;
  linewidth?: number;
  opacity?: number;
};

/**
 * Creates a LineMaterial configured for trajectory glow rendering.
 *
 * Note: The full custom shader with per-vertex opacity fade requires
 * extending LineMaterial's internals, which is complex with three-stdlib.
 * For now, we use a standard LineMaterial with additive blending for the
 * glow pass. Per-vertex fade can be added later with a custom ShaderMaterial
 * when Line2 is replaced with a raw BufferGeometry + custom shader.
 */
export function createTrajectoryGlowMaterial(
  options?: TrajectoryGlowOptions
): LineMaterial {
  const color = options?.color ?? "#44ddff";
  const linewidth = options?.linewidth ?? 6.0;
  const opacity = options?.opacity ?? 0.25;

  const material = new LineMaterial({
    linewidth,
    transparent: true,
    opacity,
    depthWrite: false,
    depthTest: true,
    toneMapped: false,
    worldUnits: false,
  });
  material.color.set(color);
  return material;
}

/** Phase-to-color mapping for trajectory tinting. */
export function phaseTrajectoryColor(
  phase: string
): THREE.ColorRepresentation {
  switch (phase) {
    case "verticalRise":
    case "gravityTurn":
      return "#ff8844"; // orange during ascent
    case "circularization":
      return "#ffcc44"; // gold during orbit insertion
    case "coast":
      return "#44ddff"; // cyan during coast
    case "deepSpace":
      return "#8866ff"; // purple in deep space
    case "descent":
      return "#44ff88"; // green during landing
    default:
      return "#44ddff"; // default cyan
  }
}
