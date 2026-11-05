import {
  ATLAS_VISUAL_PROFILE_CANDIDATE_V299,
  ATLAS_VISUAL_PROFILE_CANDIDATE_V300,
  ATLAS_VISUAL_PROFILE_CANDIDATE_V340,
  resolveAtlasVisualProfileV299,
  type AtlasVisualProfileV299,
  type AtlasVisualRendererProfileV299,
} from "./atlasVisualProfileV299";
import { ATLAS_VISUAL_RUNTIME_GROUPS_V300, createAtlasVisualTokenSignatureV300, resolveAtlasExpectedVisualTokenSignatureV300, type AtlasVisualRuntimeGroupV300 } from "./atlasVisualRuntimeConsumptionV300";

export const ATLAS_VISUAL_RUNTIME_MATRIX_VERSION_V340 = "v340-v5-v6-v7-runtime-consumption-matrix-v1" as const;
export const ATLAS_VISUAL_PROFILES_V340 = Object.freeze([ATLAS_VISUAL_PROFILE_CANDIDATE_V299, ATLAS_VISUAL_PROFILE_CANDIDATE_V300, ATLAS_VISUAL_PROFILE_CANDIDATE_V340] as const);

export type AtlasVisualRuntimeMatrixRowV340 = Readonly<{
  profile: typeof ATLAS_VISUAL_PROFILES_V340[number];
  group: AtlasVisualRuntimeGroupV300;
  expectedTokenSignature: string;
  resolvedTokenSignature: string;
  signatureMatches: true;
  resolverReferenceStable: true;
}>;

export type AtlasVisualRuntimeMatrixV340 = Readonly<{
  version: typeof ATLAS_VISUAL_RUNTIME_MATRIX_VERSION_V340;
  profiles: typeof ATLAS_VISUAL_PROFILES_V340;
  groups: typeof ATLAS_VISUAL_RUNTIME_GROUPS_V300;
  rows: readonly AtlasVisualRuntimeMatrixRowV340[];
  rowCount: 24;
  allGroupsCovered: true;
  allProfilesCovered: true;
  resolverReferenceStable: true;
  scienceFieldsEquivalent: true;
  cinematicFieldsPairwiseDistinct: true;
  v7Direction: "deep-space-precision-observatory";
  boundary: "runtime-token-consumption-no-science-buffer-or-default-profile-mutation";
}>;

function tokens(profile: AtlasVisualProfileV299, group: AtlasVisualRuntimeGroupV300): unknown {
  const resolved = resolveAtlasVisualProfileV299(profile);
  return group === "sky" ? resolved.groups.sky
    : group === "solar" ? resolved.groups.solar
      : group === "catalog" ? resolved.groups.catalog
        : group === "postFx" ? resolved.groups.postFx
          : group === "strongGravity" ? { base: resolved.runtimeTokens.strongGravity, cinematic: resolved.runtimeTokens.strongGravityV7 ?? resolved.runtimeTokens.strongGravityV6 ?? resolved.runtimeTokens.strongGravityV5 ?? null }
            : group === "launch" ? resolved.runtimeTokens.launch
              : group === "exoplanet" ? resolved.runtimeTokens.exoplanet
                : resolved.runtimeTokens.hud;
}

function presentation(profile: AtlasVisualRendererProfileV299) {
  return profile.runtimeTokens.strongGravityV7 ?? profile.runtimeTokens.strongGravityV6 ?? profile.runtimeTokens.strongGravityV5;
}

function scienceSignature(profile: AtlasVisualRendererProfileV299): string {
  const current = presentation(profile);
  return JSON.stringify([profile.runtimeTokens.strongGravity.scienceDisplayTransform, current?.scienceExposure ?? null, current?.scienceBloom ?? null, current?.scienceNoise ?? null]);
}

function cinematicSignature(profile: AtlasVisualRendererProfileV299): string {
  const current = presentation(profile);
  return JSON.stringify([current?.cinematicExposure ?? null, current?.cinematicBloom ?? null, current?.diskDetailSeed ?? null, current?.redshiftColorStrength ?? null, current?.dopplerColorStrength ?? null]);
}

export function createAtlasVisualRuntimeMatrixV340(): AtlasVisualRuntimeMatrixV340 {
  const rows = ATLAS_VISUAL_PROFILES_V340.flatMap((profile) => ATLAS_VISUAL_RUNTIME_GROUPS_V300.map((group): AtlasVisualRuntimeMatrixRowV340 => {
    const first = resolveAtlasVisualProfileV299(profile);
    const second = resolveAtlasVisualProfileV299(profile);
    const expectedTokenSignature = resolveAtlasExpectedVisualTokenSignatureV300(profile, group);
    const resolvedTokenSignature = createAtlasVisualTokenSignatureV300(tokens(profile, group));
    if (expectedTokenSignature !== resolvedTokenSignature || first !== second) throw new Error(`v340-runtime-matrix:${profile}:${group}`);
    return Object.freeze({ profile, group, expectedTokenSignature, resolvedTokenSignature, signatureMatches: true, resolverReferenceStable: true });
  }));
  const resolved = ATLAS_VISUAL_PROFILES_V340.map(resolveAtlasVisualProfileV299);
  const scienceFieldsEquivalent = new Set(resolved.map(scienceSignature)).size === 1;
  const cinematicFieldsPairwiseDistinct = new Set(resolved.map(cinematicSignature)).size === 3;
  if (rows.length !== 24 || !scienceFieldsEquivalent || !cinematicFieldsPairwiseDistinct) throw new Error("v340-runtime-matrix-boundary");
  return Object.freeze({ version: ATLAS_VISUAL_RUNTIME_MATRIX_VERSION_V340, profiles: ATLAS_VISUAL_PROFILES_V340, groups: ATLAS_VISUAL_RUNTIME_GROUPS_V300, rows: Object.freeze(rows), rowCount: 24, allGroupsCovered: true, allProfilesCovered: true, resolverReferenceStable: true, scienceFieldsEquivalent: true, cinematicFieldsPairwiseDistinct: true, v7Direction: "deep-space-precision-observatory", boundary: "runtime-token-consumption-no-science-buffer-or-default-profile-mutation" });
}
