import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createAtlasPanelMountPlan } from "./atlasPanelCoordination";
import {
  ATLAS_PANEL_IDS,
  atlasRuntimeStore,
} from "./atlasRuntimeStore";

function closeAllPanels(): void {
  for (const panelId of ATLAS_PANEL_IDS) atlasRuntimeStore.closePanel(panelId);
}

describe("v181 panel and canvas architecture", () => {
  afterEach(closeAllPanels);

  it("keeps all 17 typed sessions isolated from unrelated payload updates", () => {
    expect(ATLAS_PANEL_IDS).toHaveLength(17);
    const navigatorListener = vi.fn();
    const unsubscribe = atlasRuntimeStore.subscribeSelector(
      (snapshot) => snapshot.panels.sessions.navigator,
      navigatorListener,
    );
    atlasRuntimeStore.openPanel("scientific-report", { templateId: "release" });
    atlasRuntimeStore.patchPanelSession("scientific-report", { sectionId: "summary" });
    expect(navigatorListener).not.toHaveBeenCalled();
    atlasRuntimeStore.openPanel("navigator", { query: "Sirius" });
    expect(navigatorListener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it("retains mobile background panels and publishes the three lifecycle states", () => {
    atlasRuntimeStore.openPanel("workflow", { workflowId: "tour", stepId: "2" });
    atlasRuntimeStore.openPanel("mission-hub", { itemId: "mission-7" });
    const plan = createAtlasPanelMountPlan(
      atlasRuntimeStore.getSnapshot().panels,
      "mobile",
      ["mission-hub"],
    );
    expect(plan.items.find(({ id }) => id === "workflow")).toMatchObject({
      isVisible: false,
      isMounted: true,
    });
    const coordinator = readFileSync("app/components/AtlasPanelCoordinator.tsx", "utf8");
    expect(coordinator).toContain('"visible" | "background" | "unmounted"');
    expect(coordinator).toContain("lifecycleByPanelId");
  });

  it("keeps background panels mounted behind hidden/inert, Suspense, and an error boundary", () => {
    const coordinator = readFileSync("app/components/AtlasPanelCoordinator.tsx", "utf8");
    const boundary = readFileSync("app/components/AtlasPanelBoundary.tsx", "utf8");
    expect(coordinator).toContain("hidden={!isVisible}");
    expect(coordinator).toContain("data-atlas-panel-lifecycle={lifecycle}");
    expect(coordinator).not.toContain('import { Activity } from "react"');
    expect(coordinator).toContain("canRestoreAtlasPanelFocus(returnTarget)");
    expect(coordinator).toContain("snapshot.panels.sessions[id]");
    expect(boundary).toContain("<Suspense fallback={this.props.pending}>");
    expect(boundary).toContain("static getDerivedStateFromError");
  });

  it("keeps one Canvas and makes heavy scenes conditional dynamic chunks", () => {
    const canvas = readFileSync("app/components/UniverseCanvas.tsx", "utf8");
    const facade = readFileSync("app/components/UniverseScene.tsx", "utf8");
    const runtime = readFileSync("app/components/AtlasUniverseSceneRuntime.tsx", "utf8");
    const lazyModules = readFileSync("app/components/AtlasSceneLazyModules.tsx", "utf8");
    expect(canvas.match(/<Canvas\b/g)).toHaveLength(1);
    expect(facade.split(/\r?\n/).length).toBeLessThan(1200);
    expect(runtime).not.toContain('import LaunchSceneView from "./LaunchSceneView";');
    expect(runtime).not.toContain('from "./ExoplanetSystemScene";');
    expect(runtime).not.toContain('from "./KerrBlackHole";');
    expect(lazyModules).toContain('import("./LaunchSceneView")');
    expect(lazyModules).toContain('import("./ExoplanetSystemScene")');
    expect(lazyModules).toContain('import("./KerrBlackHole")');
    expect(lazyModules).toContain("preloadAtlasSceneModule");
    expect(lazyModules).toContain("launchSceneModule ??=");
    expect(lazyModules).toContain("exoplanetSceneModule ??=");
    expect(lazyModules).toContain("kerrSceneModule ??=");
    expect(canvas).toContain("stabilizeAtlasCanvasSimulationGroups");
  });

  it("keeps every concrete scene responsibility below the v183 line budget", () => {
    for (const file of [
      "app/components/UniverseScene.tsx",
      "app/components/UniverseCanvas.tsx",
      "app/components/AtlasUniverseSceneRuntime.tsx",
      "app/components/AtlasSceneCameraBridges.tsx",
      "app/components/AtlasSceneDiagnostics.tsx",
    ]) {
      const lineCount = readFileSync(file, "utf8").split(/\r?\n/).length;
      expect(lineCount, file).toBeLessThan(1200);
    }
  });

  it("keeps registered panel ids stable when callers recreate slot functions", () => {
    const surface = readFileSync("app/components/AtlasRuntimePanelSurface.tsx", "utf8");
    expect(surface).toContain("function useStablePanelIds(");
    expect(surface).toContain("samePanelIds(stablePanelIdsRef.current, nextPanelIds)");
    expect(surface).toContain("const registeredPanelIds = useStablePanelIds(managedPanelIds, slots)");
    expect(surface).not.toContain("[managedPanelIds, slots]");
  });

  it("retains the v177 flat-prop source-audit manifest exactly", () => {
    const facade = readFileSync("app/components/UniverseScene.tsx", "utf8");
    const propsBlock = facade.match(
      /export type UniverseCanvasSimulationProps = \{([\s\S]*?)\n\};/,
    );
    if (!propsBlock) throw new Error("missing compatibility flat prop manifest");
    const publicKeys = [...propsBlock[1].matchAll(/^  ([A-Za-z0-9_]+)\??:/gm)]
      .map((entry) => entry[1]);
    const groupedKeys = [
      "REF",
      "INTERACTIVE",
      "ACTION",
      "VISUAL",
    ].flatMap((group) => {
      const match = facade.match(new RegExp(
        `export const ATLAS_CANVAS_SIMULATION_${group}_KEYS = \\[([\\s\\S]*?)\\] as const`,
      ));
      if (!match) throw new Error(`missing ${group} compatibility keys`);
      return [...match[1].matchAll(/"([A-Za-z0-9_]+)"/g)].map((entry) => entry[1]);
    });
    expect(publicKeys).toHaveLength(85);
    expect(new Set(groupedKeys).size).toBe(groupedKeys.length);
    expect([...groupedKeys].sort()).toEqual([...publicKeys].sort());
  });
});
