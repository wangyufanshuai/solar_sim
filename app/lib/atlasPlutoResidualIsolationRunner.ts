import {
  V82_DE440_SOLAR_MASS_KG_BY_ID,
  V82_DE440_SYSTEM_MASS_KG_BY_ID,
} from "./atlasHorizonsCandidateLab";
import {
  V83_PLUTO_ISOLATION_BASELINE_ID,
  V83_PLUTO_RESIDUAL_ISOLATION_PROFILES,
  dominantComponent,
} from "./atlasPlutoResidualIsolation";
import { runHorizonsValidationDataset } from "./horizonsValidationRunner";
import { AU_METERS } from "./physicalConstants";
import type {
  AtlasPlutoResidualIsolationCandidateId,
  AtlasPlutoResidualIsolationRow,
  HorizonsComparisonBody,
  HorizonsComparisonCheckpoint,
  HorizonsValidationDataset,
  HorizonsValidationRun,
} from "./simulationDiagnosticsTypes";

type IsolationProfile = (typeof V83_PLUTO_RESIDUAL_ISOLATION_PROFILES)[number];

export async function runAtlasPlutoResidualIsolationMatrix(args: {
  baselineDataset: HorizonsValidationDataset;
  hierarchyDataset?: HorizonsValidationDataset | null;
  profileIds?: readonly AtlasPlutoResidualIsolationCandidateId[];
}): Promise<readonly AtlasPlutoResidualIsolationRow[]> {
  const profileIds = new Set(
    args.profileIds ?? V83_PLUTO_RESIDUAL_ISOLATION_PROFILES.map((profile) => profile.id),
  );
  const rows: AtlasPlutoResidualIsolationRow[] = [];
  let baselineRow: AtlasPlutoResidualIsolationRow | null = null;

  for (const profile of V83_PLUTO_RESIDUAL_ISOLATION_PROFILES) {
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
    if (profile.id === V83_PLUTO_ISOLATION_BASELINE_ID) {
      baselineRow = row;
      rows.splice(
        0,
        rows.length,
        ...rows.map((existing) =>
          existing.status === "complete"
            ? withBaselineComparison(existing, row)
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
  profile: IsolationProfile,
  run: HorizonsValidationRun,
  baselineRow: AtlasPlutoResidualIsolationRow | null,
): AtlasPlutoResidualIsolationRow {
  const onePn = run.modes.find((mode) => mode.mode === "1pn");
  const tenYear = onePn?.checkpoints.find((checkpoint) => checkpoint.label === "+10y");
  const pluto = findBody(tenYear, "pluto");
  const row: AtlasPlutoResidualIsolationRow = {
    ...rowIdentity(profile),
    status: "complete",
    onePnRmsPositionKm: onePn?.rmsPositionKm ?? null,
    onePnRmsVelocityMs: onePn?.rmsVelocityMs ?? null,
    plutoPositionKm: pluto?.deltaRKm ?? null,
    plutoVelocityMs: pluto?.deltaVMs ?? null,
    plutoPositionImprovementVsBaseline: null,
    plutoExcludedAggregate: aggregateExcludingBody(profile.id, tenYear, "pluto"),
    plutoRtn: rtnFromBody(profile.id, pluto),
    mutationStatus: "not-applied",
  };
  return baselineRow ? withBaselineComparison(row, baselineRow) : row;
}

function emptyRow(profile: IsolationProfile): AtlasPlutoResidualIsolationRow {
  return {
    ...rowIdentity(profile),
    status: "not-run",
    onePnRmsPositionKm: null,
    onePnRmsVelocityMs: null,
    plutoPositionKm: null,
    plutoVelocityMs: null,
    plutoPositionImprovementVsBaseline: null,
    plutoExcludedAggregate: {
      candidateId: profile.id,
      excludedBodyId: "pluto",
      bodyCount: 0,
      onePnRmsPositionKm: null,
      onePnRmsVelocityMs: null,
    },
    plutoRtn: {
      candidateId: profile.id,
      basisStatus: "unavailable",
      radialPositionKm: null,
      transversePositionKm: null,
      normalPositionKm: null,
      radialVelocityMs: null,
      transverseVelocityMs: null,
      normalVelocityMs: null,
      positionNormKm: null,
      velocityNormMs: null,
      dominantPositionComponent: "unavailable",
      dominantVelocityComponent: "unavailable",
    },
    mutationStatus: "not-applied",
  };
}

function rowIdentity(profile: IsolationProfile): Pick<
  AtlasPlutoResidualIsolationRow,
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
  row: AtlasPlutoResidualIsolationRow,
  baseline: AtlasPlutoResidualIsolationRow,
): AtlasPlutoResidualIsolationRow {
  return {
    ...row,
    plutoPositionImprovementVsBaseline: ratio(
      baseline.plutoPositionKm,
      row.plutoPositionKm,
    ),
  };
}

function massMapForProfile(
  profile: AtlasPlutoResidualIsolationRow["massProfile"],
): Readonly<Record<string, number>> {
  if (profile === "de440-solar-gm-only") return V82_DE440_SOLAR_MASS_KG_BY_ID;
  return V82_DE440_SYSTEM_MASS_KG_BY_ID;
}

function epsAuToMetersSquared(value: number): number {
  return (value * AU_METERS) ** 2;
}

function findBody(
  checkpoint: HorizonsComparisonCheckpoint | undefined,
  bodyId: string,
): HorizonsComparisonBody | undefined {
  return checkpoint?.bodyComparisons.find((body) => body.bodyId === bodyId);
}

function aggregateExcludingBody(
  candidateId: AtlasPlutoResidualIsolationCandidateId,
  checkpoint: HorizonsComparisonCheckpoint | undefined,
  excludedBodyId: "pluto",
): AtlasPlutoResidualIsolationRow["plutoExcludedAggregate"] {
  const bodies =
    checkpoint?.bodyComparisons.filter(
      (body) =>
        body.bodyId !== "sun" &&
        body.bodyId !== excludedBodyId &&
        Number.isFinite(body.deltaRKm) &&
        Number.isFinite(body.deltaVMs),
    ) ?? [];
  if (bodies.length === 0) {
    return {
      candidateId,
      excludedBodyId,
      bodyCount: 0,
      onePnRmsPositionKm: null,
      onePnRmsVelocityMs: null,
    };
  }
  return {
    candidateId,
    excludedBodyId,
    bodyCount: bodies.length,
    onePnRmsPositionKm: Math.sqrt(
      bodies.reduce((sum, body) => sum + body.deltaRKm ** 2, 0) / bodies.length,
    ),
    onePnRmsVelocityMs: Math.sqrt(
      bodies.reduce((sum, body) => sum + body.deltaVMs ** 2, 0) / bodies.length,
    ),
  };
}

function rtnFromBody(
  candidateId: AtlasPlutoResidualIsolationCandidateId,
  body: HorizonsComparisonBody | undefined,
): AtlasPlutoResidualIsolationRow["plutoRtn"] {
  const residual = body?.orbitalResidual;
  if (!residual) {
    return unavailableRtn(candidateId);
  }
  return {
    candidateId,
    basisStatus: residual.basisStatus,
    radialPositionKm: residual.radialPositionKm,
    transversePositionKm: residual.transversePositionKm,
    normalPositionKm: residual.normalPositionKm,
    radialVelocityMs: residual.radialVelocityMs,
    transverseVelocityMs: residual.transverseVelocityMs,
    normalVelocityMs: residual.normalVelocityMs,
    positionNormKm: residual.positionNormKm,
    velocityNormMs: residual.velocityNormMs,
    dominantPositionComponent: dominantComponent(
      residual.radialPositionKm,
      residual.transversePositionKm,
      residual.normalPositionKm,
    ),
    dominantVelocityComponent: dominantComponent(
      residual.radialVelocityMs,
      residual.transverseVelocityMs,
      residual.normalVelocityMs,
    ),
  };
}

function unavailableRtn(
  candidateId: AtlasPlutoResidualIsolationCandidateId,
): AtlasPlutoResidualIsolationRow["plutoRtn"] {
  return {
    candidateId,
    basisStatus: "unavailable",
    radialPositionKm: null,
    transversePositionKm: null,
    normalPositionKm: null,
    radialVelocityMs: null,
    transverseVelocityMs: null,
    normalVelocityMs: null,
    positionNormKm: null,
    velocityNormMs: null,
    dominantPositionComponent: "unavailable",
    dominantVelocityComponent: "unavailable",
  };
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
