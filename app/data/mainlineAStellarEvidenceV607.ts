import type { ProvenanceV607, StellarEvidenceV607, StellarReferenceQuantityV607 } from "../lib/celestialObjectContractV607";
import { STELLAR_HEROES_V592 } from "./stellarHeroesV592.generated";
import { MAINLINE_A_BETA_STELLAR_PROJECTION } from "./mainlineABetaStellarProjectionV607.generated";

// Small first-set projection; the full source tables remain outside the client bundle.
// Tests compare these values with the sealed source snapshot and provenance manifest.
export const MAINLINE_A4_SOURCE_SNAPSHOTS = {
  simbad: { path: "docs/release/post-v593/source-snapshots/simbad-stellar-24-2026-08-25.json", sha256: "be5e2956350d7d81f19e29d6f98529702b4cf018cd1c3b6d47b392be82db5061" },
  literature: { path: "docs/release/post-v593/source-snapshots/stellar-literature-intake-2026-08-25.json", sha256: "61e198cf8939262703c4df4e6aee25f9e0e80daaad2836775b99f65938e59767" },
} as const;

const retrievedAt = "2026-08-25T11:26:00Z";
const SIMBAD: ProvenanceV607 = {
  sourceId: "simbad-stellar-reference",
  sourceUrl: "https://simbad.cds.unistra.fr/simbad/",
  retrievedAt,
  license: "ODbL-1.0",
  credit: "SIMBAD astronomical database, operated at CDS, Strasbourg, France; Wenger et al. 2000",
};
const ACHERNAR_MODEL: ProvenanceV607 = {
  sourceId: "achernar-domiciano-2014",
  sourceUrl: "https://www.aanda.org/articles/aa/full_html/2014/09/aa24144-14/aa24144-14.html",
  retrievedAt,
  license: "© ESO 2014, citation-only factual extraction",
  credit: "Domiciano de Souza et al. 2014, A&A 569 A10, CHARRON RVZ MCMC Table 6; © ESO 2014",
};

const PARALLAX_REFERENCES = [
  { id: "alpha-centauri-a", simbadIdentifier: "* alf Cen A", parallaxMas: 742.12, errorMas: 1.399999976158142, bibcode: "1997A&A...323L..49P" },
  { id: "achernar", simbadIdentifier: "* alf Eri", parallaxMas: 23.39, errorMas: 0.5699999928474426, bibcode: "2007A&A...474..653V" },
  { id: "betelgeuse", simbadIdentifier: "* alf Ori", parallaxMas: 6.55, errorMas: 0.8299999833106995, bibcode: "2007A&A...474..653V" },
  { id: "sirius-a", simbadIdentifier: "* alf CMa", parallaxMas: 379.21, errorMas: 1.5800000429153442, bibcode: "2007A&A...474..653V" },
  { id: "rigel", simbadIdentifier: "* bet Ori", parallaxMas: 3.78, errorMas: 0.3400000035762787, bibcode: "2007A&A...474..653V" },
  { id: "antares", simbadIdentifier: "* alf Sco", parallaxMas: 5.89, errorMas: 1, bibcode: "2007A&A...474..653V" },
  { id: "canopus", simbadIdentifier: "* alf Car", parallaxMas: 10.55, errorMas: 0.5600000023841858, bibcode: "2007A&A...474..653V" },
  { id: "arcturus", simbadIdentifier: "* alf Boo", parallaxMas: 88.83, errorMas: 0.5400000214576721, bibcode: "2007A&A...474..653V" },
  { id: "vega", simbadIdentifier: "* alf Lyr", parallaxMas: 130.23, errorMas: 0.36000001430511475, bibcode: "2007A&A...474..653V" },
  { id: "capella-a", simbadIdentifier: "* alf Aur", parallaxMas: 76.2, errorMas: 0.46000000834465027, bibcode: "2007A&A...474..653V" },
  { id: "procyon-a", simbadIdentifier: "* alf CMi", parallaxMas: 284.56, errorMas: 1.25999999046326, bibcode: "2007A&A...474..653V" },
  { id: "aldebaran", simbadIdentifier: "* alf Tau", parallaxMas: 48.94, errorMas: 0.769999980926514, bibcode: "2007A&A...474..653V" },
] as const;

const noError = { status: "not-provided", plus: null, minus: null } as const;
const achernarModel: readonly StellarReferenceQuantityV607[] = [
  { id: "equatorial-radius", labelCn: "文献赤道半径", value: 9.16, unit: "R☉", uncertainty: { status: "reported", plus: 0.23, minus: 0.23 }, sourceId: ACHERNAR_MODEL.sourceId, noteCn: "2009–2012 无盘期干涉观测的旋转恒星模型；与当前肖像的等效球半径定义不同。" },
  { id: "inclination", labelCn: "自转轴倾角", value: 60.6, unit: "°", uncertainty: { status: "reported", plus: 7.1, minus: 3.9 }, sourceId: ACHERNAR_MODEL.sourceId, noteCn: "原表给出非对称模型误差；角度参考视线，未用于设置当前肖像朝向。" },
  { id: "polar-temperature", labelCn: "文献极区温度", value: 17124, unit: "K", uncertainty: noError, sourceId: ACHERNAR_MODEL.sourceId, noteCn: "模型极区温度；封存表未给误差，不能与赤道温度围成置信区间。" },
  { id: "equatorial-temperature", labelCn: "文献赤道温度", value: 12673, unit: "K", uncertainty: noError, sourceId: ACHERNAR_MODEL.sourceId, noteCn: "模型赤道温度；重力昏暗使其低于极区，这个差异表示空间分布。" },
];

