import type {
  AtlasMissionCapsule,
  AtlasMissionHubSummary,
  AtlasReportSectionId,
  AtlasReportStudioSettings,
  AtlasReportStudioSummary,
  AtlasReportStudioVersion,
  AtlasReportTemplate,
  AtlasReportTemplateId,
  AtlasScientificReportSection,
  AtlasScientificReportSectionId,
  AtlasScientificReportSummary,
  AtlasScientificReportVersion,
  AtlasWorkflowSummary,
  CelestialObjectPassport,
  EvidenceClaim,
  EvidenceClaimStatus,
  EvidenceLedgerSummary,
  EvidencePassportMetric,
  KerrGeodesicRenderMode,
  KerrOrbitPresetId,
  KerrRelativityStudioMode,
  RelativityGuidedTourSummary,
  RelativityObservableAtlasSummary,
  RelativityObservableExplainerSummary,
  AtlasChineseDeepSpaceFidelitySummary,
  AtlasCinematicDeepSpaceCameraSummary,
  AtlasCinematicDeepSpaceBackdropSummary,
  AtlasSparseDeepSpaceDirectorSummary,
  AtlasCloseupPresentationTruthSummary,
  AtlasCloseupVisualFidelitySummary,
  AtlasCinematicPlanetaryArtDirectionSummary,
  AtlasCinematicKeyLightDirectorSummary,
  AtlasNumericalIntegritySummary,
  AtlasPlanetaryDepthLightingSummary,
  AtlasPlanetaryColorGradingSummary,
  AtlasCinematicLightingCompositionSummary,
  AtlasPlanetaryVisualFidelitySummary,
  AtlasPlanetaryMaterialCompositionSummary,
  AtlasCinematicCloseupDirectorSummary,
  AtlasReferenceGradeSpaceArtSummary,
  AtlasUniverseSandboxReferenceBackdropSummary,
} from "./simulationDiagnosticsTypes";

export const ATLAS_SCIENTIFIC_REPORT_VERSION: AtlasScientificReportVersion =
  "v28-scientific-report";
export const ATLAS_REPORT_STUDIO_VERSION: AtlasReportStudioVersion =
  "v29-report-studio";

const EXCLUDED_STATE = [
  "live physics buffers",
  "SharedArrayBuffer state",
  "ephemeris arrays",
  "telemetry samples",
  "screenshots",
  "large catalog rows",
  "backend account or cloud state",
] as const;

export const ATLAS_REPORT_TEMPLATES: readonly AtlasReportTemplate[] = [
  {
    id: "mission-dossier",
    title: "Mission dossier",
    subtitle: "Full session dossier with capsule, evidence, target, workflow and Kerr Studio.",
    includedSectionIds: [
      "session-overview",
      "mission-capsule",
      "evidence-claims",
      "selected-target",
      "workflow-context",
      "relativity-observables",
      "kerr-lab",
      "trusted-boundaries",
      "excluded-state",
    ],
  },
  {
    id: "evidence-audit",
    title: "Evidence audit",
    subtitle: "Evidence-first report for claim review and provenance checks.",
    includedSectionIds: [
      "session-overview",
      "evidence-claims",
      "mission-capsule",
      "trusted-boundaries",
      "excluded-state",
    ],
  },
  {
    id: "object-brief",
    title: "Object brief",
    subtitle: "Selected object/body context with supporting evidence and boundaries.",
    includedSectionIds: [
      "selected-target",
      "evidence-claims",
      "mission-capsule",
      "trusted-boundaries",
      "excluded-state",
    ],
  },
  {
    id: "relativity-lab-brief",
    title: "Relativity lab brief",
    subtitle: "Kerr Studio and weak-field evidence context for relativity review.",
    includedSectionIds: [
      "kerr-lab",
      "relativity-observables",
      "evidence-claims",
      "workflow-context",
      "trusted-boundaries",
      "excluded-state",
    ],
  },
  {
    id: "catalog-provenance",
    title: "Catalog provenance",
    subtitle: "Catalog/object provenance with evidence and trusted boundaries.",
    includedSectionIds: [
      "selected-target",
      "evidence-claims",
      "session-overview",
      "trusted-boundaries",
      "excluded-state",
    ],
  },
];

const SECTION_LABELS: Record<AtlasReportSectionId, string> = {
  "session-overview": "Session overview",
  "mission-capsule": "Mission capsule",
  "evidence-claims": "Evidence claims",
  "selected-target": "Selected object / body",
  "workflow-context": "Workflow context",
  "kerr-lab": "Kerr Studio",
  "relativity-observables": "Relativity observables",
  "trusted-boundaries": "Trusted boundaries",
  "excluded-state": "Excluded state",
};

export type CreateAtlasScientificReportSummaryArgs = {
  missionCapsule: AtlasMissionCapsule;
  missionHubSummary: AtlasMissionHubSummary;
  evidenceLedgerSummary: EvidenceLedgerSummary;
  selectedObjectPassport?: CelestialObjectPassport | null;
  workflowSummary: AtlasWorkflowSummary;
  selectedBodyId?: string | null;
  selectedBodyLabel?: string | null;
  selectedEvidenceClaimId?: string | null;
  selectedWorkflowId?: string | null;
  activeWorkflowStepId?: string | null;
  kerrLab: {
    showKerrBlackHole: boolean;
    spinA: number;
    impactParameterM: number;
    orbitPresetId: KerrOrbitPresetId;
    renderMode: KerrGeodesicRenderMode;
    studioMode?: KerrRelativityStudioMode;
  };
  relativityObservableAtlasSummary?: RelativityObservableAtlasSummary | null;
  relativityObservableExplainerSummary?: RelativityObservableExplainerSummary | null;
  relativityGuidedTourSummary?: RelativityGuidedTourSummary | null;
  planetaryVisualFidelitySummary?: AtlasPlanetaryVisualFidelitySummary | null;
  cinematicLightingSummary?: AtlasCinematicLightingCompositionSummary | null;
  chineseDeepSpaceFidelitySummary?: AtlasChineseDeepSpaceFidelitySummary | null;
  cinematicDeepSpaceCameraSummary?: AtlasCinematicDeepSpaceCameraSummary | null;
  universeSandboxReferenceBackdropSummary?: AtlasUniverseSandboxReferenceBackdropSummary | null;
  referenceGradeSpaceArtSummary?: AtlasReferenceGradeSpaceArtSummary | null;
  planetaryMaterialCompositionSummary?: AtlasPlanetaryMaterialCompositionSummary | null;
  cinematicCloseupDirectorSummary?: AtlasCinematicCloseupDirectorSummary | null;
  cinematicKeyLightDirectorSummary?: AtlasCinematicKeyLightDirectorSummary | null;
  planetaryDepthLightingSummary?: AtlasPlanetaryDepthLightingSummary | null;
  planetaryColorGradingSummary?: AtlasPlanetaryColorGradingSummary | null;
  numericalIntegritySummary?: AtlasNumericalIntegritySummary | null;
  cinematicPlanetaryArtDirectionSummary?: AtlasCinematicPlanetaryArtDirectionSummary | null;
  cinematicDeepSpaceBackdropSummary?: AtlasCinematicDeepSpaceBackdropSummary | null;
  sparseDeepSpaceDirectorSummary?: AtlasSparseDeepSpaceDirectorSummary | null;
  closeupPresentationTruthSummary?: AtlasCloseupPresentationTruthSummary | null;
  closeupVisualFidelitySummary?: AtlasCloseupVisualFidelitySummary | null;
  createdAt?: string;
  settings?: Partial<AtlasReportStudioSettings> | null;
};

