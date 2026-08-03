/* v250 Evidence Ledger domain: visual. */
import { ATLAS_ART_POLISH_VERSION, createAtlasArtPolishSummary } from "../atlasArtPolish";
import { ATLAS_CAMERA_STELLAR_CLOSEUP_VERSION, createAtlasCameraStellarCloseupSummary } from "../atlasCameraStellarCloseupLock";
import { ATLAS_CHINESE_DEEP_SPACE_FIDELITY_VERSION, createAtlasChineseDeepSpaceFidelitySummary } from "../atlasChineseDeepSpaceFidelity";
import { ATLAS_CINEMATIC_CLOSEUP_DIRECTOR_VERSION, createAtlasCinematicCloseupDirectorSummary } from "../atlasCinematicCloseupDirector";
import { ATLAS_CINEMATIC_DEEP_SPACE_BACKDROP_VERSION, createAtlasCinematicDeepSpaceBackdropSummary } from "../atlasCinematicDeepSpaceBackdrop";
import { ATLAS_CINEMATIC_DEEP_SPACE_CAMERA_VERSION, createAtlasCinematicDeepSpaceCameraSummary } from "../atlasCinematicDeepSpaceCamera";
import { ATLAS_CINEMATIC_KEY_LIGHT_DIRECTOR_VERSION, createAtlasCinematicKeyLightDirectorSummary } from "../atlasCinematicKeyLightDirector";
import { ATLAS_CINEMATIC_LIGHTING_COMPOSITION_VERSION, createAtlasCinematicLightingCompositionSummary } from "../atlasCinematicLightingComposition";
import { ATLAS_CINEMATIC_PLANETARY_ART_DIRECTION_VERSION, createAtlasCinematicPlanetaryArtDirectionSummary } from "../atlasCinematicPlanetaryArtDirection";
import { ATLAS_CINEMATIC_WORKBENCH_VERSION, createAtlasCinematicWorkbenchSummary } from "../atlasCinematicWorkbench";
import { ATLAS_CLOSEUP_PRESENTATION_TRUTH_VERSION, createAtlasCloseupPresentationTruthSummary } from "../atlasCloseupPresentationTruth";
import { ATLAS_CLOSEUP_VISUAL_FIDELITY_VERSION, createAtlasCloseupVisualFidelitySummary } from "../atlasCloseupVisualFidelity";
import { ATLAS_FINAL_GAIA_ART_ENHANCEMENT_VERSION, createAtlasFinalGaiaArtEnhancementSummary } from "../atlasFinalGaiaArtEnhancementLock";
import { ATLAS_GAIA_STARFIELD_ENHANCEMENT_VERSION, createAtlasGaiaStarfieldEnhancementSummary } from "../atlasGaiaStarfieldEnhancement";
import { ATLAS_INTERACTION_VISUAL_QUALITY_VERSION, createAtlasInteractionVisualQualitySummary } from "../atlasInteractionVisualQualityLock";
import { ATLAS_PLANETARY_COLOR_GRADING_VERSION, createAtlasPlanetaryColorGradingSummary } from "../atlasPlanetaryColorGrading";
import { ATLAS_PLANETARY_DEPTH_LIGHTING_VERSION, createAtlasPlanetaryDepthLightingSummary } from "../atlasPlanetaryDepthLighting";
import { ATLAS_PLANETARY_MATERIAL_COMPOSITION_VERSION, createAtlasPlanetaryMaterialCompositionSummary } from "../atlasPlanetaryMaterialComposition";
import { ATLAS_PLANETARY_VISUAL_FIDELITY_VERSION, createAtlasPlanetaryVisualFidelitySummary } from "../atlasPlanetaryVisualFidelity";
import { ATLAS_REFERENCE_GRADE_SPACE_ART_VERSION, createAtlasReferenceGradeSpaceArtSummary } from "../atlasReferenceGradeSpaceArt";
import { ATLAS_SPARSE_DEEP_SPACE_DIRECTOR_VERSION, createAtlasSparseDeepSpaceDirectorSummary } from "../atlasSparseDeepSpaceDirector";
import { ATLAS_UNIVERSE_SANDBOX_REFERENCE_BACKDROP_VERSION, createAtlasUniverseSandboxReferenceBackdropSummary } from "../atlasUniverseSandboxReferenceBackdrop";
import { ATLAS_VISUAL_LAUNCH_PERFORMANCE_VERSION, createAtlasVisualLaunchPerformanceSummary } from "../atlasVisualLaunchPerformanceLock";
import type { EvidenceClaim } from "../simulationDiagnosticsTypes";
import { createPassport, metric, withPassport } from "./shared";
import type { EvidenceClaimWithoutPassport } from "./shared";

