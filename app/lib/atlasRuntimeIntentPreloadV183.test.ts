import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v183 scene intent preloading", () => {
  it("keeps heavy scene modules conditional and wires runtime intent", () => {
    const lazyModules = readFileSync("app/components/AtlasSceneLazyModules.tsx", "utf8");
    const workbench = readFileSync("app/AtlasRuntimeWorkbench.tsx", "utf8");
    expect(lazyModules).toContain('import("./LaunchSceneView")');
    expect(lazyModules).toContain('import("./ExoplanetSystemScene")');
    expect(lazyModules).toContain('import("./KerrBlackHole")');
    for (const sceneId of ["launch", "exoplanet-system", "kerr"] as const) {
      expect(workbench).toContain(`preloadAtlasSceneModule("${sceneId}")`);
    }
  });
});
