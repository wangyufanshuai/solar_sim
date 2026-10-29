import { createAtlasOfflineRuntimeBoundaryAuditSummary } from "./atlasOfflineRuntimeBoundaryAudit";
import { runAtlasOfflineRuntimeBoundaryAudit } from "./atlasOfflineRuntimeBoundaryAuditRunner";
import {
  V87_CANDIDATE_FIXTURE_PATH,
  V87_CURRENT_STRICT_FIXTURE_PATH,
  V87_STRICT_SCIENTIFIC_GATE_COMMAND,
} from "./atlasStrictHorizonsMigrationDryRun";
import { V89_LEGACY_V75_STRICT_HORIZONS_COMMAND } from "./atlasDefaultStrictHorizonsMigration";
import {
  V92_SCIENTIFIC_GATE_MAINTENANCE_RUNBOOK_ROW,
} from "./atlasScientificGateMaintenanceRunbook";
import type {
  AtlasScientificGateMaintenanceRunbookAudit,
  AtlasScientificGateMaintenanceRunbookRow,
  HorizonsValidationDataset,
} from "./simulationDiagnosticsTypes";

export async function runAtlasScientificGateMaintenanceRunbookAudit(args: {
  baselineDataset: HorizonsValidationDataset;
  v82HierarchyDataset?: HorizonsValidationDataset | null;
  v84OuterSystemDataset?: HorizonsValidationDataset | null;
  packageScripts?: Readonly<Record<string, string>>;
  docsText?: string;
  surfaceText?: string;
}): Promise<{
  audits: readonly AtlasScientificGateMaintenanceRunbookAudit[];
  rows: readonly AtlasScientificGateMaintenanceRunbookRow[];
}> {
  const v91Audit = await runAtlasOfflineRuntimeBoundaryAudit({
    baselineDataset: args.baselineDataset,
    v82HierarchyDataset: args.v82HierarchyDataset,
    v84OuterSystemDataset: args.v84OuterSystemDataset,
    packageScripts: args.packageScripts,
    docsText: args.docsText,
    surfaceText: args.surfaceText,
  });
  const v91Summary = createAtlasOfflineRuntimeBoundaryAuditSummary(v91Audit);
  const v90Lock = v91Summary.lockAudits.find(
    (audit) => audit.id === "v90-provenance-freeze-lock",
  );
  const audits = [
    v91BoundaryLock(v91Summary.status, v91Summary.classification),
    v90ProvenanceFreezeLock(v90Lock?.status ?? "missing", v90Lock?.measured ?? "missing"),
    commandOwnershipLock(args.packageScripts),
    rollbackContractLock(args.docsText ?? "", args.surfaceText ?? ""),
    docsRunbookLock(args.docsText ?? ""),
    browserSurfaceLock(args.surfaceText ?? ""),
    protectedMutationLock(args.surfaceText ?? ""),
  ] as const satisfies readonly AtlasScientificGateMaintenanceRunbookAudit[];

  return {
    audits,
    rows: [runbookRow(audits)],
  };
}

function v91BoundaryLock(
  status: string,
  classification: string,
): AtlasScientificGateMaintenanceRunbookAudit {
  const ready = status === "ready-boundary-locked" && classification === "offline-runtime-boundary-pass";
  return audit(
    "v91-offline-runtime-boundary-lock",
    "v91 offline/runtime boundary remains ready",
    ready,
    `${status}; ${classification}`,
    "ready-boundary-locked; offline-runtime-boundary-pass",
    "v92 can pass only while v91 keeps offline strict gate claims separate from live runtime physics.",
  );
}

function v90ProvenanceFreezeLock(
  status: string,
  measured: string,
): AtlasScientificGateMaintenanceRunbookAudit {
  return audit(
    "v90-provenance-freeze-lock",
    "v90 provenance freeze remains ready",
    status === "ready",
    measured,
    "ready-freeze-locked; freeze-lock-pass",
    "v92 can pass only while v90 fixture hash, command ownership and legacy blocker freeze remains ready.",
  );
}

