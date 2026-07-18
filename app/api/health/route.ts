import { NextResponse } from "next/server";
import type { AtlasProductionHealthV1 } from "../../lib/atlasReleaseManifestV1";

export const dynamic = "force-dynamic";

export async function GET() {
  const profile = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "vercel-lite"
    ? "vercel-lite"
    : "standalone-full";
  const health: AtlasProductionHealthV1 = {
    schemaVersion: "v227-atlas-production-health-v1",
    status: "ok",
    productVersion: "1.0.0",
    deliveryProfile: profile,
    defaultScientificKernel: "legacy-eih-1pn",
    deploymentId: process.env.VERCEL_DEPLOYMENT_ID || null,
    commitSha: process.env.VERCEL_GIT_COMMIT_SHA || null,
    checkedAt: new Date().toISOString(),
  };
  return NextResponse.json(health, {
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
