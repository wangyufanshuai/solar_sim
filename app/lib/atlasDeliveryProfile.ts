export const ATLAS_DELIVERY_PROFILE_VERSION = "v171-dual-web-delivery" as const;

export type AtlasDeliveryProfile = "standalone-full" | "vercel-lite";

export function getAtlasDeliveryProfile(
  configured = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE,
): AtlasDeliveryProfile {
  return configured === "vercel-lite" ? "vercel-lite" : "standalone-full";
}

export function atlasPublicAssetUrl(
  assetPath: string,
  profile: AtlasDeliveryProfile = getAtlasDeliveryProfile(),
): string {
  const cleanPath = assetPath.replaceAll("\\", "/").replace(/^\/+/, "");
  return profile === "vercel-lite"
    ? cleanPath.startsWith("atlas-lite/")
      ? `/${cleanPath}`
      : `/atlas-lite/${cleanPath}`
    : `/${cleanPath}`;
}

export function atlasDeliveryCapabilities(profile = getAtlasDeliveryProfile()) {
  return profile === "vercel-lite"
    ? {
        profile,
        localContentPacks: false,
        millionStarCatalog: false,
        fullObservationFixtures: false,
        overview: true,
        objectInspect: true,
        liteSearch: true,
        launchDemo: true,
      }
    : {
        profile,
        localContentPacks: true,
        millionStarCatalog: true,
        fullObservationFixtures: true,
        overview: true,
        objectInspect: true,
        liteSearch: true,
        launchDemo: true,
      };
}
