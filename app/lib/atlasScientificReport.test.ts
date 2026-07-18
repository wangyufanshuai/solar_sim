import { describe, expect, it } from "vitest";
import { createAtlasMissionCapsule, restoreAtlasMissionCapsule } from "./atlasMissionCapsule";
import { createAtlasMissionHubSummary } from "./atlasMissionHub";
import { createAtlasNavigatorSummary } from "./atlasNavigator";
import {
  ATLAS_REPORT_STUDIO_VERSION,
  ATLAS_REPORT_TEMPLATES,
  ATLAS_SCIENTIFIC_REPORT_VERSION,
  createAtlasReportStudioSummary,
  createAtlasScientificReportSummary,
  serializeAtlasScientificReportHtml,
  serializeAtlasScientificReportJson,
  serializeAtlasScientificReportMarkdown,
} from "./atlasScientificReport";
import { createAtlasWorkflowSummary } from "./atlasWorkflows";
import { createCelestialObjectPassport } from "./celestialCatalog";
import { createEvidenceLedgerSummary } from "./evidenceLedger";
import {
  createRelativityObservableAtlasSummary,
  createRelativityObservableExplainerSummary,
} from "./relativityObservableAtlas";
import { createRelativityGuidedTourSummary } from "./relativityGuidedTour";
import { createAtlasPlanetaryVisualFidelitySummary } from "./atlasPlanetaryVisualFidelity";
import { createAtlasCinematicLightingCompositionSummary } from "./atlasCinematicLightingComposition";
import { createAtlasChineseDeepSpaceFidelitySummary } from "./atlasChineseDeepSpaceFidelity";
import { createAtlasCinematicDeepSpaceCameraSummary } from "./atlasCinematicDeepSpaceCamera";
import { createAtlasUniverseSandboxReferenceBackdropSummary } from "./atlasUniverseSandboxReferenceBackdrop";
import { createAtlasReferenceGradeSpaceArtSummary } from "./atlasReferenceGradeSpaceArt";
import { createAtlasPlanetaryMaterialCompositionSummary } from "./atlasPlanetaryMaterialComposition";
import { createAtlasPlanetaryDepthLightingSummary } from "./atlasPlanetaryDepthLighting";
import { createAtlasPlanetaryColorGradingSummary } from "./atlasPlanetaryColorGrading";
import { createAtlasNumericalIntegritySummary } from "./atlasNumericalIntegrity";
import { createAtlasCinematicPlanetaryArtDirectionSummary } from "./atlasCinematicPlanetaryArtDirection";
import { createAtlasCinematicDeepSpaceBackdropSummary } from "./atlasCinematicDeepSpaceBackdrop";
import { createAtlasSparseDeepSpaceDirectorSummary } from "./atlasSparseDeepSpaceDirector";
import { createAtlasCloseupPresentationTruthSummary } from "./atlasCloseupPresentationTruth";
import { createAtlasCloseupVisualFidelitySummary } from "./atlasCloseupVisualFidelity";
import type {
  AtlasMissionCapsule,
  AtlasMissionHubSummary,
  AtlasNavigatorSummary,
  AtlasWorkflowSummary,
  CelestialObjectPassport,
  EvidenceLedgerSummary,
} from "./simulationDiagnosticsTypes";