export function gaiaStarfieldEnhancementClaim(): EvidenceClaim {
  const summary = createAtlasGaiaStarfieldEnhancementSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "gaia-starfield-enhancement",
    group: "gaia-starfield-enhancement",
    title: "Gaia Starfield / Constellation Enhancement",
    status: "informational",
    confidence: "catalog-backed",
    source: `Atlas Gaia Starfield Enhancement ${ATLAS_GAIA_STARFIELD_ENHANCEMENT_VERSION}`,
    model:
      "Budgeted Gaia bright-star, IAU constellation and curated nebula presentation overlay over the v96 baseline",
    metric: `${summary.status}; ${summary.classification}; budget ${summary.activeGaiaRenderBudget}; constellations ${summary.normalizedIauConstellationCount}/88; nebulae ${summary.nebulaMarkerCount}`,
    error:
      "No runtime command result or official catalog certification is claimed by the app; measured overlay locks are produced by the separate heavy v97 command.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "runAtlasGaiaStarfieldEnhancementAudit",
        "public/data/gaia-dr3-bright-5000.json",
        "public/data/gaia-dr3-kinematics-2000.json",
        "app/data/constellationCatalog.ts",
        "app/data/nebulaCatalog.ts",
        "GaiaStarOverlay",
        ATLAS_GAIA_STARFIELD_ENHANCEMENT_VERSION,
      ],
      method:
        "Audit packaged Gaia row counts, 88-constellation normalized presentation contract, curated nebula marker count, fixed mobile/balanced/dense star budgets, V9 sky identity, docs, root DOM markers, Observable Atlas markers, Evidence claim text, Validation domain text, browser acceptance markers and protected mutation flags.",
      metrics: [
        metric("gaia-starfield-enhancement-version", "Gaia overlay version", summary.version, claim.status),
        metric("gaia-starfield-enhancement-profile", "Gaia overlay profile", summary.overlayProfile, claim.status),
        metric("gaia-starfield-enhancement-status", "Gaia overlay status", summary.status, claim.status),
        metric("gaia-starfield-enhancement-classification", "Classification", summary.classification, claim.status),
        metric("gaia-overlay-quality-tier", "Quality tier", summary.qualityTier, claim.status),
        metric("gaia-overlay-active-budget", "Active Gaia render budget", String(summary.activeGaiaRenderBudget), claim.status),
        metric("gaia-overlay-mobile-budget", "Mobile Gaia render budget", String(summary.renderBudget.mobile), claim.status),
        metric("gaia-overlay-balanced-budget", "Balanced Gaia render budget", String(summary.renderBudget.balanced), claim.status),
        metric("gaia-overlay-dense-budget", "Dense Gaia render budget", String(summary.renderBudget.dense), claim.status),
        metric("gaia-bright-row-count", "Packaged Gaia bright rows", String(summary.packagedGaiaBrightRowCount), claim.status),
        metric("gaia-kinematics-row-count", "Packaged Gaia kinematics rows", String(summary.packagedGaiaKinematicsRowCount), claim.status),
        metric("normalized-iau-constellation-count", "Normalized IAU constellation count", String(summary.normalizedIauConstellationCount), claim.status),
        metric("constellation-render-group-count", "Constellation render groups", String(summary.constellationRenderGroupCount), claim.status),
        metric("nebula-marker-count", "Curated nebula markers", String(summary.nebulaMarkerCount), claim.status),
        metric("default-activation-policy", "Default activation policy", summary.defaultActivationPolicy, claim.status),
        metric("mobile-downgrade-policy", "Mobile downgrade policy", summary.mobileDowngradePolicy, claim.status),
        metric("closeup-suppression-policy", "Closeup suppression policy", summary.closeupSuppressionPolicy, claim.status),
        metric("full-gaia-archive-policy", "Full Gaia archive policy", summary.fullGaiaArchivePolicy, claim.status),
        metric("official-certification-policy", "Official certification policy", summary.officialCertificationPolicy, claim.status),
        metric("gaia-starfield-enhancement", "Gaia starfield enhancement", summary.gaiaStarfieldEnhancement, claim.status),
        metric("live-physics-mutation", "Live physics mutation", summary.livePhysicsMutation, claim.status),
        metric("worker-physics-mutation", "Worker physics mutation", summary.workerPhysicsMutation, claim.status),
        metric("rk4-default-mutation", "RK4 runtime default mutation", summary.rk4DefaultMutation, claim.status),
        metric("eih-one-pn-mutation", "EIH 1PN mutation", summary.eihOnePnMutation, claim.status),
        metric("kerr-kernel-mutation", "Kerr kernel mutation", summary.kerrKernelMutation, claim.status),
        metric("sky-asset-mutation", "Sky asset mutation", summary.skyAssetMutation, claim.status),
        metric("background-mutation", "Background mutation", summary.backgroundMutation, claim.status),
        metric("v9-sky-direction-mutation", "V9 sky direction mutation", summary.v9SkyDirectionMutation, claim.status),
        metric("fixture-data-mutation", "Fixture data mutation", summary.fixtureDataMutation, claim.status),
        metric("budget-mutation", "Budget mutation", summary.budgetMutation, claim.status),
        metric("certification-claim-mutation", "Certification claim mutation", summary.certificationClaimMutation, claim.status),
      ],
      confidenceRationale:
        "Catalog-backed for the packaged Gaia subset and local curated catalogs; the runtime claim remains informational until the separate v97 heavy audit is run.",
      assumptions: [
        "v97 is a presentation overlay after the v96 maintenance baseline, not a scientific gate or model migration.",
        "Gaia bright 5000 and Gaia kinematics 2000 are packaged subsets, not the full Gaia archive.",
        "ORBIT_ATLAS_SKY === ORBIT_ATLAS_V9_SKY and GalaxyEnvironmentSphere legacy V9 background direction remain protected.",
      ],
      limitations: [
        "Does not claim Gaia official certification, NASA/JPL certification, full-archive completeness, online validation, or latest command pass/fail from inside the runtime app.",
        "Does not regenerate fixtures, mutate live physics, alter RK4/EIH/Kerr, replace sky/background assets, or relax v75 budgets.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}


export function artPolishClaim(): EvidenceClaim {
  const summary = createAtlasArtPolishSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "art-polish",
    group: "art-polish",
    title: "Art Polish",
    status: "informational",
    confidence: "visual",
    source: `Atlas Art Polish ${ATLAS_ART_POLISH_VERSION}`,
    model:
      "Presentation-only Gaia overlay, constellation, nebula, selected-body closeup and mobile density polish",
    metric: `${summary.status}; ${summary.classification}; opacity mobile ${summary.opacityCaps.mobile}; dense ${summary.opacityCaps.dense}; closeup ${summary.opacityCaps.closeup}`,
    error:
      "No runtime command result, scientific model upgrade or official visual certification is claimed by the app; measured art polish locks are produced by the separate heavy v99 command.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "runAtlasArtPolishAudit",
        "GaiaStarOverlay",
        "ConstellationLines",
        "NebulaMarkers",
        "UniverseScene",
        ATLAS_ART_POLISH_VERSION,
      ],
      method:
        "Audit Gaia opacity caps, v97 Gaia render budgets, constellation line restraint, nebula marker polish, selected-body closeup deemphasis, mobile label/line/nebula density restraint, V9 sky identity, docs, root DOM markers, Observable Atlas markers, Evidence claim text, Validation domain text, browser acceptance markers and protected mutation flags.",
      metrics: [
        metric("art-polish-version", "Art polish version", summary.version, claim.status),
        metric("art-polish-profile", "Art polish profile", summary.artPolishProfile, claim.status),
        metric("art-polish-status", "Art polish status", summary.status, claim.status),
        metric("art-polish-classification", "Classification", summary.classification, claim.status),
        metric("gaia-mobile-budget", "Gaia mobile render budget", String(summary.gaiaRenderBudget.mobile), claim.status),
        metric("gaia-balanced-budget", "Gaia balanced render budget", String(summary.gaiaRenderBudget.balanced), claim.status),
        metric("gaia-dense-budget", "Gaia dense render budget", String(summary.gaiaRenderBudget.dense), claim.status),
        metric("mobile-opacity-cap", "Mobile opacity cap", String(summary.opacityCaps.mobile), claim.status),
        metric("balanced-opacity-cap", "Balanced opacity cap", String(summary.opacityCaps.balanced), claim.status),
        metric("dense-opacity-cap", "Dense opacity cap", String(summary.opacityCaps.dense), claim.status),
        metric("closeup-opacity-cap", "Closeup opacity cap", String(summary.opacityCaps.closeup), claim.status),
        metric("constellation-line-policy", "Constellation line policy", summary.constellationLinePolicy, claim.status),
        metric("nebula-marker-policy", "Nebula marker policy", summary.nebulaMarkerPolicy, claim.status),
        metric("closeup-readability-policy", "Closeup readability policy", summary.closeupReadabilityPolicy, claim.status),
        metric("mobile-density-policy", "Mobile density policy", summary.mobileDensityPolicy, claim.status),
        metric("official-certification-policy", "Official certification policy", summary.officialCertificationPolicy, claim.status),
        metric("art-polish", "Art polish", summary.artPolish, claim.status),
        metric("live-physics-mutation", "Live physics mutation", summary.livePhysicsMutation, claim.status),
        metric("worker-physics-mutation", "Worker physics mutation", summary.workerPhysicsMutation, claim.status),
        metric("rk4-default-mutation", "RK4 runtime default mutation", summary.rk4DefaultMutation, claim.status),
        metric("eih-one-pn-mutation", "EIH 1PN mutation", summary.eihOnePnMutation, claim.status),
        metric("kerr-kernel-mutation", "Kerr kernel mutation", summary.kerrKernelMutation, claim.status),
        metric("sky-asset-mutation", "Sky asset mutation", summary.skyAssetMutation, claim.status),
        metric("background-mutation", "Background mutation", summary.backgroundMutation, claim.status),
        metric("v9-sky-direction-mutation", "V9 sky direction mutation", summary.v9SkyDirectionMutation, claim.status),
        metric("fixture-data-mutation", "Fixture data mutation", summary.fixtureDataMutation, claim.status),
        metric("budget-mutation", "Budget mutation", summary.budgetMutation, claim.status),
        metric("certification-claim-mutation", "Certification claim mutation", summary.certificationClaimMutation, claim.status),
      ],
      confidenceRationale:
        "Visual confidence only: v99 adjusts local presentation-layer opacity and density policies while leaving scientific and asset certification outside the runtime claim.",
      assumptions: [
        "v99 is presentation-only art polish, not a scientific gate, physics model, fixture, release artifact or sky replacement version.",
        "v97 Gaia render budgets remain mobile 1000, balanced 1800 and dense 3000.",
        "ORBIT_ATLAS_SKY === ORBIT_ATLAS_V9_SKY and GalaxyEnvironmentSphere legacy V9 background direction remain protected.",
      ],
      limitations: [
        "Does not mutate live physics, worker physics, RK4/DP, EIH 1PN, Kerr kernel id, Horizons fixtures, v75 budgets, V9 sky/background direction or release packaging.",
        "Does not claim NASA/JPL/Gaia/Universe Sandbox certification, AAA certification, online validation, or latest command pass/fail from inside the runtime app.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}


export function finalGaiaArtEnhancementLockClaim(): EvidenceClaim {
  const summary = createAtlasFinalGaiaArtEnhancementSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "final-gaia-art-enhancement-lock",
    group: "final-gaia-art-enhancement-lock",
    title: "Final Gaia Art Enhancement Lock",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Final Gaia Art Enhancement Lock ${ATLAS_FINAL_GAIA_ART_ENHANCEMENT_VERSION}`,
    model:
      "Budget-preserved Gaia star selection and presentation art polish over v104 with frozen Gaia budgets and opacity caps",
    metric: `${summary.status}; ${summary.classification}; ${summary.gaiaSelectionPolicy}; ${summary.gaiaVisualMappingPolicy}`,
    error:
      "No runtime command result, browser pass/fail, scientific gate change, fixture update, runtime physics change, Gaia budget increase, sky replacement or official certification is claimed by the app; measured locks are produced by the separate heavy v105 command.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "runAtlasFinalGaiaArtEnhancementAudit",
        "runAtlasBrowserAcceptanceRuntimeCostAudit",
        ATLAS_FINAL_GAIA_ART_ENHANCEMENT_VERSION,
      ],
      method:
        "Reuse the v104 heavy audit, then statically audit deterministic Gaia ranking, Gaia brightness/color mapping, constellation/nebula readability markers, browser QA markers, frozen v97/v99 budget boundaries, docs, root DOM markers, Observable Atlas markers, Evidence claim text, Validation domain text and protected mutation flags.",
      metrics: [
        metric("final-gaia-art-enhancement-version", "Final Gaia art enhancement version", summary.version, claim.status),
        metric("final-gaia-art-enhancement-profile", "Final Gaia art enhancement profile", summary.finalGaiaArtEnhancementProfile, claim.status),
        metric("final-gaia-art-enhancement-status", "Final Gaia art enhancement status", summary.status, claim.status),
        metric("final-gaia-art-enhancement-classification", "Classification", summary.classification, claim.status),
        metric("browser-acceptance-runtime-cost-version", "v104 browser acceptance runtime cost version", summary.browserAcceptanceRuntimeCostVersion, claim.status),
        metric("gaia-enhancement-version", "v97 Gaia enhancement version", summary.gaiaEnhancementVersion, claim.status),
        metric("art-polish-version", "v99 art polish version", summary.artPolishVersion, claim.status),
        metric("gaia-render-budget", "Gaia render budget", `${summary.gaiaRenderBudget.mobile}/${summary.gaiaRenderBudget.balanced}/${summary.gaiaRenderBudget.dense}`, claim.status),
        metric("opacity-caps", "Opacity caps", `${summary.opacityCaps.mobile}/${summary.opacityCaps.balanced}/${summary.opacityCaps.dense}/${summary.opacityCaps.closeup}`, claim.status),
        metric("gaia-selection-policy", "Gaia selection policy", summary.gaiaSelectionPolicy, claim.status),
        metric("gaia-visual-mapping-policy", "Gaia visual mapping policy", summary.gaiaVisualMappingPolicy, claim.status),
        metric("browser-qa-policy", "Browser QA policy", summary.browserQaPolicy, claim.status),
        metric("focused-command", "Focused audit command", summary.focusedCommand, claim.status),
        metric("verify-command", "Final Gaia art verify command", summary.finalGaiaArtVerifyCommand, claim.status),
        metric("screenshot-artifact-directory", "Screenshot artifact directory", summary.screenshotArtifactDirectory, claim.status),
        metric("final-gaia-art-enhancement", "Allowed v105 change", summary.finalGaiaArtEnhancement, claim.status),
        metric("live-physics-mutation", "Live physics mutation", summary.livePhysicsMutation, claim.status),
        metric("worker-physics-mutation", "Worker physics mutation", summary.workerPhysicsMutation, claim.status),
        metric("rk4-default-mutation", "RK4 runtime default mutation", summary.rk4DefaultMutation, claim.status),
        metric("eih-one-pn-mutation", "EIH 1PN mutation", summary.eihOnePnMutation, claim.status),
        metric("kerr-kernel-mutation", "Kerr kernel mutation", summary.kerrKernelMutation, claim.status),
        metric("sky-asset-mutation", "Sky asset mutation", summary.skyAssetMutation, claim.status),
        metric("background-mutation", "Background mutation", summary.backgroundMutation, claim.status),
        metric("v9-sky-direction-mutation", "V9 sky direction mutation", summary.v9SkyDirectionMutation, claim.status),
        metric("fixture-data-mutation", "Fixture data mutation", summary.fixtureDataMutation, claim.status),
        metric("budget-mutation", "Budget mutation", summary.budgetMutation, claim.status),
        metric("release-packaging-mutation", "Release packaging mutation", summary.releasePackagingMutation, claim.status),
        metric("certification-claim-mutation", "Certification claim mutation", summary.certificationClaimMutation, claim.status),
      ],
      confidenceRationale:
        "Formula-checked because v105 exposes deterministic metadata and its focused command statically audits local source, docs and browser marker contracts; runtime remains informational until the separate v105 heavy audit is run.",
      assumptions: [
        "v105 is a final presentation/data polish lock, not a scientific gate, fixture, physics model, release artifact, sky replacement or Gaia budget increase.",
        "Gaia star rendering keeps the v97 base budgets of 1000/1800/3000 and the v99 opacity caps of 0.62/1.05/1.20/0.18.",
        "The packaged Gaia files are local curated data, not the full Gaia archive and not an official Gaia/NASA/JPL certification.",
      ],
      limitations: [
        "Does not mutate live physics, worker physics, RK4/DP, EIH 1PN, Kerr kernel id, Horizons fixtures, v75 budgets, V9 sky/background direction, v97 Gaia budgets or v99 opacity caps.",
        "Does not loosen browser pixel thresholds, screenshot retry count, pixel settle policy, root/Observable/Evidence/Validation marker coverage, console/page-error checks or fresh 3015 teardown.",
        "Does not claim NASA/JPL/Gaia/Universe Sandbox certification, online validation, latest command pass/fail from inside the runtime app, or a release archive.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}


export function interactionVisualQualityLockClaim(): EvidenceClaim {
  const summary = createAtlasInteractionVisualQualitySummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "interaction-visual-quality-lock",
    group: "interaction-visual-quality-lock",
    title: "Interaction Freedom / Launch Visual / Gaia Material Lock",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Interaction Visual Quality ${ATLAS_INTERACTION_VISUAL_QUALITY_VERSION}`,
    model:
      "User-overridable focus locks, launch auto/manual camera, procedural launch visuals and Gaia/local stellar material profiles",
    metric: `${summary.status}; ${summary.cameraFreedomPolicy}; ${summary.launchVisualPolicy}; ${summary.stellarMaterialPolicy}`,
    error:
      "Runtime browser results remain external; all upgraded visuals are presentation/local UX and do not mutate physics, fixtures, sky or Gaia budgets.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "runAtlasInteractionVisualQualityAudit",
        "runAtlasInteractionRepairLaunchUxAudit",
        ATLAS_INTERACTION_VISUAL_QUALITY_VERSION,
      ],
      method:
        "Reuse the v108 audit, then statically verify user-overridable body/sky locks, launch auto-follow/manual-orbit controls, procedural rocket/satellite markers, stellar material profiles, docs/surface markers and protected mutation flags.",
      metrics: [
        metric("interaction-visual-quality-version", "Version", summary.version, claim.status),
        metric("camera-freedom-policy", "Camera freedom", summary.cameraFreedomPolicy, claim.status),
        metric("launch-camera-policy", "Launch camera", summary.launchCameraPolicy, claim.status),
        metric("launch-visual-policy", "Launch visual", summary.launchVisualPolicy, claim.status),
        metric("stellar-material-policy", "Stellar material", summary.stellarMaterialPolicy, claim.status),
        metric("gaia-budget-policy", "Gaia budget", summary.gaiaBudgetPolicy, claim.status),
      ],
      confidenceRationale:
        "Formula-checked for deterministic local presentation contracts; runtime pass/fail is produced by the separate v109 heavy command and browser QA.",
      assumptions: [
        "Gaia and local stellar visual material is a presentation shader/profile, not a physical stellar model.",
        "Launch visuals continue to reuse existing local launch physics and spacecraft handoff.",
      ],
      limitations: [
        "No scientific gate, fixture, live/worker physics, RK4/DP, EIH 1PN, Kerr, V9 sky/background, Gaia point budget or v99 opacity cap mutation.",
        "No external GLB download, runtime network catalog, release packaging, staging or commit operation.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}


export function cameraStellarCloseupLockClaim(): EvidenceClaim {
  const summary = createAtlasCameraStellarCloseupSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "camera-stellar-closeup-lock",
    group: "camera-stellar-closeup-lock",
    title: "Camera Close-up / Stellar Portrait Lock",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Camera Stellar Closeup ${ATLAS_CAMERA_STELLAR_CLOSEUP_VERSION}`,
    model:
      "Target-anchor camera rig plus Gaia/local stellar close-up portraits from catalog-derived visual material",
    metric: `${summary.status}; ${summary.cameraRigPolicy}; ${summary.stellarPortraitPolicy}; ${summary.closeupPerformancePolicy}`,
    error:
      "Runtime browser results remain external; stellar portraits are display material and do not claim resolved stellar surfaces.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "runAtlasCameraStellarCloseupAudit",
        ATLAS_CAMERA_STELLAR_CLOSEUP_VERSION,
      ],
      method:
        "Statically verify target-anchor camera policy, selected stellar portrait markers, close-up label suppression markers and protected mutation flags.",
      metrics: [
        metric("camera-stellar-version", "Version", summary.version, claim.status),
        metric("camera-rig-policy", "Camera rig", summary.cameraRigPolicy, claim.status),
        metric("stellar-portrait-policy", "Stellar portrait", summary.stellarPortraitPolicy, claim.status),
        metric("closeup-performance-policy", "Close-up performance", summary.closeupPerformancePolicy, claim.status),
        metric("gaia-budget-policy", "Gaia budget", summary.gaiaBudgetPolicy, claim.status),
      ],
      confidenceRationale:
        "Formula-checked for deterministic camera and presentation contracts; runtime pass/fail is produced by the separate v111 heavy command and browser QA.",
      assumptions: [
        "Gaia BP-RP/G magnitude/parallax feed presentation colors and labels, not a physical stellar surface model.",
      ],
      limitations: [
        "No scientific gate, fixture, live/worker physics, RK4/DP, EIH 1PN, Kerr, sky, Gaia budget or opacity-cap mutation.",
      ],
      relatedViews: ["relativity-observables", "evidence-ledger"],
    }),
  );
}


export function visualLaunchPerformanceLockClaim(): EvidenceClaim {
  const summary = createAtlasVisualLaunchPerformanceSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "visual-launch-performance-lock",
    group: "visual-launch-performance-lock",
    title: "Visual Launch Performance Lock",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Visual Launch Performance ${ATLAS_VISUAL_LAUNCH_PERFORMANCE_VERSION}`,
    model:
      "Presentation-layer quality governor, LaunchSequenceDirector staging HUD and offline OpenRocket import boundary",
    metric: `${summary.status}; ${summary.qualityTier}; ${summary.launchDirectorPolicy}; ${summary.runtimeQualityPolicy}; ${summary.openRocketBridgePolicy}`,
    error:
      "Runtime browser results remain external; v114 changes only UI, rendering schedule, camera presentation and launch visuals.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "runAtlasVisualLaunchPerformanceAudit",
        ATLAS_VISUAL_LAUNCH_PERFORMANCE_VERSION,
        summary.profile,
      ],
      method:
        "Statically verify readable launch copy, root/runtime markers, staged launch director, presentation quality tiers, OpenRocket offline import policy and protected mutation flags.",
      metrics: [
        metric("visual-launch-performance-version", "Version", summary.version, claim.status),
        metric("visual-launch-performance-profile", "Profile", summary.profile, claim.status),
        metric("visual-launch-performance-status", "Status", summary.status, claim.status),
        metric("visual-launch-performance-classification", "Classification", summary.classification, claim.status),
        metric("visual-launch-performance-quality-tier", "Quality tier", summary.qualityTier, claim.status),
        metric("launch-director-policy", "Launch director", summary.launchDirectorPolicy, claim.status),
        metric("runtime-quality-policy", "Runtime quality", summary.runtimeQualityPolicy, claim.status),
        metric("launch-scene-performance-policy", "Launch scene performance", summary.launchScenePerformancePolicy, claim.status),
        metric("openrocket-policy", "OpenRocket policy", summary.openRocketBridgePolicy, claim.status),
        metric("telemetry-provider-policy", "Telemetry provider", summary.telemetryProviderPolicy, claim.status),
        metric("stellar-closeup-policy", "Stellar close-up", summary.stellarCloseupPolicy, claim.status),
        metric("budget-policy", "Budget policy", summary.budgetPolicy, claim.status),
        metric("browser-exe-launch", "Browser exe launch", summary.browserExeLaunch, claim.status),
        metric("gui-automation-mutation", "GUI automation mutation", summary.guiAutomationMutation, claim.status),
        metric("live-physics-mutation", "Live physics mutation", summary.livePhysicsMutation, claim.status),
        metric("worker-physics-mutation", "Worker physics mutation", summary.workerPhysicsMutation, claim.status),
        metric("rk4-default-mutation", "RK4 default mutation", summary.rk4DefaultMutation, claim.status),
        metric("eih-one-pn-mutation", "EIH 1PN mutation", summary.eihOnePnMutation, claim.status),
        metric("kerr-kernel-mutation", "Kerr mutation", summary.kerrKernelMutation, claim.status),
        metric("fixture-data-mutation", "Fixture data mutation", summary.fixtureDataMutation, claim.status),
        metric("v9-sky-direction-mutation", "V9 sky direction mutation", summary.v9SkyDirectionMutation, claim.status),
        metric("gaia-render-budget-mutation", "Gaia budget mutation", summary.gaiaRenderBudgetMutation, claim.status),
        metric("gaia-opacity-cap-mutation", "Gaia opacity cap mutation", summary.gaiaOpacityCapMutation, claim.status),
        metric("staging-mutation", "Staging mutation", summary.stagingMutation, claim.status),
        metric("commit-mutation", "Commit mutation", summary.commitMutation, claim.status),
      ],
      confidenceRationale:
        "Formula-checked for deterministic presentation contracts; runtime pass/fail is produced by the separate v114 heavy command and browser QA.",
      assumptions: [
        "Quality tiers affect only labels, particles, HUD cadence and nonessential presentation layers.",
        "OpenRocket data is imported from local/exported files; the browser does not launch the desktop executable.",
      ],
      limitations: [
        "No scientific gate, fixture, live/worker physics, RK4/DP, EIH 1PN, Kerr, V9 sky/background, v75/v97/v99 budget, release packaging, staging or commit mutation.",
      ],
      relatedViews: ["telemetry", "evidence-ledger"],
    }),
  );
}


