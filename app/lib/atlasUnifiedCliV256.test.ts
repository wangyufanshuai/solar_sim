import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("v256 unified atlas CLI", () => {
  it("keeps one modern entrypoint and a versioned exact legacy map", async () => {
    const packageJson = JSON.parse(readFileSync(resolve(process.cwd(), "package.json"), "utf8")) as { scripts: Record<string, string> };
    const { loadAtlasLegacyCommandMapV256, ATLAS_LEGACY_COMMAND_MAP_VERSION } = await import("../../scripts/atlas-legacy-command-map-v256.mjs");
    const legacy = loadAtlasLegacyCommandMapV256(process.cwd());
    expect(packageJson.scripts.atlas).toBe("node scripts/atlas.mjs");
    expect(Object.keys(packageJson.scripts).length).toBeLessThanOrEqual(45);
    expect(ATLAS_LEGACY_COMMAND_MAP_VERSION).toBe("v256-legacy-command-map");
    expect(Object.keys(legacy)).toHaveLength(353);
    expect(legacy["build:atlas:standalone:current"]).toContain("build-atlas-profile.mjs");
    expect(legacy.atlas).toBeUndefined();
    expect(packageJson.scripts["verify:atlas"]).toBe(legacy["verify:atlas"]);
    expect(packageJson.scripts["build:final-web-release-v180"]).toBeUndefined();
    const cliSource = readFileSync(resolve(process.cwd(), "scripts/atlas.mjs"), "utf8");
    expect(cliSource).toContain('domain === "preflight"');
    expect(cliSource).toContain("run-resource-preflight-v275r1.mjs");
    expect(cliSource).toContain('action === "resource-v275r2"');
    expect(cliSource).toContain('action === "v271-recovery"');
    expect(cliSource).toContain('action === "v271-attempt-negative"');
    expect(cliSource).toContain('action === "v271-closure"');
    expect(cliSource).toContain('action === "local-shadow"');
    expect(readFileSync(resolve(process.cwd(), "scripts/build-atlas-profile.mjs"), "utf8")).toContain('["standalone-full", "vercel-lite", "local-shadow"]');
  });

  it("bridges nested references to removed legacy scripts without rewriting modern scripts", async () => {
    const packageJson = JSON.parse(readFileSync(resolve(process.cwd(), "package.json"), "utf8")) as { scripts: Record<string, string> };
    const {
      loadAtlasLegacyCommandMapV256,
      rewriteAtlasLegacyCommandReferencesV256,
    } = await import("../../scripts/atlas-legacy-command-map-v256.mjs");
    const legacy = loadAtlasLegacyCommandMapV256(process.cwd());
    expect(rewriteAtlasLegacyCommandReferencesV256(
      "npm run verify:atlas && npm run build:final-web-release-v180 && npm run lint",
      legacy,
      packageJson.scripts,
    )).toBe(
      "npm run verify:atlas && npm run atlas -- legacy build:final-web-release-v180 && npm run lint",
    );
  });
});