export function createAtlasScientificReportSummary({
  missionCapsule,
  missionHubSummary,
  evidenceLedgerSummary,
  selectedObjectPassport,
  workflowSummary,
  selectedBodyId,
  selectedBodyLabel,
  selectedEvidenceClaimId,
  selectedWorkflowId,
  activeWorkflowStepId,
  kerrLab,
  relativityObservableAtlasSummary,
  relativityObservableExplainerSummary,
  relativityGuidedTourSummary,
  planetaryVisualFidelitySummary,
  cinematicLightingSummary,
  chineseDeepSpaceFidelitySummary,
  cinematicDeepSpaceCameraSummary,
  universeSandboxReferenceBackdropSummary,
  referenceGradeSpaceArtSummary,
  planetaryMaterialCompositionSummary,
  cinematicCloseupDirectorSummary,
  cinematicKeyLightDirectorSummary,
  planetaryDepthLightingSummary,
  planetaryColorGradingSummary,
  numericalIntegritySummary,
  cinematicPlanetaryArtDirectionSummary,
  cinematicDeepSpaceBackdropSummary,
  sparseDeepSpaceDirectorSummary,
  closeupPresentationTruthSummary,
  closeupVisualFidelitySummary,
  createdAt,
  settings,
}: CreateAtlasScientificReportSummaryArgs): AtlasScientificReportSummary {
  const evidenceClaimId =
    selectedEvidenceClaimId || missionCapsule.selected.evidenceClaimId || "";
  const evidenceClaim =
    evidenceLedgerSummary.claims.find((claim) => claim.id === evidenceClaimId) ?? null;
  const workflowId =
    selectedWorkflowId || missionCapsule.selected.workflowId || "";
  const workflow =
    workflowSummary.workflows.find((candidate) => candidate.id === workflowId) ?? null;
  const workflowStepId =
    activeWorkflowStepId || missionCapsule.selected.workflowStepId || "";
  const workflowStep =
    workflow?.steps.find((step) => step.id === workflowStepId) ?? null;
  const bodyId = selectedBodyId || missionCapsule.selected.bodyId || "";
  const objectId =
    selectedObjectPassport?.objectId ?? missionCapsule.selected.catalogObjectId ?? "";
  const sections: AtlasScientificReportSection[] = [
    sessionOverviewSection(missionHubSummary, evidenceLedgerSummary, bodyId, objectId),
    missionCapsuleSection(missionCapsule, missionHubSummary),
    evidenceClaimsSection(evidenceLedgerSummary, evidenceClaim),
    selectedTargetSection({
      selectedObjectPassport,
      selectedBodyId: bodyId,
      selectedBodyLabel,
    }),
    workflowContextSection(workflowSummary, workflow, workflowStepId, workflowStep),
    relativityObservablesSection(
      relativityObservableAtlasSummary,
      relativityObservableExplainerSummary,
      relativityGuidedTourSummary,
    ),
    kerrLabSection(kerrLab),
    trustedBoundariesSection(
      planetaryVisualFidelitySummary,
      cinematicLightingSummary,
      chineseDeepSpaceFidelitySummary,
      cinematicDeepSpaceCameraSummary,
      universeSandboxReferenceBackdropSummary,
      referenceGradeSpaceArtSummary,
      planetaryMaterialCompositionSummary,
      cinematicCloseupDirectorSummary,
      cinematicKeyLightDirectorSummary,
      planetaryDepthLightingSummary,
      planetaryColorGradingSummary,
      numericalIntegritySummary,
      cinematicPlanetaryArtDirectionSummary,
      cinematicDeepSpaceBackdropSummary,
      sparseDeepSpaceDirectorSummary,
      closeupPresentationTruthSummary,
      closeupVisualFidelitySummary,
    ),
  ];
  const studioSettings = settings
    ? normalizeReportStudioSettings(settings, sections)
    : null;
  const finalSections = studioSettings
    ? includedSectionsFor(sections, studioSettings.includedSectionIds)
    : sections;

  return {
    version: ATLAS_SCIENTIFIC_REPORT_VERSION,
    createdAt: createdAt ?? new Date().toISOString(),
    title: "Orbit Atlas Scientific Report",
    subtitle: "Evidence dossier for a reproducible Atlas session",
    formatDefault: "markdown",
    sectionCount: finalSections.length,
    evidenceClaimCount: evidenceLedgerSummary.claimCount,
    readyEvidenceCount: evidenceLedgerSummary.readyCount,
    failedEvidenceCount: evidenceLedgerSummary.failedCount,
    selectedEvidenceClaimId: evidenceClaimId,
    selectedObjectId: objectId,
    selectedWorkflowId: workflowId,
    activeWorkflowStepId: workflowStepId,
    missionCapsuleVersion: missionCapsule.version,
    missionCapsuleActive: missionHubSummary.capsuleRestoreSummary?.active ?? false,
    missionCapsuleWarningCount: missionHubSummary.capsuleRestoreSummary?.warningCount ?? 0,
    kerrLab,
    relativityObservableAtlas: relativityObservableAtlasSummary
      ? {
          version: relativityObservableAtlasSummary.version,
          status: relativityObservableAtlasSummary.status,
          observableCount: relativityObservableAtlasSummary.observableCount,
          readyCount: relativityObservableAtlasSummary.readyCount,
          boundary: relativityObservableAtlasSummary.boundary,
        }
      : undefined,
    relativityObservableExplainer: relativityObservableExplainerSummary
      ? {
          version: relativityObservableExplainerSummary.version,
          status: relativityObservableExplainerSummary.status,
          cardCount: relativityObservableExplainerSummary.cardCount,
          totalStepCount: relativityObservableExplainerSummary.totalStepCount,
          boundary: relativityObservableExplainerSummary.boundary,
      }
      : undefined,
    relativityGuidedTour: relativityGuidedTourSummary
      ? {
          version: relativityGuidedTourSummary.version,
          status: relativityGuidedTourSummary.status,
          workflowId: relativityGuidedTourSummary.workflowId,
          stepCount: relativityGuidedTourSummary.stepCount,
          readyCount: relativityGuidedTourSummary.readyCount,
          boundary: relativityGuidedTourSummary.boundary,
        }
      : undefined,
    planetaryVisualFidelity: planetaryVisualFidelitySummary
      ? {
          version: planetaryVisualFidelitySummary.version,
          status: planetaryVisualFidelitySummary.status,
          visualTarget: planetaryVisualFidelitySummary.visualTarget,
          styleTarget: planetaryVisualFidelitySummary.styleTarget,
          assetPolicy: planetaryVisualFidelitySummary.assetPolicy,
          boundary: planetaryVisualFidelitySummary.trustedBoundary,
        }
      : undefined,
    cinematicLighting: cinematicLightingSummary
      ? {
          version: cinematicLightingSummary.version,
          status: cinematicLightingSummary.status,
          visualTarget: cinematicLightingSummary.visualTarget,
          lightingProfile: cinematicLightingSummary.lightingProfile,
          postFxProfile: cinematicLightingSummary.postFxProfile,
          assetPolicy: cinematicLightingSummary.assetPolicy,
          boundary: cinematicLightingSummary.trustedBoundary,
        }
      : undefined,
    chineseDeepSpaceFidelity: chineseDeepSpaceFidelitySummary
      ? {
          version: chineseDeepSpaceFidelitySummary.version,
          status: chineseDeepSpaceFidelitySummary.status,
          uiLanguage: chineseDeepSpaceFidelitySummary.uiLanguage,
          localizationMode: chineseDeepSpaceFidelitySummary.localizationMode,
          visualProfile: chineseDeepSpaceFidelitySummary.visualProfile,
          assetPolicy: chineseDeepSpaceFidelitySummary.assetPolicy,
          boundary: chineseDeepSpaceFidelitySummary.trustedBoundary,
        }
      : undefined,
    cinematicDeepSpaceCamera: cinematicDeepSpaceCameraSummary
      ? {
          version: cinematicDeepSpaceCameraSummary.version,
          status: cinematicDeepSpaceCameraSummary.status,
          cameraProfile: cinematicDeepSpaceCameraSummary.defaultCameraProfile,
          skyCompositionProfile: cinematicDeepSpaceCameraSummary.supportedSkyCompositionProfiles.join(", "),
          backgroundNoiseProfile: cinematicDeepSpaceCameraSummary.supportedBackgroundNoiseProfiles.join(", "),
          qualityBudget: cinematicDeepSpaceCameraSummary.qualityBudget,
          boundary: cinematicDeepSpaceCameraSummary.trustedBoundary,
        }
      : undefined,
    universeSandboxReferenceBackdrop: universeSandboxReferenceBackdropSummary
      ? {
          version: universeSandboxReferenceBackdropSummary.version,
          status: universeSandboxReferenceBackdropSummary.status,
          referenceMode: universeSandboxReferenceBackdropSummary.referenceMode,
          backgroundArtDirection: universeSandboxReferenceBackdropSummary.backgroundArtDirection,
          depthProfile: universeSandboxReferenceBackdropSummary.supportedDepthProfiles.join(", "),
          subjectVisibilityProfile: universeSandboxReferenceBackdropSummary.subjectVisibilityProfile,
          screenshotReview: universeSandboxReferenceBackdropSummary.screenshotReview,
          boundary: universeSandboxReferenceBackdropSummary.trustedBoundary,
        }
      : undefined,
    referenceGradeSpaceArt: referenceGradeSpaceArtSummary
      ? {
          version: referenceGradeSpaceArtSummary.version,
          status: referenceGradeSpaceArtSummary.status,
          artDirection: referenceGradeSpaceArtSummary.artDirection,
          compositeProfile: referenceGradeSpaceArtSummary.supportedCompositeProfiles.join(", "),
          skyLayerProfile: referenceGradeSpaceArtSummary.supportedSkyLayerProfiles.join(", "),
          starfieldProfile: referenceGradeSpaceArtSummary.supportedStarfieldProfiles.join(", "),
          subjectMatteProfile: referenceGradeSpaceArtSummary.closeupSubjectMatteProfile,
          planetMaterialProfile: referenceGradeSpaceArtSummary.closeupPlanetMaterialProfile,
          assetPolicy: referenceGradeSpaceArtSummary.assetPolicy,
          reviewMode: referenceGradeSpaceArtSummary.reviewMode,
          boundary: referenceGradeSpaceArtSummary.trustedBoundary,
        }
      : undefined,
    planetaryMaterialComposition: planetaryMaterialCompositionSummary
      ? {
          version: planetaryMaterialCompositionSummary.version,
          status: planetaryMaterialCompositionSummary.status,
          materialTarget: planetaryMaterialCompositionSummary.materialTarget,
          materialProfile: planetaryMaterialCompositionSummary.supportedMaterialProfiles.join(", "),
          atmosphereDepthProfile: planetaryMaterialCompositionSummary.supportedAtmosphereDepthProfiles.join(", "),
          terminatorProfile: planetaryMaterialCompositionSummary.supportedTerminatorProfiles.join(", "),
          ringProfile: planetaryMaterialCompositionSummary.saturnRingProfile,
          assetPolicy: planetaryMaterialCompositionSummary.assetPolicy,
          boundary: planetaryMaterialCompositionSummary.trustedBoundary,
        }
      : undefined,
    cinematicCloseupDirector: cinematicCloseupDirectorSummary
      ? {
          version: cinematicCloseupDirectorSummary.version,
          status: cinematicCloseupDirectorSummary.status,
          compositionTarget: cinematicCloseupDirectorSummary.compositionTarget,
          compositionProfile: cinematicCloseupDirectorSummary.supportedCompositionProfiles.join(", "),
          panelAvoidanceProfile: cinematicCloseupDirectorSummary.desktopPanelAvoidanceProfile,
          ringShowcaseProfile: cinematicCloseupDirectorSummary.saturnRingShowcaseProfile,
          qualityBudget: cinematicCloseupDirectorSummary.qualityBudget,
          assetPolicy: cinematicCloseupDirectorSummary.assetPolicy,
          boundary: cinematicCloseupDirectorSummary.trustedBoundary,
        }
      : undefined,
    cinematicKeyLightDirector: cinematicKeyLightDirectorSummary
      ? {
          version: cinematicKeyLightDirectorSummary.version,
          status: cinematicKeyLightDirectorSummary.status,
          lightingTarget: cinematicKeyLightDirectorSummary.lightingTarget,
          keyLightProfiles: cinematicKeyLightDirectorSummary.supportedKeyLightProfiles.join(", "),
          gasGiantKeyLightProfile: cinematicKeyLightDirectorSummary.gasGiantKeyLightProfile,
          saturnKeyLightProfile: cinematicKeyLightDirectorSummary.saturnKeyLightProfile,
          qualityBudget: cinematicKeyLightDirectorSummary.qualityBudget,
          assetPolicy: cinematicKeyLightDirectorSummary.assetPolicy,
          boundary: cinematicKeyLightDirectorSummary.trustedBoundary,
        }
      : undefined,
    planetaryDepthLighting: planetaryDepthLightingSummary
      ? {
          version: planetaryDepthLightingSummary.version,
          status: planetaryDepthLightingSummary.status,
          lightingTarget: planetaryDepthLightingSummary.lightingTarget,
          depthLightingProfiles: planetaryDepthLightingSummary.supportedDepthLightingProfiles.join(", "),
          gasGiantDepthLightingProfile: planetaryDepthLightingSummary.gasGiantDepthLightingProfile,
          saturnDepthLightingProfile: planetaryDepthLightingSummary.saturnDepthLightingProfile,
          ringShadowCue: planetaryDepthLightingSummary.ringShadowCue,
          qualityBudget: planetaryDepthLightingSummary.qualityBudget,
          assetPolicy: planetaryDepthLightingSummary.assetPolicy,
          boundary: planetaryDepthLightingSummary.trustedBoundary,
        }
      : undefined,
    planetaryColorGrading: planetaryColorGradingSummary
      ? {
          version: planetaryColorGradingSummary.version,
          status: planetaryColorGradingSummary.status,
          colorTarget: planetaryColorGradingSummary.colorTarget,
          colorGradeProfiles: planetaryColorGradingSummary.supportedColorGradeProfiles.join(", "),
          gasGiantColorGradeProfile: planetaryColorGradingSummary.gasGiantColorGradeProfile,
          saturnColorGradeProfile: planetaryColorGradingSummary.saturnColorGradeProfile,
          saturnOcclusionCue: planetaryColorGradingSummary.saturnOcclusionCue,
          qualityBudget: planetaryColorGradingSummary.qualityBudget,
          assetPolicy: planetaryColorGradingSummary.assetPolicy,
          boundary: planetaryColorGradingSummary.trustedBoundary,
        }
      : undefined,
    numericalIntegrity: numericalIntegritySummary
      ? {
          version: numericalIntegritySummary.version,
          status: numericalIntegritySummary.status,
          integrityStatus: numericalIntegritySummary.integrityStatus,
          energyDriftTrend: numericalIntegritySummary.energyDriftTrend,
          angularMomentumDriftTrend: numericalIntegritySummary.angularMomentumDriftTrend,
          timestepSensitivityCoverage: numericalIntegritySummary.timestepSensitivityCoverage,
          timeReversalCoverage: numericalIntegritySummary.timeReversalCoverage,
          unitAuditCoverage: numericalIntegritySummary.unitAuditCoverage,
          benchmarkCount: numericalIntegritySummary.benchmarkCount,
          boundary: numericalIntegritySummary.trustedBoundary,
        }
      : undefined,
    cinematicPlanetaryArtDirection: cinematicPlanetaryArtDirectionSummary
      ? {
          version: cinematicPlanetaryArtDirectionSummary.version,
          status: cinematicPlanetaryArtDirectionSummary.status,
          referenceMode: cinematicPlanetaryArtDirectionSummary.referenceMode,
          qualityTarget: cinematicPlanetaryArtDirectionSummary.qualityTarget,
          assetPolicy: cinematicPlanetaryArtDirectionSummary.assetPolicy,
          gasGiantArtProfile: cinematicPlanetaryArtDirectionSummary.gasGiantArtProfile,
          saturnRingArtProfile: cinematicPlanetaryArtDirectionSummary.saturnRingArtProfile,
          earthCloudNightProfile: cinematicPlanetaryArtDirectionSummary.earthCloudNightProfile,
          solarSurfaceProfile: cinematicPlanetaryArtDirectionSummary.solarSurfaceProfile,
          globalColorGradeProfile: cinematicPlanetaryArtDirectionSummary.globalColorGradeProfile,
          backgroundArtGradeProfile: cinematicPlanetaryArtDirectionSummary.defaultBackgroundArtGradeProfile,
          boundary: cinematicPlanetaryArtDirectionSummary.trustedBoundary,
        }
      : undefined,
    cinematicDeepSpaceBackdrop: cinematicDeepSpaceBackdropSummary
      ? {
          version: cinematicDeepSpaceBackdropSummary.version,
          status: cinematicDeepSpaceBackdropSummary.status,
          referenceMode: cinematicDeepSpaceBackdropSummary.referenceMode,
          sourcePolicy: cinematicDeepSpaceBackdropSummary.sourcePolicy,
          skyManifest: cinematicDeepSpaceBackdropSummary.skyManifest,
          starfieldProfile: cinematicDeepSpaceBackdropSummary.starfieldProfile,
          nebulaProfile: cinematicDeepSpaceBackdropSummary.nebulaProfile,
          negativeSpaceProfile: cinematicDeepSpaceBackdropSummary.negativeSpaceProfile,
          boundary: cinematicDeepSpaceBackdropSummary.trustedBoundary,
        }
      : undefined,
    sparseDeepSpaceDirector: sparseDeepSpaceDirectorSummary
      ? {
          version: sparseDeepSpaceDirectorSummary.version,
          status: sparseDeepSpaceDirectorSummary.status,
          referenceMode: sparseDeepSpaceDirectorSummary.referenceMode,
          sourcePolicy: sparseDeepSpaceDirectorSummary.sourcePolicy,
          skyManifest: sparseDeepSpaceDirectorSummary.skyManifest,
          starfieldProfile: sparseDeepSpaceDirectorSummary.starfieldProfile,
          milkyWayProfile: sparseDeepSpaceDirectorSummary.milkyWayProfile,
          nebulaProfile: sparseDeepSpaceDirectorSummary.nebulaProfile,
          negativeSpaceProfile: sparseDeepSpaceDirectorSummary.negativeSpaceProfile,
          boundary: sparseDeepSpaceDirectorSummary.trustedBoundary,
        }
      : undefined,
    closeupPresentationTruth: closeupPresentationTruthSummary
      ? {
          version: closeupPresentationTruthSummary.version,
          backgroundOrbitArtVersion: closeupPresentationTruthSummary.backgroundOrbitArtVersion,
          status: closeupPresentationTruthSummary.status,
          previewSyncStatus: closeupPresentationTruthSummary.defaultPreviewSyncStatus,
          previewBodyId: bodyId,
          previewRenderProfile: "",
          solarBackdropProfile: closeupPresentationTruthSummary.solarBackdropProfile,
          planetReadabilityProfile: closeupPresentationTruthSummary.planetReadabilityProfile,
          backgroundArtProfile: closeupPresentationTruthSummary.backgroundArtProfile,
          orbitHierarchyProfile: closeupPresentationTruthSummary.orbitHierarchyProfile,
          orbitPerformanceProfile: closeupPresentationTruthSummary.orbitPerformanceProfile,
          orbitMaterialProfile: closeupPresentationTruthSummary.orbitMaterialProfile,
          solarCloseupProfile: closeupPresentationTruthSummary.solarCloseupProfile,
          velocityTrailProfile: closeupPresentationTruthSummary.velocityTrailProfile,
          orbitOcclusionProfile: closeupPresentationTruthSummary.orbitOcclusionProfile,
          reviewMode: closeupPresentationTruthSummary.defaultReviewMode,
          boundary: closeupPresentationTruthSummary.trustedBoundary,
        }
      : undefined,
    closeupVisualFidelity: closeupVisualFidelitySummary
      ? {
          version: closeupVisualFidelitySummary.version,
          status: closeupVisualFidelitySummary.status,
          visualTarget: closeupVisualFidelitySummary.visualTarget,
          assetPolicy: closeupVisualFidelitySummary.assetPolicy,
          textureSourcePolicy: closeupVisualFidelitySummary.textureSourcePolicy,
          runtimeAssetPolicy: closeupVisualFidelitySummary.runtimeAssetPolicy,
          protectedSkyManifest: closeupVisualFidelitySummary.protectedSkyManifest,
          fullReleaseGateStatus: closeupVisualFidelitySummary.fullReleaseGateStatus,
          boundary: closeupVisualFidelitySummary.trustedBoundary,
        }
      : undefined,
    excludedState: EXCLUDED_STATE,
    sections: finalSections,
    reportStudioVersion: studioSettings ? ATLAS_REPORT_STUDIO_VERSION : undefined,
    templateId: studioSettings?.templateId,
    includedSectionIds: studioSettings?.includedSectionIds,
  };
}

