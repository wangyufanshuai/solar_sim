import { atlasJsonResponseV275, atlasStrongEtagV275, consumeAtlasApiPolicyV275 } from "../../../../../lib/atlasApiPolicyV275";
import { ORBIT_RELATIVITY_ENGINE_API_VERSION_V561, type OrbitRelativityEngineApiV561 } from "../../../../../lib/orbitRelativityEngineV561";
import { loadOrbitRelativityEngineV561, type OrbitRelativityEngineExportIdV561 } from "../../../../../lib/orbitRelativityEngineServerV561";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const EXPORTS = new Set<OrbitRelativityEngineExportIdV561>(["manifest", "summary", "fits", "image", "transportSummary", "transportFits"]);

export async function GET(request: Request): Promise<Response> {
  const delivery = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE ?? "standalone-full";
  if (delivery !== "local-shadow") return atlasJsonResponseV275("relativity-evidence", { version: ORBIT_RELATIVITY_ENGINE_API_VERSION_V561, available: false, reason: delivery === "vercel-lite" ? "lite-boundary" : "local-shadow-only", summary: null } satisfies OrbitRelativityEngineApiV561, { status: 200, headers: { "Cache-Control": "no-store" } });
  const limited = consumeAtlasApiPolicyV275(request, "relativity-evidence");
  if (limited) return limited;
  try {
    const loaded = await loadOrbitRelativityEngineV561();
    const download = new URL(request.url).searchParams.get("download");
    if (download !== null) {
      if (!EXPORTS.has(download as OrbitRelativityEngineExportIdV561)) return atlasJsonResponseV275("relativity-evidence", { error: "unsupported-export" }, { status: 400, headers: { "Cache-Control": "no-store" } });
      const entry = loaded.exports[download as OrbitRelativityEngineExportIdV561];
      return new Response(entry.bytes.buffer.slice(entry.bytes.byteOffset, entry.bytes.byteOffset + entry.bytes.byteLength) as ArrayBuffer, { headers: { "Content-Type": entry.contentType, "Content-Disposition": `attachment; filename=${entry.name}`, "Cache-Control": "no-store", ETag: `"${entry.fileSha256}"`, "X-Atlas-Relativity-Engine": "v561-cpu-reference-measured-unavailable-not-grmhd" } });
    }
    const body = JSON.stringify({ version: ORBIT_RELATIVITY_ENGINE_API_VERSION_V561, available: true, reason: "ready", summary: loaded.artifact } satisfies OrbitRelativityEngineApiV561);
    return new Response(body, { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ETag: atlasStrongEtagV275(body), "X-Atlas-Relativity-Engine": "v561-cpu-reference-measured-unavailable-not-grmhd" } });
  } catch {
    return atlasJsonResponseV275("relativity-evidence", { version: ORBIT_RELATIVITY_ENGINE_API_VERSION_V561, available: false, reason: "evidence-corrupt", summary: null } satisfies OrbitRelativityEngineApiV561, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
