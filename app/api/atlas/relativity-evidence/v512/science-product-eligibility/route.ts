import {
  atlasJsonResponseV275,
  atlasStrongEtagV275,
  consumeAtlasApiPolicyV275,
} from "../../../../../lib/atlasApiPolicyV275";
import {
  KERR_SCIENCE_PRODUCT_ELIGIBILITY_GRAPH_API_VERSION_V512,
  type KerrScienceProductEligibilityGraphApiV512,
} from "../../../../../lib/kerrScienceProductEligibilityGraphV512";
import { loadKerrScienceProductEligibilityGraphV512 } from "../../../../../lib/kerrScienceProductEligibilityGraphServerV512";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const delivery = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE ?? "standalone-full";
  if (delivery !== "local-shadow") {
    return atlasJsonResponseV275(
      "relativity-evidence",
      {
        version: KERR_SCIENCE_PRODUCT_ELIGIBILITY_GRAPH_API_VERSION_V512,
        available: false,
        reason: delivery === "vercel-lite" ? "lite-boundary" : "local-shadow-only",
        summary: null,
      } satisfies KerrScienceProductEligibilityGraphApiV512,
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }
  const limited = consumeAtlasApiPolicyV275(request, "relativity-evidence");
  if (limited) return limited;
  try {
    const loaded = await loadKerrScienceProductEligibilityGraphV512();
    const download = new URL(request.url).searchParams.get("download");
    if (download !== null) {
      if (download !== "graph") {
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
          "X-Atlas-Science-Product": "v512-eligibility-graph",
        },
      });
    }
    const body = JSON.stringify({
      version: KERR_SCIENCE_PRODUCT_ELIGIBILITY_GRAPH_API_VERSION_V512,
      available: true,
      reason: "ready",
      summary: loaded.summary,
    } satisfies KerrScienceProductEligibilityGraphApiV512);
    if (Buffer.byteLength(body, "utf8") > 128 * 1024) {
      throw new Error("v512-product-graph-summary-size");
    }
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        ETag: atlasStrongEtagV275(body),
        "X-Atlas-Science-Product": "v512-summary",
      },
    });
  } catch {
    return atlasJsonResponseV275(
      "relativity-evidence",
      {
        version: KERR_SCIENCE_PRODUCT_ELIGIBILITY_GRAPH_API_VERSION_V512,
        available: false,
        reason: "evidence-corrupt",
        summary: null,
      } satisfies KerrScienceProductEligibilityGraphApiV512,
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
