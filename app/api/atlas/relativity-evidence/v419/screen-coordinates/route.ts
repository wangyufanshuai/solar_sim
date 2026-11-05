import { atlasJsonResponseV275, atlasStrongEtagV275, consumeAtlasApiPolicyV275 } from "../../../../../lib/atlasApiPolicyV275";
import { KERR_SCREEN_COORDINATE_RESPONSE_VERSION_V419, type KerrScreenCoordinateResponseV419 } from "../../../../../lib/kerrScreenCoordinateProvenanceV419";
import { loadKerrScreenCoordinateProvenanceV419 } from "../../../../../lib/kerrScreenCoordinateProvenanceServerV419";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const delivery = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE ?? "standalone-full";
  if (delivery !== "local-shadow") return atlasJsonResponseV275("relativity-evidence", { version: KERR_SCREEN_COORDINATE_RESPONSE_VERSION_V419, available: false, reason: delivery === "vercel-lite" ? "lite-boundary" : "local-shadow-only", summary: null } satisfies KerrScreenCoordinateResponseV419, { status: 200, headers: { "Cache-Control": "no-store" } });
  const limited = consumeAtlasApiPolicyV275(request, "relativity-evidence");
  if (limited) return limited;
  try {
    const loaded = await loadKerrScreenCoordinateProvenanceV419();
    const format = new URL(request.url).searchParams.get("download");
    if (format !== null) {
      if (!(format === "json" || format === "csv" || format === "fits" || format === "png")) return atlasJsonResponseV275("relativity-evidence", { error: "unsupported-export" }, { status: 400, headers: { "Cache-Control": "no-store" } });
      const entry = loaded.exports[format];
      const body = entry.bytes.buffer.slice(entry.bytes.byteOffset, entry.bytes.byteOffset + entry.bytes.byteLength) as ArrayBuffer;
      return new Response(body, { status: 200, headers: { "Content-Type": entry.contentType, "Cache-Control": "no-store", "Content-Disposition": `attachment; filename=${entry.name}`, ETag: `"${entry.fileSha256}"`, "X-Atlas-Kerr-Screen-Coordinates": `v419-${format}-${entry.semantic}` } });
    }
    const body = JSON.stringify({ version: KERR_SCREEN_COORDINATE_RESPONSE_VERSION_V419, available: true, reason: "ready", summary: loaded.summary } satisfies KerrScreenCoordinateResponseV419);
    if (Buffer.byteLength(body, "utf8") > 128 * 1024) throw new Error("v419-summary-size");
    return new Response(body, { status: 200, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ETag: atlasStrongEtagV275(body), "X-Atlas-Kerr-Screen-Coordinates": "v419-summary" } });
  } catch {
    return atlasJsonResponseV275("relativity-evidence", { version: KERR_SCREEN_COORDINATE_RESPONSE_VERSION_V419, available: false, reason: "evidence-corrupt", summary: null } satisfies KerrScreenCoordinateResponseV419, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
