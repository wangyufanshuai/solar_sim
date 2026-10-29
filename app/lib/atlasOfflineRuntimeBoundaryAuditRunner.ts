import {
  createAtlasHorizonsProvenanceFreezeSummary,
} from "./atlasHorizonsProvenanceFreeze";
import {
  readAtlasHorizonsFixtureFileAudit,
  runAtlasHorizonsProvenanceFreezeAudit,
} from "./atlasHorizonsProvenanceFreezeRunner";
import {
  V87_CANDIDATE_FIXTURE_PATH,
  V87_CURRENT_STRICT_FIXTURE_PATH,
  V87_STRICT_SCIENTIFIC_GATE_COMMAND,
} from "./atlasStrictHorizonsMigrationDryRun";
import {
  V89_LEGACY_V75_STRICT_HORIZONS_COMMAND,
} from "./atlasDefaultStrictHorizonsMigration";
import {
  V91_OFFLINE_RUNTIME_BOUNDARY_AUDIT_ROW,
} from "./atlasOfflineRuntimeBoundaryAudit";
import type {
  AtlasOfflineRuntimeBoundaryAuditLockAudit,
  AtlasOfflineRuntimeBoundaryAuditRow,
  HorizonsValidationDataset,
} from "./simulationDiagnosticsTypes";

export async function runAtlasOfflineRuntimeBoundaryAudit(args: {
  baselineDataset: HorizonsValidationDataset;
  v82HierarchyDataset?: HorizonsValidationDataset | null;
  v84OuterSystemDataset?: HorizonsValidationDataset | null;
  packageScripts?: Readonly<Record<string, string>>;
  docsText?: string;
  surfaceText?: string;
}): Promise<{
  lockAudits: readonly AtlasOfflineRuntimeBoundaryAuditLockAudit[];
  rows: readonly AtlasOfflineRuntimeBoundaryAuditRow[];
}> {
  const v90Audit = await runAtlasHorizonsProvenanceFreezeAudit({
    baselineDataset: args.baselineDataset,
    v82HierarchyDataset: args.v82HierarchyDataset,
    v84OuterSystemDataset: args.v84OuterSystemDataset,
    packageScripts: args.packageScripts,
    migratedFixtureAudit: readAtlasHorizonsFixtureFileAudit(V87_CANDIDATE_FIXTURE_PATH),
    legacyFixtureAudit: readAtlasHorizonsFixtureFileAudit(V87_CURRENT_STRICT_FIXTURE_PATH),
    docsText: args.docsText,
  });
  const v90Summary = createAtlasHorizonsProvenanceFreezeSummary(v90Audit);
  const lockAudits = [
    v90FreezeLock(v90Summary.status, v90Summary.classification),
    commandOwnershipLock(args.packageScripts),
    docsBoundaryLock(args.docsText ?? ""),
    browserSurfaceLock(args.surfaceText ?? ""),
    runtimeClaimLock(args.docsText ?? "", args.surfaceText ?? ""),
    scientificCertificationClaimLock(args.docsText ?? "", args.surfaceText ?? ""),
    protectedMutationLock(args.surfaceText ?? ""),
  ] as const satisfies readonly AtlasOfflineRuntimeBoundaryAuditLockAudit[];

  return {
    lockAudits,
    rows: [boundaryRow(lockAudits)],
  };
}

function v90FreezeLock(status: string, classification: string): AtlasOfflineRuntimeBoundaryAuditLockAudit {
  const ready = status === "ready-freeze-locked" && classification === "freeze-lock-pass";
  return lock(
    "v90-provenance-freeze-lock",
    "v90 provenance freeze remains ready",
    ready,
    `${status}; ${classification}`,
    "ready-freeze-locked; freeze-lock-pass",
    "v91 can pass only while v90 fixture hash, command ownership and legacy blocker freeze remains ready.",
  );
}

function commandOwnershipLock(
  packageScripts: Readonly<Record<string, string>> | undefined,
): AtlasOfflineRuntimeBoundaryAuditLockAudit {
  const measured = [
    packageScripts?.["test:atlas:horizons-scientific-gate"] ?? "missing",
    packageScripts?.["test:atlas:horizons-scientific-gate:legacy-v75"] ?? "missing",
    packageScripts?.["test:atlas:horizons-provenance-freeze"] ?? "missing",
    packageScripts?.["verify:atlas:scientific"] ?? "missing",
  ].join(" | ");
  const expected = [
    "vitest run app/lib/atlasPhysicsBenchmarkGate.horizons.test.ts",
    "vitest run app/lib/atlasPhysicsBenchmarkGate.legacy-v75.horizons.test.ts",
    "vitest run app/lib/atlasHorizonsProvenanceFreeze.horizons.test.ts",
    "npm run verify:atlas && npm run test:atlas:horizons-scientific-gate && npm run test:atlas:browser:fresh",
  ].join(" | ");
  return lock(
    "command-ownership-lock",
    "offline scientific command ownership",
    measured === expected,
    measured,
    expected,
    "Command ownership must keep default, legacy, freeze and verify scientific paths separate and explicit.",
  );
}

function docsBoundaryLock(docsText: string): AtlasOfflineRuntimeBoundaryAuditLockAudit {
  const ready =
    docsText.includes("v91 Offline-vs-runtime boundary audit") &&
    docsText.includes("not a physics migration") &&
    docsText.includes("not a NASA/JPL certification") &&
    docsText.includes("live runtime physics remains unchanged");
  return lock(
    "docs-boundary-lock",
    "offline/runtime docs boundary",
    ready,
    ready ? "v91 docs boundary present" : "v91 docs boundary missing",
    "v91 docs boundary present",
    "Documentation must keep offline scientific gate migration separate from runtime physics and certification claims.",
  );
}

