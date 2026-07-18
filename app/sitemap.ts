import type { MetadataRoute } from "next";
import { ATLAS_PUBLIC_ORIGIN } from "./lib/atlasReleaseManifestV1";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: ATLAS_PUBLIC_ORIGIN, changeFrequency: "monthly", priority: 1 },
    { url: `${ATLAS_PUBLIC_ORIGIN}/downloads`, changeFrequency: "monthly", priority: 0.7 },
  ];
}
