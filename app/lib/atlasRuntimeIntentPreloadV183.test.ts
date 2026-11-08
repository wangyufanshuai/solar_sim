import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v183 scene intent preloading", () => {
  it("keeps heavy scene modules conditional and wires runtime intent", () => {
    const lazyModules = readFileSync("app/components/AtlasSceneLazyModules.tsx", "utf8");
    // Preload calls moved out of AtlasRuntimeWorkbench into the dock, focus and navigation hooks.
    const workbench = [
      "app/components/AtlasRuntimeDockLayer.tsx",
      "app/lib/useAtlasWorkbenchFocusDomain.ts",
      "app/lib/useAtlasWorkbenchNavigationActions.ts",
    ].map((path) => readFileSync(path, "utf8")).join("\n");
    expect(lazyModules).toContain('import("./LaunchSceneView")');
    expect(lazyModules).toContain('import("./ExoplanetSystemScene")');
    expect(lazyModules).toContain('import("./KerrBlackHole")');
    for (const sceneId of ["launch", "exoplanet-system", "kerr"] as const) {
      expect(workbench).toContain(`preloadAtlasSceneModule("${sceneId}")`);
    }
  });
});
