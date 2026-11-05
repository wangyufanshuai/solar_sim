import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Mainline A Lite sky quality selection", () => {
  it("keeps canonical desktop art while selecting the mobile base for Lite delivery", () => {
    const source = readFileSync("app/components/GalaxyEnvironmentSphere.tsx", "utf8");
    expect(source).toContain('getAtlasDeliveryProfile() === "vercel-lite"');
    expect(source).toContain("mobile || liteDelivery ? layerManifest.mobileBase : layerManifest.desktopBase");
    expect(source).toContain("mobile || liteDelivery ? layerManifest.mobileStars : layerManifest.desktopStars");
    expect(source).toContain("!liteDelivery && baseLayerUrl === layerManifest.mobileBase");
  });
});
