import {
  atlasJsonResponseV275,
  atlasStrongEtagV275,
  consumeAtlasApiPolicyV275,
} from "../../../../../lib/atlasApiPolicyV275";
import {
  KERR_DETECTOR_INPUT_ADMISSION_API_VERSION_V451,
  type KerrDetectorInputAdmissionApiV451,
} from "../../../../../lib/kerrDetectorInputAdmissionV451";
import { loadKerrDetectorInputAdmissionV451 } from "../../../../../lib/kerrDetectorInputAdmissionServerV451";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const delivery =
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE ?? "standalone-full";
  if (delivery !== "local-shadow") {
    return atlasJsonResponseV275(
      "relativity-evidence",
      {
        version: KERR_DETECTOR_INPUT_ADMISSION_API_VERSION_V451,
        available: false,
        reason: delivery === "vercel-lite" ? "lite-boundary" : "local-shadow-only",
        summary: null,
      } satisfies KerrDetectorInputAdmissionApiV451,
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }
  const limited = consumeAtlasApiPolicyV275(request, "relativity-evidence");
  if (limited) return limited;
  try {
    const loaded = await loadKerrDetectorInputAdmissionV451();
    const download = new URL(request.url).searchParams.get("download");
    if (download !== null && download !== "qualification") {
      return atlasJsonResponseV275(
        "relativity-evidence",
        { error: "unsupported-export" },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }
    if (download === "qualification") {
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
          "X-Atlas-Detector-Admission": "v451-qualification",
        },
      });
    }
    const body = JSON.stringify({
      version: KERR_DETECTOR_INPUT_ADMISSION_API_VERSION_V451,
      available: true,
      reason: "ready",
      summary: loaded.summary,
    } satisfies KerrDetectorInputAdmissionApiV451);
    if (Buffer.byteLength(body, "utf8") > 128 * 1024) {
      throw new Error("v451-summary-size");
    }
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        ETag: atlasStrongEtagV275(body),
        "X-Atlas-Detector-Admission": "v451-summary",
      },
    });
  } catch {
    return atlasJsonResponseV275(
      "relativity-evidence",
      {
        version: KERR_DETECTOR_INPUT_ADMISSION_API_VERSION_V451,
        available: false,
        reason: "evidence-corrupt",
        summary: null,
      } satisfies KerrDetectorInputAdmissionApiV451,
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
