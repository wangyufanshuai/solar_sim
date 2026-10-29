import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED } from "./atlasHorizonsGateAudit";
import { v86StrictBudgetContract } from "./atlasHorizonsCandidateScientificGateRunner";
import {
  createAtlasDefaultStrictHorizonsMigrationSummary,
  V89_LEGACY_V75_STRICT_HORIZONS_COMMAND,
} from "./atlasDefaultStrictHorizonsMigration";
import {
  runAtlasDefaultStrictHorizonsMigrationAudit,
} from "./atlasDefaultStrictHorizonsMigrationRunner";
import {
  V87_CANDIDATE_FIXTURE_PATH,
  V87_CURRENT_STRICT_FIXTURE_PATH,
  V87_STRICT_SCIENTIFIC_GATE_COMMAND,
} from "./atlasStrictHorizonsMigrationDryRun";
import {
  V90_HORIZONS_PROVENANCE_FREEZE_ROW,
  V90_LEGACY_V75_FIXTURE_SHA256,
  V90_MIGRATED_FIXTURE_SHA256,
} from "./atlasHorizonsProvenanceFreeze";
import type {
  AtlasHorizonsProvenanceFreezeLockAudit,
  AtlasHorizonsProvenanceFreezeRow,
  HorizonsValidationDataset,
} from "./simulationDiagnosticsTypes";

type FixtureFileAudit = {
  path: string;
  sha256: string;
  sizeBytes: number;
};

export function readAtlasHorizonsFixtureFileAudit(path: string): FixtureFileAudit {
  const absolutePath = resolve(process.cwd(), path);
  const buffer = readFileSync(absolutePath);
  return {
    path,
    sha256: createHash("sha256").update(buffer).digest("hex").toUpperCase(),
    sizeBytes: statSync(absolutePath).size,
  };
}

export async function runAtlasHorizonsProvenanceFreezeAudit(args: {
  baselineDataset: HorizonsValidationDataset;
  v82HierarchyDataset?: HorizonsValidationDataset | null;
  v84OuterSystemDataset?: HorizonsValidationDataset | null;
  packageScripts?: Readonly<Record<string, string>>;
  migratedFixtureAudit?: FixtureFileAudit;
  legacyFixtureAudit?: FixtureFileAudit;
  docsText?: string;
}): Promise<{
  lockAudits: readonly AtlasHorizonsProvenanceFreezeLockAudit[];
  rows: readonly AtlasHorizonsProvenanceFreezeRow[];
}> {
  const v89Audit = await runAtlasDefaultStrictHorizonsMigrationAudit(args);
  const v89Summary = createAtlasDefaultStrictHorizonsMigrationSummary(v89Audit);
  const lockAudits = [
    defaultCommandLock(args.packageScripts),
    legacyCommandLock(args.packageScripts),
    verifyScientificCommandLock(args.packageScripts),
    migratedFixtureHashLock(args.migratedFixtureAudit),
    legacyFixtureHashLock(args.legacyFixtureAudit),
    migratedFixtureProvenanceLock(args.v84OuterSystemDataset),
    budgetLock(),
    v89MigrationLock(v89Summary.status, v89Summary.classification),
    legacyBlockerLock(v89Summary.lockAudits),
    docsBoundaryLock(args.docsText ?? ""),
  ] as const satisfies readonly AtlasHorizonsProvenanceFreezeLockAudit[];

  return {
    lockAudits,
    rows: [freezeRow(lockAudits)],
  };
}

function defaultCommandLock(
  packageScripts: Readonly<Record<string, string>> | undefined,
): AtlasHorizonsProvenanceFreezeLockAudit {
  const measured = packageScripts?.["test:atlas:horizons-scientific-gate"] ?? "missing";
  const expected = "vitest run app/lib/atlasPhysicsBenchmarkGate.horizons.test.ts";
  return lock(
    "default-scientific-command-lock",
    "default strict scientific command ownership",
    measured === expected,
    measured,
    expected,
    "v90 freezes the existing default command name and the migrated v89 test target.",
  );
}

function legacyCommandLock(
  packageScripts: Readonly<Record<string, string>> | undefined,
): AtlasHorizonsProvenanceFreezeLockAudit {
  const measured = packageScripts?.["test:atlas:horizons-scientific-gate:legacy-v75"] ?? "missing";
  const expected = "vitest run app/lib/atlasPhysicsBenchmarkGate.legacy-v75.horizons.test.ts";
  return lock(
    "legacy-v75-command-lock",
    "legacy v75 blocker audit command ownership",
    measured === expected,
    measured,
    expected,
    "The legacy blocker path remains available as a named rollback and audit command.",
  );
}

