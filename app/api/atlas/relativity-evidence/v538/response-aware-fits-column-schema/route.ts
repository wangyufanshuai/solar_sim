import { atlasJsonResponseV275, atlasStrongEtagV275, consumeAtlasApiPolicyV275 } from "../../../../../lib/atlasApiPolicyV275";
import { KERR_RESPONSE_AWARE_FITS_COLUMN_SCHEMA_API_VERSION_V538, type KerrResponseAwareFitsColumnSchemaApiV538 } from "../../../../../lib/kerrResponseAwareFitsColumnSchemaV538";
import { loadKerrResponseAwareFitsColumnSchemaV538 } from "../../../../../lib/kerrResponseAwareFitsColumnSchemaServerV538";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request): Promise<Response> {
  const delivery = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE ?? "standalone-full";
  if (delivery !== "local-shadow") return atlasJsonResponseV275("relativity-evidence", { version: KERR_RESPONSE_AWARE_FITS_COLUMN_SCHEMA_API_VERSION_V538, available: false, reason: delivery === "vercel-lite" ? "lite-boundary" : "local-shadow-only", summary: null } satisfies KerrResponseAwareFitsColumnSchemaApiV538, { status: 200, headers: { "Cache-Control": "no-store" } });
  const limited = consumeAtlasApiPolicyV275(request, "relativity-evidence");
  if (limited) return limited;
  try {
    const loaded = await loadKerrResponseAwareFitsColumnSchemaV538();
    const download = new URL(request.url).searchParams.get("download");
    if (download !== null) {
      if (!(download === "atlas" || download === "csv")) return atlasJsonResponseV275("relativity-evidence", { error: "unsupported-export" }, { status: 400, headers: { "Cache-Control": "no-store" } });
      const entry = loaded.exports[download];
      return new Response(entry.bytes.buffer.slice(entry.bytes.byteOffset, entry.bytes.byteOffset + entry.bytes.byteLength) as ArrayBuffer, { headers: { "Content-Type": entry.contentType, "Content-Disposition": `attachment; filename=${entry.name}`, "Cache-Control": "no-store", ETag: `"${entry.fileSha256}"`, "X-Atlas-Kerr-Product": `v538-${download}-column-semantics-not-measurement` } });
    }
    const body = JSON.stringify({ version: KERR_RESPONSE_AWARE_FITS_COLUMN_SCHEMA_API_VERSION_V538, available: true, reason: "ready", summary: loaded.summary } satisfies KerrResponseAwareFitsColumnSchemaApiV538);
    if (Buffer.byteLength(body, "utf8") > 256 * 1024) throw new Error("v538-summary-size");
    return new Response(body, { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ETag: atlasStrongEtagV275(body), "X-Atlas-Kerr-Product": "v538-summary-column-semantics-not-measurement" } });
  } catch {
    return atlasJsonResponseV275("relativity-evidence", { version: KERR_RESPONSE_AWARE_FITS_COLUMN_SCHEMA_API_VERSION_V538, available: false, reason: "evidence-corrupt", summary: null } satisfies KerrResponseAwareFitsColumnSchemaApiV538, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