const FIRST_SET_IDS = new Set(["alpha-centauri-a", "achernar", "betelgeuse", "sirius-a", "rigel", "antares"]);

type ParallaxReference = { id: string; simbadIdentifier: string; parallaxMas: number; errorMas: number; bibcode: string };
const betaReferences: ParallaxReference[] = MAINLINE_A_BETA_STELLAR_PROJECTION.rows.flatMap((row) => {
  if (!row.presentationReferenceReady) return [];
  if (typeof row.parallaxMas !== "number" || typeof row.errorMas !== "number" || !row.bibcode || !row.simbadIdentifier) return [];
  return [{ id: row.id, simbadIdentifier: row.simbadIdentifier, parallaxMas: row.parallaxMas, errorMas: row.errorMas, bibcode: row.bibcode }];
});
export const MAINLINE_A_BETA_REFERENCE_READY_IDS: readonly string[] = betaReferences.map((row) => row.id);

function createStellarEvidence(references: readonly ParallaxReference[]): Readonly<Record<string, StellarEvidenceV607>> {
  return Object.fromEntries(references.map((reference) => {
  const hero = STELLAR_HEROES_V592.find((row) => row.id === reference.id);
  if (!hero) throw new Error(`Missing A4 stellar hero ${reference.id}`);
  const sigmaPc = 1000 * reference.errorMas / reference.parallaxMas ** 2;
  const positionalCandidate = hero.gaiaCrossmatchStatus === "gaia-positional-crossmatch";
  const simbad: ProvenanceV607 = {
    ...SIMBAD,
    sourceUrl: `https://simbad.cds.unistra.fr/simbad/sim-id?Ident=${encodeURIComponent(reference.simbadIdentifier)}`,
  };
  const upstream: ProvenanceV607 = {
    sourceId: `simbad-upstream-${reference.bibcode}`,
    sourceUrl: `https://ui.adsabs.harvard.edu/abs/${encodeURIComponent(reference.bibcode)}/abstract`,
    retrievedAt,
    license: "publisher-specific-citation-record",
    credit: `SIMBAD 上游文献：${reference.bibcode}`,
  };
  const evidence: StellarEvidenceV607 = {
    gaiaAssociation: {
      sourceId: hero.gaiaSourceId,
      status: positionalCandidate ? "positional-candidate" : "render-anchor",
      angularSeparationArcsec: hero.gaiaAnchorAngularDistanceDeg * 3600,
      namedStarIdentityConfirmed: false,
      measurementUncertainty: "not-recorded",
      noteCn: `${positionalCandidate
        ? "该 Gaia 条目仅通过位置近邻条件入选；尚未确认它与具名恒星为同一对象，不能转用其测光或误差。"
        : "该 Gaia 条目仅供星场渲染定位，不代表这颗具名恒星；它的 G、BP/RP 与误差不能作为该恒星的测量。"}${reference.id === "capella-a" ? " SIMBAD 快照按 Capella 系统名解析，组件 A 的身份边界仍未确认。" : ""}`,
    },
    referenceDistance: {
      id: "reference-distance", labelCn: "视差派生距离参考", value: 1000 / reference.parallaxMas, unit: "pc",
      uncertainty: { status: "propagated-first-order", plus: sigmaPc, minus: sigmaPc },
      sourceId: simbad.sourceId, simbadIdentifier: reference.simbadIdentifier, parallaxMas: reference.parallaxMas, parallaxErrorMas: reference.errorMas, upstreamBibcode: reference.bibcode, upstreamSourceId: upstream.sourceId,
      noteCn: "使用 SIMBAD 编纂的正视差，d=1000/ϖ，σd=1000σϖ/ϖ²；仅一阶传播，未含系统误差或距离先验。该参考值未替换场景目录距离。",
    },
    literatureModel: reference.id === "achernar" ? achernarModel : [],
    modelUncertainties: [
      { field: "temperatureK", labelCn: "肖像色温误差", status: "not-provided", noteCn: "当前展示参数没有逐星测量误差记录。" },
      { field: "luminositySolar", labelCn: "肖像光度误差", status: "not-provided", noteCn: "当前展示参数没有逐星测量误差记录。" },
      { field: "radiusSolar", labelCn: "肖像半径误差", status: "not-provided", noteCn: "半径由光度与温度经 Stefan–Boltzmann 关系推导；缺少输入误差，不能计算可信区间。" },
    ],
    sources: reference.id === "achernar" ? [simbad, upstream, ACHERNAR_MODEL] : [simbad, upstream],
    scientificPayloadWriteback: false,
  };
    return [reference.id, evidence];
  }));
}

/** Historical A4 six-star evidence projection; retained for old receipts. */
export const MAINLINE_A4_STELLAR_EVIDENCE: Readonly<Record<string, StellarEvidenceV607>> = createStellarEvidence(PARALLAX_REFERENCES.filter((reference) => FIRST_SET_IDS.has(reference.id)));

/** Additive references; unresolved components and missing parallaxes remain outside. */
export const MAINLINE_A4_CURRENT_STELLAR_EVIDENCE: Readonly<Record<string, StellarEvidenceV607>> = createStellarEvidence([...PARALLAX_REFERENCES, ...betaReferences]);
