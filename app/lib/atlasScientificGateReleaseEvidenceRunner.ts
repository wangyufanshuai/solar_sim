import { createAtlasScientificGateMaintenanceRunbookSummary } from "./atlasScientificGateMaintenanceRunbook";
import {
  runAtlasScientificGateMaintenanceRunbookAudit,
} from "./atlasScientificGateMaintenanceRunbookRunner";
import {
  V90_HORIZONS_PROVENANCE_FREEZE_ROW,
  V90_LEGACY_V75_FIXTURE_SHA256,
  V90_MIGRATED_FIXTURE_SHA256,
} from "./atlasHorizonsProvenanceFreeze";
import {
  V87_CANDIDATE_FIXTURE_PATH,
  V87_CURRENT_STRICT_FIXTURE_PATH,
  V87_STRICT_SCIENTIFIC_GATE_COMMAND,
} from "./atlasStrictHorizonsMigrationDryRun";
import { V89_LEGACY_V75_STRICT_HORIZONS_COMMAND } from "./atlasDefaultStrictHorizonsMigration";
import {
  V93_SCIENTIFIC_GATE_RELEASE_EVIDENCE_ROW,
} from "./atlasScientificGateReleaseEvidence";
import type {
  AtlasScientificGateReleaseEvidenceAudit,
  AtlasScientificGateReleaseEvidenceRow,
  HorizonsValidationDataset,
} from "./simulationDiagnosticsTypes";

type FixtureEvidenceAudit = {
  path: string;
  sha256: string;
  sizeBytes: number;
};

export async function runAtlasScientificGateReleaseEvidenceAudit(args: {
  baselineDataset: HorizonsValidationDataset;
  v82HierarchyDataset?: HorizonsValidationDataset | null;
  v84OuterSystemDataset?: HorizonsValidationDataset | null;
  packageScripts?: Readonly<Record<string, string>>;
  migratedFixtureAudit?: FixtureEvidenceAudit;
  legacyFixtureAudit?: FixtureEvidenceAudit;
  docsText?: string;
  surfaceText?: string;
}): Promise<{
  audits: readonly AtlasScientificGateReleaseEvidenceAudit[];
  rows: readonly AtlasScientificGateReleaseEvidenceRow[];
}> {
  const v92Audit = await runAtlasScientificGateMaintenanceRunbookAudit({
    baselineDataset: args.baselineDataset,
    v82HierarchyDataset: args.v82HierarchyDataset,
    v84OuterSystemDataset: args.v84OuterSystemDataset,
    packageScripts: args.packageScripts,
    docsText: args.docsText,
    surfaceText: args.surfaceText,
  });
  const v92Summary = createAtlasScientificGateMaintenanceRunbookSummary(v92Audit);
  const v91Lock = v92Summary.audits.find(
    (audit) => audit.id === "v91-offline-runtime-boundary-lock",
  );
  const v90Lock = v92Summary.audits.find(
    (audit) => audit.id === "v90-provenance-freeze-lock",
  );
  const audits = [
    v92RunbookLock(v92Summary.status, v92Summary.classification),
    v91BoundaryLock(v91Lock?.status ?? "missing", v91Lock?.measured ?? "missing"),
    v90ProvenanceFreezeLock(v90Lock?.status ?? "missing", v90Lock?.measured ?? "missing"),
    commandEvidenceMatrixLock(args.packageScripts),
    fixtureEvidenceLock(
      args.migratedFixtureAudit,
      args.legacyFixtureAudit,
      args.v84OuterSystemDataset,
    ),
    docsEvidenceLock(args.docsText ?? ""),
    browserEvidenceLock(args.surfaceText ?? ""),
    protectedMutationLock(args.surfaceText ?? ""),
  ] as const satisfies readonly AtlasScientificGateReleaseEvidenceAudit[];

  return {
    audits,
    rows: [releaseEvidenceRow(audits)],
  };
}