export function cinematicVisualSystemClaim(): EvidenceClaim {
  const summary = createAtlasCinematicWorkbenchSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "cinematic-visual-system",
    group: "cinematic-visual-system",
    title: "Cinematic Scientific Workbench",
    status: "informational",
    confidence: "visual",
    source: `Atlas Cinematic Scientific Workbench ${ATLAS_CINEMATIC_WORKBENCH_VERSION}`,
    model: "Local scientific-instrument cinematic visual system over existing presentation layers",
    metric: `${summary.visualTarget}; ${summary.qualityTarget}; ${summary.aaBoundaryPreserved}`,
    error: "No scientific error budget; this is art direction and presentation metadata only.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        `Atlas Cinematic Scientific Workbench ${summary.version}`,
        "Orbit Atlas v12 presentation renderer",
        "v41 accessible workbench surface scope",
        "Existing sky, orbit, label, HUD and workbench presentation layers",
      ],
      method:
        "Apply a local visual-system reset to presentation rendering and workbench skinning while preserving existing action ids, accessibility semantics, evidence boundaries and physics kernels.",
      metrics: [
        metric("visual-version", "Visual system version", summary.version, claim.status),
        metric("visual-target", "Visual target", summary.visualTarget, claim.status),
        metric("quality-target", "Quality target", summary.qualityTarget, claim.status),
        metric("aa-boundary", "AA boundary", summary.aaBoundaryPreserved, claim.status),
        metric("scene-policy", "Scene policy", summary.scenePolicy, claim.status),
        metric("runtime-certification", "Runtime certification", summary.runtimeCertificationStatus, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
      ],
      confidenceRationale:
        "Visual confidence only: the layer is deterministic local presentation metadata and deliberately avoids certification, command-result, online-validation and science claims.",
      assumptions: [
        "Existing local textures and shader paths are sufficient for the v42 art direction pass.",
        "v41 opaque accessible workbench surfaces remain the contrast boundary for data panels.",
      ],
      limitations: [
        "Does not create a new physics model, numerical solver, sky catalog, or online validation source.",
        "Does not claim AAA production certification, WCAG certification, scientific certification, CI status, or latest runtime command status.",
        "Does not mutate SolarSystemIntegrator, physicsEngine, EIH 1PN dynamics, worker physics or the Kerr geodesic kernel.",
      ],
      relatedViews: ["evidence-ledger", "telemetry"],
    }),
  );
}


export function planetaryVisualFidelityClaim(): EvidenceClaim {
  const summary = createAtlasPlanetaryVisualFidelitySummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "planetary-visual-fidelity",
    group: "planetary-visual-fidelity",
    title: "Planetary close-up visual fidelity",
    status: "informational",
    confidence: "visual",
    source: `Atlas Planetary Visual Fidelity ${ATLAS_PLANETARY_VISUAL_FIDELITY_VERSION}`,
    model: "Selected-body close-up and deep-space background presentation profile over existing local render layers",
    metric: `${summary.visualTarget}; ${summary.styleTarget}; ${summary.assetPolicy}`,
    error: "No scientific error budget; this is local visual fidelity metadata and presentation tuning only.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        `Atlas Planetary Visual Fidelity ${summary.version}`,
        "Selected-body HD texture manifest and local public texture assets",
        "Planet, SunBody, GalaxyEnvironmentSphere and ScienceBackdrop presentation layers",
        "v41 accessible workbench and v42 cinematic visual system boundaries",
      ],
      method:
        "Describe the local selected-body close-up visual profile, restrained scientific-instrument style, runtime local texture policy, and close-up sky dimming without claiming online validation or mutating physics.",
      metrics: [
        metric("visual-fidelity-version", "Visual fidelity version", summary.version, claim.status),
        metric("visual-target", "Visual target", summary.visualTarget, claim.status),
        metric("style-target", "Style target", summary.styleTarget, claim.status),
        metric("asset-policy", "Asset policy", summary.assetPolicy, claim.status),
        metric("runtime-assets", "Runtime assets", summary.runtimeAssetSource, claim.status),
        metric("closeup-priority", "Close-up priority", summary.closeupPriority, claim.status),
        metric("sky-closeup-profile", "Sky close-up profile", summary.skyCloseupProfile, claim.status),
        metric("aa-boundary", "AA boundary", summary.aaBoundaryPreserved, claim.status),
        metric("cinematic-boundary", "Cinematic boundary", summary.cinematicBoundaryPreserved, claim.status),
        metric("runtime-certification", "Runtime certification", summary.runtimeCertificationStatus, claim.status),
        metric("scientific-certification", "Scientific certification", summary.scientificCertificationStatus, claim.status),
        metric("online-validation", "Online validation", summary.onlineValidationStatus, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
      ],
      confidenceRationale:
        "Visual confidence only: the layer is deterministic local presentation metadata and browser tooling verifies rendered states outside the runtime UI.",
      assumptions: [
        "Developer tooling may refresh or supplement local texture assets before release verification.",
        "The runtime application reads local public textures and shaders without fetching online validation or asset state.",
      ],
      limitations: [
        "Does not claim AAA production certification, scientific certification, WCAG certification, online validation, online asset completeness, CI status, or latest runtime command status.",
        "Does not add full numerical relativity, cosmological N-body, online astronomy catalog coverage, or a new scientific observable.",
        "Does not mutate SolarSystemIntegrator, physicsEngine, EIH 1PN dynamics, worker physics or the Kerr geodesic kernel.",
      ],
      relatedViews: ["evidence-ledger", "telemetry"],
    }),
  );
}


export function cinematicLightingClaim(): EvidenceClaim {
  const summary = createAtlasCinematicLightingCompositionSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "cinematic-lighting",
    group: "cinematic-lighting",
    title: "Cinematic lighting and post-FX composition",
    status: "informational",
    confidence: "visual",
    source: `Atlas Cinematic Lighting Composition ${ATLAS_CINEMATIC_LIGHTING_COMPOSITION_VERSION}`,
    model: "Body-aware local lighting and post-FX presentation profiles over existing HD texture assets",
    metric: `${summary.visualTarget}; ${summary.lightingProfile}; ${summary.postFxProfile}`,
    error: "No scientific error budget; this is local lighting, color grading and composition metadata only.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        `Atlas Cinematic Lighting Composition ${summary.version}`,
        "Existing local HD planet texture manifest and public texture runtime assets",
        "Planet, SunBody, GalaxyEnvironmentSphere, ScienceBackdrop and post-processing presentation layers",
        "v41 accessible workbench, v42 cinematic system and v43 planetary fidelity boundaries",
      ],
      method:
        "Describe deterministic body-aware cinematic lighting, restrained bloom, ACES/vignette post-FX, deep-space dimming and local runtime asset policy without claiming online validation or mutating physics.",
      metrics: [
        metric("lighting-version", "Lighting version", summary.version, claim.status),
        metric("visual-target", "Visual target", summary.visualTarget, claim.status),
        metric("lighting-profile", "Lighting profile", summary.lightingProfile, claim.status),
        metric("postfx-profile", "Post-FX profile", summary.postFxProfile, claim.status),
        metric("asset-policy", "Asset policy", summary.assetPolicy, claim.status),
        metric("runtime-assets", "Runtime assets", summary.runtimeAssetSource, claim.status),
        metric("supported-profiles", "Supported body profiles", summary.supportedLightingProfiles.join(", "), claim.status),
        metric("sky-profile", "Sky close-up profile", summary.skyCloseupProfile, claim.status),
        metric("aa-boundary", "AA boundary", summary.aaBoundaryPreserved, claim.status),
        metric("cinematic-boundary", "Cinematic boundary", summary.cinematicBoundaryPreserved, claim.status),
        metric("planetary-boundary", "Planetary boundary", summary.planetaryBoundaryPreserved, claim.status),
        metric("runtime-certification", "Runtime certification", summary.runtimeCertificationStatus, claim.status),
        metric("artistic-certification", "Artistic certification", summary.artisticCertificationStatus, claim.status),
        metric("scientific-certification", "Scientific certification", summary.scientificCertificationStatus, claim.status),
        metric("online-validation", "Online validation", summary.onlineValidationStatus, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
      ],
      confidenceRationale:
        "Visual confidence only: the layer is deterministic local presentation metadata and browser tooling verifies rendered states outside the runtime UI.",
      assumptions: [
        "Existing local HD textures cover the primary close-up bodies for this v44 pass.",
        "Developer tooling may refresh or supplement local assets before verification, but runtime rendering reads local public textures only.",
      ],
      limitations: [
        "Does not claim AAA production certification, WCAG certification, scientific certification, online validation, online asset completeness, CI status, or latest runtime command status.",
        "Does not add a scientific observable, full numerical relativity, cosmological N-body, or online astronomy catalog coverage.",
        "Does not mutate SolarSystemIntegrator, physicsEngine, EIH 1PN dynamics, worker physics or the Kerr geodesic kernel.",
      ],
      relatedViews: ["evidence-ledger", "telemetry"],
    }),
  );
}


