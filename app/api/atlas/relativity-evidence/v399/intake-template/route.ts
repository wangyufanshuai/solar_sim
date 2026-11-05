import { atlasJsonResponseV275, consumeAtlasApiPolicyV275 } from "../../../../../lib/atlasApiPolicyV275";
import { loadKerrPhysicalObservationTemplateV399 } from "../../../../../lib/kerrPhysicalObservationTemplateServerV399";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const delivery = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE ?? "standalone-full";
  if (delivery !== "local-shadow") return atlasJsonResponseV275("relativity-evidence", { available: false, reason: delivery === "vercel-lite" ? "lite-boundary" : "local-shadow-only" }, { status: 200 });
  const limited = consumeAtlasApiPolicyV275(request, "relativity-evidence");
  if (limited) return limited;
  try {
    const { artifact, template } = await loadKerrPhysicalObservationTemplateV399();
    const body = `${JSON.stringify(template, null, 2)}\n`;
    if (Buffer.byteLength(body, "utf8") > 128 * 1024) throw new Error("v399-template-download-size");
    return new Response(body, { status: 200, headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": "attachment; filename=orbit-atlas-v399-physical-observation-intake-template.json", "Cache-Control": "no-store", "X-Atlas-Template-Sha256": artifact.integrity.templateCanonicalSha256 } });
  } catch {
    return atlasJsonResponseV275("relativity-evidence", { available: false, reason: "template-corrupt" }, { status: 503 });
  }
}
