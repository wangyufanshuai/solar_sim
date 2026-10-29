import { CONSTELLATION_LINES } from "../data/constellationCatalog";
import { NEBULAE } from "../data/nebulaCatalog";
import { ORBIT_ATLAS_SKY, ORBIT_ATLAS_V9_SKY } from "./orbitAtlasPresentation";
import type {
  AtlasGaiaStarfieldEnhancementAudit,
  AtlasGaiaStarfieldEnhancementBudget,
  AtlasGaiaStarfieldEnhancementClassification,
  AtlasGaiaStarfieldEnhancementQualityTier,
  AtlasGaiaStarfieldEnhancementRow,
  AtlasGaiaStarfieldEnhancementSummary,
} from "./simulationDiagnosticsTypes";

export const ATLAS_GAIA_STARFIELD_ENHANCEMENT_VERSION =
  "v97-gaia-starfield-enhancement" as const;

export const ATLAS_GAIA_STARFIELD_ENHANCEMENT_PROFILE =
  "v97-gaia-constellation-nebula-overlay" as const;

export const ATLAS_GAIA_STARFIELD_RENDER_BUDGET: AtlasGaiaStarfieldEnhancementBudget = {
  mobile: 1000,
  balanced: 1800,
  dense: 3000,
} as const;

export const V97_GAIA_STARFIELD_ENHANCEMENT_BOUNDARY =
  "Local v97 Gaia starfield, constellation and nebula presentation overlay over the v96 maintenance baseline. It reuses packaged Gaia bright 5000, Gaia kinematics 2000, local IAU constellation metadata and curated nebula markers with fixed mobile/balanced/dense render budgets; it is not the full Gaia archive, not Gaia/NASA/JPL certification, not a scientific gate, not a physics model upgrade, and it does not mutate live runtime physics, worker physics, RK4, EIH 1PN, Kerr, Horizons fixtures, v75 budgets, materials, V9 sky assets, ORBIT_ATLAS_SKY identity or GalaxyEnvironmentSphere legacy V9 background direction.";

export const V97_GAIA_STARFIELD_ENHANCEMENT_ROW: AtlasGaiaStarfieldEnhancementRow = {
  id: "v97-lock-gaia-starfield-enhancement",
  label: "Lock Gaia starfield and deep-sky visual overlay",
  gaiaCatalogUrl: "/data/gaia-dr3-bright-5000.json",
  gaiaKinematicsUrl: "/data/gaia-dr3-kinematics-2000.json",
  constellationContract: "iau-88-normalized-render-groups",
  nebulaContract: "curated-local-nebula-presentation-markers",
  status: "not-run",
  gaiaCatalogStatus: "not-run",
  constellationCatalogStatus: "not-run",
  nebulaCatalogStatus: "not-run",
  overlayBudgetStatus: "not-run",
  v9SkyBoundaryStatus: "not-run",
  docsOverlayStatus: "not-run",
  browserSurfaceStatus: "not-run",
  protectedMutationStatus: "not-run",
  gaiaStarfieldEnhancement: "applied-overlay-only",
} as const;