function commandOwnershipLock(
  packageScripts: Readonly<Record<string, string>> | undefined,
): AtlasScientificGateMaintenanceRunbookAudit {
  const measured = [
    packageScripts?.["verify:atlas:full"] ?? "missing",
    packageScripts?.["verify:atlas:scientific"] ?? "missing",
    packageScripts?.["test:atlas:horizons-scientific-gate"] ?? "missing",
    packageScripts?.["test:atlas:horizons-scientific-gate:legacy-v75"] ?? "missing",
    packageScripts?.["test:atlas:horizons-provenance-freeze"] ?? "missing",
    packageScripts?.["test:atlas:offline-runtime-boundary"] ?? "missing",
    packageScripts?.["test:atlas:scientific-gate-runbook"] ?? "missing",
  ].join(" | ");
  const expected = [
    "npm run verify:atlas && npm run test:atlas:browser:fresh",
    "npm run verify:atlas && npm run test:atlas:horizons-scientific-gate && npm run test:atlas:browser:fresh",
    "vitest run app/lib/atlasPhysicsBenchmarkGate.horizons.test.ts",
    "vitest run app/lib/atlasPhysicsBenchmarkGate.legacy-v75.horizons.test.ts",
    "vitest run app/lib/atlasHorizonsProvenanceFreeze.horizons.test.ts",
    "vitest run app/lib/atlasOfflineRuntimeBoundaryAudit.horizons.test.ts",
    "vitest run app/lib/atlasScientificGateMaintenanceRunbook.horizons.test.ts",
  ].join(" | ");
  return audit(
    "command-ownership-lock",
    "scientific gate maintenance command ownership",
    measured === expected,
    measured,
    expected,
    "Runbook command ownership must keep product, scientific, migrated strict, legacy audit, freeze, boundary and runbook checks separate.",
  );
}

function rollbackContractLock(
  docsText: string,
  surfaceText: string,
): AtlasScientificGateMaintenanceRunbookAudit {
  const combined = `${docsText}\n${surfaceText}`;
  const ready =
    combined.includes("legacy v75 command remains rollback/blocker evidence only") &&
    combined.includes("requires an intentional future migration/audit") &&
    combined.includes("not silent script drift") &&
    combined.includes("migrated-scientific-gate-passes-legacy-v75-is-rollback-audit-only");
  return audit(
    "rollback-contract-lock",
    "legacy v75 rollback audit contract",
    ready,
    ready ? "rollback runbook contract present" : "rollback runbook contract missing",
    "rollback runbook contract present",
    "Rollback or default-gate reconfiguration must be an explicit future migration/audit, not silent script drift.",
  );
}

function docsRunbookLock(docsText: string): AtlasScientificGateMaintenanceRunbookAudit {
  const ready =
    docsText.includes("v92 Scientific Gate maintenance runbook") &&
    docsText.includes("not a new scientific model") &&
    docsText.includes("not a NASA/JPL certification") &&
    docsText.includes("live runtime physics remains unchanged");
  return audit(
    "docs-runbook-lock",
    "scientific gate runbook docs",
    ready,
    ready ? "v92 docs runbook present" : "v92 docs runbook missing",
    "v92 docs runbook present",
    "Documentation must present v92 as a maintenance command runbook, not a scientific model or certification upgrade.",
  );
}

function browserSurfaceLock(surfaceText: string): AtlasScientificGateMaintenanceRunbookAudit {
  const ready =
    surfaceText.includes("data-atlas-scientific-gate-maintenance-runbook-version") &&
    surfaceText.includes("data-atlas-scientific-gate-maintenance-runbook-strip") &&
    surfaceText.includes("data-atlas-scientific-gate-maintenance-runbook-table") &&
    surfaceText.includes("scientific-gate-maintenance-runbook");
  return audit(
    "browser-surface-lock",
    "root DOM and Observable Atlas runbook surface",
    ready,
    ready ? "v92 browser surface present" : "v92 browser surface missing",
    "v92 browser surface present",
    "The rendered contract must expose v92 root and Observable Atlas markers for browser acceptance.",
  );
}

