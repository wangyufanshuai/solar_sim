import { createHash } from "node:crypto";
import { atlasJsonResponseV275, consumeAtlasApiPolicyV275 } from "../../../../../lib/atlasApiPolicyV275";
import { atlasUtf8ByteLengthV270 } from "../../../../../lib/atlasApiSecurityV270";
import { loadKerrScienceImageProbeV346 } from "../../../../../lib/kerrScienceImageProbeServerV346";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  if ((process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE ?? "standalone-full") === "vercel-lite") return atlasJsonResponseV275("relativity-evidence", { available: false, reason: "lite-boundary" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  const limited = consumeAtlasApiPolicyV275(request, "relativity-evidence"); if (limited) return limited;
  try {
    const artifact = await loadKerrScienceImageProbeV346(); const serialized = JSON.stringify(artifact); const length = atlasUtf8ByteLengthV270(serialized);
    if (length <= 0 || length > 64 * 1024) throw new Error("v346-probe-response-size");
    const etag = createHash("sha256").update(serialized).digest("hex");
    return new Response(serialized, { status: 200, headers: { "Content-Type": "application/json; charset=utf-8", "Content-Length": String(length), "Cache-Control": "private, no-store", ETag: `"${etag}"`, "X-Atlas-Science-Probe": "v346", "X-Atlas-Api-Policy": "v275-unified-bounded-api-policy-v1" } });
  } catch { return atlasJsonResponseV275("relativity-evidence", { error: "Science image probe failed integrity validation" }, { status: 503, headers: { "Cache-Control": "no-store" } }); }
}
