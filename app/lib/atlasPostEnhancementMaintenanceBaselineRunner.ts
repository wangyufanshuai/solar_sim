import {
  ATLAS_ART_POLISH_OPACITY_CAPS,
  createAtlasArtPolishSummary,
} from "./atlasArtPolish";
import { runAtlasArtPolishAudit } from "./atlasArtPolishRunner";
import {
  createAtlasFinalMaintenanceBaselineSummary,
} from "./atlasFinalMaintenanceBaseline";
import { runAtlasFinalMaintenanceBaselineAudit } from "./atlasFinalMaintenanceBaselineRunner";
import {
  ATLAS_GAIA_STARFIELD_RENDER_BUDGET,
  createAtlasGaiaStarfieldEnhancementSummary,
} from "./atlasGaiaStarfieldEnhancement";
import { runAtlasGaiaStarfieldEnhancementAudit } from "./atlasGaiaStarfieldEnhancementRunner";
import {
  createAtlasRelativitySimulationOptimizationSummary,
} from "./atlasRelativitySimulationOptimization";
import { runAtlasRelativitySimulationOptimizationAudit } from "./atlasRelativitySimulationOptimizationRunner";
import {
  V100_POST_ENHANCEMENT_BASELINE_ROW,
} from "./atlasPostEnhancementMaintenanceBaseline";
import type {
  AtlasPostEnhancementMaintenanceBaselineAudit,
  AtlasPostEnhancementMaintenanceBaselineRow,
  HorizonsValidationDataset,
} from "./simulationDiagnosticsTypes";

type FixtureEvidenceAudit = {
  path: string;
  sha256: string;
  sizeBytes: number;
};

export async function runAtlasPostEnhancementMaintenanceBaselineAudit(args: {
  baselineDataset: HorizonsValidationDataset;
  v82HierarchyDataset?: HorizonsValidationDataset | null;
  v84OuterSystemDataset?: HorizonsValidationDataset | null;
  packageScripts?: Readonly<Record<string, string>>;
  migratedFixtureAudit?: FixtureEvidenceAudit;
  legacyFixtureAudit?: FixtureEvidenceAudit;
  docsText?: string;
  surfaceText?: string;
  browserSpecText?: string;
  freshConfigText?: string;
  gaiaBrightRowCount?: number;
  gaiaKinematicsRowCount?: number;
  constellationRenderGroupCount?: number;
  normalizedIauConstellationCount?: number;
  nebulaMarkerCount?: number;
}): Promise<{
  audits: readonly AtlasPostEnhancementMaintenanceBaselineAudit[];
  rows: readonly AtlasPostEnhancementMaintenanceBaselineRow[];
}> {
  const docsText = args.docsText ?? "";
  const surfaceText = args.surfaceText ?? "";
  const browserSpecText = args.browserSpecText ?? "";
  const freshConfigText = args.freshConfigText ?? "";
  const combinedSurface = `${surfaceText}\n${browserSpecText}`;

  const v96Audit = await runAtlasFinalMaintenanceBaselineAudit({
    baselineDataset: args.baselineDataset,
    v82HierarchyDataset: args.v82HierarchyDataset,
    v84OuterSystemDataset: args.v84OuterSystemDataset,
    packageScripts: args.packageScripts,
    migratedFixtureAudit: args.migratedFixtureAudit,
    legacyFixtureAudit: args.legacyFixtureAudit,
    docsText,
    surfaceText,
    browserSpecText,
    freshConfigText,
  });
  const v96Summary = createAtlasFinalMaintenanceBaselineSummary(v96Audit);
  const v97Audit = runAtlasGaiaStarfieldEnhancementAudit({
    packageScripts: args.packageScripts,
    docsText,
    surfaceText,
    browserSpecText,
    gaiaBrightRowCount: args.gaiaBrightRowCount,
    gaiaKinematicsRowCount: args.gaiaKinematicsRowCount,
    constellationRenderGroupCount: args.constellationRenderGroupCount,
    normalizedIauConstellationCount: args.normalizedIauConstellationCount,
    nebulaMarkerCount: args.nebulaMarkerCount,
  });
  const v97Summary = createAtlasGaiaStarfieldEnhancementSummary(v97Audit);
  const v98Audit = runAtlasRelativitySimulationOptimizationAudit({
    packageScripts: args.packageScripts,
    docsText,
    surfaceText,
    browserSpecText,
  });
  const v98Summary = createAtlasRelativitySimulationOptimizationSummary(v98Audit);
  const v99Audit = runAtlasArtPolishAudit({
    packageScripts: args.packageScripts,
    docsText,
    surfaceText,
    browserSpecText,
  });
  const v99Summary = createAtlasArtPolishSummary(v99Audit);

  const audits = [
    priorAuditLock(
      "v96-baseline-lock",
      "v96 final maintenance baseline",
      v96Summary.status,
      v96Summary.classification,
      "ready-maintenance-baseline-locked",
      "final-maintenance-baseline-pass",
    ),
    priorAuditLock(
      "v97-gaia-overlay-lock",
      "v97 Gaia overlay",
      v97Summary.status,
      v97Summary.classification,
      "ready-gaia-overlay-locked",
      "gaia-overlay-pass",
    ),
    priorAuditLock(
      "v98-relativity-observability-lock",
      "v98 relativity teaching observability",
      v98Summary.status,
      v98Summary.classification,
      "ready-relativity-optimization-locked",
      "relativity-optimization-pass",
    ),
    priorAuditLock(
      "v99-art-polish-lock",
      "v99 art polish",
      v99Summary.status,
      v99Summary.classification,
      "ready-art-polish-locked",
      "art-polish-pass",
    ),
    browserResourceLifecycleLock(browserSpecText, freshConfigText, docsText),
    verificationEntrypointLock(args.packageScripts),
    docsSurfaceLock(docsText, combinedSurface),
    protectedMutationLock(surfaceText),
  ] as const satisfies readonly AtlasPostEnhancementMaintenanceBaselineAudit[];

  return {
    audits,
    rows: [postEnhancementMaintenanceBaselineRow(audits)],
  };
}

