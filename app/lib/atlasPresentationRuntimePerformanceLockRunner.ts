import { ATLAS_ART_POLISH_OPACITY_CAPS } from "./atlasArtPolish";
import { ATLAS_GAIA_STARFIELD_RENDER_BUDGET } from "./atlasGaiaStarfieldEnhancement";
import { createAtlasMaintenanceEvidenceIndexSummary } from "./atlasMaintenanceEvidenceIndex";
import { runAtlasMaintenanceEvidenceIndexAudit } from "./atlasMaintenanceEvidenceIndexRunner";
import {
  ATLAS_PRESENTATION_RUNTIME_PERFORMANCE_BOUNDARY,
  V103_PRESENTATION_RUNTIME_PERFORMANCE_ROW,
} from "./atlasPresentationRuntimePerformanceLock";
import type {
  AtlasPresentationRuntimePerformanceAudit,
  AtlasPresentationRuntimePerformanceRow,
  HorizonsValidationDataset,
} from "./simulationDiagnosticsTypes";

type FixtureEvidenceAudit = {
  path: string;
  sha256: string;
  sizeBytes: number;
};

export async function runAtlasPresentationRuntimePerformanceAudit(args: {
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
  freshTeardownText?: string;
  gaiaBrightRowCount?: number;
  gaiaKinematicsRowCount?: number;
  constellationRenderGroupCount?: number;
  normalizedIauConstellationCount?: number;
  nebulaMarkerCount?: number;
  gaiaStarFieldText?: string;
  constellationLinesText?: string;
  bodyLabelText?: string;
  celestialCatalogLabelsText?: string;
}): Promise<{
  audits: readonly AtlasPresentationRuntimePerformanceAudit[];
  rows: readonly AtlasPresentationRuntimePerformanceRow[];
}> {
  const docsText = args.docsText ?? "";
  const surfaceText = args.surfaceText ?? "";
  const browserSpecText = args.browserSpecText ?? "";
  const combinedSurface = `${surfaceText}\n${browserSpecText}`;
  const v102Audit = await runAtlasMaintenanceEvidenceIndexAudit({
    baselineDataset: args.baselineDataset,
    v82HierarchyDataset: args.v82HierarchyDataset,
    v84OuterSystemDataset: args.v84OuterSystemDataset,
    packageScripts: args.packageScripts,
    migratedFixtureAudit: args.migratedFixtureAudit,
    legacyFixtureAudit: args.legacyFixtureAudit,
    docsText,
    surfaceText,
    browserSpecText,
    freshConfigText: args.freshConfigText,
    freshTeardownText: args.freshTeardownText,
    gaiaBrightRowCount: args.gaiaBrightRowCount,
    gaiaKinematicsRowCount: args.gaiaKinematicsRowCount,
    constellationRenderGroupCount: args.constellationRenderGroupCount,
    normalizedIauConstellationCount: args.normalizedIauConstellationCount,
    nebulaMarkerCount: args.nebulaMarkerCount,
  });
  const v102Summary = createAtlasMaintenanceEvidenceIndexSummary(v102Audit);

  const audits = [
    priorV102Lock(v102Summary.status, v102Summary.classification),
    gaiaRuntimeLock(args.gaiaStarFieldText ?? ""),
    constellationRuntimeLock(args.constellationLinesText ?? ""),
    labelRuntimeLock(`${args.bodyLabelText ?? ""}\n${args.celestialCatalogLabelsText ?? ""}`),
    budgetThresholdLock(`${docsText}\n${combinedSurface}`),
    docsSurfaceLock(docsText, combinedSurface, args.packageScripts ?? {}),
    protectedMutationLock(surfaceText),
  ] as const satisfies readonly AtlasPresentationRuntimePerformanceAudit[];

  return {
    audits,
    rows: [presentationRuntimePerformanceRow(audits)],
  };
}

function priorV102Lock(
  status: string,
  classification: string,
): AtlasPresentationRuntimePerformanceAudit {
  const ready =
    status === "ready-maintenance-evidence-indexed" &&
    classification === "maintenance-evidence-index-pass";
  return audit(
    "v102-maintenance-evidence-index",
    "v102 maintenance evidence index",
    ready,
    `${status}; ${classification}`,
    "ready-maintenance-evidence-indexed; maintenance-evidence-index-pass",
    "v103 reuses v102 heavy audit output instead of copying its internal judgment logic.",
  );
}

