"use client";

import { Suspense } from "react";
import {
  AtlasMissionHubPanel, AtlasNavigatorRuntimePanel, AtlasObservatoryDeckPanel,
  AtlasRuntimePanelSurface, AtlasScientificReportPanel, AtlasValidationConsolePanel,
  AtlasWorkflowPanel, BodyDetailSidebar, CelestialObjectPassportPanel,
  EvidenceLedgerPanel, ObservationalAstrophysicsLabPanel, OrbitAnalysisSheet,
  RelativityObservableAtlasPanel,
} from "./AtlasRuntimeWorkbenchLazySurfaces";
import { ORBIT_ATLAS_ORBIT_RENDERER, ORBIT_ATLAS_VISUAL_PROFILE } from "../lib/orbitAtlasPresentation";
import type {
  AtlasRuntimeEvidenceMissionDomain,
  AtlasRuntimeLaunchDomain,
  AtlasRuntimeNavigationFocusDomain,
  AtlasRuntimePanelsDomain,
  AtlasRuntimeSceneDomain,
  AtlasRuntimeShellHudDomain,
  AtlasRuntimeTimelinePhysicsDomain,
} from "./atlasRuntimeWorkbenchDomains";
import type { CelestialObjectPassportSessionV638 } from "../lib/useCelestialObjectPassportSessionV638";

