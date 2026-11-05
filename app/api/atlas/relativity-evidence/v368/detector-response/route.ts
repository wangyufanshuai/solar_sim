import { atlasJsonResponseV275, atlasStrongEtagV275, consumeAtlasApiPolicyV275 } from "../../../../../lib/atlasApiPolicyV275";
import { loadDetectorResponseAuthoritySnapshotV368 } from "../../../../../lib/detectorResponseAuthorityServerV368";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const delivery = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE ?? "standalone-full";
  if (delivery !== "local-shadow") return atlasJsonResponseV275("relativity-evidence", { version: "v368-detector-response-authority-snapshot-v1", available: false, reason: delivery === "vercel-lite" ? "lite-boundary" : "local-shadow-only", snapshot: null }, { status: 200 });
  const limited = consumeAtlasApiPolicyV275(request, "relativity-evidence");
  if (limited) return limited;
  try {
    const snapshot = await loadDetectorResponseAuthoritySnapshotV368();
    const body = JSON.stringify({ version: snapshot.version, available: true, reason: "ready", snapshot });
    if (Buffer.byteLength(body, "utf8") > 128 * 1024) return atlasJsonResponseV275("relativity-evidence", { error: "v368 detector response exceeds 128 KiB" }, { status: 413 });
    return new Response(body, { status: 200, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ETag: atlasStrongEtagV275(body), "X-Atlas-Detector-Response-Authority": "v368" } });
  } catch {
    return atlasJsonResponseV275("relativity-evidence", { version: "v368-detector-response-authority-snapshot-v1", available: false, reason: "evidence-corrupt", snapshot: null }, { status: 503 });
  }
}
