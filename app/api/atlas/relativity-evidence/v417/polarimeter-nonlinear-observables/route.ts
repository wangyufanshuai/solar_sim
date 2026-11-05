import {
  atlasJsonResponseV275,
  atlasStrongEtagV275,
  consumeAtlasApiPolicyV275,
} from "../../../../../lib/atlasApiPolicyV275";
import {
  KERR_POLARIMETER_NONLINEAR_OBSERVABLES_RESPONSE_VERSION_V417,
  type KerrPolarimeterNonlinearObservablesResponseV417,
} from "../../../../../lib/kerrPolarimeterNonlinearObservablesV417";
import { loadKerrPolarimeterNonlinearObservablesArtifactV417 } from "../../../../../lib/kerrPolarimeterNonlinearObservablesServerV417";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const delivery = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE ?? "standalone-full";
  if (delivery !== "local-shadow") {
    return atlasJsonResponseV275(
      "relativity-evidence",
      {
        version: KERR_POLARIMETER_NONLINEAR_OBSERVABLES_RESPONSE_VERSION_V417,
        available: false,
        reason: delivery === "vercel-lite" ? "lite-boundary" : "local-shadow-only",
        summary: null,
      } satisfies KerrPolarimeterNonlinearObservablesResponseV417,
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }
  const limited = consumeAtlasApiPolicyV275(request, "relativity-evidence");
  if (limited) return limited;
  try {
    const loaded = await loadKerrPolarimeterNonlinearObservablesArtifactV417();
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
          "Content-Disposition": "attachment; filename=orbit-atlas-v417-nonlinear-polarization.json",
          ETag: `"${loaded.fileSha256}"`,
          "X-Atlas-Kerr-Nonlinear-Polarization": "v417-full-artifact",
        },
      });
    }
    const body = JSON.stringify({
      version: KERR_POLARIMETER_NONLINEAR_OBSERVABLES_RESPONSE_VERSION_V417,
      available: true,
      reason: "ready",
      summary: loaded.summary,
    } satisfies KerrPolarimeterNonlinearObservablesResponseV417);
    if (Buffer.byteLength(body, "utf8") > 128 * 1024) throw new Error("v417-summary-size");
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        ETag: atlasStrongEtagV275(body),
        "X-Atlas-Kerr-Nonlinear-Polarization": "v417-summary",
      },
    });
  } catch {
    return atlasJsonResponseV275(
      "relativity-evidence",
      {
        version: KERR_POLARIMETER_NONLINEAR_OBSERVABLES_RESPONSE_VERSION_V417,
        available: false,
        reason: "evidence-corrupt",
        summary: null,
      } satisfies KerrPolarimeterNonlinearObservablesResponseV417,
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
