import {
  ATLAS_RELATIVITY_SIMULATION_OPTIMIZATION_PROFILE,
  ATLAS_RELATIVITY_SIMULATION_OPTIMIZATION_VERSION,
  V98_RELATIVITY_SIMULATION_OPTIMIZATION_ROW,
} from "./atlasRelativitySimulationOptimization";
import { ATLAS_RELATIVITY_CHART_VERSION } from "./atlasRelativityCharts";
import {
  ATLAS_RELATIVITY_KERNEL_ID,
  ATLAS_RELATIVITY_VERIFICATION_VERSION,
} from "./atlasRelativityVerification";
import { KERR_RELATIVITY_STUDIO_VERSION } from "./kerrRelativityStudio";
import { RELATIVITY_GUIDED_TOUR_VERSION } from "./relativityGuidedTour";
import {
  RELATIVITY_OBSERVABLE_ATLAS_VERSION,
  RELATIVITY_OBSERVABLE_EXPLAINER_VERSION,
} from "./relativityObservableAtlas";
import type {
  AtlasRelativitySimulationOptimizationAudit,
  AtlasRelativitySimulationOptimizationRow,
} from "./simulationDiagnosticsTypes";

export function runAtlasRelativitySimulationOptimizationAudit(args: {
  packageScripts?: Readonly<Record<string, string>>;
  docsText?: string;
  surfaceText?: string;
  browserSpecText?: string;
} = {}): {
  audits: readonly AtlasRelativitySimulationOptimizationAudit[];
  rows: readonly AtlasRelativitySimulationOptimizationRow[];
} {
  const docsText = args.docsText ?? "";
  const surfaceText = args.surfaceText ?? "";
  const browserSpecText = args.browserSpecText ?? "";
  const combinedSurface = `${surfaceText}\n${browserSpecText}`;
  const audits = [
    observableAtlasLock(args.packageScripts, combinedSurface),
    kerrStudioLock(combinedSurface),
    weakFieldReadoutLock(surfaceText),
    performanceHudLock(combinedSurface),
    docsSurfaceLock(docsText, combinedSurface),
    protectedPhysicsLock(surfaceText),
  ] as const satisfies readonly AtlasRelativitySimulationOptimizationAudit[];

  return {
    audits,
    rows: [relativitySimulationOptimizationRow(audits)],
  };
}

function observableAtlasLock(
  packageScripts: Readonly<Record<string, string>> | undefined,
  surfaceText: string,
): AtlasRelativitySimulationOptimizationAudit {
  const ready =
    packageScripts?.["test:atlas:relativity-simulation-optimization"] ===
      "vitest run app/lib/atlasRelativitySimulationOptimization.horizons.test.ts" &&
    surfaceText.includes(RELATIVITY_OBSERVABLE_ATLAS_VERSION) &&
    surfaceText.includes(RELATIVITY_OBSERVABLE_EXPLAINER_VERSION) &&
    surfaceText.includes(RELATIVITY_GUIDED_TOUR_VERSION) &&
    surfaceText.includes(ATLAS_RELATIVITY_VERIFICATION_VERSION) &&
    surfaceText.includes(ATLAS_RELATIVITY_CHART_VERSION) &&
    surfaceText.includes("data-atlas-relativity-simulation-optimization-strip") &&
    surfaceText.includes("data-atlas-relativity-simulation-optimization-table");
  return audit(
    "observable-atlas-lock",
    "Relativity Observable Atlas teaching surface",
    ready,
    ready ? "v37/v39/v40/v73/v74 observable chain indexed" : "observable chain marker missing",
    "v37/v39/v40/v73/v74 observable chain indexed",
    "v98 must remain a teaching observability layer over existing Observable Atlas, explainer, tour, verification and chart summaries.",
  );
}

function kerrStudioLock(surfaceText: string): AtlasRelativitySimulationOptimizationAudit {
  const ready =
    surfaceText.includes(KERR_RELATIVITY_STUDIO_VERSION) &&
    surfaceText.includes(ATLAS_RELATIVITY_KERNEL_ID) &&
    surfaceText.includes("test-particle-null-geodesic-lab") &&
    surfaceText.includes("data-atlas-relativity-simulation-optimization-kerr-kernel");
  return audit(
    "kerr-studio-lock",
    "Kerr Studio teaching readout boundary",
    ready,
    ready ? "v35 Kerr Studio and kernel boundary indexed" : "Kerr Studio marker missing",
    "v35 Kerr Studio and kernel boundary indexed",
    "v98 may clarify Kerr Studio readouts, but must not change the Kerr kernel id or claim full numerical relativity.",
  );
}

function weakFieldReadoutLock(surfaceText: string): AtlasRelativitySimulationOptimizationAudit {
  const ready =
    surfaceText.includes("weakFieldObservableCount") &&
    surfaceText.includes("strongFieldReadoutCount") &&
    surfaceText.includes("numericalHealthMetricCount") &&
    surfaceText.includes("readyReadoutCount");
  return audit(
    "weak-field-readout-lock",
    "Weak-field, Kerr and numerical-health readout split",
    ready,
    ready ? "weak/Kerr/numerical readout split present" : "readout split missing",
    "weak/Kerr/numerical readout split present",
    "v98 readouts must explain existing weak-field and Kerr rows without converting numerical health into an astrophysical observable.",
  );
}

