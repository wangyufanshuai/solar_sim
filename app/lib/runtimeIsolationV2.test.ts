import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync("app/UniverseRuntimeController.tsx", "utf8");
const navigatorRuntime = readFileSync("app/components/AtlasNavigatorRuntimePanel.tsx", "utf8");
const historyBar = readFileSync("app/components/SimulationHistoryBar.tsx", "utf8");
const proxy = readFileSync("proxy.ts", "utf8");
const proxyContract = readFileSync("app/lib/atlasProxyContractV562.ts", "utf8");
const catalogPackManager = readFileSync("app/components/CatalogPackManager.tsx", "utf8");
const galaxyEnvironment = readFileSync("app/components/GalaxyEnvironmentSphere.tsx", "utf8");
const freshBrowserConfig = readFileSync("playwright.atlas.fresh.config.ts", "utf8");
const standaloneStarter = readFileSync("scripts/start-atlas-standalone.mjs", "utf8");

describe("v155 runtime isolation", () => {
  it("keeps navigator query and the stellar worker outside UniversePage", () => {
    expect(page).not.toContain("useStellarSearch(");
    expect(page).not.toContain("atlasNavigatorQuery");
    expect(navigatorRuntime).toContain("useStellarSearch(query, 20, open)");
    expect(navigatorRuntime).toContain("publishAtlasStellarSearchResults");
  });

  it("keeps history polling local to its bar", () => {
    expect(page).not.toContain("historySnapshotCount");
    expect(page).not.toContain("bumpHistorySnapshotCount");
    expect(historyBar).toContain("setSnapshotCount");
  });

  it("does not redirect same-origin catalog APIs into the SPA page", () => {
    expect(proxyContract).toContain('pathname.startsWith("/api/")');
    expect(proxy).toContain("classifyAtlasProxyPathV562");
    expect(proxy.indexOf("authorizeDesktopRequest(request)")).toBeLessThan(
      proxy.indexOf("const url = request.nextUrl.clone()"),
    );
  });

  it("deduplicates catalog probes and does not reload V9 textures on focus changes", () => {
    expect(catalogPackManager).toContain("catalogPackProbePromise ??=");
    expect(catalogPackManager).toContain("await probeCatalogPack()");
    expect(galaxyEnvironment).toContain('const loadOptionalDeepLayers = renderBudget === "dense";');
    const loadingEffect = galaxyEnvironment.slice(
      galaxyEnvironment.indexOf("useEffect(() => {\n    let cancelled = false;"),
      galaxyEnvironment.indexOf("useEffect(() => {\n    const referenceDepth"),
    );
    expect(loadingEffect).not.toContain("selectedBodyCinematic,");
  });

  it("runs fresh browser acceptance against a built production server", () => {
    expect(freshBrowserConfig).toContain("node scripts/start-atlas-standalone.mjs");
    expect(freshBrowserConfig).toContain("--dist-dir .next-atlas-standalone-current");
    expect(freshBrowserConfig).toContain("reuseExistingServer: false");
    expect(freshBrowserConfig).toContain("globalTeardown");
    expect(standaloneStarter).toContain('join(standaloneRoot, "public")');
    expect(standaloneStarter).toContain('join(standaloneRoot, ".next", "static")');
    expect(standaloneStarter).toContain("ATLAS_LOCAL_CONTENT_PACK_ROOT");
  });
});
