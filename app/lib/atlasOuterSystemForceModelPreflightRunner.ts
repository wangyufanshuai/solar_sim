import {
  V82_DE440_SOLAR_MASS_KG_BY_ID,
  V82_DE440_SYSTEM_MASS_KG_BY_ID,
} from "./atlasHorizonsCandidateLab";
import {
  V84_OUTER_SYSTEM_FORCE_MODEL_PREFLIGHT_PROFILES,
} from "./atlasOuterSystemForceModelPreflight";
import { runHorizonsValidationDataset } from "./horizonsValidationRunner";
import { AU_METERS } from "./physicalConstants";
import type {
  AtlasOuterSystemForceModelPreflightCandidateId,
  AtlasOuterSystemForceModelPreflightFixtureAudit,
  AtlasOuterSystemForceModelPreflightFixtureAuditId,
  AtlasOuterSystemForceModelPreflightRow,
  HorizonsComparisonBody,
  HorizonsComparisonCheckpoint,
  HorizonsValidationDataset,
  HorizonsValidationRun,
} from "./simulationDiagnosticsTypes";

const OUTER_SYSTEM_BODY_IDS = [
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
  "pluto",
] as const;

type PreflightProfile = (typeof V84_OUTER_SYSTEM_FORCE_MODEL_PREFLIGHT_PROFILES)[number];

export function auditOuterSystemFixtureProvenance(args: {
  id: AtlasOuterSystemForceModelPreflightFixtureAuditId;
  label: string;
  baselineDataset: HorizonsValidationDataset;
  candidateDataset: HorizonsValidationDataset | null | undefined;
  expectedVariant: string;
}): AtlasOuterSystemForceModelPreflightFixtureAudit {
  const candidate = args.candidateDataset;
  if (!candidate) {
    return audit({
      ...args,
      status: "missing",
      variant: null,
      outerSystemJ2000DeltaAu: null,
      targetProvenanceBodyCount: 0,
      barycenterTargetCount: 0,
      boundary:
        "Candidate fixture is unavailable; no barycenter or force-model conclusion can be drawn.",
    });
  }

  const outerSystemJ2000DeltaAu = maxJ2000DeltaAu(
    args.baselineDataset,
    candidate,
    OUTER_SYSTEM_BODY_IDS,
  );
  const targetProvenance = candidate.targetProvenance ?? [];
  const barycenterTargetCount = targetProvenance.filter(
    (item) => item.role === "system-barycenter-reference",
  ).length;
  const hasBodyLevelProvenance = candidate.checkpoints.every((checkpoint) =>
    checkpoint.bodies.every((body) => body.targetCommandId && body.targetRole),
  );
  const status =
    candidate.variant === args.expectedVariant &&
    targetProvenance.length >= 12 &&
    barycenterTargetCount >= OUTER_SYSTEM_BODY_IDS.length &&
    hasBodyLevelProvenance &&
    outerSystemJ2000DeltaAu != null &&
    outerSystemJ2000DeltaAu > 1e-12
      ? "ready"
      : "provenance-insufficient";

  return audit({
    ...args,
    status,
    variant: candidate.variant ?? null,
    outerSystemJ2000DeltaAu,
    targetProvenanceBodyCount: targetProvenance.length,
    barycenterTargetCount,
    boundary:
      status === "ready"
        ? "Fixture contains explicit target provenance and nonzero outer-system J2000 deltas from the v75 center-reference baseline."
        : "Fixture provenance is insufficient for barycenter conclusions because target metadata is missing, variant is unexpected, or outer-system vectors match the v75 baseline.",
  });
}