function performanceHudLock(surfaceText: string): AtlasRelativitySimulationOptimizationAudit {
  const ready =
    surfaceText.includes("optional-collapsed-read-only-main-canvas") &&
    surfaceText.includes("data-atlas-relativity-simulation-optimization-performance-hud-policy");
  return audit(
    "performance-hud-lock",
    "Optional read-only performance HUD policy",
    ready,
    ready ? "optional collapsed read-only HUD policy present" : "performance HUD policy missing",
    "optional collapsed read-only HUD policy present",
    "v98 keeps any main-canvas relativity HUD optional, read-only and non-obstructive.",
  );
}

function docsSurfaceLock(
  docsText: string,
  surfaceText: string,
): AtlasRelativitySimulationOptimizationAudit {
  const ready =
    docsText.includes("v98 Relativity Simulation Optimization") &&
    docsText.includes("teaching observability") &&
    docsText.includes("not a scientific model upgrade") &&
    docsText.includes("not full numerical relativity") &&
    surfaceText.includes("data-atlas-relativity-simulation-optimization-version") &&
    surfaceText.includes("relativity-simulation-optimization") &&
    surfaceText.includes(ATLAS_RELATIVITY_SIMULATION_OPTIMIZATION_VERSION) &&
    surfaceText.includes(ATLAS_RELATIVITY_SIMULATION_OPTIMIZATION_PROFILE);
  return audit(
    "docs-surface-lock",
    "v98 docs, root DOM, Observable, Evidence, Validation and browser surface",
    ready,
    ready ? "v98 docs and surface markers present" : "v98 docs or surface marker missing",
    "v98 docs and surface markers present",
    "Documentation and surfaces must state that v98 is a teaching observability layer, not a scientific model upgrade.",
  );
}

function protectedPhysicsLock(surfaceText: string): AtlasRelativitySimulationOptimizationAudit {
  const required = [
    "livePhysicsMutation: \"not-applied\"",
    "workerPhysicsMutation: \"not-applied\"",
    "rk4DefaultMutation: \"not-applied\"",
    "eihOnePnMutation: \"not-applied\"",
    "kerrKernelMutation: \"not-applied\"",
    "skyAssetMutation: \"not-applied\"",
    "backgroundMutation: \"not-applied\"",
    "fixtureDataMutation: \"not-applied\"",
    "budgetMutation: \"not-applied\"",
    "defaultGateConfigMutation: \"not-applied\"",
    "certificationClaimMutation: \"not-applied\"",
  ];
  const ready = required.every((token) => surfaceText.includes(token));
  return audit(
    "protected-physics-lock",
    "Protected relativity simulation mutation flags",
    ready,
    ready ? "all protected relativity mutation flags not-applied" : "protected relativity mutation flag missing",
    "all protected relativity mutation flags not-applied",
    "The v98 contract must keep physics, fixture, budget, sky, background and certification mutation flags not-applied.",
  );
}

function relativitySimulationOptimizationRow(
  audits: readonly AtlasRelativitySimulationOptimizationAudit[],
): AtlasRelativitySimulationOptimizationRow {
  const statusFor = (ids: readonly AtlasRelativitySimulationOptimizationAudit["id"][]) =>
    audits.filter((auditItem) => ids.includes(auditItem.id)).every((auditItem) => auditItem.status === "ready")
      ? "pass"
      : "fail";
  const ready = audits.every((auditItem) => auditItem.status === "ready");
  return {
    ...V98_RELATIVITY_SIMULATION_OPTIMIZATION_ROW,
    status: ready ? "complete" : "blocked",
    observableAtlasStatus: statusFor(["observable-atlas-lock"]),
    kerrStudioStatus: statusFor(["kerr-studio-lock"]),
    weakFieldReadoutStatus: statusFor(["weak-field-readout-lock"]),
    performanceHudStatus: statusFor(["performance-hud-lock"]),
    docsSurfaceStatus: statusFor(["docs-surface-lock"]),
    protectedPhysicsStatus: statusFor(["protected-physics-lock"]),
    relativitySimulationOptimization: "applied-teaching-observability-only",
  };
}

function audit(
  id: AtlasRelativitySimulationOptimizationAudit["id"],
  label: string,
  ready: boolean,
  measured: string,
  expected: string,
  trustedBoundary: string,
): AtlasRelativitySimulationOptimizationAudit {
  return {
    id,
    label,
    status: ready ? "ready" : "regressed",
    measured,
    expected,
    trustedBoundary,
  };
}

export function v98RelativitySimulationOptimizationCommandContract(): Readonly<{
  focusedCommand: "npm run test:atlas:relativity-simulation-optimization";
  browserFreshCommand: "npm run test:atlas:browser:fresh";
  teachingOverlayPolicy: "observable-atlas-and-kerr-studio-default";
  performanceHudPolicy: "optional-collapsed-read-only-main-canvas";
  scientificModelUpgradePolicy: "not-scientific-model-upgrade";
}> {
  return {
    focusedCommand: "npm run test:atlas:relativity-simulation-optimization",
    browserFreshCommand: "npm run test:atlas:browser:fresh",
    teachingOverlayPolicy: "observable-atlas-and-kerr-studio-default",
    performanceHudPolicy: "optional-collapsed-read-only-main-canvas",
    scientificModelUpgradePolicy: "not-scientific-model-upgrade",
  };
}
