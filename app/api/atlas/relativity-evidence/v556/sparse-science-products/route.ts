import { atlasJsonResponseV275, atlasStrongEtagV275, consumeAtlasApiPolicyV275 } from "../../../../../lib/atlasApiPolicyV275";
import { KERR_SPARSE_SCIENCE_IMAGE_PRODUCTS_API_VERSION_V556, type KerrSparseScienceImageProductsApiV556 } from "../../../../../lib/kerrSparseScienceImageProductsV556";
import { loadKerrSparseScienceImageProductsV556, type KerrSparseScienceImageProductsExportIdV556 } from "../../../../../lib/kerrSparseScienceImageProductsServerV556";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const EXPORTS = new Set<KerrSparseScienceImageProductsExportIdV556>(["manifest", "png", "fits", "receipt", "validator"]);

export async function GET(request: Request): Promise<Response> {
  const delivery = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE ?? "standalone-full";
  if (delivery !== "local-shadow") return atlasJsonResponseV275("relativity-evidence", { version: KERR_SPARSE_SCIENCE_IMAGE_PRODUCTS_API_VERSION_V556, available: false, reason: delivery === "vercel-lite" ? "lite-boundary" : "local-shadow-only", summary: null } satisfies KerrSparseScienceImageProductsApiV556, { status: 200, headers: { "Cache-Control": "no-store" } });
  const limited = consumeAtlasApiPolicyV275(request, "relativity-evidence");
  if (limited) return limited;
  try {
    const loaded = await loadKerrSparseScienceImageProductsV556();
    const download = new URL(request.url).searchParams.get("download");
    if (download !== null) {
      if (!EXPORTS.has(download as KerrSparseScienceImageProductsExportIdV556)) return atlasJsonResponseV275("relativity-evidence", { error: "unsupported-export" }, { status: 400, headers: { "Cache-Control": "no-store" } });
      const entry = loaded.exports[download as KerrSparseScienceImageProductsExportIdV556];
      return new Response(entry.bytes.buffer.slice(entry.bytes.byteOffset, entry.bytes.byteOffset + entry.bytes.byteLength) as ArrayBuffer, { headers: { "Content-Type": entry.contentType, "Content-Disposition": `attachment; filename=${entry.name}`, "Cache-Control": "no-store", ETag: `"${entry.fileSha256}"`, "X-Atlas-Kerr-Product": `v556-${download}-sparse-authority-not-dense-not-production` } });
    }
    const body = JSON.stringify({ version: KERR_SPARSE_SCIENCE_IMAGE_PRODUCTS_API_VERSION_V556, available: true, reason: "ready", summary: loaded.artifact } satisfies KerrSparseScienceImageProductsApiV556);
    if (Buffer.byteLength(body, "utf8") > 128 * 1024) throw new Error("v556-products-summary-size");
    return new Response(body, { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ETag: atlasStrongEtagV275(body), "X-Atlas-Kerr-Product": "v556-sparse-png-fits-not-dense-not-production" } });
  } catch {
    return atlasJsonResponseV275("relativity-evidence", { version: KERR_SPARSE_SCIENCE_IMAGE_PRODUCTS_API_VERSION_V556, available: false, reason: "evidence-corrupt", summary: null } satisfies KerrSparseScienceImageProductsApiV556, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
