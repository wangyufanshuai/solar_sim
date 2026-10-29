import { gaiaScienceRecordFromDatabaseRowV8 } from "../../../lib/gaiaScienceV8";
import {
  atlasJsonResponseV275,
  atlasNotModifiedV275,
  atlasSanitizedUnavailableV275,
  atlasStrongEtagV275,
  consumeAtlasApiPolicyV275,
} from "../../../lib/atlasApiPolicyV275";
import { getGaiaScienceRecordQueryServiceV275 } from "../../../lib/gaiaScienceRecordQueryServiceV275";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limited = consumeAtlasApiPolicyV275(request, "science-record");
  if (limited) return limited;
  const sourceId = new URL(request.url).searchParams.get("sourceId")?.trim() ?? "";
  if (!/^\d{8,19}$/.test(sourceId)) return atlasJsonResponseV275("science-record", { error: "Gaia source id must contain 8-19 digits" }, { status: 400 });
  try {
    const result = await getGaiaScienceRecordQueryServiceV275().query(sourceId);
    if (!result.row) return atlasJsonResponseV275("science-record", { error: "Source is not present in the frozen 200k science subset" }, { status: 404 });
    const etag = atlasStrongEtagV275(`${result.sourceSha256}:${sourceId}`);
    const notModified = atlasNotModifiedV275(request, etag);
    if (notModified) return notModified;
    return atlasJsonResponseV275("science-record", {
      canonical: true,
      source: "frozen-gaia-science-v8",
      sourceSha256: result.sourceSha256,
      retrievedAt: result.retrievedAt,
      record: gaiaScienceRecordFromDatabaseRowV8(result.row),
      boundary: "local-frozen-subset-read-only-not-live-gaia-query",
    }, { headers: { ETag: etag, "Cache-Control": "private, max-age=300" } });
  } catch {
    return atlasSanitizedUnavailableV275("science-record", "local-science-subset-unavailable-no-network-fallback");
  }
}
