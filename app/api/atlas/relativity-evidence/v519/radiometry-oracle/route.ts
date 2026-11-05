import {
  atlasJsonResponseV275,
  atlasStrongEtagV275,
  consumeAtlasApiPolicyV275,
} from "../../../../../lib/atlasApiPolicyV275";
import {
  KERR_FIXED_BAND_RADIOMETRY_ORACLE_API_VERSION_V519,
  type KerrFixedBandRadiometryOracleApiV519,
} from "../../../../../lib/kerrFixedBandRadiometryOracleV519";
import { loadKerrFixedBandRadiometryOracleV519 } from "../../../../../lib/kerrFixedBandRadiometryOracleServerV519";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const delivery = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE ?? "standalone-full";
  if (delivery !== "local-shadow") {
    return atlasJsonResponseV275(
      "relativity-evidence",
      {
        version: KERR_FIXED_BAND_RADIOMETRY_ORACLE_API_VERSION_V519,
        available: false,
        reason: delivery === "vercel-lite" ? "lite-boundary" : "local-shadow-only",
        summary: null,
      } satisfies KerrFixedBandRadiometryOracleApiV519,
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }
  const limited = consumeAtlasApiPolicyV275(request, "relativity-evidence");
  if (limited) return limited;
  try {
    const loaded = await loadKerrFixedBandRadiometryOracleV519();
    const download = new URL(request.url).searchParams.get("download");
    if (download !== null) {
      if (download !== "oracle") {
        return atlasJsonResponseV275(
          "relativity-evidence",
          { error: "unsupported-export" },
          { status: 400, headers: { "Cache-Control": "no-store" } },
        );
      }
      return new Response(
        loaded.export.bytes.buffer.slice(
          loaded.export.bytes.byteOffset,
          loaded.export.bytes.byteOffset + loaded.export.bytes.byteLength,
        ) as ArrayBuffer,
        {
          headers: {
            "Content-Type": loaded.export.contentType,
            "Content-Disposition": `attachment; filename=${loaded.export.name}`,
            "Cache-Control": "no-store",
            ETag: `"${loaded.export.fileSha256}"`,
          },
        },
      );
    }
    const body = JSON.stringify({
      version: KERR_FIXED_BAND_RADIOMETRY_ORACLE_API_VERSION_V519,
      available: true,
      reason: "ready",
      summary: loaded.summary,
    } satisfies KerrFixedBandRadiometryOracleApiV519);
    if (Buffer.byteLength(body) > 128 * 1024) throw new Error("v519-size");
    return new Response(body, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        ETag: atlasStrongEtagV275(body),
      },
    });
  } catch {
    return atlasJsonResponseV275(
      "relativity-evidence",
      {
        version: KERR_FIXED_BAND_RADIOMETRY_ORACLE_API_VERSION_V519,
        available: false,
        reason: "evidence-corrupt",
        summary: null,
      } satisfies KerrFixedBandRadiometryOracleApiV519,
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
