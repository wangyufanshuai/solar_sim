import {
  atlasJsonResponseV275,
  atlasStrongEtagV275,
  consumeAtlasApiPolicyV275,
} from "../../../../../lib/atlasApiPolicyV275";
import {
  KERR_SPARSE_SCIENCE_PAYLOAD_API_VERSION_V474,
  type KerrSparseSciencePayloadApiV474,
} from "../../../../../lib/kerrSparseSciencePayloadV474";
import { loadKerrSparseSciencePayloadV474 } from "../../../../../lib/kerrSparseSciencePayloadServerV474";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const delivery = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE ?? "standalone-full";
  if (delivery !== "local-shadow") {
    return atlasJsonResponseV275(
      "relativity-evidence",
      {
        version: KERR_SPARSE_SCIENCE_PAYLOAD_API_VERSION_V474,
        available: false,
        reason: delivery === "vercel-lite" ? "lite-boundary" : "local-shadow-only",
        summary: null,
      } satisfies KerrSparseSciencePayloadApiV474,
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }
  const limited = consumeAtlasApiPolicyV275(request, "relativity-evidence");
  if (limited) return limited;
  try {
    const loaded = await loadKerrSparseSciencePayloadV474();
    const download = new URL(request.url).searchParams.get("download");
    if (download !== null) {
      if (download !== "sparse-payload") {
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
          "X-Atlas-Kerr-Sparse-Payload": "v474-artifact",
        },
      });
    }
    const body = JSON.stringify({
      version: KERR_SPARSE_SCIENCE_PAYLOAD_API_VERSION_V474,
      available: true,
      reason: "ready",
      summary: loaded.summary,
    } satisfies KerrSparseSciencePayloadApiV474);
    if (Buffer.byteLength(body, "utf8") > 128 * 1024) throw new Error("v474-summary-size");
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        ETag: atlasStrongEtagV275(body),
        "X-Atlas-Kerr-Sparse-Payload": "v474-summary",
      },
    });
  } catch {
    return atlasJsonResponseV275(
      "relativity-evidence",
      {
        version: KERR_SPARSE_SCIENCE_PAYLOAD_API_VERSION_V474,
        available: false,
        reason: "evidence-corrupt",
        summary: null,
      } satisfies KerrSparseSciencePayloadApiV474,
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
