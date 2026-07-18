"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  OrbitAtlasRenderBudget,
  OrbitAtlasScaleMode,
  SolarPresentationMode,
} from "./orbitAtlasPresentation";

const STORAGE_KEY = "solar.presentation.v1";

type StoredPresentation = {
  presentationMode?: SolarPresentationMode;
  scaleMode?: OrbitAtlasScaleMode;
  renderBudget?: OrbitAtlasRenderBudget;
};

function presentationFromQuery(value: string | null): SolarPresentationMode | null {
  if (value === "sandbox") return "sandbox";
  if (value === "orbitAtlas" || value === "orbit-atlas") return "orbit-atlas";
  return null;
}

function scaleFromQuery(value: string | null): OrbitAtlasScaleMode | null {
  return value === "physical" || value === "compressed" ? value : null;
}

function budgetFromQuery(value: string | null): OrbitAtlasRenderBudget | null {
  return value === "dense" || value === "balanced" ? value : null;
}

function readStoredPresentation(): StoredPresentation {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as StoredPresentation;
  } catch {
    return {};
  }
}

export function useSolarPresentation() {
  const [presentationMode, setPresentationModeState] =
    useState<SolarPresentationMode>("orbit-atlas");
  const [scaleMode, setScaleModeState] =
    useState<OrbitAtlasScaleMode>("compressed");
  const [renderBudget, setRenderBudgetState] =
    useState<OrbitAtlasRenderBudget>("balanced");

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const stored = readStoredPresentation();
    setPresentationModeState(
      presentationFromQuery(query.get("presentation")) ??
        stored.presentationMode ??
        "orbit-atlas",
    );
    setScaleModeState(
      scaleFromQuery(query.get("scale")) ?? stored.scaleMode ?? "compressed",
    );
    setRenderBudgetState(
      budgetFromQuery(query.get("budget")) ?? stored.renderBudget ?? "balanced",
    );
  }, []);

  const persist = useCallback((next: StoredPresentation) => {
    const current = readStoredPresentation();
    const merged = { ...current, ...next };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    const query = new URLSearchParams(window.location.search);
    query.set(
      "presentation",
      merged.presentationMode === "sandbox" ? "sandbox" : "orbitAtlas",
    );
    query.set("scale", merged.scaleMode ?? "compressed");
    query.set("budget", merged.renderBudget ?? "balanced");
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}?${query}${window.location.hash}`,
    );
  }, []);

  const setPresentationMode = useCallback(
    (next: SolarPresentationMode) => {
      setPresentationModeState(next);
      persist({ presentationMode: next, scaleMode, renderBudget });
    },
    [persist, renderBudget, scaleMode],
  );
  const setScaleMode = useCallback(
    (next: OrbitAtlasScaleMode) => {
      setScaleModeState(next);
      persist({ presentationMode, scaleMode: next, renderBudget });
    },
    [persist, presentationMode, renderBudget],
  );
  const setRenderBudget = useCallback(
    (next: OrbitAtlasRenderBudget) => {
      setRenderBudgetState(next);
      persist({ presentationMode, scaleMode, renderBudget: next });
    },
    [persist, presentationMode, scaleMode],
  );

  return {
    presentationMode,
    scaleMode,
    renderBudget,
    setPresentationMode,
    setScaleMode,
    setRenderBudget,
  };
}
