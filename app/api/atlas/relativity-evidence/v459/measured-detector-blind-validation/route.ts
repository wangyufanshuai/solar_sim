import {
  atlasJsonResponseV275,
  atlasStrongEtagV275,
  consumeAtlasApiPolicyV275,
} from "../../../../../lib/atlasApiPolicyV275";
import {
  KERR_MEASURED_DETECTOR_BLIND_VALIDATION_API_VERSION_V459,
  type KerrMeasuredDetectorBlindValidationApiV459,
} from "../../../../../lib/kerrMeasuredDetectorBlindValidationV459";
import { loadKerrMeasuredDetectorBlindValidationV459 } from "../../../../../lib/kerrMeasuredDetectorBlindValidationServerV459";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const delivery = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE ?? "standalone-full";
  if (delivery !== "local-shadow") {
    return atlasJsonResponseV275(
      "relativity-evidence",
      {
        version: KERR_MEASURED_DETECTOR_BLIND_VALIDATION_API_VERSION_V459,
        available: false,
        reason: delivery === "vercel-lite" ? "lite-boundary" : "local-shadow-only",
        summary: null,
      } satisfies KerrMeasuredDetectorBlindValidationApiV459,
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }
  const limited = consumeAtlasApiPolicyV275(request, "relativity-evidence");
  if (limited) return limited;
  try {
    const loaded = await loadKerrMeasuredDetectorBlindValidationV459();
    const download = new URL(request.url).searchParams.get("download");
    if (download !== null) {
      if (download !== "validation") {
        return atlasJsonResponseV275(
          "relativity-evidence",
          { error: "unsupported-export" },
          { status: 400, headers: { "Cache-Control": "no-store" } },
        );
      }
      const entry = loaded.exports.validation;
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
          "X-Atlas-Blind-Validation": "v459-artifact",
        },
      });
    }
    const body = JSON.stringify({
      version: KERR_MEASURED_DETECTOR_BLIND_VALIDATION_API_VERSION_V459,
      available: true,
      reason: "ready",
      summary: loaded.summary,
    } satisfies KerrMeasuredDetectorBlindValidationApiV459);
    if (Buffer.byteLength(body, "utf8") > 128 * 1024) throw new Error("v459-summary-size");
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        ETag: atlasStrongEtagV275(body),
        "X-Atlas-Blind-Validation": "v459-summary",
      },
    });
  } catch {
    return atlasJsonResponseV275(
      "relativity-evidence",
      {
        version: KERR_MEASURED_DETECTOR_BLIND_VALIDATION_API_VERSION_V459,
        available: false,
        reason: "evidence-corrupt",
        summary: null,
      } satisfies KerrMeasuredDetectorBlindValidationApiV459,
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
