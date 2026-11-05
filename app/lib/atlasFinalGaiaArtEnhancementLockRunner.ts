import { GAIA_V105_SELECTION_POLICY } from "../data/gaiaStarCatalog";
import {
  createAtlasBrowserAcceptanceRuntimeCostSummary,
} from "./atlasBrowserAcceptanceRuntimeCostLock";
import { runAtlasBrowserAcceptanceRuntimeCostAudit } from "./atlasBrowserAcceptanceRuntimeCostLockRunner";
import {
  ATLAS_FINAL_GAIA_ART_ENHANCEMENT_BOUNDARY,
  V105_FINAL_GAIA_ART_ENHANCEMENT_ROW,
} from "./atlasFinalGaiaArtEnhancementLock";
import type {
  AtlasFinalGaiaArtEnhancementAudit,
  AtlasFinalGaiaArtEnhancementRow,
  HorizonsValidationDataset,
} from "./simulationDiagnosticsTypes";

type FixtureEvidenceAudit = {
  path: string;
  sha256: string;
  sizeBytes: number;
};

export async function runAtlasFinalGaiaArtEnhancementAudit(args: {
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
  gaiaStarCatalogText?: string;
  gaiaStarFieldText?: string;
  constellationLinesText?: string;
  nebulaMarkersText?: string;
  bodyLabelText?: string;
  celestialCatalogLabelsText?: string;
}): Promise<{
  audits: readonly AtlasFinalGaiaArtEnhancementAudit[];
  rows: readonly AtlasFinalGaiaArtEnhancementRow[];
}> {
  const docsText = args.docsText ?? "";
  const surfaceText = args.surfaceText ?? "";
  const browserSpecText = args.browserSpecText ?? "";
  const combinedSurface = `${surfaceText}\n${browserSpecText}`;
  const v104Audit = await runAtlasBrowserAcceptanceRuntimeCostAudit({
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
    gaiaStarFieldText: args.gaiaStarFieldText,
    constellationLinesText: args.constellationLinesText,
    bodyLabelText: args.bodyLabelText,
    celestialCatalogLabelsText: args.celestialCatalogLabelsText,
  });
  const v104Summary = createAtlasBrowserAcceptanceRuntimeCostSummary(v104Audit);

  const audits = [
    priorV104Lock(v104Summary.status, v104Summary.classification),
    gaiaSelectionLock(args.gaiaStarCatalogText ?? "", args.gaiaStarFieldText ?? ""),
    gaiaVisualMappingLock(args.gaiaStarCatalogText ?? "", args.gaiaStarFieldText ?? ""),
    constellationNebulaReadabilityLock(args.constellationLinesText ?? "", args.nebulaMarkersText ?? ""),
    browserQaLock(browserSpecText, combinedSurface),
    budgetBoundaryLock(`${docsText}\n${combinedSurface}`, args.packageScripts ?? {}),
    docsSurfaceLock(docsText, combinedSurface, args.packageScripts ?? {}),
    protectedMutationLock(surfaceText),
  ] as const satisfies readonly AtlasFinalGaiaArtEnhancementAudit[];

  return {
    audits,
    rows: [finalGaiaArtEnhancementRow(audits)],
  };
}

function priorV104Lock(
  status: string,
  classification: string,
): AtlasFinalGaiaArtEnhancementAudit {
  const ready =
    status === "ready-browser-acceptance-runtime-cost-locked" &&
    classification === "browser-acceptance-runtime-cost-pass";
  return audit(
    "v104-browser-acceptance-runtime-cost",
    "v104 browser acceptance runtime cost",
    ready,
    `${status}; ${classification}`,
    "ready-browser-acceptance-runtime-cost-locked; browser-acceptance-runtime-cost-pass",
    "v105 reuses v104 heavy audit output instead of copying its internal judgment logic.",
  );
}

function gaiaSelectionLock(
  gaiaStarCatalogText: string,
  gaiaStarFieldText: string,
): AtlasFinalGaiaArtEnhancementAudit {
  const ready =
    gaiaStarCatalogText.includes("GAIA_V105_SELECTION_POLICY") &&
    gaiaStarCatalogText.includes(GAIA_V105_SELECTION_POLICY) &&
    gaiaStarCatalogText.includes("rankGaiaStarsForOverlay") &&
    gaiaStarCatalogText.includes("gaiaOverlaySelectionScore") &&
    gaiaStarFieldText.includes("rankGaiaStarsForOverlay(cat.stars, maxInstances)") &&
    !gaiaStarFieldText.includes("cat.stars[i]!");
  return audit(
    "gaia-selection-lock",
    "Deterministic budget-preserved Gaia selection",
    ready,
    ready ? "deterministic ranking used before maxInstances slice" : "Gaia deterministic ranking marker missing",
    "deterministic ranking used before maxInstances slice",
    "v105 may improve which Gaia stars are visible but must not increase the v97 base render budget.",
  );
}

