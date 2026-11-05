import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import type { AtlasRuntimeWorkbenchSurfaceScope } from "./AtlasRuntimeWorkbenchSurface";
import { createAtlasRuntimeDomainGroups } from "./atlasRuntimeWorkbenchDomains";

describe("v251 Atlas Runtime Workbench domains", () => {
  it("creates seven distinct, exhaustive domain objects", () => {
    const scope = new Proxy({}, {
      get: (_target, property) => property,
    }) as AtlasRuntimeWorkbenchSurfaceScope;
    const domains = createAtlasRuntimeDomainGroups(scope);
    const domainObjects = Object.values(domains);
    const domainKeys = domainObjects.flatMap((domain) => Object.keys(domain));

    expect(Object.keys(domains)).toEqual([
      "scene",
      "shellHud",
      "panels",
      "navigationFocus",
      "evidenceMission",
      "launch",
      "timelinePhysics",
    ]);
    expect(new Set(domainObjects).size).toBe(7);
    expect(domainKeys).toHaveLength(201);
    expect(new Set(domainKeys).size).toBe(201);
    expect(domains.scene.atlasSceneMode).toBe("atlasSceneMode");
    expect(domains.launch.handleLaunchStart).toBe("handleLaunchStart");
    expect(domains.timelinePhysics.physicsRef).toBe("physicsRef");
  });

  it("reuses unchanged domains and isolates a single-domain update", () => {
    const scope = new Proxy({}, {
      get: (_target, property) => property,
    }) as AtlasRuntimeWorkbenchSurfaceScope;
    const initial = createAtlasRuntimeDomainGroups(scope);
    const unchanged = createAtlasRuntimeDomainGroups(scope, initial);
    const changedScope = new Proxy({}, {
      get: (_target, property) => property === "evidenceLedgerOpen" ? true : property,
    }) as AtlasRuntimeWorkbenchSurfaceScope;
    const changed = createAtlasRuntimeDomainGroups(changedScope, initial);

    expect(unchanged).toBe(initial);
    expect(changed).not.toBe(initial);
    expect(changed.evidenceMission).not.toBe(initial.evidenceMission);
    expect(changed.scene).toBe(initial.scene);
    expect(changed.shellHud).toBe(initial.shellHud);
    expect(changed.panels).toBe(initial.panels);
    expect(changed.navigationFocus).toBe(initial.navigationFocus);
    expect(changed.launch).toBe(initial.launch);
    expect(changed.timelinePhysics).toBe(initial.timelinePhysics);
  });

  it("keeps the three rendered layers off the complete compatibility scope", () => {
    for (const file of [
      "app/components/AtlasRuntimeSceneLayer.tsx",
      "app/components/AtlasRuntimePanelLayer.tsx",
      "app/components/AtlasRuntimeDockLayer.tsx",
    ]) {
      const source = readFileSync(resolve(process.cwd(), file), "utf8");
      expect(source).not.toContain("AtlasRuntimeWorkbenchSurfaceScope");
      expect(source).not.toContain("scope:");
    }

    const surface = readFileSync(
      resolve(process.cwd(), "app/components/AtlasRuntimeWorkbenchSurface.tsx"),
      "utf8",
    );
    expect(surface).toContain("domains: AtlasRuntimeWorkbenchDomains");
    expect(surface).not.toContain("sceneOverlay: scope");
    expect(surface).not.toContain("panelSlots: scope");
    expect(surface).not.toContain("dock: scope");
    expect(surface).not.toContain("...domains.scene");
    expect(surface.split(/\r?\n/).length).toBeLessThanOrEqual(400);
  });

  it("keeps the Workbench coordinator within the v251 maintenance budget", () => {
    const source = readFileSync(resolve(process.cwd(), "app/AtlasRuntimeWorkbench.tsx"), "utf8");
    expect(source.split(/\r?\n/).length).toBeLessThanOrEqual(500);
    expect((source.match(/\buseState\s*\(/g) ?? []).length).toBeLessThanOrEqual(8);
    expect(source).toContain("useAtlasWorkbenchLocalState");
    expect(source.indexOf("useAtlasWorkbenchLocalState"))
      .toBeLessThan(source.indexOf("if (!physicsReady)"));
  });
});
