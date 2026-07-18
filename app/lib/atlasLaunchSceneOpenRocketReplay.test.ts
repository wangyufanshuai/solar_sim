import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createAtlasLaunchSceneOpenRocketReplaySummary } from "./atlasLaunchSceneOpenRocketReplay";
const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("v118 launch scene and OpenRocket replay", () => {
  it("keeps initial assets under 25 MB and records provenance", () => {
    const manifest = JSON.parse(read("dist/content-packs/files/spacecraft/models/spacecraft/manifest.json"));
    expect(manifest.initialAssetBytes).toBeLessThanOrEqual(25 * 1024 * 1024);
    expect(manifest.assets).toHaveLength(4);
    expect(manifest.assets.every((asset: { sha256?: string; sourceUrl?: string }) => asset.sha256 && asset.sourceUrl)).toBe(true);
  });
  it("locks screen HUD and offline executable boundary", () => {
    const summary = createAtlasLaunchSceneOpenRocketReplaySummary();
    expect(summary.hudPolicy).toBe("fixed-screen-space-overlay");
    expect(summary.browserExeLaunch).toBe("not-applied");
    expect(read("app/components/LaunchDirectorOverlay.tsx")).toContain('data-launch-screen-overlay="fixed-screen-space"');
    expect(read("app/components/LaunchSceneView.tsx")).not.toContain('<Html center distanceFactor={7} position={[0.16, 0.36, 0.08]}');
  });
});
