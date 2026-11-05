import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import overlayJson from "../../../../data/mainlineANebulaR72SourceV659.generated.json";
import { isLocalReviewRequestV655 } from
  "../../../../lib/mainlineANebulaReviewAssetV655";
import { selectR72SourceImageV659,
  type R72SourceOverlayV659 } from
  "../../../../lib/mainlineAR72ExpansionSourceV659";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

function unavailable(status = 404) {
  return Response.json({ status: "not-available" }, { status,
    headers: { "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
      "Cross-Origin-Resource-Policy": "same-origin" } });
}

export async function GET(request: Request, context: RouteContext) {
  if (!isLocalReviewRequestV655(request,
    process.env.ATLAS_MAINLINE_A_LOCAL_REVIEW_IMAGES === "1")) {
    return unavailable();
  }
  const { id } = await context.params;
  const selected = selectR72SourceImageV659(
    overlayJson as R72SourceOverlayV659, id);
  if (!selected) return unavailable();
  const root = process.cwd();
  const base = path.resolve(root, "docs/release/v607/nebula-r72-v659/raw");
  const absolute = path.resolve(root, selected.pin.path);
  if (!absolute.startsWith(`${base}${path.sep}`)) return unavailable();
  try {
    const file = await stat(absolute);
    if (!file.isFile() || file.size !== selected.pin.bytes
      || file.size < 100 || file.size > 60_000_000) return unavailable(503);
    const bytes = await readFile(absolute);
    const digest = createHash("sha256").update(bytes).digest("hex");
    if (digest !== selected.pin.sha256) return unavailable(503);
    return new Response(new Uint8Array(bytes), { status: 200,
      headers: { "Content-Type": "image/jpeg",
        "Content-Length": String(bytes.length),
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
        "Cross-Origin-Resource-Policy": "same-origin",
        "X-Mainline-A-Review-Only": "candidate-hold",
        "X-Mainline-A-Rights": "pending",
        "X-Scientific-Payload-Writeback": "false",
        "X-Artifact-SHA256": digest,
        "X-NASA-ID": selected.row.nasaId } });
  } catch {
    return unavailable(503);
  }
}