export function createAtlasReportStudioSummary({
  reportSummary,
  settings,
}: {
  reportSummary: AtlasScientificReportSummary;
  settings?: Partial<AtlasReportStudioSettings> | null;
}): AtlasReportStudioSummary {
  const normalized = normalizeReportStudioSettings(settings, reportSummary.sections);
  const selectedTemplate = templateById(normalized.templateId);
  const includedSections = includedSectionsFor(reportSummary.sections, normalized.includedSectionIds);
  const availableSectionIds = availableReportSectionIds(reportSummary.sections);
  const includedSet = new Set(normalized.includedSectionIds);
  return {
    version: ATLAS_REPORT_STUDIO_VERSION,
    reportVersion: reportSummary.version,
    settings: normalized,
    templates: ATLAS_REPORT_TEMPLATES,
    selectedTemplate,
    availableSectionIds,
    includedSectionIds: normalized.includedSectionIds,
    includedSectionCount: normalized.includedSectionIds.length,
    totalSectionCount: availableSectionIds.length,
    includedSections,
    excludedStateIncluded: includedSet.has("excluded-state"),
    sectionToggles: availableSectionIds.map((id) => ({
      id,
      label: SECTION_LABELS[id],
      enabled: includedSet.has(id),
      required: id === "trusted-boundaries",
    })),
  };
}

export function serializeAtlasScientificReportJson(
  summary: AtlasScientificReportSummary,
  settings?: Partial<AtlasReportStudioSettings> | null,
): string {
  return JSON.stringify(serializableReport(summary, settings), null, 2);
}

export function serializeAtlasScientificReportMarkdown(
  summary: AtlasScientificReportSummary,
  settings?: Partial<AtlasReportStudioSettings> | null,
): string {
  const normalized = settings ? normalizeReportStudioSettings(settings, summary.sections) : null;
  const serializable = serializableReport(summary, settings);
  const excludedStateIncluded =
    !normalized || normalized.includedSectionIds.includes("excluded-state");
  const lines = [
    `# ${serializable.title}`,
    "",
    serializable.subtitle,
    "",
    `- Version: ${serializable.version}`,
    `- Report studio: ${serializable.reportStudioVersion ?? "none"}`,
    `- Template: ${serializable.templateId ?? "none"}`,
    `- Created: ${serializable.createdAt}`,
    `- Evidence claims: ${serializable.evidenceClaimCount} (${serializable.readyEvidenceCount} ready, ${serializable.failedEvidenceCount} failed)`,
    `- Mission capsule: ${serializable.missionCapsuleVersion}; active ${serializable.missionCapsuleActive ? "yes" : "no"}; warnings ${serializable.missionCapsuleWarningCount}`,
    `- Selected evidence: ${serializable.selectedEvidenceClaimId || "none"}`,
    `- Selected object: ${serializable.selectedObjectId || "none"}`,
    `- Selected workflow: ${serializable.selectedWorkflowId || "none"}`,
    "",
  ];

  for (const section of serializable.sections) {
    lines.push(`## ${section.title}`, "", section.body, "");
    for (const item of section.metrics) {
      lines.push(`- ${item.label}: ${item.value}`);
    }
    lines.push("");
  }

  if (excludedStateIncluded) {
    lines.push(
      "## Excluded state",
      "",
      ...summary.excludedState.map((item) => `- ${item}`),
      "",
      "This report is UI/session and evidence provenance. It is not a simulation data archive, Horizons refresh, telemetry export, or scientific publication archive.",
      "",
    );
  }
  return lines.join("\n");
}

