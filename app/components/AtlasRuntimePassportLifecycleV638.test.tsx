import { Children, createElement, isValidElement, type ComponentProps, type ReactElement, type ReactNode, type SetStateAction } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { atlasRuntimeStore, type AtlasRuntimeStoreState } from "../lib/atlasRuntimeStore";
import { createCelestialObjectPassport } from "../lib/celestialCatalog";
import type { CelestialObjectPassport } from "../lib/simulationDiagnosticsTypes";
import { useAtlasFocusController, type AtlasFocusControllerOptions, type AtlasFocusControllerResult, type AtlasFocusControllerState } from "../lib/useAtlasFocusController";
import { useCelestialObjectPassportSessionV638, type CelestialObjectPassportSessionV638 } from "../lib/useCelestialObjectPassportSessionV638";
import AtlasRuntimePanelLayer from "./AtlasRuntimePanelLayer";
import { AtlasRuntimePanelSurface, CelestialObjectPassportPanel as LazyPassportPanel } from "./AtlasRuntimeWorkbenchLazySurfaces";
import CelestialObjectPassportPanel from "./CelestialObjectPassportPanel";

const hookState = vi.hoisted(() => ({
  values: [] as unknown[], cursor: 0, changed: false, captureEffects: false,
  effects: [] as Array<() => void | (() => void)>,
}));
vi.mock("react", async (original) => {
  const react = await original<typeof import("react")>();
  return {
  ...react,
  useEffect: (effect: () => void | (() => void), dependencies: readonly unknown[]) => {
    if (hookState.captureEffects) hookState.effects.push(effect);
    else react.useEffect(effect, dependencies);
  },
  useState: <T,>(initial: T | (() => T)) => {
    const index = hookState.cursor++;
    if (!(index in hookState.values)) hookState.values[index] = typeof initial === "function" ? (initial as () => T)() : initial;
    const setValue = (next: SetStateAction<T>) => {
      const previous = hookState.values[index] as T;
      const value = typeof next === "function" ? (next as (value: T) => T)(previous) : next;
      hookState.changed ||= !Object.is(previous, value);
      hookState.values[index] = value;
    };
    return [hookState.values[index] as T, setValue] as const;
  },
  };
});
vi.mock("../lib/atlasRuntimeStore", async (original) => {
  const runtime = await original<typeof import("../lib/atlasRuntimeStore")>();
  return {
    ...runtime,
    useAtlasRuntimeStore: <T,>(selector: (snapshot: AtlasRuntimeStoreState) => T) => selector(runtime.atlasRuntimeStore.getSnapshot()),
  };
});

function session(selectedId: string, suppliedPassport: CelestialObjectPassport | null = null) {
  let result: CelestialObjectPassportSessionV638 | undefined;
  function Harness() {
    result = useCelestialObjectPassportSessionV638(selectedId, suppliedPassport);
    return null;
  }
  for (let attempt = 0; attempt < 3; attempt += 1) {
    hookState.cursor = 0;
    hookState.changed = false;
    hookState.captureEffects = true;
    renderToStaticMarkup(createElement(Harness));
    hookState.captureEffects = false;
    for (const effect of hookState.effects.splice(0)) effect();
    if (!hookState.changed) return result!;
  }
  throw new Error("Passport selection failed to settle");
}

