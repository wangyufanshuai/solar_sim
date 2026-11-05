import {
  atlasJsonResponseV275,
  atlasStrongEtagV275,
  consumeAtlasApiPolicyV275,
} from "../../../../../lib/atlasApiPolicyV275";
import {
  KERR_POLARIMETER_DETECTOR_LIKELIHOOD_RESPONSE_VERSION_V415,
  type KerrPolarimeterDetectorLikelihoodResponseV415,
} from "../../../../../lib/kerrPolarimeterDetectorLikelihoodV415";
import { loadKerrPolarimeterDetectorLikelihoodArtifactV415 } from "../../../../../lib/kerrPolarimeterDetectorLikelihoodServerV415";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const delivery = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE ?? "standalone-full";
  if (delivery !== "local-shadow") {
    return atlasJsonResponseV275(
      "relativity-evidence",
      {
        version: KERR_POLARIMETER_DETECTOR_LIKELIHOOD_RESPONSE_VERSION_V415,
        available: false,
        reason: delivery === "vercel-lite" ? "lite-boundary" : "local-shadow-only",
        summary: null,
      } satisfies KerrPolarimeterDetectorLikelihoodResponseV415,
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }
  const limited = consumeAtlasApiPolicyV275(request, "relativity-evidence");
  if (limited) return limited;
  try {
    const loaded = await loadKerrPolarimeterDetectorLikelihoodArtifactV415();
    if (new URL(request.url).searchParams.get("download") === "1") {
      const body = loaded.bytes.buffer.slice(
        loaded.bytes.byteOffset,
        loaded.bytes.byteOffset + loaded.bytes.byteLength,
      ) as ArrayBuffer;
      return new Response(body, {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
          "Content-Disposition": "attachment; filename=orbit-atlas-v415-detector-noise-likelihood.json",
          ETag: `"${loaded.fileSha256}"`,
          "X-Atlas-Kerr-Detector-Likelihood": "v415-full-artifact",
        },
      });
    }
    const body = JSON.stringify({
      version: KERR_POLARIMETER_DETECTOR_LIKELIHOOD_RESPONSE_VERSION_V415,
      available: true,
      reason: "ready",
      summary: loaded.summary,
    } satisfies KerrPolarimeterDetectorLikelihoodResponseV415);
    if (Buffer.byteLength(body, "utf8") > 128 * 1024) throw new Error("v415-summary-size");
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        ETag: atlasStrongEtagV275(body),
        "X-Atlas-Kerr-Detector-Likelihood": "v415-summary",
      },
    });
  } catch {
    return atlasJsonResponseV275(
      "relativity-evidence",
      {
        version: KERR_POLARIMETER_DETECTOR_LIKELIHOOD_RESPONSE_VERSION_V415,
        available: false,
        reason: "evidence-corrupt",
        summary: null,
      } satisfies KerrPolarimeterDetectorLikelihoodResponseV415,
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