export default function AtlasRuntimePanelLayer({
  scene,
  shellHud,
  panels,
  navigationFocus,
  evidenceMission,
  launch,
  timelinePhysics,
  passportSession,
}: {
  scene: AtlasRuntimeSceneDomain;
  shellHud: AtlasRuntimeShellHudDomain;
  panels: AtlasRuntimePanelsDomain;
  navigationFocus: AtlasRuntimeNavigationFocusDomain;
  evidenceMission: AtlasRuntimeEvidenceMissionDomain;
  launch: AtlasRuntimeLaunchDomain;
  timelinePhysics: AtlasRuntimeTimelinePhysicsDomain;
  passportSession: CelestialObjectPassportSessionV638;
}) {
  const {
    panelSurfaceActivated, isMobileViewport, ATLAS_RUNTIME_MODAL_PANEL_IDS,
    deferredEvidenceModules, legacyRelativityPanelProps, relativityObservableAtlasSummary,
    relativityObservableExplainerSummary, atlasRelativityVerificationSummary,
    atlasRelativityChartSummary, atlasPhysicsBenchmarkGateSummary,
    atlasHorizonsGateAuditSummary, atlasPhysicsGateSplitSummary,
    atlasScientificGatePreflightSummary, atlasHorizonsResidualDecompositionSummary,
    atlasGaiaStarfieldEnhancementSummary, atlasRelativitySimulationOptimizationSummary,
    setRelativityObservableAtlasOpen, setObservationalAstrophysicsOpen,
  } = panels;
  const { launchRuntimeActive } = launch;
  const { viewSettings, setViewSettings } = shellHud;
  const { orbitAtlas, atlasReady, presentation, atlasPerformanceBudgetSummary } = scene;
  const {
    openKerrLab, clearFocusLock, selectedExoplanetSystemId, selectedBodyIndex, gaiaIndex,
    setAtlasNavigatorOpen, handleAtlasNavigatorExecute, setOrbitAnalysisOpen, requestCatalogObjectFocus,
    selectedCelestialCatalogId,
  } = navigationFocus;
  const {
    setEvidenceLedgerOpen, evidenceInitialClaimId, gaiaCatalogSource,
    atlasWorkflowSummary, atlasWorkflowSelectedId, atlasWorkflowActiveStepId,
    setAtlasWorkflowSelectedId, setAtlasWorkflowActiveStepId,
    handleAtlasWorkflowRunStep, openAtlasMissionHub, setAtlasWorkflowOpen,
    atlasMissionHubSummary, handleMissionHubExecuteItem, handleMissionHubTogglePinned,
    handleCopyMissionCapsuleLink, handleExportMissionCapsule,
    missionCapsuleImportInputRef, handleClearMissionCapsuleHash,
    openAtlasScientificReport, openAtlasValidationConsole, openAtlasObservatoryDeck,
    setAtlasMissionHubOpen, atlasScientificReportSummary,
    atlasReportStudioSummary, atlasScientificReportExportFormat,
    handleAtlasReportTemplateChange, handleAtlasReportSectionToggle,
    handleExportScientificReportMarkdown, handleExportScientificReportJson,
    handleExportScientificReportHtml, handleCopyScientificReportSummary,
    setAtlasScientificReportOpen, atlasValidationConsoleSummary,
    atlasValidationSelectedDomainId, setAtlasValidationSelectedDomainId,
    handleValidationDomainAction, handleValidationIssueAction,
    setAtlasValidationConsoleOpen, atlasObservatoryDeckSummary,
    atlasObservatoryActiveZoneId, setAtlasObservatoryActiveZoneId,
    handleObservatoryDeckAction, setAtlasObservatoryDeckOpen, setEvidenceInitialClaimId,
    navigatorEvidenceSummary,
  } = evidenceMission;
  const {
    simulationDiagnosticsRef, physicsRef, simDaysRef, bodyMetricsRef, telemetrySeriesRef,
    relativityEnabled, daysPerSecond,
  } = timelinePhysics;

  // Catalog focus is a lightweight read-only surface and must remain available
  // before the heavier managed panel surface has been activated.
  if (launchRuntimeActive || (!panelSurfaceActivated && !selectedCelestialCatalogId)) return null;

  return (
    <Suspense fallback={null}>
      <div className="contents" data-atlas-runtime-domain="panel-slots">
        <AtlasRuntimePanelSurface
          viewportMode={isMobileViewport ? "mobile" : "desktop"}
          modalPanelIds={ATLAS_RUNTIME_MODAL_PANEL_IDS}
          onUnhandledEscape={() => {
            if (passportSession.isOpen) {
              passportSession.dismiss();
              return;
            }
            if (viewSettings.showKerrBlackHole) {
              setViewSettings((settings) => ({ ...settings, showKerrBlackHole: false }));
              return;
            }
            clearFocusLock();
          }}
          slots={{
            "evidence-ledger": (session) => <EvidenceLedgerPanel
              open={session.isOpen}
              onClose={() => setEvidenceLedgerOpen(false)}
              initialSelectedClaimId={evidenceInitialClaimId}
              simulationDiagnosticsRef={simulationDiagnosticsRef}
              orbitAtlasProfile={ORBIT_ATLAS_VISUAL_PROFILE}
              orbitAtlasRenderer={ORBIT_ATLAS_ORBIT_RENDERER}
              gaiaCatalogSource={gaiaCatalogSource}
              orbitAtlasReady={atlasReady}
              presentationMode={presentation.presentationMode}
              performanceBudgetSummary={atlasPerformanceBudgetSummary}
            />,
            workflow: (session) => <AtlasWorkflowPanel
              open={session.isOpen}
              summary={atlasWorkflowSummary}
              selectedWorkflowId={atlasWorkflowSelectedId}
              activeStepId={atlasWorkflowActiveStepId}
              onSelectedWorkflowIdChange={setAtlasWorkflowSelectedId}
              onActiveStepIdChange={setAtlasWorkflowActiveStepId}
              onRunStep={handleAtlasWorkflowRunStep}
              onMissionHubOpen={openAtlasMissionHub}
              onClose={() => setAtlasWorkflowOpen(false)}
            />,
            "mission-hub": (session) => <AtlasMissionHubPanel
              open={session.isOpen}
              summary={atlasMissionHubSummary}
              onExecuteItem={handleMissionHubExecuteItem}
              onTogglePinned={handleMissionHubTogglePinned}
              onCopyCapsuleLink={handleCopyMissionCapsuleLink}
              onExportCapsule={handleExportMissionCapsule}
              onImportCapsule={() => missionCapsuleImportInputRef.current?.click()}
              onClearCapsule={handleClearMissionCapsuleHash}
              onScientificReportOpen={openAtlasScientificReport}
              onValidationConsoleOpen={openAtlasValidationConsole}
              onObservatoryDeckOpen={openAtlasObservatoryDeck}
              onClose={() => setAtlasMissionHubOpen(false)}
            />,
            "scientific-report": (session) => deferredEvidenceModules.report ? <AtlasScientificReportPanel
              open={session.isOpen}
              summary={atlasScientificReportSummary}
              studioSummary={atlasReportStudioSummary}
              exportFormat={atlasScientificReportExportFormat}
              onTemplateChange={handleAtlasReportTemplateChange}
              onSectionToggle={handleAtlasReportSectionToggle}
              onExportMarkdown={handleExportScientificReportMarkdown}
              onExportJson={handleExportScientificReportJson}
              onExportHtml={handleExportScientificReportHtml}
              onCopySummary={handleCopyScientificReportSummary}
              onValidationConsoleOpen={openAtlasValidationConsole}
              onObservatoryDeckOpen={openAtlasObservatoryDeck}
              onClose={() => setAtlasScientificReportOpen(false)}
            /> : null,
            "validation-console": (session) => deferredEvidenceModules.validation ? <AtlasValidationConsolePanel
              open={session.isOpen}
              summary={atlasValidationConsoleSummary}
              selectedDomainId={atlasValidationSelectedDomainId}
              onSelectedDomainIdChange={setAtlasValidationSelectedDomainId}
              onRunDomainAction={handleValidationDomainAction}
              onRunIssueAction={handleValidationIssueAction}
              onObservatoryDeckOpen={openAtlasObservatoryDeck}
              onClose={() => setAtlasValidationConsoleOpen(false)}
            /> : null,
            "observatory-deck": (session) => deferredEvidenceModules.observatory ? <AtlasObservatoryDeckPanel
              open={session.isOpen}
              summary={atlasObservatoryDeckSummary}
              activeZoneId={atlasObservatoryActiveZoneId}
              onActiveZoneIdChange={setAtlasObservatoryActiveZoneId}
              onRunAction={handleObservatoryDeckAction}
              onClose={() => setAtlasObservatoryDeckOpen(false)}
            /> : null,
            "relativity-observables": (session) => legacyRelativityPanelProps ? <RelativityObservableAtlasPanel
              open={session.isOpen}
              summary={relativityObservableAtlasSummary}
              explainerSummary={relativityObservableExplainerSummary}
              relativityVerificationSummary={atlasRelativityVerificationSummary}
              relativityChartSummary={atlasRelativityChartSummary}
              physicsBenchmarkGateSummary={atlasPhysicsBenchmarkGateSummary}
              horizonsGateAuditSummary={atlasHorizonsGateAuditSummary}
              physicsGateSplitSummary={atlasPhysicsGateSplitSummary}
              scientificGatePreflightSummary={atlasScientificGatePreflightSummary}
              horizonsResidualDecompositionSummary={atlasHorizonsResidualDecompositionSummary}
              {...legacyRelativityPanelProps}
              gaiaStarfieldEnhancementSummary={atlasGaiaStarfieldEnhancementSummary}
              relativitySimulationOptimizationSummary={atlasRelativitySimulationOptimizationSummary}
              onOpenEvidenceLedger={() => {
                setEvidenceInitialClaimId("relativity-observable-atlas");
                setEvidenceLedgerOpen(true);
              }}
              onOpenKerrStudio={openKerrLab}
              onClose={() => setRelativityObservableAtlasOpen(false)}
            /> : null,
            "observational-astrophysics": (session) => <ObservationalAstrophysicsLabPanel
              open={session.isOpen}
              systemId={selectedExoplanetSystemId}
              onClose={() => setObservationalAstrophysicsOpen(false)}
            />,
            navigator: (session) => <AtlasNavigatorRuntimePanel
              open={session.isOpen}
              evidenceLedgerSummary={navigatorEvidenceSummary}
              orbitAnalysisAvailable={orbitAtlas && selectedBodyIndex !== null && selectedBodyIndex > 0}
              gaiaIndex={gaiaIndex}
              onClose={() => setAtlasNavigatorOpen(false)}
              onExecute={handleAtlasNavigatorExecute}
            />,
            "orbit-analysis": (session) => orbitAtlas ? <OrbitAnalysisSheet
              open={session.isOpen}
              onClose={() => setOrbitAnalysisOpen(false)}
              physicsRef={physicsRef}
              selectedBodyIndex={selectedBodyIndex}
              simDaysRef={simDaysRef}
              simulationDiagnosticsRef={simulationDiagnosticsRef}
              scaleMode={presentation.scaleMode}
            /> : null,
          }}
        />
        {passportSession.isOpen && passportSession.passport ? <CelestialObjectPassportPanel
          passport={passportSession.passport}
          onClose={passportSession.dismiss}
          onSelectRelatedObject={(catalogId) => requestCatalogObjectFocus(catalogId, "object-browser")}
          onExitFocus={clearFocusLock}
          onOpenEvidenceLedger={() => {
            setEvidenceInitialClaimId("celestial-catalog-atlas");
            setEvidenceLedgerOpen(true);
          }}
        /> : null}
        {!passportSession.isOpen && passportSession.passport ? (
          <div
            className="pointer-events-auto fixed inset-x-2 bottom-[calc(var(--ui-dock-height)+14px+env(safe-area-inset-bottom))] z-[120] flex items-center gap-1 rounded-lg border border-white/12 bg-[rgba(9,12,15,0.92)] p-1 text-white shadow-lg backdrop-blur-2xl sm:inset-x-auto sm:right-4 sm:z-[103] sm:max-w-[24rem]"
            data-celestial-object-passport-collapsed="true"
            data-celestial-object-passport-id={passportSession.passport.objectId}
            aria-label="当前聚焦天体"
          >
            <button
              type="button"
              onClick={passportSession.reopen}
              className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-md px-3 text-left text-xs text-cyan-50/85 hover:bg-white/8"
              aria-label="打开天体档案"
              aria-controls="atlas-celestial-object-passport"
              aria-expanded="false"
            >
              <span className="truncate">{passportSession.passport.title}</span>
              <span className="shrink-0 text-[10px] text-white/50">查看档案</span>
            </button>
            <button
              type="button"
              onClick={clearFocusLock}
              className="min-h-11 shrink-0 rounded-md px-3 text-[10px] text-white/60 hover:bg-white/8 hover:text-white/90"
              aria-label="退出聚焦"
            >退出聚焦</button>
          </div>
        ) : null}
        {selectedBodyIndex !== null && !orbitAtlas ? (
          <BodyDetailSidebar
            key={selectedBodyIndex}
            physicsRef={physicsRef}
            bodyMetricsRef={bodyMetricsRef}
            simulationDiagnosticsRef={simulationDiagnosticsRef}
            telemetrySeriesRef={telemetrySeriesRef}
            relativityEnabled={relativityEnabled}
            simDaysRef={simDaysRef}
            daysPerSecond={daysPerSecond}
            selectedBodyIndex={selectedBodyIndex}
            onDismiss={clearFocusLock}
          />
        ) : null}
      </div>
    </Suspense>
  );
}
