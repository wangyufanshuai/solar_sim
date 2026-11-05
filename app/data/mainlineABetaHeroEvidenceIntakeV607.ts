import { MAINLINE_A_BETA_HERO_ROSTER } from "./mainlineABetaHeroRosterV607";

const SIMBAD_IDENTIFIERS: Record<string, string> = {
  "alpha-centauri-b": "* alf Cen B",
  hadar: "* bet Cen",
  altair: "* alf Aql",
  acrux: "* alf Cru",
  spica: "* alf Vir",
  pollux: "* bet Gem",
  fomalhaut: "* alf PsA",
  deneb: "* alf Cyg",
  regulus: "* alf Leo",
  polaris: "* alf UMi",
  bellatrix: "* gam Ori",
  alnilam: "* eps Ori",
};

export type MainlineABetaHeroEvidenceIntakeV607 = {
  id: string;
  displayName: string;
  simbadIdentifier: string;
  simbadUrl: string;
  status: "awaiting-snapshot-ingest";
  measurementAdmission: "not-admitted";
};

const pending = MAINLINE_A_BETA_HERO_ROSTER.filter((hero) => hero.status === "evidence-pending");

export const MAINLINE_A_BETA_HERO_EVIDENCE_INTAKE: readonly MainlineABetaHeroEvidenceIntakeV607[] = Object.freeze(
  pending.map((hero): MainlineABetaHeroEvidenceIntakeV607 => {
    const simbadIdentifier = SIMBAD_IDENTIFIERS[hero.id];
    if (!simbadIdentifier) throw new Error(`Missing SIMBAD intake identifier for ${hero.id}`);
    return {
      id: hero.id,
      displayName: hero.displayName,
      simbadIdentifier,
      simbadUrl: `https://simbad.cds.unistra.fr/simbad/sim-id?Ident=${encodeURIComponent(simbadIdentifier)}`,
      status: "awaiting-snapshot-ingest",
      measurementAdmission: "not-admitted",
    };
  }),
);
