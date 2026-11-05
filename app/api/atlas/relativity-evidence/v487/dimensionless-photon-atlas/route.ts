import {
  atlasJsonResponseV275,
  atlasStrongEtagV275,
  consumeAtlasApiPolicyV275,
} from "../../../../../lib/atlasApiPolicyV275";
import {
  KERR_DIMENSIONLESS_PHOTON_ATLAS_API_VERSION_V487,
  type KerrDimensionlessPhotonAtlasApiV487,
} from "../../../../../lib/kerrDimensionlessPhotonAtlasV487";
import { loadKerrDimensionlessPhotonAtlasV487 } from "../../../../../lib/kerrDimensionlessPhotonAtlasServerV487";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodyOf = (bytes: Uint8Array) => bytes.buffer.slice(
  bytes.byteOffset,
  bytes.byteOffset + bytes.byteLength,
) as ArrayBuffer;

export async function GET(request: Request): Promise<Response> {
  const delivery = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE ?? "standalone-full";
  if (delivery !== "local-shadow") {
    return atlasJsonResponseV275(
      "relativity-evidence",
      {
        version: KERR_DIMENSIONLESS_PHOTON_ATLAS_API_VERSION_V487,
        available: false,
        reason: delivery === "vercel-lite" ? "lite-boundary" : "local-shadow-only",
        summary: null,
      } satisfies KerrDimensionlessPhotonAtlasApiV487,
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }
  const limited = consumeAtlasApiPolicyV275(request, "relativity-evidence");
  if (limited) return limited;
  try {
    const loaded = await loadKerrDimensionlessPhotonAtlasV487();
    const url = new URL(request.url);
    const format = url.searchParams.get("format");
    const download = url.searchParams.get("download");
    if (format !== null && format !== "svg") {
      return atlasJsonResponseV275(
        "relativity-evidence",
        { error: "unsupported-format" },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }
    if (download !== null && download !== "atlas" && download !== "svg") {
      return atlasJsonResponseV275(
        "relativity-evidence",
        { error: "unsupported-export" },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }
    if (format === "svg" || download === "svg") {
      return new Response(bodyOf(loaded.svg.bytes), {
        status: 200,
        headers: {
          "Content-Type": loaded.svg.contentType,
          ...(download === "svg" ? { "Content-Disposition": `attachment; filename=${loaded.svg.name}` } : {}),
          "Cache-Control": "no-store",
          ETag: `"${loaded.svg.fileSha256}"`,
          "X-Content-Type-Options": "nosniff",
          "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
          "X-Atlas-Kerr-Dimensionless-Photon": "v487-svg",
        },
      });
    }
    if (download === "atlas") {
      return new Response(bodyOf(loaded.artifactExport.bytes), {
        status: 200,
        headers: {
          "Content-Type": loaded.artifactExport.contentType,
          "Content-Disposition": `attachment; filename=${loaded.artifactExport.name}`,
          "Cache-Control": "no-store",
          ETag: `"${loaded.artifactExport.fileSha256}"`,
          "X-Content-Type-Options": "nosniff",
          "X-Atlas-Kerr-Dimensionless-Photon": "v487-artifact",
        },
      });
    }
    const body = JSON.stringify({
      version: KERR_DIMENSIONLESS_PHOTON_ATLAS_API_VERSION_V487,
      available: true,
      reason: "ready",
      summary: loaded.summary,
    } satisfies KerrDimensionlessPhotonAtlasApiV487);
    if (Buffer.byteLength(body, "utf8") > 128 * 1024) throw new Error("v487-summary-size");
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        ETag: atlasStrongEtagV275(body),
        "X-Content-Type-Options": "nosniff",
        "X-Atlas-Kerr-Dimensionless-Photon": "v487-summary",
      },
    });
  } catch {
    return atlasJsonResponseV275(
      "relativity-evidence",
      {
        version: KERR_DIMENSIONLESS_PHOTON_ATLAS_API_VERSION_V487,
        available: false,
        reason: "evidence-corrupt",
        summary: null,
      } satisfies KerrDimensionlessPhotonAtlasApiV487,
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