export async function runAtlasOuterSystemForceModelPreflightMatrix(args: {
  baselineDataset: HorizonsValidationDataset;
  v82HierarchyDataset?: HorizonsValidationDataset | null;
  v84OuterSystemDataset?: HorizonsValidationDataset | null;
  profileIds?: readonly AtlasOuterSystemForceModelPreflightCandidateId[];
}): Promise<{
  fixtureAudits: readonly AtlasOuterSystemForceModelPreflightFixtureAudit[];
  rows: readonly AtlasOuterSystemForceModelPreflightRow[];
}> {
  const fixtureAudits = [
    auditOuterSystemFixtureProvenance({
      id: "v82-hierarchy-candidate",
      label: "v82 hierarchy barycenter candidate fixture",
      baselineDataset: args.baselineDataset,
      candidateDataset: args.v82HierarchyDataset,
      expectedVariant: "v82-hierarchy-barycenter-candidate",
    }),
    auditOuterSystemFixtureProvenance({
      id: "v84-outer-system-barycenter",
      label: "v84 outer-system barycenter fixture",
      baselineDataset: args.baselineDataset,
      candidateDataset: args.v84OuterSystemDataset,
      expectedVariant: "v84-outer-system-barycenter-reference",
    }),
  ];
  const profileIds = new Set(
    args.profileIds ?? V84_OUTER_SYSTEM_FORCE_MODEL_PREFLIGHT_PROFILES.map((profile) => profile.id),
  );
  const rows: AtlasOuterSystemForceModelPreflightRow[] = [];
  let baselineRow: AtlasOuterSystemForceModelPreflightRow | null = null;

  for (const profile of V84_OUTER_SYSTEM_FORCE_MODEL_PREFLIGHT_PROFILES) {
    if (!profileIds.has(profile.id)) continue;
    if (profile.id === "v84-tno-kuiper-metadata-only") {
      rows.push(metadataRow(profile));
      continue;
    }
    const fixtureAudit = profile.fixtureAuditId
      ? fixtureAudits.find((audit) => audit.id === profile.fixtureAuditId)
      : null;
    const dataset =
      profile.datasetVariant === "v84-outer-system-barycenter-reference"
        ? args.v84OuterSystemDataset
        : args.baselineDataset;
    if (!dataset) {
      rows.push(blockedRow(profile));
      continue;
    }
    if (fixtureAudit && fixtureAudit.status !== "ready") {
      rows.push(blockedRow(profile));
      continue;
    }
    const run = await runHorizonsValidationDataset(dataset, {
      dtDays: profile.dtDays ?? undefined,
      eps2Meters: epsAuToMetersSquared(profile.softeningAu ?? 0),
      massKgByBodyId: massMapForProfile(profile.massProfile),
    });
    const row = rowFromRun(profile, run, baselineRow);
    rows.push(row);
    if (profile.id === "v83-best-baseline") {
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

  return {
    fixtureAudits,
    rows: rows.map((row) =>
      baselineRow && row.status === "complete"
        ? withBaselineComparison(row, baselineRow)
        : row,
    ),
  };
}

function audit(
  args: Omit<AtlasOuterSystemForceModelPreflightFixtureAudit, "trustedBoundary"> & {
    boundary: string;
  },
): AtlasOuterSystemForceModelPreflightFixtureAudit {
  return {
    id: args.id,
    label: args.label,
    status: args.status,
    variant: args.variant,
    expectedVariant: args.expectedVariant,
    outerSystemJ2000DeltaAu: args.outerSystemJ2000DeltaAu,
    targetProvenanceBodyCount: args.targetProvenanceBodyCount,
    barycenterTargetCount: args.barycenterTargetCount,
    trustedBoundary: args.boundary,
  };
}

function rowFromRun(
  profile: PreflightProfile,
  run: HorizonsValidationRun,
  baselineRow: AtlasOuterSystemForceModelPreflightRow | null,
): AtlasOuterSystemForceModelPreflightRow {
  const onePn = run.modes.find((mode) => mode.mode === "1pn");
  const tenYear = onePn?.checkpoints.find((checkpoint) => checkpoint.label === "+10y");
  const pluto = findBody(tenYear, "pluto");
  const row: AtlasOuterSystemForceModelPreflightRow = {
    ...rowIdentity(profile),
    status: "complete",
    onePnRmsPositionKm: onePn?.rmsPositionKm ?? null,
    onePnRmsVelocityMs: onePn?.rmsVelocityMs ?? null,
    plutoPositionKm: pluto?.deltaRKm ?? null,
    plutoVelocityMs: pluto?.deltaVMs ?? null,
    plutoPositionImprovementVsBaseline: null,
    plutoExcludedAggregate: aggregateExcludingBody(tenYear, "pluto"),
    mutationStatus: "not-applied",
  };
  return baselineRow ? withBaselineComparison(row, baselineRow) : row;
}

function metadataRow(profile: PreflightProfile): AtlasOuterSystemForceModelPreflightRow {
  return {
    ...rowIdentity(profile),
    status: "metadata-only",
    onePnRmsPositionKm: null,
    onePnRmsVelocityMs: null,
    plutoPositionKm: null,
    plutoVelocityMs: null,
    plutoPositionImprovementVsBaseline: null,
    plutoExcludedAggregate: emptyAggregate(),
    mutationStatus: "not-applied",
  };
}

function blockedRow(profile: PreflightProfile): AtlasOuterSystemForceModelPreflightRow {
  return {
    ...rowIdentity(profile),
    status: "blocked",
    onePnRmsPositionKm: null,
    onePnRmsVelocityMs: null,
    plutoPositionKm: null,
    plutoVelocityMs: null,
    plutoPositionImprovementVsBaseline: null,
    plutoExcludedAggregate: emptyAggregate(),
    mutationStatus: "not-applied",
  };
}

function rowIdentity(profile: PreflightProfile): Pick<
  AtlasOuterSystemForceModelPreflightRow,
  | "id"
  | "label"
  | "targetRole"
  | "datasetVariant"
  | "massProfile"
  | "dtDays"
  | "softeningAu"
  | "fixtureAuditId"
> {
  return {
    id: profile.id,
    label: profile.label,
    targetRole: profile.targetRole,
    datasetVariant: profile.datasetVariant,
    massProfile: profile.massProfile,
    dtDays: profile.dtDays,
    softeningAu: profile.softeningAu,
    fixtureAuditId: profile.fixtureAuditId,
  };
}

function withBaselineComparison(
  row: AtlasOuterSystemForceModelPreflightRow,
  baseline: AtlasOuterSystemForceModelPreflightRow,
): AtlasOuterSystemForceModelPreflightRow {
  return {
    ...row,
    plutoPositionImprovementVsBaseline: ratio(
      baseline.plutoPositionKm,
      row.plutoPositionKm,
    ),
  };
}

function massMapForProfile(
  profile: AtlasOuterSystemForceModelPreflightRow["massProfile"],
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
): HorizonsComparisonBody | undefined {
  return checkpoint?.bodyComparisons.find((body) => body.bodyId === bodyId);
}

function aggregateExcludingBody(
  checkpoint: HorizonsComparisonCheckpoint | undefined,
  excludedBodyId: "pluto",
): AtlasOuterSystemForceModelPreflightRow["plutoExcludedAggregate"] {
  const bodies =
    checkpoint?.bodyComparisons.filter(
      (body) =>
        body.bodyId !== "sun" &&
        body.bodyId !== excludedBodyId &&
        Number.isFinite(body.deltaRKm) &&
        Number.isFinite(body.deltaVMs),
    ) ?? [];
  if (bodies.length === 0) return emptyAggregate();
  return {
    candidateId: "",
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

function emptyAggregate(): AtlasOuterSystemForceModelPreflightRow["plutoExcludedAggregate"] {
  return {
    candidateId: "",
    excludedBodyId: "pluto",
    bodyCount: 0,
    onePnRmsPositionKm: null,
    onePnRmsVelocityMs: null,
  };
}

function maxJ2000DeltaAu(
  baselineDataset: HorizonsValidationDataset,
  candidateDataset: HorizonsValidationDataset,
  bodyIds: readonly string[],
): number | null {
  const baseline = baselineDataset.checkpoints.find((checkpoint) => checkpoint.label === "J2000");
  const candidate = candidateDataset.checkpoints.find((checkpoint) => checkpoint.label === "J2000");
  if (!baseline || !candidate) return null;
  const baselineById = new Map(baseline.bodies.map((body) => [body.id, body]));
  const candidateById = new Map(candidate.bodies.map((body) => [body.id, body]));
  const deltas = bodyIds.flatMap((bodyId) => {
    const left = baselineById.get(bodyId);
    const right = candidateById.get(bodyId);
    if (!left || !right) return [];
    return [
      Math.hypot(
        left.x_au - right.x_au,
        left.y_au - right.y_au,
        left.z_au - right.z_au,
      ),
    ];
  });
  return deltas.length > 0 ? Math.max(...deltas) : null;
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
