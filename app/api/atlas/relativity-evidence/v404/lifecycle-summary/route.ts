import { atlasJsonResponseV275, atlasStrongEtagV275, consumeAtlasApiPolicyV275 } from "../../../../../lib/atlasApiPolicyV275";
import {
  ATLAS_OBSERVATION_LIFECYCLE_SUMMARY_MAXIMUM_RESPONSE_BYTES_V404,
  RELATIVITY_LIFECYCLE_EVIDENCE_RESPONSE_VERSION_V404,
  type RelativityLifecycleEvidenceResponseV404,
} from "../../../../../lib/atlasObservationLifecycleReplaySummaryV404";
import { loadRelativityLifecycleEvidenceSummaryV404 } from "../../../../../lib/relativityLifecycleEvidenceServerV404";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const delivery = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE ?? "standalone-full";
  if (delivery === "vercel-lite") {
    return atlasJsonResponseV275("relativity-evidence", {
      version: RELATIVITY_LIFECYCLE_EVIDENCE_RESPONSE_VERSION_V404,
      available: false,
      reason: "lite-boundary",
      summary: null,
    } satisfies RelativityLifecycleEvidenceResponseV404, { status: 200, headers: { "Cache-Control": "no-store" } });
  }
  const limited = consumeAtlasApiPolicyV275(request, "relativity-evidence");
  if (limited) return limited;
  try {
    const { summary } = await loadRelativityLifecycleEvidenceSummaryV404();
    const payload: RelativityLifecycleEvidenceResponseV404 = {
      version: RELATIVITY_LIFECYCLE_EVIDENCE_RESPONSE_VERSION_V404,
      available: true,
      reason: "ready",
      summary,
    };
    const body = JSON.stringify(payload);
    if (Buffer.byteLength(body, "utf8") > ATLAS_OBSERVATION_LIFECYCLE_SUMMARY_MAXIMUM_RESPONSE_BYTES_V404) {
      throw new Error("v404-lifecycle-response-size");
    }
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        ETag: atlasStrongEtagV275(body),
        "X-Atlas-Lifecycle-Evidence": "v404",
      },
    });
  } catch {
    return atlasJsonResponseV275("relativity-evidence", {
      version: RELATIVITY_LIFECYCLE_EVIDENCE_RESPONSE_VERSION_V404,
      available: false,
      reason: "evidence-corrupt",
      summary: null,
    } satisfies RelativityLifecycleEvidenceResponseV404, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
