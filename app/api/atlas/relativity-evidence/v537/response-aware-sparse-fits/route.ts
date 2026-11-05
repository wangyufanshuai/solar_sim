import { atlasJsonResponseV275, atlasStrongEtagV275, consumeAtlasApiPolicyV275 } from "../../../../../lib/atlasApiPolicyV275";
import { KERR_RESPONSE_AWARE_SPARSE_FITS_API_VERSION_V537, type KerrResponseAwareSparseFitsApiV537 } from "../../../../../lib/kerrResponseAwareSparseFitsV537";
import { loadKerrResponseAwareSparseFitsV537 } from "../../../../../lib/kerrResponseAwareSparseFitsServerV537";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const delivery = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE ?? "standalone-full";
  if (delivery !== "local-shadow") return atlasJsonResponseV275("relativity-evidence", {
    version: KERR_RESPONSE_AWARE_SPARSE_FITS_API_VERSION_V537,
    available: false,
    reason: delivery === "vercel-lite" ? "lite-boundary" : "local-shadow-only",
    summary: null,
  } satisfies KerrResponseAwareSparseFitsApiV537, { status: 200, headers: { "Cache-Control": "no-store" } });
  const limited = consumeAtlasApiPolicyV275(request, "relativity-evidence");
  if (limited) return limited;
  try {
    const loaded = await loadKerrResponseAwareSparseFitsV537();
    const download = new URL(request.url).searchParams.get("download");
    if (download !== null) {
      if (!(download === "atlas" || download === "fits")) return atlasJsonResponseV275("relativity-evidence", { error: "unsupported-export" }, { status: 400, headers: { "Cache-Control": "no-store" } });
      const entry = loaded.exports[download];
      return new Response(entry.bytes.buffer.slice(entry.bytes.byteOffset, entry.bytes.byteOffset + entry.bytes.byteLength) as ArrayBuffer, {
        headers: {
          "Content-Type": entry.contentType,
          "Content-Disposition": `attachment; filename=${entry.name}`,
          "Cache-Control": "no-store",
          ETag: `"${entry.fileSha256}"`,
          "X-Atlas-Kerr-Product": `v537-${download}-binary-table-not-image-hdu`,
        },
      });
    }
    const body = JSON.stringify({ version: KERR_RESPONSE_AWARE_SPARSE_FITS_API_VERSION_V537, available: true, reason: "ready", summary: loaded.summary } satisfies KerrResponseAwareSparseFitsApiV537);
    if (Buffer.byteLength(body, "utf8") > 128 * 1024) throw new Error("v537-summary-size");
    return new Response(body, { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ETag: atlasStrongEtagV275(body), "X-Atlas-Kerr-Product": "v537-summary-binary-table-not-image-hdu" } });
  } catch {
    return atlasJsonResponseV275("relativity-evidence", { version: KERR_RESPONSE_AWARE_SPARSE_FITS_API_VERSION_V537, available: false, reason: "evidence-corrupt", summary: null } satisfies KerrResponseAwareSparseFitsApiV537, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
