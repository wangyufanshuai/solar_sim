import {
  ATLAS_PHYSICS_BENCHMARK_BUDGETS,
} from "./atlasPhysicsBenchmarkGate";
import {
  V82_DE440_SOLAR_MASS_KG_BY_ID,
  V82_DE440_SYSTEM_MASS_KG_BY_ID,
  V82_HORIZONS_CANDIDATE_PROFILES,
} from "./atlasHorizonsCandidateLab";
import { runHorizonsValidationDataset } from "./horizonsValidationRunner";
import { AU_METERS } from "./physicalConstants";
import type {
  AtlasHorizonsCandidateProfileId,
  AtlasHorizonsCandidateRow,
  HorizonsComparisonCheckpoint,
  HorizonsValidationDataset,
  HorizonsValidationRun,
} from "./simulationDiagnosticsTypes";

type CandidateProfile = (typeof V82_HORIZONS_CANDIDATE_PROFILES)[number];

export async function runAtlasHorizonsCandidateMatrix(args: {
  baselineDataset: HorizonsValidationDataset;
  hierarchyDataset?: HorizonsValidationDataset | null;
  profileIds?: readonly AtlasHorizonsCandidateProfileId[];
}): Promise<readonly AtlasHorizonsCandidateRow[]> {
  const profileIds = new Set(
    args.profileIds ?? V82_HORIZONS_CANDIDATE_PROFILES.map((profile) => profile.id),
  );
  const rows: AtlasHorizonsCandidateRow[] = [];
  let baselineRow: AtlasHorizonsCandidateRow | null = null;
  for (const profile of V82_HORIZONS_CANDIDATE_PROFILES) {
    if (!profileIds.has(profile.id)) continue;
    const dataset =
      profile.datasetRole === "v82-hierarchy-reference"
        ? args.hierarchyDataset
        : args.baselineDataset;
    if (!dataset) {
      rows.push(emptyRow(profile));
      continue;
    }
    const run = await runHorizonsValidationDataset(dataset, {
      dtDays: profile.dtDays,
      eps2Meters: epsAuToMetersSquared(profile.softeningAu),
      massKgByBodyId: massMapForProfile(profile.massProfile),
    });
    const row = rowFromRun(profile, run, baselineRow);
    rows.push(row);
    if (profile.id === "baseline-v75-strict") {
      baselineRow = row;
      const baseline = row;
      rows.splice(
        0,
        rows.length,
        ...rows.map((existing) =>
          existing.status === "complete"
            ? withBaselineComparison(existing, baseline)
            : existing,
        ),
      );
    }
  }
  return rows.map((row) =>
    baselineRow && row.status === "complete"
      ? withBaselineComparison(row, baselineRow)
      : row,
  );
}

function rowFromRun(
  profile: CandidateProfile,
  run: HorizonsValidationRun,
  baselineRow: AtlasHorizonsCandidateRow | null,
): AtlasHorizonsCandidateRow {
  const onePn = run.modes.find((mode) => mode.mode === "1pn");
  const tenYear = onePn?.checkpoints.find((checkpoint) => checkpoint.label === "+10y");
  const mercury = findBody(tenYear, "mercury");
  const pluto = findBody(tenYear, "pluto");
  const row: AtlasHorizonsCandidateRow = {
    ...rowIdentity(profile),
    status: "complete",
    onePnRmsPositionKm: onePn?.rmsPositionKm ?? null,
    onePnRmsVelocityMs: onePn?.rmsVelocityMs ?? null,
    mercuryPositionKm: mercury?.deltaRKm ?? null,
    mercuryVelocityMs: mercury?.deltaVMs ?? null,
    plutoPositionKm: pluto?.deltaRKm ?? null,
    plutoVelocityMs: pluto?.deltaVMs ?? null,
    mercuryVelocityImprovementVsBaseline: null,
    plutoPositionImprovementVsBaseline: null,
    scientificGateCandidateStatus:
      passesStrictAggregate(onePn?.rmsPositionKm, onePn?.rmsVelocityMs)
        ? "pass"
        : "partial",
    mutationStatus: "not-applied",
  };
  return baselineRow ? withBaselineComparison(row, baselineRow) : row;
}

function emptyRow(profile: CandidateProfile): AtlasHorizonsCandidateRow {
  return {
    ...rowIdentity(profile),
    status: "not-run",
    onePnRmsPositionKm: null,
    onePnRmsVelocityMs: null,
    mercuryPositionKm: null,
    mercuryVelocityMs: null,
    plutoPositionKm: null,
    plutoVelocityMs: null,
    mercuryVelocityImprovementVsBaseline: null,
    plutoPositionImprovementVsBaseline: null,
    scientificGateCandidateStatus: "not-run",
    mutationStatus: "not-applied",
  };
}

function rowIdentity(profile: CandidateProfile): Pick<
  AtlasHorizonsCandidateRow,
  "id" | "label" | "datasetRole" | "massProfile" | "dtDays" | "softeningAu"
> {
  return {
    id: profile.id,
    label: profile.label,
    datasetRole: profile.datasetRole,
    massProfile: profile.massProfile,
    dtDays: profile.dtDays,
    softeningAu: profile.softeningAu,
  };
}

function withBaselineComparison(
  row: AtlasHorizonsCandidateRow,
  baseline: AtlasHorizonsCandidateRow,
): AtlasHorizonsCandidateRow {
  return {
    ...row,
    mercuryVelocityImprovementVsBaseline: ratio(
      baseline.mercuryVelocityMs,
      row.mercuryVelocityMs,
    ),
    plutoPositionImprovementVsBaseline: ratio(
      baseline.plutoPositionKm,
      row.plutoPositionKm,
    ),
  };
}

function massMapForProfile(
  profile: AtlasHorizonsCandidateRow["massProfile"],
): Readonly<Record<string, number>> | undefined {
  if (profile === "de440-solar-gm-only") return V82_DE440_SOLAR_MASS_KG_BY_ID;
  if (profile === "de440-system-gm") return V82_DE440_SYSTEM_MASS_KG_BY_ID;
  return undefined;
}

function epsAuToMetersSquared(value: number): number {
  return (value * AU_METERS) ** 2;
}

function findBody(
  checkpoint: HorizonsComparisonCheckpoint | undefined,
  bodyId: string,
) {
  return checkpoint?.bodyComparisons.find((body) => body.bodyId === bodyId);
}

function passesStrictAggregate(
  positionKm: number | null | undefined,
  velocityMs: number | null | undefined,
): boolean {
  return (
    Number.isFinite(positionKm) &&
    (positionKm as number) < ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsPositionRmsKm &&
    Number.isFinite(velocityMs) &&
    (velocityMs as number) < ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsVelocityRmsMs
  );
}

function ratio(
  baseline: number | null,
  candidate: number | null,
): number | null {
  if (
    baseline == null ||
    candidate == null ||
    !Number.isFinite(baseline) ||
    !Number.isFinite(candidate) ||
    candidate <= 0
  ) {
    return null;
  }
  return baseline / candidate;
}