function priorAuditLock(
  id: AtlasPostEnhancementMaintenanceBaselineAudit["id"],
  label: string,
  status: string,
  classification: string,
  expectedStatus: string,
  expectedClassification: string,
): AtlasPostEnhancementMaintenanceBaselineAudit {
  const ready = status === expectedStatus && classification === expectedClassification;
  return audit(
    id,
    label,
    ready,
    `${status}; ${classification}`,
    `${expectedStatus}; ${expectedClassification}`,
    "v100 aggregates the existing heavy audit result instead of copying its internal judgment logic.",
  );
}

function browserResourceLifecycleLock(
  browserSpecText: string,
  freshConfigText: string,
  docsText: string,
): AtlasPostEnhancementMaintenanceBaselineAudit {
  const measured = [
    browserSpecText.includes('page.goto("about:blank", { waitUntil: "commit" })')
      ? "about:blank unload"
      : "about:blank missing",
    browserSpecText.includes("image.close()") ? "ImageBitmap.close" : "ImageBitmap.close missing",
    browserSpecText.includes("for (let attempt = 0; attempt < 3; attempt += 1)")
      ? "screenshot retry"
      : "screenshot retry missing",
    freshConfigText.includes('const baseUrl = "http://127.0.0.1:3015"') &&
      freshConfigText.includes('globalTeardown: "./tests/atlas-browser/atlas-browser-fresh-teardown.ts"') &&
      freshConfigText.includes("reuseExistingServer: false")
      ? "3015 teardown"
      : "3015 teardown missing",
    docsText.includes("DumpStack.log.tmp") && docsText.includes("pagefile.sys")
      ? "Watchpack noise documented"
      : "Watchpack noise docs missing",
  ].join("; ");
  const ready =
    measured ===
    "about:blank unload; ImageBitmap.close; screenshot retry; 3015 teardown; Watchpack noise documented";
  return audit(
    "browser-resource-lifecycle-lock",
    "Browser acceptance resource lifecycle and CI noise policy",
    ready,
    measured,
    "about:blank unload; ImageBitmap.close; screenshot retry; 3015 teardown; Watchpack noise documented",
    "v100 freezes the v94/v99 browser helper lifecycle policies without changing screenshot thresholds.",
  );
}