function createFocusHarness() {
  const state: AtlasFocusControllerState = {
    selectedBodyIndex: null, selectedCelestialCatalogId: "", selectedStellarSearchDocument: null,
    selectedExoplanetSystemId: "", cameraBodyFocusRequest: null,
  };
  const setter = <K extends keyof AtlasFocusControllerState>(key: K) => (next: SetStateAction<AtlasFocusControllerState[K]>) => {
    state[key] = typeof next === "function" ? next(state[key]) : next;
  };
  const noop = () => undefined;
  const selectedIdWrites = vi.fn(setter("selectedCelestialCatalogId"));
  const options: AtlasFocusControllerOptions = {
    state,
    setters: {
      setSelectedBodyIndex: setter("selectedBodyIndex"), setSelectedCelestialCatalogId: selectedIdWrites,
      setSelectedStellarSearchDocument: setter("selectedStellarSearchDocument"),
      setSelectedExoplanetSystemId: setter("selectedExoplanetSystemId"),
      setCameraBodyFocusRequest: setter("cameraBodyFocusRequest"), setEarthMoonView: noop,
    },
    orbitAtlas: true, gaiaIndexBySourceId: new Map(), hasForegroundPanel: false,
    escapeHandledByCoordinator: true, closeOrbitAnalysis: noop, openSearch: noop,
    navigation: {
      closeNavigator: noop, recordNavigatorItem: noop, openEvidenceClaim: noop, openMissionHub: noop,
      openObservatoryDeck: noop, openScientificReport: noop, openValidationConsole: noop,
      openRelativityObservables: noop, openObservationalAstrophysics: noop, openWorkflow: noop,
      openKerrLab: noop, openOrbitAnalysis: noop, openObjectBrowser: noop, openViewPanel: noop, openToolsPanel: noop,
    },
  };
  let controller: AtlasFocusControllerResult | undefined;
  function Harness() { controller = useAtlasFocusController(options); return null; }
  renderToStaticMarkup(createElement(Harness));
  const evidenceOpen = vi.fn();
  const evidenceClaim = vi.fn();
  const setViewSettings = vi.fn();
  const layer = (isMobileViewport = false, launchRuntimeActive = false, showKerrBlackHole = false) => {
    const passportSession = session(state.selectedCelestialCatalogId);
    const props = {
      passportSession,
      scene: { orbitAtlas: true, presentation: {} },
      shellHud: { viewSettings: { showKerrBlackHole }, setViewSettings },
      panels: { panelSurfaceActivated: false, isMobileViewport, ATLAS_RUNTIME_MODAL_PANEL_IDS: [], deferredEvidenceModules: {} },
      navigationFocus: {
        ...state, ...controller, selectedBodyIndex: null, setSelectedCelestialCatalogId: selectedIdWrites,
      },
      evidenceMission: { setEvidenceLedgerOpen: evidenceOpen, setEvidenceInitialClaimId: evidenceClaim },
      launch: { launchRuntimeActive },
      timelinePhysics: {},
    } as unknown as ComponentProps<typeof AtlasRuntimePanelLayer>;
    return { tree: AtlasRuntimePanelLayer(props), passportSession, mobileToolsHidden: isMobileViewport && passportSession.isOpen };
  };
  return { state, controller: controller!, selectedIdWrites, layer, evidenceOpen, evidenceClaim, setViewSettings };
}

type NodeProps = {
  children?: ReactNode; onClose?: () => void; onClick?: () => void; onUnhandledEscape?: () => void;
  onExitFocus?: () => void; onOpenEvidenceLedger?: () => void; onSelectRelatedObject?: (id: string) => void;
  passport?: CelestialObjectPassport; "aria-label"?: string; viewportMode?: string;
};
function find(tree: ReactNode, predicate: (element: ReactElement<NodeProps>) => boolean): ReactElement<NodeProps> | undefined {
  for (const child of Children.toArray(tree)) {
    if (!isValidElement<NodeProps>(child)) continue;
    if (predicate(child)) return child;
    const nested = find(child.props.children, predicate);
    if (nested) return nested;
  }
  return undefined;
}
const passportIn = (tree: ReactNode) => find(tree, (element) => element.type === LazyPassportPanel);
const buttonIn = (tree: ReactNode, label: string) => find(tree, (element) => element.type === "button" && element.props["aria-label"] === label);
const panelSurfaceIn = (tree: ReactNode) => find(tree, (element) => element.type === AtlasRuntimePanelSurface);

beforeEach(() => {
  hookState.values.length = 0;
  hookState.cursor = 0;
  hookState.changed = false;
  hookState.captureEffects = false;
  hookState.effects.length = 0;
  atlasRuntimeStore.resetFocus();
  atlasRuntimeStore.setScaleBand("solar");
  vi.stubGlobal("window", Object.assign(new EventTarget(), {
    location: { href: "http://localhost/atlas" },
  }));
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  atlasRuntimeStore.resetFocus();
  atlasRuntimeStore.setScaleBand("solar");
});