function browserSurfaceLock(surfaceText: string): AtlasOfflineRuntimeBoundaryAuditLockAudit {
  const ready =
    surfaceText.includes("data-atlas-offline-runtime-boundary-audit-version") &&
    surfaceText.includes("data-atlas-offline-runtime-boundary-audit-strip") &&
    surfaceText.includes("data-atlas-offline-runtime-boundary-audit-table") &&
    surfaceText.includes("offline-runtime-boundary-audit");
  return lock(
    "browser-surface-lock",
    "root DOM and Observable Atlas boundary surface",
    ready,
    ready ? "v91 browser surface present" : "v91 browser surface missing",
    "v91 browser surface present",
    "The rendered contract must expose v91 root and Observable Atlas markers for browser acceptance.",
  );
}

function runtimeClaimLock(docsText: string, surfaceText: string): AtlasOfflineRuntimeBoundaryAuditLockAudit {
  const combined = `${docsText}\n${surfaceText}`;
  const ready =
    combined.includes("offline strict Horizons scientific gate") &&
    combined.includes("live runtime physics") &&
    combined.includes("not-applied") &&
    !combined.includes("live physics migration applied");
  return lock(
    "runtime-claim-lock",
    "runtime claim boundary",
    ready,
    ready ? "runtime claims clean" : "runtime claim regression",
    "runtime claims clean",
    "Claims must describe offline gate status without implying live physics migration.",
  );
}

function scientificCertificationClaimLock(
  docsText: string,
  surfaceText: string,
): AtlasOfflineRuntimeBoundaryAuditLockAudit {
  const combined = `${docsText}\n${surfaceText}`;
  const ready =
    combined.includes("not a NASA/JPL certification") &&
    combined.includes("offline-gate-frozen-not-nasa-jpl-certified") &&
    !combined.includes("NASA/JPL certified");
  return lock(
    "scientific-certification-claim-lock",
    "scientific certification claim boundary",
    ready,
    ready ? "certification claims clean" : "certification claim regression",
    "certification claims clean",
    "Claims must not present the offline scientific gate as NASA/JPL certification.",
  );
}

function protectedMutationLock(surfaceText: string): AtlasOfflineRuntimeBoundaryAuditLockAudit {
  const required = [
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
  ];
  const ready = required.every((token) => surfaceText.includes(token));
  return lock(
    "protected-mutation-lock",
    "protected mutation flags",
    ready,
    ready ? "all protected mutation flags not-applied" : "protected mutation flag missing",
    "all protected mutation flags not-applied",
    "The v91 contract must keep every protected runtime and asset mutation flag not-applied.",
  );
}

function boundaryRow(
  audits: readonly AtlasOfflineRuntimeBoundaryAuditLockAudit[],
): AtlasOfflineRuntimeBoundaryAuditRow {
  const statusFor = (ids: readonly AtlasOfflineRuntimeBoundaryAuditLockAudit["id"][]) =>
    audits.filter((audit) => ids.includes(audit.id)).every((audit) => audit.status === "ready")
      ? "pass"
      : "fail";
  const ready = audits.every((audit) => audit.status === "ready");
  return {
    ...V91_OFFLINE_RUNTIME_BOUNDARY_AUDIT_ROW,
    defaultScientificCommand: V87_STRICT_SCIENTIFIC_GATE_COMMAND,
    legacyV75Command: V89_LEGACY_V75_STRICT_HORIZONS_COMMAND,
    status: ready ? "complete" : "blocked",
    commandBoundaryStatus: statusFor(["command-ownership-lock"]),
    docsBoundaryStatus: statusFor(["docs-boundary-lock"]),
    browserSurfaceStatus: statusFor(["browser-surface-lock"]),
    runtimeClaimStatus: statusFor(["runtime-claim-lock"]),
    scientificCertificationClaimStatus: statusFor(["scientific-certification-claim-lock"]),
    protectedMutationStatus: statusFor(["protected-mutation-lock"]),
    offlineRuntimeBoundaryAudit: "applied-contract-only",
  };
}

function lock(
  id: AtlasOfflineRuntimeBoundaryAuditLockAudit["id"],
  label: string,
  ready: boolean,
  measured: string,
  expected: string,
  trustedBoundary: string,
): AtlasOfflineRuntimeBoundaryAuditLockAudit {
  return {
    id,
    label,
    status: ready ? "ready" : "regressed",
    measured,
    expected,
    trustedBoundary,
  };
}

export function v91OfflineRuntimeBoundaryCommandContract(): Readonly<{
  defaultScientificCommand: typeof V87_STRICT_SCIENTIFIC_GATE_COMMAND;
  legacyV75Command: typeof V89_LEGACY_V75_STRICT_HORIZONS_COMMAND;
  provenanceFreezeCommand: "npm run test:atlas:horizons-provenance-freeze";
}> {
  return {
    defaultScientificCommand: V87_STRICT_SCIENTIFIC_GATE_COMMAND,
    legacyV75Command: V89_LEGACY_V75_STRICT_HORIZONS_COMMAND,
    provenanceFreezeCommand: "npm run test:atlas:horizons-provenance-freeze",
  };
}