function v92RunbookLock(
  status: string,
  classification: string,
): AtlasScientificGateReleaseEvidenceAudit {
  const ready = status === "ready-runbook-locked" && classification === "maintenance-runbook-pass";
  return audit(
    "v92-runbook-lock",
    "v92 maintenance runbook remains ready",
    ready,
    `${status}; ${classification}`,
    "ready-runbook-locked; maintenance-runbook-pass",
    "v93 can pass only while the v92 maintenance runbook command and rollback contract remains ready.",
  );
}

function v91BoundaryLock(
  status: string,
  measured: string,
): AtlasScientificGateReleaseEvidenceAudit {
  return audit(
    "v91-offline-runtime-boundary-lock",
    "v91 offline/runtime boundary remains ready",
    status === "ready",
    measured,
    "ready-boundary-locked; offline-runtime-boundary-pass",
    "Release evidence must preserve the offline scientific gate versus live runtime physics boundary.",
  );
}

function v90ProvenanceFreezeLock(
  status: string,
  measured: string,
): AtlasScientificGateReleaseEvidenceAudit {
  return audit(
    "v90-provenance-freeze-lock",
    "v90 provenance freeze remains ready",
    status === "ready",
    measured,
    "ready-freeze-locked; freeze-lock-pass",
    "Release evidence must preserve the fixture hash, command and budget freeze.",
  );
}

function commandEvidenceMatrixLock(
  packageScripts: Readonly<Record<string, string>> | undefined,
): AtlasScientificGateReleaseEvidenceAudit {
  const measured = [
    packageScripts?.["verify:atlas:full"] ?? "missing",
    packageScripts?.["verify:atlas:scientific"] ?? "missing",
    packageScripts?.["test:atlas:horizons-scientific-gate"] ?? "missing",
    packageScripts?.["test:atlas:horizons-scientific-gate:legacy-v75"] ?? "missing",
    packageScripts?.["test:atlas:horizons-provenance-freeze"] ?? "missing",
    packageScripts?.["test:atlas:offline-runtime-boundary"] ?? "missing",
    packageScripts?.["test:atlas:scientific-gate-runbook"] ?? "missing",
    packageScripts?.["test:atlas:scientific-gate-release-evidence"] ?? "missing",
  ].join(" | ");
  const expected = [
    "npm run verify:atlas && npm run test:atlas:browser:fresh",
    "npm run verify:atlas && npm run test:atlas:horizons-scientific-gate && npm run test:atlas:browser:fresh",
    "vitest run app/lib/atlasPhysicsBenchmarkGate.horizons.test.ts",
    "vitest run app/lib/atlasPhysicsBenchmarkGate.legacy-v75.horizons.test.ts",
    "vitest run app/lib/atlasHorizonsProvenanceFreeze.horizons.test.ts",
    "vitest run app/lib/atlasOfflineRuntimeBoundaryAudit.horizons.test.ts",
    "vitest run app/lib/atlasScientificGateMaintenanceRunbook.horizons.test.ts",
    "vitest run app/lib/atlasScientificGateReleaseEvidence.horizons.test.ts",
  ].join(" | ");
  return audit(
    "command-evidence-matrix-lock",
    "release evidence command matrix ownership",
    measured === expected,
    measured,
    expected,
    "Release evidence must keep product, scientific, migrated strict, legacy audit, freeze, boundary, runbook and v93 evidence checks separate.",
  );
}