describe("Atlas Scientific Report v28", () => {
  it("creates a non-crashing report from empty diagnostics and no selected object", () => {
    const { capsule, evidenceLedgerSummary, missionHubSummary, workflowSummary } = baseSummaries({
      selectedCatalogObjectId: "",
      selectedEvidenceClaimId: "",
      selectedWorkflowId: "",
      activeWorkflowStepId: "",
    });
    const summary = createAtlasScientificReportSummary({
      missionCapsule: capsule,
      missionHubSummary,
      evidenceLedgerSummary,
      selectedObjectPassport: null,
      workflowSummary,
      selectedBodyId: "",
      selectedEvidenceClaimId: "",
      selectedWorkflowId: "",
      activeWorkflowStepId: "",
      kerrLab: capsule.kerrLab,
      relativityObservableAtlasSummary: createRelativityObservableAtlasSummary({ diagnostics: null }),
      relativityObservableExplainerSummary: createRelativityObservableExplainerSummary({ diagnostics: null }),
      relativityGuidedTourSummary: createRelativityGuidedTourSummary({ diagnostics: null }),
      planetaryVisualFidelitySummary: createAtlasPlanetaryVisualFidelitySummary(),
      cinematicLightingSummary: createAtlasCinematicLightingCompositionSummary(),
      chineseDeepSpaceFidelitySummary: createAtlasChineseDeepSpaceFidelitySummary(),
      cinematicDeepSpaceCameraSummary: createAtlasCinematicDeepSpaceCameraSummary(),
      universeSandboxReferenceBackdropSummary: createAtlasUniverseSandboxReferenceBackdropSummary(),
      referenceGradeSpaceArtSummary: createAtlasReferenceGradeSpaceArtSummary(),
      planetaryMaterialCompositionSummary: createAtlasPlanetaryMaterialCompositionSummary(),
      planetaryDepthLightingSummary: createAtlasPlanetaryDepthLightingSummary(),
      planetaryColorGradingSummary: createAtlasPlanetaryColorGradingSummary(),
      numericalIntegritySummary: createAtlasNumericalIntegritySummary(null),
      cinematicPlanetaryArtDirectionSummary: createAtlasCinematicPlanetaryArtDirectionSummary(),
      cinematicDeepSpaceBackdropSummary: createAtlasCinematicDeepSpaceBackdropSummary(),
      sparseDeepSpaceDirectorSummary: createAtlasSparseDeepSpaceDirectorSummary(),
      createdAt: "2026-06-25T12:30:00.000Z",
    });

    expect(summary.version).toBe(ATLAS_SCIENTIFIC_REPORT_VERSION);
    expect(summary.sectionCount).toBe(8);
    expect(summary.sections.map((section) => section.id)).toEqual([
      "session-overview",
      "mission-capsule",
      "evidence-claims",
      "selected-target",
      "workflow-context",
      "relativity-observables",
      "kerr-lab",
      "trusted-boundaries",
    ]);
    expect(summary.sections.find((section) => section.id === "selected-target")?.body).toContain(
      "No selected catalog object",
    );
  });

  it("serializes Markdown and JSON deterministically", () => {
    const summary = fixtureReport();
    const markdown = serializeAtlasScientificReportMarkdown(summary);
    const json = serializeAtlasScientificReportJson(summary);

    expect(markdown).toBe(serializeAtlasScientificReportMarkdown(summary));
    expect(json).toBe(serializeAtlasScientificReportJson(summary));
    expect(JSON.parse(json)).toEqual(summary);
    expect(markdown).toContain("# Orbit Atlas Scientific Report");
    expect(markdown).toContain("Mission capsule: v27-mission-capsules");
    expect(markdown).toContain("Selected evidence: frw-planck2018-lcdm");
    expect(markdown).toContain("Selected object: nearby-star:sirius");
    expect(markdown).toContain("Selected workflow: relativity-lab");
  });

  it("creates deterministic Report Studio templates that preserve trusted boundaries", () => {
    const summary = fixtureReport();

    for (const template of ATLAS_REPORT_TEMPLATES) {
      const studio = createAtlasReportStudioSummary({
        reportSummary: summary,
        settings: {
          templateId: template.id,
          exportFormat: "markdown",
        },
      });

      expect(studio.version).toBe(ATLAS_REPORT_STUDIO_VERSION);
      expect(studio.selectedTemplate.id).toBe(template.id);
      expect(studio.includedSectionIds).toContain("trusted-boundaries");
      expect(studio.includedSectionCount).toBeGreaterThan(0);
      expect(studio.sectionToggles.find((toggle) => toggle.id === "trusted-boundaries")?.required).toBe(true);
      expect(studio.includedSectionIds).toEqual(
        createAtlasReportStudioSummary({
          reportSummary: summary,
          settings: {
            templateId: template.id,
            exportFormat: "markdown",
          },
        }).includedSectionIds,
      );
    }
  });

  it("keeps section toggles from producing an empty report", () => {
    const summary = fixtureReport();
    const studio = createAtlasReportStudioSummary({
      reportSummary: summary,
      settings: {
        templateId: "object-brief",
        includedSectionIds: [],
        exportFormat: "json",
      },
    });
    const json = JSON.parse(
      serializeAtlasScientificReportJson(summary, studio.settings),
    ) as { sections: readonly { id: string }[]; excludedState: readonly string[] };

    expect(studio.includedSectionIds).toEqual(["trusted-boundaries"]);
    expect(studio.includedSections.map((section) => section.id)).toEqual(["trusted-boundaries"]);
    expect(json.sections.map((section) => section.id)).toEqual(["trusted-boundaries"]);
    expect(json.excludedState).toEqual([]);
  });

  it("serializes deterministic self-contained printable HTML", () => {
    const summary = fixtureReport();
    const settings = {
      templateId: "relativity-lab-brief" as const,
      includedSectionIds: ["kerr-lab", "trusted-boundaries", "excluded-state"] as const,
      exportFormat: "html" as const,
    };
    const html = serializeAtlasScientificReportHtml(summary, settings);

    expect(html).toBe(serializeAtlasScientificReportHtml(summary, settings));
    expect(html).toContain("<style>");
    expect(html).toContain("Orbit Atlas Scientific Report");
    expect(html).toContain("v29-report-studio");
    expect(html).toContain("relativity-lab-brief");
    expect(html).toContain("Evidence claims");
    expect(html).toContain("capture-cone");
    expect(html).toContain("b/M 4.2");
    expect(html).toContain("Trusted boundaries");
    expect(html).not.toContain("http://");
    expect(html).not.toContain("https://");
    expect(html.toLowerCase()).not.toContain("<script");
    expect(html.toLowerCase()).not.toContain("<canvas");
    expect(html.toLowerCase()).not.toContain("screenshot");
    expect(html).not.toContain("telemetry samples");
    expect(html).not.toContain("ephemeris arrays");
    expect(html).not.toContain("physics buffers");
    expect(html).not.toContain("posM");
    expect(html).not.toContain("velM");
    expect(html).not.toContain("gaiaRows");
  });

  it("summarizes capsule, evidence, object, workflow, Kerr Lab and trusted boundaries", () => {
    const summary = fixtureReport();
    const metricText = summary.sections
      .flatMap((section) => section.metrics.map((metric) => `${metric.id}:${metric.value}`))
      .join("\n");

    expect(summary.missionCapsuleVersion).toBe("v27-mission-capsules");
    expect(summary.evidenceClaimCount).toBeGreaterThan(8);
    expect(summary.selectedEvidenceClaimId).toBe("frw-planck2018-lcdm");
    expect(summary.selectedObjectId).toBe("nearby-star:sirius");
    expect(summary.selectedWorkflowId).toBe("relativity-lab");
    expect(summary.activeWorkflowStepId).toBe("open-kerr-lab");
    expect(summary.kerrLab).toEqual(
      expect.objectContaining({
        spinA: 0.73,
        impactParameterM: 4.2,
        orbitPresetId: "capture-cone",
        renderMode: "both",
        studioMode: "probe",
      }),
    );
    expect(metricText).toContain("capsule-version:v27-mission-capsules");
    expect(metricText).toContain("ledger-version:v21-claim-passports");
    expect(metricText).toContain("observable-version:v37-relativity-observable-atlas");
    expect(metricText).toContain("explainer-version:v39-relativity-observable-explainer");
    expect(metricText).toContain("explainer-cards:7");
    expect(metricText).toContain("explainer-steps:28");
    expect(metricText).toContain("guided-tour-version:v40-relativity-guided-tour");
    expect(metricText).toContain("guided-tour-workflow:relativity-guided-tour");
    expect(metricText).toContain("guided-tour-steps:7");
    expect(metricText).toContain("guided-tour-ready:7");
    expect(metricText).toContain("planetary-visual-version:v43-planetary-visual-fidelity-pass");
    expect(metricText).toContain("planetary-visual-target:selected-body-closeup-realism");
    expect(metricText).toContain("planetary-asset-policy:network-prepared-local-runtime");
    expect(metricText).toContain("cinematic-lighting-version:v44-cinematic-lighting-composition");
    expect(metricText).toContain("cinematic-lighting-profile:filmic-closeup-balanced");
    expect(metricText).toContain("cinematic-postfx-profile:aces-vignette-restrained-bloom");
    expect(metricText).toContain("cinematic-asset-policy:dev-prepared-local-runtime");
    expect(metricText).toContain("chinese-interface-version:v45-chinese-deep-space-fidelity");
    expect(metricText).toContain("chinese-ui-language:zh-CN");
    expect(metricText).toContain("deep-space-visual-profile:milky-way-constellation-nebula-balanced");
    expect(metricText).toContain("deep-space-asset-policy:local-runtime-assets");
    expect(metricText).toContain("cinematic-camera-version:v46-cinematic-deep-space-camera");
    expect(metricText).toContain("cinematic-camera-profile:overview-atlas");
    expect(metricText).toContain("cinematic-closeup-camera-profile:selected-body-cinematic");
    expect(metricText).toContain("cinematic-quality-budget:stable-high-fidelity");
    expect(metricText).toContain("reference-backdrop-version:v47-universe-sandbox-reference-backdrop");
    expect(metricText).toContain("reference-backdrop-mode:inspired-reference-comparison");
    expect(metricText).toContain("reference-subject-visibility:selected-body-in-frame");
    expect(metricText).toContain("reference-grade-space-art-version:v48-reference-grade-space-art");
    expect(metricText).toContain("reference-grade-art-direction:cinematic-scientific-space-simulation");
    expect(metricText).toContain("reference-grade-composite:overview-layered-reference-grade, selected-body-subject-matte, showcase-cinematic-deep-space");
    expect(metricText).toContain("reference-grade-starfield:closeup-star-noise-suppressed");
    expect(metricText).toContain("reference-grade-subject-matte:selected-body-background-matte");
    expect(metricText).toContain("reference-grade-asset-policy:generated-local-runtime-assets");
    expect(metricText).toContain("reference-grade-review-mode:local-reference-image-review-rubric");
    expect(metricText).toContain("planetary-material-composition-version:v49-planetary-material-composition");
    expect(metricText).toContain("planetary-material-target:closeup-body-material-depth");
    expect(metricText).toContain("planetary-material-profiles:overview-local-material, earth-cloud-night-depth, gas-giant-band-depth, saturn-ring-material-depth, solar-granulation-depth, lunar-mars-relief-depth, terrestrial-terminator-depth");
    expect(metricText).toContain("planetary-ring-profile:saturn-cassini-layered-ring");
    expect(metricText).toContain("planetary-material-asset-policy:dev-refresh-prepared-local-runtime");
    expect(summary.planetaryVisualFidelity).toEqual(
      expect.objectContaining({
        version: "v43-planetary-visual-fidelity-pass",
        visualTarget: "selected-body-closeup-realism",
        assetPolicy: "network-prepared-local-runtime",
      }),
    );
    expect(summary.cinematicLighting).toEqual(
      expect.objectContaining({
        version: "v44-cinematic-lighting-composition",
        visualTarget: "closeup-cinematic-lighting-composition",
        lightingProfile: "filmic-closeup-balanced",
        postFxProfile: "aces-vignette-restrained-bloom",
        assetPolicy: "dev-prepared-local-runtime",
      }),
    );
    expect(summary.chineseDeepSpaceFidelity).toEqual(
      expect.objectContaining({
        version: "v45-chinese-deep-space-fidelity",
        uiLanguage: "zh-CN",
        localizationMode: "zh-cn-primary-scientific-ids-preserved",
        visualProfile: "milky-way-constellation-nebula-balanced",
        assetPolicy: "local-runtime-assets",
      }),
    );
    expect(summary.cinematicDeepSpaceCamera).toEqual(
      expect.objectContaining({
        version: "v46-cinematic-deep-space-camera",
        cameraProfile: "overview-atlas",
        qualityBudget: "stable-high-fidelity",
      }),
    );
    expect(summary.universeSandboxReferenceBackdrop).toEqual(
      expect.objectContaining({
        version: "v47-universe-sandbox-reference-backdrop",
        referenceMode: "inspired-reference-comparison",
        backgroundArtDirection: "sparse-stars-layered-milky-way",
        subjectVisibilityProfile: "selected-body-in-frame",
        screenshotReview: "local-only",
      }),
    );
    expect(summary.referenceGradeSpaceArt).toEqual(
      expect.objectContaining({
        version: "v48-reference-grade-space-art",
        artDirection: "cinematic-scientific-space-simulation",
        compositeProfile: "overview-layered-reference-grade, selected-body-subject-matte, showcase-cinematic-deep-space",
        assetPolicy: "generated-local-runtime-assets",
        reviewMode: "local-reference-screenshot-rubric",
      }),
    );
    expect(summary.planetaryMaterialComposition).toEqual(
      expect.objectContaining({
        version: "v49-planetary-material-composition",
        materialTarget: "closeup-body-material-depth",
        assetPolicy: "dev-refresh-prepared-local-runtime",
        ringProfile: "saturn-cassini-layered-ring",
      }),
    );
    expect(summary.planetaryDepthLighting).toEqual(
      expect.objectContaining({
        version: "v52-planetary-depth-lighting",
        lightingTarget: "closeup-atmospheric-terminator-ring-depth",
        saturnDepthLightingProfile: "saturn-ring-shadow-depth",
        ringShadowCue: "saturn-equatorial-ring-shadow-matte",
        assetPolicy: "local-runtime-assets",
      }),
    );
    expect(summary.planetaryColorGrading).toEqual(
      expect.objectContaining({
        version: "v53-planetary-color-grading",
        colorTarget: "closeup-planet-color-layer-depth",
        gasGiantColorGradeProfile: "gas-giant-layer-color-grade",
        saturnColorGradeProfile: "saturn-ring-occlusion-color-grade",
        saturnOcclusionCue: "saturn-ring-body-occlusion-tone",
        assetPolicy: "local-runtime-assets",
      }),
    );
    expect(summary.numericalIntegrity).toEqual(
      expect.objectContaining({
        version: "v54-numerical-integrity-gate",
        integrityStatus: "informational",
        timestepSensitivityCoverage: "covered-by-local-tests-not-runtime-claimed",
        timeReversalCoverage: "covered-by-local-tests-not-runtime-claimed",
        unitAuditCoverage: "covered-by-local-tests-not-runtime-claimed",
      }),
    );
    expect(metricText).toContain("cinematic-planetary-art-version:v55-cinematic-planetary-art-direction");
    expect(metricText).toContain("cinematic-art-quality-target:aaa-inspired-scientific-space-simulation");
    expect(metricText).toContain("cinematic-art-asset-policy:dev-refresh-prepared-local-runtime");
    expect(metricText).toContain("gas-giant-art-profile:gas-giant-band-depth-cinematic");
    expect(metricText).toContain("saturn-ring-art-profile:saturn-cassini-backlit-ring-art");
    expect(metricText).toContain("earth-cloud-night-profile:earth-clean-cloud-night-shadow-art");
    expect(metricText).toContain("solar-surface-profile:solar-granulation-controlled-corona-art");
    expect(metricText).toContain("cinematic-backdrop-version:v56-cinematic-deep-space-backdrop");
    expect(metricText).toContain("cinematic-backdrop-source-policy:nasa-svs-prepared-local-runtime");
    expect(metricText).toContain("cinematic-backdrop-sky-manifest:orbit-atlas-v56");
    expect(metricText).toContain("cinematic-backdrop-starfield:sparse-primary-stars-faint-distant-field");
    expect(metricText).toContain("cinematic-backdrop-nebula:soft-local-nebula-haze-layer");
    expect(metricText).toContain("cinematic-backdrop-negative-space:layered-milky-way-negative-space");
    expect(metricText).toContain("sparse-deep-space-version:v57-sparse-deep-space-director");
    expect(metricText).toContain("sparse-deep-space-source-policy:nasa-svs-16k-prepared-local-runtime");
    expect(metricText).toContain("sparse-deep-space-sky-manifest:orbit-atlas-v57");
    expect(metricText).toContain("sparse-deep-space-starfield:sparse-primary-stars-ultrafaint-distant-field");
    expect(metricText).toContain("sparse-deep-space-milky-way:deep-cold-gray-blue-dark-lanes");
    expect(metricText).toContain("sparse-deep-space-negative-space:overview-wide-negative-space");
    expect(metricText).toContain("closeup-presentation-version:v58-closeup-presentation-truth");
    expect(metricText).toContain("closeup-preview-sync-target:selected-body-sidebar-preview");
    expect(metricText).toContain("closeup-solar-backdrop:solar-clean-negative-space");
    expect(metricText).toContain("closeup-planet-readability:body-specific-closeup-readable");
    expect(metricText).toContain("closeup-visual-fidelity-version:v76-closeup-visual-fidelity-pass");
    expect(metricText).toContain("closeup-visual-asset-policy:v76-local-hd-planets-existing-source-audited");
    expect(metricText).toContain("closeup-protected-sky-manifest:orbit-atlas-v9");
    expect(metricText).toContain("closeup-full-release-gate:product-ready-scientific-horizons-blocked");
    expect(summary.cinematicPlanetaryArtDirection).toEqual(
      expect.objectContaining({
        version: "v55-cinematic-planetary-art-direction",
        qualityTarget: "aaa-inspired-scientific-space-simulation",
        assetPolicy: "dev-refresh-prepared-local-runtime",
        gasGiantArtProfile: "gas-giant-band-depth-cinematic",
        saturnRingArtProfile: "saturn-cassini-backlit-ring-art",
        earthCloudNightProfile: "earth-clean-cloud-night-shadow-art",
        solarSurfaceProfile: "solar-granulation-controlled-corona-art",
        globalColorGradeProfile: "filmic-cool-space-warm-planet-protection",
      }),
    );
    expect(summary.cinematicDeepSpaceBackdrop).toEqual(
      expect.objectContaining({
        version: "v56-cinematic-deep-space-backdrop",
        sourcePolicy: "nasa-svs-prepared-local-runtime",
        skyManifest: "orbit-atlas-v56",
        starfieldProfile: "sparse-primary-stars-faint-distant-field",
        nebulaProfile: "soft-local-nebula-haze-layer",
        negativeSpaceProfile: "layered-milky-way-negative-space",
      }),
    );
    expect(summary.sparseDeepSpaceDirector).toEqual(
      expect.objectContaining({
        version: "v57-sparse-deep-space-director",
        sourcePolicy: "nasa-svs-16k-prepared-local-runtime",
        skyManifest: "orbit-atlas-v57",
        starfieldProfile: "sparse-primary-stars-ultrafaint-distant-field",
        milkyWayProfile: "deep-cold-gray-blue-dark-lanes",
        nebulaProfile: "barely-visible-local-haze",
        negativeSpaceProfile: "overview-wide-negative-space",
      }),
    );
    expect(summary.closeupPresentationTruth).toEqual(
      expect.objectContaining({
        version: "v58-closeup-presentation-truth",
        previewSyncStatus: "no-selected-body",
        solarBackdropProfile: "solar-clean-negative-space",
        planetReadabilityProfile: "body-specific-closeup-readable",
      }),
    );
    expect(summary.closeupVisualFidelity).toEqual(
      expect.objectContaining({
        version: "v76-closeup-visual-fidelity-pass",
        assetPolicy: "v76-local-hd-planets-existing-source-audited",
        protectedSkyManifest: "orbit-atlas-v9",
        fullReleaseGateStatus: "product-ready-scientific-horizons-blocked",
      }),
    );
    expect(metricText).toContain("impact:4.2");
    expect(metricText).toContain("studio-mode:probe");
    expect(summary.sections.find((section) => section.id === "trusted-boundaries")?.body).toContain(
      "full numerical relativity",
    );
  });

  it("explicitly excludes live physics buffers, telemetry arrays, screenshots and large catalog rows", () => {
    const summary = fixtureReport();
    const serialized = `${serializeAtlasScientificReportMarkdown(summary)}\n${serializeAtlasScientificReportJson(summary)}`;

    expect(summary.excludedState).toEqual(
      expect.arrayContaining([
        "live physics buffers",
        "SharedArrayBuffer state",
        "ephemeris arrays",
        "telemetry samples",
        "screenshots",
        "large catalog rows",
      ]),
    );
    expect(serialized).not.toContain("posM");
    expect(serialized).not.toContain("velM");
    expect(serialized).not.toContain("gaiaRows");
    expect(serialized).not.toContain("ephemerisSamples");
    expect(serialized).not.toContain("screenshotPng");
  });

  it("keeps invalid capsule restore warnings readable without crashing the report", () => {
    const { capsule, navigatorSummary, evidenceLedgerSummary, workflowSummary } = baseSummaries({});
    const restoreSummary = restoreAtlasMissionCapsule({
      capsule: null,
      warnings: [{ code: "invalid-json", message: "Mission capsule payload is not valid JSON." }],
      source: "json-import",
      navigatorSummary,
      workflowSummary,
    });
    const missionHubSummary = createAtlasMissionHubSummary({
      navigatorSummary,
      workflowSummary,
      capsuleRestoreSummary: restoreSummary,
    });
    const summary = createAtlasScientificReportSummary({
      missionCapsule: capsule,
      missionHubSummary,
      evidenceLedgerSummary,
      selectedObjectPassport: null,
      workflowSummary,
      kerrLab: capsule.kerrLab,
      relativityObservableAtlasSummary: createRelativityObservableAtlasSummary({ diagnostics: null }),
      relativityObservableExplainerSummary: createRelativityObservableExplainerSummary({ diagnostics: null }),
      relativityGuidedTourSummary: createRelativityGuidedTourSummary({ diagnostics: null }),
      createdAt: "2026-06-25T12:30:00.000Z",
    });

    expect(summary.missionCapsuleWarningCount).toBe(1);
    expect(serializeAtlasScientificReportMarkdown(summary)).toContain("Restore warnings: 1");
  });

  it.each(["report", "dossier", "evidence report", "report studio", "html report", "printable dossier"])(
    "lets Navigator search %s open the Report Studio panel",
    (query) => {
      const { evidenceLedgerSummary } = baseSummaries({});
      const navigator = createAtlasNavigatorSummary({
        query,
        evidenceLedgerSummary,
        orbitAnalysisAvailable: true,
        maxResults: 8,
      });

      expect(navigator.results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: "panel:scientific-report",
            panelId: "scientific-report",
            action: "open-panel",
          }),
        ]),
      );
    },
  );
});

