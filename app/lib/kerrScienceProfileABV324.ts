import type { AtlasVisualRendererProfileV299 } from "./atlasVisualProfileV299";
import type { KerrScienceBandHudModelV322 } from "./kerrScienceBandHudV322";

export const KERR_SCIENCE_PROFILE_AB_VERSION_V324 = "v324-kerr-science-profile-ab-v1" as const;

export type KerrScienceProfileABComparisonV324 = Readonly<{
  version: typeof KERR_SCIENCE_PROFILE_AB_VERSION_V324;
  profiles: readonly ["science-cinematic-v5-v299", "science-cinematic-v6-v300"];
  scienceFields: readonly ["scienceDisplayTransform", "scienceExposure", "scienceBloom", "scienceNoise"];
  scienceTokenEquivalent: boolean;
  scienceTokenMismatches: readonly string[];
  cinematicTokensDistinct: boolean;
  scienceDigestStable: boolean;
  authorityDigest: Readonly<{
    payloadDigestSha256: string | null;
    bandArtifactSha256: string | null;
    bandViewDigestSha256: string | null;
  }>;
  currentHudStatus: KerrScienceBandHudModelV322["status"];
  exportBoundary: "v323-read-only-provenance-view-stable-before-after-profile-ab";
  defaultBoundary: "manual-local-shadow-ab-only-default-legacy-v9";
  status: "qualified-science-equivalent" | "blocked-science-token-drift";
}>;

function scienceFields(profile: AtlasVisualRendererProfileV299): Readonly<Record<string, unknown>> {
  const presentation = profile.runtimeTokens.strongGravityV6 ?? profile.runtimeTokens.strongGravityV5;
  return {
    scienceDisplayTransform: profile.runtimeTokens.strongGravity.scienceDisplayTransform,
    scienceExposure: presentation?.scienceExposure ?? null,
    scienceBloom: presentation?.scienceBloom ?? null,
    scienceNoise: presentation?.scienceNoise ?? null,
  };
}

export function compareKerrScienceProfilesV324(
  v5: AtlasVisualRendererProfileV299,
  v6: AtlasVisualRendererProfileV299,
  hud: KerrScienceBandHudModelV322,
): KerrScienceProfileABComparisonV324 {
  const left = scienceFields(v5);
  const right = scienceFields(v6);
  const scienceFieldsList = ["scienceDisplayTransform", "scienceExposure", "scienceBloom", "scienceNoise"] as const;
  const mismatches = scienceFieldsList.filter((field) => left[field] !== right[field]);
  const cinematicV5 = v5.runtimeTokens.strongGravityV5;
  const cinematicV6 = v6.runtimeTokens.strongGravityV6;
  const cinematicTokensDistinct = cinematicV5 != null && cinematicV6 != null
    && (cinematicV5.cinematicExposure !== cinematicV6.cinematicExposure
      || cinematicV5.cinematicBloom !== cinematicV6.cinematicBloom
      || cinematicV5.diskDetailSeed !== cinematicV6.diskDetailSeed);
  const scienceDigestStable = hud.payloadDigestSha256 !== null
    && hud.bandArtifactSha256 !== null
    && hud.bandViewDigestSha256 !== null
    && hud.payloadUnchanged === true
    && hud.bandViewUnchanged === true
    && hud.buffersDisjoint === true
    && hud.cinematicBufferShared === false;
  return Object.freeze({
    version: KERR_SCIENCE_PROFILE_AB_VERSION_V324,
    profiles: Object.freeze(["science-cinematic-v5-v299", "science-cinematic-v6-v300"]) as readonly ["science-cinematic-v5-v299", "science-cinematic-v6-v300"],
    scienceFields: scienceFieldsList,
    scienceTokenEquivalent: mismatches.length === 0,
    scienceTokenMismatches: Object.freeze(mismatches),
    cinematicTokensDistinct,
    scienceDigestStable,
    authorityDigest: Object.freeze({
      payloadDigestSha256: hud.payloadDigestSha256,
      bandArtifactSha256: hud.bandArtifactSha256,
      bandViewDigestSha256: hud.bandViewDigestSha256,
    }),
    currentHudStatus: hud.status,
    exportBoundary: "v323-read-only-provenance-view-stable-before-after-profile-ab",
    defaultBoundary: "manual-local-shadow-ab-only-default-legacy-v9",
    status: mismatches.length === 0 && scienceDigestStable ? "qualified-science-equivalent" : "blocked-science-token-drift",
  });
}
