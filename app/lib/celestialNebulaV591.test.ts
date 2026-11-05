import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CELESTIAL_NEBULA_OVERLAY_SHA256_V591,
  isNebulaFocusTargetV591,
  parseNebulaAssetOverlayV591,
  selectNebulaImpostorIdsV591,
  selectNebulaTextureFilesV591,
  V591_ADMITTED_NEBULA_IDS,
  V591_BLOCKED_NEBULA_IDS,
  type NebulaAssetOverlayV591,
} from "./celestialNebulaV591";

const overlayPath = resolve(process.cwd(), "public/data/celestial-convergence-v591/nebula-asset-overlay.json");
const readOverlay = (): NebulaAssetOverlayV591 => JSON.parse(readFileSync(overlayPath, "utf8")) as NebulaAssetOverlayV591;
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

describe("v591 NASA nebula admission", () => {
  it("accepts the sealed 6/6 overlay while preserving historical negative evidence separately", async () => {
    const overlay = await parseNebulaAssetOverlayV591(readOverlay());
    expect(overlay.receiptSha256).toBe(CELESTIAL_NEBULA_OVERLAY_SHA256_V591);
    expect(overlay.assets.map((asset) => asset.id)).toEqual([
      "orion-nebula",
      "lagoon-nebula",
      "eagle-nebula",
      "helix-nebula",
      "veil-nebula",
      "north-america-nebula",
    ]);
    expect(overlay.blocked).toEqual([]);
    expect(overlay.authorityState.scientificPayloadWriteback).toBe(false);
  });

  it("selects KTX2-first full variants and bounded Lite fallbacks", async () => {
    const overlay = await parseNebulaAssetOverlayV591(readOverlay());
    const asset = overlay.assets[0];
    expect(selectNebulaTextureFilesV591(asset, "standalone-full", "desktop")).toEqual({
      primary: asset.variants.desktopKtx2,
      fallback: asset.variants.desktopFallback,
    });
    expect(selectNebulaTextureFilesV591(asset, "standalone-full", "mobile")).toEqual({
      primary: asset.variants.mobileKtx2,
      fallback: asset.variants.mobileFallback,
    });
    expect(selectNebulaTextureFilesV591(asset, "vercel-lite", "desktop")).toEqual({
      primary: null,
      fallback: asset.variants.liteDesktop,
    });
    expect(selectNebulaTextureFilesV591(asset, "vercel-lite", "mobile")).toEqual({
      primary: null,
      fallback: asset.variants.liteMobile,
    });
  });

  it("rejects identity, host, license and path mutations", async () => {
    const identity = clone(readOverlay());
    (identity.assets[0].source as { sha256: string }).sha256 = "0".repeat(64);
    await expect(parseNebulaAssetOverlayV591(identity)).rejects.toThrow("v591-nebula-overlay-identity");

    const mutations: ReadonlyArray<Readonly<{ mutate: (overlay: NebulaAssetOverlayV591) => void; error: string }>> = [
      { mutate: (overlay) => { (overlay.assets[0].source as { host: string }).host = "example.com"; }, error: "v591-nebula-source" },
      { mutate: (overlay) => { (overlay.assets[0].source.license as { id: string }).id = "unknown"; }, error: "v591-nebula-source" },
      { mutate: (overlay) => { (overlay.assets[0].variants.desktopKtx2 as { url: string }).url = "/textures/candidate-v591/nebulae/../escape.ktx2"; }, error: "v591-nebula-variant" },
    ];
    for (const { mutate, error } of mutations) {
      const overlay = clone(readOverlay());
      mutate(overlay);
      await expect(parseNebulaAssetOverlayV591(overlay)).rejects.toThrow(error);
    }
  });

  it("keeps focus targeting explicit and refuses arbitrary sky names", () => {
    expect(isNebulaFocusTargetV591("orion-nebula")).toBe(true);
    expect(isNebulaFocusTargetV591("veil-nebula")).toBe(true);
    expect(isNebulaFocusTargetV591("synthetic-nebula")).toBe(false);
  });

  it("keeps Science marker-only and caps Cinematic runtime imagery", () => {
    expect(V591_ADMITTED_NEBULA_IDS).toHaveLength(6);
    expect(V591_BLOCKED_NEBULA_IDS).toEqual([]);
    expect(selectNebulaImpostorIdsV591("science", "overview")).toEqual([]);
    expect(selectNebulaImpostorIdsV591("science", "orion-nebula")).toEqual([]);
    expect(selectNebulaImpostorIdsV591("cinematic", "overview")).toEqual([
      "orion-nebula",
      "lagoon-nebula",
      "eagle-nebula",
    ]);
    expect(selectNebulaImpostorIdsV591("cinematic", "helix-nebula")).toEqual(["helix-nebula"]);
    expect(selectNebulaImpostorIdsV591("cinematic", "veil-nebula")).toEqual(["veil-nebula"]);
    expect(selectNebulaImpostorIdsV591("cinematic", "earth")).toEqual([]);
    expect(selectNebulaImpostorIdsV591("cinematic", "orion")).toEqual([]);
    expect(selectNebulaImpostorIdsV591("cinematic", "milky-way-center")).toEqual([]);
  });
});