function verifyScientificCommandLock(
  packageScripts: Readonly<Record<string, string>> | undefined,
): AtlasHorizonsProvenanceFreezeLockAudit {
  const measured = packageScripts?.["verify:atlas:scientific"] ?? "missing";
  const expected =
    "npm run verify:atlas && npm run test:atlas:horizons-scientific-gate && npm run test:atlas:browser:fresh";
  return lock(
    "verify-scientific-command-lock",
    "verify scientific command ownership",
    measured === expected,
    measured,
    expected,
    "The scientific verification command continues through the migrated default strict gate and fresh browser acceptance.",
  );
}

function migratedFixtureHashLock(
  audit: FixtureFileAudit | undefined,
): AtlasHorizonsProvenanceFreezeLockAudit {
  const ready =
    audit?.path === V87_CANDIDATE_FIXTURE_PATH &&
    audit.sha256 === V90_MIGRATED_FIXTURE_SHA256 &&
    audit.sizeBytes === 21863;
  return lock(
    "migrated-fixture-hash-lock",
    "migrated v84 fixture hash lock",
    ready,
    `${audit?.path ?? "missing"}; ${audit?.sha256 ?? "missing"}; ${audit?.sizeBytes ?? 0}`,
    `${V87_CANDIDATE_FIXTURE_PATH}; ${V90_MIGRATED_FIXTURE_SHA256}; 21863`,
    "The migrated default gate fixture cannot drift without failing the v90 freeze audit.",
  );
}

function legacyFixtureHashLock(
  audit: FixtureFileAudit | undefined,
): AtlasHorizonsProvenanceFreezeLockAudit {
  const ready =
    audit?.path === V87_CURRENT_STRICT_FIXTURE_PATH &&
    audit.sha256 === V90_LEGACY_V75_FIXTURE_SHA256 &&
    audit.sizeBytes === 14678;
  return lock(
    "legacy-fixture-hash-lock",
    "legacy v75 fixture hash lock",
    ready,
    `${audit?.path ?? "missing"}; ${audit?.sha256 ?? "missing"}; ${audit?.sizeBytes ?? 0}`,
    `${V87_CURRENT_STRICT_FIXTURE_PATH}; ${V90_LEGACY_V75_FIXTURE_SHA256}; 14678`,
    "The legacy v75 blocker fixture remains immutable rollback evidence.",
  );
}

function migratedFixtureProvenanceLock(
  dataset: HorizonsValidationDataset | null | undefined,
): AtlasHorizonsProvenanceFreezeLockAudit {
  const ready =
    dataset?.variant === "v84-outer-system-barycenter-reference" &&
    (dataset.targetProvenance?.length ?? 0) === 12;
  return lock(
    "migrated-fixture-provenance-lock",
    "migrated v84 fixture provenance lock",
    ready,
    `variant ${dataset?.variant ?? "missing"}; provenance ${dataset?.targetProvenance?.length ?? 0}`,
    "variant v84-outer-system-barycenter-reference; provenance 12",
    "The migrated fixture must preserve explicit target provenance and barycenter roles.",
  );
}

function budgetLock(): AtlasHorizonsProvenanceFreezeLockAudit {
  const budget = v86StrictBudgetContract();
  const ready =
    budget.horizonsPositionRmsKm === 1_000_000 &&
    budget.horizonsVelocityRmsMs === 10 &&
    budget.horizonsMercuryOnePnToNewtonRatio === 1.02;
  return lock(
    "v75-budget-lock",
    "v75 strict budget lock",
    ready,
    `${budget.horizonsPositionRmsKm} km / ${budget.horizonsVelocityRmsMs} m/s / Mercury ${budget.horizonsMercuryOnePnToNewtonRatio}`,
    "1,000,000 km / 10 m/s / Mercury 1.02",
    "v90 freezes the inherited v75 numerical budget and does not relax thresholds.",
  );
}

function v89MigrationLock(status: string, classification: string): AtlasHorizonsProvenanceFreezeLockAudit {
  const ready =
    status === "ready-default-gate-migrated" &&
    classification === "default-gate-migrated-shadow-provenance";
  return lock(
    "v89-default-migration-lock",
    "v89 default migration evidence lock",
    ready,
    `${status}; ${classification}`,
    "ready-default-gate-migrated; default-gate-migrated-shadow-provenance",
    "The freeze can pass only while the v89 migration audit remains ready.",
  );
}