function fixtureReport() {
  const {
    capsule,
    evidenceLedgerSummary,
    missionHubSummary,
    workflowSummary,
    objectPassport,
  } = baseSummaries({});
  return createAtlasScientificReportSummary({
    missionCapsule: capsule,
    missionHubSummary,
    evidenceLedgerSummary,
    selectedObjectPassport: objectPassport,
    workflowSummary,
    selectedEvidenceClaimId: "frw-planck2018-lcdm",
    selectedWorkflowId: "relativity-lab",
    activeWorkflowStepId: "open-kerr-lab",
    kerrLab: capsule.kerrLab,
    relativityObservableAtlasSummary: createRelativityObservableAtlasSummary({ diagnostics: null }),
    relativityObservableExplainerSummary: createRelativityObservableExplainerSummary({ diagnostics: null }),
    relativityGuidedTourSummary: createRelativityGuidedTourSummary({ diagnostics: null }),
    planetaryVisualFidelitySummary: createAtlasPlanetaryVisualFidelitySummary(),
    cinematicLightingSummary: createAtlasCinematicLightingCompositionSummary(),
    chineseDeepSpaceFidelitySummary: createAtlasChineseDeepSpaceFidelitySummary(),
    cinematicDeepSpaceCameraSummary: createAtlasCinematicDeepSpaceCameraSummary(),
    universeSandboxReferenceBackdropSummary: createAtlasUniverseSandboxReferenceBackdropSummary(),
    referenceGradeSpaceArtSummary: createAtlasReferenceGradeSpaceArtSummary(),
    planetaryMaterialCompositionSummary: createAtlasPlanetaryMaterialCompositionSummary(),
    planetaryDepthLightingSummary: createAtlasPlanetaryDepthLightingSummary(),
    planetaryColorGradingSummary: createAtlasPlanetaryColorGradingSummary(),
    numericalIntegritySummary: createAtlasNumericalIntegritySummary(null),
    cinematicPlanetaryArtDirectionSummary: createAtlasCinematicPlanetaryArtDirectionSummary(),
    cinematicDeepSpaceBackdropSummary: createAtlasCinematicDeepSpaceBackdropSummary(),
    sparseDeepSpaceDirectorSummary: createAtlasSparseDeepSpaceDirectorSummary(),
    closeupPresentationTruthSummary: createAtlasCloseupPresentationTruthSummary(),
    closeupVisualFidelitySummary: createAtlasCloseupVisualFidelitySummary(),
    createdAt: "2026-06-25T12:30:00.000Z",
  });
}