describe("B2 passport visibility and real focus lifecycle", () => {
  it.each([false, true])("closes M42 without changing its selected identity, focus command or borrowed scale (mobile=%s)", (mobile) => {
    const test = createFocusHarness();
    test.controller.requestCatalogObjectFocus("nebula:m42", "object-browser");
    const before = atlasRuntimeStore.getSnapshot();
    expect(before).toMatchObject({ scaleBand: "stellar", selectedObjectId: "nebula:m42" });
    test.selectedIdWrites.mockClear();
    const open = test.layer(mobile);
    expect(open.mobileToolsHidden).toBe(mobile);
    expect(panelSurfaceIn(open.tree)?.props.viewportMode).toBe(mobile ? "mobile" : "desktop");
    passportIn(open.tree)?.props.onClose?.();
    const closed = test.layer(mobile);
    expect(closed.passportSession.isOpen).toBe(false);
    expect(closed.mobileToolsHidden).toBe(false);
    expect(passportIn(closed.tree)).toBeUndefined();
    expect(buttonIn(closed.tree, "打开天体档案")).toBeDefined();
    expect(test.state.selectedCelestialCatalogId).toBe("nebula:m42");
    expect(test.selectedIdWrites).not.toHaveBeenCalled();
    expect(atlasRuntimeStore.getSnapshot()).toBe(before);
  });

  it("reopens the same archive without issuing a second focus request", () => {
    const test = createFocusHarness(); test.controller.requestCatalogObjectFocus("nebula:m42");
    const before = atlasRuntimeStore.getSnapshot();
    passportIn(test.layer().tree)?.props.onClose?.();
    buttonIn(test.layer().tree, "打开天体档案")?.props.onClick?.();
    expect(passportIn(test.layer().tree)?.props.passport?.objectId).toBe("nebula:m42");
    expect(atlasRuntimeStore.getSnapshot()).toBe(before);
  });

  it.each([false, true])("exits focus from either the expanded or collapsed archive (collapsed=%s)", (collapsed) => {
    const test = createFocusHarness(); test.controller.requestCatalogObjectFocus("nebula:m42");
    if (collapsed) passportIn(test.layer().tree)?.props.onClose?.();
    const tree = test.layer().tree;
    if (collapsed) buttonIn(tree, "退出聚焦")?.props.onClick?.();
    else passportIn(tree)?.props.onExitFocus?.();
    expect(test.state.selectedCelestialCatalogId).toBe("");
    expect(atlasRuntimeStore.getSnapshot()).toMatchObject({ scaleBand: "solar", selectedObjectId: "", focusCommand: null });
    expect(test.layer().tree).toBeNull();
  });

  it("treats the first Escape as archive dismissal and the next as focus exit", () => {
    const test = createFocusHarness(); test.controller.requestCatalogObjectFocus("nebula:m42");
    const before = atlasRuntimeStore.getSnapshot();
    panelSurfaceIn(test.layer().tree)?.props.onUnhandledEscape?.();
    expect(test.layer().passportSession.isOpen).toBe(false);
    expect(atlasRuntimeStore.getSnapshot()).toBe(before);
    panelSurfaceIn(test.layer().tree)?.props.onUnhandledEscape?.();
    expect(test.state.selectedCelestialCatalogId).toBe("");
    expect(atlasRuntimeStore.getSnapshot().scaleBand).toBe("solar");
  });

  it("opens a newly selected object after dismissal and renders its actual passport", () => {
    const test = createFocusHarness(); test.controller.requestCatalogObjectFocus("nebula:m42");
    passportIn(test.layer().tree)?.props.onClose?.();
    test.controller.requestCatalogObjectFocus("constellation:Ori", "object-browser");
    const next = passportIn(test.layer().tree);
    expect(next?.props.passport?.objectId).toBe("constellation:Ori");
    expect(atlasRuntimeStore.getSnapshot().scaleBand).toBe("stellar");
    next?.props.onSelectRelatedObject?.("nearby-star:betelgeuse");
    expect(passportIn(test.layer().tree)?.props.passport?.objectId).toBe("nearby-star:betelgeuse");
    expect(atlasRuntimeStore.getSnapshot().focusCommand?.source).toBe("object-browser");
  });

  it("reopens a dismissed object when the user deliberately selects that same object again", () => {
    const test = createFocusHarness(); test.controller.requestCatalogObjectFocus("nebula:m42");
    passportIn(test.layer().tree)?.props.onClose?.();
    expect(test.layer().passportSession.isOpen).toBe(false);
    const request = atlasRuntimeStore.getSnapshot().focusRequestId;
    test.controller.requestCatalogObjectFocus("nebula:m42", "object-browser");
    expect(atlasRuntimeStore.getSnapshot().focusRequestId).toBe(request + 1);
    expect(test.layer().passportSession.isOpen).toBe(true);
  });

  it("keeps dismissal through focus phase changes and manual scale changes", () => {
    const test = createFocusHarness(); test.controller.requestCatalogObjectFocus("nebula:m42");
    passportIn(test.layer().tree)?.props.onClose?.();
    atlasRuntimeStore.setFocusTransition("locked");
    atlasRuntimeStore.setScaleBand("galactic");
    expect(test.layer().passportSession.isOpen).toBe(false);
    buttonIn(test.layer().tree, "退出聚焦")?.props.onClick?.();
    expect(atlasRuntimeStore.getSnapshot().scaleBand).toBe("galactic");
  });

  it("does not let a stale close callback hide the subsequent target", () => {
    const test = createFocusHarness(); test.controller.requestCatalogObjectFocus("nebula:m42");
    const staleClose = passportIn(test.layer().tree)?.props.onClose;
    test.controller.requestCatalogObjectFocus("constellation:Ori");
    test.layer(); staleClose?.();
    expect(test.layer().passportSession).toMatchObject({ isOpen: true, passport: { objectId: "constellation:Ori" } });
  });

  it("keeps the evidence action available without clearing or admitting the selected object", () => {
    const test = createFocusHarness(); test.controller.requestCatalogObjectFocus("nebula:m42");
    const before = atlasRuntimeStore.getSnapshot();
    passportIn(test.layer().tree)?.props.onOpenEvidenceLedger?.();
    expect(test.evidenceClaim).toHaveBeenCalledExactlyOnceWith("celestial-catalog-atlas");
    expect(test.evidenceOpen).toHaveBeenCalledExactlyOnceWith(true);
    expect(atlasRuntimeStore.getSnapshot()).toBe(before);
  });

  it("keeps launch suppression and the existing Kerr-close priority after archive dismissal", () => {
    const test = createFocusHarness(); test.controller.requestCatalogObjectFocus("nebula:m42");
    expect(test.layer(false, true).tree).toBeNull();
    passportIn(test.layer().tree)?.props.onClose?.();
    const before = atlasRuntimeStore.getSnapshot();
    panelSurfaceIn(test.layer(false, false, true).tree)?.props.onUnhandledEscape?.();
    expect(test.setViewSettings).toHaveBeenCalledOnce();
    expect(atlasRuntimeStore.getSnapshot()).toBe(before);
  });
});

