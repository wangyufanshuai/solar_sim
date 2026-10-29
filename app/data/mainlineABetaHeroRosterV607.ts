import { STELLAR_HEROES_V592 } from "./stellarHeroesV592.generated";
import { MAINLINE_A_CURRENT_STARS } from "./mainlineAMetadataV607";

export type MainlineABetaHeroStatusV607 = "runtime-cleared" | "evidence-pending";
export type MainlineABetaHeroRosterEntryV607 = {
  id: string;
  displayName: string;
  status: MainlineABetaHeroStatusV607;
  evidenceGate: "A4-current" | "A4-source-intake";
};

const currentIds = new Set(MAINLINE_A_CURRENT_STARS.map((star) => star.id));

/**
 * Beta planning boundary: all 24 source heroes are tracked, while only the
 * twelve with current A4 evidence are admitted to the runtime art roster.
 */
export const MAINLINE_A_BETA_HERO_ROSTER: readonly MainlineABetaHeroRosterEntryV607[] = Object.freeze(
  STELLAR_HEROES_V592.map((hero): MainlineABetaHeroRosterEntryV607 => ({
    id: hero.id,
    displayName: hero.name,
    status: currentIds.has(hero.id) ? "runtime-cleared" : "evidence-pending",
    evidenceGate: currentIds.has(hero.id) ? "A4-current" : "A4-source-intake",
  })),
);

export const MAINLINE_A_BETA_HERO_COVERAGE = Object.freeze({
  sourceCount: MAINLINE_A_BETA_HERO_ROSTER.length,
  runtimeCleared: MAINLINE_A_BETA_HERO_ROSTER.filter((hero) => hero.status === "runtime-cleared").length,
  evidencePending: MAINLINE_A_BETA_HERO_ROSTER.filter((hero) => hero.status === "evidence-pending").length,
});
