import {
  ATLAS_VISUAL_PROFILE_CANDIDATE_V299,
  ATLAS_VISUAL_PROFILE_CANDIDATE_V300,
  resolveAtlasVisualProfileV299,
  type AtlasVisualProfileV299,
} from "./atlasVisualProfileV299";
import {
  ATLAS_VISUAL_RUNTIME_GROUPS_V300,
  createAtlasVisualTokenSignatureV300,
  resolveAtlasExpectedVisualTokenSignatureV300,
  type AtlasVisualRuntimeGroupV300,
} from "./atlasVisualRuntimeConsumptionV300";

export const ATLAS_VISUAL_RUNTIME_MATRIX_VERSION_V334 = "v334-visual-runtime-consumption-matrix-v1" as const;

export type AtlasVisualRuntimeMatrixRowV334 = Readonly<{
  profile: typeof ATLAS_VISUAL_PROFILE_CANDIDATE_V299 | typeof ATLAS_VISUAL_PROFILE_CANDIDATE_V300;
  group: AtlasVisualRuntimeGroupV300;
  expectedTokenSignature: string;
  resolvedTokenSignature: string;
  signatureMatches: true;
  resolverReferenceStable: true;
}>;

export type AtlasVisualRuntimeMatrixV334 = Readonly<{
  version: typeof ATLAS_VISUAL_RUNTIME_MATRIX_VERSION_V334;
  profiles: readonly [typeof ATLAS_VISUAL_PROFILE_CANDIDATE_V299, typeof ATLAS_VISUAL_PROFILE_CANDIDATE_V300];
  groups: typeof ATLAS_VISUAL_RUNTIME_GROUPS_V300;
  rows: readonly AtlasVisualRuntimeMatrixRowV334[];
  rowCount: 16;
  allGroupsCovered: true;
  allProfilesCovered: true;
  resolverReferenceStable: true;
  scienceFieldsEquivalent: true;
  cinematicFieldsDistinct: true;
  boundary: "runtime-consumption-audit-no-science-mutation-no-profile-default-promotion";
}>;

function resolvedTokens(profile: AtlasVisualProfileV299, group: AtlasVisualRuntimeGroupV300): unknown {
  const resolved = resolveAtlasVisualProfileV299(profile);
  return group === "sky" ? resolved.groups.sky
    : group === "solar" ? resolved.groups.solar
      : group === "catalog" ? resolved.groups.catalog
        : group === "postFx" ? resolved.groups.postFx
          : group === "strongGravity" ? { base: resolved.runtimeTokens.strongGravity, cinematic: resolved.runtimeTokens.strongGravityV6 ?? resolved.runtimeTokens.strongGravityV5 ?? null }
            : group === "launch" ? resolved.runtimeTokens.launch
              : group === "exoplanet" ? resolved.runtimeTokens.exoplanet
                : resolved.runtimeTokens.hud;
}

function scienceFields(profile: AtlasVisualProfileV299): readonly unknown[] {
  const resolved = resolveAtlasVisualProfileV299(profile);
  const presentation = resolved.runtimeTokens.strongGravityV6 ?? resolved.runtimeTokens.strongGravityV5;
  return [resolved.runtimeTokens.strongGravity.scienceDisplayTransform, presentation?.scienceExposure ?? null, presentation?.scienceBloom ?? null, presentation?.scienceNoise ?? null];
}

function cinematicFields(profile: AtlasVisualProfileV299): readonly unknown[] {
  const resolved = resolveAtlasVisualProfileV299(profile);
  const presentation = resolved.runtimeTokens.strongGravityV6 ?? resolved.runtimeTokens.strongGravityV5;
  return [presentation?.cinematicExposure ?? null, presentation?.cinematicBloom ?? null, presentation?.diskDetailSeed ?? null, presentation?.redshiftColorStrength ?? null, presentation?.dopplerColorStrength ?? null];
}

export function createAtlasVisualRuntimeMatrixV334(): AtlasVisualRuntimeMatrixV334 {
  const profiles = [ATLAS_VISUAL_PROFILE_CANDIDATE_V299, ATLAS_VISUAL_PROFILE_CANDIDATE_V300] as const;
  const rows = profiles.flatMap((profile) => ATLAS_VISUAL_RUNTIME_GROUPS_V300.map((group): AtlasVisualRuntimeMatrixRowV334 => {
    const first = resolveAtlasVisualProfileV299(profile);
    const second = resolveAtlasVisualProfileV299(profile);
    const tokens = resolvedTokens(profile, group);
    const expectedTokenSignature = resolveAtlasExpectedVisualTokenSignatureV300(profile, group);
    const resolvedTokenSignature = createAtlasVisualTokenSignatureV300(tokens);
    if (expectedTokenSignature !== resolvedTokenSignature || first !== second) throw new Error(`v334-runtime-matrix:${profile}:${group}`);
    return Object.freeze({ profile, group, expectedTokenSignature, resolvedTokenSignature, signatureMatches: true, resolverReferenceStable: true });
  }));
  const v5Science = scienceFields(ATLAS_VISUAL_PROFILE_CANDIDATE_V299);
  const v6Science = scienceFields(ATLAS_VISUAL_PROFILE_CANDIDATE_V300);
  const v5Cinematic = cinematicFields(ATLAS_VISUAL_PROFILE_CANDIDATE_V299);
  const v6Cinematic = cinematicFields(ATLAS_VISUAL_PROFILE_CANDIDATE_V300);
  const scienceFieldsEquivalent = JSON.stringify(v5Science) === JSON.stringify(v6Science);
  const cinematicFieldsDistinct = JSON.stringify(v5Cinematic) !== JSON.stringify(v6Cinematic);
  if (rows.length !== 16 || !scienceFieldsEquivalent || !cinematicFieldsDistinct) throw new Error("v334-runtime-matrix-boundary");
  return Object.freeze({
    version: ATLAS_VISUAL_RUNTIME_MATRIX_VERSION_V334,
    profiles,
    groups: ATLAS_VISUAL_RUNTIME_GROUPS_V300,
    rows: Object.freeze(rows),
    rowCount: 16,
    allGroupsCovered: true,
    allProfilesCovered: true,
    resolverReferenceStable: true,
    scienceFieldsEquivalent: true,
    cinematicFieldsDistinct: true,
    boundary: "runtime-consumption-audit-no-science-mutation-no-profile-default-promotion",
  });
}
