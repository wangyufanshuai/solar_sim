import {
  atlasJsonResponseV275,
  atlasStrongEtagV275,
  consumeAtlasApiPolicyV275,
} from "../../../../../lib/atlasApiPolicyV275";
import { loadObservationGeometryRuntimePublicationInspectV374 } from "../../../../../lib/observationGeometryRuntimePublicationInspectServerV374";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const delivery = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE ?? "standalone-full";
  if (delivery !== "local-shadow") {
    return atlasJsonResponseV275(
      "relativity-evidence",
      {
        version: "v374-observation-geometry-runtime-publication-inspect-v1",
        available: false,
        reason: delivery === "vercel-lite" ? "lite-boundary" : "local-shadow-only",
        artifact: null,
      },
      { status: 200 },
    );
  }
  const limited = consumeAtlasApiPolicyV275(request, "relativity-evidence");
  if (limited) return limited;
  try {
    const artifact = await loadObservationGeometryRuntimePublicationInspectV374();
    const body = JSON.stringify({
      version: artifact.version,
      available: true,
      reason: "ready",
      artifact,
    });
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        ETag: atlasStrongEtagV275(body),
        "X-Atlas-Observation-Geometry-Publication": "v374",
      },
    });
  } catch {
    return atlasJsonResponseV275(
      "relativity-evidence",
      {
        version: "v374-observation-geometry-runtime-publication-inspect-v1",
        available: false,
        reason: "evidence-corrupt",
        artifact: null,
      },
      { status: 503 },
    );
  }
}
