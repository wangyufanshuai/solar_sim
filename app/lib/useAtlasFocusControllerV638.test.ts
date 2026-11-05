import { createElement, type SetStateAction } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EARTH_BODY_INDEX } from "../data/planetsJ2000";
import { atlasRuntimeStore } from "./atlasRuntimeStore";
import { clearAtlasStellarSearchRuntimeForTests, publishAtlasStellarSearchResults } from "./atlasStellarSearchRuntime";
import { CAMERA_FOCUS_DIRECTION_EVENT, CAMERA_FOCUS_EARTH_MOON_EVENT, type CameraFocusDirectionDetail } from "./camera-bridge";
import { stellarDocumentToGaiaIndex, type StellarSearchDocument } from "./stellarSearchCatalog";
import {
  useAtlasFocusController,
  type AtlasFocusControllerOptions,
  type AtlasFocusControllerResult,
  type AtlasFocusControllerState,
} from "./useAtlasFocusController";

const effects = vi.hoisted(() => [] as Array<() => void | (() => void)>);
vi.mock("react", async (importOriginal) => {
  const react = await importOriginal<typeof import("react")>();
  return {
    ...react,
    // SSR runs the real hooks; explicitly drive effects without a browser renderer.
    useEffect: (effect: () => void | (() => void)) => { effects.push(effect); },
  };
});

const unmounts: Array<() => void> = [];
const searchDocument: StellarSearchDocument = {
  sourceId: "5853498713190525696", designation: "Gaia DR3 5853498713190525696",
  displayName: "Test star", aliases: [], raDeg: 219.9, decDeg: -60.8,
  parallaxMas: 747, magG: 0.1, bpRp: 0.8, ruwe: null, teffK: 5800,
  logg: null, radiusSolar: null, variable: false, source: "gaia-dr3",
};

function mountController() {
  const state: AtlasFocusControllerState = {
    selectedBodyIndex: null, selectedCelestialCatalogId: "",
    selectedStellarSearchDocument: null, selectedExoplanetSystemId: "",
    cameraBodyFocusRequest: null,
  };
  let earthMoonView = false;
  const setter = <K extends keyof AtlasFocusControllerState>(key: K) => (
    value: SetStateAction<AtlasFocusControllerState[K]>,
  ) => {
    state[key] = typeof value === "function" ? value(state[key]) : value;
  };
  const noop = () => undefined;
  const options: AtlasFocusControllerOptions = {
    state,
    setters: {
      setSelectedBodyIndex: setter("selectedBodyIndex"),
      setSelectedCelestialCatalogId: setter("selectedCelestialCatalogId"),
      setSelectedStellarSearchDocument: setter("selectedStellarSearchDocument"),
      setSelectedExoplanetSystemId: setter("selectedExoplanetSystemId"),
      setCameraBodyFocusRequest: setter("cameraBodyFocusRequest"),
      setEarthMoonView: (value) => { earthMoonView = typeof value === "function" ? value(earthMoonView) : value; },
    },
    gaiaIndexBySourceId: new Map(), orbitAtlas: true, hasForegroundPanel: false,
    closeOrbitAnalysis: noop, openSearch: noop,
    navigation: {
      closeNavigator: noop, recordNavigatorItem: noop, openEvidenceClaim: noop,
      openMissionHub: noop, openObservatoryDeck: noop, openScientificReport: noop,
      openValidationConsole: noop, openRelativityObservables: noop,
      openObservationalAstrophysics: noop, openWorkflow: noop, openKerrLab: noop,
      openOrbitAnalysis: noop, openObjectBrowser: noop, openViewPanel: noop, openToolsPanel: noop,
    },
  };
  let controller: AtlasFocusControllerResult | undefined;
  function Harness() {
    controller = useAtlasFocusController(options);
    return null;
  }
  renderToStaticMarkup(createElement(Harness));
  const cleanups = effects.splice(0).map((effect) => effect());
  const unmount = () => {
    while (cleanups.length) cleanups.pop()?.();
  };
  unmounts.push(unmount);
  return { controller: controller!, state, unmount, get earthMoonView() { return earthMoonView; } };
}