export function chineseDeepSpaceFidelityClaim(): EvidenceClaim {
  const summary = createAtlasChineseDeepSpaceFidelitySummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "chinese-deep-space-fidelity",
    group: "chinese-deep-space-fidelity",
    title: "Chinese scientific interface and deep-space fidelity",
    status: "informational",
    confidence: "visual",
    source: `Atlas Chinese Deep-Space Fidelity ${ATLAS_CHINESE_DEEP_SPACE_FIDELITY_VERSION}`,
    model: "zh-CN primary interface and balanced Milky Way, constellation, nebula, and planetary close-up presentation profile",
    metric: `${summary.uiLanguage}; ${summary.visualProfile}; ${summary.assetPolicy}`,
    error: "No scientific error budget; this is local interface language and deep-space visual presentation metadata only.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        `Atlas Chinese Deep-Space Fidelity ${summary.version}`,
        "zh-CN primary workbench and HUD labels",
        "Curated local celestial catalog display names",
        "Existing public sky textures, constellation overlays, nebula markers and HD planetary textures",
        "v41 accessibility, v42 cinematic, v43 planetary and v44 lighting boundaries",
      ],
      method:
        "Describe deterministic Simplified Chinese-first UI chrome and local deep-space presentation tuning while preserving stable scientific ids, formulas, action ids, version markers, local catalogs and physics kernels.",
      metrics: [
        metric("chinese-interface-version", "Chinese interface version", summary.version, claim.status),
        metric("ui-language", "UI language", summary.uiLanguage, claim.status),
        metric("localization-mode", "Localization mode", summary.localizationMode, claim.status),
        metric("visual-profile", "Deep-space visual profile", summary.visualProfile, claim.status),
        metric("asset-policy", "Asset policy", summary.assetPolicy, claim.status),
        metric("runtime-assets", "Runtime assets", summary.runtimeAssetSource, claim.status),
        metric("featured-layers", "Featured layers", summary.featuredLayers.join(", "), claim.status),
        metric("aa-boundary", "AA boundary", summary.aaBoundaryPreserved, claim.status),
        metric("cinematic-boundary", "Cinematic boundary", summary.cinematicBoundaryPreserved, claim.status),
        metric("planetary-boundary", "Planetary boundary", summary.planetaryBoundaryPreserved, claim.status),
        metric("lighting-boundary", "Lighting boundary", summary.lightingBoundaryPreserved, claim.status),
        metric("runtime-certification", "Runtime certification", summary.runtimeCertificationStatus, claim.status),
        metric("artistic-certification", "Artistic certification", summary.artisticCertificationStatus, claim.status),
        metric("scientific-certification", "Scientific certification", summary.scientificCertificationStatus, claim.status),
        metric("online-validation", "Online validation", summary.onlineValidationStatus, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
      ],
      confidenceRationale:
        "Visual confidence only: this layer is deterministic local presentation metadata and browser tooling verifies rendered UI states outside the runtime UI.",
      assumptions: [
        "Simplified Chinese is the primary visible UI language while scientific ids, formulas, version strings and kernel ids remain stable.",
        "Runtime rendering reads local public textures and curated catalog rows only.",
      ],
      limitations: [
        "Does not claim AAA production certification, WCAG certification, scientific certification, online validation, online catalog completeness, CI status, or latest runtime command status.",
        "Does not add a new panel id, scientific observable, online astronomy database, full numerical relativity, cosmological N-body, or complete deep-sky catalog.",
        "Does not mutate SolarSystemIntegrator, physicsEngine, EIH 1PN dynamics, worker physics or the Kerr geodesic kernel.",
      ],
      relatedViews: ["evidence-ledger", "telemetry"],
    }),
  );
}


export function cinematicDeepSpaceCameraClaim(): EvidenceClaim {
  const summary = createAtlasCinematicDeepSpaceCameraSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "cinematic-deep-space-camera",
    group: "cinematic-deep-space-camera",
    title: "Cinematic deep-space camera composition",
    status: "informational",
    confidence: "visual",
    source: `Atlas Cinematic Deep-Space Camera ${ATLAS_CINEMATIC_DEEP_SPACE_CAMERA_VERSION}`,
    model: "Stable high-fidelity camera, sky composition, background noise and target separation profiles over local render layers",
    metric: `${summary.defaultCameraProfile}; ${summary.closeupCameraProfile}; ${summary.qualityBudget}`,
    error: "No scientific error budget; this is local camera composition and deep-space visual presentation metadata only.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        `Atlas Cinematic Deep-Space Camera ${summary.version}`,
        "GalaxyEnvironmentSphere, ScienceBackdrop and deep-sky marker presentation layers",
        "Selected-body visual and lighting profile markers",
        "Existing local public sky textures and curated local catalogs",
        "v41 accessibility, v42 cinematic, v43 planetary, v44 lighting and v45 Chinese boundaries",
      ],
      method:
        "Describe deterministic cinematic camera composition profiles for overview, selected-body close-up and showcase deep-space states while preserving stable UI ids, scientific ids, local assets and physics kernels.",
      metrics: [
        metric("camera-version", "Camera version", summary.version, claim.status),
        metric("visual-target", "Visual target", summary.visualTarget, claim.status),
        metric("default-camera-profile", "Default camera profile", summary.defaultCameraProfile, claim.status),
        metric("closeup-camera-profile", "Close-up camera profile", summary.closeupCameraProfile, claim.status),
        metric("showcase-camera-profile", "Showcase camera profile", summary.showcaseCameraProfile, claim.status),
        metric("quality-budget", "Quality budget", summary.qualityBudget, claim.status),
        metric("runtime-assets", "Runtime assets", summary.runtimeAssetSource, claim.status),
        metric("sky-composition-profiles", "Sky composition profiles", summary.supportedSkyCompositionProfiles.join(", "), claim.status),
        metric("background-noise-profiles", "Background noise profiles", summary.supportedBackgroundNoiseProfiles.join(", "), claim.status),
        metric("target-separation-profiles", "Target separation profiles", summary.supportedTargetSeparationProfiles.join(", "), claim.status),
        metric("aa-boundary", "AA boundary", summary.aaBoundaryPreserved, claim.status),
        metric("cinematic-boundary", "Cinematic boundary", summary.cinematicBoundaryPreserved, claim.status),
        metric("planetary-boundary", "Planetary boundary", summary.planetaryBoundaryPreserved, claim.status),
        metric("lighting-boundary", "Lighting boundary", summary.lightingBoundaryPreserved, claim.status),
        metric("chinese-boundary", "Chinese interface boundary", summary.chineseBoundaryPreserved, claim.status),
        metric("runtime-certification", "Runtime certification", summary.runtimeCertificationStatus, claim.status),
        metric("artistic-certification", "Artistic certification", summary.artisticCertificationStatus, claim.status),
        metric("wcag-certification", "WCAG certification", summary.wcagCertificationStatus, claim.status),
        metric("scientific-certification", "Scientific certification", summary.scientificCertificationStatus, claim.status),
        metric("online-validation", "Online validation", summary.onlineValidationStatus, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
      ],
      confidenceRationale:
        "Visual confidence only: the helper is deterministic metadata and browser tooling verifies rendered profile markers outside the runtime UI.",
      assumptions: [
        "Overview, selected-body close-up and showcase states can be represented by local rendering profiles without altering physics state.",
        "Runtime rendering reads local public textures and curated catalog rows only.",
      ],
      limitations: [
        "Does not claim AAA production certification, WCAG certification, scientific certification, online validation, online catalog completeness, CI status, or latest runtime command status.",
        "Does not add a new panel id, scientific observable, online astronomy database, full numerical relativity, cosmological N-body, or complete deep-sky catalog.",
        "Does not mutate SolarSystemIntegrator, physicsEngine, EIH 1PN dynamics, worker physics or the Kerr geodesic kernel.",
      ],
      relatedViews: ["evidence-ledger", "telemetry"],
    }),
  );
}


export function universeSandboxReferenceBackdropClaim(): EvidenceClaim {
  const summary = createAtlasUniverseSandboxReferenceBackdropSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "universe-sandbox-reference-backdrop",
    group: "universe-sandbox-reference-backdrop",
    title: "Universe Sandbox reference backdrop",
    status: "informational",
    confidence: "visual",
    source: `Atlas Universe Sandbox Reference Backdrop ${ATLAS_UNIVERSE_SANDBOX_REFERENCE_BACKDROP_VERSION}`,
    model: "Local reference-inspired sparse star, layered Milky Way and selected-body visibility profiles over existing render layers",
    metric: `${summary.referenceMode}; ${summary.backgroundArtDirection}; ${summary.subjectVisibilityProfile}`,
    error: "No scientific or artistic certification budget; this is local visual reference metadata only.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        `Atlas Universe Sandbox Reference Backdrop ${summary.version}`,
        "User-provided Universe Sandbox reference screenshots and official public screenshot pages as visual inspiration only",
        "Local v46 Playwright screenshot review output",
        "GalaxyEnvironmentSphere, ScienceBackdrop, deep-sky marker and selected-body framing presentation layers",
        "Existing local public sky textures and curated local catalogs",
        "v41 accessibility, v42 cinematic, v43 planetary, v44 lighting, v45 Chinese and v46 deep-space camera boundaries",
      ],
      method:
        "Describe deterministic reference-inspired backdrop and subject visibility profiles for sparse stars, layered Milky Way contrast, negative space, local screenshot review and in-frame selected-body checks while preserving stable ids and physics kernels.",
      metrics: [
        metric("reference-version", "Reference version", summary.version, claim.status),
        metric("reference-mode", "Reference mode", summary.referenceMode, claim.status),
        metric("background-art-direction", "Background art direction", summary.backgroundArtDirection, claim.status),
        metric("default-depth-profile", "Default depth profile", summary.defaultDepthProfile, claim.status),
        metric("closeup-depth-profile", "Close-up depth profile", summary.closeupDepthProfile, claim.status),
        metric("showcase-depth-profile", "Showcase depth profile", summary.showcaseDepthProfile, claim.status),
        metric("subject-visibility", "Subject visibility", summary.subjectVisibilityProfile, claim.status),
        metric("screenshot-review", "Screenshot review", summary.screenshotReview, claim.status),
        metric("runtime-assets", "Runtime assets", summary.runtimeAssetSource, claim.status),
        metric("depth-profiles", "Depth profiles", summary.supportedDepthProfiles.join(", "), claim.status),
        metric("visibility-profiles", "Visibility profiles", summary.supportedSubjectVisibilityProfiles.join(", "), claim.status),
        metric("aa-boundary", "AA boundary", summary.aaBoundaryPreserved, claim.status),
        metric("cinematic-boundary", "Cinematic boundary", summary.cinematicBoundaryPreserved, claim.status),
        metric("planetary-boundary", "Planetary boundary", summary.planetaryBoundaryPreserved, claim.status),
        metric("lighting-boundary", "Lighting boundary", summary.lightingBoundaryPreserved, claim.status),
        metric("chinese-boundary", "Chinese interface boundary", summary.chineseBoundaryPreserved, claim.status),
        metric("camera-boundary", "Deep-space camera boundary", summary.deepSpaceCameraBoundaryPreserved, claim.status),
        metric("runtime-certification", "Runtime certification", summary.runtimeCertificationStatus, claim.status),
        metric("universe-sandbox-clone", "Universe Sandbox clone", summary.universeSandboxCloneStatus, claim.status),
        metric("artistic-certification", "Artistic certification", summary.artisticCertificationStatus, claim.status),
        metric("wcag-certification", "WCAG certification", summary.wcagCertificationStatus, claim.status),
        metric("scientific-certification", "Scientific certification", summary.scientificCertificationStatus, claim.status),
        metric("online-validation", "Online validation", summary.onlineValidationStatus, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
      ],
      confidenceRationale:
        "Visual confidence only: the helper is deterministic local metadata and browser tooling verifies DOM markers, in-frame subject checks and non-brittle screenshot review outside the runtime UI.",
      assumptions: [
        "Universe Sandbox is used as visual reference direction only; no external assets are copied into the app.",
        "Runtime rendering reads local public textures and curated catalog rows only.",
      ],
      limitations: [
        "Does not claim Universe Sandbox clone status, AAA production certification, WCAG certification, scientific certification, online validation, online catalog completeness, CI status, or latest runtime command status.",
        "Does not add a new panel id, scientific observable, online astronomy database, full numerical relativity, cosmological N-body, or complete deep-sky catalog.",
        "Does not mutate SolarSystemIntegrator, physicsEngine, EIH 1PN dynamics, worker physics or the Kerr geodesic kernel.",
      ],
      relatedViews: ["evidence-ledger", "telemetry"],
    }),
  );
}


