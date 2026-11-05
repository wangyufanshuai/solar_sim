import {
  atlasJsonResponseV275,
  atlasStrongEtagV275,
  consumeAtlasApiPolicyV275,
} from "../../../../../lib/atlasApiPolicyV275";
import {
  SCIENCE_PRODUCT_PROMOTION_API_VERSION_V457,
  type ScienceProductPromotionApiV457,
} from "../../../../../lib/scienceProductPromotionGateV457";
import { loadScienceProductPromotionV457 } from "../../../../../lib/scienceProductPromotionServerV457";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const delivery =
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE ?? "standalone-full";
  if (delivery !== "local-shadow") {
    return atlasJsonResponseV275(
      "relativity-evidence",
      {
        version: SCIENCE_PRODUCT_PROMOTION_API_VERSION_V457,
        available: false,
        reason: delivery === "vercel-lite" ? "lite-boundary" : "local-shadow-only",
        summary: null,
      } satisfies ScienceProductPromotionApiV457,
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }
  const limited = consumeAtlasApiPolicyV275(request, "relativity-evidence");
  if (limited) return limited;
  try {
    const loaded = await loadScienceProductPromotionV457();
    const download = new URL(request.url).searchParams.get("download");
    if (download !== null) {
      if (download !== "gate") {
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
          "X-Atlas-Science-Product-Gate": "v457-artifact",
        },
      });
    }
    const body = JSON.stringify({
      version: SCIENCE_PRODUCT_PROMOTION_API_VERSION_V457,
      available: true,
      reason: "ready",
      summary: loaded.summary,
    } satisfies ScienceProductPromotionApiV457);
    if (Buffer.byteLength(body, "utf8") > 128 * 1024) {
      throw new Error("v457-summary-size");
    }
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        ETag: atlasStrongEtagV275(body),
        "X-Atlas-Science-Product-Gate": "v457-summary",
      },
    });
  } catch {
    return atlasJsonResponseV275(
      "relativity-evidence",
      {
        version: SCIENCE_PRODUCT_PROMOTION_API_VERSION_V457,
        available: false,
        reason: "evidence-corrupt",
        summary: null,
      } satisfies ScienceProductPromotionApiV457,
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
