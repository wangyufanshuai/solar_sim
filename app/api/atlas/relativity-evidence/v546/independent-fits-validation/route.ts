import { atlasJsonResponseV275, atlasStrongEtagV275, consumeAtlasApiPolicyV275 } from "../../../../../lib/atlasApiPolicyV275";
import { KERR_INDEPENDENT_FITS_VALIDATION_API_VERSION_V546, type KerrIndependentFitsValidationApiV546 } from "../../../../../lib/kerrIndependentFitsValidationV546";
import { loadKerrIndependentFitsValidationV546, type KerrIndependentFitsExportIdV546 } from "../../../../../lib/kerrIndependentFitsValidationServerV546";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
const EXPORTS = new Set<KerrIndependentFitsExportIdV546>(["atlas", "receipt", "validator"]);
export async function GET(request: Request): Promise<Response> {
  const delivery = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE ?? "standalone-full";
  if (delivery !== "local-shadow") return atlasJsonResponseV275("relativity-evidence", { version: KERR_INDEPENDENT_FITS_VALIDATION_API_VERSION_V546, available: false, reason: delivery === "vercel-lite" ? "lite-boundary" : "local-shadow-only", summary: null } satisfies KerrIndependentFitsValidationApiV546, { status: 200, headers: { "Cache-Control": "no-store" } });
  const limited = consumeAtlasApiPolicyV275(request, "relativity-evidence"); if (limited) return limited;
  try {
    const loaded = await loadKerrIndependentFitsValidationV546(), download = new URL(request.url).searchParams.get("download");
    if (download !== null) { if (!EXPORTS.has(download as KerrIndependentFitsExportIdV546)) return atlasJsonResponseV275("relativity-evidence", { error: "unsupported-export" }, { status: 400, headers: { "Cache-Control": "no-store" } }); const entry = loaded.exports[download as KerrIndependentFitsExportIdV546]; return new Response(entry.bytes.buffer.slice(entry.bytes.byteOffset, entry.bytes.byteOffset + entry.bytes.byteLength) as ArrayBuffer, { headers: { "Content-Type": entry.contentType, "Content-Disposition": `attachment; filename=${entry.name}`, "Cache-Control": "no-store", ETag: `"${entry.fileSha256}"`, "X-Atlas-Kerr-Product": `v546-${download}-synthetic-validation-not-production` } }); }
    const body = JSON.stringify({ version: KERR_INDEPENDENT_FITS_VALIDATION_API_VERSION_V546, available: true, reason: "ready", summary: loaded.artifact } satisfies KerrIndependentFitsValidationApiV546); if (Buffer.byteLength(body, "utf8") > 128 * 1024) throw new Error("v546-summary-size");
    return new Response(body, { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ETag: atlasStrongEtagV275(body), "X-Atlas-Kerr-Product": "v546-independent-fits-summary-not-production" } });
  } catch { return atlasJsonResponseV275("relativity-evidence", { version: KERR_INDEPENDENT_FITS_VALIDATION_API_VERSION_V546, available: false, reason: "evidence-corrupt", summary: null } satisfies KerrIndependentFitsValidationApiV546, { status: 503, headers: { "Cache-Control": "no-store" } }); }
}
