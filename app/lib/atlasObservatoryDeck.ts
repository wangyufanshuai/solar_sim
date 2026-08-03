import type {
  AtlasMissionHubItem,
  AtlasMissionHubSummary,
  AtlasNavigatorSummary,
  AtlasObservatoryDeckAction,
  AtlasObservatoryDeckSummary,
  AtlasObservatoryDeckVersion,
  AtlasObservatoryDeckZone,
  AtlasPerformanceBudgetSummary,
  AtlasChineseDeepSpaceFidelitySummary,
  AtlasCinematicDeepSpaceCameraSummary,
  AtlasCinematicDeepSpaceBackdropSummary,
  AtlasSparseDeepSpaceDirectorSummary,
  AtlasCloseupPresentationTruthSummary,
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
  AtlasReportStudioSummary,
  AtlasValidationConsoleSummary,
  AtlasValidationDomainStatus,
  AtlasWorkflow,
  AtlasWorkflowStep,
  AtlasWorkflowSummary,
  EvidenceLedgerSummary,
  EvidencePassportMetric,
  KerrGeodesicRenderMode,
  KerrOrbitPresetId,
  KerrRelativityStudioMode,
  RelativityGuidedTourSummary,
  RelativityObservableAtlasSummary,
  RelativityObservableExplainerSummary,
} from "./simulationDiagnosticsTypes";

export const ATLAS_OBSERVATORY_DECK_VERSION: AtlasObservatoryDeckVersion =
  "v31-observatory-deck";

export type CreateAtlasObservatoryDeckSummaryArgs = {
  missionHubSummary: AtlasMissionHubSummary;
  validationConsoleSummary: AtlasValidationConsoleSummary;
  reportStudioSummary: AtlasReportStudioSummary;
  navigatorSummary: AtlasNavigatorSummary;
  workflowSummary: AtlasWorkflowSummary;
  evidenceLedgerSummary: EvidenceLedgerSummary;
  performanceBudgetSummary?: AtlasPerformanceBudgetSummary | null;
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
  selectedBodyId?: string | null;
  selectedCatalogObjectId?: string | null;
  selectedEvidenceClaimId?: string | null;
  selectedWorkflowId?: string | null;
  activeWorkflowStepId?: string | null;
  kerrLab?: {
    showKerrBlackHole: boolean;
    spinA: number;
    impactParameterM: number;
    orbitPresetId: KerrOrbitPresetId;
    renderMode: KerrGeodesicRenderMode;
    studioMode?: KerrRelativityStudioMode;
  };
};

export function createAtlasObservatoryDeckSummary({
  missionHubSummary,
  validationConsoleSummary,
  reportStudioSummary,
  navigatorSummary,
  workflowSummary,
  evidenceLedgerSummary,
  performanceBudgetSummary,
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
  selectedBodyId,
  selectedCatalogObjectId,
  selectedEvidenceClaimId,
  selectedWorkflowId,
  activeWorkflowStepId,
  kerrLab,
}: CreateAtlasObservatoryDeckSummaryArgs): AtlasObservatoryDeckSummary {
  const current = missionHubSummary.current;
  const selectedWorkflow =
    workflowSummary.workflows.find((workflow) => workflow.id === selectedWorkflowId) ??
    workflowSummary.workflows.find((workflow) => workflow.id === workflowSummary.selectedDefaultId) ??
    workflowSummary.workflows[0] ??
    null;
  const selectedStep =
    findWorkflowStep(workflowSummary, selectedWorkflowId, activeWorkflowStepId) ??
    selectedWorkflow?.steps.find((step) => step.status === "ready") ??
    firstReadyWorkflowStep(workflowSummary)?.step ??
    null;

  const zones: readonly AtlasObservatoryDeckZone[] = [
    currentTargetZone({
      missionHubSummary,
      navigatorSummary,
      selectedBodyId,
      selectedCatalogObjectId,
      selectedEvidenceClaimId,
      selectedWorkflowId,
      activeWorkflowStepId,
      kerrLab,
    }),
    trustMatrixZone({
      validationConsoleSummary,
      navigatorSummary,
      evidenceLedgerSummary,
      performanceBudgetSummary,
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
      }),
    missionPathZone({
      workflowSummary,
      navigatorSummary,
      selectedWorkflow,
      selectedStep,
      relativityGuidedTourSummary,
    }),
    reportExportZone({
      missionHubSummary,
      reportStudioSummary,
      navigatorSummary,
    }),
  ];

  return {
    version: ATLAS_OBSERVATORY_DECK_VERSION,
    readinessStatus: validationConsoleSummary.status,
    zoneCount: zones.length,
    currentKind: current.currentKind,
    currentId: current.currentId,
    currentTitle: current.title,
    currentSubtitle: current.subtitle,
    trustIssueCount: validationConsoleSummary.issues.length,
    missionReadyStepCount: workflowSummary.readyStepCount,
    reportTemplateId: reportStudioSummary.settings.templateId,
    reportIncludedSectionCount: reportStudioSummary.includedSectionCount,
    zones,
  };
}

