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
import type { AtlasRuntimeWorkbenchSurfaceScope } from "./AtlasRuntimeWorkbenchSurface";

export default function AtlasRuntimePanelLayer({
  scope,
}: {
  scope: AtlasRuntimeWorkbenchSurfaceScope;
}) {
  const {
    launchRuntimeActive, panelSurfaceActivated, isMobileViewport,
    ATLAS_RUNTIME_MODAL_PANEL_IDS, viewSettings, setViewSettings, openKerrLab, clearFocusLock,
    setEvidenceLedgerOpen, evidenceInitialClaimId, simulationDiagnosticsRef,
    gaiaCatalogSource, atlasReady, presentation, atlasPerformanceBudgetSummary,
    atlasWorkflowSummary, atlasWorkflowSelectedId, atlasWorkflowActiveStepId,
    setAtlasWorkflowSelectedId, setAtlasWorkflowActiveStepId,
    handleAtlasWorkflowRunStep, openAtlasMissionHub, setAtlasWorkflowOpen,
    atlasMissionHubSummary, handleMissionHubExecuteItem, handleMissionHubTogglePinned,
    handleCopyMissionCapsuleLink, handleExportMissionCapsule,
    missionCapsuleImportInputRef, handleClearMissionCapsuleHash,
    openAtlasScientificReport, openAtlasValidationConsole, openAtlasObservatoryDeck,
    setAtlasMissionHubOpen, deferredEvidenceModules, atlasScientificReportSummary,
    atlasReportStudioSummary, atlasScientificReportExportFormat,
    handleAtlasReportTemplateChange, handleAtlasReportSectionToggle,
    handleExportScientificReportMarkdown, handleExportScientificReportJson,
    handleExportScientificReportHtml, handleCopyScientificReportSummary,
    setAtlasScientificReportOpen, atlasValidationConsoleSummary,
    atlasValidationSelectedDomainId, setAtlasValidationSelectedDomainId,
    handleValidationDomainAction, handleValidationIssueAction,
    setAtlasValidationConsoleOpen, atlasObservatoryDeckSummary,
    atlasObservatoryActiveZoneId, setAtlasObservatoryActiveZoneId,
    handleObservatoryDeckAction, setAtlasObservatoryDeckOpen,
    legacyRelativityPanelProps, relativityObservableAtlasSummary,
    relativityObservableExplainerSummary, atlasRelativityVerificationSummary,
    atlasRelativityChartSummary, atlasPhysicsBenchmarkGateSummary,
    atlasHorizonsGateAuditSummary, atlasPhysicsGateSplitSummary,
    atlasScientificGatePreflightSummary, atlasHorizonsResidualDecompositionSummary,
    atlasGaiaStarfieldEnhancementSummary, atlasRelativitySimulationOptimizationSummary,
    setEvidenceInitialClaimId, setRelativityObservableAtlasOpen,
    selectedExoplanetSystemId, setObservationalAstrophysicsOpen,
    navigatorEvidenceSummary, orbitAtlas, selectedBodyIndex, gaiaIndex,
    setAtlasNavigatorOpen, handleAtlasNavigatorExecute, setOrbitAnalysisOpen,
    physicsRef, simDaysRef, celestialObjectPassport, setSelectedCelestialCatalogId,
    bodyMetricsRef, telemetrySeriesRef, relativityEnabled, daysPerSecond,
  } = scope;

  if (launchRuntimeActive || !panelSurfaceActivated) return null;

  return (
    <Suspense fallback={null}>
      <div className="contents" data-atlas-runtime-domain="panel-slots">
        <AtlasRuntimePanelSurface
          viewportMode={isMobileViewport ? "mobile" : "desktop"}
          modalPanelIds={ATLAS_RUNTIME_MODAL_PANEL_IDS}
          onUnhandledEscape={() => {
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
        {celestialObjectPassport ? <CelestialObjectPassportPanel
          passport={celestialObjectPassport}
          onClose={() => setSelectedCelestialCatalogId("")}
          onExitFocus={clearFocusLock}
          onOpenEvidenceLedger={() => {
            setEvidenceInitialClaimId("celestial-catalog-atlas");
            setEvidenceLedgerOpen(true);
          }}
        /> : null}
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
