import { CONSTELLATION_LINES } from "../data/constellationCatalog";
import { NEBULAE } from "../data/nebulaCatalog";
import {
  ATLAS_GAIA_STARFIELD_RENDER_BUDGET,
  V97_GAIA_STARFIELD_ENHANCEMENT_ROW,
  orbitAtlasV9SkyBoundaryPreserved,
} from "./atlasGaiaStarfieldEnhancement";
import type {
  AtlasGaiaStarfieldEnhancementAudit,
  AtlasGaiaStarfieldEnhancementRow,
} from "./simulationDiagnosticsTypes";

export function runAtlasGaiaStarfieldEnhancementAudit(args: {
  packageScripts?: Readonly<Record<string, string>>;
  docsText?: string;
  surfaceText?: string;
  browserSpecText?: string;
  gaiaBrightRowCount?: number;
  gaiaKinematicsRowCount?: number;
  constellationRenderGroupCount?: number;
  normalizedIauConstellationCount?: number;
  nebulaMarkerCount?: number;
} = {}): {
  audits: readonly AtlasGaiaStarfieldEnhancementAudit[];
  rows: readonly AtlasGaiaStarfieldEnhancementRow[];
} {
  const docsText = args.docsText ?? "";
  const surfaceText = args.surfaceText ?? "";
  const browserSpecText = args.browserSpecText ?? "";
  const combinedSurface = `${surfaceText}\n${browserSpecText}`;
  const audits = [
    gaiaCatalogLock(args.gaiaBrightRowCount, args.gaiaKinematicsRowCount),
    constellationCatalogLock(args.constellationRenderGroupCount, args.normalizedIauConstellationCount),
    nebulaCatalogLock(args.nebulaMarkerCount),
    overlayBudgetLock(args.packageScripts, combinedSurface),
    v9SkyBoundaryLock(`${docsText}\n${surfaceText}`),
    docsOverlayLock(docsText),
    browserSurfaceLock(combinedSurface),
    protectedMutationLock(surfaceText),
  ] as const satisfies readonly AtlasGaiaStarfieldEnhancementAudit[];

  return {
    audits,
    rows: [gaiaStarfieldEnhancementRow(audits)],
  };
}

function gaiaCatalogLock(
  brightRowCount = 0,
  kinematicsRowCount = 0,
): AtlasGaiaStarfieldEnhancementAudit {
  const ready = brightRowCount === 5000 && kinematicsRowCount === 2000;
  return audit(
    "gaia-catalog-lock",
    "packaged Gaia DR3 subset contracts",
    ready,
    `bright ${brightRowCount}; kinematics ${kinematicsRowCount}`,
    "bright 5000; kinematics 2000",
    "v97 reuses packaged Gaia bright 5000 and Gaia kinematics 2000 as local presentation data, not the full Gaia archive.",
  );
}

function constellationCatalogLock(
  renderGroupCount = CONSTELLATION_LINES.length,
  normalizedIauCount = 88,
): AtlasGaiaStarfieldEnhancementAudit {
  const ready = normalizedIauCount === 88 && renderGroupCount >= 88;
  return audit(
    "constellation-catalog-lock",
    "IAU constellation overlay contract",
    ready,
    `normalized ${normalizedIauCount}; render groups ${renderGroupCount}`,
    "normalized 88; render groups >= 88",
    "v97 audits the 88 IAU constellation presentation contract while allowing local render groups for split or guide-line entries.",
  );
}

function nebulaCatalogLock(markerCount = NEBULAE.length): AtlasGaiaStarfieldEnhancementAudit {
  const ready = markerCount === NEBULAE.length && markerCount > 0;
  return audit(
    "nebula-catalog-lock",
    "curated local nebula marker contract",
    ready,
    `nebula markers ${markerCount}`,
    `nebula markers ${NEBULAE.length}`,
    "Nebula markers remain curated local presentation objects, not astrophysical gas evolution or a scientific gate input.",
  );
}

function overlayBudgetLock(
  packageScripts: Readonly<Record<string, string>> | undefined,
  surfaceText: string,
): AtlasGaiaStarfieldEnhancementAudit {
  const measured = [
    `mobile ${ATLAS_GAIA_STARFIELD_RENDER_BUDGET.mobile}`,
    `balanced ${ATLAS_GAIA_STARFIELD_RENDER_BUDGET.balanced}`,
    `dense ${ATLAS_GAIA_STARFIELD_RENDER_BUDGET.dense}`,
    packageScripts?.["test:atlas:gaia-starfield-enhancement"] ?? "missing",
  ].join("; ");
  const ready =
    packageScripts?.["test:atlas:gaia-starfield-enhancement"] ===
      "vitest run app/lib/atlasGaiaStarfieldEnhancement.horizons.test.ts" &&
    surfaceText.includes("mobile-uses-1000-star-budget") &&
    surfaceText.includes("selected-body-closeup-opacity-suppressed") &&
    surfaceText.includes("sandbox-deep-space-and-orbit-atlas-dense");
  return audit(
    "overlay-budget-lock",
    "Gaia visual overlay render budget",
    ready,
    measured,
    "mobile 1000; balanced 1800; dense 3000; focused command present",
    "v97 must keep Gaia overlay budgets bounded and downgrade on mobile and selected-body closeups.",
  );
}

