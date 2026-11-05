import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("v275 API and diagnostics boundaries", () => {
  it("applies one unified bounded policy to every Atlas data route", () => {
    const routes = [
      "app/api/atlas/catalog/query/route.ts",
      "app/api/atlas/science-workbench/route.ts",
      "app/api/atlas/science-record/route.ts",
      "app/api/atlas/cosmicflows/route.ts",
      "app/api/atlas/openngc/route.ts",
      "app/api/atlas/weather/route.ts",
      "app/api/atlas/locations/route.ts",
    ];
    for (const route of routes) {
      expect(read(route), route).toContain("consumeAtlasApiPolicyV275");
    }
  });

  it("keeps immutable local payloads async, ETag-bound and path-sanitized", () => {
    const cosmic = read("app/api/atlas/cosmicflows/route.ts");
    const openNgc = read("app/api/atlas/openngc/route.ts");
    expect(cosmic).toContain("readImmutableAtlasFileV275");
    expect(openNgc).toContain("readImmutableAtlasFileV275");
    expect(cosmic).not.toContain("readFileSync");
    expect(openNgc).not.toContain("readFileSync");
    expect(cosmic).toContain("atlasSanitizedUnavailableV275");
    expect(openNgc).toContain("atlasSanitizedUnavailableV275");
  });

  it("runs frozen SQLite lookup off the request thread with a parameterized query", () => {
    const route = read("app/api/atlas/science-record/route.ts");
    const worker = read("app/workers/gaiaScienceRecordQuery.worker.mjs");
    expect(route).toContain("getGaiaScienceRecordQueryServiceV275");
    expect(route).not.toContain("DatabaseSync");
    expect(worker).toContain("WHERE source_id = ?");
    expect(worker).toContain("statement.get(BigInt(sourceId))");
  });

  it("resolves standalone query workers and frozen data from explicit runtime roots", () => {
    const start = read("scripts/start-atlas-standalone.mjs");
    const researchService = read("app/lib/gaiaResearchQueryServiceV271.ts");
    const researchWorker = read("app/workers/gaiaResearchQuery.worker.mjs");
    const recordService = read("app/lib/gaiaScienceRecordQueryServiceV275.ts");
    const recordWorker = read("app/workers/gaiaScienceRecordQuery.worker.mjs");
    expect(start).toContain("process.env.ATLAS_PROJECT_ROOT ??= root");
    expect(start).toContain('readFile(join(root, distDir, "atlas-build-profile.json"), "utf8")');
    expect(start).toContain("process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE ||= await resolveDeliveryProfile()");
    expect(start).toContain('process.env.ATLAS_SERVER_WORKER_ROOT ??= join(standaloneRoot, "app", "workers")');
    expect(start).toContain('join(sourcePublicRoot, "atlas-lite")');
    expect(start).toContain('join(standalonePublicRoot, "atlas-lite")');
    expect(researchService).toContain("process.env.ATLAS_SERVER_WORKER_ROOT");
    expect(recordService).toContain("process.env.ATLAS_SERVER_WORKER_ROOT");
    expect(researchWorker).toContain("resolve(PROJECT_ROOT, manifest.aggregate.path)");
    expect(recordWorker).toContain('resolve(PROJECT_ROOT, "dist/gaia-science-v8/gaia-science-v8.sqlite")');
  });

  it("does not start relativity diagnostics for ordinary research mode", () => {
    const scene = read("app/components/AtlasUniverseSceneRuntime.tsx");
    expect(scene).not.toContain('snapshot.experienceMode === "research"');
    expect(scene).toContain('snapshot.panels.sessions["relativity-observables"].isOpen');
    expect(scene).toContain('snapshot.panels.sessions["kerr-lab"].isOpen');
  });

  it("retains same-origin geolocation, Next hydration and SRI policy", () => {
    const config = read("next.config.mjs");
    expect(config).toContain("geolocation=(self)");
    expect(config).toContain("script-src 'self' 'unsafe-inline'");
    expect(config).toContain('sri: { algorithm: "sha384" }');
  });
});