function verificationEntrypointLock(
  packageScripts: Readonly<Record<string, string>> | undefined,
): AtlasPostEnhancementMaintenanceBaselineAudit {
  const measured = [
    packageScripts?.["test:atlas:post-enhancement-baseline"] ?? "missing",
    packageScripts?.["verify:atlas:post-enhancement"] ?? "missing",
    packageScripts?.["verify:atlas:scientific"] ?? "missing",
  ].join(" | ");
  const expected = [
    "vitest run app/lib/atlasPostEnhancementMaintenanceBaseline.horizons.test.ts",
    "npm run test:atlas:post-enhancement-baseline && npm run verify:atlas:scientific",
    "npm run verify:atlas && npm run test:atlas:horizons-scientific-gate && npm run test:atlas:browser:fresh",
  ].join(" | ");
  return audit(
    "verification-entrypoint-lock",
    "v100 post-enhancement verification entrypoints",
    measured === expected,
    measured,
    expected,
    "v100 adds a post-enhancement maintenance entrypoint that runs the heavy audit before the existing scientific verification.",
  );
}

function docsSurfaceLock(
  docsText: string,
  surfaceText: string,
): AtlasPostEnhancementMaintenanceBaselineAudit {
  const ready =
    docsText.includes("v100 Post-Enhancement Maintenance Baseline") &&
    docsText.includes("pure maintenance baseline") &&
    docsText.includes("not a performance optimization") &&
    docsText.includes("does not rewrite v95/v96") &&
    surfaceText.includes("data-atlas-post-enhancement-baseline-version") &&
    surfaceText.includes("data-atlas-post-enhancement-baseline-strip") &&
    surfaceText.includes("data-atlas-post-enhancement-baseline-table") &&
    surfaceText.includes("post-enhancement-maintenance-baseline") &&
    surfaceText.includes("v100-post-enhancement-maintenance-baseline");
  return audit(
    "docs-surface-lock",
    "v100 docs, root DOM, Observable, Evidence, Validation and browser surface",
    ready,
    ready ? "v100 docs and surface markers present" : "v100 docs or surface marker missing",
    "v100 docs and surface markers present",
    "v100 surfaces must present a maintenance lock, not a scientific, visual, performance or release packaging upgrade.",
  );
}

function protectedMutationLock(surfaceText: string): AtlasPostEnhancementMaintenanceBaselineAudit {
  const required = [
    "livePhysicsMutation: \"not-applied\"",
    "workerPhysicsMutation: \"not-applied\"",
    "rk4DefaultMutation: \"not-applied\"",
    "eihOnePnMutation: \"not-applied\"",
    "kerrKernelMutation: \"not-applied\"",
    "skyAssetMutation: \"not-applied\"",
    "backgroundMutation: \"not-applied\"",
    "v9SkyDirectionMutation: \"not-applied\"",
    "materialMutation: \"not-applied\"",
    "fixtureDataMutation: \"not-applied\"",
    "budgetMutation: \"not-applied\"",
    "defaultGateConfigMutation: \"not-applied\"",
    "releasePackagingMutation: \"not-applied\"",
    "performanceOptimizationMutation: \"not-applied\"",
    "certificationClaimMutation: \"not-applied\"",
  ];
  const ready =
    required.every((token) => surfaceText.includes(token)) &&
    ATLAS_GAIA_STARFIELD_RENDER_BUDGET.mobile === 1000 &&
    ATLAS_GAIA_STARFIELD_RENDER_BUDGET.balanced === 1800 &&
    ATLAS_GAIA_STARFIELD_RENDER_BUDGET.dense === 3000 &&
    ATLAS_ART_POLISH_OPACITY_CAPS.mobile === 0.62 &&
    ATLAS_ART_POLISH_OPACITY_CAPS.balanced === 1.05 &&
    ATLAS_ART_POLISH_OPACITY_CAPS.dense === 1.2 &&
    ATLAS_ART_POLISH_OPACITY_CAPS.closeup === 0.18;
  return audit(
    "protected-mutation-lock",
    "Protected post-enhancement mutation flags and visual budgets",
    ready,
    ready
      ? "all protected post-enhancement mutation flags not-applied; Gaia budgets and opacity caps locked"
      : "protected post-enhancement mutation flag or budget missing",
    "all protected post-enhancement mutation flags not-applied; Gaia budgets and opacity caps locked",
    "v100 cannot mutate physics, fixtures, budgets, V9 sky/background, release packaging or performance parameters.",
  );
}

