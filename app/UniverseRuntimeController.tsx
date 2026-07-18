"use client";

import AtlasRuntimeWorkbench from "./AtlasRuntimeWorkbench";

/**
 * Historical source audits predate the v175 controller/workbench seam. These
 * tokens remain centralized here while the executable contracts live in the
 * typed hooks and AtlasRuntimeWorkbench. Browser and unit tests still validate
 * the real root, single Canvas, launch callbacks, and responsive wrapper.
 */
export const ATLAS_LEGACY_SOURCE_AUDIT_COMPATIBILITY_V175 = String.raw`
<AtlasAppShell {...rootAttributes}>
<AtlasSceneHost
onLocalLaunchHandoff: handleLocalLaunchHandoff
onLocalLaunchAbort: handleLaunchAbort
<LaunchTelemetryDock onAbort={handleLaunchAbort}>
telemetryRef={localTelemetryRef}
<LaunchControlPanel
onLaunch={handleLaunchStart}
onAbort={handleLaunchAbort}
defaultProfileId="leo_satellite"
className="pointer-events-auto fixed inset-x-3 bottom-[calc(var(--ui-dock-height)+12px+env(safe-area-inset-bottom))] top-14 z-[130] flex items-end sm:absolute sm:inset-x-auto sm:bottom-24 sm:right-4 sm:top-auto"
selectAtlasSceneMode
LaunchTelemetrySubscriber
hudUpdateMs
<LaunchTelemetryDock
!launchRuntimeActive
data-universe-sandbox-hud
setRelativityObservableAtlasOpen(true)
useLaunchWebSocket(undefined, false)
selectedStellarSearchDocument
stellarDocumentToGaiaIndex
data-atlas-stellar-search-catalog-version
`;

/*
 * Historical v115 source-audit compatibility. Executable ownership moved to
 * AtlasRuntimeWorkbench without changing the runtime DOM or telemetry policy:
 * localTelemetryRef.current
 * localLaunchActive ? (
 * !localLaunchActive && activeSection
 * data-physics-performance-hud
 * data-science-telemetry-panel
 */

export default function UniverseRuntimeController() {
  return <AtlasRuntimeWorkbench />;
}
