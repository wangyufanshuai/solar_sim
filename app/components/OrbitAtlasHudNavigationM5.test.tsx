import { Children, isValidElement, type ComponentProps, type ReactElement, type ReactNode, type SetStateAction } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AtlasRuntimeStoreState } from "../lib/atlasRuntimeStore";
import { DEFAULT_SIMULATION_VIEW_SETTINGS } from "../lib/simulationViewSettings";
import OrbitAtlasHud from "./OrbitAtlasHud";

// A render/effect harness exercises component event handlers and their next render;
// actual keyboard dispatch, layout and pointer hit testing remain browser checks.
const fixture = vi.hoisted(() => ({
  state: {} as AtlasRuntimeStoreState,
  values: [] as unknown[], cursor: 0,
  effects: [] as Array<() => void | (() => void)>,
}));
vi.mock("react", async (original) => ({
  ...await original<typeof import("react")>(),
  useState: <T,>(initial: T | (() => T)) => {
    const index = fixture.cursor++;
    if (!(index in fixture.values)) fixture.values[index] = typeof initial === "function" ? (initial as () => T)() : initial;
    return [fixture.values[index] as T, (next: SetStateAction<T>) => {
      fixture.values[index] = typeof next === "function" ? (next as (value: T) => T)(fixture.values[index] as T) : next;
    }] as const;
  },
  useEffect: (effect: () => void | (() => void)) => { fixture.effects.push(effect); },
}));
vi.mock("../lib/atlasRuntimeStore", () => ({
  useAtlasRuntimeStore: (select: (state: AtlasRuntimeStoreState) => unknown) => select(fixture.state),
}));
vi.mock("../lib/gaiaCatalogSourceState", () => ({ useGaiaCatalogSource: () => "gaia-dr3" }));

type HudProps = ComponentProps<typeof OrbitAtlasHud>;
type NodeProps = { children?: ReactNode; title?: string; onClick?: () => void; "aria-label"?: string };
function find(tree: ReactNode, title: string): ReactElement<NodeProps> | undefined {
  for (const child of Children.toArray(tree)) {
    if (!isValidElement<NodeProps>(child)) continue;
    if (child.type === "button" && child.props.title === title) return child;
    const nested = find(child.props.children, title);
    if (nested) return nested;
  }
}
function harness() {
  const noop = () => undefined;
  const props: HudProps = {
    isPlaying: false, onPlayPause: noop, simulationTimeSlot: "0", daysPerSecond: 1,
    scaleMode: "compressed", onScaleModeChange: noop, renderBudget: "balanced", onRenderBudgetChange: noop,
    viewSettings: { ...DEFAULT_SIMULATION_VIEW_SETTINGS }, onViewSettingsChange: vi.fn(),
    objectBrowserOpen: false, onSearch: vi.fn(), onZoomIn: noop, onZoomOut: noop, onResetView: noop,
    onOpenSandbox: noop, onOpenLaunch: noop, analysisAvailable: false, analysisOpen: false, onAnalysisToggle: noop,
    atlasWorkflowsOpen: false, onAtlasWorkflowsOpen: noop, missionHubOpen: false, onMissionHubOpen: noop,
    observatoryDeckOpen: false, onObservatoryDeckOpen: noop, scientificReportOpen: false, onScientificReportOpen: noop,
    validationConsoleOpen: false, onValidationConsoleOpen: noop, evidenceLedgerOpen: false, onEvidenceLedgerToggle: noop,
  };
  let tree: ReactNode;
  const render = () => {
    fixture.cursor = 0;
    fixture.effects.length = 0;
    function Harness() { tree = OrbitAtlasHud(props); return tree; }
    return renderToStaticMarkup(<Harness />);
  };
  const commit = () => { for (const effect of fixture.effects.splice(0)) effect(); };
  const click = (title: string) => {
    const button = find(tree, title);
    expect(button, `button ${title}`).toBeDefined();
    button!.props.onClick!();
  };
  const open = () => { render(); click("图层"); return render(); };
  return { props, render, commit, click, open };
}
function expectClosed(html: string) {
  expect(html).toContain('aria-expanded="false" title="图层"');
  expect(html).not.toContain('type="checkbox"');
  expect(html).toMatch(/<footer class="[^"]* z-\[100\]"/);
}

beforeEach(() => {
  fixture.values.length = 0;
  fixture.cursor = 0;
  fixture.effects.length = 0;
  fixture.state = { panels: { sessions: { navigator: { isOpen: false } } } } as AtlasRuntimeStoreState;
  vi.stubGlobal("document", { addEventListener: vi.fn(), removeEventListener: vi.fn() });
});
afterEach(() => { vi.unstubAllGlobals(); });

describe("orbit layers yield to both object navigation surfaces", () => {
  it("keeps all seven controls (A4: lines and boundaries separate) above desktop and mobile passports when navigation is closed", () => {
    const hud = harness();
    const html = hud.open();
    expect(html).toContain('aria-expanded="true" title="图层"');
    expect(html.match(/type="checkbox"/g)).toHaveLength(7);
    expect(html).toMatch(/<footer class="[^"]* z-\[121\] sm:z-\[104\]"/);
    expect(hud.props.onViewSettingsChange).not.toHaveBeenCalled();
  });

  it("closes layers through the search action without requiring a pointerdown or a later browser render", () => {
    const hud = harness();
    hud.open();
    hud.click("搜索天体");
    expect(hud.props.onSearch).toHaveBeenCalledOnce();
    expectClosed(hud.render());
    expect(hud.props.objectBrowserOpen).toBe(false);
  });

  it.each(["object-browser", "navigator-session"] as const)(
    "hides layers in the first %s render and does not reopen them when it closes", (surface) => {
      const hud = harness();
      const viewSettings = { ...hud.props.viewSettings };
      hud.open();
      const setOpen = (open: boolean) => {
        if (surface === "object-browser") hud.props.objectBrowserOpen = open;
        else fixture.state.panels.sessions.navigator.isOpen = open;
      };
      setOpen(true);
      expectClosed(hud.render()); // Before effects, so the elevated footer cannot cover the browser.
      hud.commit();
      setOpen(false);
      expectClosed(hud.render());
      expect(hud.props.viewSettings).toEqual(viewSettings);
      expect(hud.props.onViewSettingsChange).not.toHaveBeenCalled();
      hud.click("图层");
      expect(hud.render()).toContain('aria-expanded="true" title="图层"');
    },
  );

  it.each(["object-browser", "navigator-session"] as const)(
    "does not queue a layer opening while %s is visible", (surface) => {
      const hud = harness();
      if (surface === "object-browser") hud.props.objectBrowserOpen = true;
      else fixture.state.panels.sessions.navigator.isOpen = true;
      hud.render();
      hud.click("图层");
      expectClosed(hud.render());
      hud.props.objectBrowserOpen = false;
      fixture.state.panels.sessions.navigator.isOpen = false;
      expectClosed(hud.render());
    },
  );

  it("keeps the menu released while navigation moves between the browser and navigator session", () => {
    const hud = harness();
    hud.open();
    hud.props.objectBrowserOpen = true;
    expectClosed(hud.render());
    hud.commit();
    hud.props.objectBrowserOpen = false;
    fixture.state.panels.sessions.navigator.isOpen = true;
    expectClosed(hud.render());
    fixture.state.panels.sessions.navigator.isOpen = false;
    expectClosed(hud.render());
  });
});
