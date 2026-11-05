import { atlasJsonResponseV275, atlasStrongEtagV275, consumeAtlasApiPolicyV275 } from "../../../../../lib/atlasApiPolicyV275";
import { KERR_REDSHIFT_DOUBLE_EDGE_IDENTIFIABILITY_API_VERSION_V495, type KerrRedshiftDoubleEdgeIdentifiabilityApiV495 } from "../../../../../lib/kerrRedshiftDoubleEdgeIdentifiabilityV495";
import { loadKerrRedshiftDoubleEdgeIdentifiabilityV495 } from "../../../../../lib/kerrRedshiftDoubleEdgeIdentifiabilityServerV495";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const bodyOf = (bytes: Uint8Array) => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
export async function GET(request: Request): Promise<Response> {
  const delivery = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE ?? "standalone-full";
  if (delivery !== "local-shadow") return atlasJsonResponseV275("relativity-evidence", { version: KERR_REDSHIFT_DOUBLE_EDGE_IDENTIFIABILITY_API_VERSION_V495, available: false, reason: delivery === "vercel-lite" ? "lite-boundary" : "local-shadow-only", summary: null } satisfies KerrRedshiftDoubleEdgeIdentifiabilityApiV495, { status: 200, headers: { "Cache-Control": "no-store" } });
  const limited = consumeAtlasApiPolicyV275(request, "relativity-evidence"); if (limited) return limited;
  try {
    const loaded = await loadKerrRedshiftDoubleEdgeIdentifiabilityV495(), url = new URL(request.url), format = url.searchParams.get("format"), download = url.searchParams.get("download");
    if (format !== null && format !== "svg") return atlasJsonResponseV275("relativity-evidence", { error: "unsupported-format" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    if (download !== null && download !== "audit" && download !== "svg") return atlasJsonResponseV275("relativity-evidence", { error: "unsupported-export" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    if (format === "svg" || download === "svg") return new Response(bodyOf(loaded.svg.bytes), { status: 200, headers: { "Content-Type": loaded.svg.contentType, ...(download === "svg" ? { "Content-Disposition": `attachment; filename=${loaded.svg.name}` } : {}), "Cache-Control": "no-store", ETag: `"${loaded.svg.fileSha256}"`, "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox", "X-Atlas-Kerr-Redshift-Double-Edge": "v495-svg" } });
    if (download === "audit") return new Response(bodyOf(loaded.artifactExport.bytes), { status: 200, headers: { "Content-Type": loaded.artifactExport.contentType, "Content-Disposition": `attachment; filename=${loaded.artifactExport.name}`, "Cache-Control": "no-store", ETag: `"${loaded.artifactExport.fileSha256}"`, "X-Content-Type-Options": "nosniff", "X-Atlas-Kerr-Redshift-Double-Edge": "v495-artifact" } });
    const body = JSON.stringify({ version: KERR_REDSHIFT_DOUBLE_EDGE_IDENTIFIABILITY_API_VERSION_V495, available: true, reason: "ready", summary: loaded.summary } satisfies KerrRedshiftDoubleEdgeIdentifiabilityApiV495);
    if (Buffer.byteLength(body, "utf8") > 128 * 1024) throw new Error("v495-summary-size");
    return new Response(body, { status: 200, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ETag: atlasStrongEtagV275(body), "X-Content-Type-Options": "nosniff", "X-Atlas-Kerr-Redshift-Double-Edge": "v495-summary" } });
  } catch { return atlasJsonResponseV275("relativity-evidence", { version: KERR_REDSHIFT_DOUBLE_EDGE_IDENTIFIABILITY_API_VERSION_V495, available: false, reason: "evidence-corrupt", summary: null } satisfies KerrRedshiftDoubleEdgeIdentifiabilityApiV495, { status: 503, headers: { "Cache-Control": "no-store" } }); }
}
