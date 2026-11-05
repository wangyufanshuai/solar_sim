"use client";

import { useRef, useState } from "react";
import type { BottomControlBarSection } from "../components/BottomControlBar";
import type { CameraBodyFocusRequest } from "../components/UniverseScene";
import type { KerrBlackHoleUiState } from "../components/KerrBlackHolePanel";
import type { AtlasRuntimeWorkbenchDomains } from "../components/atlasRuntimeWorkbenchDomains";
import { DEFAULT_SIM_DAYS_PER_WORLD_SECOND } from "../data/planetsJ2000";
import type { BodyLiveMetrics } from "./bodyLiveMetrics";
import { createFloatingOrigin } from "./floatingOrigin";
import {
  DEFAULT_KERR_GEODESIC_RENDER_MODE,
  DEFAULT_KERR_IMPACT_PARAMETER_M,
  DEFAULT_KERR_ORBIT_PRESET_ID,
} from "./kerrGeodesicVisualization";
import type { PhysicsPrecisionTier } from "./physicsPrecision";
import type { SimulationDiagnostics } from "./simulationDiagnosticsTypes";
import {
  DEFAULT_SIMULATION_VIEW_SETTINGS,
  type SimulationViewSettings,
} from "./simulationViewSettings";
import type { StellarSearchDocument } from "./stellarSearchCatalog";
import type { TelemetrySeriesState } from "./telemetryTypes";

export function useAtlasWorkbenchLocalState() {
  const precisionTierRef = useRef<PhysicsPrecisionTier>("full");
  const floatingOriginRef = useRef(createFloatingOrigin());
  const simDaysRef = useRef(0);
  const previousDomainsRef = useRef<AtlasRuntimeWorkbenchDomains | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [daysPerSecond, setDaysPerSecond] = useState(DEFAULT_SIM_DAYS_PER_WORLD_SECOND);
  const [activeSection, setActiveSection] = useState<BottomControlBarSection>("simulation");
  const [relativityEnabled, setRelativityEnabled] = useState(true);
  const relativityEnabledRef = useRef(true);
  relativityEnabledRef.current = relativityEnabled;
  const [selectedBodyIndex, setSelectedBodyIndex] = useState<number | null>(null);
  const [selectedCelestialCatalogId, setSelectedCelestialCatalogId] = useState("");
  const [selectedStellarSearchDocument, setSelectedStellarSearchDocument] =
    useState<StellarSearchDocument | null>(null);
  const [selectedExoplanetSystemId, setSelectedExoplanetSystemId] = useState("");
  const [cameraBodyFocusRequest, setCameraBodyFocusRequest] =
    useState<CameraBodyFocusRequest | null>(null);
  const [cameraOriginResetNonce, setCameraOriginResetNonce] = useState(0);
  const [earthMoonView, setEarthMoonView] = useState(false);
  const bodyMetricsRef = useRef<BodyLiveMetrics | null>(null);
  const simulationDiagnosticsRef = useRef<SimulationDiagnostics | null>(null);
  const telemetrySeriesRef = useRef<TelemetrySeriesState | null>(null);
  const [kerrBlackHole, setKerrBlackHole] = useState<KerrBlackHoleUiState>({
    massSolar: 12,
    aOverM: 0.88,
    impactParameterM: DEFAULT_KERR_IMPACT_PARAMETER_M,
    orbitPresetId: DEFAULT_KERR_ORBIT_PRESET_ID,
    showFormulaPanel: true,
    highlightTrackKind: "probe-null",
    frameDragTeachingScale: 1.2e12,
    renderMode: DEFAULT_KERR_GEODESIC_RENDER_MODE,
    studioMode: "overview",
    strongGravityRenderMode: "cinematic",
  });
  const [visualEnhance, setVisualEnhance] = useState(false);
  const [viewSettings, setViewSettings] = useState<SimulationViewSettings>(() => ({
    ...DEFAULT_SIMULATION_VIEW_SETTINGS,
    showOrbitTrails: false,
    showOsculatingOrbits: false,
    showRelativisticOptics: false,
  }));
  const lagrangeSpawnNonceRef = useRef(0);
  const missionCapsuleImportInputRef = useRef<HTMLInputElement>(null);
  const [searchFocusNonce, setSearchFocusNonce] = useState(0);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(true);

  return {
    precisionTierRef, floatingOriginRef, simDaysRef, previousDomainsRef,
    isPlaying, setIsPlaying, daysPerSecond, setDaysPerSecond,
    activeSection, setActiveSection, relativityEnabled, setRelativityEnabled,
    relativityEnabledRef, selectedBodyIndex, setSelectedBodyIndex,
    selectedCelestialCatalogId, setSelectedCelestialCatalogId,
    selectedStellarSearchDocument, setSelectedStellarSearchDocument,
    selectedExoplanetSystemId, setSelectedExoplanetSystemId,
    cameraBodyFocusRequest, setCameraBodyFocusRequest,
    cameraOriginResetNonce, setCameraOriginResetNonce,
    earthMoonView, setEarthMoonView, bodyMetricsRef, simulationDiagnosticsRef,
    telemetrySeriesRef, kerrBlackHole, setKerrBlackHole,
    visualEnhance, setVisualEnhance, viewSettings, setViewSettings,
    lagrangeSpawnNonceRef, missionCapsuleImportInputRef,
    searchFocusNonce, setSearchFocusNonce, leftPanelCollapsed, setLeftPanelCollapsed,
  };
}
