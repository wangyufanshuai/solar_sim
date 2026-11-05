import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ASTERISM_LINES } from "../data/asterismCatalog";
import { CONSTELLATION_LINES } from "../data/constellationCatalog";
import { NEBULAE, NEBULAE_V255 } from "../data/nebulaCatalogV255";
import { STAR_CLUSTERS, STAR_CLUSTERS_V255 } from "../data/starClusterCatalogV255";
import { runAtlasGaiaStarfieldExpansionAudit } from "./atlasGaiaStarfieldExpansionV255Runner";

describe("v255 catalog expansion boundary", () => {
  it("keeps historical arrays while exposing the expanded presentation collections", () => {
    expect(CONSTELLATION_LINES).toHaveLength(88);
    expect(ASTERISM_LINES).toHaveLength(32);
    expect(NEBULAE).toHaveLength(80);
    expect(NEBULAE_V255).toHaveLength(128);
    expect(STAR_CLUSTERS).toHaveLength(44);
    expect(STAR_CLUSTERS_V255).toHaveLength(96);
    expect(ASTERISM_LINES.every((entry) => entry.isOfficialConstellation === false)).toBe(true);
  });

  it("reports the v255 budgets and immutable physics boundary", () => {
    const result = runAtlasGaiaStarfieldExpansionAudit({ gaiaRowCount: 46_000 });
    expect(result.audits.every((audit) => audit.status === "ready")).toBe(true);
    expect(result.summary.renderBudget).toMatchObject({ mobile: 1000, balanced: 4000, dense: 8000, closeup: 1200 });
    expect(result.summary.livePhysicsMutation).toBe("not-applied");
    expect(result.summary.workerPhysicsMutation).toBe("not-applied");
  });

  it("locks the generated Gaia row count and source/output provenance", () => {
    const dataPath = resolve(process.cwd(), "public/data/gaia-dr3-nearby-46000-v255.json");
    const manifestPath = resolve(process.cwd(), "dist/science/gaia-dr3-nearby-46000-v255.manifest.json");
    expect(existsSync(dataPath)).toBe(true);
    expect(existsSync(manifestPath)).toBe(true);
    const rows = JSON.parse(readFileSync(dataPath, "utf8")) as unknown[];
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as { rowCount?: number; candidateCount?: number; trustedBoundary?: string };
    expect(rows).toHaveLength(46_000);
    expect(manifest.rowCount).toBe(46_000);
    expect(manifest.candidateCount).toBe(46_748);
    expect(manifest.trustedBoundary).toContain("not the full Gaia archive");
  });

  it("publishes a separate dynamic expansion evidence surface", () => {
    const evidencePath = resolve(process.cwd(), "dist/science/catalog-expansion-v255.json");
    expect(existsSync(evidencePath)).toBe(true);
    const evidence = JSON.parse(readFileSync(evidencePath, "utf8")) as {
      version?: string;
      visualCounts?: Record<string, number>;
      activeRenderBudget?: Record<string, number>;
      livePhysicsMutation?: string;
    };
    expect(evidence.version).toBe("v255-catalog-expansion");
    expect(evidence.visualCounts).toMatchObject({ iauConstellations: 88, asterisms: 32, starClusters: 96, nebulae: 128 });
    expect(evidence.activeRenderBudget).toMatchObject({ mobile: 1000, balanced: 4000, dense: 8000, closeup: 1200 });
    expect(evidence.livePhysicsMutation).toBe("not-applied");
  });
});
