import {
  atlasJsonResponseV275,
  atlasStrongEtagV275,
  consumeAtlasApiPolicyV275,
} from "../../../../../lib/atlasApiPolicyV275";
import {
  KERR_POLARIMETER_STOKES_ENSEMBLE_RESPONSE_VERSION_V416,
  type KerrPolarimeterStokesEnsembleResponseV416,
} from "../../../../../lib/kerrPolarimeterStokesEnsembleV416";
import { loadKerrPolarimeterStokesEnsembleArtifactV416 } from "../../../../../lib/kerrPolarimeterStokesEnsembleServerV416";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const delivery = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE ?? "standalone-full";
  if (delivery !== "local-shadow") {
    return atlasJsonResponseV275(
      "relativity-evidence",
      {
        version: KERR_POLARIMETER_STOKES_ENSEMBLE_RESPONSE_VERSION_V416,
        available: false,
        reason: delivery === "vercel-lite" ? "lite-boundary" : "local-shadow-only",
        summary: null,
      } satisfies KerrPolarimeterStokesEnsembleResponseV416,
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }
  const limited = consumeAtlasApiPolicyV275(request, "relativity-evidence");
  if (limited) return limited;
  try {
    const loaded = await loadKerrPolarimeterStokesEnsembleArtifactV416();
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
          "Content-Disposition": "attachment; filename=orbit-atlas-v416-stokes-ensemble.json",
          ETag: `"${loaded.fileSha256}"`,
          "X-Atlas-Kerr-Stokes-Ensemble": "v416-full-artifact",
        },
      });
    }
    const body = JSON.stringify({
      version: KERR_POLARIMETER_STOKES_ENSEMBLE_RESPONSE_VERSION_V416,
      available: true,
      reason: "ready",
      summary: loaded.summary,
    } satisfies KerrPolarimeterStokesEnsembleResponseV416);
    if (Buffer.byteLength(body, "utf8") > 128 * 1024) throw new Error("v416-summary-size");
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        ETag: atlasStrongEtagV275(body),
        "X-Atlas-Kerr-Stokes-Ensemble": "v416-summary",
      },
    });
  } catch {
    return atlasJsonResponseV275(
      "relativity-evidence",
      {
        version: KERR_POLARIMETER_STOKES_ENSEMBLE_RESPONSE_VERSION_V416,
        available: false,
        reason: "evidence-corrupt",
        summary: null,
      } satisfies KerrPolarimeterStokesEnsembleResponseV416,
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