function baseSummaries(overrides: {
  selectedCatalogObjectId?: string;
  selectedEvidenceClaimId?: string;
  selectedWorkflowId?: string;
  activeWorkflowStepId?: string;
}): {
  capsule: AtlasMissionCapsule;
  evidenceLedgerSummary: EvidenceLedgerSummary;
  navigatorSummary: AtlasNavigatorSummary;
  workflowSummary: AtlasWorkflowSummary;
  missionHubSummary: AtlasMissionHubSummary;
  objectPassport: CelestialObjectPassport | null;
} {
  const evidenceLedgerSummary = createEvidenceLedgerSummary({
    diagnostics: null,
    orbitAtlasProfile: "orbit-atlas-v12",
    orbitAtlasRenderer: "cold-body-web-v12",
    gaiaCatalogSource: "gaia-dr3",
    orbitAtlasReady: true,
    presentationMode: "orbit-atlas",
  });
  const navigatorSummary = createAtlasNavigatorSummary({
    evidenceLedgerSummary,
    orbitAnalysisAvailable: true,
    maxResults: 2000,
  });
  const workflowSummary = createAtlasWorkflowSummary({ navigatorSummary });
  const selectedCatalogObjectId = overrides.selectedCatalogObjectId ?? "nearby-star:sirius";
  const selectedEvidenceClaimId = overrides.selectedEvidenceClaimId ?? "frw-planck2018-lcdm";
  const selectedWorkflowId = overrides.selectedWorkflowId ?? "relativity-lab";
  const activeWorkflowStepId = overrides.activeWorkflowStepId ?? "open-kerr-lab";
  const capsule = createAtlasMissionCapsule({
    presentationMode: "orbit-atlas",
    scaleMode: "compressed",
    renderBudget: "balanced",
    viewSettings: {
      showConstellationLines: true,
      showDeepSkyObjects: true,
      showCatalogLabels: false,
      showKerrBlackHole: true,
    },
    selectedCatalogObjectId,
    selectedEvidenceClaimId,
    selectedWorkflowId,
    activeWorkflowStepId,
    missionHubStoredState: {
      recentActions: [
        { id: "panel:kerr-relativity-lab", kind: "panel-action", timestamp: 20 },
        { id: "evidence-claim:frw-planck2018-lcdm", kind: "evidence-claim", timestamp: 10 },
      ],
      pinnedItems: [
        { id: "celestial-object:nearby-star:sirius", kind: "celestial-object", timestamp: 30 },
        { id: "evidence-claim:frw-planck2018-lcdm", kind: "evidence-claim", timestamp: 31 },
        { id: "panel:kerr-relativity-lab", kind: "panel-action", timestamp: 32 },
      ],
    },
    kerrLab: {
      showKerrBlackHole: true,
      spinA: 0.73,
      impactParameterM: 4.2,
      orbitPresetId: "capture-cone",
      renderMode: "both",
      studioMode: "probe",
    },
    createdAt: "2026-06-25T12:00:00.000Z",
  });
  const restoreSummary = restoreAtlasMissionCapsule({
    capsule,
    source: "copy-link",
    navigatorSummary,
    workflowSummary,
  });
  const missionHubSummary = createAtlasMissionHubSummary({
    navigatorSummary,
    workflowSummary,
    storedState: capsule.missionHub,
    capsuleRestoreSummary: restoreSummary,
    selectedCatalogObjectId,
    selectedEvidenceClaimId,
    selectedWorkflowId,
    activeWorkflowStepId,
  });

  return {
    capsule,
    evidenceLedgerSummary,
    navigatorSummary,
    workflowSummary,
    missionHubSummary,
    objectPassport: selectedCatalogObjectId
      ? createCelestialObjectPassport(selectedCatalogObjectId)
      : null,
  };
}
