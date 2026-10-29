import { SOLAR_SYSTEM_BODIES } from "../data/planetsJ2000";
import {
  createRk4Workspaces,
  defaultEps2Meters,
  rk4Step,
  stateAuToSi,
} from "./physicsEngine";
import { C_LIGHT, DAY_SECONDS, G_SI } from "./physicalConstants";
import {
  compareStateToHorizonsCheckpoint,
  modeResultFromCheckpoints,
} from "./relativityValidation";
import type {
  HorizonsValidationDataset,
  HorizonsValidationModeResult,
  HorizonsValidationRun,
} from "./simulationDiagnosticsTypes";

export const HORIZONS_VALIDATION_DT_DAYS = 0.25;

export type HorizonsValidationMassMap =
  | ReadonlyMap<string, number>
  | Readonly<Record<string, number>>;

export type HorizonsValidationProgress = {
  mode: "newton" | "1pn";
  elapsedDays: number;
  maxDays: number;
};

export type HorizonsValidationRunnerOptions = {
  dtDays?: number;
  eps2Meters?: number;
  massKgByBodyId?: HorizonsValidationMassMap;
  onProgress?: (progress: HorizonsValidationProgress) => void;
  yieldControl?: () => Promise<void>;
};

export async function runHorizonsValidationDataset(
  dataset: HorizonsValidationDataset,
  options: HorizonsValidationRunnerOptions = {},
): Promise<HorizonsValidationRun> {
  const modes = [
    await runHorizonsValidationMode(dataset, "newton", options),
    await runHorizonsValidationMode(dataset, "1pn", options),
  ];
  return {
    status: "complete",
    progress: 1,
    source: dataset.source,
    modes,
  };
}

export async function runHorizonsValidationMode(
  dataset: HorizonsValidationDataset,
  mode: "newton" | "1pn",
  options: HorizonsValidationRunnerOptions = {},
): Promise<HorizonsValidationModeResult> {
  const initial = dataset.checkpoints.find((checkpoint) => checkpoint.label === "J2000");
  if (!initial) throw new Error("Horizons validation dataset missing J2000 checkpoint");
  const checkpoints = dataset.checkpoints.filter((checkpoint) => checkpoint.label !== "J2000");
  const bodyIds = initial.bodies.map((body) => body.id);
  const n = bodyIds.length;
  const posAu = new Float64Array(n * 3);
  const velAuD = new Float64Array(n * 3);
  const posM = new Float64Array(n * 3);
  const velM = new Float64Array(n * 3);
  const mass = new Float64Array(n);
  const bodyMassById = new Map(SOLAR_SYSTEM_BODIES.map((body) => [body.id, body.massKg]));
  const dtDaysLimit = options.dtDays ?? HORIZONS_VALIDATION_DT_DAYS;

  for (let index = 0; index < n; index += 1) {
    const body = initial.bodies[index]!;
    posAu[3 * index] = body.x_au;
    posAu[3 * index + 1] = body.y_au;
    posAu[3 * index + 2] = body.z_au;
    velAuD[3 * index] = body.vx_au_d;
    velAuD[3 * index + 1] = body.vy_au_d;
    velAuD[3 * index + 2] = body.vz_au_d;
    mass[index] =
      massFromOverride(options.massKgByBodyId, body.id) ??
      bodyMassById.get(body.id) ??
      0;
  }
  stateAuToSi(posAu, velAuD, n, posM, velM);

  const workspaces = createRk4Workspaces(n);
  const eps2 = options.eps2Meters ?? defaultEps2Meters();
  const results = [];
  const invC2 = mode === "1pn" ? 1 / (C_LIGHT * C_LIGHT) : 0;
  let elapsedDays = 0;
  const maxDays = Math.max(...checkpoints.map((checkpoint) => checkpoint.offsetDays));
  let lastProgressDay = 0;

  for (const checkpoint of checkpoints) {
    while (elapsedDays < checkpoint.offsetDays - 1e-9) {
      const dtDays = Math.min(
        dtDaysLimit,
        checkpoint.offsetDays - elapsedDays,
      );
      rk4Step(
        posM,
        velM,
        mass,
        n,
        dtDays * DAY_SECONDS,
        G_SI,
        invC2,
        eps2,
        workspaces,
      );
      elapsedDays += dtDays;
      if (elapsedDays - lastProgressDay > 20) {
        lastProgressDay = elapsedDays;
        options.onProgress?.({ mode, elapsedDays, maxDays });
        await options.yieldControl?.();
      }
    }
    results.push(compareStateToHorizonsCheckpoint({ posM, velM, bodyIds, checkpoint }));
  }

  return modeResultFromCheckpoints(mode, results);
}

function massFromOverride(
  values: HorizonsValidationMassMap | undefined,
  id: string,
): number | null {
  if (!values) return null;
  if ("get" in values && typeof values.get === "function") {
    return values.get(id) ?? null;
  }
  const value = (values as Readonly<Record<string, number>>)[id];
  return Number.isFinite(value) ? value : null;
}
