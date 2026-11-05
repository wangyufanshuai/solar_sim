import {
  atlasJsonResponseV275,
  atlasStrongEtagV275,
  consumeAtlasApiPolicyV275,
} from "../../../../../lib/atlasApiPolicyV275";
import {
  KERR_OBSERVABLE_PROVENANCE_API_VERSION_V471,
  type KerrObservableProvenanceApiV471,
} from "../../../../../lib/kerrObservableProvenanceV471";
import { loadKerrObservableProvenanceV471 } from "../../../../../lib/kerrObservableProvenanceServerV471";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const delivery = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE ?? "standalone-full";
  if (delivery !== "local-shadow") {
    return atlasJsonResponseV275(
      "relativity-evidence",
      {
        version: KERR_OBSERVABLE_PROVENANCE_API_VERSION_V471,
        available: false,
        reason: delivery === "vercel-lite" ? "lite-boundary" : "local-shadow-only",
        summary: null,
      } satisfies KerrObservableProvenanceApiV471,
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }

  const limited = consumeAtlasApiPolicyV275(request, "relativity-evidence");
  if (limited) return limited;

  try {
    const loaded = await loadKerrObservableProvenanceV471();
    const download = new URL(request.url).searchParams.get("download");
    if (download !== null) {
      if (download !== "observable-matrix") {
        return atlasJsonResponseV275(
          "relativity-evidence",
          { error: "unsupported-export" },
          { status: 400, headers: { "Cache-Control": "no-store" } },
        );
      }
      const entry = loaded.export;
      const body = entry.bytes.buffer.slice(
        entry.bytes.byteOffset,
        entry.bytes.byteOffset + entry.bytes.byteLength,
      ) as ArrayBuffer;
      return new Response(body, {
        status: 200,
        headers: {
          "Content-Type": entry.contentType,
          "Content-Disposition": "attachment; filename=" + entry.name,
          "Cache-Control": "no-store",
          ETag: "\"" + entry.fileSha256 + "\"",
          "X-Atlas-Kerr-Observable-Provenance": "v471-artifact",
        },
      });
    }

    const body = JSON.stringify({
      version: KERR_OBSERVABLE_PROVENANCE_API_VERSION_V471,
      available: true,
      reason: "ready",
      summary: loaded.summary,
    } satisfies KerrObservableProvenanceApiV471);
    if (Buffer.byteLength(body, "utf8") > 128 * 1024) throw new Error("v471-summary-size");
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        ETag: atlasStrongEtagV275(body),
        "X-Atlas-Kerr-Observable-Provenance": "v471-summary",
      },
    });
  } catch {
    return atlasJsonResponseV275(
      "relativity-evidence",
      {
        version: KERR_OBSERVABLE_PROVENANCE_API_VERSION_V471,
        available: false,
        reason: "evidence-corrupt",
        summary: null,
      } satisfies KerrObservableProvenanceApiV471,
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
