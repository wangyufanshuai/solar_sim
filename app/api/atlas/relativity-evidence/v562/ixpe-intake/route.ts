import { atlasJsonResponseV275, atlasStrongEtagV275, consumeAtlasApiPolicyV275 } from "../../../../../lib/atlasApiPolicyV275";
import { IXPE_MEASURED_INTAKE_API_VERSION_V562, type IxpeMeasuredIntakeApiV562 } from "../../../../../lib/ixpeMeasuredIntakeV562";
import { loadIxpeMeasuredIntakeV562 } from "../../../../../lib/ixpeMeasuredIntakeServerV562";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const delivery = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE ?? "standalone-full";
  if (delivery !== "local-shadow") return atlasJsonResponseV275("relativity-evidence", { version: IXPE_MEASURED_INTAKE_API_VERSION_V562, available: false, reason: delivery === "vercel-lite" ? "lite-boundary" : "local-shadow-only", summary: null } satisfies IxpeMeasuredIntakeApiV562, { status: 200, headers: { "Cache-Control": "no-store" } });
  const limited = consumeAtlasApiPolicyV275(request, "relativity-evidence");
  if (limited) return limited;
  try {
    const summary = await loadIxpeMeasuredIntakeV562();
    const body = JSON.stringify({ version: IXPE_MEASURED_INTAKE_API_VERSION_V562, available: true, reason: "ready", summary } satisfies IxpeMeasuredIntakeApiV562);
    return new Response(body, { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ETag: atlasStrongEtagV275(body), "X-Atlas-IXPE": "v562-explicit-intake-measured-blocked" } });
  } catch {
    return atlasJsonResponseV275("relativity-evidence", { version: IXPE_MEASURED_INTAKE_API_VERSION_V562, available: false, reason: "evidence-corrupt", summary: null } satisfies IxpeMeasuredIntakeApiV562, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
