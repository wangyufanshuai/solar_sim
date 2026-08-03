import { atlasJsonResponseV275, atlasStrongEtagV275, consumeAtlasApiPolicyV275 } from "../../../../../lib/atlasApiPolicyV275";
import { IXPE_METADATA_PROBE_API_VERSION_V563, type IxpeMetadataProbeApiV563 } from "../../../../../lib/ixpeMetadataProbeV563";
import { loadIxpeMetadataProbeV563 } from "../../../../../lib/ixpeMetadataProbeServerV563";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const delivery = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE ?? "standalone-full";
  if (delivery !== "local-shadow") return atlasJsonResponseV275("relativity-evidence", { version: IXPE_METADATA_PROBE_API_VERSION_V563, available: false, reason: delivery === "vercel-lite" ? "lite-boundary" : "local-shadow-only", summary: null } satisfies IxpeMetadataProbeApiV563, { status: 200, headers: { "Cache-Control": "no-store" } });
  const limited = consumeAtlasApiPolicyV275(request, "relativity-evidence");
  if (limited) return limited;
  try {
    const summary = await loadIxpeMetadataProbeV563();
    const body = JSON.stringify({ version: IXPE_METADATA_PROBE_API_VERSION_V563, available: true, reason: "ready", summary } satisfies IxpeMetadataProbeApiV563);
    return new Response(body, { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ETag: atlasStrongEtagV275(body), "X-Atlas-IXPE-Metadata": "v563-head-only-no-payload" } });
  } catch {
    return atlasJsonResponseV275("relativity-evidence", { version: IXPE_METADATA_PROBE_API_VERSION_V563, available: false, reason: "evidence-corrupt", summary: null } satisfies IxpeMetadataProbeApiV563, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
