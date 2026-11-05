import { atlasJsonResponseV275, consumeAtlasApiPolicyV275 } from "../../../../../../lib/atlasApiPolicyV275";
import { loadKerrScienceImageProductBytesV343 } from "../../../../../../lib/kerrScienceImageProductServerV343";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request, context: { params: Promise<{ product: string }> }) {
  if ((process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE ?? "standalone-full") === "vercel-lite") return atlasJsonResponseV275("relativity-evidence", { available: false, reason: "lite-boundary" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  const limited = consumeAtlasApiPolicyV275(request, "relativity-evidence"); if (limited) return limited;
  const { product } = await context.params;
  if (product !== "fits" && product !== "png") return atlasJsonResponseV275("relativity-evidence", { error: "Science image product is not allowed" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  try {
    const output = await loadKerrScienceImageProductBytesV343(product);
    return new Response(output.bytes as BodyInit, { status: 200, headers: { "Content-Type": output.mimeType, "Content-Length": String(output.bytes.byteLength), "Content-Disposition": `${product === "png" ? "inline" : "attachment"}; filename="${output.filename}"`, "Cache-Control": "private, no-store", ETag: `"${output.sha256}"`, "X-Atlas-Science-Product": `v343-${product}` } });
  } catch {
    return atlasJsonResponseV275("relativity-evidence", { error: "Science image product failed integrity validation" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