export function referenceGradeSpaceArtClaim(): EvidenceClaim {
  const summary = createAtlasReferenceGradeSpaceArtSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "reference-grade-space-art",
    group: "reference-grade-space-art",
    title: "Reference-grade space art",
    status: "informational",
    confidence: "visual",
    source: `Atlas Reference-Grade Space Art ${ATLAS_REFERENCE_GRADE_SPACE_ART_VERSION}`,
    model: "Local generated sky assets, subject matte, starfield remap, planet material and post-FX composition profiles over existing render layers",
    metric: `${summary.artDirection}; ${summary.closeupCompositeProfile}; ${summary.closeupSubjectMatteProfile}`,
    error: "No scientific, AAA, WCAG, CI or clone certification budget; this is local visual composition metadata only.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        `Atlas Reference-Grade Space Art ${summary.version}`,
        "User-provided Universe Sandbox reference screenshots and official public screenshot pages as visual inspiration only",
        "Local v47 Playwright screenshot review output",
        "Generated local public sky assets, existing local planet textures and curated local catalogs",
        "GalaxyEnvironmentSphere, ScienceBackdrop, Planet, SunBody, Saturn ring, post-FX and selected-body framing presentation layers",
        "v41 accessibility, v42 cinematic, v43 planetary, v44 lighting, v45 Chinese, v46 camera and v47 reference backdrop boundaries",
      ],
      method:
        "Describe deterministic reference-grade composition profiles for layered sky assets, sparse starfield, subject matte, close-up planet material readability, local screenshot review and non-brittle browser pixel checks while preserving stable ids and physics kernels.",
      metrics: [
        metric("space-art-version", "Space art version", summary.version, claim.status),
        metric("art-direction", "Art direction", summary.artDirection, claim.status),
        metric("asset-policy", "Asset policy", summary.assetPolicy, claim.status),
        metric("review-mode", "Review mode", summary.reviewMode, claim.status),
        metric("default-composite", "Default composite", summary.defaultCompositeProfile, claim.status),
        metric("closeup-composite", "Close-up composite", summary.closeupCompositeProfile, claim.status),
        metric("showcase-composite", "Showcase composite", summary.showcaseCompositeProfile, claim.status),
        metric("default-sky-layer", "Default sky layer", summary.defaultSkyLayerProfile, claim.status),
        metric("closeup-sky-layer", "Close-up sky layer", summary.closeupSkyLayerProfile, claim.status),
        metric("starfield-profile", "Starfield profile", summary.closeupStarfieldProfile, claim.status),
        metric("subject-matte", "Subject matte", summary.closeupSubjectMatteProfile, claim.status),
        metric("planet-material", "Planet material", summary.closeupPlanetMaterialProfile, claim.status),
        metric("gas-giant-material", "Gas giant material", summary.gasGiantPlanetMaterialProfile, claim.status),
        metric("solar-material", "Solar material", summary.solarPlanetMaterialProfile, claim.status),
        metric("runtime-assets", "Runtime assets", summary.runtimeAssetSource, claim.status),
        metric("aa-boundary", "AA boundary", summary.aaBoundaryPreserved, claim.status),
        metric("cinematic-boundary", "Cinematic boundary", summary.cinematicBoundaryPreserved, claim.status),
        metric("planetary-boundary", "Planetary boundary", summary.planetaryBoundaryPreserved, claim.status),
        metric("lighting-boundary", "Lighting boundary", summary.lightingBoundaryPreserved, claim.status),
        metric("chinese-boundary", "Chinese interface boundary", summary.chineseBoundaryPreserved, claim.status),
        metric("camera-boundary", "Deep-space camera boundary", summary.deepSpaceCameraBoundaryPreserved, claim.status),
        metric("reference-boundary", "Reference backdrop boundary", summary.universeSandboxReferenceBoundaryPreserved, claim.status),
        metric("runtime-certification", "Runtime certification", summary.runtimeCertificationStatus, claim.status),
        metric("universe-sandbox-clone", "Universe Sandbox clone", summary.universeSandboxCloneStatus, claim.status),
        metric("artistic-certification", "Artistic certification", summary.artisticCertificationStatus, claim.status),
        metric("wcag-certification", "WCAG certification", summary.wcagCertificationStatus, claim.status),
        metric("scientific-certification", "Scientific certification", summary.scientificCertificationStatus, claim.status),
        metric("online-validation", "Online validation", summary.onlineValidationStatus, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
      ],
      confidenceRationale:
        "Visual confidence only: the helper is deterministic local metadata and browser tooling verifies DOM markers, screenshot pixel budgets and selected-subject markers outside the runtime UI.",
      assumptions: [
        "Reference-grade means a local art-direction target, not an external AAA or Universe Sandbox certification.",
        "Runtime rendering reads generated local public textures, existing planet textures and curated catalog rows only.",
      ],
      limitations: [
        "Does not claim Universe Sandbox clone status, AAA production certification, WCAG certification, scientific certification, online validation, online catalog completeness, CI status, or latest runtime command status.",
        "Does not add a new panel id, scientific observable, online astronomy database, full numerical relativity, cosmological N-body, or complete deep-sky catalog.",
        "Does not mutate SolarSystemIntegrator, physicsEngine, EIH 1PN dynamics, worker physics or the Kerr geodesic kernel.",
      ],
      relatedViews: ["evidence-ledger", "telemetry"],
    }),
  );
}


export function planetaryMaterialCompositionClaim(): EvidenceClaim {
  const summary = createAtlasPlanetaryMaterialCompositionSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "planetary-material-composition",
    group: "planetary-material-composition",
    title: "Planetary material composition",
    status: "informational",
    confidence: "visual",
    source: `Atlas Planetary Material Composition ${ATLAS_PLANETARY_MATERIAL_COMPOSITION_VERSION}`,
    model: "Local v49 planet material maps, cloud/night masks, gas-band contrast cues, Saturn ring opacity cues and solar shader depth over existing rendering layers",
    metric: `${summary.materialTarget}; ${summary.earthMaterialProfile}; ${summary.saturnRingProfile}`,
    error: "No AAA, WCAG, scientific, CI, online validation, asset completeness or physics certification budget; this is local material-composition metadata only.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        `Atlas Planetary Material Composition ${summary.version}`,
        "Developer-refreshed or generated local planet texture maps under public/textures/planets",
        "Existing local HD planet texture manifest with 2K overview fallback",
        "Planet, SunBody and Saturn ring rendering layers only",
        "v41 accessibility, v42 cinematic workbench, v43 planetary fidelity, v44 lighting, v45 Chinese interface, v46 camera, v47 reference backdrop and v48 reference-grade space art boundaries",
      ],
      method:
        "Describe deterministic local material composition profiles for selected-body close-up rendering, including Earth cloud/night composition, gas-giant band readability, Saturn ring layering, solar granulation, and lunar/Mars relief cues without changing physics state.",
      metrics: [
        metric("planetary-material-version", "Planetary material version", summary.version, claim.status),
        metric("material-target", "Material target", summary.materialTarget, claim.status),
        metric("asset-policy", "Asset policy", summary.assetPolicy, claim.status),
        metric("runtime-assets", "Runtime assets", summary.runtimeAssetSource, claim.status),
        metric("default-material", "Default material", summary.defaultMaterialProfile, claim.status),
        metric("earth-material", "Earth material", summary.earthMaterialProfile, claim.status),
        metric("earth-atmosphere", "Earth atmosphere", summary.earthAtmosphereProfile, claim.status),
        metric("earth-terminator", "Earth terminator", summary.earthTerminatorProfile, claim.status),
        metric("gas-giant-material", "Gas giant material", summary.gasGiantMaterialProfile, claim.status),
        metric("gas-giant-atmosphere", "Gas giant atmosphere", summary.gasGiantAtmosphereProfile, claim.status),
        metric("saturn-material", "Saturn material", summary.saturnMaterialProfile, claim.status),
        metric("saturn-ring", "Saturn ring", summary.saturnRingProfile, claim.status),
        metric("solar-material", "Solar material", summary.solarMaterialProfile, claim.status),
        metric("solar-atmosphere", "Solar atmosphere", summary.solarAtmosphereProfile, claim.status),
        metric("lunar-mars-material", "Lunar/Mars material", summary.lunarMarsMaterialProfile, claim.status),
        metric("lunar-mars-terminator", "Lunar/Mars terminator", summary.airlessTerminatorProfile, claim.status),
        metric("aa-boundary", "AA boundary", summary.aaBoundaryPreserved, claim.status),
        metric("reference-grade-boundary", "Reference-grade boundary", summary.referenceGradeBoundaryPreserved, claim.status),
        metric("runtime-certification", "Runtime certification", summary.runtimeCertificationStatus, claim.status),
        metric("artistic-certification", "Artistic certification", summary.artisticCertificationStatus, claim.status),
        metric("wcag-certification", "WCAG certification", summary.wcagCertificationStatus, claim.status),
        metric("scientific-certification", "Scientific certification", summary.scientificCertificationStatus, claim.status),
        metric("asset-completeness-certification", "Asset completeness certification", summary.assetCompletenessCertificationStatus, claim.status),
        metric("online-validation", "Online validation", summary.onlineValidationStatus, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
      ],
      confidenceRationale:
        "Visual confidence only: the helper is deterministic local metadata and browser tooling verifies DOM markers, selected-body profiles and local review images outside the runtime UI.",
      assumptions: [
        "v49 close-up material composition is a local presentation target, not an external AAA or scientific certification.",
        "Runtime rendering reads local public textures only; development may prepare local assets ahead of runtime.",
      ],
      limitations: [
        "Does not claim AAA production certification, WCAG certification, scientific certification, online validation, online asset completeness, asset completeness certification, CI status, or latest runtime command status.",
        "Does not add a new panel id, scientific observable, online astronomy database, full numerical relativity, cosmological N-body, or complete deep-sky catalog.",
        "Does not mutate SolarSystemIntegrator, physicsEngine, EIH 1PN dynamics, worker physics or the Kerr geodesic kernel.",
      ],
      relatedViews: ["evidence-ledger", "telemetry"],
    }),
  );
}


export function cinematicCloseupDirectorClaim(): EvidenceClaim {
  const summary = createAtlasCinematicCloseupDirectorSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "cinematic-closeup-director",
    group: "cinematic-closeup-director",
    title: "Cinematic close-up director",
    status: "informational",
    confidence: "visual",
    source: `Atlas Cinematic Close-up Director ${ATLAS_CINEMATIC_CLOSEUP_DIRECTOR_VERSION}`,
    model: "Local v50 selected-body composition profiles, panel-safe subject placement cues, subject-in-frame markers and Saturn ring showcase rendering over existing camera and material layers",
    metric: `${summary.compositionTarget}; ${summary.saturnCompositionProfile}; ${summary.saturnRingShowcaseProfile}`,
    error: "No AAA, WCAG, scientific, CI, online validation, asset completeness, Universe Sandbox clone or physics certification budget; this is local close-up composition metadata only.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        `Atlas Cinematic Close-up Director ${summary.version}`,
        "Existing selected-body state, browser subject-in-frame markers and local planet material profiles",
        "Planet, Sun, Saturn ring, camera distance and deep-space subject matte presentation layers only",
        "v41 accessibility through v49 planetary material composition boundaries",
      ],
      method:
        "Describe deterministic close-up composition profiles for selected Earth, Sun, gas giants, Saturn rings and lunar/Mars bodies, then expose stable DOM markers and rendering profiles without changing body state, mass, velocity, ephemerides, integrators or worker physics.",
      metrics: [
        metric("closeup-director-version", "Close-up director version", summary.version, claim.status),
        metric("composition-target", "Composition target", summary.compositionTarget, claim.status),
        metric("quality-budget", "Quality budget", summary.qualityBudget, claim.status),
        metric("asset-policy", "Asset policy", summary.assetPolicy, claim.status),
        metric("runtime-assets", "Runtime assets", summary.runtimeAssetSource, claim.status),
        metric("default-composition", "Default composition", summary.defaultCompositionProfile, claim.status),
        metric("earth-composition", "Earth composition", summary.earthCompositionProfile, claim.status),
        metric("solar-composition", "Solar composition", summary.solarCompositionProfile, claim.status),
        metric("gas-giant-composition", "Gas giant composition", summary.gasGiantCompositionProfile, claim.status),
        metric("saturn-composition", "Saturn composition", summary.saturnCompositionProfile, claim.status),
        metric("saturn-ring-showcase", "Saturn ring showcase", summary.saturnRingShowcaseProfile, claim.status),
        metric("desktop-panel-avoidance", "Desktop panel avoidance", summary.desktopPanelAvoidanceProfile, claim.status),
        metric("mobile-panel-avoidance", "Mobile panel avoidance", summary.mobilePanelAvoidanceProfile, claim.status),
        metric("planetary-material-boundary", "Planetary material boundary", summary.planetaryMaterialBoundaryPreserved, claim.status),
        metric("runtime-certification", "Runtime certification", summary.runtimeCertificationStatus, claim.status),
        metric("artistic-certification", "Artistic certification", summary.artisticCertificationStatus, claim.status),
        metric("wcag-certification", "WCAG certification", summary.wcagCertificationStatus, claim.status),
        metric("scientific-certification", "Scientific certification", summary.scientificCertificationStatus, claim.status),
        metric("universe-sandbox-clone", "Universe Sandbox clone", summary.universeSandboxCloneStatus, claim.status),
        metric("online-validation", "Online validation", summary.onlineValidationStatus, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
      ],
      confidenceRationale:
        "Visual confidence only: the helper is deterministic local metadata and browser tooling verifies DOM markers, selected-body profiles, subject-in-frame markers and local review screenshots outside the runtime UI.",
      assumptions: [
        "v50 close-up director is a local art-direction target inspired by high-end scientific simulation composition, not an external AAA certification.",
        "Runtime rendering reads local public textures and live selected-body state only; it does not fetch assets or validate online completeness.",
      ],
      limitations: [
        "Does not claim Universe Sandbox clone status, AAA production certification, WCAG certification, scientific certification, online validation, online asset completeness, CI status, or latest runtime command status.",
        "Does not add a new panel id, scientific observable, online astronomy database, full numerical relativity, cosmological N-body, or complete deep-sky catalog.",
        "Does not mutate SolarSystemIntegrator, physicsEngine, EIH 1PN dynamics, worker physics or the Kerr geodesic kernel.",
      ],
      relatedViews: ["evidence-ledger", "telemetry"],
    }),
  );
}


