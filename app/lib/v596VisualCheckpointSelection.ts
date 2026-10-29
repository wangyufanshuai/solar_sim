import {
  STELLAR_HERO_BY_ID_V592,
  type StellarHeroIdV592,
} from "./stellarHeroesV592";
import { createStellarPortraitRenderContractV596 } from "./stellarPortraitRenderContractV596";
import type { V596VisualCheckpointMode } from "./v596VisualCheckpointContract";

export type V596VisualCheckpointSelection = Readonly<{
  targetId: string;
  archetype: string;
  mode: V596VisualCheckpointMode;
  kind: "stellar";
}>;

export function resolveV596VisualCheckpointSelection(
  selectedObjectId: string,
  mode: V596VisualCheckpointMode,
): V596VisualCheckpointSelection | null {
  if (!selectedObjectId.startsWith("stellar-hero:")) return null;
  const heroId = selectedObjectId.slice("stellar-hero:".length) as StellarHeroIdV592;
  const hero = STELLAR_HERO_BY_ID_V592[heroId];
  if (!hero) return null;
  const contract = createStellarPortraitRenderContractV596(hero, mode);
  return Object.freeze({
    targetId: hero.id,
    archetype: contract.archetype,
    mode,
    kind: "stellar" as const,
  });
}
