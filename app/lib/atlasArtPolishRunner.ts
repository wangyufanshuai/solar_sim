import {
  ATLAS_ART_POLISH_OPACITY_CAPS,
  V99_ART_POLISH_ROW,
  artPolishV9SkyBoundaryPreserved,
} from "./atlasArtPolish";
import { ATLAS_GAIA_STARFIELD_ENHANCEMENT_VERSION, ATLAS_GAIA_STARFIELD_RENDER_BUDGET } from "./atlasGaiaStarfieldEnhancement";
import { ATLAS_RELATIVITY_SIMULATION_OPTIMIZATION_VERSION } from "./atlasRelativitySimulationOptimization";
import type { AtlasArtPolishAudit, AtlasArtPolishRow } from "./simulationDiagnosticsTypes";

export function runAtlasArtPolishAudit(args: {
  packageScripts?: Readonly<Record<string, string>>;
  docsText?: string;
  surfaceText?: string;
  browserSpecText?: string;
} = {}): {
  audits: readonly AtlasArtPolishAudit[];
  rows: readonly AtlasArtPolishRow[];
} {
  const docsText = args.docsText ?? "";
  const surfaceText = args.surfaceText ?? "";
  const browserSpecText = args.browserSpecText ?? "";
  const combinedSurface = `${surfaceText}\n${browserSpecText}`;
  const audits = [
    gaiaLayerLock(args.packageScripts, surfaceText),
    constellationLayerLock(surfaceText),
    nebulaLayerLock(surfaceText),
    closeupReadabilityLock(surfaceText),
    mobileBudgetLock(surfaceText),
    v9SkyBoundaryLock(`${docsText}\n${surfaceText}`),
    docsSurfaceLock(docsText, combinedSurface),
    protectedMutationLock(surfaceText),
  ] as const satisfies readonly AtlasArtPolishAudit[];

  return {
    audits,
    rows: [artPolishRow(audits)],
  };
}

function gaiaLayerLock(
  packageScripts: Readonly<Record<string, string>> | undefined,
  surfaceText: string,
): AtlasArtPolishAudit {
  const ready =
    packageScripts?.["test:atlas:art-polish"] ===
      "vitest run app/lib/atlasArtPolish.horizons.test.ts" &&
    ATLAS_ART_POLISH_OPACITY_CAPS.mobile === 0.62 &&
    ATLAS_ART_POLISH_OPACITY_CAPS.balanced === 1.05 &&
    ATLAS_ART_POLISH_OPACITY_CAPS.dense === 1.2 &&
    ATLAS_ART_POLISH_OPACITY_CAPS.closeup === 0.18 &&
    surfaceText.includes("ATLAS_ART_POLISH_OPACITY_CAPS") &&
    surfaceText.includes("ATLAS_GAIA_STARFIELD_ENHANCEMENT_VERSION") &&
    ATLAS_GAIA_STARFIELD_ENHANCEMENT_VERSION === "v97-gaia-starfield-enhancement";
  return audit(
    "gaia-layer-lock",
    "Gaia overlay opacity polish",
    ready,
    ready ? "Gaia opacity caps and v97 dependency present" : "Gaia opacity polish missing",
    "Gaia opacity caps and v97 dependency present",
    "v99 may polish opacity, but must keep v97 Gaia render budgets fixed.",
  );
}

function constellationLayerLock(surfaceText: string): AtlasArtPolishAudit {
  const ready =
    surfaceText.includes("constellationLinePolicy") &&
    surfaceText.includes("lighter-overview-closeup-mobile-density") &&
    surfaceText.includes("qualityTier") &&
    surfaceText.includes("constellationMobileScale");
  return audit(
    "constellation-layer-lock",
    "Constellation line restraint policy",
    ready,
    ready ? "constellation overview/closeup/mobile restraint present" : "constellation polish missing",
    "constellation overview/closeup/mobile restraint present",
    "Constellation lines stay as presentation overlays and must not become dominant in closeups or mobile.",
  );
}

function nebulaLayerLock(surfaceText: string): AtlasArtPolishAudit {
  const ready =
    surfaceText.includes("nebulaMarkerPolicy") &&
    surfaceText.includes("overview-enhanced-closeup-mobile-restrained") &&
    surfaceText.includes("nebulaMobileScale");
  return audit(
    "nebula-layer-lock",
    "Nebula marker polish policy",
    ready,
    ready ? "nebula overview enhancement and closeup/mobile restraint present" : "nebula polish missing",
    "nebula overview enhancement and closeup/mobile restraint present",
    "Nebula markers remain presentation markers and must not imply physical gas simulation.",
  );
}

function closeupReadabilityLock(surfaceText: string): AtlasArtPolishAudit {
  const ready =
    surfaceText.includes("closeupReadabilityPolicy") &&
    surfaceText.includes("selected-body-background-deemphasized") &&
    surfaceText.includes("ATLAS_ART_POLISH_OPACITY_CAPS.closeup");
  return audit(
    "closeup-readability-lock",
    "Selected-body closeup readability policy",
    ready,
    ready ? "selected-body closeup background deemphasis present" : "closeup readability polish missing",
    "selected-body closeup background deemphasis present",
    "Selected-body closeups must remain readable by suppressing Gaia, constellation and nebula pressure.",
  );
}

