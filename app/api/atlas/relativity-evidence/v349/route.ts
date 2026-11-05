import { atlasJsonResponseV275, atlasStrongEtagV275, consumeAtlasApiPolicyV275 } from "../../../../lib/atlasApiPolicyV275";
import { atlasUtf8ByteLengthV270 } from "../../../../lib/atlasApiSecurityV270";
import { loadAtlasRelativityEvidenceSnapshotV349 } from "../../../../lib/relativityEvidenceServerV349";
import type { RelativityEvidenceResponseV349 } from "../../../../lib/relativityWorkbenchEvidenceV349";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if ((process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE ?? "standalone-full") === "vercel-lite") return atlasJsonResponseV275("relativity-evidence", { version: "v349-relativity-evidence-response", available: false, reason: "lite-boundary", snapshot: null } satisfies RelativityEvidenceResponseV349, { status: 200, headers: { "Cache-Control": "no-store" } });
  const limited = consumeAtlasApiPolicyV275(request, "relativity-evidence");
  if (limited) return limited;
  const snapshot = await loadAtlasRelativityEvidenceSnapshotV349();
  const response: RelativityEvidenceResponseV349 = snapshot.status === "ready" ? { version: "v349-relativity-evidence-response", available: true, reason: "ready", snapshot } : { version: "v349-relativity-evidence-response", available: false, reason: "evidence-corrupt", snapshot: null };
  const serialized = JSON.stringify(response);
  if (atlasUtf8ByteLengthV270(serialized) > 128 * 1024) return atlasJsonResponseV275("relativity-evidence", { error: "Relativity v349 evidence exceeds 128 KiB" }, { status: 413, headers: { "Cache-Control": "no-store" } });
  return new Response(serialized, { status: snapshot.status === "ready" ? 200 : 503, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ETag: atlasStrongEtagV275(serialized), "X-Atlas-Relativity-Evidence": "v349", "X-Atlas-Api-Policy": "v275-unified-bounded-api-policy-v1" } });
}
