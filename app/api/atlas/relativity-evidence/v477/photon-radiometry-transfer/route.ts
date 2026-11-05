import {
  atlasJsonResponseV275,
  atlasStrongEtagV275,
  consumeAtlasApiPolicyV275,
} from "../../../../../lib/atlasApiPolicyV275";
import {
  KERR_PHOTON_RADIOMETRY_API_VERSION_V477,
  type KerrPhotonRadiometryTransferApiV477,
} from "../../../../../lib/kerrPhotonRadiometryTransferV477";
import { loadKerrPhotonRadiometryTransferV477 } from "../../../../../lib/kerrPhotonRadiometryTransferServerV477";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const delivery = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE ?? "standalone-full";
  if (delivery !== "local-shadow") {
    return atlasJsonResponseV275(
      "relativity-evidence",
      {
        version: KERR_PHOTON_RADIOMETRY_API_VERSION_V477,
        available: false,
        reason: delivery === "vercel-lite" ? "lite-boundary" : "local-shadow-only",
        summary: null,
      } satisfies KerrPhotonRadiometryTransferApiV477,
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }
  const limited = consumeAtlasApiPolicyV275(request, "relativity-evidence");
  if (limited) return limited;
  try {
    const loaded = await loadKerrPhotonRadiometryTransferV477();
    const download = new URL(request.url).searchParams.get("download");
    if (download !== null) {
      if (download !== "transfer-payload") {
        return atlasJsonResponseV275(
          "relativity-evidence",
          { error: "unsupported-export" },
          { status: 400, headers: { "Cache-Control": "no-store" } },
        );
      }
      const entry = loaded.export;
      const body = entry.bytes.buffer.slice(
        entry.bytes.byteOffset,
        entry.bytes.byteOffset + entry.bytes.byteLength,
      ) as ArrayBuffer;
      return new Response(body, {
        status: 200,
        headers: {
          "Content-Type": entry.contentType,
          "Content-Disposition": "attachment; filename=" + entry.name,
          "Cache-Control": "no-store",
          ETag: "\"" + entry.fileSha256 + "\"",
          "X-Atlas-Kerr-Photon-Radiometry": "v477-artifact",
        },
      });
    }
    const body = JSON.stringify({
      version: KERR_PHOTON_RADIOMETRY_API_VERSION_V477,
      available: true,
      reason: "ready",
      summary: loaded.summary,
    } satisfies KerrPhotonRadiometryTransferApiV477);
    if (Buffer.byteLength(body, "utf8") > 128 * 1024) throw new Error("v477-summary-size");
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        ETag: atlasStrongEtagV275(body),
        "X-Atlas-Kerr-Photon-Radiometry": "v477-summary",
      },
    });
  } catch {
    return atlasJsonResponseV275(
      "relativity-evidence",
      {
        version: KERR_PHOTON_RADIOMETRY_API_VERSION_V477,
        available: false,
        reason: "evidence-corrupt",
        summary: null,
      } satisfies KerrPhotonRadiometryTransferApiV477,
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