function currentTargetZone({
  missionHubSummary,
  navigatorSummary,
  selectedBodyId,
  selectedCatalogObjectId,
  selectedEvidenceClaimId,
  selectedWorkflowId,
  activeWorkflowStepId,
  kerrLab,
}: Pick<
  CreateAtlasObservatoryDeckSummaryArgs,
  | "missionHubSummary"
  | "navigatorSummary"
  | "selectedBodyId"
  | "selectedCatalogObjectId"
  | "selectedEvidenceClaimId"
  | "selectedWorkflowId"
  | "activeWorkflowStepId"
  | "kerrLab"
>): AtlasObservatoryDeckZone {
  const current = missionHubSummary.current;
  const recommendedAction = missionHubSummary.recommendedItems
    .map((item) => missionHubItemAction(item, navigatorSummary))
    .find(Boolean);
  return {
    id: "current-target",
    title: "Current target",
    subtitle: current.currentKind
      ? "Active Atlas object, claim or workflow context"
      : "No selected target yet",
    status: current.currentKind ? "ready" : "informational",
    source: current.source || missionHubSummary.version,
    model: current.model || "Mission Hub current context over local Navigator ids",
    primaryMetric: current.primaryMetric || "Idle; select a body, catalog object, claim or workflow step",
    boundary:
      current.boundary ||
      "Local UI context only; no new physical body, online lookup or simulation mutation.",
    metrics: [
      metric("current-kind", "Current kind", current.currentKind || "none", "informational"),
      metric("current-id", "Current id", current.currentId || "none", "informational"),
      metric("selected-body", "Selected body", selectedBodyId || "none", "informational"),
      metric("selected-catalog", "Selected catalog object", selectedCatalogObjectId || "none", "informational"),
      metric("selected-evidence", "Selected evidence claim", selectedEvidenceClaimId || "none", "informational"),
      metric(
        "selected-workflow",
        "Workflow context",
        `${selectedWorkflowId || "none"} / ${activeWorkflowStepId || "none"}`,
        "informational",
      ),
      metric(
        "kerr-ui",
        "Kerr Lab UI",
        kerrLab
          ? `${kerrLab.showKerrBlackHole ? "visible" : "hidden"}; ${kerrLab.orbitPresetId}; mode ${kerrLab.studioMode ?? "overview"}; b/M ${formatNumber(kerrLab.impactParameterM)}`
          : "not provided",
        "informational",
      ),
    ],
    actions: compactActions([
      panelAction(navigatorSummary, "panel:mission-hub", "Open Mission Hub"),
      recommendedAction,
      panelAction(navigatorSummary, "panel:evidence-ledger", "Open Evidence Ledger"),
    ]),
  };
}