export function serializeAtlasScientificReportHtml(
  summary: AtlasScientificReportSummary,
  settings?: Partial<AtlasReportStudioSettings> | null,
): string {
  const normalized = normalizeReportStudioSettings(settings, summary.sections);
  const serializable = serializableReport(summary, normalized);
  const selectedTemplate = templateById(normalized.templateId);
  const excludedStateIncluded = normalized.includedSectionIds.includes("excluded-state");
  const sectionsHtml = serializable.sections.map((sectionItem) => {
    const metrics = sectionItem.metrics
      .map((item) => `<li><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.value)}</span></li>`)
      .join("");
    return [
      `<section class="section" data-section-id="${escapeHtml(sectionItem.id)}">`,
      `<h2>${escapeHtml(sectionItem.title)}</h2>`,
      `<p>${escapeHtml(sectionItem.body)}</p>`,
      `<ul class="metrics">${metrics}</ul>`,
      `</section>`,
    ].join("");
  }).join("");
  const excludedHtml = excludedStateIncluded
    ? [
        `<section class="section" data-section-id="excluded-state">`,
        `<h2>Excluded state</h2>`,
        `<p>This printable dossier records UI/session and evidence provenance only. It omits raw runtime data and image capture artifacts.</p>`,
        `<ul class="metrics">${htmlExcludedState(summary.excludedState)
          .map((item) => `<li><strong>Excluded</strong><span>${escapeHtml(item)}</span></li>`)
          .join("")}</ul>`,
        `</section>`,
      ].join("")
    : "";
  return [
    "<!doctype html>",
    `<html lang="en">`,
    "<head>",
    `<meta charset="utf-8">`,
    `<meta name="viewport" content="width=device-width, initial-scale=1">`,
    `<title>${escapeHtml(serializable.title)} - ${escapeHtml(selectedTemplate.title)}</title>`,
    "<style>",
    "body{margin:0;background:#f6f8fb;color:#101820;font-family:Inter,Arial,sans-serif;line-height:1.5}main{max-width:920px;margin:0 auto;padding:42px 28px 56px}.cover{border:1px solid #cfd8e3;background:#fff;padding:28px}.eyebrow{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#526173}.meta,.metrics{display:grid;gap:8px;margin:18px 0 0;padding:0;list-style:none}.meta{grid-template-columns:repeat(2,minmax(0,1fr))}.meta li,.metrics li{border:1px solid #d9e1ea;background:#fbfdff;padding:8px 10px}.metrics li{display:grid;grid-template-columns:minmax(120px,.35fr) minmax(0,1fr);gap:10px}.section{margin-top:18px;border:1px solid #d9e1ea;background:#fff;padding:22px;break-inside:avoid}.boundary{color:#394657}.footer{margin-top:22px;font-size:12px;color:#526173}@media print{body{background:#fff}main{padding:0}.section,.cover{box-shadow:none}}@media(max-width:640px){main{padding:22px 14px}.meta{grid-template-columns:1fr}.metrics li{grid-template-columns:1fr}}",
    "</style>",
    "</head>",
    "<body>",
    "<main>",
    `<section class="cover">`,
    `<div class="eyebrow">Orbit Atlas Report Studio / ${escapeHtml(ATLAS_REPORT_STUDIO_VERSION)}</div>`,
    `<h1>${escapeHtml(serializable.title)}</h1>`,
    `<p>${escapeHtml(serializable.subtitle)}</p>`,
    `<ul class="meta">`,
    `<li><strong>Template</strong><br>${escapeHtml(selectedTemplate.id)} - ${escapeHtml(selectedTemplate.title)}</li>`,
    `<li><strong>Created</strong><br>${escapeHtml(serializable.createdAt)}</li>`,
    `<li><strong>Evidence claims</strong><br>${serializable.evidenceClaimCount} total / ${serializable.readyEvidenceCount} ready / ${serializable.failedEvidenceCount} failed</li>`,
    `<li><strong>Kerr Studio</strong><br>${escapeHtml(serializable.kerrLab.orbitPresetId)}; mode ${escapeHtml(serializable.kerrLab.studioMode ?? "overview")}; b/M ${escapeHtml(formatNumber(serializable.kerrLab.impactParameterM, 3))}; spin ${escapeHtml(formatNumber(serializable.kerrLab.spinA, 3))}</li>`,
    `</ul>`,
    `</section>`,
    sectionsHtml,
    excludedHtml,
    `<p class="footer boundary">This is a local printable evidence dossier. It is not a PDF pipeline, not a Horizons refresh, not a telemetry export, and not a scientific publication archive.</p>`,
    "</main>",
    "</body>",
    "</html>",
  ].join("");
}

function sessionOverviewSection(
  missionHubSummary: AtlasMissionHubSummary,
  evidenceLedgerSummary: EvidenceLedgerSummary,
  selectedBodyId: string,
  selectedObjectId: string,
): AtlasScientificReportSection {
  return section("session-overview", "Session overview", [
    "Current Atlas mission context and evidence status.",
    `Current context: ${missionHubSummary.current.title}.`,
    `Evidence status: ${evidenceLedgerSummary.status}.`,
  ], [
    metric("current-kind", "Current kind", missionHubSummary.current.currentKind || "none"),
    metric("current-id", "Current id", missionHubSummary.current.currentId || "none"),
    metric("selected-body", "Selected body", selectedBodyId || "none"),
    metric("selected-object", "Selected object", selectedObjectId || "none"),
    metric("recent-count", "Recent actions", String(missionHubSummary.recentCount)),
    metric("pinned-count", "Pinned items", String(missionHubSummary.pinnedCount)),
  ]);
}

function missionCapsuleSection(
  missionCapsule: AtlasMissionCapsule,
  missionHubSummary: AtlasMissionHubSummary,
): AtlasScientificReportSection {
  const restore = missionHubSummary.capsuleRestoreSummary;
  return section("mission-capsule", "Mission capsule", [
    "Reproducible UI/session state captured from the current Atlas Mission Hub.",
    "Capsule restore is local and deterministic; it does not replay physics buffers.",
  ], [
    metric("capsule-version", "Capsule version", missionCapsule.version),
    metric("capsule-created", "Capsule created", missionCapsule.createdAt),
    metric("presentation", "Presentation", `${missionCapsule.presentation.mode}; ${missionCapsule.presentation.scaleMode}; ${missionCapsule.presentation.renderBudget}`),
    metric("view-settings", "View toggles", Object.keys(missionCapsule.viewSettings).sort().join(", ") || "none"),
    metric("restore-source", "Restore source", restore?.source ?? "none"),
    metric("restore-warnings", "Restore warnings", String(restore?.warningCount ?? 0)),
  ]);
}

function evidenceClaimsSection(
  evidenceLedgerSummary: EvidenceLedgerSummary,
  selectedClaim: EvidenceClaim | null,
): AtlasScientificReportSection {
  const featuredClaims = evidenceLedgerSummary.claims
    .slice(0, 9)
    .map((claim) => `${claim.id}: ${claim.status}/${claim.confidence}`)
    .join("; ");
  return section("evidence-claims", "Evidence claims", [
    "Evidence Ledger claim passports summarized for this report.",
    selectedClaim
      ? `Selected claim: ${selectedClaim.title}; source ${selectedClaim.source}; metric ${selectedClaim.metric}.`
      : "No selected evidence claim.",
  ], [
    metric("ledger-version", "Ledger version", evidenceLedgerSummary.version),
    metric("claim-count", "Claim count", String(evidenceLedgerSummary.claimCount), evidenceLedgerSummary.status),
    metric("ready-count", "Ready claims", String(evidenceLedgerSummary.readyCount)),
    metric("failed-count", "Failed claims", String(evidenceLedgerSummary.failedCount), evidenceLedgerSummary.failedCount > 0 ? "failed" : "informational"),
    metric("selected-claim", "Selected claim", selectedClaim?.id ?? "none", selectedClaim?.status ?? "informational"),
    metric("claim-index", "Claim index", featuredClaims || "none"),
  ]);
}

function selectedTargetSection({
  selectedObjectPassport,
  selectedBodyId,
  selectedBodyLabel,
}: {
  selectedObjectPassport?: CelestialObjectPassport | null;
  selectedBodyId: string;
  selectedBodyLabel?: string | null;
}): AtlasScientificReportSection {
  if (selectedObjectPassport) {
    return section("selected-target", "Selected object / body", [
      `Selected catalog object: ${selectedObjectPassport.title}.`,
      selectedObjectPassport.confidenceRationale,
    ], [
      metric("object-id", "Object id", selectedObjectPassport.objectId),
      metric("object-kind", "Object kind", selectedObjectPassport.kind),
      metric("object-source", "Object source", selectedObjectPassport.source),
      metric("coordinate-frame", "Coordinate frame", selectedObjectPassport.coordinateFrame),
      metric("related-evidence", "Related evidence", selectedObjectPassport.relatedEvidenceClaimId),
    ]);
  }

  return section("selected-target", "Selected object / body", [
    selectedBodyId
      ? `Selected solar-system body: ${selectedBodyLabel || selectedBodyId}.`
      : "No selected catalog object or solar-system body.",
    "Solar-system body focus never creates new bodies and does not alter the EIH 1PN dynamics.",
  ], [
    metric("body-id", "Body id", selectedBodyId || "none"),
    metric("body-label", "Body label", selectedBodyLabel || selectedBodyId || "none"),
  ]);
}

function workflowContextSection(
  workflowSummary: AtlasWorkflowSummary,
  workflow: AtlasWorkflowSummary["workflows"][number] | null,
  workflowStepId: string,
  workflowStep: AtlasWorkflowSummary["workflows"][number]["steps"][number] | null,
): AtlasScientificReportSection {
  return section("workflow-context", "Workflow context", [
    workflow
      ? `Selected workflow: ${workflow.title}. ${workflow.objective}`
      : "No selected workflow.",
    workflowStep ? `Active step: ${workflowStep.title}; target ${workflowStep.target}.` : "No active workflow step.",
  ], [
    metric("workflow-version", "Workflow version", workflowSummary.version),
    metric("workflow-count", "Workflow count", String(workflowSummary.workflowCount)),
    metric("selected-workflow", "Selected workflow", workflow?.id ?? "none"),
    metric("active-step", "Active step", workflowStepId || "none", workflowStepStatus(workflowStep?.status)),
    metric("workflow-boundary", "Workflow boundary", workflow?.boundary ?? "Guided actions only; no new physics model."),
  ]);
}

function relativityObservablesSection(
  summary: RelativityObservableAtlasSummary | null | undefined,
  explainerSummary?: RelativityObservableExplainerSummary | null,
  guidedTourSummary?: RelativityGuidedTourSummary | null,
): AtlasScientificReportSection {
  const rowPreview = summary
    ? summary.rows
        .slice(0, 7)
        .map((row) => `${row.title}: ${row.measuredValue}`)
        .join("; ")
    : "Observable Atlas summary not provided.";
  return section("relativity-observables", "Relativity Observable Atlas", [
    "Formula-backed read-only science depth layer over weak-field GR diagnostics and Kerr Studio observables.",
    rowPreview,
    explainerSummary
      ? `Derivation cards: ${explainerSummary.cardCount} cards; ${explainerSummary.totalStepCount} steps; ${explainerSummary.totalVariableCount} variables.`
      : "Relativity explainer summary not provided.",
    guidedTourSummary
      ? `Guided tour: ${guidedTourSummary.readyCount}/${guidedTourSummary.stepCount} steps ready through workflow ${guidedTourSummary.workflowId}.`
      : "Relativity guided tour summary not provided.",
    "Kerr Hamiltonian drift is reported as numerical health only, not as an astrophysical observable.",
  ], [
    metric("observable-version", "Observable Atlas version", summary?.version ?? "not provided", summary?.status ?? "informational"),
    metric("observable-ready", "Ready observables", summary ? `${summary.readyCount}/${summary.observableCount}` : "not provided", summary?.status ?? "informational"),
    metric("weak-field-count", "Weak-field rows", summary ? String(summary.weakFieldCount) : "not provided"),
    metric("kerr-count", "Kerr rows", summary ? String(summary.strongFieldCount) : "not provided"),
    metric("numerical-health", "Numerical health rows", summary ? String(summary.numericalHealthCount) : "not provided", "informational"),
    metric("explainer-version", "Explainer version", explainerSummary?.version ?? "not provided", explainerSummary?.status ?? "informational"),
    metric("explainer-cards", "Explainer cards", explainerSummary ? String(explainerSummary.cardCount) : "not provided", explainerSummary?.status ?? "informational"),
    metric("explainer-steps", "Explainer steps", explainerSummary ? String(explainerSummary.totalStepCount) : "not provided", "informational"),
    metric("guided-tour-version", "Guided tour version", guidedTourSummary?.version ?? "not provided", guidedTourSummary?.status ?? "informational"),
    metric("guided-tour-workflow", "Guided tour workflow", guidedTourSummary?.workflowId ?? "not provided", guidedTourSummary?.status ?? "informational"),
    metric("guided-tour-steps", "Guided tour steps", guidedTourSummary ? String(guidedTourSummary.stepCount) : "not provided", guidedTourSummary?.status ?? "informational"),
    metric("guided-tour-ready", "Guided tour ready", guidedTourSummary ? String(guidedTourSummary.readyCount) : "not provided", guidedTourSummary?.status ?? "informational"),
    metric("observable-boundary", "Boundary", summary?.boundary ?? "Read-only science cue only; no physics mutation.", "informational"),
    metric("explainer-boundary", "Explainer boundary", explainerSummary?.boundary ?? "Read-only explanation cue only; no physics mutation.", "informational"),
    metric("guided-tour-boundary", "Guided tour boundary", guidedTourSummary?.boundary ?? "Read-only workflow cue only; no physics mutation.", "informational"),
  ]);
}

