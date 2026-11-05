import { atlasJsonResponseV275, atlasStrongEtagV275, consumeAtlasApiPolicyV275 } from "../../../../../lib/atlasApiPolicyV275";
import { atlasUtf8ByteLengthV270 } from "../../../../../lib/atlasApiSecurityV270";
import { loadKerrScienceBandObservationV350 } from "../../../../../lib/kerrScienceBandObservationServerV350";

export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  if ((process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE ?? "standalone-full") === "vercel-lite") return atlasJsonResponseV275("relativity-evidence", { version: "v350-kerr-science-band-observation-v1", available: false, reason: "lite-boundary", artifact: null }, { status: 200, headers: { "Cache-Control": "no-store" } });
  const limited = consumeAtlasApiPolicyV275(request, "relativity-evidence"); if (limited) return limited;
  try { const artifact = await loadKerrScienceBandObservationV350(); const serialized = JSON.stringify({ version: "v350-kerr-science-band-observation-v1", available: true, reason: "ready", artifact }); if (atlasUtf8ByteLengthV270(serialized) > 96 * 1024) return atlasJsonResponseV275("relativity-evidence", { error: "Relativity v350 observation exceeds 96 KiB" }, { status: 413, headers: { "Cache-Control": "no-store" } }); return new Response(serialized, { status: 200, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ETag: atlasStrongEtagV275(serialized), "X-Atlas-Relativity-Observation": "v350", "X-Atlas-Api-Policy": "v275-unified-bounded-api-policy-v1" } }); } catch { return atlasJsonResponseV275("relativity-evidence", { version: "v350-kerr-science-band-observation-v1", available: false, reason: "evidence-corrupt", artifact: null }, { status: 503, headers: { "Cache-Control": "no-store" } }); }
}
