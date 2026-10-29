import { NextResponse } from "next/server";
import {
  atlasContentPackManifestForClientV3,
  loadCachedAtlasContentPackDescriptorV3,
  resolveAtlasContentPackRoot,
} from "../../../../../lib/atlasContentPackServerV3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ pack: string }> },
) {
  const { pack } = await context.params;
  const root = resolveAtlasContentPackRoot({
    configuredRoot: process.env.ATLAS_LOCAL_ASSET_PACK_ROOT,
  });
  if (!root) {
    return NextResponse.json(
      { available: false, error: "Local content pack is not configured" },
      { status: 404 },
    );
  }

  try {
    const descriptor = await loadCachedAtlasContentPackDescriptorV3(root, pack);
    return NextResponse.json(atlasContentPackManifestForClientV3(descriptor), {
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { available: false, error: error instanceof Error ? error.message : String(error) },
      { status: 404 },
    );
  }
}
