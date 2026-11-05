import { describe, expect, it } from "vitest";
import {
  ATLAS_CLOSEUP_PRESENTATION_TRUTH_VERSION,
  ATLAS_BACKGROUND_ORBIT_ART_VERSION,
  createAtlasCloseupPresentationTruthSummary,
  createBodyVisualPreviewProfile,
} from "./atlasCloseupPresentationTruth";
import {
  ATLAS_MATERIAL_STABILITY_PROFILE,
  ATLAS_SKY_ART_LOCK_PROFILE,
  ATLAS_VISUAL_STABILITY_VERSION,
  createAtlasVisualStabilitySummary,
} from "./atlasVisualStability";
import {
  ATLAS_BACKGROUND_GUARD_VERSION,
  ATLAS_SKY_REGRESSION_BUDGET_PROFILE,
  createAtlasBackgroundGuardSummary,
} from "./atlasBackgroundGuard";
import { createLegacyV9SkyUniformProfile } from "./legacyV9SkyProfile";
import {
  ATLAS_CLOSEUP_MATERIAL_BUDGET_PROFILE,
  ATLAS_MATERIAL_PROFILE_VERSION,
  V72_CLOSEUP_MATERIAL_BUDGETS,
  V72_MATERIAL_PROFILE_IDS,
  createAtlasMaterialProfileSummary,
} from "./atlasMaterialProfileContract";

