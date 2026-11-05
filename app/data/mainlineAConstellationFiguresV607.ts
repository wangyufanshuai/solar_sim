import { ALL_BRIGHT_STARS, type BrightStarDef } from "./brightStarCatalog";
import { MAINLINE_A_CONSTELLATION_ANCHOR_SUPPLEMENT_V638 } from "./mainlineAConstellationAnchorSupplementV638";

type FigureDefinition = {
  name: string;
  nameCn: string;
  paths: readonly (readonly string[])[];
  labels: Readonly<Record<string, string>>;
};
export const MAINLINE_A_CONSTELLATION_DEFINITIONS_V607: Readonly<Record<string, FigureDefinition>> = {
  Ori: {
    name: "Orion", nameCn: "猎户座",
    paths: [["betelgeuse", "bellatrix", "mintaka", "alnilam", "alnitak", "betelgeuse"], ["alnitak", "saiph", "rigel", "mintaka"]],
    labels: { betelgeuse: "参宿四", bellatrix: "参宿五", mintaka: "参宿三", alnilam: "参宿二", alnitak: "参宿一", saiph: "参宿六", rigel: "参宿七" },
  },
  UMa: {
    name: "Ursa Major", nameCn: "大熊座 · 北斗七星",
    paths: [["dubhe", "merak", "phecda", "megrez", "dubhe"], ["megrez", "alioth", "mizar", "alkaid"]],
    labels: { dubhe: "天枢", merak: "天璇", phecda: "天玑", megrez: "天权", alioth: "玉衡", mizar: "开阳", alkaid: "摇光" },
  },
  Cas: {
    name: "Cassiopeia", nameCn: "仙后座",
    paths: [["caph", "schedar", "gamma_cas", "ruchbah", "segin"]],
    labels: { caph: "王良一", schedar: "王良四", gamma_cas: "策", ruchbah: "阁道三", segin: "阁道二" },
  },
  Sco: {
    name: "Scorpius", nameCn: "天蝎座",
    paths: [["acrab", "dschubba", "antares", "epsilon_sco", "zeta_sco", "eta_sco", "sargas", "iota_sco", "kappa_sco", "shaula"]],
    labels: { acrab: "房宿四", dschubba: "房宿三", antares: "心宿二", epsilon_sco: "尾宿二", zeta_sco: "尾宿三", eta_sco: "尾宿六", sargas: "尾宿五", iota_sco: "尾宿七", kappa_sco: "尾宿九", shaula: "尾宿八" },
  },
  Cyg: {
    name: "Cygnus", nameCn: "天鹅座",
    paths: [["deneb", "sadr", "albireo"], ["delta_cyg", "sadr", "epsilon_cyg"]],
    labels: { deneb: "天津四", sadr: "天津一", albireo: "辇道增七", delta_cyg: "天鹅座 δ", epsilon_cyg: "天鹅座 ε" },
  },
  Gem: {
    name: "Gemini", nameCn: "双子座",
    paths: [["castor", "pollux"], ["castor", "mebsuta", "propus"], ["pollux", "wasat", "alhena"], ["mebsuta", "wasat"]],
    labels: { castor: "北河二", pollux: "北河三", mebsuta: "井宿五", propus: "井宿一", wasat: "天樽二", alhena: "井宿三" },
  },
  Leo: {
    name: "Leo", nameCn: "狮子座",
    paths: [["regulus", "eta_leo", "algieba", "mu_leo"], ["algieba", "zosma", "denebola", "chertan", "regulus"], ["zosma", "chertan"]],
    labels: { regulus: "轩辕十四", eta_leo: "狮子座 η", algieba: "轩辕十二", mu_leo: "轩辕十", zosma: "太微右垣五", chertan: "太微右垣四", denebola: "五帝座一" },
  },
  Cru: {
    name: "Crux", nameCn: "南十字座",
    paths: [["gacrux", "acrux"], ["imai", "mimosa"]],
    labels: { gacrux: "十字架一", mimosa: "十字架三", acrux: "十字架二", imai: "十字架四" },
  },
  Lyr: {
    name: "Lyra", nameCn: "天琴座",
    paths: [["vega", "epsilon1_lyr", "zeta1_lyr", "vega"], ["zeta1_lyr", "delta2_lyr", "gamma_lyr", "sheliak", "zeta1_lyr"]],
    labels: { vega: "织女星", epsilon1_lyr: "天琴座 ε¹", zeta1_lyr: "天琴座 ζ¹", delta2_lyr: "天琴座 δ²", gamma_lyr: "渐台三", sheliak: "渐台二" },
  },
  Aql: {
    name: "Aquila", nameCn: "天鹰座",
    paths: [["tarazed", "altair", "alshain"], ["altair", "delta_aql", "zeta_aql", "tarazed"], ["delta_aql", "lambda_aql"], ["delta_aql", "eta_aql", "theta_aql", "alshain"]],
    labels: { altair: "河鼓二", tarazed: "河鼓三", alshain: "河鼓一", delta_aql: "天鹰座 δ", zeta_aql: "天鹰座 ζ", lambda_aql: "天鹰座 λ", eta_aql: "天鹰座 η", theta_aql: "天鹰座 θ" },
  },
  Tau: {
    name: "Taurus", nameCn: "金牛座",
    paths: [["elnath", "epsilon_tau", "delta1_tau", "gamma_tau", "theta2_tau", "aldebaran", "zeta_tau"]],
    labels: { aldebaran: "毕宿五", elnath: "五车五", epsilon_tau: "毕宿一", delta1_tau: "毕宿二", gamma_tau: "毕宿四", theta2_tau: "毕宿六", zeta_tau: "天关" },
  },
  Sgr: {
    name: "Sagittarius", nameCn: "人马座",
    paths: [["gamma_sgr", "kaus_media", "kaus_borealis", "phi_sgr", "kaus_media", "kaus_australis", "gamma_sgr"], ["phi_sgr", "nunki", "tau_sgr", "zeta_sgr", "phi_sgr"]],
    labels: { gamma_sgr: "箕宿一", kaus_australis: "箕宿三", kaus_media: "箕宿二", kaus_borealis: "斗宿二", phi_sgr: "斗宿一", nunki: "斗宿四", tau_sgr: "斗宿六", zeta_sgr: "斗宿五" },
  },
};

