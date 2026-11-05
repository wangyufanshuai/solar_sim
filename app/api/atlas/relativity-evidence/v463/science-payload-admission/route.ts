import { atlasJsonResponseV275, atlasStrongEtagV275, consumeAtlasApiPolicyV275 } from "../../../../../lib/atlasApiPolicyV275";
import { KERR_SCIENCE_PAYLOAD_ADMISSION_API_VERSION_V463, type KerrSciencePayloadAdmissionApiV463 } from "../../../../../lib/kerrSciencePayloadAdmissionV463";
import { loadKerrSciencePayloadAdmissionV463 } from "../../../../../lib/kerrSciencePayloadAdmissionServerV463";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const delivery = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE ?? "standalone-full";
  if (delivery !== "local-shadow") {
    return atlasJsonResponseV275("relativity-evidence", { version: KERR_SCIENCE_PAYLOAD_ADMISSION_API_VERSION_V463, available: false, reason: delivery === "vercel-lite" ? "lite-boundary" : "local-shadow-only", summary: null } satisfies KerrSciencePayloadAdmissionApiV463, { status: 200, headers: { "Cache-Control": "no-store" } });
  }
  const limited = consumeAtlasApiPolicyV275(request, "relativity-evidence");
  if (limited) return limited;
  try {
    const loaded = await loadKerrSciencePayloadAdmissionV463();
    const download = new URL(request.url).searchParams.get("download");
    if (download !== null) {
      if (download !== "admission") return atlasJsonResponseV275("relativity-evidence", { error: "unsupported-export" }, { status: 400, headers: { "Cache-Control": "no-store" } });
      const entry = loaded.export;
      const body = entry.bytes.buffer.slice(entry.bytes.byteOffset, entry.bytes.byteOffset + entry.bytes.byteLength) as ArrayBuffer;
      return new Response(body, { status: 200, headers: { "Content-Type": entry.contentType, "Content-Disposition": `attachment; filename=${entry.name}`, "Cache-Control": "no-store", ETag: `"${entry.fileSha256}"`, "X-Atlas-Payload-Admission": "v463-artifact" } });
    }
    const body = JSON.stringify({ version: KERR_SCIENCE_PAYLOAD_ADMISSION_API_VERSION_V463, available: true, reason: "ready", summary: loaded.summary } satisfies KerrSciencePayloadAdmissionApiV463);
    if (Buffer.byteLength(body, "utf8") > 128 * 1024) throw new Error("v463-summary-size");
    return new Response(body, { status: 200, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ETag: atlasStrongEtagV275(body), "X-Atlas-Payload-Admission": "v463-summary" } });
  } catch {
    return atlasJsonResponseV275("relativity-evidence", { version: KERR_SCIENCE_PAYLOAD_ADMISSION_API_VERSION_V463, available: false, reason: "evidence-corrupt", summary: null } satisfies KerrSciencePayloadAdmissionApiV463, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
