import { createElement, type SetStateAction } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { atlasRuntimeStore } from "./atlasRuntimeStore";
import { useAtlasWorkbenchFocusDomain, type AtlasWorkbenchFocusDomainOptions } from "./useAtlasWorkbenchFocusDomain";
import type { AtlasFocusControllerResult, AtlasFocusControllerState } from "./useAtlasFocusController";

const effects = vi.hoisted(() => [] as Array<() => void | (() => void)>);
vi.mock("react", async (original) => ({
  ...await original<typeof import("react")>(),
  useEffect: (effect: () => void | (() => void)) => { effects.push(effect); },
}));
const cleanups: Array<() => void> = [];

function mount(selectedCatalogId: string, panelSurfaceActivated: boolean) {
  const state: AtlasFocusControllerState = {
    selectedBodyIndex: null, selectedCelestialCatalogId: selectedCatalogId, selectedStellarSearchDocument: null,
    selectedExoplanetSystemId: "", cameraBodyFocusRequest: null,
  };
  const setter = <K extends keyof AtlasFocusControllerState>(key: K) => (next: SetStateAction<AtlasFocusControllerState[K]>) => {
    state[key] = typeof next === "function" ? next(state[key]) : next;
  };
  const noop = () => undefined;
  const selectedWrites = vi.fn(setter("selectedCelestialCatalogId"));
  const options: AtlasWorkbenchFocusDomainOptions = {
    ...state, panelSurfaceActivated, orbitAtlas: true, atlasWorkbenchOpen: false, gaiaIndexBySourceId: new Map(),
    setSelectedBodyIndex: setter("selectedBodyIndex"), setSelectedCelestialCatalogId: selectedWrites,
    setSelectedStellarSearchDocument: setter("selectedStellarSearchDocument"),
    setSelectedExoplanetSystemId: setter("selectedExoplanetSystemId"),
    setCameraBodyFocusRequest: setter("cameraBodyFocusRequest"), setEarthMoonView: noop,
    closeOrbitAnalysis: noop, openSearch: noop,
    navigation: {
      closeNavigator: noop, recordNavigatorItem: noop, openEvidenceClaim: noop, openMissionHub: noop,
      openObservatoryDeck: noop, openScientificReport: noop, openValidationConsole: noop,
      openRelativityObservables: noop, openObservationalAstrophysics: noop, openWorkflow: noop,
      openKerrLab: noop, openOrbitAnalysis: noop, openObjectBrowser: noop, openViewPanel: noop, openToolsPanel: noop,
    },
  };
  let controller: AtlasFocusControllerResult | undefined;
  function Harness() { controller = useAtlasWorkbenchFocusDomain(options); return null; }
  renderToStaticMarkup(createElement(Harness));
  for (const effect of effects.splice(0)) {
    const cleanup = effect(); if (cleanup) cleanups.push(cleanup);
  }
  return { controller: controller!, state, selectedWrites };
}

beforeEach(() => {
  atlasRuntimeStore.resetFocus(); atlasRuntimeStore.setScaleBand("solar");
  effects.length = 0;
  vi.stubGlobal("window", Object.assign(new EventTarget(), {
    location: { href: "http://localhost/atlas" }, history: { replaceState: vi.fn() },
    matches: () => false, closest: () => null,
  }));
});
afterEach(() => {
  while (cleanups.length) cleanups.pop()?.();
  vi.unstubAllGlobals(); vi.restoreAllMocks();
  atlasRuntimeStore.resetFocus(); atlasRuntimeStore.setScaleBand("solar");
});
const escape = () => window.dispatchEvent(Object.assign(new Event("keydown"), { key: "Escape", ctrlKey: false, metaKey: false }));

describe("passport Escape ownership in the actual workbench focus domain", () => {
  it.each([
    { selectedCatalogId: "nebula:m42", activated: false },
    { selectedCatalogId: "constellation:Ori", activated: false },
    { selectedCatalogId: "nearby-star:sirius", activated: true },
  ])("delegates Escape for $selectedCatalogId even when panel activation is $activated", ({ selectedCatalogId, activated }) => {
    const test = mount(selectedCatalogId, activated);
    test.controller.requestCatalogObjectFocus(selectedCatalogId);
    test.selectedWrites.mockClear();
    const before = atlasRuntimeStore.getSnapshot();
    escape();
    expect(test.selectedWrites).not.toHaveBeenCalled();
    expect(test.state.selectedCelestialCatalogId).toBe(selectedCatalogId);
    expect(atlasRuntimeStore.getSnapshot()).toBe(before);
  });

  it("retains ordinary Escape-to-origin when there is no mounted panel coordinator", () => {
    const test = mount("", false);
    test.controller.requestBodyFocus(3, "inspect", "object-browser");
    expect(atlasRuntimeStore.getSnapshot().focusCommand).not.toBeNull();
    test.selectedWrites.mockClear();
    escape();
    expect(test.selectedWrites).toHaveBeenCalledExactlyOnceWith("");
    expect(test.state.selectedBodyIndex).toBeNull();
    expect(atlasRuntimeStore.getSnapshot()).toMatchObject({ focusCommand: null, selectedObjectId: "" });
  });

  it("still delegates Escape for an activated coordinator with no catalog selection", () => {
    const test = mount("", true);
    test.controller.requestBodyFocus(3, "inspect", "object-browser");
    test.selectedWrites.mockClear();
    const before = atlasRuntimeStore.getSnapshot(); escape();
    expect(test.selectedWrites).not.toHaveBeenCalled();
    expect(atlasRuntimeStore.getSnapshot()).toBe(before);
  });
});
