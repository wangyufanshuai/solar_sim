import {
  atlasJsonResponseV275,
  atlasStrongEtagV275,
  consumeAtlasApiPolicyV275,
} from "../../../../../lib/atlasApiPolicyV275";
import {
  KERR_DETECTOR_EXPECTED_IMAGE_API_VERSION_V450,
  type KerrDetectorExpectedImageApiV450,
} from "../../../../../lib/kerrDetectorExpectedImageFormationV450";
import { loadKerrDetectorExpectedImageV450 } from "../../../../../lib/kerrDetectorExpectedImageFormationServerV450";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const EXPORTS = new Set(["qualification", "fixture", "oracle"] as const);

export async function GET(request: Request): Promise<Response> {
  const delivery =
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE ?? "standalone-full";
  if (delivery !== "local-shadow") {
    return atlasJsonResponseV275(
      "relativity-evidence",
      {
        version: KERR_DETECTOR_EXPECTED_IMAGE_API_VERSION_V450,
        available: false,
        reason: delivery === "vercel-lite" ? "lite-boundary" : "local-shadow-only",
        summary: null,
      } satisfies KerrDetectorExpectedImageApiV450,
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }
  const limited = consumeAtlasApiPolicyV275(request, "relativity-evidence");
  if (limited) return limited;
  try {
    const loaded = await loadKerrDetectorExpectedImageV450();
    const format = new URL(request.url).searchParams.get("download");
    if (format !== null) {
      if (!EXPORTS.has(format as never)) {
        return atlasJsonResponseV275(
          "relativity-evidence",
          { error: "unsupported-export" },
          { status: 400, headers: { "Cache-Control": "no-store" } },
        );
      }
      const entry = loaded.exports[format as keyof typeof loaded.exports];
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
          "X-Atlas-Kerr-Expected-Image": `v450-${format}`,
        },
      });
    }
    const body = JSON.stringify({
      version: KERR_DETECTOR_EXPECTED_IMAGE_API_VERSION_V450,
      available: true,
      reason: "ready",
      summary: loaded.summary,
    } satisfies KerrDetectorExpectedImageApiV450);
    if (Buffer.byteLength(body, "utf8") > 128 * 1024) {
      throw new Error("v450-summary-size");
    }
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        ETag: atlasStrongEtagV275(body),
        "X-Atlas-Kerr-Expected-Image": "v450-summary",
      },
    });
  } catch {
    return atlasJsonResponseV275(
      "relativity-evidence",
      {
        version: KERR_DETECTOR_EXPECTED_IMAGE_API_VERSION_V450,
        available: false,
        reason: "evidence-corrupt",
        summary: null,
      } satisfies KerrDetectorExpectedImageApiV450,
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
