import { atlasJsonResponseV275, atlasStrongEtagV275, consumeAtlasApiPolicyV275 } from "../../../../../lib/atlasApiPolicyV275";
import { atlasUtf8ByteLengthV270 } from "../../../../../lib/atlasApiSecurityV270";
import { loadKerrDetectorCalibrationPlanV363 } from "../../../../../lib/kerrDetectorCalibrationPlanServerV363";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const deliveryProfile = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE ?? "standalone-full";
  if (deliveryProfile !== "local-shadow") return atlasJsonResponseV275("relativity-evidence", { version: "v363-kerr-detector-calibration-acquisition-plan-v1", available: false, reason: deliveryProfile === "vercel-lite" ? "lite-boundary" : "local-shadow-only", artifact: null }, { status: 200 });
  const limited = consumeAtlasApiPolicyV275(request, "relativity-evidence");
  if (limited) return limited;
  try {
    const artifact = await loadKerrDetectorCalibrationPlanV363();
    const body = JSON.stringify({ version: artifact.version, available: true, reason: "ready", artifact });
    if (atlasUtf8ByteLengthV270(body) > 128 * 1024) return atlasJsonResponseV275("relativity-evidence", { error: "Relativity v363 calibration plan exceeds 128 KiB" }, { status: 413 });
    return new Response(body, { status: 200, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ETag: atlasStrongEtagV275(body), "X-Atlas-Calibration-Plan": "v363" } });
  } catch {
    return atlasJsonResponseV275("relativity-evidence", { version: "v363-kerr-detector-calibration-acquisition-plan-v1", available: false, reason: "evidence-corrupt", artifact: null }, { status: 503 });
  }
}