function trustMatrixZone({
  validationConsoleSummary,
  navigatorSummary,
  evidenceLedgerSummary,
  performanceBudgetSummary,
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
}: Pick<
  CreateAtlasObservatoryDeckSummaryArgs,
  | "validationConsoleSummary"
  | "navigatorSummary"
  | "evidenceLedgerSummary"
  | "performanceBudgetSummary"
  | "relativityObservableAtlasSummary"
  | "relativityObservableExplainerSummary"
  | "relativityGuidedTourSummary"
  | "planetaryVisualFidelitySummary"
  | "cinematicLightingSummary"
  | "chineseDeepSpaceFidelitySummary"
  | "cinematicDeepSpaceCameraSummary"
  | "universeSandboxReferenceBackdropSummary"
  | "referenceGradeSpaceArtSummary"
  | "planetaryMaterialCompositionSummary"
  | "cinematicCloseupDirectorSummary"
  | "cinematicKeyLightDirectorSummary"
  | "planetaryDepthLightingSummary"
  | "planetaryColorGradingSummary"
  | "numericalIntegritySummary"
  | "cinematicPlanetaryArtDirectionSummary"
  | "cinematicDeepSpaceBackdropSummary"
  | "sparseDeepSpaceDirectorSummary"
  | "closeupPresentationTruthSummary"
>): AtlasObservatoryDeckZone {
  const topIssue = validationConsoleSummary.issues[0];
  const topIssueAction = topIssue?.relatedNavigatorItemId
    ? navigatorItemAction(
        navigatorSummary,
        topIssue.relatedNavigatorItemId,
        topIssue.actionLabel || "Inspect issue",
      )
    : null;
  return {
    id: "trust-matrix",
    title: "Trust matrix",
    subtitle: "Read-only validation readiness at a glance",
    status: validationConsoleSummary.status,
    source: `${validationConsoleSummary.version} / ${evidenceLedgerSummary.version}`,
    model: "Status matrix over Evidence Ledger, Mission Capsule, Report Studio, Navigator and Workflows",
    primaryMetric: `${validationConsoleSummary.readyCount} ready; ${validationConsoleSummary.pendingCount} pending; ${validationConsoleSummary.failedCount} failed; blockers ${validationConsoleSummary.blockerCount}`,
    boundary:
      "Read-only local provenance summary; not a trust score, certification system or online validation run.",
    metrics: [
      metric("readiness", "Readiness", validationConsoleSummary.status, validationConsoleSummary.status),
      metric(
        "relativity-observables",
        "Relativity observables",
        relativityObservableAtlasSummary
          ? `${relativityObservableAtlasSummary.readyCount}/${relativityObservableAtlasSummary.observableCount} ready`
          : "not provided",
        relativityObservableAtlasSummary?.status ?? "informational",
      ),
      metric(
        "relativity-explainer",
        "Relativity explainer",
        relativityObservableExplainerSummary
          ? `${relativityObservableExplainerSummary.cardCount} cards; ${relativityObservableExplainerSummary.totalStepCount} steps`
          : "not provided",
        relativityObservableExplainerSummary?.status ?? "informational",
      ),
      metric(
        "relativity-tour",
        "Relativity guided tour",
        relativityGuidedTourSummary
          ? `${relativityGuidedTourSummary.readyCount}/${relativityGuidedTourSummary.stepCount} ready`
          : "not provided",
        relativityGuidedTourSummary?.status ?? "informational",
      ),
      metric(
        "planetary-visual-fidelity",
        "Planetary visual fidelity",
        planetaryVisualFidelitySummary
          ? `${planetaryVisualFidelitySummary.visualTarget}; ${planetaryVisualFidelitySummary.assetPolicy}`
          : "not provided",
        planetaryVisualFidelitySummary?.status ?? "informational",
      ),
      metric(
        "cinematic-lighting",
        "Cinematic lighting",
        cinematicLightingSummary
          ? `${cinematicLightingSummary.lightingProfile}; ${cinematicLightingSummary.postFxProfile}`
          : "not provided",
        cinematicLightingSummary?.status ?? "informational",
      ),
      metric(
        "chinese-deep-space-fidelity",
        "中文界面 / 深空保真",
        chineseDeepSpaceFidelitySummary
          ? `${chineseDeepSpaceFidelitySummary.uiLanguage}; ${chineseDeepSpaceFidelitySummary.visualProfile}`
          : "not provided",
        chineseDeepSpaceFidelitySummary?.status ?? "informational",
      ),
      metric(
        "cinematic-deep-space-camera",
        "电影级深空镜头",
        cinematicDeepSpaceCameraSummary
          ? `${cinematicDeepSpaceCameraSummary.defaultCameraProfile}; ${cinematicDeepSpaceCameraSummary.qualityBudget}`
          : "not provided",
        cinematicDeepSpaceCameraSummary?.status ?? "informational",
      ),
      metric(
        "universe-sandbox-reference-backdrop",
        "Universe Sandbox reference backdrop",
        universeSandboxReferenceBackdropSummary
          ? `${universeSandboxReferenceBackdropSummary.backgroundArtDirection}; ${universeSandboxReferenceBackdropSummary.subjectVisibilityProfile}`
          : "not provided",
        universeSandboxReferenceBackdropSummary?.status ?? "informational",
      ),
      metric(
        "reference-grade-space-art",
        "Reference-grade space art",
        referenceGradeSpaceArtSummary
          ? `${referenceGradeSpaceArtSummary.artDirection}; ${referenceGradeSpaceArtSummary.closeupCompositeProfile}`
          : "not provided",
        referenceGradeSpaceArtSummary?.status ?? "informational",
      ),
      metric(
        "planetary-material-composition",
        "Planetary material composition",
        planetaryMaterialCompositionSummary
          ? `${planetaryMaterialCompositionSummary.materialTarget}; ${planetaryMaterialCompositionSummary.earthMaterialProfile}; ${planetaryMaterialCompositionSummary.saturnRingProfile}`
          : "not provided",
        planetaryMaterialCompositionSummary?.status ?? "informational",
      ),
      metric(
        "cinematic-closeup-director",
        "Cinematic close-up director",
        cinematicCloseupDirectorSummary
          ? `${cinematicCloseupDirectorSummary.compositionTarget}; ${cinematicCloseupDirectorSummary.saturnRingShowcaseProfile}`
          : "not provided",
        cinematicCloseupDirectorSummary?.status ?? "informational",
      ),
      metric(
        "cinematic-key-light-director",
        "Cinematic key-light director",
        cinematicKeyLightDirectorSummary
          ? `${cinematicKeyLightDirectorSummary.lightingTarget}; ${cinematicKeyLightDirectorSummary.gasGiantKeyLightProfile}; ${cinematicKeyLightDirectorSummary.saturnKeyLightProfile}`
          : "not provided",
        cinematicKeyLightDirectorSummary?.status ?? "informational",
      ),
      metric(
        "planetary-depth-lighting",
        "Planetary depth lighting",
        planetaryDepthLightingSummary
          ? `${planetaryDepthLightingSummary.lightingTarget}; ${planetaryDepthLightingSummary.saturnDepthLightingProfile}; ${planetaryDepthLightingSummary.ringShadowCue}`
          : "not provided",
        planetaryDepthLightingSummary?.status ?? "informational",
      ),
      metric(
        "planetary-color-grading",
        "Planetary color grading",
        planetaryColorGradingSummary
          ? `${planetaryColorGradingSummary.colorTarget}; ${planetaryColorGradingSummary.saturnColorGradeProfile}; ${planetaryColorGradingSummary.saturnOcclusionCue}`
          : "not provided",
        planetaryColorGradingSummary?.status ?? "informational",
      ),
      metric(
        "numerical-integrity",
        "Numerical integrity",
        numericalIntegritySummary
          ? `${numericalIntegritySummary.integrityStatus}; energy ${numericalIntegritySummary.energyDriftTrend}; angular ${numericalIntegritySummary.angularMomentumDriftTrend}`
          : "not provided",
        numericalIntegritySummary?.status ?? "informational",
      ),
      metric(
        "cinematic-planetary-art-direction",
        "Cinematic planetary art direction",
        cinematicPlanetaryArtDirectionSummary
          ? `${cinematicPlanetaryArtDirectionSummary.qualityTarget}; ${cinematicPlanetaryArtDirectionSummary.globalColorGradeProfile}; ${cinematicPlanetaryArtDirectionSummary.closeupBackgroundArtGradeProfile}`
          : "not provided",
        cinematicPlanetaryArtDirectionSummary?.status ?? "informational",
      ),
      metric(
        "cinematic-deep-space-backdrop",
        "Cinematic deep-space backdrop",
        cinematicDeepSpaceBackdropSummary
          ? `${cinematicDeepSpaceBackdropSummary.skyManifest}; ${cinematicDeepSpaceBackdropSummary.starfieldProfile}; ${cinematicDeepSpaceBackdropSummary.negativeSpaceProfile}`
          : "not provided",
        cinematicDeepSpaceBackdropSummary?.status ?? "informational",
      ),
      metric(
        "sparse-deep-space-director",
        "Sparse deep-space director",
        sparseDeepSpaceDirectorSummary
          ? `${sparseDeepSpaceDirectorSummary.skyManifest}; ${sparseDeepSpaceDirectorSummary.starfieldProfile}; ${sparseDeepSpaceDirectorSummary.negativeSpaceProfile}`
          : "not provided",
        sparseDeepSpaceDirectorSummary?.status ?? "informational",
      ),
      metric(
        "closeup-presentation-truth",
        "Close-up presentation truth",
        closeupPresentationTruthSummary
          ? `${closeupPresentationTruthSummary.previewSyncTarget}; ${closeupPresentationTruthSummary.backgroundOrbitArtVersion}; ${closeupPresentationTruthSummary.backgroundArtProfile}; ${closeupPresentationTruthSummary.orbitHierarchyProfile}; ${closeupPresentationTruthSummary.orbitPerformanceProfile}; ${closeupPresentationTruthSummary.orbitMaterialProfile}; ${closeupPresentationTruthSummary.solarCloseupProfile}; ${closeupPresentationTruthSummary.velocityTrailProfile}`
          : "not provided",
        closeupPresentationTruthSummary?.status ?? "informational",
      ),
      metric("ready-count", "Ready domains", String(validationConsoleSummary.readyCount), "informational"),
      metric("pending-count", "Pending domains", String(validationConsoleSummary.pendingCount), "informational"),
      metric("failed-count", "Failed domains", String(validationConsoleSummary.failedCount), "informational"),
      metric("blockers", "Blockers", String(validationConsoleSummary.blockerCount), validationConsoleSummary.blockerCount > 0 ? "failed" : "ready"),
      metric("warnings", "Warnings", String(validationConsoleSummary.warningCount), validationConsoleSummary.warningCount > 0 ? "pending" : "ready"),
      metric("claims", "Evidence claims", String(evidenceLedgerSummary.claimCount), evidenceLedgerSummary.status),
      metric(
        "performance-budget",
        "Performance budget",
        performanceBudgetSummary
          ? `${performanceBudgetSummary.tier}; ${performanceBudgetSummary.renderStability}; labels ${performanceBudgetSummary.deepSkyLabelBudget}`
          : "not provided",
        performanceBudgetSummary?.renderStability === "ready" ? "ready" : "informational",
      ),
    ],
    actions: compactActions([
      panelAction(navigatorSummary, "panel:validation-console", "Open Validation Console"),
      panelAction(navigatorSummary, "panel:relativity-observables", "Open Observable Atlas"),
      panelAction(navigatorSummary, "panel:atlas-workflows", "Open Guided Tour"),
      topIssueAction,
      panelAction(navigatorSummary, "panel:evidence-ledger", "Open Evidence Ledger"),
    ]),
  };
}

