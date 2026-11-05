import {
  atlasJsonResponseV275,
  atlasStrongEtagV275,
  consumeAtlasApiPolicyV275,
} from "../../../../../lib/atlasApiPolicyV275";
import {
  KERR_SPECTRAL_SENSITIVITY_MODES_API_VERSION_V483,
  type KerrSpectralSensitivityApiV483,
} from "../../../../../lib/kerrSpectralSensitivityModesV483";
import { loadKerrSpectralSensitivityV483 } from "../../../../../lib/kerrSpectralSensitivityServerV483";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const delivery = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE ?? "standalone-full";
  if (delivery !== "local-shadow") {
    return atlasJsonResponseV275(
      "relativity-evidence",
      {
        version: KERR_SPECTRAL_SENSITIVITY_MODES_API_VERSION_V483,
        available: false,
        reason: delivery === "vercel-lite" ? "lite-boundary" : "local-shadow-only",
        summary: null,
      } satisfies KerrSpectralSensitivityApiV483,
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }
  const limited = consumeAtlasApiPolicyV275(request, "relativity-evidence");
  if (limited) return limited;
  try {
    const loaded = await loadKerrSpectralSensitivityV483();
    const download = new URL(request.url).searchParams.get("download");
    if (download !== null) {
      if (download !== "sensitivity-modes") {
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
          "Content-Disposition": `attachment; filename=${entry.name}`,
          "Cache-Control": "no-store",
          ETag: `"${entry.fileSha256}"`,
          "X-Atlas-Kerr-Spectral-Sensitivity": "v483-artifact",
        },
      });
    }
    const body = JSON.stringify({
      version: KERR_SPECTRAL_SENSITIVITY_MODES_API_VERSION_V483,
      available: true,
      reason: "ready",
      summary: loaded.summary,
    } satisfies KerrSpectralSensitivityApiV483);
    if (Buffer.byteLength(body, "utf8") > 128 * 1024) throw new Error("v483-summary-size");
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        ETag: atlasStrongEtagV275(body),
        "X-Atlas-Kerr-Spectral-Sensitivity": "v483-summary",
      },
    });
  } catch {
    return atlasJsonResponseV275(
      "relativity-evidence",
      {
        version: KERR_SPECTRAL_SENSITIVITY_MODES_API_VERSION_V483,
        available: false,
        reason: "evidence-corrupt",
        summary: null,
      } satisfies KerrSpectralSensitivityApiV483,
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
