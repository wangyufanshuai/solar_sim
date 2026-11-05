import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import MainlineStellarEvidencePanelV607 from "../components/MainlineStellarEvidencePanelV607";
import CelestialObjectPassportPanel from "../components/CelestialObjectPassportPanel";
import { createCelestialObjectPassport } from "../lib/celestialCatalog";
import { STELLAR_PROVENANCE_CANDIDATE, STELLAR_PROVENANCE_SOURCE_REGISTRY_V1 } from "../lib/stellarProvenanceCandidate";
import { MAINLINE_A1_STARS, MAINLINE_A_CURRENT_STARS } from "./mainlineAMetadataV607";
import { getMainlineA1CatalogId } from "./mainlineARegistryV607";
import { MAINLINE_A4_CURRENT_STELLAR_EVIDENCE, MAINLINE_A4_SOURCE_SNAPSHOTS, MAINLINE_A4_STELLAR_EVIDENCE } from "./mainlineAStellarEvidenceV607";
import { STELLAR_HEROES_V592 } from "./stellarHeroesV592.generated";

const simbad = JSON.parse(readFileSync(new URL(`../../${MAINLINE_A4_SOURCE_SNAPSHOTS.simbad.path}`, import.meta.url), "utf8")) as {
  snapshotSha256: string;
  retrievedAt: string;
  records: { id: string; mainId: string; parallax: { valueMas: number; errorMas: number; bibcode: string } }[];
};
const literature = JSON.parse(readFileSync(new URL(`../../${MAINLINE_A4_SOURCE_SNAPSHOTS.literature.path}`, import.meta.url), "utf8")) as {
  snapshotSha256: string;
  retrievedAt: string;
  records: { id: string; fields: {
    radius: { value: { equatorialSolar: number }; uncertainty: { equatorialSolar: { plus: number; minus: number } } };
    orientation: { value: { inclinationDeg: number }; uncertainty: { inclinationDeg: { plus: number; minus: number } } };
    temperature: { value: { polarK: number; equatorialK: number }; uncertainty: null };
  } }[];
};

