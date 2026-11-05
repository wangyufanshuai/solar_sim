import { atlasJsonResponseV275, atlasStrongEtagV275, consumeAtlasApiPolicyV275 } from "../../../../../lib/atlasApiPolicyV275";
import { KERR_POLARIMETER_CALIBRATION_RESPONSE_VERSION_V411, type PolarimeterCalibrationResponseV411 } from "../../../../../lib/kerrPolarimeterCalibrationV411";
import { loadPolarimeterCalibrationInspectV411 } from "../../../../../lib/kerrPolarimeterCalibrationServerV411";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const delivery = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE ?? "standalone-full";
  if (delivery !== "local-shadow") return atlasJsonResponseV275("relativity-evidence", { version: KERR_POLARIMETER_CALIBRATION_RESPONSE_VERSION_V411, available: false, reason: delivery === "vercel-lite" ? "lite-boundary" : "local-shadow-only", summary: null } satisfies PolarimeterCalibrationResponseV411, { status: 200, headers: { "Cache-Control": "no-store" } });
  const limited = consumeAtlasApiPolicyV275(request, "relativity-evidence");
  if (limited) return limited;
  try {
    const loaded = await loadPolarimeterCalibrationInspectV411();
    if (new URL(request.url).searchParams.get("download") === "1") {
      const body = loaded.bytes.buffer.slice(loaded.bytes.byteOffset, loaded.bytes.byteOffset + loaded.bytes.byteLength) as ArrayBuffer;
      return new Response(body, { status: 200, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "Content-Disposition": "attachment; filename=orbit-atlas-v411-polarimeter-calibration-inspect.json", ETag: `"${loaded.fileSha256}"`, "X-Atlas-Kerr-Calibration": "v411-full-inspect" } });
    }
    const body = JSON.stringify({ version: KERR_POLARIMETER_CALIBRATION_RESPONSE_VERSION_V411, available: true, reason: "ready", summary: loaded.summary } satisfies PolarimeterCalibrationResponseV411);
    if (Buffer.byteLength(body, "utf8") > 128 * 1024) throw new Error("v411-summary-size");
    return new Response(body, { status: 200, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ETag: atlasStrongEtagV275(body), "X-Atlas-Kerr-Calibration": "v411-summary" } });
  } catch {
    return atlasJsonResponseV275("relativity-evidence", { version: KERR_POLARIMETER_CALIBRATION_RESPONSE_VERSION_V411, available: false, reason: "evidence-corrupt", summary: null } satisfies PolarimeterCalibrationResponseV411, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