export type MainlineAConstellationSupplementV638 = Readonly<{
  id: string; name: string; nameCn: string; constellationCode: string;
  raDeg: number; decDeg: number; magV: number | null;
  sourceUrl: string; artifactPath: string; artifactSha256: string;
}>;
export type MainlineAChartStarV607 = Omit<BrightStarDef, "magV"> & {
  nameCn: string;
  raDeg: number;
  magV: number | null;
  constellationCode: string;
  sourceRef: string;
  rawArtifactSha256: string | null;
};
export type MainlineACoordinateSegmentV607 = readonly [readonly [number, number], readonly [number, number]];
export type MainlineAConstellationFigureV607 = {
  name: string;
  nameCn: string;
  stars: MainlineAChartStarV607[];
  segments: readonly [string, string][];
  waypoints: [number, number][];
  coordinateSegments: readonly MainlineACoordinateSegmentV607[];
  requiredAnchorIds: readonly string[];
  missingAnchorIds: readonly string[];
  sourceComplete: boolean;
  sourceIssues: readonly string[];
  scientificPayloadWriteback: false;
};

function validCoordinate(raDeg: number, decDeg: number): boolean {
  return Number.isFinite(raDeg) && Number.isFinite(decDeg) && raDeg >= 0 && raDeg < 360 && decDeg >= -90 && decDeg <= 90;
}