function kerrLabSection(args: CreateAtlasScientificReportSummaryArgs["kerrLab"]): AtlasScientificReportSection {
  return section("kerr-lab", "Kerr relativity lab", [
    "Kerr Studio state summarized as independent test-particle/null geodesic UI parameters.",
    "It remains separate from the solar-system EIH 1PN main integrator.",
  ], [
    metric("kerr-visible", "Kerr Studio visible", args.showKerrBlackHole ? "yes" : "no"),
    metric("spin", "Spin a/M", formatNumber(args.spinA, 3)),
    metric("impact", "Impact parameter b/M", formatNumber(args.impactParameterM, 3)),
    metric("preset", "Preset", args.orbitPresetId),
    metric("render-mode", "Render mode", args.renderMode),
    metric("studio-mode", "Studio mode", args.studioMode ?? "overview"),
  ]);
}

function trustedBoundariesSection(
  planetaryVisualFidelitySummary?: AtlasPlanetaryVisualFidelitySummary | null,
  cinematicLightingSummary?: AtlasCinematicLightingCompositionSummary | null,
  chineseDeepSpaceFidelitySummary?: AtlasChineseDeepSpaceFidelitySummary | null,
  cinematicDeepSpaceCameraSummary?: AtlasCinematicDeepSpaceCameraSummary | null,
  universeSandboxReferenceBackdropSummary?: AtlasUniverseSandboxReferenceBackdropSummary | null,
  referenceGradeSpaceArtSummary?: AtlasReferenceGradeSpaceArtSummary | null,
  planetaryMaterialCompositionSummary?: AtlasPlanetaryMaterialCompositionSummary | null,
  cinematicCloseupDirectorSummary?: AtlasCinematicCloseupDirectorSummary | null,
  cinematicKeyLightDirectorSummary?: AtlasCinematicKeyLightDirectorSummary | null,
  planetaryDepthLightingSummary?: AtlasPlanetaryDepthLightingSummary | null,
  planetaryColorGradingSummary?: AtlasPlanetaryColorGradingSummary | null,
  numericalIntegritySummary?: AtlasNumericalIntegritySummary | null,
  cinematicPlanetaryArtDirectionSummary?: AtlasCinematicPlanetaryArtDirectionSummary | null,
  cinematicDeepSpaceBackdropSummary?: AtlasCinematicDeepSpaceBackdropSummary | null,
  sparseDeepSpaceDirectorSummary?: AtlasSparseDeepSpaceDirectorSummary | null,
  closeupPresentationTruthSummary?: AtlasCloseupPresentationTruthSummary | null,
  closeupVisualFidelitySummary?: AtlasCloseupVisualFidelitySummary | null,
): AtlasScientificReportSection {
  const referenceGradeReportReviewMode = referenceGradeSpaceArtSummary
    ? referenceGradeSpaceArtSummary.reviewMode.replace("screenshot", "image-review")
    : "not provided";

  return section("trusted-boundaries", "Trusted boundaries", [
    "This dossier reports evidence provenance and reproducible UI/session state only.",
    "It does not claim full numerical relativity, cosmological N-body, full Gaia archive coverage, or a complete SIMBAD/VizieR database.",
    planetaryVisualFidelitySummary
      ? `Planetary visual fidelity: ${planetaryVisualFidelitySummary.visualTarget}; ${planetaryVisualFidelitySummary.styleTarget}; runtime assets ${planetaryVisualFidelitySummary.runtimeAssetSource}.`
      : "Planetary visual fidelity summary not provided.",
    cinematicLightingSummary
      ? `Cinematic lighting: ${cinematicLightingSummary.lightingProfile}; post-FX ${cinematicLightingSummary.postFxProfile}; runtime assets ${cinematicLightingSummary.runtimeAssetSource}.`
      : "Cinematic lighting summary not provided.",
    chineseDeepSpaceFidelitySummary
      ? `Chinese interface and deep-space fidelity: ${chineseDeepSpaceFidelitySummary.uiLanguage}; ${chineseDeepSpaceFidelitySummary.visualProfile}; runtime assets ${chineseDeepSpaceFidelitySummary.runtimeAssetSource}.`
      : "Chinese interface and deep-space fidelity summary not provided.",
    cinematicDeepSpaceCameraSummary
      ? `Cinematic deep-space camera: ${cinematicDeepSpaceCameraSummary.defaultCameraProfile}; close-up ${cinematicDeepSpaceCameraSummary.closeupCameraProfile}; quality budget ${cinematicDeepSpaceCameraSummary.qualityBudget}.`
      : "Cinematic deep-space camera summary not provided.",
    universeSandboxReferenceBackdropSummary
      ? `Universe Sandbox reference backdrop: ${universeSandboxReferenceBackdropSummary.referenceMode}; ${universeSandboxReferenceBackdropSummary.backgroundArtDirection}; local image review ${universeSandboxReferenceBackdropSummary.screenshotReview}.`
      : "Universe Sandbox reference backdrop summary not provided.",
    referenceGradeSpaceArtSummary
      ? `Reference-grade space art: ${referenceGradeSpaceArtSummary.artDirection}; ${referenceGradeSpaceArtSummary.closeupCompositeProfile}; local image review rubric ${referenceGradeReportReviewMode}.`
      : "Reference-grade space art summary not provided.",
    planetaryMaterialCompositionSummary
      ? `Planetary material composition: ${planetaryMaterialCompositionSummary.materialTarget}; Earth ${planetaryMaterialCompositionSummary.earthMaterialProfile}; Saturn ring ${planetaryMaterialCompositionSummary.saturnRingProfile}; runtime assets ${planetaryMaterialCompositionSummary.runtimeAssetSource}.`
      : "Planetary material composition summary not provided.",
    cinematicCloseupDirectorSummary
      ? `Cinematic close-up director: ${cinematicCloseupDirectorSummary.compositionTarget}; Saturn ${cinematicCloseupDirectorSummary.saturnCompositionProfile}; ring showcase ${cinematicCloseupDirectorSummary.saturnRingShowcaseProfile}; runtime assets ${cinematicCloseupDirectorSummary.runtimeAssetSource}.`
      : "Cinematic close-up director summary not provided.",
    cinematicKeyLightDirectorSummary
      ? `Cinematic key-light director: ${cinematicKeyLightDirectorSummary.lightingTarget}; gas giants ${cinematicKeyLightDirectorSummary.gasGiantKeyLightProfile}; Saturn ${cinematicKeyLightDirectorSummary.saturnKeyLightProfile}; runtime assets ${cinematicKeyLightDirectorSummary.runtimeAssetSource}.`
      : "Cinematic key-light director summary not provided.",
    planetaryDepthLightingSummary
      ? `Planetary depth lighting: ${planetaryDepthLightingSummary.lightingTarget}; gas giants ${planetaryDepthLightingSummary.gasGiantDepthLightingProfile}; Saturn ${planetaryDepthLightingSummary.saturnDepthLightingProfile}; ring shadow ${planetaryDepthLightingSummary.ringShadowCue}.`
      : "Planetary depth lighting summary not provided.",
    planetaryColorGradingSummary
      ? `Planetary color grading: ${planetaryColorGradingSummary.colorTarget}; gas giants ${planetaryColorGradingSummary.gasGiantColorGradeProfile}; Saturn ${planetaryColorGradingSummary.saturnColorGradeProfile}; cue ${planetaryColorGradingSummary.saturnOcclusionCue}.`
      : "Planetary color grading summary not provided.",
    numericalIntegritySummary
      ? `Numerical integrity: ${numericalIntegritySummary.integrityStatus}; energy drift ${numericalIntegritySummary.energyDriftTrend}; angular momentum drift ${numericalIntegritySummary.angularMomentumDriftTrend}; benchmark coverage is local-test metadata only.`
      : "Numerical integrity summary not provided.",
    cinematicPlanetaryArtDirectionSummary
      ? `Cinematic planetary art direction: ${cinematicPlanetaryArtDirectionSummary.qualityTarget}; gas giants ${cinematicPlanetaryArtDirectionSummary.gasGiantArtProfile}; Saturn rings ${cinematicPlanetaryArtDirectionSummary.saturnRingArtProfile}; background ${cinematicPlanetaryArtDirectionSummary.closeupBackgroundArtGradeProfile}.`
      : "Cinematic planetary art-direction summary not provided.",
    cinematicDeepSpaceBackdropSummary
      ? `Cinematic deep-space backdrop: ${cinematicDeepSpaceBackdropSummary.skyManifest}; stars ${cinematicDeepSpaceBackdropSummary.starfieldProfile}; nebula ${cinematicDeepSpaceBackdropSummary.nebulaProfile}; negative space ${cinematicDeepSpaceBackdropSummary.negativeSpaceProfile}.`
      : "Cinematic deep-space backdrop summary not provided.",
    sparseDeepSpaceDirectorSummary
      ? `Sparse deep-space director: ${sparseDeepSpaceDirectorSummary.skyManifest}; stars ${sparseDeepSpaceDirectorSummary.starfieldProfile}; Milky Way ${sparseDeepSpaceDirectorSummary.milkyWayProfile}; negative space ${sparseDeepSpaceDirectorSummary.negativeSpaceProfile}.`
      : "Sparse deep-space director summary not provided.",
    closeupPresentationTruthSummary
      ? `Close-up presentation truth: ${closeupPresentationTruthSummary.previewSyncTarget}; solar backdrop ${closeupPresentationTruthSummary.solarBackdropProfile}; planet readability ${closeupPresentationTruthSummary.planetReadabilityProfile}; review mode ${closeupPresentationTruthSummary.sceneReviewMode}.`
      : "Close-up presentation truth summary not provided.",
    closeupVisualFidelitySummary
      ? `Close-up visual fidelity: ${closeupVisualFidelitySummary.visualTarget}; asset policy ${closeupVisualFidelitySummary.assetPolicy}; protected sky ${closeupVisualFidelitySummary.protectedSkyManifest}; full release gate ${closeupVisualFidelitySummary.fullReleaseGateStatus}.`
      : "Close-up visual fidelity summary not provided.",
  ], [
    metric("physics-boundary", "Physics boundary", "EIH 1PN main dynamics unchanged"),
    metric("kerr-boundary", "Kerr boundary", "Independent test-particle/null geodesic lab"),
    metric("catalog-boundary", "Catalog boundary", "Curated local presentation/navigation catalog"),
    metric("archive-boundary", "Archive boundary", "Not a scientific publication archive"),
    metric("planetary-visual-version", "Planetary visual version", planetaryVisualFidelitySummary?.version ?? "not provided", planetaryVisualFidelitySummary?.status ?? "informational"),
    metric("planetary-visual-target", "Planetary visual target", planetaryVisualFidelitySummary?.visualTarget ?? "not provided", planetaryVisualFidelitySummary?.status ?? "informational"),
    metric("planetary-asset-policy", "Planetary asset policy", planetaryVisualFidelitySummary?.assetPolicy ?? "not provided", planetaryVisualFidelitySummary?.status ?? "informational"),
    metric("planetary-visual-boundary", "Planetary visual boundary", planetaryVisualFidelitySummary?.trustedBoundary ?? "Visual presentation cue only; no physics mutation.", "informational"),
    metric("cinematic-lighting-version", "Cinematic lighting version", cinematicLightingSummary?.version ?? "not provided", cinematicLightingSummary?.status ?? "informational"),
    metric("cinematic-lighting-profile", "Cinematic lighting profile", cinematicLightingSummary?.lightingProfile ?? "not provided", cinematicLightingSummary?.status ?? "informational"),
    metric("cinematic-postfx-profile", "Cinematic post-FX profile", cinematicLightingSummary?.postFxProfile ?? "not provided", cinematicLightingSummary?.status ?? "informational"),
    metric("cinematic-asset-policy", "Cinematic asset policy", cinematicLightingSummary?.assetPolicy ?? "not provided", cinematicLightingSummary?.status ?? "informational"),
    metric("cinematic-lighting-boundary", "Cinematic lighting boundary", cinematicLightingSummary?.trustedBoundary ?? "Visual presentation cue only; no physics mutation.", "informational"),
    metric("chinese-interface-version", "Chinese interface version", chineseDeepSpaceFidelitySummary?.version ?? "not provided", chineseDeepSpaceFidelitySummary?.status ?? "informational"),
    metric("chinese-ui-language", "Chinese UI language", chineseDeepSpaceFidelitySummary?.uiLanguage ?? "not provided", chineseDeepSpaceFidelitySummary?.status ?? "informational"),
    metric("deep-space-visual-profile", "Deep-space visual profile", chineseDeepSpaceFidelitySummary?.visualProfile ?? "not provided", chineseDeepSpaceFidelitySummary?.status ?? "informational"),
    metric("deep-space-asset-policy", "Deep-space asset policy", chineseDeepSpaceFidelitySummary?.assetPolicy ?? "not provided", chineseDeepSpaceFidelitySummary?.status ?? "informational"),
    metric("deep-space-boundary", "Deep-space boundary", chineseDeepSpaceFidelitySummary?.trustedBoundary ?? "Visual presentation cue only; no physics mutation.", "informational"),
    metric("cinematic-camera-version", "Cinematic camera version", cinematicDeepSpaceCameraSummary?.version ?? "not provided", cinematicDeepSpaceCameraSummary?.status ?? "informational"),
    metric("cinematic-camera-profile", "Cinematic camera profile", cinematicDeepSpaceCameraSummary?.defaultCameraProfile ?? "not provided", cinematicDeepSpaceCameraSummary?.status ?? "informational"),
    metric("cinematic-closeup-camera-profile", "Cinematic close-up camera profile", cinematicDeepSpaceCameraSummary?.closeupCameraProfile ?? "not provided", cinematicDeepSpaceCameraSummary?.status ?? "informational"),
    metric("cinematic-background-noise", "Cinematic background noise", cinematicDeepSpaceCameraSummary?.supportedBackgroundNoiseProfiles.join(", ") ?? "not provided", cinematicDeepSpaceCameraSummary?.status ?? "informational"),
    metric("cinematic-quality-budget", "Cinematic quality budget", cinematicDeepSpaceCameraSummary?.qualityBudget ?? "not provided", cinematicDeepSpaceCameraSummary?.status ?? "informational"),
    metric("cinematic-deep-space-boundary", "Cinematic deep-space boundary", cinematicDeepSpaceCameraSummary?.trustedBoundary ?? "Visual presentation cue only; no physics mutation.", "informational"),
    metric("reference-backdrop-version", "Reference backdrop version", universeSandboxReferenceBackdropSummary?.version ?? "not provided", universeSandboxReferenceBackdropSummary?.status ?? "informational"),
    metric("reference-backdrop-mode", "Reference backdrop mode", universeSandboxReferenceBackdropSummary?.referenceMode ?? "not provided", universeSandboxReferenceBackdropSummary?.status ?? "informational"),
    metric("reference-background-art-direction", "Reference background art direction", universeSandboxReferenceBackdropSummary?.backgroundArtDirection ?? "not provided", universeSandboxReferenceBackdropSummary?.status ?? "informational"),
    metric("reference-depth-profile", "Reference depth profile", universeSandboxReferenceBackdropSummary?.supportedDepthProfiles.join(", ") ?? "not provided", universeSandboxReferenceBackdropSummary?.status ?? "informational"),
    metric("reference-subject-visibility", "Reference subject visibility", universeSandboxReferenceBackdropSummary?.subjectVisibilityProfile ?? "not provided", universeSandboxReferenceBackdropSummary?.status ?? "informational"),
    metric("reference-screenshot-review", "Reference image review", universeSandboxReferenceBackdropSummary?.screenshotReview ?? "not provided", universeSandboxReferenceBackdropSummary?.status ?? "informational"),
    metric("reference-backdrop-boundary", "Reference backdrop boundary", universeSandboxReferenceBackdropSummary?.trustedBoundary ?? "Visual reference cue only; no physics mutation.", "informational"),
    metric("reference-grade-space-art-version", "Reference-grade space art version", referenceGradeSpaceArtSummary?.version ?? "not provided", referenceGradeSpaceArtSummary?.status ?? "informational"),
    metric("reference-grade-art-direction", "Reference-grade art direction", referenceGradeSpaceArtSummary?.artDirection ?? "not provided", referenceGradeSpaceArtSummary?.status ?? "informational"),
    metric("reference-grade-composite", "Reference-grade composite", referenceGradeSpaceArtSummary?.supportedCompositeProfiles.join(", ") ?? "not provided", referenceGradeSpaceArtSummary?.status ?? "informational"),
    metric("reference-grade-sky-layer", "Reference-grade sky layer", referenceGradeSpaceArtSummary?.supportedSkyLayerProfiles.join(", ") ?? "not provided", referenceGradeSpaceArtSummary?.status ?? "informational"),
    metric("reference-grade-starfield", "Reference-grade starfield", referenceGradeSpaceArtSummary?.closeupStarfieldProfile ?? "not provided", referenceGradeSpaceArtSummary?.status ?? "informational"),
    metric("reference-grade-subject-matte", "Reference-grade subject matte", referenceGradeSpaceArtSummary?.closeupSubjectMatteProfile ?? "not provided", referenceGradeSpaceArtSummary?.status ?? "informational"),
    metric("reference-grade-planet-material", "Reference-grade planet material", referenceGradeSpaceArtSummary?.closeupPlanetMaterialProfile ?? "not provided", referenceGradeSpaceArtSummary?.status ?? "informational"),
    metric("reference-grade-asset-policy", "Reference-grade asset policy", referenceGradeSpaceArtSummary?.assetPolicy ?? "not provided", referenceGradeSpaceArtSummary?.status ?? "informational"),
    metric("reference-grade-review-mode", "Reference-grade review mode", referenceGradeReportReviewMode, referenceGradeSpaceArtSummary?.status ?? "informational"),
    metric("reference-grade-space-art-boundary", "Reference-grade space art boundary", referenceGradeSpaceArtSummary?.trustedBoundary ?? "Visual art-direction cue only; no physics mutation.", "informational"),
    metric("planetary-material-composition-version", "Planetary material composition version", planetaryMaterialCompositionSummary?.version ?? "not provided", planetaryMaterialCompositionSummary?.status ?? "informational"),
    metric("planetary-material-target", "Planetary material target", planetaryMaterialCompositionSummary?.materialTarget ?? "not provided", planetaryMaterialCompositionSummary?.status ?? "informational"),
    metric("planetary-material-profiles", "Planetary material profiles", planetaryMaterialCompositionSummary?.supportedMaterialProfiles.join(", ") ?? "not provided", planetaryMaterialCompositionSummary?.status ?? "informational"),
    metric("planetary-atmosphere-depth", "Planetary atmosphere depth", planetaryMaterialCompositionSummary?.supportedAtmosphereDepthProfiles.join(", ") ?? "not provided", planetaryMaterialCompositionSummary?.status ?? "informational"),
    metric("planetary-terminator-profile", "Planetary terminator profile", planetaryMaterialCompositionSummary?.supportedTerminatorProfiles.join(", ") ?? "not provided", planetaryMaterialCompositionSummary?.status ?? "informational"),
    metric("planetary-ring-profile", "Planetary ring profile", planetaryMaterialCompositionSummary?.saturnRingProfile ?? "not provided", planetaryMaterialCompositionSummary?.status ?? "informational"),
    metric("planetary-material-asset-policy", "Planetary material asset policy", planetaryMaterialCompositionSummary?.assetPolicy ?? "not provided", planetaryMaterialCompositionSummary?.status ?? "informational"),
    metric("planetary-material-boundary", "Planetary material boundary", planetaryMaterialCompositionSummary?.trustedBoundary ?? "Visual material cue only; no physics mutation.", "informational"),
    metric("cinematic-closeup-director-version", "Cinematic close-up director version", cinematicCloseupDirectorSummary?.version ?? "not provided", cinematicCloseupDirectorSummary?.status ?? "informational"),
    metric("closeup-composition-target", "Close-up composition target", cinematicCloseupDirectorSummary?.compositionTarget ?? "not provided", cinematicCloseupDirectorSummary?.status ?? "informational"),
    metric("closeup-composition-profiles", "Close-up composition profiles", cinematicCloseupDirectorSummary?.supportedCompositionProfiles.join(", ") ?? "not provided", cinematicCloseupDirectorSummary?.status ?? "informational"),
    metric("closeup-panel-avoidance", "Close-up panel avoidance", cinematicCloseupDirectorSummary?.desktopPanelAvoidanceProfile ?? "not provided", cinematicCloseupDirectorSummary?.status ?? "informational"),
    metric("closeup-ring-showcase", "Close-up ring showcase", cinematicCloseupDirectorSummary?.saturnRingShowcaseProfile ?? "not provided", cinematicCloseupDirectorSummary?.status ?? "informational"),
    metric("closeup-quality-budget", "Close-up quality budget", cinematicCloseupDirectorSummary?.qualityBudget ?? "not provided", cinematicCloseupDirectorSummary?.status ?? "informational"),
    metric("closeup-asset-policy", "Close-up asset policy", cinematicCloseupDirectorSummary?.assetPolicy ?? "not provided", cinematicCloseupDirectorSummary?.status ?? "informational"),
    metric("closeup-director-boundary", "Close-up director boundary", cinematicCloseupDirectorSummary?.trustedBoundary ?? "Visual composition cue only; no physics mutation.", "informational"),
    metric("cinematic-key-light-director-version", "Cinematic key-light director version", cinematicKeyLightDirectorSummary?.version ?? "not provided", cinematicKeyLightDirectorSummary?.status ?? "informational"),
    metric("key-light-target", "Key-light target", cinematicKeyLightDirectorSummary?.lightingTarget ?? "not provided", cinematicKeyLightDirectorSummary?.status ?? "informational"),
    metric("key-light-profiles", "Key-light profiles", cinematicKeyLightDirectorSummary?.supportedKeyLightProfiles.join(", ") ?? "not provided", cinematicKeyLightDirectorSummary?.status ?? "informational"),
    metric("gas-giant-key-light-profile", "Gas giant key-light profile", cinematicKeyLightDirectorSummary?.gasGiantKeyLightProfile ?? "not provided", cinematicKeyLightDirectorSummary?.status ?? "informational"),
    metric("saturn-key-light-profile", "Saturn key-light profile", cinematicKeyLightDirectorSummary?.saturnKeyLightProfile ?? "not provided", cinematicKeyLightDirectorSummary?.status ?? "informational"),
    metric("key-light-quality-budget", "Key-light quality budget", cinematicKeyLightDirectorSummary?.qualityBudget ?? "not provided", cinematicKeyLightDirectorSummary?.status ?? "informational"),
    metric("key-light-asset-policy", "Key-light asset policy", cinematicKeyLightDirectorSummary?.assetPolicy ?? "not provided", cinematicKeyLightDirectorSummary?.status ?? "informational"),
    metric("key-light-director-boundary", "Key-light director boundary", cinematicKeyLightDirectorSummary?.trustedBoundary ?? "Visual key-light cue only; no physics mutation.", "informational"),
    metric("planetary-depth-lighting-version", "Planetary depth-lighting version", planetaryDepthLightingSummary?.version ?? "not provided", planetaryDepthLightingSummary?.status ?? "informational"),
    metric("planetary-depth-lighting-target", "Planetary depth-lighting target", planetaryDepthLightingSummary?.lightingTarget ?? "not provided", planetaryDepthLightingSummary?.status ?? "informational"),
    metric("planetary-depth-lighting-profiles", "Planetary depth-lighting profiles", planetaryDepthLightingSummary?.supportedDepthLightingProfiles.join(", ") ?? "not provided", planetaryDepthLightingSummary?.status ?? "informational"),
    metric("planetary-gas-depth-lighting", "Gas giant depth lighting", planetaryDepthLightingSummary?.gasGiantDepthLightingProfile ?? "not provided", planetaryDepthLightingSummary?.status ?? "informational"),
    metric("planetary-saturn-depth-lighting", "Saturn depth lighting", planetaryDepthLightingSummary?.saturnDepthLightingProfile ?? "not provided", planetaryDepthLightingSummary?.status ?? "informational"),
    metric("planetary-ring-shadow-cue", "Ring shadow cue", planetaryDepthLightingSummary?.ringShadowCue ?? "not provided", planetaryDepthLightingSummary?.status ?? "informational"),
    metric("planetary-depth-lighting-boundary", "Planetary depth-lighting boundary", planetaryDepthLightingSummary?.trustedBoundary ?? "Visual depth-lighting cue only; no physics mutation.", "informational"),
    metric("planetary-color-grading-version", "Planetary color-grading version", planetaryColorGradingSummary?.version ?? "not provided", planetaryColorGradingSummary?.status ?? "informational"),
    metric("planetary-color-target", "Planetary color target", planetaryColorGradingSummary?.colorTarget ?? "not provided", planetaryColorGradingSummary?.status ?? "informational"),
    metric("planetary-color-grade-profiles", "Planetary color-grade profiles", planetaryColorGradingSummary?.supportedColorGradeProfiles.join(", ") ?? "not provided", planetaryColorGradingSummary?.status ?? "informational"),
    metric("planetary-gas-color-grade", "Gas giant color grade", planetaryColorGradingSummary?.gasGiantColorGradeProfile ?? "not provided", planetaryColorGradingSummary?.status ?? "informational"),
    metric("planetary-saturn-color-grade", "Saturn color grade", planetaryColorGradingSummary?.saturnColorGradeProfile ?? "not provided", planetaryColorGradingSummary?.status ?? "informational"),
    metric("planetary-saturn-occlusion-cue", "Saturn occlusion cue", planetaryColorGradingSummary?.saturnOcclusionCue ?? "not provided", planetaryColorGradingSummary?.status ?? "informational"),
    metric("planetary-color-grading-boundary", "Planetary color-grading boundary", planetaryColorGradingSummary?.trustedBoundary ?? "Visual color-grading cue only; no physics mutation.", "informational"),
    metric("numerical-integrity-version", "Numerical integrity version", numericalIntegritySummary?.version ?? "not provided", numericalIntegritySummary?.status ?? "informational"),
    metric("numerical-integrity-status", "Numerical integrity status", numericalIntegritySummary?.integrityStatus ?? "not provided", numericalIntegritySummary?.status ?? "informational"),
    metric("energy-drift-trend", "Energy drift trend", numericalIntegritySummary?.energyDriftTrend ?? "not provided", numericalIntegritySummary?.status ?? "informational"),
    metric("angular-momentum-drift-trend", "Angular momentum drift trend", numericalIntegritySummary?.angularMomentumDriftTrend ?? "not provided", numericalIntegritySummary?.status ?? "informational"),
    metric("timestep-sensitivity-coverage", "Timestep sensitivity coverage", numericalIntegritySummary?.timestepSensitivityCoverage ?? "not provided", numericalIntegritySummary?.status ?? "informational"),
    metric("time-reversal-coverage", "Time reversal coverage", numericalIntegritySummary?.timeReversalCoverage ?? "not provided", numericalIntegritySummary?.status ?? "informational"),
    metric("unit-audit-coverage", "Unit audit coverage", numericalIntegritySummary?.unitAuditCoverage ?? "not provided", numericalIntegritySummary?.status ?? "informational"),
    metric("numerical-integrity-boundary", "Numerical integrity boundary", numericalIntegritySummary?.trustedBoundary ?? "Numerical audit cue only; no runtime benchmark or physics mutation.", "informational"),
    metric("cinematic-planetary-art-version", "Cinematic planetary art version", cinematicPlanetaryArtDirectionSummary?.version ?? "not provided", cinematicPlanetaryArtDirectionSummary?.status ?? "informational"),
    metric("cinematic-art-reference-mode", "Cinematic art reference mode", cinematicPlanetaryArtDirectionSummary?.referenceMode ?? "not provided", cinematicPlanetaryArtDirectionSummary?.status ?? "informational"),
    metric("cinematic-art-quality-target", "Cinematic art quality target", cinematicPlanetaryArtDirectionSummary?.qualityTarget ?? "not provided", cinematicPlanetaryArtDirectionSummary?.status ?? "informational"),
    metric("cinematic-art-asset-policy", "Cinematic art asset policy", cinematicPlanetaryArtDirectionSummary?.assetPolicy ?? "not provided", cinematicPlanetaryArtDirectionSummary?.status ?? "informational"),
    metric("gas-giant-art-profile", "Gas giant art profile", cinematicPlanetaryArtDirectionSummary?.gasGiantArtProfile ?? "not provided", cinematicPlanetaryArtDirectionSummary?.status ?? "informational"),
    metric("saturn-ring-art-profile", "Saturn ring art profile", cinematicPlanetaryArtDirectionSummary?.saturnRingArtProfile ?? "not provided", cinematicPlanetaryArtDirectionSummary?.status ?? "informational"),
    metric("earth-cloud-night-profile", "Earth cloud/night profile", cinematicPlanetaryArtDirectionSummary?.earthCloudNightProfile ?? "not provided", cinematicPlanetaryArtDirectionSummary?.status ?? "informational"),
    metric("solar-surface-profile", "Solar surface profile", cinematicPlanetaryArtDirectionSummary?.solarSurfaceProfile ?? "not provided", cinematicPlanetaryArtDirectionSummary?.status ?? "informational"),
    metric("global-color-grade-profile", "Global color grade profile", cinematicPlanetaryArtDirectionSummary?.globalColorGradeProfile ?? "not provided", cinematicPlanetaryArtDirectionSummary?.status ?? "informational"),
    metric("background-art-grade-profile", "Background art grade profile", cinematicPlanetaryArtDirectionSummary?.defaultBackgroundArtGradeProfile ?? "not provided", cinematicPlanetaryArtDirectionSummary?.status ?? "informational"),
    metric("cinematic-planetary-art-boundary", "Cinematic planetary art boundary", cinematicPlanetaryArtDirectionSummary?.trustedBoundary ?? "Visual art-direction cue only; no physics mutation.", "informational"),
    metric("cinematic-backdrop-version", "Cinematic backdrop version", cinematicDeepSpaceBackdropSummary?.version ?? "not provided", cinematicDeepSpaceBackdropSummary?.status ?? "informational"),
    metric("cinematic-backdrop-reference-mode", "Cinematic backdrop reference mode", cinematicDeepSpaceBackdropSummary?.referenceMode ?? "not provided", cinematicDeepSpaceBackdropSummary?.status ?? "informational"),
    metric("cinematic-backdrop-source-policy", "Cinematic backdrop source policy", cinematicDeepSpaceBackdropSummary?.sourcePolicy ?? "not provided", cinematicDeepSpaceBackdropSummary?.status ?? "informational"),
    metric("cinematic-backdrop-sky-manifest", "Cinematic backdrop sky manifest", cinematicDeepSpaceBackdropSummary?.skyManifest ?? "not provided", cinematicDeepSpaceBackdropSummary?.status ?? "informational"),
    metric("cinematic-backdrop-starfield", "Cinematic backdrop starfield", cinematicDeepSpaceBackdropSummary?.starfieldProfile ?? "not provided", cinematicDeepSpaceBackdropSummary?.status ?? "informational"),
    metric("cinematic-backdrop-nebula", "Cinematic backdrop nebula", cinematicDeepSpaceBackdropSummary?.nebulaProfile ?? "not provided", cinematicDeepSpaceBackdropSummary?.status ?? "informational"),
    metric("cinematic-backdrop-negative-space", "Cinematic backdrop negative space", cinematicDeepSpaceBackdropSummary?.negativeSpaceProfile ?? "not provided", cinematicDeepSpaceBackdropSummary?.status ?? "informational"),
    metric("cinematic-backdrop-boundary", "Cinematic backdrop boundary", cinematicDeepSpaceBackdropSummary?.trustedBoundary ?? "Visual backdrop cue only; no physics mutation.", "informational"),
    metric("sparse-deep-space-version", "Sparse deep-space version", sparseDeepSpaceDirectorSummary?.version ?? "not provided", sparseDeepSpaceDirectorSummary?.status ?? "informational"),
    metric("sparse-deep-space-reference-mode", "Sparse deep-space reference mode", sparseDeepSpaceDirectorSummary?.referenceMode ?? "not provided", sparseDeepSpaceDirectorSummary?.status ?? "informational"),
    metric("sparse-deep-space-source-policy", "Sparse deep-space source policy", sparseDeepSpaceDirectorSummary?.sourcePolicy ?? "not provided", sparseDeepSpaceDirectorSummary?.status ?? "informational"),
    metric("sparse-deep-space-sky-manifest", "Sparse deep-space sky manifest", sparseDeepSpaceDirectorSummary?.skyManifest ?? "not provided", sparseDeepSpaceDirectorSummary?.status ?? "informational"),
    metric("sparse-deep-space-starfield", "Sparse deep-space starfield", sparseDeepSpaceDirectorSummary?.starfieldProfile ?? "not provided", sparseDeepSpaceDirectorSummary?.status ?? "informational"),
    metric("sparse-deep-space-milky-way", "Sparse deep-space Milky Way", sparseDeepSpaceDirectorSummary?.milkyWayProfile ?? "not provided", sparseDeepSpaceDirectorSummary?.status ?? "informational"),
    metric("sparse-deep-space-nebula", "Sparse deep-space nebula", sparseDeepSpaceDirectorSummary?.nebulaProfile ?? "not provided", sparseDeepSpaceDirectorSummary?.status ?? "informational"),
    metric("sparse-deep-space-negative-space", "Sparse deep-space negative space", sparseDeepSpaceDirectorSummary?.negativeSpaceProfile ?? "not provided", sparseDeepSpaceDirectorSummary?.status ?? "informational"),
    metric("sparse-deep-space-boundary", "Sparse deep-space boundary", sparseDeepSpaceDirectorSummary?.trustedBoundary ?? "Visual backdrop cue only; no physics mutation.", "informational"),
    metric("closeup-presentation-version", "Close-up presentation version", closeupPresentationTruthSummary?.version ?? "not provided", closeupPresentationTruthSummary?.status ?? "informational"),
    metric("background-orbit-art-version", "Background and orbit art version", closeupPresentationTruthSummary?.backgroundOrbitArtVersion ?? "not provided", closeupPresentationTruthSummary?.status ?? "informational"),
    metric("closeup-preview-sync-target", "Close-up preview sync target", closeupPresentationTruthSummary?.previewSyncTarget ?? "not provided", closeupPresentationTruthSummary?.status ?? "informational"),
    metric("closeup-preview-sync-status", "Close-up preview sync status", closeupPresentationTruthSummary?.defaultPreviewSyncStatus ?? "not provided", closeupPresentationTruthSummary?.status ?? "informational"),
    metric("closeup-solar-backdrop", "Close-up solar backdrop", closeupPresentationTruthSummary?.solarBackdropProfile ?? "not provided", closeupPresentationTruthSummary?.status ?? "informational"),
    metric("closeup-planet-readability", "Close-up planet readability", closeupPresentationTruthSummary?.planetReadabilityProfile ?? "not provided", closeupPresentationTruthSummary?.status ?? "informational"),
    metric("background-art-profile", "Background art profile", closeupPresentationTruthSummary?.backgroundArtProfile ?? "not provided", closeupPresentationTruthSummary?.status ?? "informational"),
    metric("orbit-hierarchy-profile", "Orbit hierarchy profile", closeupPresentationTruthSummary?.orbitHierarchyProfile ?? "not provided", closeupPresentationTruthSummary?.status ?? "informational"),
    metric("orbit-performance-profile", "Orbit performance profile", closeupPresentationTruthSummary?.orbitPerformanceProfile ?? "not provided", closeupPresentationTruthSummary?.status ?? "informational"),
    metric("orbit-material-profile", "Orbit material profile", closeupPresentationTruthSummary?.orbitMaterialProfile ?? "not provided", closeupPresentationTruthSummary?.status ?? "informational"),
    metric("solar-closeup-profile", "Solar close-up profile", closeupPresentationTruthSummary?.solarCloseupProfile ?? "not provided", closeupPresentationTruthSummary?.status ?? "informational"),
    metric("velocity-trail-profile", "Velocity trail profile", closeupPresentationTruthSummary?.velocityTrailProfile ?? "not provided", closeupPresentationTruthSummary?.status ?? "informational"),
    metric("orbit-occlusion-profile", "Orbit occlusion profile", closeupPresentationTruthSummary?.orbitOcclusionProfile ?? "not provided", closeupPresentationTruthSummary?.status ?? "informational"),
    metric("closeup-review-mode", "Close-up review mode", closeupPresentationTruthSummary?.sceneReviewMode ?? "not provided", closeupPresentationTruthSummary?.status ?? "informational"),
    metric("closeup-presentation-boundary", "Close-up presentation boundary", closeupPresentationTruthSummary?.trustedBoundary ?? "Visual preview consistency cue only; no physics mutation.", "informational"),
    metric("closeup-visual-fidelity-version", "Close-up visual fidelity version", closeupVisualFidelitySummary?.version ?? "not provided", closeupVisualFidelitySummary?.status ?? "informational"),
    metric("closeup-visual-target", "Close-up visual target", closeupVisualFidelitySummary?.visualTarget ?? "not provided", closeupVisualFidelitySummary?.status ?? "informational"),
    metric("closeup-visual-asset-policy", "Close-up visual asset policy", closeupVisualFidelitySummary?.assetPolicy ?? "not provided", closeupVisualFidelitySummary?.status ?? "informational"),
    metric("closeup-texture-source-policy", "Close-up texture source policy", closeupVisualFidelitySummary?.textureSourcePolicy ?? "not provided", closeupVisualFidelitySummary?.status ?? "informational"),
    metric("closeup-runtime-asset-policy", "Close-up runtime asset policy", closeupVisualFidelitySummary?.runtimeAssetPolicy ?? "not provided", closeupVisualFidelitySummary?.status ?? "informational"),
    metric("closeup-protected-sky-manifest", "Close-up protected sky manifest", closeupVisualFidelitySummary?.protectedSkyManifest ?? "not provided", closeupVisualFidelitySummary?.status ?? "informational"),
    metric("closeup-full-release-gate", "Close-up full release gate", closeupVisualFidelitySummary?.fullReleaseGateStatus ?? "not provided", closeupVisualFidelitySummary?.status ?? "informational"),
    metric("closeup-visual-boundary", "Close-up visual boundary", closeupVisualFidelitySummary?.trustedBoundary ?? "Visual fidelity cue only; no physics or sky mutation.", "informational"),
  ]);
}