function protectedMutationLock(surfaceText: string): AtlasScientificGateMaintenanceRunbookAudit {
  const required = [
    "defaultGateConfigMutation: \"not-applied\"",
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
    "protected runbook mutation flags",
    ready,
    ready ? "all protected runbook mutation flags not-applied" : "protected runbook mutation flag missing",
    "all protected runbook mutation flags not-applied",
    "The v92 contract must keep every protected runtime, asset, fixture, budget and certification mutation flag not-applied.",
  );
}

function runbookRow(
  audits: readonly AtlasScientificGateMaintenanceRunbookAudit[],
): AtlasScientificGateMaintenanceRunbookRow {
  const statusFor = (ids: readonly AtlasScientificGateMaintenanceRunbookAudit["id"][]) =>
    audits.filter((auditItem) => ids.includes(auditItem.id)).every((auditItem) => auditItem.status === "ready")
      ? "pass"
      : "fail";
  const ready = audits.every((auditItem) => auditItem.status === "ready");
  return {
    ...V92_SCIENTIFIC_GATE_MAINTENANCE_RUNBOOK_ROW,
    productFullCommand: "npm run verify:atlas:full",
    currentScientificCommand: "npm run verify:atlas:scientific",
    migratedStrictGateCommand: V87_STRICT_SCIENTIFIC_GATE_COMMAND,
    legacyV75AuditCommand: V89_LEGACY_V75_STRICT_HORIZONS_COMMAND,
    status: ready ? "complete" : "blocked",
    commandOwnershipStatus: statusFor(["command-ownership-lock"]),
    provenanceFreezeStatus: statusFor(["v90-provenance-freeze-lock"]),
    offlineRuntimeBoundaryStatus: statusFor(["v91-offline-runtime-boundary-lock"]),
    rollbackContractStatus: statusFor(["rollback-contract-lock"]),
    docsRunbookStatus: statusFor(["docs-runbook-lock"]),
    browserSurfaceStatus: statusFor(["browser-surface-lock"]),
    protectedMutationStatus: statusFor(["protected-mutation-lock"]),
    scientificGateMaintenanceRunbook: "applied-contract-only",
  };
}

function audit(
  id: AtlasScientificGateMaintenanceRunbookAudit["id"],
  label: string,
  ready: boolean,
  measured: string,
  expected: string,
  trustedBoundary: string,
): AtlasScientificGateMaintenanceRunbookAudit {
  return {
    id,
    label,
    status: ready ? "ready" : "regressed",
    measured,
    expected,
    trustedBoundary,
  };
}

export function v92ScientificGateMaintenanceRunbookCommandContract(): Readonly<{
  productFullCommand: "npm run verify:atlas:full";
  currentScientificCommand: "npm run verify:atlas:scientific";
  migratedStrictGateCommand: typeof V87_STRICT_SCIENTIFIC_GATE_COMMAND;
  legacyV75AuditCommand: typeof V89_LEGACY_V75_STRICT_HORIZONS_COMMAND;
  provenanceFreezeCommand: "npm run test:atlas:horizons-provenance-freeze";
  offlineRuntimeBoundaryCommand: "npm run test:atlas:offline-runtime-boundary";
  migratedDefaultFixturePath: typeof V87_CANDIDATE_FIXTURE_PATH;
  legacyV75FixturePath: typeof V87_CURRENT_STRICT_FIXTURE_PATH;
}> {
  return {
    productFullCommand: "npm run verify:atlas:full",
    currentScientificCommand: "npm run verify:atlas:scientific",
    migratedStrictGateCommand: V87_STRICT_SCIENTIFIC_GATE_COMMAND,
    legacyV75AuditCommand: V89_LEGACY_V75_STRICT_HORIZONS_COMMAND,
    provenanceFreezeCommand: "npm run test:atlas:horizons-provenance-freeze",
    offlineRuntimeBoundaryCommand: "npm run test:atlas:offline-runtime-boundary",
    migratedDefaultFixturePath: V87_CANDIDATE_FIXTURE_PATH,
    legacyV75FixturePath: V87_CURRENT_STRICT_FIXTURE_PATH,
  };
}
