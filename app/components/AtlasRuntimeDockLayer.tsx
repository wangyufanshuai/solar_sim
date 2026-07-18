"use client";

import { Suspense } from "react";
import {
  AtlasLaunchTelemetrySurface, LaunchControlPanel, LaunchTelemetryDock,
  OrbitAtlasHud, SceneLabPanel,
} from "./AtlasRuntimeWorkbenchLazySurfaces";
import AtlasRuntimePerformanceProbe from "./AtlasRuntimePerformanceProbe";
import BottomControlBar from "./BottomControlBar";
import SimClockReadout from "./SimClockReadout";
import SimulationHistoryBar from "./SimulationHistoryBar";
import { preloadAtlasSceneModule } from "./AtlasSceneLazyModules";
import { atlasRuntimeStore, useAtlasRuntimeStore } from "../lib/atlasRuntimeStore";
import type { AtlasRuntimeWorkbenchSurfaceScope } from "./AtlasRuntimeWorkbenchSurface";

export default function AtlasRuntimeDockLayer({
  scope,
}: {
  scope: AtlasRuntimeWorkbenchSurfaceScope;
}) {
  const experienceMode = useAtlasRuntimeStore((snapshot) => snapshot.experienceMode);
  const {
    importStateInputRef, handleImportStateFile, missionCapsuleImportInputRef,
    handleImportMissionCapsuleFile, atlasRuntimeQualityTier, atlasSceneMode,
    selectedExoplanetSystemId, clearFocusLock, localLaunchActive, handleLaunchAbort,
    launchState, localTelemetryRef, orbitAtlas, isPlaying, setIsPlaying, simDaysRef,
    daysPerSecond, presentation, viewSettings, setViewSettings, handleSearch,
    handleZoomIn, handleZoomOut, setActiveSection, setLaunchMode, selectedBodyIndex,
    orbitAnalysisOpen, setOrbitAnalysisOpen, atlasWorkflowOpen, openAtlasWorkflows,
    atlasMissionHubOpen, openAtlasMissionHub, atlasObservatoryDeckOpen,
    openAtlasObservatoryDeck, atlasScientificReportOpen, openAtlasScientificReport,
    atlasValidationConsoleOpen, openAtlasValidationConsole, evidenceLedgerOpen,
    setEvidenceInitialClaimId, setEvidenceLedgerOpen, activeSection, handleFocus,
    handleEarthMoon, simSlower, simFaster, simRewind, simFastForward,
    relativityEnabled, toggleRelativity, setRelativityObservableAtlasOpen,
    timeTravelScrubURef, timeTravelScrubbingRef, physicsHistoryRef, timeTravelScrubUi,
    setTimeTravelScrubUi, syncTimeTravelSuspension, atlasReady, handleLaunchStart,
  } = scope;

  const closeLaunchPanel = () => {
    setLaunchMode(false);
    setActiveSection("simulation");
    window.requestAnimationFrame(() => {
      const candidates = document.querySelectorAll<HTMLElement>(
        '[data-atlas-section="simulation"], [data-atlas-accessibility-return-target="search"]',
      );
      for (const candidate of candidates) {
        if (candidate.getClientRects().length === 0) continue;
        candidate.focus({ preventScroll: true });
        break;
      }
    });
  };

  return (
    <div className="contents" data-atlas-runtime-domain="dock">
      <input
        ref={importStateInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        aria-hidden
        onChange={handleImportStateFile}
      />
      <input
        ref={missionCapsuleImportInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        aria-hidden
        onChange={handleImportMissionCapsuleFile}
      />
      <AtlasRuntimePerformanceProbe qualityTier={atlasRuntimeQualityTier} sceneMode={atlasSceneMode} />
      {atlasSceneMode === "exoplanet-system" ? (
        <div className="pointer-events-none fixed left-1/2 top-4 z-[70] w-[min(92vw,520px)] -translate-x-1/2 border border-cyan-100/20 bg-black/72 px-4 py-3 text-cyan-50 backdrop-blur-md" data-exoplanet-system-overlay={selectedExoplanetSystemId}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase text-cyan-100/45">NASA Exoplanet Archive / 离线轨道图集</div>
              <div className="mt-1 text-sm font-semibold">{selectedExoplanetSystemId.replace(/-/g, " ")}</div>
            </div>
            <button type="button" className="pointer-events-auto min-h-10 border border-white/20 px-3 py-1.5 text-xs hover:bg-white/10" onClick={clearFocusLock}>退出系统</button>
          </div>
          <div className="mt-2 text-[10px] text-white/45">虚线表示偏心率未知；缺失倾角与相位采用确定性展示方向，不作为观测事实。</div>
        </div>
      ) : null}
      {localLaunchActive ? (
        <Suspense fallback={null}>
          <LaunchTelemetryDock onAbort={handleLaunchAbort}>
            <AtlasLaunchTelemetrySurface
              state={launchState}
              telemetryRef={localTelemetryRef}
              qualityTier={atlasRuntimeQualityTier}
            />
          </LaunchTelemetryDock>
        </Suspense>
      ) : orbitAtlas ? (
        <Suspense fallback={null}>
          <OrbitAtlasHud
            isPlaying={isPlaying}
            onPlayPause={() => setIsPlaying((playing) => !playing)}
            simulationTimeSlot={<SimClockReadout simDaysRef={simDaysRef} />}
            daysPerSecond={daysPerSecond}
            scaleMode={presentation.scaleMode}
            onScaleModeChange={presentation.setScaleMode}
            renderBudget={presentation.renderBudget}
            onRenderBudgetChange={presentation.setRenderBudget}
            viewSettings={viewSettings}
            onViewSettingsChange={setViewSettings}
            onSearch={handleSearch}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onResetView={clearFocusLock}
            onOpenSandbox={() => presentation.setPresentationMode("sandbox")}
            onOpenLaunch={() => {
              void preloadAtlasSceneModule("launch");
              presentation.setPresentationMode("sandbox");
              setActiveSection("launch");
              setLaunchMode(true);
            }}
            analysisAvailable={selectedBodyIndex !== null && selectedBodyIndex > 0}
            analysisOpen={orbitAnalysisOpen}
            onAnalysisToggle={() => setOrbitAnalysisOpen((open) => !open)}
            atlasWorkflowsOpen={atlasWorkflowOpen}
            onAtlasWorkflowsOpen={openAtlasWorkflows}
            missionHubOpen={atlasMissionHubOpen}
            onMissionHubOpen={openAtlasMissionHub}
            observatoryDeckOpen={atlasObservatoryDeckOpen}
            onObservatoryDeckOpen={openAtlasObservatoryDeck}
            scientificReportOpen={atlasScientificReportOpen}
            onScientificReportOpen={openAtlasScientificReport}
            validationConsoleOpen={atlasValidationConsoleOpen}
            onValidationConsoleOpen={openAtlasValidationConsole}
            evidenceLedgerOpen={evidenceLedgerOpen}
            onEvidenceLedgerToggle={() => {
              setEvidenceInitialClaimId("");
              setEvidenceLedgerOpen((open) => !open);
            }}
          />
        </Suspense>
      ) : (
        <BottomControlBar
          isPlaying={isPlaying}
          onPlayPause={() => setIsPlaying((playing) => !playing)}
          simulationTimeSlot={<SimClockReadout simDaysRef={simDaysRef} />}
          daysPerSecond={daysPerSecond}
          activeSection={activeSection}
          onSectionChange={(section) => {
            setActiveSection(section);
            if (section === "launch") {
              void preloadAtlasSceneModule("launch");
              setLaunchMode(true);
            }
          }}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onFocusSelected={handleFocus}
          onResetView={clearFocusLock}
          onEarthMoonView={handleEarthMoon}
          onSimSlower={simSlower}
          onSimFaster={simFaster}
          onSimRewind={simRewind}
          onSimFastForward={simFastForward}
          onSearch={handleSearch}
          relativityEnabled={relativityEnabled}
          onRelativityToggle={toggleRelativity}
          onRelativityCore={() => setRelativityObservableAtlasOpen(true)}
          experienceMode={experienceMode}
          onExperienceModeChange={(mode) => atlasRuntimeStore.setExperienceMode(mode)}
          historySlot={(
            <SimulationHistoryBar
              simDaysRef={simDaysRef}
              scrubURef={timeTravelScrubURef}
              scrubbingRef={timeTravelScrubbingRef}
              physicsHistoryRef={physicsHistoryRef}
              isPlaying={isPlaying}
              scrubUi={timeTravelScrubUi}
              setScrubUi={setTimeTravelScrubUi}
              onSyncSuspension={syncTimeTravelSuspension}
            />
          )}
        />
      )}
      {orbitAtlas && !atlasReady ? (
        <div className="pointer-events-none absolute right-4 top-4 z-[80] rounded border border-white/10 bg-black/50 px-3 py-2 text-[10px] text-white/45 backdrop-blur-md">
          Loading sky and core bodies
        </div>
      ) : null}
      {!orbitAtlas && !localLaunchActive && activeSection === "launch" ? (
        <div className="pointer-events-auto fixed inset-x-3 bottom-[calc(var(--ui-dock-height)+12px+env(safe-area-inset-bottom))] top-auto z-[130] flex h-[46dvh] max-h-[46dvh] items-end overflow-hidden sm:absolute sm:inset-x-auto sm:bottom-24 sm:right-4 sm:h-auto sm:max-h-[calc(100dvh-7rem)] sm:overflow-visible">
          <Suspense fallback={null}>
            <LaunchControlPanel
              onLaunch={handleLaunchStart}
              onAbort={handleLaunchAbort}
              onClose={closeLaunchPanel}
              isStreaming={localLaunchActive}
              defaultProfileId="leo_satellite"
            />
          </Suspense>
        </div>
      ) : null}
      {!localLaunchActive && activeSection === "lab" ? (
        <SceneLabPanel onClose={() => setActiveSection("simulation")} />
      ) : null}
    </div>
  );
}

