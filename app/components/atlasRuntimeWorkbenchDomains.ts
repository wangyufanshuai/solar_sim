import type { AtlasRuntimeWorkbenchSurfaceScope } from "./AtlasRuntimeWorkbenchSurface";

const SCENE_KEYS = [
  "atlasRuntimeQualityTier", "atlasSceneMode", "orbitAtlas", "atlasPerformanceBudgetSummary",
  "presentation", "atlasSkyCloseupProfile", "atlasCinematicCameraProfile",
  "atlasCinematicSkyCompositionProfile", "atlasCinematicBackgroundNoiseProfile",
  "atlasCinematicTargetSeparationProfile", "atlasBackgroundDepthProfile",
  "atlasBackgroundSubjectVisibilityProfile", "atlasReferenceGradeCompositeProfile",
  "atlasReferenceGradeSkyLayerProfile", "atlasReferenceGradeStarfieldProfile",
  "atlasReferenceGradeSubjectMatteProfile", "atlasReferenceGradePlanetMaterialProfile",
  "atlasSelectedBodyMaterialProfile", "atlasSelectedBodyAtmosphereDepthProfile",
  "atlasSelectedBodyTerminatorProfile", "atlasSelectedBodyRingProfile",
  "atlasSelectedBodyKeyLightProfile", "atlasSelectedBodyDepthLightingProfile",
  "atlasSelectedBodyColorGradeProfile", "atlasSelectedBodyGasGiantArtProfile",
  "atlasSelectedBodySaturnRingArtProfile", "atlasSelectedBodyEarthCloudNightProfile",
  "atlasSelectedBodySolarSurfaceProfile", "atlasGlobalColorGradeProfile",
  "atlasBackgroundArtGradeProfile", "atlasCinematicBackdropStarfieldProfile",
  "atlasCinematicBackdropNebulaProfile", "atlasCinematicBackdropNegativeSpaceProfile",
  "atlasSparseDeepSpaceStarfieldProfile", "atlasSparseDeepSpaceMilkyWayProfile",
  "atlasSparseDeepSpaceNebulaProfile", "atlasSparseDeepSpaceNegativeSpaceProfile",
  "atlasCloseupCompositionProfile", "atlasCloseupPanelAvoidanceProfile",
  "atlasCloseupRingShowcaseProfile", "atlasCinematicLightingSummary",
  "handleCanvasReady", "setSkyReady", "handleCoreBodiesReady", "lagrangeSpawnNonceRef",
  "selectedBodyCloseupActive", "selectedBodyLightingProfile", "atlasReady", "kerrBlackHole",
] as const satisfies readonly (keyof AtlasRuntimeWorkbenchSurfaceScope)[];

const SHELL_HUD_KEYS = [
  "atlasShellSceneMode", "rootAttributes", "atlasToolsOpen", "activeSection",
  "viewSettings", "setViewSettings", "visualEnhance", "setVisualEnhance",
  "leftPanelCollapsed", "handleLeftPanelCollapsedChange", "setActiveSection",
] as const satisfies readonly (keyof AtlasRuntimeWorkbenchSurfaceScope)[];

const PANEL_KEYS = [
  "panelSurfaceActivated", "isMobileViewport", "ATLAS_RUNTIME_MODAL_PANEL_IDS",
  "setKerrBlackHole", "deferredEvidenceModules",
  "legacyRelativityPanelProps", "relativityObservableAtlasSummary",
  "relativityObservableExplainerSummary", "atlasRelativityVerificationSummary",
  "atlasRelativityChartSummary", "atlasPhysicsBenchmarkGateSummary",
  "atlasHorizonsGateAuditSummary", "atlasPhysicsGateSplitSummary",
  "atlasScientificGatePreflightSummary", "atlasHorizonsResidualDecompositionSummary",
  "atlasGaiaStarfieldEnhancementSummary", "atlasRelativitySimulationOptimizationSummary",
  "setRelativityObservableAtlasOpen", "setObservationalAstrophysicsOpen",
] as const satisfies readonly (keyof AtlasRuntimeWorkbenchSurfaceScope)[];

