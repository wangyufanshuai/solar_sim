import { atlasJsonResponseV275, atlasStrongEtagV275, consumeAtlasApiPolicyV275 } from "../../../../../lib/atlasApiPolicyV275";
import { KERR_SCATTERING_CORRECTED_RESPONSE_VERSION_V409, type KerrScatteringCorrectedResponseV409 } from "../../../../../lib/kerrScatteringCorrectedV409";
import { loadKerrScatteringCorrectedArtifactV409 } from "../../../../../lib/kerrScatteringCorrectedServerV409";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const delivery = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE ?? "standalone-full";
  if (delivery !== "local-shadow") return atlasJsonResponseV275("relativity-evidence", { version: KERR_SCATTERING_CORRECTED_RESPONSE_VERSION_V409, available: false, reason: delivery === "vercel-lite" ? "lite-boundary" : "local-shadow-only", summary: null } satisfies KerrScatteringCorrectedResponseV409, { status: 200, headers: { "Cache-Control": "no-store" } });
  const limited = consumeAtlasApiPolicyV275(request, "relativity-evidence"); if (limited) return limited;
  try {
    const loaded = await loadKerrScatteringCorrectedArtifactV409();
    if (new URL(request.url).searchParams.get("download") === "1") { const body = loaded.bytes.buffer.slice(loaded.bytes.byteOffset, loaded.bytes.byteOffset + loaded.bytes.byteLength) as ArrayBuffer; return new Response(body, { status: 200, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "Content-Disposition": "attachment; filename=orbit-atlas-v409-corrected-sparse-stokes.json", ETag: `"${loaded.fileSha256}"`, "X-Atlas-Kerr-Scattering-Correction": "v409-full-artifact" } }); }
    const body = JSON.stringify({ version: KERR_SCATTERING_CORRECTED_RESPONSE_VERSION_V409, available: true, reason: "ready", summary: loaded.summary } satisfies KerrScatteringCorrectedResponseV409); if (Buffer.byteLength(body, "utf8") > 128 * 1024) throw new Error("v409-corrected-summary-size");
    return new Response(body, { status: 200, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ETag: atlasStrongEtagV275(body), "X-Atlas-Kerr-Scattering-Correction": "v409-summary" } });
  } catch { return atlasJsonResponseV275("relativity-evidence", { version: KERR_SCATTERING_CORRECTED_RESPONSE_VERSION_V409, available: false, reason: "evidence-corrupt", summary: null } satisfies KerrScatteringCorrectedResponseV409, { status: 503, headers: { "Cache-Control": "no-store" } }); }
}
