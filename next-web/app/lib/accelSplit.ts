import { calculateAcceleration, createRk4Workspaces, type Rk4Workspaces } from "./physicsEngine";
import { C_LIGHT } from "./physicalConstants";
import type { SolarSystemPhysicsRef } from "./solarSystemRef";

const INV_C2 = 1 / (C_LIGHT * C_LIGHT);

export type PnAccelMetrics = {
  /** |a_PN| / max(|a_tot|, eps) */
  pnFraction: number;
  /** |a_total| (m/s²) */
  accelTotMs2: number;
  /** |a_Newton| (m/s²) */
  accelNewtMs2: number;
};

/**
 * Two `calculateAcceleration` evaluations: Newton-only vs full EIH 1PN+Newton.
 * Use sparingly (throttle in telemetry bridge).
 */
export function pnAccelMetricsForBody(
  p: SolarSystemPhysicsRef,
  bodyIdx: number,
  relativityEnabled: boolean,
  ws: Rk4Workspaces,
  newtonOut: Float64Array
): PnAccelMetrics {
  const n = p.n;
  const i = bodyIdx * 3;

  calculateAcceleration(
    p.posM,
    p.velM,
    p.mass,
    n,
    p.G,
    0,
    p.eps2,
    ws.aNewt,
    ws.phi,
    newtonOut
  );

  const axN = newtonOut[i]!;
  const ayN = newtonOut[i + 1]!;
  const azN = newtonOut[i + 2]!;
  const aNewt = Math.hypot(axN, ayN, azN);

  if (!relativityEnabled) {
    return {
      pnFraction: 0,
      accelTotMs2: aNewt,
      accelNewtMs2: aNewt,
    };
  }

  calculateAcceleration(
    p.posM,
    p.velM,
    p.mass,
    n,
    p.G,
    INV_C2,
    p.eps2,
    ws.aNewt,
    ws.phi,
    ws.acc
  );

  const axT = ws.acc[i]!;
  const ayT = ws.acc[i + 1]!;
  const azT = ws.acc[i + 2]!;
  const aTot = Math.hypot(axT, ayT, azT);

  const px = axT - axN;
  const py = ayT - ayN;
  const pz = azT - azN;
  const aPn = Math.hypot(px, py, pz);

  const eps = 1e-30;
  return {
    pnFraction: aPn / Math.max(aTot, eps),
    accelTotMs2: aTot,
    accelNewtMs2: aNewt,
  };
}

export function createTelemetryAccelWorkspace(n: number): {
  rk4: Rk4Workspaces;
  newtonOut: Float64Array;
} {
  return {
    rk4: createRk4Workspaces(n),
    newtonOut: new Float64Array(3 * n),
  };
}

/**
 * Compute the EIH 1PN minus Newton delta acceleration vector for a single body.
 * Fills `out.x/y/z` with the delta direction and returns the magnitude.
 */
export function pnAccelDeltaVectorMs2(
  p: SolarSystemPhysicsRef,
  bodyIdx: number,
  relativityEnabled: boolean,
  ws: Rk4Workspaces,
  newtonOut: Float64Array,
  out: { x: number; y: number; z: number }
): number {
  const i = bodyIdx * 3;

  calculateAcceleration(
    p.posM,
    p.velM,
    p.mass,
    p.n,
    p.G,
    0,
    p.eps2,
    ws.aNewt,
    ws.phi,
    newtonOut
  );

  const axN = newtonOut[i]!;
  const ayN = newtonOut[i + 1]!;
  const azN = newtonOut[i + 2]!;

  if (!relativityEnabled) {
    out.x = 0;
    out.y = 0;
    out.z = 0;
    return 0;
  }

  calculateAcceleration(
    p.posM,
    p.velM,
    p.mass,
    p.n,
    p.G,
    INV_C2,
    p.eps2,
    ws.aNewt,
    ws.phi,
    ws.acc
  );

  const dx = ws.acc[i]! - axN;
  const dy = ws.acc[i + 1]! - ayN;
  const dz = ws.acc[i + 2]! - azN;
  const mag = Math.hypot(dx, dy, dz);
  if (mag > 1e-30) {
    out.x = dx / mag;
    out.y = dy / mag;
    out.z = dz / mag;
  } else {
    out.x = 0;
    out.y = 0;
    out.z = 0;
  }
  return mag;
}