describe("Mainline A4 stellar uncertainty and source boundaries", () => {
  it("recomputes both snapshot seals and binds the projection to the provenance manifest", () => {
    const canonicalize = (value: unknown): unknown => Array.isArray(value)
      ? value.map(canonicalize)
      : value && typeof value === "object"
        ? Object.fromEntries(Object.entries(value).sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0).map(([key, entry]) => [key, canonicalize(entry)]))
        : value;
    for (const snapshot of [simbad, literature]) {
      const { snapshotSha256, ...unsigned } = snapshot;
      expect(createHash("sha256").update(JSON.stringify(canonicalize(unsigned)), "utf8").digest("hex")).toBe(snapshotSha256);
    }
    expect(STELLAR_PROVENANCE_CANDIDATE.source.simbadSnapshotPath).toBe(MAINLINE_A4_SOURCE_SNAPSHOTS.simbad.path);
    expect(STELLAR_PROVENANCE_CANDIDATE.source.simbadSnapshotSha256).toBe(simbad.snapshotSha256);
    expect(STELLAR_PROVENANCE_CANDIDATE.source.literatureSnapshotPath).toBe(MAINLINE_A4_SOURCE_SNAPSHOTS.literature.path);
    expect(STELLAR_PROVENANCE_CANDIDATE.source.literatureSnapshotSha256).toBe(literature.snapshotSha256);
  });

  it("keeps Gaia identity and missing Gaia errors separate from a positional association", () => {
    expect(Object.keys(MAINLINE_A4_STELLAR_EVIDENCE).sort()).toEqual(MAINLINE_A1_STARS.map((row) => row.id).sort());
    for (const [id, evidence] of Object.entries(MAINLINE_A4_STELLAR_EVIDENCE)) {
      const hero = STELLAR_HEROES_V592.find((row) => row.id === id)!;
      expect(evidence.gaiaAssociation.sourceId).toBe(hero.gaiaSourceId);
      expect(evidence.gaiaAssociation.angularSeparationArcsec).toBeCloseTo(hero.gaiaAnchorAngularDistanceDeg * 3600, 10);
      expect(evidence.gaiaAssociation.namedStarIdentityConfirmed).toBe(false);
      expect(evidence.gaiaAssociation.measurementUncertainty).toBe("not-recorded");
      expect(evidence.gaiaAssociation.status).toBe(id === "alpha-centauri-a" ? "positional-candidate" : "render-anchor");
    }
  });

  it("binds the additive six-star roster to the sealed SIMBAD reference rows", () => {
    expect(Object.keys(MAINLINE_A4_CURRENT_STELLAR_EVIDENCE)).toHaveLength(20);
    const addedIds = MAINLINE_A_CURRENT_STARS.map((star) => star.id).filter((id) => !MAINLINE_A1_STARS.some((star) => star.id === id));
    expect(addedIds).toEqual(["canopus", "arcturus", "vega", "capella-a", "procyon-a", "aldebaran", "alpha-centauri-b", "hadar", "altair", "pollux", "fomalhaut", "deneb", "bellatrix", "alnilam"]);
    for (const id of addedIds) {
      const evidence = MAINLINE_A4_CURRENT_STELLAR_EVIDENCE[id];
      const row = simbad.records.find((record) => record.id === id)!;
      expect(evidence, id).toBeDefined();
      expect(evidence.referenceDistance.simbadIdentifier, id).toBe(row.mainId);
      expect(evidence.referenceDistance.parallaxMas, id).toBeCloseTo(row.parallax.valueMas, 10);
      expect(evidence.referenceDistance.parallaxErrorMas, id).toBeCloseTo(row.parallax.errorMas, 10);
      expect(evidence.referenceDistance.upstreamBibcode, id).toBe(row.parallax.bibcode);
      expect(evidence.gaiaAssociation.namedStarIdentityConfirmed, id).toBe(false);
      expect(evidence.gaiaAssociation.status, id).toBe("render-anchor");
      expect(evidence.gaiaAssociation.measurementUncertainty, id).toBe("not-recorded");
      expect(evidence.scientificPayloadWriteback, id).toBe(false);
    }
    expect(MAINLINE_A4_CURRENT_STELLAR_EVIDENCE["capella-a"].gaiaAssociation.noteCn).toContain("组件 A 的身份边界仍未确认");
  });

  it("attaches the propagated error to its SIMBAD reference value without replacing render distances", () => {
    expect(simbad.snapshotSha256).toBe(MAINLINE_A4_SOURCE_SNAPSHOTS.simbad.sha256);
    for (const star of MAINLINE_A1_STARS) {
      const row = simbad.records.find((record) => record.id === star.id)!;
      const admittedReference = STELLAR_PROVENANCE_CANDIDATE.heroes.find((hero) => hero.id === star.id)!;
      const reference = star.evidence.referenceDistance;
      expect(admittedReference.identityBinding.resolvedMainId).toBe(row.mainId);
      expect(admittedReference.identityBinding.gaiaRenderAnchorUsedForIdentity).toBe(false);
      expect(admittedReference.fields.distance.measurementAdmitted).toBe(false);
      expect(reference.simbadIdentifier).toBe(row.mainId);
      expect(reference.value).toBe(admittedReference.fields.distance.value);
      expect(reference.uncertainty.plus).toBe(admittedReference.fields.distance.uncertainty.value);
      expect(reference.parallaxMas).toBe(row.parallax.valueMas);
      expect(reference.parallaxErrorMas).toBe(row.parallax.errorMas);
      expect(reference.upstreamBibcode).toBe(row.parallax.bibcode);
      const simbadSource = star.evidence.sources.find((source) => source.sourceId === reference.sourceId)!;
      expect(new URL(simbadSource.sourceUrl).searchParams.get("Ident")).toBe(row.mainId);
      expect(simbadSource.retrievedAt).toBe(simbad.retrievedAt);
      expect(simbadSource.license).toBe(STELLAR_PROVENANCE_SOURCE_REGISTRY_V1.simbad.license);
      const upstream = star.evidence.sources.find((source) => source.sourceId === reference.upstreamSourceId)!;
      expect(upstream.sourceUrl).toContain(encodeURIComponent(row.parallax.bibcode));
      expect(reference.value).toBeCloseTo(1000 / row.parallax.valueMas, 10);
      expect(reference.uncertainty.status).toBe("propagated-first-order");
      expect(reference.uncertainty.plus).toBeCloseTo(1000 * row.parallax.errorMas / row.parallax.valueMas ** 2, 10);
      expect(reference.uncertainty.minus).toBe(reference.uncertainty.plus);
      expect(star.science.distancePc).toBe(STELLAR_HEROES_V592.find((hero) => hero.id === star.id)!.distancePc);
      expect(star.evidence.scientificPayloadWriteback).toBe(false);
    }
    const betelgeuse = MAINLINE_A1_STARS.find((star) => star.id === "betelgeuse")!;
    expect(betelgeuse.science.distancePc).toBe(200);
    expect(betelgeuse.evidence.referenceDistance.value).toBeLessThan(160);
  });

  it("uses the cited Achernar model errors and does not turn pole-to-equator temperatures into an interval", () => {
    expect(literature.snapshotSha256).toBe(MAINLINE_A4_SOURCE_SNAPSHOTS.literature.sha256);
    const source = literature.records.find((row) => row.id === "achernar")!;
    const evidence = MAINLINE_A4_STELLAR_EVIDENCE.achernar;
    const sourceMetadata = evidence.sources.find((row) => row.sourceId === "achernar-domiciano-2014")!;
    expect(sourceMetadata).toMatchObject({
      sourceUrl: STELLAR_PROVENANCE_SOURCE_REGISTRY_V1["achernar-domiciano-2014"].sourceUrl,
      license: STELLAR_PROVENANCE_SOURCE_REGISTRY_V1["achernar-domiciano-2014"].license,
      retrievedAt: literature.retrievedAt,
    });
    const radius = evidence.literatureModel.find((quantity) => quantity.id === "equatorial-radius")!;
    const inclination = evidence.literatureModel.find((quantity) => quantity.id === "inclination")!;
    expect(radius.value).toBe(source.fields.radius.value.equatorialSolar);
    expect(radius.uncertainty).toEqual({ status: "reported", ...source.fields.radius.uncertainty.equatorialSolar });
    expect(inclination.value).toBe(source.fields.orientation.value.inclinationDeg);
    expect(inclination.uncertainty).toEqual({ status: "reported", ...source.fields.orientation.uncertainty.inclinationDeg });
    expect(evidence.literatureModel.find((quantity) => quantity.id === "polar-temperature")!.value).toBe(source.fields.temperature.value.polarK);
    expect(evidence.literatureModel.find((quantity) => quantity.id === "equatorial-temperature")!.value).toBe(source.fields.temperature.value.equatorialK);
    for (const quantity of evidence.literatureModel.filter((row) => row.id.endsWith("temperature"))) {
      expect(quantity.uncertainty).toEqual({ status: "not-provided", plus: null, minus: null });
    }
    for (const [id, row] of Object.entries(MAINLINE_A4_STELLAR_EVIDENCE)) {
      if (id !== "achernar") expect(row.literatureModel).toHaveLength(0);
    }
  });

  it("keeps each reference traceable and missing presentation error bars explicit", () => {
    for (const star of MAINLINE_A1_STARS) {
      const evidence = star.evidence;
      for (const quantity of [evidence.referenceDistance, ...evidence.literatureModel]) {
        expect(star.provenance.find((source) => source.sourceId === quantity.sourceId)?.sourceUrl).toMatch(/^https:\/\//);
      }
      expect(evidence.modelUncertainties.map((item) => item.field)).toEqual(["temperatureK", "luminositySolar", "radiusSolar"]);
      expect(evidence.modelUncertainties.every((item) => item.status === "not-provided")).toBe(true);
      expect(star.narrative.detailCn.length).toBeGreaterThan(100);
      expect(star.factLayers.catalogDerived.join(" ")).not.toContain("Gaia 视星等 V");
      expect(star.factLayers.catalogDerived.join(" ")).toContain("Johnson V");
      expect(star.factLayers.catalogDerived.join(" ")).toContain("测光误差未记录");
      expect(star.factLayers.observed.join(" ")).not.toContain("Gaia DR3 source_id");
    }
  });

  it("renders asymmetric and missing errors with their source links", () => {
    const html = renderToStaticMarkup(createElement(MainlineStellarEvidencePanelV607, { evidence: MAINLINE_A4_STELLAR_EVIDENCE.achernar }));
    expect(html).toContain("9.16 ± 0.23 R☉");
    expect(html).toContain("60.6 +7.1 / −3.9 °");
    expect(html).toContain("误差未提供");
    expect(html).not.toContain("± 0 K");
    expect(html).toContain("https://www.aanda.org/articles/aa/full_html/2014/09/aa24144-14/aa24144-14.html");
    expect(html).toContain('data-mainline-a-gaia-association="render-anchor"');
    expect(html).toContain('data-mainline-a-uncertainty-confidence-level="not-recorded"');
    expect(html).toContain("封存资料未记录置信水平");
    expect(html).toContain("原文模型表");
    expect(html).toContain("2007A&amp;A...474..653V");
  });

  it("retains every runtime passport identity with facts and an explicit comparison entry", () => {
    for (const star of MAINLINE_A1_STARS) {
      const passport = createCelestialObjectPassport(getMainlineA1CatalogId(star.id)!);
      expect(passport, star.id).not.toBeNull();
      const html = renderToStaticMarkup(createElement(CelestialObjectPassportPanel, { passport, onClose: () => undefined }));
      expect(html).toContain(`data-mainline-a-knowledge-id="${star.id}"`);
      expect(html).not.toContain(`data-mainline-a-stellar-portrait="${star.id}"`);
      expect(html).toContain(`data-mainline-a-passport-summary="${star.id}"`);
      expect(html).toContain("不代表已解析的真实表面");
      expect(html).toContain("查看图鉴 / 比较");
      expect(html).toContain('data-mainline-a-passport-art-expanded="false"');
      expect(html).toContain('data-mainline-a-passport-sources="true"');
    }
  });
});