function gaiaVisualMappingLock(
  gaiaStarCatalogText: string,
  gaiaStarFieldText: string,
): AtlasFinalGaiaArtEnhancementAudit {
  const ready =
    gaiaStarCatalogText.includes("gaiaOverlayVisualBrightness") &&
    gaiaStarCatalogText.includes("gaiaOverlayColorToRgb") &&
    gaiaStarFieldText.includes("gaiaOverlayVisualBrightness") &&
    gaiaStarFieldText.includes("gaiaOverlayColorToRgb") &&
    (gaiaStarFieldText.includes("Math.min(1, r * brightness)") ||
      (gaiaStarFieldText.includes("stellarMaterialProfile") &&
        gaiaStarFieldText.includes("material.coreIntensity") &&
        gaiaStarFieldText.includes("profileColor")));
  return audit(
    "gaia-visual-mapping-lock",
    "Gaia brightness and color layering",
    ready,
    ready ? "budget-preserved brightness/color mapping applied" : "Gaia visual mapping marker missing",
    "budget-preserved brightness/color mapping applied",
    "v105 visual mapping is presentation-only and does not claim physical calibration or Gaia certification.",
  );
}

function constellationNebulaReadabilityLock(
  constellationLinesText: string,
  nebulaMarkersText: string,
): AtlasFinalGaiaArtEnhancementAudit {
  const ready =
    constellationLinesText.includes("constellationDenseScale = qualityTier === \"dense\" ? 1.12 : 1.02") &&
    constellationLinesText.includes("selected-body-cinematic") &&
    nebulaMarkersText.includes("nebulaDenseScale = qualityTier === \"dense\" ? 1.16 : 1.02") &&
    nebulaMarkersText.includes("selected-body-cinematic");
  return audit(
    "constellation-nebula-readability-lock",
    "Constellation and nebula readability polish",
    ready,
    ready ? "overview/dense readability improved while closeup/mobile restraint remains" : "Constellation or nebula readability marker missing",
    "overview/dense readability improved while closeup/mobile restraint remains",
    "v105 constellation and nebula changes are presentation-only markers, not scientific gates.",
  );
}

function browserQaLock(
  browserSpecText: string,
  surfaceText: string,
): AtlasFinalGaiaArtEnhancementAudit {
  const required = [
    "data-atlas-final-gaia-art-enhancement-version",
    "data-atlas-final-gaia-art-enhancement-profile",
    "data-atlas-final-gaia-art-enhancement-status",
    "data-atlas-final-gaia-art-enhancement-strip",
    "data-atlas-final-gaia-art-enhancement-table",
    "data-evidence-claim-id=\"final-gaia-art-enhancement-lock\"",
    "data-atlas-validation-domain-id=\"final-gaia-art-enhancement-lock\"",
    "test-results/v105-final-gaia-art-enhancement-lock/",
  ];
  const ready = required.every((token) => surfaceText.includes(token) || browserSpecText.includes(token));
  return audit(
    "browser-qa-lock",
    "Root, Observable, Evidence, Validation and screenshot marker coverage",
    ready,
    ready ? "v105 browser QA markers present" : "v105 browser QA marker missing",
    "v105 browser QA markers present",
    "v105 must preserve Browser QA marker coverage without loosening screenshot or pixel checks.",
  );
}

function budgetBoundaryLock(
  text: string,
  scripts: Readonly<Record<string, string>>,
): AtlasFinalGaiaArtEnhancementAudit {
  const ready =
    scripts["test:atlas:final-gaia-art-enhancement"] ===
      "vitest run app/lib/atlasFinalGaiaArtEnhancementLock.horizons.test.ts" &&
    scripts["verify:atlas:final-gaia-art"] ===
      "npm run test:atlas:final-gaia-art-enhancement && npm run verify:atlas:browser-acceptance-runtime" &&
    text.includes("v97 Gaia render budgets") &&
    text.includes("v99 opacity caps") &&
    text.includes("1000") &&
    text.includes("1800") &&
    text.includes("3000") &&
    text.includes("0.62") &&
    text.includes("1.05") &&
    text.includes("1.2") &&
    text.includes("0.18");
  return audit(
    "budget-boundary-lock",
    "Frozen Gaia budget and art opacity cap preservation",
    ready,
    ready ? "v97 budgets and v99 opacity caps preserved" : "budget or opacity preservation marker missing",
    "v97 budgets and v99 opacity caps preserved",
    "v105 must not raise base Gaia render counts or opacity caps.",
  );
}

