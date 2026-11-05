import { atlasJsonResponseV275, atlasStrongEtagV275, consumeAtlasApiPolicyV275 } from "../../../../../lib/atlasApiPolicyV275";
import { KERR_LICENSE_CONFIRMATION_PACKET_API_VERSION_V552, type KerrLicenseConfirmationPacketApiV552 } from "../../../../../lib/kerrLicenseConfirmationPacketV552";
import { loadKerrLicenseConfirmationPacketV552, type KerrLicenseConfirmationPacketExportIdV552 } from "../../../../../lib/kerrLicenseConfirmationPacketServerV552";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const EXPORTS = new Set<KerrLicenseConfirmationPacketExportIdV552>(["atlas", "receipt"]);

export async function GET(request: Request): Promise<Response> {
  const delivery = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE ?? "standalone-full";
  if (delivery !== "local-shadow") {
    return atlasJsonResponseV275("relativity-evidence", {
      version: KERR_LICENSE_CONFIRMATION_PACKET_API_VERSION_V552,
      available: false,
      reason: delivery === "vercel-lite" ? "lite-boundary" : "local-shadow-only",
      summary: null,
    } satisfies KerrLicenseConfirmationPacketApiV552, { status: 200, headers: { "Cache-Control": "no-store" } });
  }
  const limited = consumeAtlasApiPolicyV275(request, "relativity-evidence");
  if (limited) return limited;
  try {
    const loaded = await loadKerrLicenseConfirmationPacketV552();
    const download = new URL(request.url).searchParams.get("download");
    if (download !== null) {
      if (!EXPORTS.has(download as KerrLicenseConfirmationPacketExportIdV552)) return atlasJsonResponseV275("relativity-evidence", { error: "unsupported-export" }, { status: 400, headers: { "Cache-Control": "no-store" } });
      const entry = loaded.exports[download as KerrLicenseConfirmationPacketExportIdV552];
      return new Response(entry.bytes.buffer.slice(entry.bytes.byteOffset, entry.bytes.byteOffset + entry.bytes.byteLength) as ArrayBuffer, {
        headers: { "Content-Type": entry.contentType, "Content-Disposition": `attachment; filename=${entry.name}`, "Cache-Control": "no-store", ETag: `"${entry.fileSha256}"`, "X-Atlas-Kerr-Product": `v552-${download}-confirmation-packet-not-production` },
      });
    }
    const body = JSON.stringify({ version: KERR_LICENSE_CONFIRMATION_PACKET_API_VERSION_V552, available: true, reason: "ready", summary: loaded.artifact } satisfies KerrLicenseConfirmationPacketApiV552);
    if (Buffer.byteLength(body, "utf8") > 128 * 1024) throw new Error("v552-summary-size");
    return new Response(body, { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ETag: atlasStrongEtagV275(body), "X-Atlas-Kerr-Product": "v552-license-confirmation-packet-summary-not-production" } });
  } catch {
    return atlasJsonResponseV275("relativity-evidence", { version: KERR_LICENSE_CONFIRMATION_PACKET_API_VERSION_V552, available: false, reason: "evidence-corrupt", summary: null } satisfies KerrLicenseConfirmationPacketApiV552, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
