import type { SolarSystemPhysicsRef } from "./solarSystemRef";

const AU_KM = 149_597_870.7;
const SUN_RADIUS_AU = 695_700 / AU_KM;

const PHYSICAL_RADIUS_AU: Record<string, number> = {
  mercury: 2439.7 / AU_KM,
  venus: 6051.8 / AU_KM,
  earth: 6378.1363 / AU_KM,
  moon: 1737.4 / AU_KM,
  mars: 3389.5 / AU_KM,
  jupiter: 71_492 / AU_KM,
  saturn: 60_268 / AU_KM,
  uranus: 25_559 / AU_KM,
  neptune: 24_764 / AU_KM,
};

function angularRadius(radius: number, distance: number): number {
  return Math.asin(Math.min(1, radius / Math.max(distance, radius)));
}

function circleOverlapArea(r1: number, r2: number, separation: number): number {
  if (separation >= r1 + r2) return 0;
  if (separation <= Math.abs(r1 - r2)) {
    const radius = Math.min(r1, r2);
    return Math.PI * radius * radius;
  }
  const a1 = Math.acos((separation * separation + r1 * r1 - r2 * r2) / (2 * separation * r1));
  const a2 = Math.acos((separation * separation + r2 * r2 - r1 * r1) / (2 * separation * r2));
  const lens = 0.5 * Math.sqrt(
    Math.max(0, (-separation + r1 + r2) * (separation + r1 - r2) *
      (separation - r1 + r2) * (separation + r1 + r2)),
  );
  return r1 * r1 * a1 + r2 * r2 * a2 - lens;
}

export function solarOcclusionFactor(
  physics: SolarSystemPhysicsRef | null,
  targetIndex: number,
  bodyIds: readonly string[],
): number {
  if (!physics || targetIndex <= 0 || targetIndex >= physics.n) return 1;
  const targetOffset = targetIndex * 3;
  const tx = physics.posAu[targetOffset] ?? 0;
  const ty = physics.posAu[targetOffset + 1] ?? 0;
  const tz = physics.posAu[targetOffset + 2] ?? 0;
  const sx = (physics.posAu[0] ?? 0) - tx;
  const sy = (physics.posAu[1] ?? 0) - ty;
  const sz = (physics.posAu[2] ?? 0) - tz;
  const sunDistance = Math.hypot(sx, sy, sz);
  if (sunDistance < 1e-12) return 1;
  const sunAngularRadius = angularRadius(SUN_RADIUS_AU, sunDistance);
  let visibleFraction = 1;
  for (let blockerIndex = 1; blockerIndex < Math.min(physics.n, bodyIds.length); blockerIndex += 1) {
    if (blockerIndex === targetIndex) continue;
    const radius = PHYSICAL_RADIUS_AU[bodyIds[blockerIndex] ?? ""];
    if (!radius) continue;
    const offset = blockerIndex * 3;
    const bx = (physics.posAu[offset] ?? 0) - tx;
    const by = (physics.posAu[offset + 1] ?? 0) - ty;
    const bz = (physics.posAu[offset + 2] ?? 0) - tz;
    const blockerDistance = Math.hypot(bx, by, bz);
    if (blockerDistance <= radius || blockerDistance >= sunDistance) continue;
    const dot = (sx * bx + sy * by + sz * bz) / (sunDistance * blockerDistance);
    if (dot <= 0) continue;
    const separation = Math.acos(Math.max(-1, Math.min(1, dot)));
    const blockerAngularRadius = angularRadius(radius, blockerDistance);
    const overlap = circleOverlapArea(sunAngularRadius, blockerAngularRadius, separation);
    const blockedFraction = overlap / (Math.PI * sunAngularRadius * sunAngularRadius);
    visibleFraction *= 1 - Math.max(0, Math.min(1, blockedFraction));
  }
  return Math.max(0, Math.min(1, visibleFraction));
}
