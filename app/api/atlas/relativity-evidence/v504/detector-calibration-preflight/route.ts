import {
  atlasJsonResponseV275,
  atlasStrongEtagV275,
  consumeAtlasApiPolicyV275,
} from "../../../../../lib/atlasApiPolicyV275";
import {
  KERR_MEASURED_CALIBRATION_PREFLIGHT_API_VERSION_V504,
  type KerrMeasuredCalibrationPreflightApiV504,
} from "../../../../../lib/kerrMeasuredCalibrationPreflightV504";
import { loadKerrMeasuredCalibrationPreflightV504 } from "../../../../../lib/kerrMeasuredCalibrationPreflightServerV504";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const delivery =
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE ?? "standalone-full";
  if (delivery !== "local-shadow") {
    return atlasJsonResponseV275(
      "relativity-evidence",
      {
        version: KERR_MEASURED_CALIBRATION_PREFLIGHT_API_VERSION_V504,
        available: false,
        reason: delivery === "vercel-lite" ? "lite-boundary" : "local-shadow-only",
        summary: null,
      } satisfies KerrMeasuredCalibrationPreflightApiV504,
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }
  const limited = consumeAtlasApiPolicyV275(request, "relativity-evidence");
  if (limited) return limited;
  try {
    const loaded = await loadKerrMeasuredCalibrationPreflightV504();
    if (new URL(request.url).searchParams.get("download") === "preflight") {
      const body = loaded.bytes.buffer.slice(
        loaded.bytes.byteOffset,
        loaded.bytes.byteOffset + loaded.bytes.byteLength,
      ) as ArrayBuffer;
      return new Response(body, {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": "attachment; filename=kerr-measured-calibration-preflight-v504.json",
          "Cache-Control": "no-store",
          ETag: `"${loaded.fileSha256}"`,
          "X-Atlas-Calibration-Preflight": "v504-artifact",
        },
      });
    }
    const body = JSON.stringify({
      version: KERR_MEASURED_CALIBRATION_PREFLIGHT_API_VERSION_V504,
      available: true,
      reason: "ready",
      summary: loaded.summary,
    } satisfies KerrMeasuredCalibrationPreflightApiV504);
    if (Buffer.byteLength(body, "utf8") > 128 * 1024) {
      throw new Error("v504-summary-size");
    }
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        ETag: atlasStrongEtagV275(body),
        "X-Atlas-Calibration-Preflight": "v504-summary",
      },
    });
  } catch {
    return atlasJsonResponseV275(
      "relativity-evidence",
      {
        version: KERR_MEASURED_CALIBRATION_PREFLIGHT_API_VERSION_V504,
        available: false,
        reason: "evidence-corrupt",
        summary: null,
      } satisfies KerrMeasuredCalibrationPreflightApiV504,
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