function missionPathZone({
  workflowSummary,
  navigatorSummary,
  selectedWorkflow,
  selectedStep,
  relativityGuidedTourSummary,
}: {
  workflowSummary: AtlasWorkflowSummary;
  navigatorSummary: AtlasNavigatorSummary;
  selectedWorkflow: AtlasWorkflow | null;
  selectedStep: AtlasWorkflowStep | null;
  relativityGuidedTourSummary?: RelativityGuidedTourSummary | null;
}): AtlasObservatoryDeckZone {
  const status: AtlasValidationDomainStatus =
    workflowSummary.workflowCount === 0
      ? "failed"
      : workflowSummary.blockedStepCount > 0
        ? "pending"
        : "ready";
  return {
    id: "mission-path",
    title: "Mission path",
    subtitle: selectedWorkflow?.title ?? "Guided Atlas workflows",
    status,
    source: `${workflowSummary.version} / ${navigatorSummary.version}`,
    model: selectedWorkflow?.model ?? "Curated workflows executed through Navigator actions",
    primaryMetric: selectedWorkflow
      ? `${selectedWorkflow.readyStepCount}/${selectedWorkflow.stepCount} ready steps; ${selectedWorkflow.blockedStepCount} blocked`
      : `${workflowSummary.workflowCount} workflows; ${workflowSummary.readyStepCount} ready steps`,
    boundary:
      selectedWorkflow?.boundary ??
      "Guided UI workflow only; no automated tour playback, online search or new science model.",
    metrics: [
      metric("workflow-count", "Workflow count", String(workflowSummary.workflowCount), status),
      metric("ready-steps", "Ready steps", String(workflowSummary.readyStepCount), "informational"),
      metric("blocked-steps", "Blocked steps", String(workflowSummary.blockedStepCount), workflowSummary.blockedStepCount > 0 ? "pending" : "ready"),
      metric("selected-workflow", "Selected workflow", selectedWorkflow?.id ?? "none", "informational"),
      metric("active-step", "Active / next step", selectedStep?.id ?? "none", selectedStep?.status === "blocked" ? "pending" : "informational"),
      metric("guided-tour-version", "Guided tour version", relativityGuidedTourSummary?.version ?? "not provided", relativityGuidedTourSummary?.status ?? "informational"),
      metric("guided-tour-workflow", "Guided tour workflow", relativityGuidedTourSummary?.workflowId ?? "not provided", relativityGuidedTourSummary?.status ?? "informational"),
      metric("guided-tour-steps", "Guided tour steps", relativityGuidedTourSummary ? String(relativityGuidedTourSummary.stepCount) : "not provided", relativityGuidedTourSummary?.status ?? "informational"),
      metric("guided-tour-ready", "Guided tour ready", relativityGuidedTourSummary ? String(relativityGuidedTourSummary.readyCount) : "not provided", relativityGuidedTourSummary?.status ?? "informational"),
    ],
    actions: compactActions([
      panelAction(navigatorSummary, "panel:atlas-workflows", "Open Atlas Workflows"),
      selectedStep ? workflowStepAction(selectedWorkflow?.id, selectedStep, navigatorSummary) : null,
      panelAction(navigatorSummary, "panel:mission-hub", "Open Mission Hub"),
    ]),
  };
}