export function cinematicKeyLightDirectorClaim(): EvidenceClaim {
  const summary = createAtlasCinematicKeyLightDirectorSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "cinematic-key-light-director",
    group: "cinematic-key-light-director",
    title: "Cinematic key-light director",
    status: "informational",
    confidence: "visual",
    source: `Atlas Cinematic Key-Light Director ${ATLAS_CINEMATIC_KEY_LIGHT_DIRECTOR_VERSION}`,
    model: "Local v51 selected-body key-light and phase readability profiles over existing planet material, Saturn ring and close-up composition layers",
    metric: `${summary.lightingTarget}; ${summary.gasGiantKeyLightProfile}; ${summary.saturnKeyLightProfile}`,
    error: "No AAA, WCAG, scientific, CI, online validation, asset completeness, Universe Sandbox clone or physics certification budget; this is local key-light composition metadata only.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        `Atlas Cinematic Key-Light Director ${summary.version}`,
        "Existing selected-body state, local v49 material profiles and v50 close-up composition profiles",
        "Planet, Saturn ring and presentation-lighting rendering layers only",
        "v41 accessibility through v50 close-up director boundaries",
      ],
      method:
        "Describe deterministic key-light profiles for selected Earth, Sun, gas giants, Saturn rings and lunar/Mars bodies, then expose stable DOM markers and rendering cues without changing body state, mass, velocity, ephemerides, integrators or worker physics.",
      metrics: [
        metric("key-light-director-version", "Key-light director version", summary.version, claim.status),
        metric("lighting-target", "Lighting target", summary.lightingTarget, claim.status),
        metric("quality-budget", "Quality budget", summary.qualityBudget, claim.status),
        metric("asset-policy", "Asset policy", summary.assetPolicy, claim.status),
        metric("runtime-assets", "Runtime assets", summary.runtimeAssetSource, claim.status),
        metric("default-key-light", "Default key light", summary.defaultKeyLightProfile, claim.status),
        metric("earth-key-light", "Earth key light", summary.earthKeyLightProfile, claim.status),
        metric("solar-key-light", "Solar key light", summary.solarKeyLightProfile, claim.status),
        metric("gas-giant-key-light", "Gas giant key light", summary.gasGiantKeyLightProfile, claim.status),
        metric("saturn-key-light", "Saturn key light", summary.saturnKeyLightProfile, claim.status),
        metric("lunar-mars-key-light", "Lunar/Mars key light", summary.lunarMarsKeyLightProfile, claim.status),
        metric("planetary-material-boundary", "Planetary material boundary", summary.planetaryMaterialBoundaryPreserved, claim.status),
        metric("closeup-director-boundary", "Close-up director boundary", summary.closeupDirectorBoundaryPreserved, claim.status),
        metric("runtime-certification", "Runtime certification", summary.runtimeCertificationStatus, claim.status),
        metric("artistic-certification", "Artistic certification", summary.artisticCertificationStatus, claim.status),
        metric("wcag-certification", "WCAG certification", summary.wcagCertificationStatus, claim.status),
        metric("scientific-certification", "Scientific certification", summary.scientificCertificationStatus, claim.status),
        metric("universe-sandbox-clone", "Universe Sandbox clone", summary.universeSandboxCloneStatus, claim.status),
        metric("online-validation", "Online validation", summary.onlineValidationStatus, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
      ],
      confidenceRationale:
        "Visual confidence only: the helper is deterministic local metadata and browser tooling verifies DOM markers, selected-body key-light profiles and local review screenshots outside the runtime UI.",
      assumptions: [
        "v51 key-light director is a local art-direction target for close-up readability, not an external AAA or Universe Sandbox certification.",
        "Runtime rendering reads local public textures and live selected-body state only; it does not fetch assets or validate online completeness.",
      ],
      limitations: [
        "Does not claim Universe Sandbox clone status, AAA production certification, WCAG certification, scientific certification, online validation, online asset completeness, CI status, or latest runtime command status.",
        "Does not add a new panel id, scientific observable, online astronomy database, full numerical relativity, cosmological N-body, or complete deep-sky catalog.",
        "Does not mutate SolarSystemIntegrator, physicsEngine, EIH 1PN dynamics, worker physics or the Kerr geodesic kernel.",
      ],
      relatedViews: ["evidence-ledger", "telemetry"],
    }),
  );
}


export function planetaryDepthLightingClaim(): EvidenceClaim {
  const summary = createAtlasPlanetaryDepthLightingSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "planetary-depth-lighting",
    group: "planetary-depth-lighting",
    title: "Planetary depth lighting",
    status: "informational",
    confidence: "visual",
    source: `Atlas Planetary Depth Lighting ${ATLAS_PLANETARY_DEPTH_LIGHTING_VERSION}`,
    model: "Local v52 close-up atmospheric rim, terminator, gas-band and Saturn ring-shadow profiles over existing v49-v51 rendering layers",
    metric: `${summary.lightingTarget}; ${summary.gasGiantDepthLightingProfile}; ${summary.saturnDepthLightingProfile}`,
    error: "No AAA, WCAG, scientific, CI, online validation, asset completeness, Universe Sandbox clone or physics certification budget; this is local depth-lighting composition metadata only.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        `Atlas Planetary Depth Lighting ${summary.version}`,
        "Existing selected-body state, local v49 material profiles, v50 close-up director and v51 key-light director",
        "Planet, Sun, Saturn ring and presentation-lighting rendering layers only",
        "v41 accessibility through v51 key-light director boundaries",
      ],
      method:
        "Describe deterministic depth-lighting profiles for selected Earth, Sun, gas giants, Saturn rings and lunar/Mars bodies, then expose stable DOM markers and rendering cues without changing body state, mass, velocity, ephemerides, integrators or worker physics.",
      metrics: [
        metric("planetary-depth-lighting-version", "Planetary depth-lighting version", summary.version, claim.status),
        metric("lighting-target", "Lighting target", summary.lightingTarget, claim.status),
        metric("quality-budget", "Quality budget", summary.qualityBudget, claim.status),
        metric("asset-policy", "Asset policy", summary.assetPolicy, claim.status),
        metric("runtime-assets", "Runtime assets", summary.runtimeAssetSource, claim.status),
        metric("default-depth-lighting", "Default depth lighting", summary.defaultDepthLightingProfile, claim.status),
        metric("earth-depth-lighting", "Earth depth lighting", summary.earthDepthLightingProfile, claim.status),
        metric("solar-depth-lighting", "Solar depth lighting", summary.solarDepthLightingProfile, claim.status),
        metric("gas-giant-depth-lighting", "Gas giant depth lighting", summary.gasGiantDepthLightingProfile, claim.status),
        metric("saturn-depth-lighting", "Saturn depth lighting", summary.saturnDepthLightingProfile, claim.status),
        metric("lunar-mars-depth-lighting", "Lunar/Mars depth lighting", summary.lunarMarsDepthLightingProfile, claim.status),
        metric("atmosphere-rim-cue", "Atmosphere rim cue", summary.atmosphereRimCue, claim.status),
        metric("terminator-cue", "Terminator cue", summary.terminatorCue, claim.status),
        metric("gas-band-cue", "Gas band cue", summary.gasBandCue, claim.status),
        metric("ring-shadow-cue", "Ring shadow cue", summary.ringShadowCue, claim.status),
        metric("key-light-boundary", "Key-light boundary", summary.keyLightBoundaryPreserved, claim.status),
        metric("runtime-certification", "Runtime certification", summary.runtimeCertificationStatus, claim.status),
        metric("artistic-certification", "Artistic certification", summary.artisticCertificationStatus, claim.status),
        metric("wcag-certification", "WCAG certification", summary.wcagCertificationStatus, claim.status),
        metric("scientific-certification", "Scientific certification", summary.scientificCertificationStatus, claim.status),
        metric("universe-sandbox-clone", "Universe Sandbox clone", summary.universeSandboxCloneStatus, claim.status),
        metric("online-validation", "Online validation", summary.onlineValidationStatus, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
      ],
      confidenceRationale:
        "Visual confidence only: the helper is deterministic local metadata and browser tooling verifies DOM markers, selected-body depth-lighting profiles and local review screenshots outside the runtime UI.",
      assumptions: [
        "v52 planetary depth lighting is a local art-direction target for close-up material depth, not an external AAA or Universe Sandbox certification.",
        "Runtime rendering reads local public textures and live selected-body state only; it does not fetch assets or validate online completeness.",
      ],
      limitations: [
        "Does not claim Universe Sandbox clone status, AAA production certification, WCAG certification, scientific certification, online validation, online asset completeness, CI status, or latest runtime command status.",
        "Does not add a new panel id, scientific observable, online astronomy database, full numerical relativity, cosmological N-body, or complete deep-sky catalog.",
        "Does not mutate SolarSystemIntegrator, physicsEngine, EIH 1PN dynamics, worker physics or the Kerr geodesic kernel.",
      ],
      relatedViews: ["evidence-ledger", "telemetry"],
    }),
  );
}


export function planetaryColorGradingClaim(): EvidenceClaim {
  const summary = createAtlasPlanetaryColorGradingSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "planetary-color-grading",
    group: "planetary-color-grading",
    title: "Planetary color grading",
    status: "informational",
    confidence: "visual",
    source: `Atlas Planetary Color Grading ${ATLAS_PLANETARY_COLOR_GRADING_VERSION}`,
    model: "Local v53 close-up color separation and gas-layer microcontrast profiles over existing v49-v52 rendering layers",
    metric: `${summary.colorTarget}; ${summary.gasGiantColorGradeProfile}; ${summary.saturnColorGradeProfile}`,
    error: "No AAA, WCAG, scientific, CI, online validation, asset completeness, Universe Sandbox clone or physics certification budget; this is local color-grading composition metadata only.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        `Atlas Planetary Color Grading ${summary.version}`,
        "Existing selected-body state, local v49 material profiles, v50 close-up director, v51 key-light director and v52 depth-lighting profiles",
        "Planet, Sun, Saturn ring and presentation color-grading rendering layers only",
        "v41 accessibility through v52 planetary depth-lighting boundaries",
      ],
      method:
        "Describe deterministic color-grade profiles for selected Earth, Sun, gas giants, Saturn rings and lunar/Mars bodies, then expose stable DOM markers and rendering cues without changing body state, mass, velocity, ephemerides, integrators or worker physics.",
      metrics: [
        metric("planetary-color-grading-version", "Planetary color-grading version", summary.version, claim.status),
        metric("color-target", "Color target", summary.colorTarget, claim.status),
        metric("quality-budget", "Quality budget", summary.qualityBudget, claim.status),
        metric("asset-policy", "Asset policy", summary.assetPolicy, claim.status),
        metric("runtime-assets", "Runtime assets", summary.runtimeAssetSource, claim.status),
        metric("default-color-grade", "Default color grade", summary.defaultColorGradeProfile, claim.status),
        metric("earth-color-grade", "Earth color grade", summary.earthColorGradeProfile, claim.status),
        metric("solar-color-grade", "Solar color grade", summary.solarColorGradeProfile, claim.status),
        metric("gas-giant-color-grade", "Gas giant color grade", summary.gasGiantColorGradeProfile, claim.status),
        metric("saturn-color-grade", "Saturn color grade", summary.saturnColorGradeProfile, claim.status),
        metric("lunar-mars-color-grade", "Lunar/Mars color grade", summary.lunarMarsColorGradeProfile, claim.status),
        metric("color-separation-cue", "Color separation cue", summary.colorSeparationCue, claim.status),
        metric("gas-layer-cue", "Gas layer cue", summary.gasLayerCue, claim.status),
        metric("saturn-occlusion-cue", "Saturn occlusion cue", summary.saturnOcclusionCue, claim.status),
        metric("depth-lighting-boundary", "Depth-lighting boundary", summary.depthLightingBoundaryPreserved, claim.status),
        metric("runtime-certification", "Runtime certification", summary.runtimeCertificationStatus, claim.status),
        metric("artistic-certification", "Artistic certification", summary.artisticCertificationStatus, claim.status),
        metric("wcag-certification", "WCAG certification", summary.wcagCertificationStatus, claim.status),
        metric("scientific-certification", "Scientific certification", summary.scientificCertificationStatus, claim.status),
        metric("universe-sandbox-clone", "Universe Sandbox clone", summary.universeSandboxCloneStatus, claim.status),
        metric("online-validation", "Online validation", summary.onlineValidationStatus, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
      ],
      confidenceRationale:
        "Visual confidence only: the helper is deterministic local metadata and browser tooling verifies DOM markers, selected-body color-grade profiles and local review screenshots outside the runtime UI.",
      assumptions: [
        "v53 planetary color grading is a local art-direction target for close-up color and gas-layer depth, not an external AAA or Universe Sandbox certification.",
        "Runtime rendering reads local public textures and live selected-body state only; it does not fetch assets or validate online completeness.",
      ],
      limitations: [
        "Does not claim Universe Sandbox clone status, AAA production certification, WCAG certification, scientific certification, online validation, online asset completeness, CI status, or latest runtime command status.",
        "Does not add a new panel id, scientific observable, online astronomy database, full numerical relativity, cosmological N-body, or complete deep-sky catalog.",
        "Does not mutate SolarSystemIntegrator, physicsEngine, EIH 1PN dynamics, worker physics or the Kerr geodesic kernel.",
      ],
      relatedViews: ["evidence-ledger", "telemetry"],
    }),
  );
}


