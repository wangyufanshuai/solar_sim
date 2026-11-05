import { atlasJsonResponseV275, atlasStrongEtagV275, consumeAtlasApiPolicyV275 } from "../../../../lib/atlasApiPolicyV275";
import { atlasUtf8ByteLengthV270 } from "../../../../lib/atlasApiSecurityV270";
import { loadAtlasRelativityEvidenceSnapshotV342 } from "../../../../lib/relativityEvidenceServerV342";
import type { RelativityEvidenceResponseV342 } from "../../../../lib/relativityWorkbenchEvidenceV342";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const deliveryProfile = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE ?? "standalone-full";
  if (deliveryProfile === "vercel-lite") return atlasJsonResponseV275("relativity-evidence", { version: "v342-relativity-evidence-response", available: false, reason: "lite-boundary", snapshot: null } satisfies RelativityEvidenceResponseV342, { status: 200, headers: { "Cache-Control": "no-store" } });
  const limited = consumeAtlasApiPolicyV275(request, "relativity-evidence"); if (limited) return limited;
  const snapshot = await loadAtlasRelativityEvidenceSnapshotV342();
  const response: RelativityEvidenceResponseV342 = snapshot.status === "ready" ? { version: "v342-relativity-evidence-response", available: true, reason: "ready", snapshot } : { version: "v342-relativity-evidence-response", available: false, reason: "evidence-corrupt", snapshot: null };
  const serialized = JSON.stringify(response); if (atlasUtf8ByteLengthV270(serialized) > 128 * 1024) return atlasJsonResponseV275("relativity-evidence", { error: "Relativity v342 evidence response exceeds 128 KiB" }, { status: 413, headers: { "Cache-Control": "no-store" } });
  return new Response(serialized, { status: snapshot.status === "ready" ? 200 : 503, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ETag: atlasStrongEtagV275(serialized), "X-Atlas-Relativity-Evidence": "v342", "X-Atlas-Api-Policy": "v275-unified-bounded-api-policy-v1" } });
}