describe("passport availability and alias isolation", () => {
  it("resolves a presentation alias while preserving the actual selected identity", () => {
    const result = session("stellar-hero:alpha-centauri-a");
    expect(result).toMatchObject({ isOpen: true, passport: { objectId: "nearby-star:alpha-centauri" } });
    result.dismiss();
    expect(session("stellar-hero:alpha-centauri-a").isOpen).toBe(false);
  });

  it("uses a matching supplied passport without promoting or rewriting its contents", () => {
    const passport = createCelestialObjectPassport("nebula:m42")!;
    const before = JSON.stringify(passport);
    expect(session("nebula:m42", passport).passport).toBe(passport);
    session("nebula:m42", passport).dismiss(); session("nebula:m42", passport).reopen();
    expect(JSON.stringify(passport)).toBe(before);
  });

  it("rejects a stale supplied passport after selection changes", () => {
    const stale = createCelestialObjectPassport("nebula:m42");
    expect(session("constellation:Ori", stale)).toMatchObject({ isOpen: true, passport: { objectId: "constellation:Ori" } });
  });

  it.each(["", "nebula:unavailable-object"])("does not expose a stale archive for %j", (id) => {
    const result = session(id, createCelestialObjectPassport("nebula:m42"));
    expect(result).toMatchObject({ isOpen: false, passport: null });
    result.dismiss(); result.reopen();
    expect(session(id).isOpen).toBe(false);
  });

  it("resets dismissal across an empty selection even without a new focus command", () => {
    session("nebula:m42").dismiss();
    expect(session("nebula:m42").isOpen).toBe(false);
    expect(session("").isOpen).toBe(false);
    expect(session("nebula:m42").isOpen).toBe(true);
  });

  it("renders separately named close and exit controls with a stable reopen target", () => {
    hookState.values.length = 0;
    const html = renderToStaticMarkup(createElement(CelestialObjectPassportPanel, {
      passport: createCelestialObjectPassport("nebula:m42"), onClose() {}, onExitFocus() {},
    }));
    expect(html).toContain('id="atlas-celestial-object-passport"');
    expect(html).toContain('aria-label="关闭天体档案"');
    expect(html).toContain('aria-label="退出聚焦"');
  });
});