function postEnhancementMaintenanceBaselineRow(
  audits: readonly AtlasPostEnhancementMaintenanceBaselineAudit[],
): AtlasPostEnhancementMaintenanceBaselineRow {
  const statusFor = (ids: readonly AtlasPostEnhancementMaintenanceBaselineAudit["id"][]) =>
    audits.filter((auditItem) => ids.includes(auditItem.id)).every((auditItem) => auditItem.status === "ready")
      ? "pass"
      : "fail";
  const ready = audits.every((auditItem) => auditItem.status === "ready");
  return {
    ...V100_POST_ENHANCEMENT_BASELINE_ROW,
    status: ready ? "complete" : "blocked",
    finalBaselineStatus: statusFor(["v96-baseline-lock"]),
    gaiaOverlayStatus: statusFor(["v97-gaia-overlay-lock"]),
    relativityObservabilityStatus: statusFor(["v98-relativity-observability-lock"]),
    artPolishStatus: statusFor(["v99-art-polish-lock"]),
    browserResourceStatus: statusFor(["browser-resource-lifecycle-lock"]),
    verificationEntrypointStatus: statusFor(["verification-entrypoint-lock"]),
    docsSurfaceStatus: statusFor(["docs-surface-lock"]),
    protectedMutationStatus: statusFor(["protected-mutation-lock"]),
    postEnhancementBaseline: "applied-maintenance-lock-only",
  };
}

function audit(
  id: AtlasPostEnhancementMaintenanceBaselineAudit["id"],
  label: string,
  ready: boolean,
  measured: string,
  expected: string,
  trustedBoundary: string,
): AtlasPostEnhancementMaintenanceBaselineAudit {
  return {
    id,
    label,
    status: ready ? "ready" : "regressed",
    measured,
    expected,
    trustedBoundary,
  };
}

export function v100PostEnhancementMaintenanceBaselineCommandContract(): Readonly<{
  focusedCommand: "npm run test:atlas:post-enhancement-baseline";
  postEnhancementVerifyCommand: "npm run verify:atlas:post-enhancement";
  scientificVerifyCommand: "npm run verify:atlas:scientific";
  browserFreshCommand: "npm run test:atlas:browser:fresh";
  mobileRenderBudget: 1000;
  balancedRenderBudget: 1800;
  denseRenderBudget: 3000;
  mobileOpacityCap: 0.62;
  balancedOpacityCap: 1.05;
  denseOpacityCap: 1.2;
  closeupOpacityCap: 0.18;
  baselinePolicy: "pure-maintenance-lock-no-performance-optimization";
}> {
  return {
    focusedCommand: "npm run test:atlas:post-enhancement-baseline",
    postEnhancementVerifyCommand: "npm run verify:atlas:post-enhancement",
    scientificVerifyCommand: "npm run verify:atlas:scientific",
    browserFreshCommand: "npm run test:atlas:browser:fresh",
    mobileRenderBudget: ATLAS_GAIA_STARFIELD_RENDER_BUDGET.mobile,
    balancedRenderBudget: ATLAS_GAIA_STARFIELD_RENDER_BUDGET.balanced,
    denseRenderBudget: ATLAS_GAIA_STARFIELD_RENDER_BUDGET.dense,
    mobileOpacityCap: ATLAS_ART_POLISH_OPACITY_CAPS.mobile,
    balancedOpacityCap: ATLAS_ART_POLISH_OPACITY_CAPS.balanced,
    denseOpacityCap: ATLAS_ART_POLISH_OPACITY_CAPS.dense,
    closeupOpacityCap: ATLAS_ART_POLISH_OPACITY_CAPS.closeup,
    baselinePolicy: "pure-maintenance-lock-no-performance-optimization",
  };
}
