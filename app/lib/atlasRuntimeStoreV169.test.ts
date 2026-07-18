import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { createAtlasPanelLayout } from "./atlasPanelCoordination";
import { atlasRuntimeStore } from "./atlasRuntimeStore";

describe("v169 runtime context and panel coordination", () => {
  it("provides an inert, Escape-aware coordinator without controller wiring", () => {
    const source = readFileSync("app/components/AtlasPanelCoordinator.tsx", "utf8");
    const shell = readFileSync("app/components/AtlasAppShell.tsx", "utf8");
    expect(source).toContain('data-atlas-panel-coordinator="v169"');
    expect(source).toContain('inert: ""');
    expect(source).toContain('event.key !== "Escape"');
    expect(source).toContain("returnFocusRef.current?.focus");
    expect(shell).toContain("atlasRuntimeStore.setRuntimeContext({");
    expect(shell).not.toContain("atlasRuntimeStore.setQualityTier(qualityTier)");
  });

  it("publishes an atomic runtime context update exactly once", () => {
    const previous = atlasRuntimeStore.getSnapshot();
    const nextScene = previous.sceneMode === "atlas" ? "inspect" : "atlas";
    const nextQuality = previous.qualityTier === "balanced" ? "closeup-inspect" : "balanced";
    const listener = vi.fn();
    const unsubscribe = atlasRuntimeStore.subscribe(listener);

    atlasRuntimeStore.setRuntimeContext({
      sceneMode: nextScene,
      qualityTier: nextQuality,
      selectedObjectId: "v169:atomic-context",
    });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(atlasRuntimeStore.getSnapshot()).toMatchObject({
      sceneMode: nextScene,
      qualityTier: nextQuality,
      selectedObjectId: "v169:atomic-context",
      sceneRevision: previous.sceneRevision + 1,
    });
    unsubscribe();
    atlasRuntimeStore.setRuntimeContext({
      sceneMode: previous.sceneMode,
      qualityTier: previous.qualityTier,
      selectedObjectId: previous.selectedObjectId,
    });
  });

  it("isolates panel session selectors from unrelated panel and runtime updates", () => {
    atlasRuntimeStore.closePanel("navigator");
    atlasRuntimeStore.closePanel("scientific-report");
    const listener = vi.fn();
    const unsubscribe = atlasRuntimeStore.subscribeSelector(
      (snapshot) => snapshot.panels.sessions.navigator,
      listener,
    );

    atlasRuntimeStore.openPanel("scientific-report", { templateId: "release" });
    atlasRuntimeStore.setSelectedObject("v169:selector-isolation");
    expect(listener).not.toHaveBeenCalled();

    atlasRuntimeStore.patchPanelSession("navigator", { query: "Sirius" });
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    atlasRuntimeStore.closePanel("scientific-report");
  });

  it("keeps desktop panels open together and makes a modal foreground inert-safe", () => {
    atlasRuntimeStore.closePanel("navigator");
    atlasRuntimeStore.closePanel("mission-hub");
    atlasRuntimeStore.openPanel("navigator", { itemId: "solar-system" });
    atlasRuntimeStore.openPanel("mission-hub", { itemId: "mission-1" });

    const panels = atlasRuntimeStore.getSnapshot().panels;
    expect(panels.openPanelIds).toEqual(expect.arrayContaining(["navigator", "mission-hub"]));
    expect(panels.sessions.navigator.payload.itemId).toBe("solar-system");
    expect(panels.sessions["mission-hub"].payload.itemId).toBe("mission-1");

    const navigatorSessionListener = vi.fn();
    const unsubscribe = atlasRuntimeStore.subscribeSelector(
      (snapshot) => snapshot.panels.sessions.navigator,
      navigatorSessionListener,
    );
    atlasRuntimeStore.openPanel("navigator");
    expect(navigatorSessionListener).not.toHaveBeenCalled();
    unsubscribe();
    atlasRuntimeStore.openPanel("mission-hub");

    const desktop = createAtlasPanelLayout(
      atlasRuntimeStore.getSnapshot().panels,
      "desktop",
      "mission-hub",
    );
    expect(desktop).toEqual([
      { id: "navigator", isForeground: false, isInteractive: false },
      { id: "mission-hub", isForeground: true, isInteractive: true },
    ]);
    expect(createAtlasPanelLayout(panels, "mobile", "mission-hub")).toEqual([
      { id: "mission-hub", isForeground: true, isInteractive: true },
    ]);

    atlasRuntimeStore.closePanel("mission-hub");
    atlasRuntimeStore.closePanel("navigator");
  });

  it("patches payloads without reopening and toggles while retaining the session", () => {
    atlasRuntimeStore.closePanel("workflow");
    atlasRuntimeStore.openPanel("workflow", { workflowId: "tour", stepId: "1" });
    const openedRevision = atlasRuntimeStore.getSnapshot().panels.sessions.workflow.revision;

    atlasRuntimeStore.patchPanelSession("workflow", { stepId: "2" });
    const patched = atlasRuntimeStore.getSnapshot().panels.sessions.workflow;
    expect(patched).toMatchObject({
      isOpen: true,
      revision: openedRevision + 1,
      payload: { workflowId: "tour", stepId: "2" },
    });

    atlasRuntimeStore.togglePanel("workflow");
    expect(atlasRuntimeStore.getSnapshot().panels.sessions.workflow).toMatchObject({
      isOpen: false,
      payload: { workflowId: "tour", stepId: "2" },
    });
    atlasRuntimeStore.togglePanel("workflow");
    expect(atlasRuntimeStore.getSnapshot().panels.sessions.workflow).toMatchObject({
      isOpen: true,
      payload: { workflowId: "tour", stepId: "2" },
    });
    atlasRuntimeStore.closePanel("workflow");
  });
});
