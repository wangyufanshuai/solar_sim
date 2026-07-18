import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { atlasRuntimeStore } from "./atlasRuntimeStore";

describe("v161 runtime architecture v3", () => {
  it("notifies selector subscribers only when their selected value changes", () => {
    const previous = atlasRuntimeStore.getSnapshot();
    const listener = vi.fn();
    const unsubscribe = atlasRuntimeStore.subscribeSelector((state) => state.qualityTier, listener);
    atlasRuntimeStore.setSelectedObject("gaia:1");
    expect(listener).not.toHaveBeenCalled();
    atlasRuntimeStore.setQualityTier(previous.qualityTier === "balanced" ? "closeup-inspect" : "balanced");
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    atlasRuntimeStore.setQualityTier(previous.qualityTier);
    atlasRuntimeStore.setSelectedObject(previous.selectedObjectId);
  });

  it("uses one scene host canvas and one current release manifest", () => {
    const host = readFileSync("app/components/AtlasSceneHost.tsx", "utf8");
    const shell = readFileSync("app/components/AtlasAppShell.tsx", "utf8");
    expect(host.match(/<UniverseCanvas/g)).toHaveLength(1);
    expect(host).toContain('data-atlas-scene-host-canvas-limit="1"');
    expect(shell).toContain("const CURRENT_RELEASE = CURRENT_ATLAS_PRODUCT_RELEASE_V167");
    expect(shell).not.toContain("createAtlasConvergenceProgramV146Summary");
    expect(shell).toContain("data-atlas-app-shell-render-count");
  });

  it("keeps UniversePage as a lightweight route entry", () => {
    const entry = readFileSync("app/UniversePage.tsx", "utf8");
    expect(entry.split(/\r?\n/).length).toBeLessThanOrEqual(12);
    expect(entry).toContain('export { default } from "./UniverseRuntimeController"');
    expect(entry).not.toContain("useState(");
  });
});