export function cinematicPlanetaryArtDirectionClaim(): EvidenceClaim {
  const summary = createAtlasCinematicPlanetaryArtDirectionSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "cinematic-planetary-art-direction",
    group: "cinematic-planetary-art-direction",
    title: "Cinematic planetary art direction",
    status: "informational",
    confidence: "visual",
    source: `Atlas Cinematic Planetary Art Direction ${ATLAS_CINEMATIC_PLANETARY_ART_DIRECTION_VERSION}`,
    model:
      "Local v55 balanced background and selected-body art-direction profiles over existing v48-v54 visual and audit layers",
    metric: `${summary.qualityTarget}; ${summary.globalColorGradeProfile}; ${summary.closeupBackgroundArtGradeProfile}`,
    error:
      "No Universe Sandbox clone, AAA/WCAG/science/CI certification, online validation, runtime asset completeness claim, or physics mutation is claimed.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        `Atlas Cinematic Planetary Art Direction ${summary.version}`,
        "User reference direction, local Playwright review screenshots, and Universe Sandbox public pages as visual inspiration only",
        "Existing v48 background composition, v49 material assets, v52 depth lighting, v53 color grading and v54 numerical boundary",
        "Planet, Sun, Saturn ring, background shader, post-FX and local v55 prepared assets only",
      ],
      method:
        "Describe deterministic selected-body art profiles for gas giants, Saturn rings, Earth cloud/night, solar surface, global color grade and background negative-space treatment, then expose DOM markers and rendering cues without changing body state, ephemerides, integrators or worker physics.",
      metrics: [
        metric("cinematic-planetary-art-version", "Cinematic planetary art version", summary.version, claim.status),
        metric("reference-mode", "Reference mode", summary.referenceMode, claim.status),
        metric("quality-target", "Quality target", summary.qualityTarget, claim.status),
        metric("asset-policy", "Asset policy", summary.assetPolicy, claim.status),
        metric("runtime-assets", "Runtime assets", summary.runtimeAssetSource, claim.status),
        metric("gas-giant-art-profile", "Gas giant art profile", summary.gasGiantArtProfile, claim.status),
        metric("saturn-gas-art-profile", "Saturn gas art profile", summary.saturnGasGiantArtProfile, claim.status),
        metric("saturn-ring-art-profile", "Saturn ring art profile", summary.saturnRingArtProfile, claim.status),
        metric("earth-cloud-night-profile", "Earth cloud/night profile", summary.earthCloudNightProfile, claim.status),
        metric("solar-surface-profile", "Solar surface profile", summary.solarSurfaceProfile, claim.status),
        metric("global-color-grade-profile", "Global color grade profile", summary.globalColorGradeProfile, claim.status),
        metric("background-art-grade-profile", "Background art grade profile", summary.defaultBackgroundArtGradeProfile, claim.status),
        metric("closeup-background-art-grade-profile", "Close-up background art grade", summary.closeupBackgroundArtGradeProfile, claim.status),
        metric("background-reference-cue", "Background reference cue", summary.backgroundReferenceCue, claim.status),
        metric("earth-night-cue", "Earth night cue", summary.earthNightCue, claim.status),
        metric("gas-band-cue", "Gas band cue", summary.gasBandCue, claim.status),
        metric("saturn-ring-cue", "Saturn ring cue", summary.saturnRingCue, claim.status),
        metric("solar-surface-cue", "Solar surface cue", summary.solarSurfaceCue, claim.status),
        metric("v54-boundary", "v54 numerical boundary", summary.numericalIntegrityBoundaryPreserved, claim.status),
        metric("runtime-certification", "Runtime certification", summary.runtimeCertificationStatus, claim.status),
        metric("artistic-certification", "Artistic certification", summary.artisticCertificationStatus, claim.status),
        metric("wcag-certification", "WCAG certification", summary.wcagCertificationStatus, claim.status),
        metric("scientific-certification", "Scientific certification", summary.scientificCertificationStatus, claim.status),
        metric("ci-certification", "CI certification", summary.ciCertificationStatus, claim.status),
        metric("universe-sandbox-clone", "Universe Sandbox clone", summary.universeSandboxCloneStatus, claim.status),
        metric("online-validation", "Online validation", summary.onlineValidationStatus, claim.status),
        metric("online-asset-completeness", "Online asset completeness", summary.onlineAssetCompletenessStatus, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
      ],
      confidenceRationale:
        "Visual confidence only: the helper is deterministic local metadata and browser tooling verifies DOM markers, selected-body art profiles, pixel budgets and local review screenshots outside the runtime UI.",
      assumptions: [
        "Universe Sandbox is used as a visual reference direction, not as an asset or certification source.",
        "Development may refresh or generate local helper assets, but runtime rendering reads prepared local public textures only.",
      ],
      limitations: [
        "Does not claim Universe Sandbox clone status, AAA production certification, WCAG certification, scientific certification, online validation, online asset completeness, CI status, or latest runtime command status.",
        "Does not add a new panel id, scientific observable, online astronomy database, full numerical relativity, cosmological N-body, or complete deep-sky catalog.",
        "Does not mutate SolarSystemIntegrator, physicsEngine, EIH 1PN dynamics, worker physics or the Kerr geodesic kernel.",
      ],
      relatedViews: ["evidence-ledger", "telemetry"],
    }),
  );
}


export function cinematicDeepSpaceBackdropClaim(): EvidenceClaim {
  const summary = createAtlasCinematicDeepSpaceBackdropSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "cinematic-deep-space-backdrop",
    group: "cinematic-deep-space-backdrop",
    title: "Cinematic deep-space backdrop",
    status: "informational",
    confidence: "visual",
    source: `Atlas Cinematic Deep-Space Backdrop ${ATLAS_CINEMATIC_DEEP_SPACE_BACKDROP_VERSION}`,
    model:
      "Local v56 NASA SVS prepared sky manifest, sparse starfield, nebula haze and selected-body negative-space profiles over existing v48-v55 render layers",
    metric: `${summary.skyManifest}; ${summary.starfieldProfile}; ${summary.negativeSpaceProfile}`,
    error:
      "No Universe Sandbox clone, AAA/WCAG/science/CI certification, online validation, runtime asset completeness claim, or physics mutation is claimed.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        `Atlas Cinematic Deep-Space Backdrop ${summary.version}`,
        "Universe Sandbox public screenshots as composition reference only",
        "NASA SVS Deep Star Maps 2020 and Elsewhere Starfield 2020 cached during development",
        "Local v56 sky manifest, GalaxyEnvironmentSphere shader layers, ScienceBackdrop and browser acceptance screenshots",
      ],
      method:
        "Describe deterministic local sky manifest, sparse primary-star layer, faint distant-star layer, Milky Way dark-lane mask, soft nebula haze and selected-body negative-space profile without fetching data at runtime or changing body state, ephemerides, integrators or worker physics.",
      metrics: [
        metric("cinematic-backdrop-version", "Cinematic backdrop version", summary.version, claim.status),
        metric("reference-mode", "Reference mode", summary.referenceMode, claim.status),
        metric("source-policy", "Source policy", summary.sourcePolicy, claim.status),
        metric("sky-manifest", "Sky manifest", summary.skyManifest, claim.status),
        metric("runtime-assets", "Runtime assets", summary.runtimeAssetSource, claim.status),
        metric("source-inputs", "Source inputs", summary.sourceInputs.join(", "), claim.status),
        metric("starfield-profile", "Starfield profile", summary.starfieldProfile, claim.status),
        metric("closeup-starfield-profile", "Close-up starfield profile", summary.closeupStarfieldProfile, claim.status),
        metric("nebula-profile", "Nebula profile", summary.nebulaProfile, claim.status),
        metric("closeup-nebula-profile", "Close-up nebula profile", summary.closeupNebulaProfile, claim.status),
        metric("negative-space-profile", "Negative-space profile", summary.negativeSpaceProfile, claim.status),
        metric("closeup-negative-space-profile", "Close-up negative-space profile", summary.closeupNegativeSpaceProfile, claim.status),
        metric("highlight-policy", "Highlight policy", summary.backgroundHighlightPolicy, claim.status),
        metric("dark-lane-policy", "Dark-lane policy", summary.milkyWayDarkLanePolicy, claim.status),
        metric("v55-boundary", "v55 planetary art boundary", summary.planetaryArtBoundaryPreserved, claim.status),
        metric("runtime-certification", "Runtime certification", summary.runtimeCertificationStatus, claim.status),
        metric("artistic-certification", "Artistic certification", summary.artisticCertificationStatus, claim.status),
        metric("wcag-certification", "WCAG certification", summary.wcagCertificationStatus, claim.status),
        metric("scientific-certification", "Scientific certification", summary.scientificCertificationStatus, claim.status),
        metric("ci-certification", "CI certification", summary.ciCertificationStatus, claim.status),
        metric("universe-sandbox-clone", "Universe Sandbox clone", summary.universeSandboxCloneStatus, claim.status),
        metric("online-validation", "Online validation", summary.onlineValidationStatus, claim.status),
        metric("online-asset-completeness", "Online asset completeness", summary.onlineAssetCompletenessStatus, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
      ],
      confidenceRationale:
        "Visual confidence only: the helper is deterministic local metadata and browser tooling verifies DOM markers, selected-body backdrop profiles, pixel budgets and local review screenshots outside the runtime UI.",
      assumptions: [
        "Universe Sandbox is used as a visual reference direction, not as an asset or certification source.",
        "NASA SVS inputs may be downloaded during development and converted into local runtime sky assets.",
        "Runtime rendering reads prepared local public textures only.",
      ],
      limitations: [
        "Does not claim Universe Sandbox clone status, AAA production certification, WCAG certification, scientific certification, online validation, online asset completeness, CI status, or latest runtime command status.",
        "Does not add a new panel id, scientific observable, online astronomy database, full numerical relativity, cosmological N-body, or complete deep-sky catalog.",
        "Does not mutate SolarSystemIntegrator, physicsEngine, EIH 1PN dynamics, worker physics or the Kerr geodesic kernel.",
      ],
      relatedViews: ["evidence-ledger", "telemetry"],
    }),
  );
}