/** Resolves explicit members; a nearby Gaia match cannot establish a named identity. */
export function buildMainlineAConstellationFiguresV607(
  catalog: readonly BrightStarDef[],
  supplement: readonly MainlineAConstellationSupplementV638[],
): Readonly<Record<string, MainlineAConstellationFigureV607>> {
  return Object.fromEntries(Object.entries(MAINLINE_A_CONSTELLATION_DEFINITIONS_V607).map(([code, definition]) => {
    const requiredAnchorIds = [...new Set(definition.paths.flat())];
    const stars: MainlineAChartStarV607[] = [];
    const sourceIssues: string[] = [];
    for (const id of requiredAnchorIds) {
      const matches = catalog.filter((star) => star.id === id);
      const additions = supplement.filter((star) => star.id === id);
      if (matches.length) {
        const star = matches[0];
        const identity = (entry: BrightStarDef) => JSON.stringify([entry.name, entry.raHours, entry.decDeg, entry.magV, entry.r, entry.g, entry.b]);
        if (new Set(matches.map(identity)).size !== 1 || additions.length) {
          sourceIssues.push(`anchor:ambiguous:${id}`);
          continue;
        }
        if (!validCoordinate(star.raHours * 15, star.decDeg) || !Number.isFinite(star.magV)) {
          sourceIssues.push(`anchor:invalid-coordinate:${id}`);
          continue;
        }
        stars.push({ ...star, nameCn: definition.labels[id], raDeg: star.raHours * 15,
          constellationCode: code, sourceRef: `app/data/brightStarCatalog.ts#${id}`, rawArtifactSha256: null });
        continue;
      }
      const added = additions[0];
      if (additions.length !== 1 || !added) {
        sourceIssues.push(`anchor:${additions.length ? "ambiguous" : "missing"}:${id}`);
        continue;
      }
      if (added.constellationCode !== code || !added.name || !validCoordinate(added.raDeg, added.decDeg)
        || (added.magV !== null && !Number.isFinite(added.magV))
        || !/^https:\/\//.test(added.sourceUrl) || !added.artifactPath || !/^[a-f0-9]{64}$/i.test(added.artifactSha256)) {
        sourceIssues.push(`anchor:source-invalid:${id}`);
        continue;
      }
      stars.push({ id, name: added.name, nameCn: added.nameCn || definition.labels[id],
        raHours: added.raDeg / 15, raDeg: added.raDeg, decDeg: added.decDeg, magV: added.magV,
        r: 0.88, g: 0.93, b: 1, constellationCode: code,
        sourceRef: `${added.artifactPath}#${id}`, rawArtifactSha256: added.artifactSha256 });
    }
    const byId = new Map(stars.map((star) => [star.id, star]));
    const missingAnchorIds = requiredAnchorIds.filter((id) => !byId.has(id));
    const seen = new Set<string>();
    const segments: [string, string][] = [];
    for (const path of definition.paths) {
      for (let index = 1; index < path.length; index++) {
        const pair: [string, string] = [path[index - 1], path[index]];
        const key = [...pair].sort().join("/");
        // Preserve a gap at an unresolved anchor; never connect across it.
        if (pair[0] !== pair[1] && pair.every((id) => byId.has(id)) && !seen.has(key)) segments.push(pair);
        seen.add(key);
      }
    }
    const coordinate = (id: string): [number, number] => {
      const star = byId.get(id)!;
      return [star.raDeg, star.decDeg];
    };
    return [code, { name: definition.name, nameCn: definition.nameCn, stars, segments,
      waypoints: stars.map((star): [number, number] => [star.raDeg, star.decDeg]),
      coordinateSegments: segments.map(([a, b]): MainlineACoordinateSegmentV607 => [coordinate(a), coordinate(b)]),
      requiredAnchorIds, missingAnchorIds, sourceComplete: missingAnchorIds.length === 0,
      sourceIssues, scientificPayloadWriteback: false as const }];
  }));
}

/** These are presentation figures, not IAU boundaries or scientific admission. */
export const MAINLINE_A_CONSTELLATION_FIGURES_V607 = buildMainlineAConstellationFiguresV607(
  ALL_BRIGHT_STARS, MAINLINE_A_CONSTELLATION_ANCHOR_SUPPLEMENT_V638,
);
