import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("useAtlasFocusController v175 contract", () => {
  const source = readFileSync("app/lib/useAtlasFocusController.ts", "utf8");

  it("preserves focus command and camera sequencing", () => {
    expect(source).toContain("atlasRuntimeStore.requestFocus");
    expect(source).toContain("dispatchCameraFocusDirection(direction)");
    expect(source).toContain("dispatchCameraFocusOrigin()");
    const requestBody = source.slice(
      source.indexOf("const requestBodyFocus"),
      source.indexOf("const requestCatalogObjectFocus"),
    );
    expect(requestBody.indexOf("setSelectedBodyIndex(bodyIndex)")).toBeLessThan(
      requestBody.indexOf("setCameraBodyFocusRequest((previous)"),
    );
  });

  it("keeps deep links, popstate, Escape priority and search shortcut", () => {
    expect(source).toContain('url.searchParams.set("system"');
    expect(source).toContain('window.addEventListener("popstate"');
    expect(source).toContain("panels.openPanelIds.length > 0");
    expect(source).toContain('event.key.toLowerCase() !== "k"');
  });
});