beforeEach(() => {
  atlasRuntimeStore.resetFocus();
  atlasRuntimeStore.setScaleBand("solar");
  effects.length = 0;
  vi.stubGlobal("window", Object.assign(new EventTarget(), {
    location: { href: "http://localhost/atlas" },
    history: { replaceState: vi.fn() },
  }));
});

afterEach(() => {
  while (unmounts.length) unmounts.pop()?.();
  effects.length = 0;
  vi.unstubAllGlobals();
  clearAtlasStellarSearchRuntimeForTests();
  atlasRuntimeStore.resetFocus();
  atlasRuntimeStore.setScaleBand("solar");
});

describe("focus controller v638 with the real runtime store and controlled effects", () => {
  it("retires the DOM focus receipt on exit while retaining the dispatch sequence", () => {
    const root = { dataset: {} as DOMStringMap };
    vi.stubGlobal("document", { querySelector: vi.fn(() => root) });
    const test = mountController();

    test.controller.requestCatalogObjectFocus("nebula:m42", "object-browser");
    expect(root.dataset).toMatchObject({
      atlasFocusCommandSequence: "1",
      atlasFocusCommandState: "active",
      atlasFocusCommandKind: "catalog-object",
      atlasFocusCommandObjectId: "nebula:m42",
      atlasFocusCommandSource: "object-browser",
    });

    test.controller.clearFocusLock();
    expect(atlasRuntimeStore.getSnapshot().focusCommand).toBeNull();
    expect(root.dataset).toMatchObject({ atlasFocusCommandSequence: "1", atlasFocusCommandState: "idle" });
    expect(root.dataset.atlasFocusCommandObjectId).toBeUndefined();
    expect(root.dataset.atlasFocusCommandKind).toBeUndefined();
    expect(root.dataset.atlasFocusCommandSource).toBeUndefined();
    expect(root.dataset.atlasFocusCommandDurationMs).toBeUndefined();

    test.controller.requestCatalogObjectFocus("constellation:Ori", "navigator");
    expect(root.dataset).toMatchObject({
      atlasFocusCommandSequence: "2",
      atlasFocusCommandState: "active",
      atlasFocusCommandObjectId: "constellation:Ori",
      atlasFocusCommandSource: "navigator",
    });
  });

  it("retires the receipt through Earth-Moon and direct store reset paths", () => {
    const root = { dataset: {} as DOMStringMap };
    vi.stubGlobal("document", { querySelector: vi.fn(() => root) });
    const test = mountController();

    test.controller.requestCatalogObjectFocus("nebula:m42");
    test.controller.focusEarthMoon();
    expect(root.dataset.atlasFocusCommandState).toBe("idle");
    expect(root.dataset.atlasFocusCommandObjectId).toBeUndefined();

    test.controller.requestCatalogObjectFocus("nebula:m42");
    atlasRuntimeStore.resetFocus();
    expect(root.dataset.atlasFocusCommandState).toBe("idle");
    expect(root.dataset.atlasFocusCommandObjectId).toBeUndefined();
    expect(root.dataset.atlasFocusCommandSequence).toBe("2");
  });

  it("binds constellation identity to the camera request without leaking it into a subsequent star request", () => {
    const test = mountController();
    const requests: CameraFocusDirectionDetail[] = [];
    window.addEventListener(CAMERA_FOCUS_DIRECTION_EVENT, (event) => requests.push((event as CustomEvent<CameraFocusDirectionDetail>).detail));
    test.controller.requestCatalogObjectFocus("constellation:Ori");
    test.controller.onNearbyStarFocus([1, 0, 0], "stellar-hero:alpha-centauri-a");
    expect(requests).toHaveLength(2);
    expect(requests[0].constellationCatalogId).toBe("constellation:Ori");
    expect(requests[1].constellationCatalogId).toBeUndefined();
  });
  it("mounts against the real store API, focuses a star and restores the borrowed scale", () => {
    const test = mountController();
    const beforeRevision = atlasRuntimeStore.getSnapshot().sceneRevision;
    test.controller.onNearbyStarFocus([1, 0, 0], "stellar-hero:alpha-centauri-a");
    expect(atlasRuntimeStore.getSnapshot()).toMatchObject({
      scaleBand: "stellar", selectedObjectId: "stellar-hero:alpha-centauri-a",
      sceneRevision: beforeRevision,
    });
    test.controller.clearFocusLock();
    expect(atlasRuntimeStore.getSnapshot()).toMatchObject({ scaleBand: "solar", selectedObjectId: "", focusCommand: null });
    expect(test.state.selectedCelestialCatalogId).toBe("");
  });

  it("clears the previous sky selection and returns its scale before dispatching Earth-Moon focus", () => {
    const test = mountController();
    publishAtlasStellarSearchResults([{ document: searchDocument, matchKind: "exact-id", score: 1 }]);
    test.controller.requestGaiaStarFocus(stellarDocumentToGaiaIndex(searchDocument));
    expect(test.state.selectedStellarSearchDocument).toBe(searchDocument);
    expect(atlasRuntimeStore.getSnapshot().scaleBand).toBe("stellar");
    test.state.selectedExoplanetSystemId = "previous-system";
    test.state.cameraBodyFocusRequest = { bodyIndex: 0, mode: "lock", nonce: 2 };
    const dispatched: unknown[] = [];
    window.addEventListener(CAMERA_FOCUS_EARTH_MOON_EVENT, () => {
      dispatched.push({ ...test.state, scaleBand: atlasRuntimeStore.getSnapshot().scaleBand, earthMoonView: test.earthMoonView });
    });
    test.controller.focusEarthMoon();
    expect(dispatched).toEqual([{
      selectedBodyIndex: EARTH_BODY_INDEX, selectedCelestialCatalogId: "",
      selectedStellarSearchDocument: null, selectedExoplanetSystemId: "",
      cameraBodyFocusRequest: null, scaleBand: "solar", earthMoonView: true,
    }]);
    expect(atlasRuntimeStore.getSnapshot()).toMatchObject({ selectedObjectId: "", focusCommand: null });
  });

  it("preserves a later manual scale when entering Earth-Moon focus", () => {
    const test = mountController();
    test.controller.onNearbyStarFocus([1, 0, 0], "stellar-hero:alpha-centauri-a");
    atlasRuntimeStore.setScaleBand("galactic");
    const manualJourney = atlasRuntimeStore.getSnapshot().scaleJourney;
    test.controller.focusEarthMoon();
    expect(atlasRuntimeStore.getSnapshot().scaleBand).toBe("galactic");
    expect(atlasRuntimeStore.getSnapshot().scaleJourney).toBe(manualJourney);
    expect(test.state.selectedCelestialCatalogId).toBe("");
  });

  it("returns an owned scale on unmount, including repeated cleanup", () => {
    const test = mountController();
    test.controller.onNearbyStarFocus([1, 0, 0], "stellar-hero:alpha-centauri-a");
    test.unmount();
    expect(atlasRuntimeStore.getSnapshot().scaleBand).toBe("solar");
    const restoredJourney = atlasRuntimeStore.getSnapshot().scaleJourney;
    test.unmount();
    expect(atlasRuntimeStore.getSnapshot().scaleJourney).toBe(restoredJourney);
  });

  it.each(["transition", "completed", "same-band"] as const)("does not undo a manual %s scale choice on unmount", (choice) => {
    const test = mountController();
    test.controller.onNearbyStarFocus([1, 0, 0], "stellar-hero:alpha-centauri-a");
    if (choice === "same-band") atlasRuntimeStore.setScaleBand("stellar");
    else {
      const journey = atlasRuntimeStore.requestScaleJourney("galactic", 100, true);
      if (choice === "completed") atlasRuntimeStore.completeScaleJourneyStep(journey.requestId, 100);
    }
    const manual = atlasRuntimeStore.getSnapshot();
    test.unmount();
    expect(atlasRuntimeStore.getSnapshot()).toBe(manual);
  });
});