function legacyBlockerLock(
  audits: readonly { id: string; status: string; measured: string }[],
): AtlasHorizonsProvenanceFreezeLockAudit {
  const legacy = audits.find((audit) => audit.id === "legacy-v75-blocker-lock");
  const ready =
    legacy?.status === "ready" &&
    legacy.measured === `fail; ${V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED}`;
  return lock(
    "legacy-v75-blocker-lock",
    "legacy v75 blocker preservation lock",
    ready,
    legacy?.measured ?? "missing",
    `fail; ${V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED}`,
    "The old center-reference path must keep reporting the preserved expected blocker.",
  );
}

function docsBoundaryLock(docsText: string): AtlasHorizonsProvenanceFreezeLockAudit {
  const ready =
    docsText.includes("v90 Horizons provenance freeze") &&
    docsText.includes("v89 之后默认 `test:atlas:horizons-scientific-gate` 已迁移并通过") &&
    docsText.includes("legacy v75 command") &&
    docsText.includes("not a NASA/JPL certification");
  return lock(
    "docs-boundary-lock",
    "documentation boundary lock",
    ready,
    ready ? "v90 docs boundary present" : "v90 docs boundary missing",
    "v90 docs boundary present",
    "The docs must describe the migrated default gate, preserved legacy blocker and no-certification boundary without contradicting current command ownership.",
  );
}

function freezeRow(
  audits: readonly AtlasHorizonsProvenanceFreezeLockAudit[],
): AtlasHorizonsProvenanceFreezeRow {
  const ready = audits.every((audit) => audit.status === "ready");
  const commandReady = audits
    .filter((audit) =>
      [
        "default-scientific-command-lock",
        "legacy-v75-command-lock",
        "verify-scientific-command-lock",
      ].includes(audit.id),
    )
    .every((audit) => audit.status === "ready");
  const hashReady = audits
    .filter((audit) =>
      ["migrated-fixture-hash-lock", "legacy-fixture-hash-lock"].includes(audit.id),
    )
    .every((audit) => audit.status === "ready");
  const budgetReady = audits.find((audit) => audit.id === "v75-budget-lock")?.status === "ready";
  const legacyReady =
    audits.find((audit) => audit.id === "legacy-v75-blocker-lock")?.status === "ready";
  const docsReady = audits.find((audit) => audit.id === "docs-boundary-lock")?.status === "ready";
  return {
    ...V90_HORIZONS_PROVENANCE_FREEZE_ROW,
    status: ready ? "complete" : "blocked",
    fixtureHashStatus: hashReady ? "pass" : "fail",
    commandOwnershipStatus: commandReady ? "pass" : "fail",
    budgetLockStatus: budgetReady ? "pass" : "fail",
    legacyAuditStatus: legacyReady ? "expected-blocker-preserved" : "regressed",
    docsBoundaryStatus: docsReady ? "pass" : "fail",
    provenanceFreeze: "applied-offline-contract-only",
  };
}

function lock(
  id: AtlasHorizonsProvenanceFreezeLockAudit["id"],
  label: string,
  ready: boolean,
  measured: string,
  expected: string,
  trustedBoundary: string,
): AtlasHorizonsProvenanceFreezeLockAudit {
  return {
    id,
    label,
    status: ready ? "ready" : "regressed",
    measured,
    expected,
    trustedBoundary,
  };
}

export function v90HorizonsProvenanceFreezeCommandContract(): Readonly<{
  defaultScientificCommand: typeof V87_STRICT_SCIENTIFIC_GATE_COMMAND;
  legacyV75Command: typeof V89_LEGACY_V75_STRICT_HORIZONS_COMMAND;
  migratedFixturePath: typeof V87_CANDIDATE_FIXTURE_PATH;
  legacyFixturePath: typeof V87_CURRENT_STRICT_FIXTURE_PATH;
  migratedFixtureSha256: typeof V90_MIGRATED_FIXTURE_SHA256;
  legacyFixtureSha256: typeof V90_LEGACY_V75_FIXTURE_SHA256;
}> {
  return {
    defaultScientificCommand: V87_STRICT_SCIENTIFIC_GATE_COMMAND,
    legacyV75Command: V89_LEGACY_V75_STRICT_HORIZONS_COMMAND,
    migratedFixturePath: V87_CANDIDATE_FIXTURE_PATH,
    legacyFixturePath: V87_CURRENT_STRICT_FIXTURE_PATH,
    migratedFixtureSha256: V90_MIGRATED_FIXTURE_SHA256,
    legacyFixtureSha256: V90_LEGACY_V75_FIXTURE_SHA256,
  };
}
