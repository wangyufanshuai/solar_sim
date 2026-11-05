import { atlasJsonResponseV275, atlasStrongEtagV275, consumeAtlasApiPolicyV275 } from "../../../../../lib/atlasApiPolicyV275";
import { KERR_DETECTOR_PROJECTION_ADMISSION_API_VERSION_V442, type KerrDetectorProjectionAdmissionApiV442 } from "../../../../../lib/kerrDetectorProjectionAdmissionV442";
import { loadKerrDetectorProjectionAdmissionV442 } from "../../../../../lib/kerrDetectorProjectionAdmissionServerV442";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const EXPORTS = new Set(["admission", "contract"] as const);
export async function GET(request: Request): Promise<Response> {
  const delivery = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE ?? "standalone-full";
  if (delivery !== "local-shadow") return atlasJsonResponseV275("relativity-evidence", { version: KERR_DETECTOR_PROJECTION_ADMISSION_API_VERSION_V442, available: false, reason: delivery === "vercel-lite" ? "lite-boundary" : "local-shadow-only", summary: null } satisfies KerrDetectorProjectionAdmissionApiV442, { status: 200, headers: { "Cache-Control": "no-store" } });
  const limited = consumeAtlasApiPolicyV275(request, "relativity-evidence");
  if (limited) return limited;
  try {
    const loaded = await loadKerrDetectorProjectionAdmissionV442();
    const format = new URL(request.url).searchParams.get("download");
    if (format !== null) {
      if (!EXPORTS.has(format as never)) return atlasJsonResponseV275("relativity-evidence", { error: "unsupported-export" }, { status: 400, headers: { "Cache-Control": "no-store" } });
      const entry = loaded.exports[format as keyof typeof loaded.exports];
      const body = entry.bytes.buffer.slice(entry.bytes.byteOffset, entry.bytes.byteOffset + entry.bytes.byteLength) as ArrayBuffer;
      return new Response(body, { status: 200, headers: { "Content-Type": entry.contentType, "Content-Disposition": `attachment; filename=${entry.name}`, "Cache-Control": "no-store", ETag: `"${entry.fileSha256}"`, "X-Atlas-Kerr-Detector-Projection": `v442-${format}` } });
    }
    const body = JSON.stringify({ version: KERR_DETECTOR_PROJECTION_ADMISSION_API_VERSION_V442, available: true, reason: "ready", summary: loaded.summary } satisfies KerrDetectorProjectionAdmissionApiV442);
    if (Buffer.byteLength(body, "utf8") > 128 * 1024) throw new Error("v442-summary-size");
    return new Response(body, { status: 200, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ETag: atlasStrongEtagV275(body), "X-Atlas-Kerr-Detector-Projection": "v442-summary" } });
  } catch { return atlasJsonResponseV275("relativity-evidence", { version: KERR_DETECTOR_PROJECTION_ADMISSION_API_VERSION_V442, available: false, reason: "evidence-corrupt", summary: null } satisfies KerrDetectorProjectionAdmissionApiV442, { status: 503, headers: { "Cache-Control": "no-store" } }); }
}