function fixtureEvidenceLock(
  migratedFixtureAudit: FixtureEvidenceAudit | undefined,
  legacyFixtureAudit: FixtureEvidenceAudit | undefined,
  v84OuterSystemDataset: HorizonsValidationDataset | null | undefined,
): AtlasScientificGateReleaseEvidenceAudit {
  const ready =
    migratedFixtureAudit?.path === V87_CANDIDATE_FIXTURE_PATH &&
    migratedFixtureAudit.sha256 === V90_MIGRATED_FIXTURE_SHA256 &&
    migratedFixtureAudit.sizeBytes === 21863 &&
    legacyFixtureAudit?.path === V87_CURRENT_STRICT_FIXTURE_PATH &&
    legacyFixtureAudit.sha256 === V90_LEGACY_V75_FIXTURE_SHA256 &&
    legacyFixtureAudit.sizeBytes === 14678 &&
    v84OuterSystemDataset?.variant === "v84-outer-system-barycenter-reference" &&
    (v84OuterSystemDataset.targetProvenance?.length ?? 0) === 12;
  return audit(
    "fixture-evidence-lock",
    "v90 fixture hash and provenance evidence",
    ready,
    [
      `${migratedFixtureAudit?.path ?? "missing"}; ${migratedFixtureAudit?.sha256 ?? "missing"}; ${migratedFixtureAudit?.sizeBytes ?? 0}`,
      `${legacyFixtureAudit?.path ?? "missing"}; ${legacyFixtureAudit?.sha256 ?? "missing"}; ${legacyFixtureAudit?.sizeBytes ?? 0}`,
      `variant ${v84OuterSystemDataset?.variant ?? "missing"}; provenance ${v84OuterSystemDataset?.targetProvenance?.length ?? 0}`,
    ].join(" | "),
    [
      `${V87_CANDIDATE_FIXTURE_PATH}; ${V90_MIGRATED_FIXTURE_SHA256}; 21863`,
      `${V87_CURRENT_STRICT_FIXTURE_PATH}; ${V90_LEGACY_V75_FIXTURE_SHA256}; 14678`,
      "variant v84-outer-system-barycenter-reference; provenance 12",
    ].join(" | "),
    "The release evidence bundle records the exact migrated and legacy fixture evidence frozen by v90.",
  );
}

function docsEvidenceLock(docsText: string): AtlasScientificGateReleaseEvidenceAudit {
  const ready =
    docsText.includes("v93 Scientific Gate release evidence") &&
    docsText.includes("release evidence bundle lock") &&
    docsText.includes("not a new scientific model") &&
    docsText.includes("not a NASA/JPL certification") &&
    docsText.includes("live runtime physics remains unchanged") &&
    docsText.includes("legacy v75 command remains rollback/blocker evidence only");
  return audit(
    "docs-evidence-lock",
    "v93 release evidence documentation",
    ready,
    ready ? "v93 release evidence docs present" : "v93 release evidence docs missing",
    "v93 release evidence docs present",
    "Documentation must present v93 as a release evidence lock, not a scientific model or certification upgrade.",
  );
}

function browserEvidenceLock(surfaceText: string): AtlasScientificGateReleaseEvidenceAudit {
  const ready =
    surfaceText.includes("data-atlas-scientific-gate-release-evidence-version") &&
    surfaceText.includes("data-atlas-scientific-gate-release-evidence-strip") &&
    surfaceText.includes("data-atlas-scientific-gate-release-evidence-table") &&
    surfaceText.includes("scientific-gate-release-evidence") &&
    surfaceText.includes("v93-scientific-gate-release-evidence-lock");
  return audit(
    "browser-evidence-lock",
    "root DOM, Observable, Evidence and Validation release evidence surface",
    ready,
    ready ? "v93 browser evidence surface present" : "v93 browser evidence surface missing",
    "v93 browser evidence surface present",
    "The rendered contract must expose v93 root, Observable Atlas, Evidence Ledger and Validation markers for browser acceptance.",
  );
}

function protectedMutationLock(surfaceText: string): AtlasScientificGateReleaseEvidenceAudit {
  const required = [
    "defaultGateConfigMutation: \"not-applied\"",
    "legacyAuditConfigMutation: \"not-applied\"",
    "livePhysicsMutation: \"not-applied\"",
    "workerPhysicsMutation: \"not-applied\"",
    "rk4DefaultMutation: \"not-applied\"",
    "eihOnePnMutation: \"not-applied\"",
    "kerrKernelMutation: \"not-applied\"",
    "skyAssetMutation: \"not-applied\"",
    "backgroundMutation: \"not-applied\"",
    "materialMutation: \"not-applied\"",
    "fixtureDataMutation: \"not-applied\"",
    "budgetMutation: \"not-applied\"",
    "certificationClaimMutation: \"not-applied\"",
  ];
  const ready = required.every((token) => surfaceText.includes(token));
  return audit(
    "protected-mutation-lock",
    "protected release evidence mutation flags",
    ready,
    ready ? "all protected release evidence mutation flags not-applied" : "protected release evidence mutation flag missing",
    "all protected release evidence mutation flags not-applied",
    "The v93 contract must keep every protected runtime, asset, fixture, budget and certification mutation flag not-applied.",
  );
}

