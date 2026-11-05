import { describe, expect, it } from "vitest";
import {
  getDesktopCapabilities,
  listDesktopContentPacks,
  selectDesktopContentPackManifest,
} from "./desktopBridge";

describe("v132 desktop bridge web fallback", () => {
  it("keeps browser mode operational without Tauri", async () => {
    const capabilities = await getDesktopCapabilities();
    expect(capabilities.available).toBe(false);
    expect(capabilities.catalogBackend).toBe("web-worker-shards");
    expect(capabilities.desktopReleaseProfile).toBe("web");
    expect(capabilities.contentPackCount).toBe(0);
    await expect(listDesktopContentPacks()).resolves.toEqual([]);
    await expect(selectDesktopContentPackManifest()).resolves.toBeNull();
  });
});
