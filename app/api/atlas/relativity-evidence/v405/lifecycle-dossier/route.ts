import { atlasJsonResponseV275, atlasStrongEtagV275, consumeAtlasApiPolicyV275 } from "../../../../../lib/atlasApiPolicyV275";
import {
  ATLAS_LIFECYCLE_DOSSIER_RESPONSE_VERSION_V405,
  type AtlasLifecycleDossierResponseV405,
} from "../../../../../lib/atlasLifecycleProvenanceDossierV405";
import { loadAtlasLifecycleProvenanceDossierV405 } from "../../../../../lib/atlasLifecycleProvenanceDossierServerV405";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const delivery = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE ?? "standalone-full";
  if (delivery !== "local-shadow") {
    return atlasJsonResponseV275("relativity-evidence", {
      version: ATLAS_LIFECYCLE_DOSSIER_RESPONSE_VERSION_V405,
      available: false,
      reason: delivery === "vercel-lite" ? "lite-boundary" : "local-shadow-only",
      dossier: null,
    } satisfies AtlasLifecycleDossierResponseV405, { status: 200, headers: { "Cache-Control": "no-store" } });
  }
  const limited = consumeAtlasApiPolicyV275(request, "relativity-evidence");
  if (limited) return limited;
  try {
    const { dossier } = await loadAtlasLifecycleProvenanceDossierV405();
    const body = JSON.stringify({ version: ATLAS_LIFECYCLE_DOSSIER_RESPONSE_VERSION_V405, available: true, reason: "ready", dossier } satisfies AtlasLifecycleDossierResponseV405);
    if (Buffer.byteLength(body, "utf8") > 128 * 1024) throw new Error("v405-dossier-response-size");
    return new Response(body, { status: 200, headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Content-Disposition": "attachment; filename=orbit-atlas-v405-lifecycle-dossier.json",
      ETag: atlasStrongEtagV275(body),
      "X-Atlas-Lifecycle-Dossier": "v405",
    } });
  } catch {
    return atlasJsonResponseV275("relativity-evidence", {
      version: ATLAS_LIFECYCLE_DOSSIER_RESPONSE_VERSION_V405,
      available: false,
      reason: "evidence-corrupt",
      dossier: null,
    } satisfies AtlasLifecycleDossierResponseV405, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
