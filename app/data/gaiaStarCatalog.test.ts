import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  gaiaColorToRgb,
  gaiaOverlaySelectionScore,
  generatePlaceholderCatalog,
  isGaiaDr3CatalogRow,
  loadGaiaCatalogFromJson,
  rankGaiaStarsForOverlay,
  type GaiaDr3CatalogRow,
} from "./gaiaStarCatalog";

const catalogPath = resolve(process.cwd(), "dist/content-packs/files/core/data/gaia-dr3-bright-5000.json");

describe("Gaia DR3 bright catalog", () => {
  it("ships the offline Gaia DR3 5000-row catalog with v13 fields and filters", () => {
    expect(existsSync(catalogPath)).toBe(true);
    const rows = JSON.parse(readFileSync(catalogPath, "utf8")) as GaiaDr3CatalogRow[];
    expect(rows).toHaveLength(5000);
    for (const row of rows) {
      expect(isGaiaDr3CatalogRow(row)).toBe(true);
      expect(row.parallax).toBeGreaterThan(5);
      expect(row.parallax_over_error).toBeGreaterThanOrEqual(10);
      expect(row.ruwe).toBeLessThan(1.4);
      expect(1000 / row.parallax).toBeLessThan(200);
      for (const key of [
        "ra",
        "dec",
        "parallax",
        "phot_g_mean_mag",
        "bp_rp",
        "parallax_over_error",
        "ruwe",
      ] as const) {
        expect(Number.isFinite(row[key])).toBe(true);
      }
    }
  });

  it("loads Gaia DR3 rows into the renderer catalog and keeps BP-RP color in RGB range", () => {
    const catalog = loadGaiaCatalogFromJson(readFileSync(catalogPath, "utf8"));
    expect(catalog.count).toBe(5000);
    expect(catalog.stars[0]?.sourceId).toMatch(/^\d+$/);
    for (const sample of [catalog.stars[0]!, catalog.stars[1200]!, catalog.stars[4999]!]) {
      expect(sample.parallaxMas).toBeGreaterThan(5);
      const rgb = gaiaColorToRgb(sample.colorBpRp);
      for (const channel of rgb) {
        expect(channel).toBeGreaterThanOrEqual(0);
        expect(channel).toBeLessThanOrEqual(1);
      }
    }
  });

  it("rejects invalid Gaia JSON so the component can fallback to placeholder", () => {
    expect(() =>
      loadGaiaCatalogFromJson(
        JSON.stringify([
          {
            source_id: "bad",
            ra: 1,
            dec: 1,
            parallax: 2,
            phot_g_mean_mag: 5,
            bp_rp: 1,
            parallax_over_error: 2,
            ruwe: 2,
          },
        ]),
      ),
    ).toThrow(/Invalid Gaia catalog row/);
  });

  it("selects Gaia overlay stars deterministically without exceeding the requested budget", () => {
    const catalog = loadGaiaCatalogFromJson(readFileSync(catalogPath, "utf8"));
    const first = rankGaiaStarsForOverlay(catalog.stars, 1800);
    const second = rankGaiaStarsForOverlay(catalog.stars, 1800);

    expect(first).toHaveLength(1800);
    expect(second.map((star) => star.sourceId)).toEqual(first.map((star) => star.sourceId));
    expect(first[0]).toBeDefined();
    expect(gaiaOverlaySelectionScore(first[0]!)).toBeGreaterThanOrEqual(
      gaiaOverlaySelectionScore(first[first.length - 1]!),
    );
  });

  it("generates deterministic placeholder stars for the Gaia fallback path", () => {
    const first = generatePlaceholderCatalog(32);
    const second = generatePlaceholderCatalog(32);

    expect(first.count).toBe(32);
    expect(second.stars).toEqual(first.stars);
    expect(first.stars[14]?.sourceId).toBe("Deneb");
    expect(first.stars[15]?.sourceId).toBe("placeholder_15");
  });
});