export function sparseDeepSpaceDirectorClaim(): EvidenceClaim {
  const summary = createAtlasSparseDeepSpaceDirectorSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "sparse-deep-space-director",
    group: "sparse-deep-space-director",
    title: "Sparse deep-space director",
    status: "informational",
    confidence: "visual",
    source: `Atlas Sparse Deep-Space Director ${ATLAS_SPARSE_DEEP_SPACE_DIRECTOR_VERSION}`,
    model:
      "Local v57 NASA SVS 16K prepared sky manifest with sparse primary stars, ultra-faint distant stars, deep Milky Way dark lanes, soft haze and selected-body negative-space profiles",
    metric: `${summary.skyManifest}; ${summary.starfieldProfile}; ${summary.negativeSpaceProfile}`,
    error:
      "No Universe Sandbox clone, AAA/WCAG/science/CI certification, online validation, runtime asset completeness claim, or physics mutation is claimed.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        `Atlas Sparse Deep-Space Director ${summary.version}`,
        "Universe Sandbox public screenshots as sparse composition reference only",
        "NASA SVS Deep Star Maps 2020 16K and Elsewhere Starfield 2020 16K cached during development",
        "Local v57 sky manifest, dual star layers, GalaxyEnvironmentSphere shader uniforms, ScienceBackdrop and browser acceptance screenshots",
      ],
      method:
        "Describe deterministic local v57 sky manifest, sparse primary-star layer, ultra-faint distant-star layer, deep Milky Way dark-lane treatment, barely visible nebula haze and selected-body negative-space profiles without fetching data at runtime or changing body state, ephemerides, integrators or worker physics.",
      metrics: [
        metric("sparse-deep-space-version", "Sparse deep-space version", summary.version, claim.status),
        metric("reference-mode", "Reference mode", summary.referenceMode, claim.status),
        metric("source-policy", "Source policy", summary.sourcePolicy, claim.status),
        metric("sky-manifest", "Sky manifest", summary.skyManifest, claim.status),
        metric("runtime-assets", "Runtime assets", summary.runtimeAssetSource, claim.status),
        metric("source-inputs", "Source inputs", summary.sourceInputs.join(", "), claim.status),
        metric("starfield-profile", "Starfield profile", summary.starfieldProfile, claim.status),
        metric("closeup-starfield-profile", "Close-up starfield profile", summary.closeupStarfieldProfile, claim.status),
        metric("milky-way-profile", "Milky Way profile", summary.milkyWayProfile, claim.status),
        metric("closeup-milky-way-profile", "Close-up Milky Way profile", summary.closeupMilkyWayProfile, claim.status),
        metric("nebula-profile", "Nebula profile", summary.nebulaProfile, claim.status),
        metric("closeup-nebula-profile", "Close-up nebula profile", summary.closeupNebulaProfile, claim.status),
        metric("negative-space-profile", "Negative-space profile", summary.negativeSpaceProfile, claim.status),
        metric("closeup-negative-space-profile", "Close-up negative-space profile", summary.closeupNegativeSpaceProfile, claim.status),
        metric("background-pixel-budget", "Background pixel budget", summary.backgroundPixelBudget, claim.status),
        metric("v41-boundary", "v41 accessibility boundary", summary.aaBoundaryPreserved, claim.status),
        metric("v56-boundary", "v56 backdrop boundary", summary.cinematicBackdropBoundaryPreserved, claim.status),
        metric("v55-boundary", "v55 planetary art boundary", summary.planetaryArtBoundaryPreserved, claim.status),
        metric("v54-boundary", "v54 numerical boundary", summary.numericalIntegrityBoundaryPreserved, claim.status),
        metric("runtime-certification", "Runtime certification", summary.runtimeCertificationStatus, claim.status),
        metric("artistic-certification", "Artistic certification", summary.artisticCertificationStatus, claim.status),
        metric("wcag-certification", "WCAG certification", summary.wcagCertificationStatus, claim.status),
        metric("scientific-certification", "Scientific certification", summary.scientificCertificationStatus, claim.status),
        metric("ci-certification", "CI certification", summary.ciCertificationStatus, claim.status),
        metric("universe-sandbox-clone", "Universe Sandbox clone", summary.universeSandboxCloneStatus, claim.status),
        metric("online-validation", "Online validation", summary.onlineValidationStatus, claim.status),
        metric("online-asset-completeness", "Online asset completeness", summary.onlineAssetCompletenessStatus, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
      ],
      confidenceRationale:
        "Visual confidence only: the helper is deterministic local metadata and browser tooling verifies DOM markers, selected-body sparse-backdrop profiles, non-brittle pixel budgets and local review screenshots outside the runtime UI.",
      assumptions: [
        "Universe Sandbox is used as a sparse deep-space visual reference direction, not as an asset or certification source.",
        "NASA SVS 16K inputs may be downloaded during development and converted into local runtime sky assets.",
        "Runtime rendering reads prepared local public textures only.",
      ],
      limitations: [
        "Does not claim Universe Sandbox clone status, AAA production certification, WCAG certification, scientific certification, online validation, online asset completeness, CI status, or latest runtime command status.",
        "Does not add a new panel id, scientific observable, online astronomy database, full numerical relativity, cosmological N-body, or complete deep-sky catalog.",
        "Does not mutate SolarSystemIntegrator, physicsEngine, EIH 1PN dynamics, worker physics or the Kerr geodesic kernel.",
      ],
      relatedViews: ["evidence-ledger", "telemetry"],
    }),
  );
}


export function closeupPresentationTruthClaim(): EvidenceClaim {
  const summary = createAtlasCloseupPresentationTruthSummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "closeup-presentation-truth",
    group: "closeup-presentation-truth",
    title: "Close-up presentation truth",
    status: "informational",
    confidence: "visual",
    source: `Atlas Close-Up Presentation Truth ${ATLAS_CLOSEUP_PRESENTATION_TRUTH_VERSION}`,
    model:
      "Local v58 selected-body preview sync plus v62 layered parallax darkfield, depth-aware orbit hairlines, solar limb control, close-up orbit budget, depth occlusion and read-only velocity-color presentation cues",
    metric: `${summary.backgroundArtProfile}; ${summary.orbitHierarchyProfile}; ${summary.orbitPerformanceProfile}; ${summary.orbitMaterialProfile}; ${summary.solarCloseupProfile}; ${summary.velocityTrailProfile}`,
    error:
      "No physics mutation, Universe Sandbox clone, AAA/WCAG/science/CI certification, online validation, runtime command result or online asset completeness claim is made.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        `Atlas Close-Up Presentation Truth ${summary.version}`,
        "Existing selected-body state, local planet texture manifests and v57 sparse deep-space profiles",
        "BodyDetailSidebar preview markers, GalaxyEnvironmentSphere close-up backdrop cues and browser acceptance screenshots",
      ],
      method:
        "Describe deterministic local selected-body preview synchronization, solar clean-backdrop treatment and body-specific close-up readability profiles without fetching runtime assets or changing body state, ephemerides, integrators, worker physics or Kerr behavior.",
      metrics: [
        metric("closeup-presentation-version", "Close-up presentation version", summary.version, claim.status),
        metric("background-orbit-art-version", "Background and orbit art version", summary.backgroundOrbitArtVersion, claim.status),
        metric("preview-sync-target", "Preview sync target", summary.previewSyncTarget, claim.status),
        metric("default-preview-sync", "Default preview sync", summary.defaultPreviewSyncStatus, claim.status),
        metric("default-review-mode", "Default review mode", summary.defaultReviewMode, claim.status),
        metric("scene-review-mode", "Scene review mode", summary.sceneReviewMode, claim.status),
        metric("solar-backdrop-profile", "Solar backdrop profile", summary.solarBackdropProfile, claim.status),
        metric("planet-readability-profile", "Planet readability profile", summary.planetReadabilityProfile, claim.status),
        metric("background-art-profile", "Background art profile", summary.backgroundArtProfile, claim.status),
        metric("orbit-hierarchy-profile", "Orbit hierarchy profile", summary.orbitHierarchyProfile, claim.status),
        metric("orbit-performance-profile", "Orbit performance profile", summary.orbitPerformanceProfile, claim.status),
        metric("orbit-material-profile", "Orbit material profile", summary.orbitMaterialProfile, claim.status),
        metric("solar-closeup-profile", "Solar close-up profile", summary.solarCloseupProfile, claim.status),
        metric("velocity-trail-profile", "Velocity trail profile", summary.velocityTrailProfile, claim.status),
        metric("orbit-occlusion-profile", "Orbit occlusion profile", summary.orbitOcclusionProfile, claim.status),
        metric("preview-profiles", "Preview profiles", summary.supportedPreviewProfiles.join(", "), claim.status),
        metric("texture-policies", "Texture policies", summary.supportedTexturePolicies.join(", "), claim.status),
        metric("ring-states", "Ring states", summary.supportedRingStates.join(", "), claim.status),
        metric("v41-boundary", "v41 accessibility boundary", summary.aaBoundaryPreserved, claim.status),
        metric("v57-boundary", "v57 sparse deep-space boundary", summary.sparseDeepSpaceBoundaryPreserved, claim.status),
        metric("v55-boundary", "v55 planetary art boundary", summary.planetaryArtBoundaryPreserved, claim.status),
        metric("runtime-certification", "Runtime certification", summary.runtimeCertificationStatus, claim.status),
        metric("artistic-certification", "Artistic certification", summary.artisticCertificationStatus, claim.status),
        metric("wcag-certification", "WCAG certification", summary.wcagCertificationStatus, claim.status),
        metric("scientific-certification", "Scientific certification", summary.scientificCertificationStatus, claim.status),
        metric("ci-certification", "CI certification", summary.ciCertificationStatus, claim.status),
        metric("universe-sandbox-clone", "Universe Sandbox clone", summary.universeSandboxCloneStatus, claim.status),
        metric("online-validation", "Online validation", summary.onlineValidationStatus, claim.status),
        metric("online-asset-completeness", "Online asset completeness", summary.onlineAssetCompletenessStatus, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
      ],
      confidenceRationale:
        "Visual confidence only: deterministic metadata and browser tooling verify selected-body preview markers, profile sync and local review screenshots outside the runtime UI.",
      assumptions: [
        "The sidebar preview is a local presentation cue bound to the selected body, not a separate scientific renderer.",
        "Universe Sandbox is used as a composition reference direction only.",
        "Runtime rendering reads prepared local public textures and live selected-body state only.",
      ],
      limitations: [
        "Does not claim Universe Sandbox clone status, AAA production certification, WCAG certification, scientific certification, online validation, online asset completeness, CI status, or latest runtime command status.",
        "Does not add a new panel id, scientific observable, online astronomy database, full numerical relativity, cosmological N-body, or complete deep-sky catalog.",
        "Does not mutate SolarSystemIntegrator, physicsEngine, EIH 1PN dynamics, worker physics or the Kerr geodesic kernel.",
      ],
      relatedViews: ["evidence-ledger", "telemetry"],
    }),
  );
}


export function closeupVisualFidelityClaim(): EvidenceClaim {
  const summary = createAtlasCloseupVisualFidelitySummary();
  const claim: EvidenceClaimWithoutPassport = {
    id: "closeup-visual-fidelity",
    group: "closeup-visual-fidelity",
    title: "Close-up visual fidelity",
    status: "informational",
    confidence: "visual",
    source: `Atlas Close-Up Visual Fidelity ${ATLAS_CLOSEUP_VISUAL_FIDELITY_VERSION}`,
    model:
      "Local v76 Earth, Saturn, Sun and Jupiter close-up material/exposure pass over audited HD/v49/v55 planet textures while preserving the v69/v71 orbit-atlas-v9 sky lock",
    metric: `${summary.visualTarget}; ${summary.assetPolicy}; full release ${summary.fullReleaseGateStatus}`,
    error:
      "No AAA, science, WCAG, online asset integrity, full release approval, physics, sky or Kerr kernel mutation is claimed.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        `Atlas Close-Up Visual Fidelity ${summary.version}`,
        "Existing local HD, v49 and v55 planet texture manifests",
        "Solar System Scope CC BY 4.0 source routed through existing fetch-planet-textures-8k.mjs only when development asset repair is needed",
        "v69 background art, v71 background regression guard, v72 material contract and v75 physics benchmark gate metadata",
      ],
      method:
        "Centralize and expose deterministic close-up fidelity budgets for Earth clouds/night/terminator, Saturn rings/occlusion, Sun granulation/bloom restraint and Jupiter band microcontrast while forbidding sky asset changes and leaving v75 physics thresholds untouched.",
      metrics: [
        metric("closeup-visual-version", "Close-up visual version", summary.version, claim.status),
        metric("visual-target", "Visual target", summary.visualTarget, claim.status),
        metric("asset-policy", "Asset policy", summary.assetPolicy, claim.status),
        metric("texture-source-policy", "Texture source policy", summary.textureSourcePolicy, claim.status),
        metric("runtime-asset-policy", "Runtime asset policy", summary.runtimeAssetPolicy, claim.status),
        metric("earth-profile", "Earth profile", summary.earthProfileId, claim.status),
        metric("saturn-profile", "Saturn profile", summary.saturnProfileId, claim.status),
        metric("sun-profile", "Sun profile", summary.sunProfileId, claim.status),
        metric("jupiter-profile", "Jupiter profile", summary.jupiterProfileId, claim.status),
        metric("protected-sky", "Protected sky manifest", summary.protectedSkyManifest, claim.status),
        metric("background-version", "Background version", summary.backgroundOrbitArtVersion, claim.status),
        metric("background-guard", "Background guard", summary.backgroundGuardVersion, claim.status),
        metric("material-profile", "Material profile", summary.materialProfileVersion, claim.status),
        metric("physics-gate", "Physics benchmark gate", summary.physicsBenchmarkGateVersion, claim.status),
        metric("full-release-gate", "Full release gate", summary.fullReleaseGateStatus, claim.status),
        metric("audited-texture-families", "Audited texture families", summary.auditedTextureFamilies.join(", "), claim.status),
        metric("runtime-certification", "Runtime certification", summary.runtimeCertificationStatus, claim.status),
        metric("artistic-certification", "Artistic certification", summary.artisticCertificationStatus, claim.status),
        metric("scientific-certification", "Scientific certification", summary.scientificCertificationStatus, claim.status),
        metric("wcag-certification", "WCAG certification", summary.wcagCertificationStatus, claim.status),
        metric("online-asset-completeness", "Online asset completeness", summary.onlineAssetCompletenessStatus, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
        metric("sky-asset-mutation", "Sky asset mutation", summary.skyAssetMutation, claim.status),
        metric("kerr-kernel-mutation", "Kerr kernel mutation", summary.kerrKernelMutation, claim.status),
      ],
      confidenceRationale:
        "Visual confidence only: deterministic metadata, local manifest tests and browser screenshots verify the close-up pass and protected sky lock, while strict Horizons remains a separate scientific certification blocker under the v78/v79 gate split.",
      assumptions: [
        "The v69/v71 blue-gray dense Milky Way background direction is intentionally preserved.",
        "Development may repair missing planet textures through the existing Solar System Scope script, but runtime rendering must use local public texture URLs only.",
        "v75 Horizons budget failures remain blocking for scientific certification, not for the product full verification command.",
      ],
      limitations: [
        "Does not certify AAA quality, scientific correctness, WCAG compliance, online asset completeness, CI status or full release readiness.",
        "Does not modify sky manifests, sky images, GalaxyEnvironmentSphere legacy v9 profiles or sky generation scripts.",
        "Does not mutate SolarSystemIntegrator, physicsEngine, EIH 1PN dynamics, worker physics, v75 thresholds or the Kerr geodesic kernel.",
      ],
      relatedViews: ["evidence-ledger", "telemetry"],
    }),
  );
}