const NAVIGATION_FOCUS_KEYS = [
  "selectedExoplanetSystemId", "selectedCelestialCatalogId", "selectedBodyIndex",
  "onAtlasBodyCanvasPick", "onBodyCanvasPick", "onBrightStarFocus",
  "requestGaiaStarFocus", "requestCatalogObjectFocus", "clearFocusLock",
  "searchFocusNonce", "onBodyFocusFromList", "onSelectBody", "onNearbyStarFocus",
  "openKerrLab", "cameraBodyFocusRequest", "cameraOriginResetNonce", "earthMoonView",
  "selectedStellarSearchDocument", "gaiaIndex", "setAtlasNavigatorOpen",
  "handleAtlasNavigatorExecute", "setOrbitAnalysisOpen", "celestialObjectPassport",
  "setSelectedCelestialCatalogId", "handleSearch", "handleZoomIn", "handleZoomOut",
  "orbitAnalysisOpen", "handleFocus", "handleEarthMoon",
] as const satisfies readonly (keyof AtlasRuntimeWorkbenchSurfaceScope)[];

const EVIDENCE_MISSION_KEYS = [
  "openAtlasMissionHub", "openAtlasObservatoryDeck", "openAtlasWorkflows",
  "openAtlasScientificReport", "openAtlasValidationConsole", "setEvidenceInitialClaimId",
  "setEvidenceLedgerOpen", "evidenceInitialClaimId", "gaiaCatalogSource",
  "atlasWorkflowSummary", "atlasWorkflowSelectedId", "atlasWorkflowActiveStepId",
  "setAtlasWorkflowSelectedId", "setAtlasWorkflowActiveStepId", "handleAtlasWorkflowRunStep",
  "setAtlasWorkflowOpen", "atlasMissionHubSummary", "handleMissionHubExecuteItem",
  "handleMissionHubTogglePinned", "handleCopyMissionCapsuleLink", "handleExportMissionCapsule",
  "missionCapsuleImportInputRef", "handleClearMissionCapsuleHash", "setAtlasMissionHubOpen",
  "atlasScientificReportSummary", "atlasReportStudioSummary",
  "atlasScientificReportExportFormat", "handleAtlasReportTemplateChange",
  "handleAtlasReportSectionToggle", "handleExportScientificReportMarkdown",
  "handleExportScientificReportJson", "handleExportScientificReportHtml",
  "handleCopyScientificReportSummary", "setAtlasScientificReportOpen",
  "atlasValidationConsoleSummary", "atlasValidationSelectedDomainId",
  "setAtlasValidationSelectedDomainId", "handleValidationDomainAction",
  "handleValidationIssueAction", "setAtlasValidationConsoleOpen",
  "atlasObservatoryDeckSummary", "atlasObservatoryActiveZoneId",
  "setAtlasObservatoryActiveZoneId", "handleObservatoryDeckAction",
  "setAtlasObservatoryDeckOpen", "navigatorEvidenceSummary", "handleImportMissionCapsuleFile",
  "atlasWorkflowOpen", "atlasMissionHubOpen", "atlasObservatoryDeckOpen",
  "atlasScientificReportOpen", "atlasValidationConsoleOpen", "evidenceLedgerOpen",
] as const satisfies readonly (keyof AtlasRuntimeWorkbenchSurfaceScope)[];

const LAUNCH_KEYS = [
  "handleLocalLaunchHandoff", "handleLaunchAbort", "launchRuntimeActive", "launchMode",
  "localLaunchActiveRef", "launchConfigRef", "localLaunchActive", "launchState",
  "localTelemetryRef", "setLaunchMode", "handleLaunchStart",
] as const satisfies readonly (keyof AtlasRuntimeWorkbenchSurfaceScope)[];

const TIMELINE_PHYSICS_KEYS = [
  "handleExportSystemState", "importStateInputRef", "physicsRef", "precisionTierRef",
  "physicsUsesSharedBuffer", "telemetrySeriesRef", "simulationDiagnosticsRef",
  "relativityEnabled", "relativityEnabledRef", "floatingOriginRef", "integrationSuspendedRef",
  "simDaysRef", "bodyMetricsRef", "daysPerSecond", "handleImportStateFile", "isPlaying",
  "setIsPlaying", "simSlower", "simFaster", "simRewind", "simFastForward",
  "toggleRelativity", "timeTravelScrubURef", "timeTravelScrubbingRef", "physicsHistoryRef",
  "timeTravelScrubUi", "setTimeTravelScrubUi", "syncTimeTravelSuspension",
] as const satisfies readonly (keyof AtlasRuntimeWorkbenchSurfaceScope)[];

