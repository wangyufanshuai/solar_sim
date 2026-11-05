import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { MAINLINE_A_CURRENT_STARS } from "../data/mainlineAMetadataV607";
import { getMainlineA1CatalogId, getMainlineA1ObjectByCatalogId } from "../data/mainlineARegistryV607";
import { createCelestialObjectPassport } from "./celestialCatalog";
import MainlineAStellarAtlasV608 from "../components/MainlineAStellarAtlasV608";
import MainlineAStellarPortraitV607 from "../components/MainlineAStellarPortraitV607";
import { selectStellarAtlasStars, stellarAtlasColor, stellarAtlasGeometry, stellarAtlasReferenceRadius, stellarAtlasFocusTarget } from "./mainlineAStellarAtlasV608";
import { selectedSkyTargetDescriptor } from "./selectedSkyTarget";

const stars = MAINLINE_A_CURRENT_STARS;
const defaults = { family: "all", search: "", order: "catalog" } as const;

describe("stellar atlas comparison and navigation", () => {
  it("preserves Alpha Centauri B and every named identity through scene focus", () => {
    for (const star of stars) {
      const target = stellarAtlasFocusTarget(star);
      expect(selectedSkyTargetDescriptor(target.catalogId, [])?.id).toBe(`stellar-hero:${star.id}`);
      expect(Math.hypot(...target.direction)).toBeCloseTo(1, 12);
    }
    expect(() => stellarAtlasFocusTarget({ ...stars[0], science: { coordinateFrame: "ICRS-J2000" } })).toThrow("Missing stellar focus coordinates");
  });
  it("has twenty source-backed portraits and retains physical writeback boundaries", () => {
    expect(stars).toHaveLength(20);
    for (const star of stars) {
      expect(star.evidence.scientificPayloadWriteback).toBe(false);
      expect(star.evidence.gaiaAssociation.namedStarIdentityConfirmed).toBe(false);
      expect(star.evidence.referenceDistance.parallaxMas).toBeGreaterThan(0);
      expect(star.narrative.detailCn.length).toBeGreaterThan(100);
    }
  });
  it("resolves every portrait through the real catalog and passport", () => {
    for (const star of stars) {
      const id = getMainlineA1CatalogId(star.id)!;
      expect(id, star.id).toBeTruthy();
      expect(createCelestialObjectPassport(id), star.id).not.toBeNull();
      expect(getMainlineA1ObjectByCatalogId(id)?.id).toBe(star.id);
    }
  });
  it("partitions temperature families without dropping or duplicating stars", () => {
    const partition = ["cool", "warm", "hot"].flatMap((family) => selectStellarAtlasStars(stars, { ...defaults, family: family as "cool" | "warm" | "hot" }));
    expect(partition).toHaveLength(stars.length);
    expect(new Set(partition.map((star) => star.id)).size).toBe(stars.length);
  });
  it("filters flattened stars, Chinese narrative text and empty results", () => {
    expect(selectStellarAtlasStars(stars, { ...defaults, family: "flattened" }).some((star) => star.id === "achernar")).toBe(true);
    expect(selectStellarAtlasStars(stars, { ...defaults, search: "河鼓二" }).map((star) => star.id)).toEqual(["altair"]);
    expect(selectStellarAtlasStars(stars, { ...defaults, search: "not-a-star" })).toEqual([]);
    expect(selectStellarAtlasStars(stars, { ...defaults, search: " ALTAIR " })[0].id).toBe("altair");
  });
  it("sorts numeric values without mutating the runtime catalog", () => {
    const before = stars.map((star) => star.id);
    const sorted = selectStellarAtlasStars(stars, { ...defaults, order: "radius" });
    expect(sorted[0].artDirection.radiusSolar).toBeLessThan(sorted.at(-1)!.artDirection.radiusSolar);
    expect(stars.map((star) => star.id)).toEqual(before);
  });
  it("uses linear radius scaling and keeps subpixel stars below one pixel", () => {
    const maximum = stellarAtlasReferenceRadius(stars);
    const small = stars.find((star) => star.id === "alpha-centauri-b")!;
    const large = stars.find((star) => star.artDirection.radiusSolar === maximum)!;
    const a = stellarAtlasGeometry(small, "shared-radius", maximum);
    const b = stellarAtlasGeometry(large, "shared-radius", maximum);
    expect(b.rx).toBe(34);
    expect(a.rx / b.rx).toBeCloseTo(small.artDirection.radiusSolar / large.artDirection.radiusSolar, 12);
    expect(a.subpixel).toBe(true);
    expect(a.rx).toBeLessThan(1);
  });
  it("normalizes size while preserving the declared flattening ratio", () => {
    for (const star of stars) {
      const geometry = stellarAtlasGeometry(star, "normalized", 1000);
      expect(geometry.rx).toBe(34);
      expect(geometry.rx / geometry.ry).toBeCloseTo(star.artDirection.equatorialPolarRadiusRatio, 10);
    }
  });
  it("handles invalid display parameters without non-finite SVG geometry", () => {
    const invalid = { ...stars[0], artDirection: { ...stars[0].artDirection, radiusSolar: Number.NaN } };
    expect(stellarAtlasGeometry(invalid, "shared-radius", 0)).toEqual({ rx: 0, ry: 0, subpixel: true });
    expect(stellarAtlasColor(Number.NaN)).toBe("#a8afbb");
    expect(stellarAtlasReferenceRadius([])).toBe(0);
  });
  it("renders the actual atlas with twenty distinct selectable cards", () => {
    const html = renderToStaticMarkup(createElement(MainlineAStellarAtlasV608, { onClose() {}, onFocus() {} }));
    expect((html.match(/data-mainline-a-atlas-star=/g) ?? [])).toHaveLength(20);
    expect(html).toContain("统一半径比例");
    expect(html).toContain("在星空中定位");
    expect(html).toContain('data-mainline-a-atlas-selected="altair"');
    expect(html).toContain("非观测表面");
  });
  it("renders all new portraits with unique semantic object identity", () => {
    for (const star of stars.slice(12)) {
      const html = renderToStaticMarkup(createElement(MainlineAStellarPortraitV607, { objectId: star.id, title: star.displayName, profile: star.artDirection }));
      expect(html).toContain(`data-mainline-a-stellar-portrait="${star.id}"`);
      expect(html).toContain(star.displayName);
      expect(html).toContain("非已解析的真实表面");
    }
  });
});