function v9SkyBoundaryLock(text: string): AtlasGaiaStarfieldEnhancementAudit {
  const ready =
    orbitAtlasV9SkyBoundaryPreserved() &&
    text.includes("ORBIT_ATLAS_SKY === ORBIT_ATLAS_V9_SKY") &&
    text.includes("GalaxyEnvironmentSphere legacy V9");
  return audit(
    "v9-sky-boundary-lock",
    "V9 sky and GalaxyEnvironmentSphere boundary",
    ready,
    ready ? "V9 sky identity and legacy background boundary preserved" : "V9 sky boundary missing",
    "V9 sky identity and legacy background boundary preserved",
    "v97 may add an overlay, but it must not replace ORBIT_ATLAS_V9_SKY or change the legacy V9 background direction.",
  );
}

function docsOverlayLock(docsText: string): AtlasGaiaStarfieldEnhancementAudit {
  const ready =
    docsText.includes("v97 Gaia Starfield / Constellation Enhancement") &&
    docsText.includes("presentation-only") &&
    docsText.includes("not Gaia official certification") &&
    docsText.includes("not NASA/JPL certification") &&
    docsText.includes("not full Gaia archive");
  return audit(
    "docs-overlay-lock",
    "v97 Gaia overlay documentation",
    ready,
    ready ? "v97 Gaia overlay docs present" : "v97 Gaia overlay docs missing",
    "v97 Gaia overlay docs present",
    "Documentation must state that v97 is a presentation overlay, not an official certification or full archive.",
  );
}

function browserSurfaceLock(surfaceText: string): AtlasGaiaStarfieldEnhancementAudit {
  const ready =
    surfaceText.includes("data-atlas-gaia-starfield-enhancement-version") &&
    surfaceText.includes("data-atlas-gaia-starfield-enhancement-strip") &&
    surfaceText.includes("data-atlas-gaia-starfield-enhancement-table") &&
    surfaceText.includes("gaia-starfield-enhancement") &&
    surfaceText.includes("v97-gaia-starfield-enhancement");
  return audit(
    "browser-surface-lock",
    "root DOM, Observable, Evidence and Validation Gaia overlay surface",
    ready,
    ready ? "v97 Gaia overlay surface present" : "v97 Gaia overlay surface missing",
    "v97 Gaia overlay surface present",
    "Rendered surfaces and browser acceptance must expose v97 Gaia overlay markers.",
  );
}

function protectedMutationLock(surfaceText: string): AtlasGaiaStarfieldEnhancementAudit {
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
  ];
  const ready = required.every((token) => surfaceText.includes(token));
  return audit(
    "protected-mutation-lock",
    "protected Gaia overlay mutation flags",
    ready,
    ready ? "all protected Gaia overlay mutation flags not-applied" : "protected Gaia overlay mutation flag missing",
    "all protected Gaia overlay mutation flags not-applied",
    "The v97 contract must keep physics, fixture, budget, sky, background, material and certification mutation flags not-applied.",
  );
}

function gaiaStarfieldEnhancementRow(
  audits: readonly AtlasGaiaStarfieldEnhancementAudit[],
): AtlasGaiaStarfieldEnhancementRow {
  const statusFor = (ids: readonly AtlasGaiaStarfieldEnhancementAudit["id"][]) =>
    audits.filter((auditItem) => ids.includes(auditItem.id)).every((auditItem) => auditItem.status === "ready")
      ? "pass"
      : "fail";
  const ready = audits.every((auditItem) => auditItem.status === "ready");
  return {
    ...V97_GAIA_STARFIELD_ENHANCEMENT_ROW,
    status: ready ? "complete" : "blocked",
    gaiaCatalogStatus: statusFor(["gaia-catalog-lock"]),
    constellationCatalogStatus: statusFor(["constellation-catalog-lock"]),
    nebulaCatalogStatus: statusFor(["nebula-catalog-lock"]),
    overlayBudgetStatus: statusFor(["overlay-budget-lock"]),
    v9SkyBoundaryStatus: statusFor(["v9-sky-boundary-lock"]),
    docsOverlayStatus: statusFor(["docs-overlay-lock"]),
    browserSurfaceStatus: statusFor(["browser-surface-lock"]),
    protectedMutationStatus: statusFor(["protected-mutation-lock"]),
    gaiaStarfieldEnhancement: "applied-overlay-only",
  };
}

function audit(
  id: AtlasGaiaStarfieldEnhancementAudit["id"],
  label: string,
  ready: boolean,
  measured: string,
  expected: string,
  trustedBoundary: string,
): AtlasGaiaStarfieldEnhancementAudit {
  return {
    id,
    label,
    status: ready ? "ready" : "regressed",
    measured,
    expected,
    trustedBoundary,
  };
}

export function v97GaiaStarfieldEnhancementCommandContract(): Readonly<{
  focusedCommand: "npm run test:atlas:gaia-starfield-enhancement";
  browserFreshCommand: "npm run test:atlas:browser:fresh";
  mobileRenderBudget: 1000;
  balancedRenderBudget: 1800;
  denseRenderBudget: 3000;
  defaultActivationPolicy: "sandbox-deep-space-and-orbit-atlas-dense";
  closeupSuppressionPolicy: "selected-body-closeup-opacity-suppressed";
}> {
  return {
    focusedCommand: "npm run test:atlas:gaia-starfield-enhancement",
    browserFreshCommand: "npm run test:atlas:browser:fresh",
    mobileRenderBudget: ATLAS_GAIA_STARFIELD_RENDER_BUDGET.mobile,
    balancedRenderBudget: ATLAS_GAIA_STARFIELD_RENDER_BUDGET.balanced,
    denseRenderBudget: ATLAS_GAIA_STARFIELD_RENDER_BUDGET.dense,
    defaultActivationPolicy: "sandbox-deep-space-and-orbit-atlas-dense",
    closeupSuppressionPolicy: "selected-body-closeup-opacity-suppressed",
  };
}