function reportExportZone({
  missionHubSummary,
  reportStudioSummary,
  navigatorSummary,
}: Pick<
  CreateAtlasObservatoryDeckSummaryArgs,
  "missionHubSummary" | "reportStudioSummary" | "navigatorSummary"
>): AtlasObservatoryDeckZone {
  const restore = missionHubSummary.capsuleRestoreSummary;
  const status: AtlasValidationDomainStatus =
    reportStudioSummary.includedSectionCount > 0 ? "ready" : "pending";
  return {
    id: "report-export",
    title: "Report/export",
    subtitle: "Capsule and evidence dossier export readiness",
    status,
    source: `${reportStudioSummary.version} / ${reportStudioSummary.reportVersion}`,
    model: "Template-controlled Markdown, JSON and printable HTML over local provenance summaries",
    primaryMetric: `${reportStudioSummary.settings.templateId}; ${reportStudioSummary.includedSectionCount}/${reportStudioSummary.totalSectionCount} sections; ${reportStudioSummary.settings.exportFormat}`,
    boundary:
      "Local UI/session evidence dossier only; no PDF dependency, screenshots, telemetry samples or ephemeris buffers.",
    metrics: [
      metric("template", "Report template", reportStudioSummary.settings.templateId, status),
      metric("sections", "Included sections", `${reportStudioSummary.includedSectionCount}/${reportStudioSummary.totalSectionCount}`, status),
      metric("export-format", "Export format", reportStudioSummary.settings.exportFormat, "informational"),
      metric(
        "capsule-restore",
        "Capsule restore",
        restore?.active
          ? `active; restored ${restore.restoredCount}; warnings ${restore.warningCount}`
          : "none",
        restore?.warningCount ? "pending" : "informational",
      ),
      metric("pins", "Mission Hub pins", String(missionHubSummary.pinnedCount), "informational"),
    ],
    actions: compactActions([
      panelAction(navigatorSummary, "panel:scientific-report", "Open Report Studio"),
      panelAction(navigatorSummary, "panel:mission-hub", "Open Mission Hub"),
      panelAction(navigatorSummary, "panel:validation-console", "Open Validation Console"),
    ]),
  };
}

