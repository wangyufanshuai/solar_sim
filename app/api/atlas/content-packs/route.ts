import { NextResponse } from "next/server";
import {
  ATLAS_CONTENT_PACK_DELIVERY_VERSION,
  listAtlasContentPacksV3,
  resolveAtlasContentPackRoot,
} from "../../../lib/atlasContentPackServerV3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const root = resolveAtlasContentPackRoot({ configuredRoot: process.env.ATLAS_LOCAL_ASSET_PACK_ROOT });
  if (!root) return NextResponse.json({ available: false, packs: [] }, { status: 404 });
  try {
    const packs = await listAtlasContentPacksV3(root);
    return NextResponse.json({
      available: packs.length > 0,
      version: ATLAS_CONTENT_PACK_DELIVERY_VERSION,
      packs,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ available: false, packs: [], error: error instanceof Error ? error.message : String(error) }, { status: 404 });
  }
}
