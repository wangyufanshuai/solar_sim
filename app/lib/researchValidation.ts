import { horizonsRefForId } from "../data/horizonsReference";
import { SOLAR_SYSTEM_BODIES } from "../data/planetsJ2000";
import { AU_METERS, DAY_SECONDS } from "./physicalConstants";
import type { SolarSystemPhysicsRef } from "./solarSystemRef";
import type {
  HorizonsComparisonBody,
  HorizonsComparisonCheckpoint,
  MercuryPrecessionBenchmark,
  ResearchConfidence,
  ResearchValidationSummary,
} from "./simulationDiagnosticsTypes";
import { MERCURY_PRECESSION_TARGET_ARCSEC_PER_CENTURY } from "./relativityReferenceConstants";

export { MERCURY_PRECESSION_TARGET_ARCSEC_PER_CENTURY } from "./relativityReferenceConstants";

const HORIZONS_CHECKPOINTS: readonly Pick<
  HorizonsComparisonCheckpoint,
  "label" | "offsetDays"
>[] = [
  { label: "+30d", offsetDays: 30 },
  { label: "+365d", offsetDays: 365 },
  { label: "+10y", offsetDays: 3652.5 },
];

export function mercuryPrecessionErrorPercent(
  measuredArcsecPerCentury: number | null | undefined,
): number | null {
  if (measuredArcsecPerCentury == null || !Number.isFinite(measuredArcsecPerCentury)) return null;
  return (
    (Math.abs(measuredArcsecPerCentury - MERCURY_PRECESSION_TARGET_ARCSEC_PER_CENTURY) /
      MERCURY_PRECESSION_TARGET_ARCSEC_PER_CENTURY) *
    100
  );
}

export function createMercuryPrecessionBenchmark(
  measuredArcsecPerCentury: number | null,
  status: string,
): MercuryPrecessionBenchmark {
  return {
    initialState: "shared-newton-1pn",
    measuredArcsecPerCentury,
    targetArcsecPerCentury: MERCURY_PRECESSION_TARGET_ARCSEC_PER_CENTURY,
    errorPercent: mercuryPrecessionErrorPercent(measuredArcsecPerCentury),
    status,
  };
}

export function createHorizonsComparisonCheckpoints(): HorizonsComparisonCheckpoint[] {
  return HORIZONS_CHECKPOINTS.map((checkpoint) => ({
    ...checkpoint,
    referenceSource: "JPL Horizons",
    available: false,
    deltaRKm: null,
    deltaVMs: null,
    rmsPositionKm: null,
    rmsVelocityMs: null,
    bodyComparisons: [],
    note: "Future Horizons checkpoint reference pending; current epoch RMS is reported separately.",
  }));
}

export function computeCurrentEpochHorizonsRms(physics: SolarSystemPhysicsRef | null): {
  rmsPositionKm: number | null;
  rmsVelocityMs: number | null;
  bodyComparisons: HorizonsComparisonBody[];
} {
  if (!physics) {
    return { rmsPositionKm: null, rmsVelocityMs: null, bodyComparisons: [] };
  }
  const comparisons: HorizonsComparisonBody[] = [];
  const sx = physics.posM[0] ?? 0;
  const sy = physics.posM[1] ?? 0;
  const sz = physics.posM[2] ?? 0;
  const svx = physics.velM[0] ?? 0;
  const svy = physics.velM[1] ?? 0;
  const svz = physics.velM[2] ?? 0;

  for (let i = 1; i < Math.min(physics.n, SOLAR_SYSTEM_BODIES.length); i++) {
    const body = SOLAR_SYSTEM_BODIES[i];
    if (!body) continue;
    const ref = horizonsRefForId(body.id);
    if (!ref) continue;
    const base = 3 * i;
    const xAu = ((physics.posM[base] ?? 0) - sx) / AU_METERS;
    const yAu = ((physics.posM[base + 1] ?? 0) - sy) / AU_METERS;
    const zAu = ((physics.posM[base + 2] ?? 0) - sz) / AU_METERS;
    const vxAuD = (((physics.velM[base] ?? 0) - svx) * DAY_SECONDS) / AU_METERS;
    const vyAuD = (((physics.velM[base + 1] ?? 0) - svy) * DAY_SECONDS) / AU_METERS;
    const vzAuD = (((physics.velM[base + 2] ?? 0) - svz) * DAY_SECONDS) / AU_METERS;

    const drKm =
      Math.hypot(xAu - ref.x_au, yAu - ref.y_au, zAu - ref.z_au) *
      (AU_METERS / 1000);
    const dvMs =
      Math.hypot(vxAuD - ref.vx_au_d, vyAuD - ref.vy_au_d, vzAuD - ref.vz_au_d) *
      (AU_METERS / DAY_SECONDS);
    comparisons.push({ bodyId: body.id, deltaRKm: drKm, deltaVMs: dvMs });
  }

  if (comparisons.length === 0) {
    return { rmsPositionKm: null, rmsVelocityMs: null, bodyComparisons: [] };
  }
  const rmsPositionKm = Math.sqrt(
    comparisons.reduce((sum, item) => sum + item.deltaRKm * item.deltaRKm, 0) /
      comparisons.length,
  );
  const rmsVelocityMs = Math.sqrt(
    comparisons.reduce((sum, item) => sum + item.deltaVMs * item.deltaVMs, 0) /
      comparisons.length,
  );
  return { rmsPositionKm, rmsVelocityMs, bodyComparisons: comparisons };
}

export function researchConfidenceForDiagnostics(args: {
  mercuryPrecessionErrorPercent: number | null;
  horizonsRmsPositionKm: number | null;
  horizonsRmsVelocityMs: number | null;
  relEnergyDrift: number;
  relAngMomDrift: number;
}): ResearchConfidence {
  const hasDiagnostics =
    Number.isFinite(args.relEnergyDrift) &&
    Number.isFinite(args.relAngMomDrift) &&
    args.horizonsRmsPositionKm != null &&
    args.horizonsRmsVelocityMs != null;
  if (!hasDiagnostics) return "visual";
  const horizonsRmsPositionKm = args.horizonsRmsPositionKm ?? Infinity;
  const horizonsRmsVelocityMs = args.horizonsRmsVelocityMs ?? Infinity;
  const conservationGood = args.relEnergyDrift < 1e-3 && args.relAngMomDrift < 1e-3;
  const horizonsGood = horizonsRmsPositionKm < 1e6 && horizonsRmsVelocityMs < 10;
  const mercuryGood =
    args.mercuryPrecessionErrorPercent != null &&
    args.mercuryPrecessionErrorPercent < 25;
  return conservationGood && horizonsGood && mercuryGood ? "validated" : "diagnostic";
}

export function createResearchValidationSummary(args: {
  mercuryArcsecPerCentury: number | null;
  mercuryStatus: string;
  relEnergyDrift: number;
  relAngMomDrift: number;
  pnAccelFraction: number | null;
}): ResearchValidationSummary {
  return {
    mercuryPrecession: createMercuryPrecessionBenchmark(
      args.mercuryArcsecPerCentury,
      args.mercuryStatus,
    ),
    horizonsCheckpoints: createHorizonsComparisonCheckpoints(),
    conservation: {
      relEnergyDrift: args.relEnergyDrift,
      relAngMomDrift: args.relAngMomDrift,
      pnAccelFraction: args.pnAccelFraction,
    },
    sourceSemantics: {
      atlasOrbits: "presentation-layer",
      referenceOrbit: "static-j2000-visual-guide",
      liveValues: "n-body-state-diagnostics",
    },
  };
}