function mobileBudgetLock(surfaceText: string): AtlasArtPolishAudit {
  const ready =
    ATLAS_GAIA_STARFIELD_RENDER_BUDGET.mobile === 1000 &&
    ATLAS_GAIA_STARFIELD_RENDER_BUDGET.balanced === 1800 &&
    ATLAS_GAIA_STARFIELD_RENDER_BUDGET.dense === 3000 &&
    surfaceText.includes("mobile-label-line-nebula-density-restrained");
  return audit(
    "mobile-budget-lock",
    "Mobile density and Gaia render budget",
    ready,
    `mobile ${ATLAS_GAIA_STARFIELD_RENDER_BUDGET.mobile}; balanced ${ATLAS_GAIA_STARFIELD_RENDER_BUDGET.balanced}; dense ${ATLAS_GAIA_STARFIELD_RENDER_BUDGET.dense}`,
    "mobile 1000; balanced 1800; dense 3000",
    "v99 must keep v97 Gaia render budgets fixed while reducing mobile visual density.",
  );
}

function v9SkyBoundaryLock(text: string): AtlasArtPolishAudit {
  const ready =
    artPolishV9SkyBoundaryPreserved() &&
    text.includes("ORBIT_ATLAS_SKY === ORBIT_ATLAS_V9_SKY") &&
    text.includes("GalaxyEnvironmentSphere legacy V9");
  return audit(
    "v9-sky-boundary-lock",
    "V9 sky and legacy background direction",
    ready,
    ready ? "V9 sky identity and legacy background boundary preserved" : "V9 sky boundary missing",
    "V9 sky identity and legacy background boundary preserved",
    "v99 is an overlay/presentation polish and must not replace V9 sky assets or background direction.",
  );
}

function docsSurfaceLock(docsText: string, surfaceText: string): AtlasArtPolishAudit {
  const ready =
    docsText.includes("v99 Art Polish") &&
    docsText.includes("presentation-only") &&
    docsText.includes("not NASA/JPL/Gaia/Universe Sandbox certification") &&
    surfaceText.includes("data-atlas-art-polish-version") &&
    surfaceText.includes("data-atlas-art-polish-strip") &&
    surfaceText.includes("data-atlas-art-polish-table") &&
    surfaceText.includes("art-polish") &&
    surfaceText.includes(ATLAS_RELATIVITY_SIMULATION_OPTIMIZATION_VERSION);
  return audit(
    "docs-surface-lock",
    "v99 docs, root DOM, Observable, Evidence, Validation and browser surface",
    ready,
    ready ? "v99 docs and surface markers present" : "v99 docs or surface marker missing",
    "v99 docs and surface markers present",
    "v99 documentation and surfaces must describe presentation-only art polish without certification claims.",
  );
}

function protectedMutationLock(surfaceText: string): AtlasArtPolishAudit {
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
    "Protected art polish mutation flags",
    ready,
    ready ? "all protected art polish mutation flags not-applied" : "protected art polish mutation flag missing",
    "all protected art polish mutation flags not-applied",
    "The v99 contract must keep physics, fixture, budget, sky, background, material and certification mutation flags not-applied.",
  );
}

function artPolishRow(audits: readonly AtlasArtPolishAudit[]): AtlasArtPolishRow {
  const statusFor = (ids: readonly AtlasArtPolishAudit["id"][]) =>
    audits.filter((auditItem) => ids.includes(auditItem.id)).every((auditItem) => auditItem.status === "ready")
      ? "pass"
      : "fail";
  const ready = audits.every((auditItem) => auditItem.status === "ready");
  return {
    ...V99_ART_POLISH_ROW,
    status: ready ? "complete" : "blocked",
    gaiaLayerStatus: statusFor(["gaia-layer-lock"]),
    constellationLayerStatus: statusFor(["constellation-layer-lock"]),
    nebulaLayerStatus: statusFor(["nebula-layer-lock"]),
    closeupReadabilityStatus: statusFor(["closeup-readability-lock"]),
    mobileBudgetStatus: statusFor(["mobile-budget-lock"]),
    v9SkyBoundaryStatus: statusFor(["v9-sky-boundary-lock"]),
    docsSurfaceStatus: statusFor(["docs-surface-lock"]),
    protectedMutationStatus: statusFor(["protected-mutation-lock"]),
    artPolish: "applied-presentation-layer-only",
  };
}

function audit(
  id: AtlasArtPolishAudit["id"],
  label: string,
  ready: boolean,
  measured: string,
  expected: string,
  trustedBoundary: string,
): AtlasArtPolishAudit {
  return {
    id,
    label,
    status: ready ? "ready" : "regressed",
    measured,
    expected,
    trustedBoundary,
  };
}

export function v99ArtPolishCommandContract(): Readonly<{
  focusedCommand: "npm run test:atlas:art-polish";
  browserFreshCommand: "npm run test:atlas:browser:fresh";
  mobileOpacityCap: 0.62;
  balancedOpacityCap: 1.05;
  denseOpacityCap: 1.2;
  closeupOpacityCap: 0.18;
}> {
  return {
    focusedCommand: "npm run test:atlas:art-polish",
    browserFreshCommand: "npm run test:atlas:browser:fresh",
    mobileOpacityCap: ATLAS_ART_POLISH_OPACITY_CAPS.mobile,
    balancedOpacityCap: ATLAS_ART_POLISH_OPACITY_CAPS.balanced,
    denseOpacityCap: ATLAS_ART_POLISH_OPACITY_CAPS.dense,
    closeupOpacityCap: ATLAS_ART_POLISH_OPACITY_CAPS.closeup,
  };
}