describe("Atlas Close-Up Presentation Truth v58/v69/v70/v71/v72", () => {
  it("returns deterministic metadata without certification or physics claims", () => {
    const first = createAtlasCloseupPresentationTruthSummary();
    const second = createAtlasCloseupPresentationTruthSummary();

    expect(first).toEqual(second);
    expect(first.version).toBe(ATLAS_CLOSEUP_PRESENTATION_TRUTH_VERSION);
    expect(first.backgroundOrbitArtVersion).toBe(ATLAS_BACKGROUND_ORBIT_ART_VERSION);
    expect(first.previewSyncTarget).toBe("selected-body-sidebar-preview");
    expect(first.solarBackdropProfile).toBe("solar-clean-negative-space");
    expect(first.planetReadabilityProfile).toBe("body-specific-closeup-readable");
    expect(first.backgroundArtProfile).toBe("v69-legacy-blue-dust-starfield");
    expect(first.orbitHierarchyProfile).toBe("major-identity-minor-restrained");
    expect(first.orbitPerformanceProfile).toBe("closeup-selected-orbit-budget");
    expect(first.orbitMaterialProfile).toBe("v67-layered-depth-orbit-ribbons");
    expect(first.solarCloseupProfile).toBe("solar-limb-controlled-corona");
    expect(first.velocityTrailProfile).toBe("selected-log-velocity-three-stop");
    expect(first.orbitOcclusionProfile).toBe("depth-tested-closeup-fade");
    expect(first.physicsMutation).toBe("not-applied");
    expect(first.runtimeCertificationStatus).toBe("not-claimed-in-app");
    expect(first.artisticCertificationStatus).toBe("not-claimed");
    expect(first.scientificCertificationStatus).toBe("not-claimed");
    expect(first.wcagCertificationStatus).toBe("not-claimed");
    expect(first.ciCertificationStatus).toBe("not-claimed");
    expect(first.onlineValidationStatus).toBe("not-claimed");
    expect(first.onlineAssetCompletenessStatus).toBe("not-claimed");
    expect(first.universeSandboxCloneStatus).toBe("not-claimed");
    expect("trustScore" in first).toBe(false);
    expect(first.trustedBoundary).toContain("no physics state");
    expect(first.trustedBoundary).toContain("online validation");
  });

  it("locks the v70 visual stability contract to the v69 legacy sky direction", () => {
    const first = createAtlasVisualStabilitySummary();
    const second = createAtlasVisualStabilitySummary();

    expect(first).toEqual(second);
    expect(first.version).toBe(ATLAS_VISUAL_STABILITY_VERSION);
    expect(first.skyArtLockProfile).toBe(ATLAS_SKY_ART_LOCK_PROFILE);
    expect(first.materialStabilityProfile).toBe(ATLAS_MATERIAL_STABILITY_PROFILE);
    expect(first.backgroundOrbitArtVersion).toBe("v69-legacy-8k-sky-restore");
    expect(first.backgroundArtProfile).toBe("v69-legacy-blue-dust-starfield");
    expect(first.lockedSkyManifest).toBe("orbit-atlas-v9");
    expect(first.selectedBodyMaterialTarget).toBe("earth-saturn-sun-closeup-coherence");
    expect(first.physicsMutation).toBe("not-applied");
    expect(first.skyAssetMutation).toBe("not-applied");
    expect(first.kerrKernelMutation).toBe("not-applied");
    expect(first.runtimeCertificationStatus).toBe("not-claimed-in-app");
    expect(first.artisticCertificationStatus).toBe("not-claimed");
    expect(first.scientificCertificationStatus).toBe("not-claimed");
    expect(first.onlineAssetCompletenessStatus).toBe("not-claimed");
    expect(first.trustedBoundary).toContain("orbit-atlas-v9");
    expect(first.trustedBoundary).toContain("No sky asset generation");
    expect(first.trustedBoundary).toContain("Kerr kernel mutation");
    expect("trustScore" in first).toBe(false);
  });

  it("locks the v71 background regression guard to the v69 legacy sky budget", () => {
    const first = createAtlasBackgroundGuardSummary();
    const second = createAtlasBackgroundGuardSummary();

    expect(first).toEqual(second);
    expect(first.version).toBe(ATLAS_BACKGROUND_GUARD_VERSION);
    expect(first.skyRegressionBudgetProfile).toBe(ATLAS_SKY_REGRESSION_BUDGET_PROFILE);
    expect(first.backgroundOrbitArtVersion).toBe("v69-legacy-8k-sky-restore");
    expect(first.backgroundArtProfile).toBe("v69-legacy-blue-dust-starfield");
    expect(first.visualStabilityVersion).toBe("v70-visual-stability-material-pass");
    expect(first.lockedSkyManifest).toBe("orbit-atlas-v9");
    expect(first.protectedSkyDirection).toBe("legacy-blue-gray-milky-way-dust-lanes-bright-stars");
    expect(first.regressionGuardTarget).toBe("overview-and-selected-body-background-budget");
    expect(first.physicsMutation).toBe("not-applied");
    expect(first.skyAssetMutation).toBe("not-applied");
    expect(first.kerrKernelMutation).toBe("not-applied");
    expect(first.runtimeCertificationStatus).toBe("not-claimed-in-app");
    expect(first.artisticCertificationStatus).toBe("not-claimed");
    expect(first.scientificCertificationStatus).toBe("not-claimed");
    expect(first.wcagCertificationStatus).toBe("not-claimed");
    expect(first.onlineAssetCompletenessStatus).toBe("not-claimed");
    expect(first.trustedBoundary).toContain("orbit-atlas-v9");
    expect(first.trustedBoundary).toContain("No sky asset generation");
    expect(first.trustedBoundary).toContain("Kerr kernel mutation");
    expect("trustScore" in first).toBe(false);
  });

  it("keeps the legacy v9 overview and close-up uniform budgets deterministic", () => {
    expect(
      createLegacyV9SkyUniformProfile({
        selectedBodyCinematic: false,
        solarCloseup: false,
        gasGiantCloseup: false,
        dimCloseupSky: false,
        referenceDepth: 0,
        negativeSpace: 0,
      }),
    ).toEqual({
      base: {
        uOrbitAtlas: 1,
        uCinematicBackdrop: 0.08,
        uParallaxStrength: 0.12,
        uExposureRolloff: 0.06,
        uVignetteStrength: 0.045,
        uDarkfieldStrength: 0.08,
        uPeripheralGuard: 1,
        uCleanCloseup: 0,
        uNoiseSuppression: 0.1,
        uMilkyWayRestraint: 0.12,
        uReferenceDepth: 0.24,
        uNegativeSpace: 0.08,
        uExposure: 0.92,
        uContrast: 1.3,
        uSaturation: 0.38,
      },
      stars: {
        uOpacity: 0.082,
        uThreshold: 0.5,
        uFaintScale: 0.05,
        uColorRestraint: 0.36,
        uTwinkleStrength: 0.035,
      },
    });

    expect(
      createLegacyV9SkyUniformProfile({
        selectedBodyCinematic: true,
        solarCloseup: false,
        gasGiantCloseup: true,
        dimCloseupSky: true,
        referenceDepth: 0.2,
        negativeSpace: 0.1,
      }),
    ).toEqual(
      expect.objectContaining({
        base: expect.objectContaining({
          uParallaxStrength: 0.03,
          uCleanCloseup: 0.18,
          uNoiseSuppression: 0.92,
          uMilkyWayRestraint: 0.9,
          uReferenceDepth: 0.9,
          uNegativeSpace: 0.86,
          uExposure: 0.56,
          uContrast: 1.52,
          uSaturation: 0.18,
        }),
        stars: expect.objectContaining({
          uOpacity: 0.022,
          uThreshold: 0.74,
          uFaintScale: 0.004,
        }),
      }),
    );

    expect(
      createLegacyV9SkyUniformProfile({
        selectedBodyCinematic: true,
        solarCloseup: true,
        gasGiantCloseup: false,
        dimCloseupSky: true,
        referenceDepth: 0.95,
        negativeSpace: 0.91,
      }),
    ).toEqual(
      expect.objectContaining({
        base: expect.objectContaining({
          uCleanCloseup: 0.62,
          uReferenceDepth: 0.95,
          uNegativeSpace: 0.91,
          uExposure: 0.12,
        }),
        stars: expect.objectContaining({
          uOpacity: 0.012,
          uTwinkleStrength: 0.015,
        }),
      }),
    );
  });

  it("locks the v72 material profile contract without physics or sky mutation", () => {
    const first = createAtlasMaterialProfileSummary();
    const second = createAtlasMaterialProfileSummary();

    expect(first).toEqual(second);
    expect(first.version).toBe(ATLAS_MATERIAL_PROFILE_VERSION);
    expect(first.closeupMaterialBudgetProfile).toBe(ATLAS_CLOSEUP_MATERIAL_BUDGET_PROFILE);
    expect(first.backgroundOrbitArtVersion).toBe("v69-legacy-8k-sky-restore");
    expect(first.backgroundGuardVersion).toBe("v71-background-regression-guard");
    expect(first.visualStabilityVersion).toBe("v70-visual-stability-material-pass");
    expect(first.earthProfileId).toBe(V72_MATERIAL_PROFILE_IDS.earth);
    expect(first.saturnProfileId).toBe(V72_MATERIAL_PROFILE_IDS.saturn);
    expect(first.sunProfileId).toBe(V72_MATERIAL_PROFILE_IDS.sun);
    expect(first.gasGiantProfileId).toBe(V72_MATERIAL_PROFILE_IDS.gasGiant);
    expect(first.assetPolicy).toBe("existing-local-textures-and-shader-profiles-only");
    expect(first.physicsMutation).toBe("not-applied");
    expect(first.skyAssetMutation).toBe("not-applied");
    expect(first.kerrKernelMutation).toBe("not-applied");
    expect(first.runtimeCertificationStatus).toBe("not-claimed-in-app");
    expect(first.artisticCertificationStatus).toBe("not-claimed");
    expect(first.scientificCertificationStatus).toBe("not-claimed");
    expect(first.wcagCertificationStatus).toBe("not-claimed");
    expect(first.onlineAssetCompletenessStatus).toBe("not-claimed");
    expect(first.trustedBoundary).toContain("v69 legacy sky direction");
    expect(first.trustedBoundary).toContain("No sky asset generation");
    expect(first.trustedBoundary).toContain("Kerr kernel mutation");
    expect("trustScore" in first).toBe(false);
  });

  it("keeps the v72 close-up material budgets fixed for Earth, Saturn, Sun and gas giants", () => {
    expect(V72_CLOSEUP_MATERIAL_BUDGETS.earth).toEqual({
      normalScale: [2.22, 2.22],
      depthLightingOpacity: 0.098,
      colorGradeOpacity: 0.105,
      nightCoolFloor: [0.105, 0.15, 0.205],
      nightCoolFloorMix: 0.36,
    });
    expect(V72_CLOSEUP_MATERIAL_BUDGETS.saturn).toEqual({
      normalScale: [1.28, 0.78],
      keyFillOpacity: 0.062,
      depthLightingOpacity: 0.22,
      colorGradeOpacity: 0.132,
      ringShadowContribution: 1.65,
      occlusionMixMax: 0.92,
    });
    expect(V72_CLOSEUP_MATERIAL_BUDGETS.sun).toEqual({
      materialDepth: 1.75,
      exposure: 0.74,
      mobileExposure: 0.3,
      glowOpacity: 0.042,
      mobileGlowOpacity: 0.028,
      granuleFrequencyMax: 70,
      cellFrequencyMax: 160,
    });
    expect(V72_CLOSEUP_MATERIAL_BUDGETS.gasGiant).toEqual({
      normalScale: [1.1, 0.72],
      keyFillOpacity: 0.074,
      colorGradeOpacity: 0.205,
    });
    expect(V72_CLOSEUP_MATERIAL_BUDGETS.saturnRing).toEqual({
      showcaseOpacityMultiplier: 2.02,
      artOpacityMultiplier: 1.74,
      mainRingOpacity: 0.58,
      cassiniGapOpacity: 0.34,
      outerRingOpacity: 0.16,
      shaderArtAlphaBoost: 1.24,
    });
  });

  it("maps selected bodies to truthful sidebar preview profiles", () => {
    expect(createBodyVisualPreviewProfile({ id: "sun", variant: "sun" })).toEqual(
      expect.objectContaining({
        bodyId: "sun",
        renderProfile: "solar-procedural-preview",
        texturePolicy: "hd-or-v49-local-texture",
        ringState: "no-ring",
        solarCue: "solar-granulation-preview",
      }),
    );
    expect(createBodyVisualPreviewProfile({ id: "earth", textureMap: "/earth.jpg" })).toEqual(
      expect.objectContaining({
        renderProfile: "earth-cloud-night-preview",
        cloudNightCue: "earth-cloud-night-cue",
      }),
    );
    expect(createBodyVisualPreviewProfile({ id: "jupiter", textureMap: "/jupiter.jpg" })).toEqual(
      expect.objectContaining({
        renderProfile: "gas-giant-band-preview",
        ringState: "no-ring",
      }),
    );
    expect(createBodyVisualPreviewProfile({ id: "saturn", showRings: true, textureMap: "/saturn.jpg" })).toEqual(
      expect.objectContaining({
        renderProfile: "saturn-ringed-band-preview",
        ringState: "ringed",
      }),
    );
    expect(createBodyVisualPreviewProfile({ id: "mars", textureMap: "/mars.jpg" }).renderProfile).toBe(
      "lunar-mars-relief-preview",
    );
    expect(createBodyVisualPreviewProfile({ id: "asteroid-x" })).toEqual(
      expect.objectContaining({
        renderProfile: "fallback-procedural-preview",
        texturePolicy: "procedural-fallback",
      }),
    );
  });
});