export function createAtlasGaiaStarfieldEnhancementSummary(
  args: {
    audits?: readonly AtlasGaiaStarfieldEnhancementAudit[];
    rows?: readonly AtlasGaiaStarfieldEnhancementRow[];
    qualityTier?: AtlasGaiaStarfieldEnhancementQualityTier;
  } = {},
): AtlasGaiaStarfieldEnhancementSummary {
  const audits = args.audits ?? [];
  const qualityTier = args.qualityTier ?? "balanced";
  const overlayRows = [
    args.rows?.find((row) => row.id === V97_GAIA_STARFIELD_ENHANCEMENT_ROW.id) ??
      V97_GAIA_STARFIELD_ENHANCEMENT_ROW,
  ];
  const completed = overlayRows.filter((row) => row.status === "complete");
  const ready =
    completed.find(
      (row) =>
        row.gaiaCatalogStatus === "pass" &&
        row.constellationCatalogStatus === "pass" &&
        row.nebulaCatalogStatus === "pass" &&
        row.overlayBudgetStatus === "pass" &&
        row.v9SkyBoundaryStatus === "pass" &&
        row.docsOverlayStatus === "pass" &&
        row.browserSurfaceStatus === "pass" &&
        row.protectedMutationStatus === "pass",
    ) ?? null;
  const hasAuditRegression = audits.some((audit) => audit.status !== "ready");
  const hasRowRegression = completed.some(
    (row) =>
      row.gaiaCatalogStatus !== "pass" ||
      row.constellationCatalogStatus !== "pass" ||
      row.nebulaCatalogStatus !== "pass" ||
      row.overlayBudgetStatus !== "pass" ||
      row.v9SkyBoundaryStatus !== "pass" ||
      row.docsOverlayStatus !== "pass" ||
      row.browserSurfaceStatus !== "pass" ||
      row.protectedMutationStatus !== "pass",
  );
  const status =
    completed.length === 0 && audits.length === 0
      ? "pending-runtime-run"
      : hasAuditRegression || hasRowRegression
        ? "ready-gaia-overlay-blocked"
        : ready
          ? "ready-gaia-overlay-locked"
          : "ready-visual-overlay-budgeted";

  return {
    version: ATLAS_GAIA_STARFIELD_ENHANCEMENT_VERSION,
    overlayProfile: ATLAS_GAIA_STARFIELD_ENHANCEMENT_PROFILE,
    status,
    classification: classifyGaiaStarfieldEnhancement({
      status,
      audits,
      ready,
    }),
    qualityTier,
    renderBudget: ATLAS_GAIA_STARFIELD_RENDER_BUDGET,
    activeGaiaRenderBudget: ATLAS_GAIA_STARFIELD_RENDER_BUDGET[qualityTier],
    packagedGaiaBrightRowCount: 5000,
    packagedGaiaKinematicsRowCount: 2000,
    normalizedIauConstellationCount: 88,
    constellationRenderGroupCount: CONSTELLATION_LINES.length,
    nebulaMarkerCount: NEBULAE.length,
    overlayRowCount: overlayRows.length,
    completedOverlayRowCount: completed.length,
    audits,
    overlayRows,
    readyOverlayRowId: ready?.id ?? "",
    defaultActivationPolicy: "sandbox-deep-space-and-orbit-atlas-dense",
    mobileDowngradePolicy: "mobile-uses-1000-star-budget",
    closeupSuppressionPolicy: "selected-body-closeup-opacity-suppressed",
    fullGaiaArchivePolicy: "not-full-gaia-archive",
    officialCertificationPolicy: "not-gaia-nasa-jpl-certified",
    gaiaStarfieldEnhancement: "applied-overlay-only",
    livePhysicsMutation: "not-applied",
    workerPhysicsMutation: "not-applied",
    rk4DefaultMutation: "not-applied",
    eihOnePnMutation: "not-applied",
    kerrKernelMutation: "not-applied",
    skyAssetMutation: "not-applied",
    backgroundMutation: "not-applied",
    v9SkyDirectionMutation: "not-applied",
    materialMutation: "not-applied",
    fixtureDataMutation: "not-applied",
    budgetMutation: "not-applied",
    defaultGateConfigMutation: "not-applied",
    releasePackagingMutation: "not-applied",
    certificationClaimMutation: "not-applied",
    trustedBoundary: V97_GAIA_STARFIELD_ENHANCEMENT_BOUNDARY,
  };
}

export function orbitAtlasV9SkyBoundaryPreserved(): boolean {
  return ORBIT_ATLAS_SKY === ORBIT_ATLAS_V9_SKY;
}

function classifyGaiaStarfieldEnhancement(args: {
  status: AtlasGaiaStarfieldEnhancementSummary["status"];
  audits: readonly AtlasGaiaStarfieldEnhancementAudit[];
  ready: AtlasGaiaStarfieldEnhancementRow | null;
}): AtlasGaiaStarfieldEnhancementClassification {
  if (args.status === "pending-runtime-run") return "mixed";
  if (args.audits.some((audit) => audit.id === "gaia-catalog-lock" && audit.status !== "ready")) {
    return "gaia-catalog-regression";
  }
  if (args.audits.some((audit) => audit.id === "constellation-catalog-lock" && audit.status !== "ready")) {
    return "constellation-catalog-regression";
  }
  if (args.audits.some((audit) => audit.id === "nebula-catalog-lock" && audit.status !== "ready")) {
    return "nebula-catalog-regression";
  }
  if (args.audits.some((audit) => audit.id === "overlay-budget-lock" && audit.status !== "ready")) {
    return "overlay-budget-regression";
  }
  if (args.audits.some((audit) => audit.id === "v9-sky-boundary-lock" && audit.status !== "ready")) {
    return "v9-sky-boundary-regression";
  }
  if (args.audits.some((audit) => audit.id === "protected-mutation-lock" && audit.status !== "ready")) {
    return "protected-mutation-regression";
  }
  if (args.ready) return "gaia-overlay-pass";
  return "mixed";
}
