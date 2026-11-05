import { atlasJsonResponseV275, atlasStrongEtagV275, consumeAtlasApiPolicyV275 } from "../../../../../lib/atlasApiPolicyV275";
import { atlasUtf8ByteLengthV270 } from "../../../../../lib/atlasApiSecurityV270";
import { loadKerrDetectorCalibrationPackV364 } from "../../../../../lib/kerrDetectorCalibrationPackServerV364";

export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const delivery = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE ?? "standalone-full";
  if (delivery !== "local-shadow") return atlasJsonResponseV275("relativity-evidence", { version: "v364-kerr-detector-calibration-acquisition-pack-v1", available: false, reason: delivery === "vercel-lite" ? "lite-boundary" : "local-shadow-only", artifact: null }, { status: 200 });
  const limited = consumeAtlasApiPolicyV275(request, "relativity-evidence"); if (limited) return limited;
  try {
    const artifact = await loadKerrDetectorCalibrationPackV364();
    const downloads = artifact.files.map((file) => ({ id: file.id, mediaType: file.mediaType, bytes: file.bytes, sha256: file.sha256, dataRowCount: file.dataRowCount, admissibleAsMeasured: false, url: `/api/atlas/relativity-evidence/v364/calibration-pack/files/${file.id}` }));
    const body = JSON.stringify({ version: artifact.version, available: true, reason: "ready", artifact, downloads });
    if (atlasUtf8ByteLengthV270(body) > 64 * 1024) return atlasJsonResponseV275("relativity-evidence", { error: "Relativity v364 calibration pack exceeds 64 KiB" }, { status: 413 });
    return new Response(body, { status: 200, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ETag: atlasStrongEtagV275(body), "X-Atlas-Calibration-Pack": "v364" } });
  } catch { return atlasJsonResponseV275("relativity-evidence", { version: "v364-kerr-detector-calibration-acquisition-pack-v1", available: false, reason: "evidence-corrupt", artifact: null }, { status: 503 }); }
}
