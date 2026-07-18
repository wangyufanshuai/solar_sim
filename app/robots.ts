import type { MetadataRoute } from "next";
import { ATLAS_PUBLIC_ORIGIN } from "./lib/atlasReleaseManifestV1";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/"] },
    sitemap: `${ATLAS_PUBLIC_ORIGIN}/sitemap.xml`,
    host: ATLAS_PUBLIC_ORIGIN,
  };
}
