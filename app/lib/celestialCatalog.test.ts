import { describe, expect, it } from "vitest";
import {
  CELESTIAL_CATALOG_ENTRIES,
  CELESTIAL_CATALOG_VERSION,
  CELESTIAL_DEEP_SKY_NAVIGATION_VERSION,
  celestialCatalogLabelEntries,
  celestialEntryToDirection,
  createCelestialObjectPassport,
  createCelestialCatalogSummary,
  createCelestialVisualLayerSummary,
  selectCelestialCatalogEntry,
} from "./celestialCatalog";
import type {
  CelestialCatalogSource,
  CelestialObjectKind,
} from "./simulationDiagnosticsTypes";

const VALID_KINDS = new Set<CelestialObjectKind>([
  "nearby-star",
  "bright-star",
  "nebula",
  "star-cluster",
  "galaxy",
  "pulsar",
  "constellation",
]);

const VALID_SOURCES = new Set<CelestialCatalogSource>([
  "curated-local-v22",
  "gaia-dr3",
  "iau-constellation-lines",
  "messier-ngc-curated",
]);

describe("Celestial Catalog Atlas v22", () => {
  it("creates unique finite catalog entries with valid kinds, sources and colors", () => {
    const ids = new Set<string>();

    for (const entry of CELESTIAL_CATALOG_ENTRIES) {
      expect(ids.has(entry.id)).toBe(false);
      ids.add(entry.id);
      expect(VALID_KINDS.has(entry.kind)).toBe(true);
      expect(VALID_SOURCES.has(entry.source)).toBe(true);
      expect(entry.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(entry.primaryName).toBeTruthy();
      expect(entry.catalogName).toBeTruthy();
      expect(entry.searchText).toContain(entry.kind);

      if (entry.raHours != null) {
        expect(Number.isFinite(entry.raHours)).toBe(true);
        expect(entry.raHours).toBeGreaterThanOrEqual(0);
        expect(entry.raHours).toBeLessThan(24);
      }
      if (entry.decDeg != null) {
        expect(Number.isFinite(entry.decDeg)).toBe(true);
        expect(entry.decDeg).toBeGreaterThanOrEqual(-90);
        expect(entry.decDeg).toBeLessThanOrEqual(90);
      }

      const direction = celestialEntryToDirection(entry);
      expect(direction).not.toBeNull();
      expect(direction?.every(Number.isFinite)).toBe(true);
    }
  });

  it("preserves all 88 IAU constellation navigation entries", () => {
    const constellations = CELESTIAL_CATALOG_ENTRIES.filter(
      (entry) => entry.kind === "constellation",
    );

    expect(constellations).toHaveLength(88);
    for (const constellation of constellations) {
      expect(constellation.source).toBe("iau-constellation-lines");
      expect(constellation.metadata).toContain("guide points");
      expect(celestialEntryToDirection(constellation)?.every(Number.isFinite)).toBe(true);
    }
  });

  it("keeps nebulae, clusters and galaxies inside reasonable static catalog ranges", () => {
    const deepSky = CELESTIAL_CATALOG_ENTRIES.filter((entry) =>
      ["nebula", "star-cluster", "galaxy"].includes(entry.kind),
    );

    expect(deepSky.length).toBeGreaterThan(20);
    for (const entry of deepSky) {
      expect(entry.distancePc).not.toBeNull();
      expect(entry.distancePc!).toBeGreaterThan(0);
      expect(entry.distancePc!).toBeLessThan(20_000_000);
      expect(entry.angularSizeArcmin).not.toBeNull();
      expect(entry.angularSizeArcmin!).toBeGreaterThan(0);
      expect(entry.angularSizeArcmin!).toBeLessThan(1_000);
      if (entry.magV != null) {
        expect(Number.isFinite(entry.magV)).toBe(true);
        expect(entry.magV).toBeGreaterThan(-2);
        expect(entry.magV).toBeLessThan(20);
      }
    }
  });

  it("summarizes entry counts, kind breakdown, source breakdown and quality checks", () => {
    const summary = createCelestialCatalogSummary();

    expect(summary.version).toBe(CELESTIAL_CATALOG_VERSION);
    expect(summary.entryCount).toBe(CELESTIAL_CATALOG_ENTRIES.length);
    expect(summary.entryCount).toBeGreaterThan(150);
    expect(summary.kindBreakdown.constellation).toBe(88);
    expect(summary.kindBreakdown.galaxy).toBeGreaterThanOrEqual(10);
    expect(summary.kindBreakdown.nebula).toBeGreaterThan(0);
    expect(summary.kindBreakdown["star-cluster"]).toBeGreaterThan(0);
    expect(summary.sourceBreakdown["iau-constellation-lines"]).toBe(88);
    expect(summary.sourceBreakdown["messier-ngc-curated"]).toBeGreaterThan(20);
    expect(summary.qualityChecks.uniqueIds).toBe(true);
    expect(summary.qualityChecks.finiteCoordinates).toBe(true);
    expect(summary.trustedBoundary).toContain("SIMBAD");
    expect(summary.trustedBoundary).toContain("VizieR");
  });

  it("includes the browser acceptance target objects", () => {
    const ids = new Set(CELESTIAL_CATALOG_ENTRIES.map((entry) => entry.id));
    const searchText = CELESTIAL_CATALOG_ENTRIES.map((entry) => entry.searchText).join("\n");

    expect(ids.has("nearby-star:sirius")).toBe(true);
    expect(ids.has("nebula:m42")).toBe(true);
    expect(ids.has("star-cluster:m45")).toBe(true);
    expect(ids.has("galaxy:m31")).toBe(true);
    expect(ids.has("constellation:UMa")).toBe(true);
    expect(searchText).toContain("sirius");
    expect(searchText).toContain("orion nebula");
    expect(searchText).toContain("pleiades");
    expect(searchText).toContain("andromeda galaxy");
    expect(searchText).toContain("ursa major");
  });

  it("includes v33 curated deep-sky navigation additions", () => {
    const ids = new Set(CELESTIAL_CATALOG_ENTRIES.map((entry) => entry.id));
    const searchText = CELESTIAL_CATALOG_ENTRIES.map((entry) => entry.searchText).join("\n");

    for (const id of [
      "nebula:ngc1499",
      "nebula:ic2118",
      "nebula:ic5146",
      "nebula:ngc6888",
      "star-cluster:m11",
      "star-cluster:m46",
      "star-cluster:m67",
      "star-cluster:ngc7789",
      "galaxy:m83",
      "galaxy:m106",
      "galaxy:m94",
      "galaxy:ngc300",
      "galaxy:ngc55",
    ]) {
      expect(ids.has(id)).toBe(true);
      const entry = selectCelestialCatalogEntry(id);
      expect(entry?.distancePc).toBeGreaterThan(0);
      expect(entry?.angularSizeArcmin).toBeGreaterThan(0);
      expect(celestialEntryToDirection(entry!)).not.toBeNull();
    }

    expect(searchText).toContain("california nebula");
    expect(searchText).toContain("cocoon nebula");
    expect(searchText).toContain("southern pinwheel galaxy");
    expect(searchText).toContain("wild duck cluster");
    expect(searchText).toContain("m67");
  });

  it("summarizes v33 visual layer state and keeps selected labels visible under density caps", () => {
    const summary = createCelestialVisualLayerSummary({
      selectedCatalogId: "galaxy:m83",
      showDeepSkyObjects: true,
      showCatalogLabels: true,
      orbitAtlas: true,
      mobile: true,
    });
    const labels = celestialCatalogLabelEntries({
      selectedCatalogId: "galaxy:m83",
      orbitAtlas: true,
      mobile: true,
    });
    const hiddenLabelsSummary = createCelestialVisualLayerSummary({
      selectedCatalogId: "galaxy:m83",
      showCatalogLabels: false,
      orbitAtlas: true,
      mobile: true,
    });
    const invalidSummary = createCelestialVisualLayerSummary({
      selectedCatalogId: "missing",
      showCatalogLabels: true,
    });

    expect(summary.version).toBe(CELESTIAL_DEEP_SKY_NAVIGATION_VERSION);
    expect(summary.selectedId).toBe("galaxy:m83");
    expect(summary.selectedKind).toBe("galaxy");
    expect(summary.selectedTitle).toBe("Southern Pinwheel Galaxy");
    expect(summary.maxLabelCount).toBe(6);
    expect(summary.labelCount).toBeLessThanOrEqual(6);
    expect(summary.layerState).toContain("deep-sky:on");
    expect(summary.layerState).toContain("viewport:mobile");
    expect(labels.map((entry) => entry.id)).toContain("galaxy:m83");
    expect(labels.length).toBeLessThanOrEqual(6);
    expect(hiddenLabelsSummary.labelCount).toBe(1);
    expect(invalidSummary.selectedId).toBe("");
    expect(invalidSummary.labelCount).toBeGreaterThan(0);
  });

  it("creates v23 object passports with source, metrics, sections and boundaries", () => {
    const passport = createCelestialObjectPassport("galaxy:m31");

    expect(passport?.version).toBe("v23-object-passports");
    expect(passport?.objectId).toBe("galaxy:m31");
    expect(passport?.title).toBe("Andromeda Galaxy");
    expect(passport?.kind).toBe("galaxy");
    expect(passport?.relatedEvidenceClaimId).toBe("celestial-catalog-atlas");
    expect(passport?.sourceChain).toEqual(
      expect.arrayContaining(["Messier/NGC curated", "M31 / NGC 224"]),
    );
    expect(passport?.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "ra-dec", value: expect.stringContaining("0.712h") }),
        expect.objectContaining({ id: "distance", value: expect.stringContaining("778.00 kpc") }),
        expect.objectContaining({ id: "visual-magnitude", value: "3.4" }),
        expect.objectContaining({ id: "angular-size", value: "190 arcmin" }),
      ]),
    );
    expect(passport?.sections.map((section) => section.id)).toEqual(
      expect.arrayContaining([
        "identity",
        "source-chain",
        "coordinates",
        "observables",
        "provenance",
        "trusted-boundary",
        "related-evidence",
      ]),
    );
    expect(passport?.sections.find((section) => section.id === "trusted-boundary")?.body).toContain("SIMBAD");
    expect(passport?.sections.find((section) => section.id === "trusted-boundary")?.body).toContain("SolarSystemIntegrator");
  });

  it("creates constellation and nebula passports without physical-body claims", () => {
    const constellation = createCelestialObjectPassport(selectCelestialCatalogEntry("constellation:UMa"));
    const nebula = createCelestialObjectPassport("nebula:m42");

    expect(constellation?.kind).toBe("constellation");
    expect(constellation?.metrics).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "ra-dec" })]),
    );
    expect(constellation?.sections.find((section) => section.id === "trusted-boundary")?.body).toContain(
      "not physical structures",
    );
    expect(nebula?.kind).toBe("nebula");
    expect(nebula?.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "galactic-lb" }),
        expect.objectContaining({ id: "angular-size" }),
      ]),
    );
    expect(nebula?.limitations.join(" ")).toContain("Not inserted into SolarSystemIntegrator");
  });

  it("returns null for invalid object passport ids", () => {
    expect(selectCelestialCatalogEntry("missing")).toBeNull();
    expect(createCelestialObjectPassport("missing")).toBeNull();
    expect(createCelestialObjectPassport(null)).toBeNull();
  });
});
