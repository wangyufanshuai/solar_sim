import {
  ATLAS_VISUAL_PROFILE_CANDIDATE_V299,
  ATLAS_VISUAL_PROFILE_CANDIDATE_V300,
  ATLAS_VISUAL_PROFILE_CANDIDATE_V340,
  ATLAS_VISUAL_PROFILE_CANDIDATE_V349,
  ATLAS_VISUAL_PROFILE_CANDIDATE_V362,
  resolveAtlasVisualProfileV299,
  type AtlasVisualProfileV299,
  type AtlasVisualRendererProfileV299,
} from "./atlasVisualProfileV299";
import {
  ATLAS_VISUAL_RUNTIME_GROUPS_V300,
  createAtlasVisualTokenSignatureV300,
  resolveAtlasExpectedVisualTokenSignatureV300,
  type AtlasVisualRuntimeGroupV300,
} from "./atlasVisualRuntimeConsumptionV300";

export const ATLAS_VISUAL_RUNTIME_MATRIX_VERSION_V362 = "v362-v5-v6-v7-v8-v9-runtime-consumption-matrix-v1" as const;
export const ATLAS_VISUAL_PROFILES_V362 = Object.freeze([
  ATLAS_VISUAL_PROFILE_CANDIDATE_V299,
  ATLAS_VISUAL_PROFILE_CANDIDATE_V300,
  ATLAS_VISUAL_PROFILE_CANDIDATE_V340,
  ATLAS_VISUAL_PROFILE_CANDIDATE_V349,
  ATLAS_VISUAL_PROFILE_CANDIDATE_V362,
] as const);

export type AtlasVisualRuntimeMatrixRowV362 = Readonly<{
  profile: typeof ATLAS_VISUAL_PROFILES_V362[number];
  group: AtlasVisualRuntimeGroupV300;
  expectedTokenSignature: string;
  resolvedTokenSignature: string;
  signatureMatches: true;
  resolverReferenceStable: true;
}>;

export type AtlasVisualRuntimeMatrixV362 = Readonly<{
  version: typeof ATLAS_VISUAL_RUNTIME_MATRIX_VERSION_V362;
  profiles: typeof ATLAS_VISUAL_PROFILES_V362;
  groups: typeof ATLAS_VISUAL_RUNTIME_GROUPS_V300;
  rows: readonly AtlasVisualRuntimeMatrixRowV362[];
  rowCount: 40;
  allGroupsCovered: true;
  allProfilesCovered: true;
  resolverReferenceStable: true;
  scienceFieldsEquivalent: true;
  cinematicFieldsPairwiseDistinct: true;
  instrumentLabTokenSignature: string;
  v9Direction: "instrument-lab-uncertainty-observatory";
  boundary: "runtime-token-consumption-no-science-buffer-or-default-profile-mutation";
}>;

function currentPresentation(profile: AtlasVisualRendererProfileV299) {
  return profile.runtimeTokens.strongGravityV9
    ?? profile.runtimeTokens.strongGravityV8
    ?? profile.runtimeTokens.strongGravityV7
    ?? profile.runtimeTokens.strongGravityV6
    ?? profile.runtimeTokens.strongGravityV5;
}

function groupTokens(profile: AtlasVisualProfileV299, group: AtlasVisualRuntimeGroupV300): unknown {
  const resolved = resolveAtlasVisualProfileV299(profile);
  if (group === "sky") return resolved.groups.sky;
  if (group === "solar") return resolved.groups.solar;
  if (group === "catalog") return resolved.groups.catalog;
  if (group === "postFx") return resolved.groups.postFx;
  if (group === "strongGravity") return { base: resolved.runtimeTokens.strongGravity, cinematic: currentPresentation(resolved) ?? null };
  if (group === "launch") return resolved.runtimeTokens.launch;
  if (group === "exoplanet") return resolved.runtimeTokens.exoplanet;
  return resolved.runtimeTokens.hud;
}

function scienceSignature(profile: AtlasVisualRendererProfileV299): string {
  const current = currentPresentation(profile);
  return JSON.stringify([
    profile.runtimeTokens.strongGravity.scienceDisplayTransform,
    current?.scienceExposure ?? null,
    current?.scienceBloom ?? null,
    current?.scienceNoise ?? null,
  ]);
}

function cinematicSignature(profile: AtlasVisualRendererProfileV299): string {
  const current = currentPresentation(profile);
  return JSON.stringify([
    current?.cinematicExposure ?? null,
    current?.cinematicBloom ?? null,
    current?.diskDetailSeed ?? null,
    current?.redshiftColorStrength ?? null,
    current?.dopplerColorStrength ?? null,
  ]);
}

export function createAtlasVisualRuntimeMatrixV362(): AtlasVisualRuntimeMatrixV362 {
  const rows = ATLAS_VISUAL_PROFILES_V362.flatMap((profile) => ATLAS_VISUAL_RUNTIME_GROUPS_V300.map((group): AtlasVisualRuntimeMatrixRowV362 => {
    const first = resolveAtlasVisualProfileV299(profile);
    const second = resolveAtlasVisualProfileV299(profile);
    const expectedTokenSignature = resolveAtlasExpectedVisualTokenSignatureV300(profile, group);
    const resolvedTokenSignature = createAtlasVisualTokenSignatureV300(groupTokens(profile, group));
    if (expectedTokenSignature !== resolvedTokenSignature || first !== second) throw new Error(`v362-runtime-matrix:${profile}:${group}`);
    return Object.freeze({ profile, group, expectedTokenSignature, resolvedTokenSignature, signatureMatches: true, resolverReferenceStable: true });
  }));
  const resolved = ATLAS_VISUAL_PROFILES_V362.map(resolveAtlasVisualProfileV299);
  const scienceFieldsEquivalent = new Set(resolved.map(scienceSignature)).size === 1;
  const cinematicFieldsPairwiseDistinct = new Set(resolved.map(cinematicSignature)).size === 5;
  const instrumentTokens = resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V362).runtimeTokens.hud.instrumentLabV9;
  if (rows.length !== 40 || !scienceFieldsEquivalent || !cinematicFieldsPairwiseDistinct || !instrumentTokens) throw new Error("v362-runtime-matrix-boundary");
  return Object.freeze({
    version: ATLAS_VISUAL_RUNTIME_MATRIX_VERSION_V362,
    profiles: ATLAS_VISUAL_PROFILES_V362,
    groups: ATLAS_VISUAL_RUNTIME_GROUPS_V300,
    rows: Object.freeze(rows),
    rowCount: 40,
    allGroupsCovered: true,
    allProfilesCovered: true,
    resolverReferenceStable: true,
    scienceFieldsEquivalent: true,
    cinematicFieldsPairwiseDistinct: true,
    instrumentLabTokenSignature: createAtlasVisualTokenSignatureV300(instrumentTokens),
    v9Direction: "instrument-lab-uncertainty-observatory",
    boundary: "runtime-token-consumption-no-science-buffer-or-default-profile-mutation",
  });
}