function section(
  id: AtlasScientificReportSectionId,
  title: string,
  paragraphs: readonly string[],
  metrics: readonly EvidencePassportMetric[],
): AtlasScientificReportSection {
  return {
    id,
    title,
    body: paragraphs.filter(Boolean).join(" "),
    metrics,
  };
}

function metric(
  id: string,
  label: string,
  value: string,
  status: EvidenceClaimStatus = "informational",
): EvidencePassportMetric {
  return { id, label, value, status };
}

function formatNumber(value: number, digits: number): string {
  if (!Number.isFinite(value)) return "unavailable";
  return value.toLocaleString("en-US", { maximumFractionDigits: digits });
}

function workflowStepStatus(status: AtlasWorkflowSummary["workflows"][number]["steps"][number]["status"] | undefined): EvidenceClaimStatus {
  if (status === "ready") return "ready";
  if (status === "blocked") return "pending";
  return "informational";
}

export function normalizeReportStudioSettings(
  settings: Partial<AtlasReportStudioSettings> | null | undefined,
  sections: readonly AtlasScientificReportSection[],
): AtlasReportStudioSettings {
  const availableSectionIds = availableReportSectionIds(sections);
  const availableSet = new Set<AtlasReportSectionId>(availableSectionIds);
  const template = templateById(settings?.templateId);
  const requestedIds = settings?.includedSectionIds ?? template.includedSectionIds;
  const includedSectionIds = requestedIds.filter((id) => availableSet.has(id));
  const trustedBoundaryId: AtlasReportSectionId = "trusted-boundaries";

  if (availableSet.has(trustedBoundaryId) && !includedSectionIds.includes(trustedBoundaryId)) {
    includedSectionIds.push(trustedBoundaryId);
  }

  if (includedSectionIds.length === 0 && availableSet.has(trustedBoundaryId)) {
    includedSectionIds.push(trustedBoundaryId);
  }

  return {
    templateId: template.id,
    includedSectionIds: Array.from(new Set(includedSectionIds)),
    exportFormat: settings?.exportFormat ?? "markdown",
  };
}

