import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { MAINLINE_A1_CONSTELLATIONS, MAINLINE_A1_COVERAGE, MAINLINE_A1_NEBULAE, MAINLINE_A1_STARS, MAINLINE_A_CURRENT_CONSTELLATIONS, MAINLINE_A_CURRENT_COVERAGE, MAINLINE_A_CURRENT_STARS } from "./mainlineAMetadataV607";
import { getMainlineA1CatalogId, getMainlineA1Object, getMainlineA1ObjectByCatalogId, MAINLINE_A1_OBJECTS, MAINLINE_A_CURRENT_OBJECTS, resolveMainlineAPassportCatalogId } from "./mainlineARegistryV607";
import { createCelestialObjectPassport, selectCelestialCatalogEntry } from "../lib/celestialCatalog";
import { CONSTELLATION_LINES } from "./constellationCatalog";
import { NEBULAE } from "./nebulaCatalog";
import { ALL_BRIGHT_STARS } from "./brightStarCatalog";
import { STELLAR_HEROES_V592 } from "./stellarHeroesV592.generated";
import { NEBULA_VISUAL_ASSETS_V592 } from "./nebulaVisualAssetsV592.generated";
import { NEBULA_EXTENDED_VISUAL_ASSETS_V592 } from "./nebulaExtendedVisualAssetsV592.generated";
import { NEBULA_CLOSURE_VISUAL_ASSETS_V592 } from "./nebulaClosureVisualAssetsV592.generated";
import { isMainlineAExplicitlyClearedLicenseV607, MAINLINE_A1_ASSET_COVERAGE_SUMMARY, MAINLINE_A1_NEBULA_ASSET_COVERAGE } from "./mainlineAAssetCoverageV607";
import { MAINLINE_A1_IAU_BOUNDARIES } from "./mainlineAConstellationBoundaryDataV607";

