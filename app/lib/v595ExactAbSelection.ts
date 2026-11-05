import {
  STELLAR_HERO_BY_ID_V592,
  type StellarHeroIdV592,
} from "./stellarHeroesV592";
import { createStellarPortraitRenderContractV594 } from "./stellarPortraitRenderContractV594";
import type { V595ExactAbMode } from "./v595ExactAbContract";

export type V595ExactAbSelection = Readonly<{
  targetId: string;
  archetype: string;
  mode: V595ExactAbMode;
  kind: "stellar" | "relativity";
}>;

/** Keeps the object browser available while Exact capture owns the validation tab. */
export function shouldOpenV595ValidationConsole(exactAbActive: boolean): boolean {
  return !exactAbActive;
}

export function resolveV595ExactAbSelection(
  selectedObjectId: string,
  mode: V595ExactAbMode,
): V595ExactAbSelection | null {
  if (selectedObjectId === "sun" && mode === "validation") {
    return Object.freeze({
      targetId: "sun",
      archetype: "relativity-workbench",
      mode,
      kind: "relativity",
    });
  }
  if (!selectedObjectId.startsWith("stellar-hero:") || mode === "validation") return null;
  const heroId = selectedObjectId.slice("stellar-hero:".length) as StellarHeroIdV592;
  const hero = STELLAR_HERO_BY_ID_V592[heroId];
  if (!hero) return null;
  // v595 intentionally inherits the sealed v594 stellar renderer machinery;
  // the Exact host/candidate identity is carried by the independent v595 contract.
  const contract = createStellarPortraitRenderContractV594(hero, mode);
  return Object.freeze({
    targetId: hero.id,
    archetype: contract.archetype,
    mode,
    kind: "stellar",
  });
}
