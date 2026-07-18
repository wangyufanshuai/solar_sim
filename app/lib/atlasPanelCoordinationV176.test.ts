import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createAtlasPanelMountPlan,
  createAtlasPanelModalStack,
} from "./atlasPanelCoordination";
import {
  ATLAS_PANEL_IDS,
  atlasRuntimeStore,
  createAtlasPanelBooleanSetter,
} from "./atlasRuntimeStore";

function closeAllPanels(): void {
  for (const panelId of ATLAS_PANEL_IDS) atlasRuntimeStore.closePanel(panelId);
}

describe("v176 typed panel coordination", () => {
  afterEach(closeAllPanels);

  it("retains every mobile session while only the foreground sheet is visible", () => {
    closeAllPanels();
    atlasRuntimeStore.openPanel("navigator", { query: "Sirius" });
    atlasRuntimeStore.openPanel("workflow", { workflowId: "tour", stepId: "2" });
    atlasRuntimeStore.openPanel("mission-hub", { itemId: "mission-7" });

    const plan = createAtlasPanelMountPlan(
      atlasRuntimeStore.getSnapshot().panels,
      "mobile",
      ["navigator", "mission-hub"],
    );

    expect(plan.foregroundPanelId).toBe("mission-hub");
    expect(plan.escapePanelId).toBe("mission-hub");
    expect(plan.modalStack).toEqual(["navigator", "mission-hub"]);
    expect(plan.items).toHaveLength(3);
    expect(plan.items.find(({ id }) => id === "workflow")).toMatchObject({
      isMounted: true,
      isVisible: false,
      isInteractive: false,
      isInert: true,
    });
    expect(plan.items.find(({ id }) => id === "mission-hub")).toMatchObject({
      isMounted: true,
      isVisible: true,
      isInteractive: true,
      isInert: false,
    });
    expect(atlasRuntimeStore.getSnapshot().panels.sessions.workflow.payload).toEqual({
      workflowId: "tour",
      stepId: "2",
    });
  });

  it("keeps desktop peers visible but makes every background modal layer inert", () => {
    closeAllPanels();
    atlasRuntimeStore.openPanel("navigator");
    atlasRuntimeStore.openPanel("workflow");
    atlasRuntimeStore.openPanel("mission-hub");
    const panels = atlasRuntimeStore.getSnapshot().panels;

    expect(createAtlasPanelModalStack(panels, ["mission-hub", "navigator"])).toEqual([
      "mission-hub",
      "navigator",
    ]);
    const plan = createAtlasPanelMountPlan(panels, "desktop", ["mission-hub", "navigator"]);
    expect(plan.items.every(({ isVisible }) => isVisible)).toBe(true);
    expect(plan.items.find(({ id }) => id === "navigator")).toMatchObject({
      isForeground: true,
      isInteractive: true,
      isInert: false,
    });
    expect(plan.items.filter(({ id }) => id !== "navigator").every(({ isInert }) => isInert)).toBe(true);
  });

  it("adapts legacy boolean setters without changing scene revision", () => {
    closeAllPanels();
    const sceneRevision = atlasRuntimeStore.getSnapshot().sceneRevision;
    const listener = vi.fn();
    const unsubscribe = atlasRuntimeStore.subscribeSelector(
      (snapshot) => snapshot.panels.sessions.navigator,
      listener,
    );
    const setNavigatorOpen = createAtlasPanelBooleanSetter("navigator", { query: "Mars" });

    setNavigatorOpen(true);
    setNavigatorOpen((isOpen) => !isOpen);

    expect(listener).toHaveBeenCalledTimes(2);
    expect(atlasRuntimeStore.getSnapshot().sceneRevision).toBe(sceneRevision);
    expect(atlasRuntimeStore.getSnapshot().panels.sessions.navigator).toMatchObject({
      isOpen: false,
      payload: { query: "Mars" },
    });
    unsubscribe();
  });

  it("locks global Escape handoff, per-panel focus return, and typed slots", () => {
    const coordinator = readFileSync("app/components/AtlasPanelCoordinator.tsx", "utf8");
    const surface = readFileSync("app/components/AtlasRuntimePanelSurface.tsx", "utf8");

    expect(coordinator).toContain('window.addEventListener("keydown", handleEscape)');
    expect(coordinator).toContain("returnFocusRefs.current[panelId]");
    expect(coordinator).toContain("unhandledEscapeRef.current?.()");
    expect(coordinator).toContain("hidden={!isVisible}");
    expect(coordinator).toContain('inert: ""');
    expect(surface).toContain("export type AtlasPanelRenderSlots");
    expect(surface).toContain("AtlasPanelSession<Id>");
    expect(surface).toContain("onMountPlanChange={onMountPlanChange}");
  });

  it("excludes legacy HUD panels from mount, modal, Escape, and focus plans", () => {
    closeAllPanels();
    atlasRuntimeStore.openPanel("navigator", { query: "managed" });
    atlasRuntimeStore.openPanel("atlas-tools", { sectionId: "legacy-hud" });

    const managedPlan = createAtlasPanelMountPlan(
      atlasRuntimeStore.getSnapshot().panels,
      "desktop",
      ["navigator", "atlas-tools"],
      ["navigator"],
    );
    expect(managedPlan.items.map(({ id }) => id)).toEqual(["navigator"]);
    expect(managedPlan.modalStack).toEqual(["navigator"]);
    expect(managedPlan.foregroundPanelId).toBe("navigator");
    expect(managedPlan.escapePanelId).toBe("navigator");

    atlasRuntimeStore.closePanel("navigator");
    const unmanagedOnlyPlan = createAtlasPanelMountPlan(
      atlasRuntimeStore.getSnapshot().panels,
      "mobile",
      ["atlas-tools"],
      ["navigator"],
    );
    expect(unmanagedOnlyPlan.items).toEqual([]);
    expect(unmanagedOnlyPlan.foregroundPanelId).toBeNull();
    expect(unmanagedOnlyPlan.escapePanelId).toBeNull();

    const surface = readFileSync("app/components/AtlasRuntimePanelSurface.tsx", "utf8");
    expect(surface).toContain("managedPanelIds ?? Object.keys(slots)");
    expect(surface).toContain("managedPanelIds={registeredPanelIds}");
  });
});
