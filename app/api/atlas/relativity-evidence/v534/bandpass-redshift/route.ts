import {
  atlasJsonResponseV275,
  atlasStrongEtagV275,
  consumeAtlasApiPolicyV275,
} from "../../../../../lib/atlasApiPolicyV275";
import {
  KERR_BANDPASS_REDSHIFT_COMMUTATOR_API_VERSION_V534,
  type KerrBandpassRedshiftCommutatorApiV534,
} from "../../../../../lib/kerrBandpassRedshiftCommutatorV534";
import { loadKerrBandpassRedshiftCommutatorV534 } from "../../../../../lib/kerrBandpassRedshiftCommutatorServerV534";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const delivery = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE ?? "standalone-full";
  if (delivery !== "local-shadow") {
    return atlasJsonResponseV275("relativity-evidence", {
      version: KERR_BANDPASS_REDSHIFT_COMMUTATOR_API_VERSION_V534,
      available: false,
      reason: delivery === "vercel-lite" ? "lite-boundary" : "local-shadow-only",
      summary: null,
    } satisfies KerrBandpassRedshiftCommutatorApiV534, { status: 200, headers: { "Cache-Control": "no-store" } });
  }
  const limited = consumeAtlasApiPolicyV275(request, "relativity-evidence");
  if (limited) return limited;
  try {
    const loaded = await loadKerrBandpassRedshiftCommutatorV534();
    const download = new URL(request.url).searchParams.get("download");
    if (download !== null) {
      if (download !== "atlas") {
        return atlasJsonResponseV275("relativity-evidence", { error: "unsupported-export" }, {
          status: 400,
          headers: { "Cache-Control": "no-store" },
        });
      }
      return new Response(loaded.export.bytes.buffer.slice(
        loaded.export.bytes.byteOffset,
        loaded.export.bytes.byteOffset + loaded.export.bytes.byteLength,
      ) as ArrayBuffer, {
        headers: {
          "Content-Type": loaded.export.contentType,
          "Content-Disposition": `attachment; filename=${loaded.export.name}`,
          "Cache-Control": "no-store",
          ETag: `"${loaded.export.fileSha256}"`,
        },
      });
    }
    const body = JSON.stringify({
      version: KERR_BANDPASS_REDSHIFT_COMMUTATOR_API_VERSION_V534,
      available: true,
      reason: "ready",
      summary: loaded.summary,
    } satisfies KerrBandpassRedshiftCommutatorApiV534);
    if (Buffer.byteLength(body) > 128 * 1024) throw new Error("v534-summary-size");
    return new Response(body, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        ETag: atlasStrongEtagV275(body),
      },
    });
  } catch {
    return atlasJsonResponseV275("relativity-evidence", {
      version: KERR_BANDPASS_REDSHIFT_COMMUTATOR_API_VERSION_V534,
      available: false,
      reason: "evidence-corrupt",
      summary: null,
    } satisfies KerrBandpassRedshiftCommutatorApiV534, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
