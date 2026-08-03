"use client";

import { useCallback, useEffect, useState } from "react";

import type {
  OrbitAtlasRenderBudget,
  OrbitAtlasScaleMode,
  SolarPresentationMode,
} from "./orbitAtlasPresentation";

type UseAtlasWorkbenchReadinessDomainArgs = {
  orbitAtlas: boolean;
  presentationMode: SolarPresentationMode;
  scaleMode: OrbitAtlasScaleMode;
  renderBudget: OrbitAtlasRenderBudget;
  managedPanelOpen: boolean;
};

export function useAtlasWorkbenchReadinessDomain({
  orbitAtlas,
  presentationMode,
  scaleMode,
  renderBudget,
  managedPanelOpen,
}: UseAtlasWorkbenchReadinessDomainArgs) {
  const [canvasReady, setCanvasReady] = useState(false);
  const [skyReady, setSkyReady] = useState(false);
  const [coreBodiesReady, setCoreBodiesReady] = useState(false);
  const [atlasReadinessFallback, setAtlasReadinessFallback] = useState(false);
  const [panelSurfaceActivated, setPanelSurfaceActivated] = useState(false);

  const atlasReady = orbitAtlas
    ? canvasReady && (atlasReadinessFallback || (skyReady && coreBodiesReady))
    : canvasReady && skyReady && coreBodiesReady;

  useEffect(() => {
    if (managedPanelOpen) setPanelSurfaceActivated(true);
  }, [managedPanelOpen]);

  useEffect(() => {
    if (!orbitAtlas) {
      setAtlasReadinessFallback(false);
      return;
    }
    setAtlasReadinessFallback(false);
    const timeoutId = window.setTimeout(() => setAtlasReadinessFallback(true), 6000);
    return () => window.clearTimeout(timeoutId);
  }, [orbitAtlas, presentationMode, scaleMode, renderBudget]);

  const handleCanvasReady = useCallback(() => setCanvasReady(true), []);
  const handleCoreBodiesReady = useCallback(() => setCoreBodiesReady(true), []);

  return {
    atlasReady,
    canvasReady,
    skyReady,
    coreBodiesReady,
    atlasReadinessFallback,
    panelSurfaceActivated,
    handleCanvasReady,
    setSkyReady,
    handleCoreBodiesReady,
  };
}
