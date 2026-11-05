import { atlasJsonResponseV275, atlasStrongEtagV275, consumeAtlasApiPolicyV275 } from "../../../../../lib/atlasApiPolicyV275";
import { KERR_SCATTERING_ORACLE_RESPONSE_VERSION_V408, type KerrScatteringOracleResponseV408 } from "../../../../../lib/kerrScatteringOracleV408";
import { loadKerrScatteringOracleArtifactV408 } from "../../../../../lib/kerrScatteringOracleServerV408";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const delivery = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE ?? "standalone-full";
  if (delivery !== "local-shadow") {
    return atlasJsonResponseV275("relativity-evidence", { version: KERR_SCATTERING_ORACLE_RESPONSE_VERSION_V408, available: false, reason: delivery === "vercel-lite" ? "lite-boundary" : "local-shadow-only", summary: null } satisfies KerrScatteringOracleResponseV408, { status: 200, headers: { "Cache-Control": "no-store" } });
  }
  const limited = consumeAtlasApiPolicyV275(request, "relativity-evidence");
  if (limited) return limited;
  try {
    const loaded = await loadKerrScatteringOracleArtifactV408();
    if (new URL(request.url).searchParams.get("download") === "1") {
      const body = loaded.bytes.buffer.slice(loaded.bytes.byteOffset, loaded.bytes.byteOffset + loaded.bytes.byteLength) as ArrayBuffer;
      return new Response(body, { status: 200, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "Content-Disposition": "attachment; filename=orbit-atlas-v408-scattering-oracle-portable-envelope.json", ETag: `"${loaded.fileSha256}"`, "X-Atlas-Kerr-Scattering-Oracle": "v408-full-artifact" } });
    }
    const body = JSON.stringify({ version: KERR_SCATTERING_ORACLE_RESPONSE_VERSION_V408, available: true, reason: "ready", summary: loaded.summary } satisfies KerrScatteringOracleResponseV408);
    if (Buffer.byteLength(body, "utf8") > 128 * 1024) throw new Error("v408-oracle-summary-size");
    return new Response(body, { status: 200, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ETag: atlasStrongEtagV275(body), "X-Atlas-Kerr-Scattering-Oracle": "v408-summary" } });
  } catch {
    return atlasJsonResponseV275("relativity-evidence", { version: KERR_SCATTERING_ORACLE_RESPONSE_VERSION_V408, available: false, reason: "evidence-corrupt", summary: null } satisfies KerrScatteringOracleResponseV408, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