function panelAction(
  navigatorSummary: AtlasNavigatorSummary,
  navigatorItemId: string,
  label: string,
): AtlasObservatoryDeckAction | null {
  return navigatorItemAction(navigatorSummary, navigatorItemId, label, "panel-action");
}

function navigatorItemAction(
  navigatorSummary: AtlasNavigatorSummary,
  navigatorItemId: string,
  label: string,
  kind: AtlasObservatoryDeckAction["kind"] = "navigator-item",
): AtlasObservatoryDeckAction | null {
  const item = navigatorSummary.items.find((candidate) => candidate.id === navigatorItemId);
  if (!item) return null;
  return {
    id: `action:${navigatorItemId}`,
    kind,
    label,
    source: item.source,
    model: item.subtitle,
    primaryMetric: item.primaryMetric,
    boundary: item.disabledReason ?? "Executes through the Atlas Navigator action router.",
    navigatorItemId: item.id,
    navigatorItem: item,
  };
}

function workflowStepAction(
  workflowId: AtlasWorkflow["id"] | undefined,
  step: AtlasWorkflowStep,
  navigatorSummary: AtlasNavigatorSummary,
): AtlasObservatoryDeckAction | null {
  const item = step.navigatorItemId
    ? navigatorSummary.items.find((candidate) => candidate.id === step.navigatorItemId)
    : step.navigatorItem;
  return {
    id: `action:workflow-step:${workflowId ?? "workflow"}:${step.id}`,
    kind: "workflow-step",
    label: step.actionLabel,
    source: step.source,
    model: step.model,
    primaryMetric: `${step.target}; ${step.expectedSurface}`,
    boundary: step.boundary,
    navigatorItemId: item?.id,
    navigatorItem: item,
    workflowId,
    workflowStepId: step.id,
    workflowStep: step,
  };
}