export function templateById(id: AtlasReportTemplateId | null | undefined): AtlasReportTemplate {
  return ATLAS_REPORT_TEMPLATES.find((template) => template.id === id) ?? ATLAS_REPORT_TEMPLATES[0];
}

function availableReportSectionIds(
  sections: readonly AtlasScientificReportSection[],
): readonly AtlasReportSectionId[] {
  return [
    ...sections.map((sectionItem) => sectionItem.id),
    "excluded-state" as const,
  ];
}

export function includedSectionsFor(
  sections: readonly AtlasScientificReportSection[],
  includedSectionIds: readonly AtlasReportSectionId[],
): readonly AtlasScientificReportSection[] {
  const includedSet = new Set(includedSectionIds);
  return sections.filter((sectionItem) => includedSet.has(sectionItem.id));
}

function serializableReport(
  summary: AtlasScientificReportSummary,
  settings?: Partial<AtlasReportStudioSettings> | null,
): AtlasScientificReportSummary {
  if (!settings) return summary;
  const normalized = normalizeReportStudioSettings(settings, summary.sections);
  const sections = includedSectionsFor(summary.sections, normalized.includedSectionIds);
  return {
    ...summary,
    sectionCount: sections.length,
    sections,
    excludedState: normalized.includedSectionIds.includes("excluded-state")
      ? summary.excludedState
      : [],
    reportStudioVersion: ATLAS_REPORT_STUDIO_VERSION,
    templateId: normalized.templateId,
    includedSectionIds: normalized.includedSectionIds,
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function htmlExcludedState(excludedState: readonly string[]): readonly string[] {
  return excludedState.map((item) => {
    switch (item) {
      case "live physics buffers":
        return "live simulation state arrays";
      case "SharedArrayBuffer state":
        return "shared-memory runtime state";
      case "ephemeris arrays":
        return "bulk ephemeris data";
      case "telemetry samples":
        return "raw time-series diagnostics";
      case "screenshots":
        return "image capture artifacts";
      case "large catalog rows":
        return "large raw catalog tables";
      default:
        return item;
    }
  });
}