type DomainFromKeys<T extends readonly (keyof AtlasRuntimeWorkbenchSurfaceScope)[]> =
  Pick<AtlasRuntimeWorkbenchSurfaceScope, T[number]>;

export type AtlasRuntimeSceneDomain = DomainFromKeys<typeof SCENE_KEYS>;
export type AtlasRuntimeShellHudDomain = DomainFromKeys<typeof SHELL_HUD_KEYS>;
export type AtlasRuntimePanelsDomain = DomainFromKeys<typeof PANEL_KEYS>;
export type AtlasRuntimeNavigationFocusDomain = DomainFromKeys<typeof NAVIGATION_FOCUS_KEYS>;
export type AtlasRuntimeEvidenceMissionDomain = DomainFromKeys<typeof EVIDENCE_MISSION_KEYS>;
export type AtlasRuntimeLaunchDomain = DomainFromKeys<typeof LAUNCH_KEYS>;
export type AtlasRuntimeTimelinePhysicsDomain = DomainFromKeys<typeof TIMELINE_PHYSICS_KEYS>;

export type AtlasRuntimeWorkbenchDomains = {
  scene: AtlasRuntimeSceneDomain;
  shellHud: AtlasRuntimeShellHudDomain;
  panels: AtlasRuntimePanelsDomain;
  navigationFocus: AtlasRuntimeNavigationFocusDomain;
  evidenceMission: AtlasRuntimeEvidenceMissionDomain;
  launch: AtlasRuntimeLaunchDomain;
  timelinePhysics: AtlasRuntimeTimelinePhysicsDomain;
};

function pickDomain<const T extends readonly (keyof AtlasRuntimeWorkbenchSurfaceScope)[]>(
  scope: AtlasRuntimeWorkbenchSurfaceScope,
  keys: T,
): DomainFromKeys<T> {
  return Object.fromEntries(keys.map((key) => [key, scope[key]])) as DomainFromKeys<T>;
}

function reconcileDomain<const T extends readonly (keyof AtlasRuntimeWorkbenchSurfaceScope)[]>(
  scope: AtlasRuntimeWorkbenchSurfaceScope,
  keys: T,
  previous: DomainFromKeys<T> | undefined,
): DomainFromKeys<T> {
  if (previous && keys.every((key) => Object.is(
    (previous as Partial<AtlasRuntimeWorkbenchSurfaceScope>)[key],
    scope[key],
  ))) return previous;
  return pickDomain(scope, keys);
}

export function createAtlasRuntimeDomainGroups(
  scope: AtlasRuntimeWorkbenchSurfaceScope,
  previous?: AtlasRuntimeWorkbenchDomains | null,
): AtlasRuntimeWorkbenchDomains {
  const next = {
    scene: reconcileDomain(scope, SCENE_KEYS, previous?.scene),
    shellHud: reconcileDomain(scope, SHELL_HUD_KEYS, previous?.shellHud),
    panels: reconcileDomain(scope, PANEL_KEYS, previous?.panels),
    navigationFocus: reconcileDomain(scope, NAVIGATION_FOCUS_KEYS, previous?.navigationFocus),
    evidenceMission: reconcileDomain(scope, EVIDENCE_MISSION_KEYS, previous?.evidenceMission),
    launch: reconcileDomain(scope, LAUNCH_KEYS, previous?.launch),
    timelinePhysics: reconcileDomain(scope, TIMELINE_PHYSICS_KEYS, previous?.timelinePhysics),
  };
  if (previous && Object.keys(next).every(
    (key) => next[key as keyof AtlasRuntimeWorkbenchDomains] === previous[key as keyof AtlasRuntimeWorkbenchDomains],
  )) return previous;
  return next;
}
