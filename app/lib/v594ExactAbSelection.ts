import {
  STELLAR_HERO_BY_ID_V592,
  type StellarHeroIdV592,
} from "./stellarHeroesV592";
import { createStellarPortraitRenderContractV594 } from "./stellarPortraitRenderContractV594";
import type { V594ExactAbMode } from "./v594ExactAbContract";

export type V594ExactAbSelection = Readonly<{
  targetId: string;
  archetype: string;
  mode: V594ExactAbMode;
  kind: "stellar" | "relativity";
}>;

/**
 * The normal validation tab opens the product validation console. During an
 * Exact A/B capture that fixed panel would cover the app-owned object browser
 * before the collector can select the Sun, so Exact keeps the tab as a mode
 * change only. The ordinary product path retains its existing behavior.
 */
export function shouldOpenV594ValidationConsole(exactAbActive: boolean): boolean {
  return !exactAbActive;
}

export function resolveV594ExactAbSelection(
  selectedObjectId: string,
  mode: V594ExactAbMode,
): V594ExactAbSelection | null {
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
  const contract = createStellarPortraitRenderContractV594(hero, mode);
  return Object.freeze({
    targetId: hero.id,
    archetype: contract.archetype,
    mode,
    kind: "stellar",
  });
}
