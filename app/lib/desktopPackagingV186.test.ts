import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v186 desktop compact packaging", () => {
  it("preserves the staged server directory tree for MSI and NSIS", () => {
    const config = JSON.parse(readFileSync("src-tauri/tauri.conf.json", "utf8"));
    expect(config.bundle.targets).toEqual(["nsis", "msi"]);
    expect(config.bundle.resources).toMatchObject({
      "../dist/desktop-stage/v186/server": "server",
      "../dist/desktop-stage/v186/runtime": "runtime",
      "../dist/desktop-stage/v186/content-pack-manifests": "content-pack-manifests",
      "../dist/desktop-stage/v186/desktop-stage.json": "desktop-stage.json",
    });
    expect(Object.keys(config.bundle.resources).some((source) => source.includes("*"))).toBe(false);
  });

  it("stages real static files instead of the standalone browser-test junction", () => {
    const source = readFileSync("scripts/stage-desktop-runtime.mjs", "utf8");
    expect(source).toContain('const standaloneStaticJunction = path.join(standaloneNext, "static")');
    expect(source).toContain("path.resolve(source) !== path.resolve(standaloneStaticJunction)");
    expect(source).toContain('path.join(nextRoot, "static")');
  });
});
