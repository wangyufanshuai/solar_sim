import {
  atlasJsonResponseV275,
  atlasStrongEtagV275,
  consumeAtlasApiPolicyV275,
} from "../../../../../lib/atlasApiPolicyV275";
import {
  KERR_INSTRUMENT_AUTHORITY_MATRIX_API_VERSION_V511,
  type KerrInstrumentAuthorityMatrixApiV511,
} from "../../../../../lib/kerrInstrumentAuthorityMatrixV511";
import { loadKerrInstrumentAuthorityMatrixV511 } from "../../../../../lib/kerrInstrumentAuthorityMatrixServerV511";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const delivery = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE ?? "standalone-full";
  if (delivery !== "local-shadow") {
    return atlasJsonResponseV275(
      "relativity-evidence",
      {
        version: KERR_INSTRUMENT_AUTHORITY_MATRIX_API_VERSION_V511,
        available: false,
        reason: delivery === "vercel-lite" ? "lite-boundary" : "local-shadow-only",
        summary: null,
      } satisfies KerrInstrumentAuthorityMatrixApiV511,
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }
  const limited = consumeAtlasApiPolicyV275(request, "relativity-evidence");
  if (limited) return limited;
  try {
    const loaded = await loadKerrInstrumentAuthorityMatrixV511();
    const download = new URL(request.url).searchParams.get("download");
    if (download !== null) {
      if (download !== "matrix") {
        return atlasJsonResponseV275(
          "relativity-evidence",
          { error: "unsupported-export" },
          { status: 400, headers: { "Cache-Control": "no-store" } },
        );
      }
      const body = loaded.export.bytes.buffer.slice(
        loaded.export.bytes.byteOffset,
        loaded.export.bytes.byteOffset + loaded.export.bytes.byteLength,
      ) as ArrayBuffer;
      return new Response(body, {
        status: 200,
        headers: {
          "Content-Type": loaded.export.contentType,
          "Content-Disposition": `attachment; filename=${loaded.export.name}`,
          "Cache-Control": "no-store",
          ETag: `"${loaded.export.fileSha256}"`,
          "X-Atlas-Instrument-Authority": "v511-matrix",
        },
      });
    }
    const body = JSON.stringify({
      version: KERR_INSTRUMENT_AUTHORITY_MATRIX_API_VERSION_V511,
      available: true,
      reason: "ready",
      summary: loaded.summary,
    } satisfies KerrInstrumentAuthorityMatrixApiV511);
    if (Buffer.byteLength(body, "utf8") > 128 * 1024) {
      throw new Error("v511-matrix-summary-size");
    }
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        ETag: atlasStrongEtagV275(body),
        "X-Atlas-Instrument-Authority": "v511-summary",
      },
    });
  } catch {
    return atlasJsonResponseV275(
      "relativity-evidence",
      {
        version: KERR_INSTRUMENT_AUTHORITY_MATRIX_API_VERSION_V511,
        available: false,
        reason: "evidence-corrupt",
        summary: null,
      } satisfies KerrInstrumentAuthorityMatrixApiV511,
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
