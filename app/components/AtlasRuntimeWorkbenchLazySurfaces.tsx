"use client";

import dynamic from "next/dynamic";
import { lazy } from "react";

export const AtlasSceneHost = dynamic(() => import("./AtlasSceneHost"), {
  ssr: false,
  loading: () => null,
});
export const BodyDetailSidebar = lazy(() => import("./BodyDetailSidebar"));
export const OrbitAtlasHud = lazy(() => import("./OrbitAtlasHud"));
export const ScienceTelemetryPanel = lazy(() => import("./ScienceTelemetryPanel"));
export const OrbitAnalysisSheet = lazy(() => import("./OrbitAnalysisSheet"));
export const KerrBlackHolePanel = lazy(() => import("./KerrBlackHolePanel"));
export const EvidenceLedgerPanel = lazy(() => import("./EvidenceLedgerPanel"));
export const CelestialObjectPassportPanel = lazy(() => import("./CelestialObjectPassportPanel"));
export const AtlasNavigatorRuntimePanel = lazy(() => import("./AtlasNavigatorRuntimePanel"));
export const AtlasWorkflowPanel = lazy(() => import("./AtlasWorkflowPanel"));
export const AtlasMissionHubPanel = lazy(() => import("./AtlasMissionHubPanel"));
export const AtlasScientificReportPanel = lazy(() => import("./AtlasScientificReportPanel"));
export const AtlasValidationConsolePanel = lazy(() => import("./AtlasValidationConsolePanel"));
export const AtlasObservatoryDeckPanel = lazy(() => import("./AtlasObservatoryDeckPanel"));
export const RelativityObservableAtlasPanel = lazy(() => import("./RelativityObservableAtlasPanel"));
export const SceneLabPanel = lazy(() => import("./SceneLabPanel"));
export const ObservationalAstrophysicsLabPanel = lazy(
  () => import("./ObservationalAstrophysicsLabPanel"),
);
export const LaunchControlPanel = lazy(() => import("./LaunchControlPanel"));
export const LaunchTelemetryDock = lazy(() => import("./LaunchTelemetryDock"));
export const AtlasLaunchTelemetrySurface = lazy(() => import("./AtlasLaunchTelemetrySurface"));
export const AtlasRuntimePanelSurface = lazy(() => import("./AtlasRuntimePanelSurface"));