function releaseEvidenceRow(
  audits: readonly AtlasScientificGateReleaseEvidenceAudit[],
): AtlasScientificGateReleaseEvidenceRow {
  const statusFor = (ids: readonly AtlasScientificGateReleaseEvidenceAudit["id"][]) =>
    audits.filter((auditItem) => ids.includes(auditItem.id)).every((auditItem) => auditItem.status === "ready")
      ? "pass"
      : "fail";
  const ready = audits.every((auditItem) => auditItem.status === "ready");
  return {
    ...V93_SCIENTIFIC_GATE_RELEASE_EVIDENCE_ROW,
    status: ready ? "complete" : "blocked",
    runbookStatus: statusFor(["v92-runbook-lock"]),
    provenanceFreezeStatus: statusFor(["v90-provenance-freeze-lock"]),
    offlineRuntimeBoundaryStatus: statusFor(["v91-offline-runtime-boundary-lock"]),
    commandMatrixStatus: statusFor(["command-evidence-matrix-lock"]),
    fixtureEvidenceStatus: statusFor(["fixture-evidence-lock"]),
    docsEvidenceStatus: statusFor(["docs-evidence-lock"]),
    browserEvidenceStatus: statusFor(["browser-evidence-lock"]),
    protectedMutationStatus: statusFor(["protected-mutation-lock"]),
    scientificGateReleaseEvidence: "applied-contract-only",
  };
}

function audit(
  id: AtlasScientificGateReleaseEvidenceAudit["id"],
  label: string,
  ready: boolean,
  measured: string,
  expected: string,
  trustedBoundary: string,
): AtlasScientificGateReleaseEvidenceAudit {
  return {
    id,
    label,
    status: ready ? "ready" : "regressed",
    measured,
    expected,
    trustedBoundary,
  };
}

export function v93ScientificGateReleaseEvidenceCommandContract(): Readonly<{
  productFullCommand: "npm run verify:atlas:full";
  scientificVerifyCommand: "npm run verify:atlas:scientific";
  maintenanceRunbookCommand: "npm run test:atlas:scientific-gate-runbook";
  provenanceFreezeCommand: "npm run test:atlas:horizons-provenance-freeze";
  offlineRuntimeBoundaryCommand: "npm run test:atlas:offline-runtime-boundary";
  migratedStrictGateCommand: typeof V87_STRICT_SCIENTIFIC_GATE_COMMAND;
  legacyV75AuditCommand: typeof V89_LEGACY_V75_STRICT_HORIZONS_COMMAND;
  migratedDefaultFixturePath: typeof V87_CANDIDATE_FIXTURE_PATH;
  legacyV75FixturePath: typeof V87_CURRENT_STRICT_FIXTURE_PATH;
  migratedFixtureSha256: typeof V90_MIGRATED_FIXTURE_SHA256;
  legacyFixtureSha256: typeof V90_LEGACY_V75_FIXTURE_SHA256;
}> {
  return {
    productFullCommand: "npm run verify:atlas:full",
    scientificVerifyCommand: "npm run verify:atlas:scientific",
    maintenanceRunbookCommand: "npm run test:atlas:scientific-gate-runbook",
    provenanceFreezeCommand: "npm run test:atlas:horizons-provenance-freeze",
    offlineRuntimeBoundaryCommand: "npm run test:atlas:offline-runtime-boundary",
    migratedStrictGateCommand: V87_STRICT_SCIENTIFIC_GATE_COMMAND,
    legacyV75AuditCommand: V89_LEGACY_V75_STRICT_HORIZONS_COMMAND,
    migratedDefaultFixturePath: V87_CANDIDATE_FIXTURE_PATH,
    legacyV75FixturePath: V87_CURRENT_STRICT_FIXTURE_PATH,
    migratedFixtureSha256: V90_MIGRATED_FIXTURE_SHA256,
    legacyFixtureSha256: V90_LEGACY_V75_FIXTURE_SHA256,
  };
}