function gaiaRuntimeLock(text: string): AtlasPresentationRuntimePerformanceAudit {
  const ready =
    text.includes("prevOpacityTargetRef") &&
    text.includes("previousGaiaUniformOpacityTarget") &&
    text.includes("THREE.StaticDrawUsage") &&
    text.includes("instanceColor.setUsage(THREE.StaticDrawUsage)") &&
    text.includes("instanceSize.setUsage(THREE.StaticDrawUsage)");
  return audit(
    "gaia-runtime-lock",
    "Gaia uniform and static attribute runtime cost",
    ready,
    ready
      ? "Gaia opacity target writes deduped; instance color/size static"
      : "Gaia runtime optimization marker missing",
    "Gaia opacity target writes deduped; instance color/size static",
    "v103 may reduce Gaia presentation-layer write pressure without changing Gaia budgets or opacity caps.",
  );
}

function constellationRuntimeLock(text: string): AtlasPresentationRuntimePerformanceAudit {
  const ready =
    text.includes("lastConstellationFrameSignatureRef") &&
    text.includes("constellation-frame-signature-material-write-dedupe") &&
    text.includes("lineMat.opacity = lineOpacity") &&
    text.includes("nodeMat.opacity = nodeOpacity");
  return audit(
    "constellation-runtime-lock",
    "Constellation material write dedupe",
    ready,
    ready
      ? "Constellation visibility and opacity writes gated by frame signature"
      : "Constellation runtime optimization marker missing",
    "Constellation visibility and opacity writes gated by frame signature",
    "v103 must preserve constellation opacity formulas while avoiding repeated identical material writes.",
  );
}

function labelRuntimeLock(text: string): AtlasPresentationRuntimePerformanceAudit {
  const ready =
    text.includes("lastLabelStyleRef") &&
    text.includes("previousBodyLabelStyle") &&
    text.includes("lastCatalogLabelVisibilityRef") &&
    text.includes("label-dom-visible-style-write-dedupe");
  return audit(
    "label-runtime-lock",
    "Label DOM style and group visibility write dedupe",
    ready,
    ready
      ? "Body label style writes and catalog label visibility writes deduped"
      : "Label runtime optimization marker missing",
    "Body label style writes and catalog label visibility writes deduped",
    "v103 must not change label count, label budget, distance fades, occlusion logic or visual thresholds.",
  );
}

function budgetThresholdLock(text: string): AtlasPresentationRuntimePerformanceAudit {
  const ready =
    ATLAS_GAIA_STARFIELD_RENDER_BUDGET.mobile === 1000 &&
    ATLAS_GAIA_STARFIELD_RENDER_BUDGET.balanced === 1800 &&
    ATLAS_GAIA_STARFIELD_RENDER_BUDGET.dense === 3000 &&
    ATLAS_ART_POLISH_OPACITY_CAPS.mobile === 0.62 &&
    ATLAS_ART_POLISH_OPACITY_CAPS.balanced === 1.05 &&
    ATLAS_ART_POLISH_OPACITY_CAPS.dense === 1.2 &&
    ATLAS_ART_POLISH_OPACITY_CAPS.closeup === 0.18 &&
    text.includes("v97 Gaia budgets") &&
    text.includes("v99 opacity caps") &&
    text.includes("browser screenshot thresholds") &&
    text.includes("pixel settle/retry");
  return audit(
    "budget-threshold-lock",
    "Frozen budget and threshold preservation",
    ready,
    ready
      ? "v97/v99/v75/browser thresholds preserved"
      : "budget or threshold preservation token missing",
    "v97/v99/v75/browser thresholds preserved",
    "v103 must not change frozen budgets, visual thresholds or browser acceptance thresholds.",
  );
}

function docsSurfaceLock(
  docsText: string,
  surfaceText: string,
  scripts: Readonly<Record<string, string>>,
): AtlasPresentationRuntimePerformanceAudit {
  const ready =
    scripts["test:atlas:presentation-runtime-performance"] ===
      "vitest run app/lib/atlasPresentationRuntimePerformanceLock.horizons.test.ts" &&
    scripts["verify:atlas:presentation-runtime"] ===
      "npm run test:atlas:presentation-runtime-performance && npm run verify:atlas:maintenance-evidence" &&
    docsText.includes("v103 Presentation Runtime Performance Lock") &&
    docsText.includes("presentation runtime performance") &&
    surfaceText.includes("data-atlas-presentation-runtime-performance-version") &&
    surfaceText.includes("data-atlas-presentation-runtime-performance-strip") &&
    surfaceText.includes("data-atlas-presentation-runtime-performance-table") &&
    surfaceText.includes("presentation-runtime-performance-lock") &&
    surfaceText.includes("v103-presentation-runtime-performance-lock");
  return audit(
    "docs-surface-lock",
    "v103 docs, root DOM, Observable, Evidence, Validation and browser surface",
    ready,
    ready ? "v103 docs and surface markers present" : "v103 docs or surface marker missing",
    "v103 docs and surface markers present",
    "v103 surfaces must present presentation runtime cost optimization without scientific, fixture, visual budget, browser QA cost or release packaging claims.",
  );
}