function docsSurfaceLock(
  docsText: string,
  surfaceText: string,
  scripts: Readonly<Record<string, string>>,
): AtlasFinalGaiaArtEnhancementAudit {
  const ready =
    scripts["test:atlas:final-gaia-art-enhancement"] ===
      "vitest run app/lib/atlasFinalGaiaArtEnhancementLock.horizons.test.ts" &&
    docsText.includes("v105 Final Gaia Art Enhancement Lock") &&
    docsText.includes("budget-preserved") &&
    docsText.includes("not full Gaia archive") &&
    docsText.includes("not Gaia/NASA/JPL official certification") &&
    surfaceText.includes("data-atlas-final-gaia-art-enhancement-version") &&
    surfaceText.includes("data-atlas-final-gaia-art-enhancement-strip") &&
    surfaceText.includes("data-atlas-final-gaia-art-enhancement-table") &&
    surfaceText.includes("final-gaia-art-enhancement-lock") &&
    surfaceText.includes("v105-final-gaia-art-enhancement-lock");
  return audit(
    "docs-surface-lock",
    "v105 docs, root DOM, Observable, Evidence and Validation surface",
    ready,
    ready ? "v105 docs and surface markers present" : "v105 docs or surface marker missing",
    "v105 docs and surface markers present",
    ATLAS_FINAL_GAIA_ART_ENHANCEMENT_BOUNDARY,
  );
}

function protectedMutationLock(surfaceText: string): AtlasFinalGaiaArtEnhancementAudit {
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
    "certificationClaimMutation: \"not-applied\"",
    "finalGaiaArtEnhancement: \"applied-budget-preserved-presentation-data-polish\"",
  ];
  const ready = required.every((token) => surfaceText.includes(token));
  return audit(
    "protected-mutation-lock",
    "Protected mutation flags and presentation/data-only scope",
    ready,
    ready
      ? "protected mutation flags not-applied; budget-preserved Gaia art polish applied"
      : "protected mutation flag or v105 scope marker missing",
    "protected mutation flags not-applied; budget-preserved Gaia art polish applied",
    ATLAS_FINAL_GAIA_ART_ENHANCEMENT_BOUNDARY,
  );
}

function finalGaiaArtEnhancementRow(
  audits: readonly AtlasFinalGaiaArtEnhancementAudit[],
): AtlasFinalGaiaArtEnhancementRow {
  const statusFor = (ids: readonly AtlasFinalGaiaArtEnhancementAudit["id"][]) =>
    audits.filter((auditItem) => ids.includes(auditItem.id)).every((auditItem) => auditItem.status === "ready")
      ? "pass"
      : "fail";
  const ready = audits.every((auditItem) => auditItem.status === "ready");
  return {
    ...V105_FINAL_GAIA_ART_ENHANCEMENT_ROW,
    status: ready ? "complete" : "blocked",
    v104Status: statusFor(["v104-browser-acceptance-runtime-cost"]),
    gaiaSelectionStatus: statusFor(["gaia-selection-lock"]),
    gaiaVisualMappingStatus: statusFor(["gaia-visual-mapping-lock"]),
    constellationNebulaReadabilityStatus: statusFor(["constellation-nebula-readability-lock"]),
    browserQaStatus: statusFor(["browser-qa-lock"]),
    budgetBoundaryStatus: statusFor(["budget-boundary-lock"]),
    docsSurfaceStatus: statusFor(["docs-surface-lock"]),
    protectedMutationStatus: statusFor(["protected-mutation-lock"]),
    finalGaiaArtEnhancement: "applied-budget-preserved-presentation-data-polish",
  };
}

function audit(
  id: AtlasFinalGaiaArtEnhancementAudit["id"],
  label: string,
  ready: boolean,
  measured: string,
  expected: string,
  trustedBoundary: string,
): AtlasFinalGaiaArtEnhancementAudit {
  return {
    id,
    label,
    status: ready ? "ready" : "regressed",
    measured,
    expected,
    trustedBoundary,
  };
}

export function v105FinalGaiaArtEnhancementCommandContract(): Readonly<{
  focusedCommand: "npm run test:atlas:final-gaia-art-enhancement";
  finalGaiaArtVerifyCommand: "npm run verify:atlas:final-gaia-art";
  defaultFreshCommand: "npm run test:atlas:browser:fresh";
  screenshotArtifactDirectory: "test-results/v105-final-gaia-art-enhancement-lock/";
  gaiaSelectionPolicy: "deterministic-bright-near-color-spread-sky-binned";
}> {
  return {
    focusedCommand: "npm run test:atlas:final-gaia-art-enhancement",
    finalGaiaArtVerifyCommand: "npm run verify:atlas:final-gaia-art",
    defaultFreshCommand: "npm run test:atlas:browser:fresh",
    screenshotArtifactDirectory: "test-results/v105-final-gaia-art-enhancement-lock/",
    gaiaSelectionPolicy: GAIA_V105_SELECTION_POLICY,
  };
}
