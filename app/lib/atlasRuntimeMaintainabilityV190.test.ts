import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(file, "utf8");
const lines = (file: string) => read(file).split(/\r?\n/).length;

describe("v190 runtime maintainability boundaries", () => {
  it("keeps the Workbench and camera domains below their hard line gates", () => {
    expect(lines("app/AtlasRuntimeWorkbench.tsx")).toBeLessThan(1200);
    expect(lines("app/components/AtlasSceneCameraBridges.tsx")).toBeLessThan(650);
    expect(lines("app/components/AtlasSceneFocusCameraBridge.tsx")).toBeLessThan(500);
    expect(lines("app/lib/atlasSceneFocusCameraRuntime.ts")).toBeLessThan(240);
    expect(lines("app/lib/useAtlasSimulationSession.ts")).toBeLessThan(180);
    expect(lines("app/components/AtlasRuntimeWorkbenchSurface.tsx")).toBeLessThan(1200);
    expect(lines("app/lib/atlasRuntimeEvidenceCompositionV190.ts")).toBeLessThan(800);
  });

  it("loads optional scientific panels independently", () => {
    const deferred = read("app/lib/useAtlasDeferredEvidenceModules.ts");
    expect(deferred).not.toContain("Promise.all");
    expect(deferred.match(/void import\("\.\/atlasScientificReport"\)/g)).toHaveLength(1);
    expect(deferred.match(/void import\("\.\/atlasValidationConsole"\)/g)).toHaveLength(1);
    expect(deferred.match(/void import\("\.\/atlasObservatoryDeck"\)/g)).toHaveLength(1);
  });

  it("keeps one scene host and portable evidence composition types", () => {
    const workbench = read("app/AtlasRuntimeWorkbench.tsx");
    const sceneSurface = [
      read("app/components/AtlasRuntimeWorkbenchSurface.tsx"),
      read("app/components/AtlasRuntimeSceneLayer.tsx"),
    ].join("\n");
    const evidence = read("app/lib/atlasRuntimeEvidenceCompositionV190.ts");
    expect(workbench.match(/<AtlasRuntimeWorkbenchSurface\b/g)).toHaveLength(1);
    expect(workbench).not.toContain("<AtlasSceneHost");
    expect(sceneSurface.match(/<AtlasSceneHost\b/g)).toHaveLength(1);
    expect(evidence).not.toMatch(/import\(["'][A-Z]:\//);
    expect(evidence).toContain("createAtlasRuntimeEvidenceViewModelV177");
  });

  it("keeps the desktop shell split across commands, lifecycle, resources, and state", () => {
    const desktopLib = read("src-tauri/src/lib.rs");
    expect(lines("src-tauri/src/lib.rs")).toBeLessThan(600);
    expect(lines("src-tauri/src/lifecycle.rs")).toBeLessThan(250);
    expect(lines("src-tauri/src/resources.rs")).toBeLessThan(200);
    expect(lines("src-tauri/src/state.rs")).toBeLessThan(100);
    expect(desktopLib).toContain("mod commands;");
    expect(desktopLib).toContain("mod lifecycle;");
    expect(desktopLib).toContain("mod resources;");
    expect(desktopLib).toContain("mod state;");
    expect(desktopLib).toContain("commands::run();");
  });

  it("keeps versioned desktop resources out of the shared Tauri config", () => {
    const base = JSON.parse(read("src-tauri/tauri.conf.json"));
    const v186 = JSON.parse(read("src-tauri/tauri.v186.conf.json"));
    const v192 = JSON.parse(read("src-tauri/tauri.v192.conf.json"));
    expect(base.bundle.resources).toEqual({});
    expect(v186.bundle.resources).toMatchObject({
      "../dist/desktop-stage/v186/server": "server",
    });
    expect(v192.bundle.resources).toMatchObject({
      "../dist/desktop-stage/v192/server": "server",
    });
    expect(Object.keys(v186.bundle.resources)).toHaveLength(4);
    expect(Object.keys(v192.bundle.resources)).toHaveLength(4);
  });
});