function protectedMutationLock(surfaceText: string): AtlasPresentationRuntimePerformanceAudit {
  const required = [
    "browserAcceptanceCostMutation: \"not-applied\"",
    "runtimePerformanceMutation: \"not-applied\"",
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
    "certificationClaimMutation: \"not-applied\"",
    "presentationRuntimePerformance: \"applied-presentation-runtime-cost-only\"",
  ];
  const ready = required.every((token) => surfaceText.includes(token));
  return audit(
    "protected-mutation-lock",
    "Protected mutation flags and presentation-runtime-only scope",
    ready,
    ready
      ? "protected mutation flags not-applied; presentation runtime cost only applied"
      : "protected mutation flag or presentation runtime marker missing",
    "protected mutation flags not-applied; presentation runtime cost only applied",
    ATLAS_PRESENTATION_RUNTIME_PERFORMANCE_BOUNDARY,
  );
}

function presentationRuntimePerformanceRow(
  audits: readonly AtlasPresentationRuntimePerformanceAudit[],
): AtlasPresentationRuntimePerformanceRow {
  const statusFor = (ids: readonly AtlasPresentationRuntimePerformanceAudit["id"][]) =>
    audits.filter((auditItem) => ids.includes(auditItem.id)).every((auditItem) => auditItem.status === "ready")
      ? "pass"
      : "fail";
  const ready = audits.every((auditItem) => auditItem.status === "ready");
  return {
    ...V103_PRESENTATION_RUNTIME_PERFORMANCE_ROW,
    status: ready ? "complete" : "blocked",
    v102Status: statusFor(["v102-maintenance-evidence-index"]),
    gaiaRuntimeStatus: statusFor(["gaia-runtime-lock"]),
    constellationRuntimeStatus: statusFor(["constellation-runtime-lock"]),
    labelRuntimeStatus: statusFor(["label-runtime-lock"]),
    budgetThresholdStatus: statusFor(["budget-threshold-lock"]),
    docsSurfaceStatus: statusFor(["docs-surface-lock"]),
    protectedMutationStatus: statusFor(["protected-mutation-lock"]),
    presentationRuntimePerformance: "applied-presentation-runtime-cost-only",
  };
}

function audit(
  id: AtlasPresentationRuntimePerformanceAudit["id"],
  label: string,
  ready: boolean,
  measured: string,
  expected: string,
  trustedBoundary: string,
): AtlasPresentationRuntimePerformanceAudit {
  return {
    id,
    label,
    status: ready ? "ready" : "regressed",
    measured,
    expected,
    trustedBoundary,
  };
}

export function v103PresentationRuntimePerformanceCommandContract(): Readonly<{
  focusedCommand: "npm run test:atlas:presentation-runtime-performance";
  presentationRuntimeVerifyCommand: "npm run verify:atlas:presentation-runtime";
  maintenanceEvidenceVerifyCommand: "npm run verify:atlas:maintenance-evidence";
  gaiaBudgetMobile: 1000;
  gaiaBudgetBalanced: 1800;
  gaiaBudgetDense: 3000;
  mobileOpacityCap: 0.62;
  balancedOpacityCap: 1.05;
  denseOpacityCap: 1.2;
  closeupOpacityCap: 0.18;
  presentationRuntimePolicy: "presentation-runtime-cost-only";
}> {
  return {
    focusedCommand: "npm run test:atlas:presentation-runtime-performance",
    presentationRuntimeVerifyCommand: "npm run verify:atlas:presentation-runtime",
    maintenanceEvidenceVerifyCommand: "npm run verify:atlas:maintenance-evidence",
    gaiaBudgetMobile: ATLAS_GAIA_STARFIELD_RENDER_BUDGET.mobile,
    gaiaBudgetBalanced: ATLAS_GAIA_STARFIELD_RENDER_BUDGET.balanced,
    gaiaBudgetDense: ATLAS_GAIA_STARFIELD_RENDER_BUDGET.dense,
    mobileOpacityCap: ATLAS_ART_POLISH_OPACITY_CAPS.mobile,
    balancedOpacityCap: ATLAS_ART_POLISH_OPACITY_CAPS.balanced,
    denseOpacityCap: ATLAS_ART_POLISH_OPACITY_CAPS.dense,
    closeupOpacityCap: ATLAS_ART_POLISH_OPACITY_CAPS.closeup,
    presentationRuntimePolicy: "presentation-runtime-cost-only",
  };
}