const unique = (ids: string[]) => new Set(ids).size === ids.length;
const acceptanceSnapshot = JSON.parse(readFileSync(new URL("../../docs/release/v607/mainline-a-stage-a1-acceptance.json", import.meta.url), "utf8")) as {
  evidence: { firstSet: { constellations: number; nebulae: number; stars: number; registryObjects: number }; nebulaAssetCoverage: { firstSet: number; catalogMarkers: number; manifestCandidates: number; licensed: number } };
};
describe("Mainline A stage A1 metadata", () => {
  it("contains the first implementation set", () => {
    expect(MAINLINE_A1_CONSTELLATIONS).toHaveLength(4);
    expect(MAINLINE_A1_NEBULAE).toHaveLength(12);
    expect(MAINLINE_A1_STARS).toHaveLength(6);
  });
  it("keeps the acceptance snapshot aligned with live metadata counts", () => {
    expect(acceptanceSnapshot.evidence.firstSet).toEqual({ constellations: MAINLINE_A1_CONSTELLATIONS.length, nebulae: MAINLINE_A1_NEBULAE.length, stars: MAINLINE_A1_STARS.length, registryObjects: MAINLINE_A1_OBJECTS.length });
    expect(acceptanceSnapshot.evidence.nebulaAssetCoverage).toEqual({ firstSet: MAINLINE_A1_ASSET_COVERAGE_SUMMARY.total, catalogMarkers: MAINLINE_A1_ASSET_COVERAGE_SUMMARY.catalogMarkers, manifestCandidates: MAINLINE_A1_ASSET_COVERAGE_SUMMARY.manifestCandidates, licensed: MAINLINE_A1_ASSET_COVERAGE_SUMMARY.licensed });
  });
  it("keeps object identifiers unique and provenance attached", () => {
    expect(unique(MAINLINE_A1_CONSTELLATIONS.map((x) => x.id))).toBe(true);
    expect(unique(MAINLINE_A1_NEBULAE.map((x) => x.id))).toBe(true);
    expect(unique(MAINLINE_A1_STARS.map((x) => x.id))).toBe(true);
    expect([...MAINLINE_A1_CONSTELLATIONS, ...MAINLINE_A1_NEBULAE, ...MAINLINE_A1_STARS].every((x) => x.provenance.length > 0)).toBe(true);
  });
  it("keeps the additive current hero roster separate from the historical A1 receipt", () => {
    expect(MAINLINE_A1_STARS).toHaveLength(6);
    expect(MAINLINE_A_CURRENT_STARS).toHaveLength(20);
    expect(MAINLINE_A1_OBJECTS).toHaveLength(22);
    expect(MAINLINE_A_CURRENT_OBJECTS).toHaveLength(44);
    expect(MAINLINE_A_CURRENT_CONSTELLATIONS).toHaveLength(12);
    expect(MAINLINE_A_CURRENT_COVERAGE).toMatchObject({ constellationCount: 12, nebulaCount: 12, starCount: 20, stellarPortraitAuthority: "presentation-model-only" });
    expect(MAINLINE_A_CURRENT_STARS.map((star) => star.id)).toEqual([
      "alpha-centauri-a", "achernar", "betelgeuse", "sirius-a", "rigel", "antares",
      "canopus", "arcturus", "vega", "capella-a", "procyon-a", "aldebaran",
      "alpha-centauri-b", "hadar", "altair", "pollux", "fomalhaut", "deneb", "bellatrix", "alnilam",
    ]);
    for (const star of MAINLINE_A_CURRENT_STARS) {
      expect(star.narrative.detailCn.length, star.id).toBeGreaterThan(100);
      expect(star.evidence.sources.length, star.id).toBeGreaterThanOrEqual(2);
      expect(star.evidence.referenceDistance.sourceId, star.id).toBeTruthy();
      expect(star.evidence.gaiaAssociation.namedStarIdentityConfirmed, star.id).toBe(false);
      expect(star.evidence.scientificPayloadWriteback, star.id).toBe(false);
    }
  });
  it("enforces the shared data-art-narrative-source contract", () => {
    for (const object of MAINLINE_A1_OBJECTS) {
      expect(object.displayName.length, object.id).toBeGreaterThan(0);
      expect(object.narrative.titleCn.length, object.id).toBeGreaterThan(0);
      expect(object.narrative.summaryCn.length, object.id).toBeGreaterThan(0);
      expect(object.narrative.detailCn.length, object.id).toBeGreaterThan(0);
      expect(object.narrative.caveatsCn.length, object.id).toBeGreaterThan(0);
      expect(object.presentation.visualMode, object.id).toMatch(/^(line|marker|texture|photosphere)$/);
      expect(object.presentation.assetStatus, object.id).toMatch(/^(none|catalog-marker|manifest-candidate|licensed)$/);
      expect(object.provenance.every((source) => source.sourceId && /^https?:\/\//.test(source.sourceUrl) && source.retrievedAt && source.license), object.id).toBe(true);
    }
  });
  it("states known evidence boundaries", () => {
    expect(MAINLINE_A1_COVERAGE.formalBoundaries).toBe("iau-j2000-ingested-first-set");
    expect(MAINLINE_A1_COVERAGE.nebulaTextureRights).toBe("six-cleared-six-pending");
    expect(MAINLINE_A1_CONSTELLATIONS.every((x) => x.boundaryStatus === "available")).toBe(true);
    expect(MAINLINE_A1_CONSTELLATIONS.every((x) => x.boundaryJ2000[0]?.length >= 3)).toBe(true);
    expect(MAINLINE_A1_NEBULAE.filter((x) => x.presentation.assetStatus === "licensed")).toHaveLength(6);
    expect(MAINLINE_A1_NEBULAE.filter((x) => x.presentation.assetStatus === "catalog-marker")).toHaveLength(6);
  });
  it("offers one stable registry for later stages", () => {
    expect(MAINLINE_A1_OBJECTS).toHaveLength(22);
    expect(getMainlineA1Object("m42")?.kind).toBe("nebula");
    expect(getMainlineA1ObjectByCatalogId("nebula:m42")?.displayName).toBe("Orion Nebula");
    expect(getMainlineA1ObjectByCatalogId("constellation:Ori")?.kind).toBe("constellation");
    expect(getMainlineA1ObjectByCatalogId("nebula:Ori")).toBeUndefined();
    expect(getMainlineA1Object("missing")).toBeUndefined();
  });
  it("resolves navigation targets against the real runtime catalog", () => {
    for (const object of MAINLINE_A1_OBJECTS.filter((candidate) => ["Ori", "Sco", "m42", "betelgeuse", "rigel", "antares"].includes(candidate.id))) {
      const catalogId = getMainlineA1CatalogId(object.id);
      expect(selectCelestialCatalogEntry(catalogId), object.id).not.toBeNull();
      expect(getMainlineA1ObjectByCatalogId(catalogId!)?.id).toBe(object.id);
    }
    expect(getMainlineA1ObjectByCatalogId("galaxy:Ori")).toBeUndefined();
    expect(getMainlineA1CatalogId("missing")).toBeUndefined();
  });
  it("maps all six roster hero identities to real passports without changing focus IDs", () => {
    for (const star of MAINLINE_A1_STARS) {
      const heroId = `stellar-hero:${star.id}`;
      const catalogId = resolveMainlineAPassportCatalogId(heroId);
      expect(catalogId).toBe(getMainlineA1CatalogId(star.id));
      expect(selectCelestialCatalogEntry(catalogId), star.id).not.toBeNull();
      expect(createCelestialObjectPassport(catalogId), star.id).not.toBeNull();
      expect(resolveMainlineAPassportCatalogId(catalogId)).toBe(catalogId);
    }
  });
  it("maps the six additive hero identities through explicit nearby-star aliases", () => {
    for (const star of MAINLINE_A_CURRENT_STARS.slice(6)) {
      const catalogId = getMainlineA1CatalogId(star.id);
      expect(catalogId).toBe(`nearby-star:${star.id === "capella-a" ? "capella" : star.id === "procyon-a" ? "procyon" : star.id}`);
      expect(selectCelestialCatalogEntry(catalogId), star.id).not.toBeNull();
      expect(getMainlineA1ObjectByCatalogId(catalogId)?.id).toBe(star.id);
      expect(resolveMainlineAPassportCatalogId(`stellar-hero:${star.id}`)).toBe(catalogId);
      expect(createCelestialObjectPassport(catalogId), star.id).not.toBeNull();
      expect(star.evidence.gaiaAssociation.namedStarIdentityConfirmed).toBe(false);
      expect(star.artDirection.representation).toBe("parametric-photosphere");
    }
    expect(getMainlineA1Object("canopus")?.id).toBe("canopus");
    expect(getMainlineA1Object("capella-a")?.id).toBe("capella-a");
  });
  it("matches the checked-in source inventory", () => {
    expect(CONSTELLATION_LINES).toHaveLength(88);
    expect(NEBULAE).toHaveLength(80);
    expect(ALL_BRIGHT_STARS).toHaveLength(369);
    expect(STELLAR_HEROES_V592).toHaveLength(24);
    expect(NEBULA_VISUAL_ASSETS_V592.length + NEBULA_EXTENDED_VISUAL_ASSETS_V592.length + NEBULA_CLOSURE_VISUAL_ASSETS_V592.length).toBe(18);
  });
  it("ships constellation-specific narrative hooks for A2", () => {
    expect(MAINLINE_A1_CONSTELLATIONS.every((x) => x.narrative.detailCn.length >= 30)).toBe(true);
    expect(MAINLINE_A1_CONSTELLATIONS.find((x) => x.id === "Ori")?.narrative.detailCn).toContain("M42");
    expect(MAINLINE_A1_CONSTELLATIONS.find((x) => x.id === "Sco")?.narrative.detailCn).toContain("心宿二");
    expect(MAINLINE_A1_CONSTELLATIONS.find((x) => x.id === "Ori")?.relatedObjectIds).toEqual(["m42", "betelgeuse", "rigel"]);
    expect(MAINLINE_A1_STARS.find((x) => x.id === "antares")?.relatedObjectIds).toEqual(["Sco"]);
  });
  it("ships explicit bilingual identity, seasonal guidance, and representative stars for all four A2 cards", () => {
    for (const constellation of MAINLINE_A1_CONSTELLATIONS) {
      expect(constellation.nameEn, constellation.id).toBe(constellation.displayName);
      expect(constellation.nameCn, constellation.id).toBe(constellation.narrative.titleCn);
      expect(constellation.visibleSeasonCn.length, constellation.id).toBeGreaterThan(0);
      expect(constellation.representativeStars.length, constellation.id).toBeGreaterThanOrEqual(3);
      expect(constellation.representativeStars.every((star) => star.includes(" / ")), constellation.id).toBe(true);
      expect(constellation.provenance.length, constellation.id).toBeGreaterThanOrEqual(2);
    }
  });
  it("keeps every cross-object relation inside the stable registry", () => {
    for (const object of MAINLINE_A1_OBJECTS) {
      for (const relatedId of object.relatedObjectIds ?? []) {
        expect(getMainlineA1Object(relatedId), `${object.id} -> ${relatedId}`).toBeDefined();
      }
    }
  });
  it("keeps external catalog relations resolvable", () => {
    const m1 = MAINLINE_A1_NEBULAE.find((object) => object.id === "m1");
    expect(m1?.relatedCatalogIds).toEqual(["pulsar:b0531+21"]);
    expect(m1?.relatedCatalogIds?.every((catalogId) => selectCelestialCatalogEntry(catalogId))).toBe(true);
  });
  it("contains the four checked-in IAU boundary rings", () => {
    expect(Object.keys(MAINLINE_A1_IAU_BOUNDARIES).sort()).toEqual(["Cas", "Ori", "Sco", "UMa"].sort());
    expect(Object.values(MAINLINE_A1_IAU_BOUNDARIES).every((vertices) => vertices.length >= 3)).toBe(true);
  });
  it("keeps stellar art direction explicitly parametric", () => {
    expect(MAINLINE_A1_STARS.every((star) => star.artDirection.representation === "parametric-photosphere")).toBe(true);
    expect(MAINLINE_A1_STARS.every((star) => Number.isFinite(star.artDirection.colorTemperatureK) && star.artDirection.radiusSolar > 0)).toBe(true);
  });
  it("keeps stellar science and presentation parameters finite", () => {
    for (const star of MAINLINE_A1_STARS) {
      expect(Number.isFinite(star.science.raDeg), star.id).toBe(true);
      expect(Number.isFinite(star.science.decDeg), star.id).toBe(true);
      expect(Number.isFinite(star.science.distancePc) && star.science.distancePc! > 0, star.id).toBe(true);
      expect(Number.isFinite(star.temperatureK) && star.temperatureK! > 0, star.id).toBe(true);
      expect(Number.isFinite(star.artDirection.luminositySolar) && star.artDirection.luminositySolar > 0, star.id).toBe(true);
      expect(star.artDirection.equatorialPolarRadiusRatio >= 1, star.id).toBe(true);
    }
  });
  it("keeps stellar evidence layers separate from the parametric art model", () => {
    for (const star of MAINLINE_A1_STARS) {
      const { observed, catalogDerived, model, artisticInference } = star.factLayers;
      expect(observed.length, star.id).toBeGreaterThanOrEqual(2);
      expect(observed.join(" "), star.id).toContain("SIMBAD 编纂视差");
      expect(observed.join(" "), star.id).not.toContain("Gaia DR3 source_id");
      expect(catalogDerived.length, star.id).toBeGreaterThanOrEqual(2);
      expect(catalogDerived.join(" "), star.id).toContain("ICRS-J2000");
      expect(catalogDerived.join(" "), star.id).toContain("目录 V 波段视星等");
      expect(catalogDerived.join(" "), star.id).toContain(`Gaia DR3 source_id：${star.gaiaSourceId}`);
      expect(catalogDerived.join(" "), star.id).not.toContain("Gaia 视星等 V");
      expect(model.length, star.id).toBeGreaterThanOrEqual(2);
      expect(model.join(" "), star.id).toContain("参数化");
      expect(artisticInference.length, star.id).toBeGreaterThanOrEqual(2);
      expect(artisticInference.join(" "), star.id).toContain("不是解析表面");
      expect(artisticInference.join(" ")).not.toContain("Gaia DR3 source_id");
    }
  });
  it("keeps nebula rights coverage explicit", () => {
    expect(MAINLINE_A1_NEBULA_ASSET_COVERAGE).toHaveLength(12);
    expect(MAINLINE_A1_ASSET_COVERAGE_SUMMARY.total).toBe(12);
    expect(MAINLINE_A1_ASSET_COVERAGE_SUMMARY.catalogMarkers).toBe(6);
    expect(MAINLINE_A1_ASSET_COVERAGE_SUMMARY.manifestCandidates).toBe(0);
    expect(MAINLINE_A1_ASSET_COVERAGE_SUMMARY.licensed).toBe(6);
    expect(MAINLINE_A1_NEBULA_ASSET_COVERAGE.filter((row) => row.status === "licensed").map((row) => row.objectId)).toEqual(["m42", "m1", "m8", "m16", "m20", "m57"]);
    expect(MAINLINE_A1_NEBULAE.filter((row) => row.presentation.assetStatus === "licensed").map((row) => row.id)).toEqual(["m42", "m1", "m8", "m16", "m20", "m57"]);
    expect(MAINLINE_A1_NEBULAE.filter((row) => row.presentation.assetStatus === "licensed").every((row) => row.presentation.assetId)).toBe(true);
    expect(MAINLINE_A1_NEBULAE.every((row) => row.observationEncoding?.nakedEyeRepresentationClaimed === false)).toBe(true);
    expect(MAINLINE_A1_NEBULAE.filter((row) => row.presentation.assetStatus === "licensed").every((row) => row.observationEncoding?.bands.length > 0)).toBe(true);
    expect(MAINLINE_A1_NEBULAE.filter((row) => row.presentation.assetStatus === "catalog-marker").every((row) => row.observationEncoding?.bands.length === 0)).toBe(true);
  });
  it("attaches the reviewed license only to the six delivered images", () => {
    expect(MAINLINE_A1_NEBULAE.find((row) => row.id === "m42")?.provenance[0]?.sourceUrl).toBe("https://esahubble.org/images/opo0205d/");
    expect(MAINLINE_A1_NEBULAE.find((row) => row.id === "m1")?.provenance[0]?.sourceUrl).toBe("https://esahubble.org/images/potw1644a/");
    expect(MAINLINE_A1_NEBULAE.filter((row) => row.presentation.assetStatus === "licensed").every((row) => row.presentation.rightsStatus === "cleared" && row.provenance[0]?.license === "CC BY 4.0")).toBe(true);
    expect(MAINLINE_A1_NEBULAE.filter((row) => row.presentation.assetStatus === "catalog-marker").every((row) => row.presentation.rightsStatus === "verify-per-image")).toBe(true);
  });
  it("does not promote archive candidate labels to licensed assets", () => {
    expect(isMainlineAExplicitlyClearedLicenseV607("NASA-media-guidelines-public-use-candidate-item-credit")).toBe(false);
    expect(isMainlineAExplicitlyClearedLicenseV607("CC BY 4.0")).toBe(true);
  });
});
