import { atlasJsonResponseV275, atlasStrongEtagV275, consumeAtlasApiPolicyV275 } from "../../../../../lib/atlasApiPolicyV275";
import { loadKerrPhysicalObservationTemplateV399 } from "../../../../../lib/kerrPhysicalObservationTemplateServerV399";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const delivery = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE ?? "standalone-full";
  if (delivery !== "local-shadow") return atlasJsonResponseV275("relativity-evidence", { version: "v399-kerr-physical-observation-template-diagnostic-v1", available: false, reason: delivery === "vercel-lite" ? "lite-boundary" : "local-shadow-only", artifact: null }, { status: 200 });
  const limited = consumeAtlasApiPolicyV275(request, "relativity-evidence");
  if (limited) return limited;
  try {
    const { artifact } = await loadKerrPhysicalObservationTemplateV399();
    const body = JSON.stringify({ version: artifact.version, available: true, reason: "ready", artifact });
    if (Buffer.byteLength(body, "utf8") > 128 * 1024) throw new Error("v399-response-size");
    return new Response(body, { status: 200, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ETag: atlasStrongEtagV275(body), "X-Atlas-Provenance-Template": "v399" } });
  } catch {
    return atlasJsonResponseV275("relativity-evidence", { version: "v399-kerr-physical-observation-template-diagnostic-v1", available: false, reason: "evidence-corrupt", artifact: null }, { status: 503 });
  }
}