function missionHubItemAction(
  item: AtlasMissionHubItem,
  navigatorSummary: AtlasNavigatorSummary,
): AtlasObservatoryDeckAction | null {
  if (item.stale) return null;
  if (item.navigatorItemId) {
    return navigatorItemAction(navigatorSummary, item.navigatorItemId, item.actionLabel);
  }
  if (item.navigatorItem) {
    return {
      id: `action:${item.navigatorItem.id}`,
      kind: "navigator-item",
      label: item.actionLabel,
      source: item.source,
      model: item.model,
      primaryMetric: item.primaryMetric,
      boundary: item.boundary,
      navigatorItemId: item.navigatorItem.id,
      navigatorItem: item.navigatorItem,
    };
  }
  return null;
}

function findWorkflowStep(
  workflowSummary: AtlasWorkflowSummary,
  workflowId: string | null | undefined,
  stepId: string | null | undefined,
): AtlasWorkflowStep | null {
  if (!workflowId || !stepId) return null;
  return (
    workflowSummary.workflows
      .find((workflow) => workflow.id === workflowId)
      ?.steps.find((step) => step.id === stepId) ?? null
  );
}

function firstReadyWorkflowStep(
  workflowSummary: AtlasWorkflowSummary,
): { workflow: AtlasWorkflow; step: AtlasWorkflowStep } | null {
  for (const workflow of workflowSummary.workflows) {
    const step = workflow.steps.find((candidate) => candidate.status === "ready");
    if (step) return { workflow, step };
  }
  return null;
}

function compactActions(
  actions: readonly (AtlasObservatoryDeckAction | null | undefined)[],
): readonly AtlasObservatoryDeckAction[] {
  const seen = new Set<string>();
  const compact: AtlasObservatoryDeckAction[] = [];
  for (const action of actions) {
    if (!action || seen.has(action.id)) continue;
    seen.add(action.id);
    compact.push(action);
  }
  return compact;
}

function metric(
  id: string,
  label: string,
  value: string,
  status: EvidencePassportMetric["status"],
): EvidencePassportMetric {
  return { id, label, value, status };
}

function formatNumber(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : "n/a";
}
