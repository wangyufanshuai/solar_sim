import { atlasJsonResponseV275, atlasStrongEtagV275, consumeAtlasApiPolicyV275 } from "../../../../../lib/atlasApiPolicyV275";
import { atlasUtf8ByteLengthV270 } from "../../../../../lib/atlasApiSecurityV270";
import { loadKerrInstrumentLabSnapshotV362 } from "../../../../../lib/kerrInstrumentLabServerV362";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const deliveryProfile = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE ?? "standalone-full";
  if (deliveryProfile !== "local-shadow") return atlasJsonResponseV275("relativity-evidence", {
    version: "v362-kerr-instrument-lab-summary-v1",
    available: false,
    reason: deliveryProfile === "vercel-lite" ? "lite-boundary" : "local-shadow-only",
    snapshot: null,
  }, { status: 200 });
  const limited = consumeAtlasApiPolicyV275(request, "relativity-evidence");
  if (limited) return limited;
  try {
    const snapshot = await loadKerrInstrumentLabSnapshotV362();
    const body = JSON.stringify({ version: snapshot.version, available: true, reason: "ready", snapshot });
    if (atlasUtf8ByteLengthV270(body) > 32 * 1024) return atlasJsonResponseV275("relativity-evidence", { error: "Relativity v362 Instrument Lab exceeds 32 KiB" }, { status: 413 });
    return new Response(body, { status: 200, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ETag: atlasStrongEtagV275(body), "X-Atlas-Instrument-Lab": "v362" } });
  } catch {
    return atlasJsonResponseV275("relativity-evidence", { version: "v362-kerr-instrument-lab-summary-v1", available: false, reason: "evidence-corrupt", snapshot: null }, { status: 503 });
  }
}
