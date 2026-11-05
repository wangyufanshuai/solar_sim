import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import manifestJson from "../../../../../data/mainlineANebulaCandidateReviewV655.generated.json";
import {
  isLocalReviewRequestV655, selectCandidateReviewAssetV655,
  type CandidateReviewPackV655,
} from "../../../../../lib/mainlineANebulaReviewAssetV655";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ReviewRouteContext = {
  params: Promise<{ id: string; variant: string }>;
};

function unavailable(status = 404) {
  return Response.json({ status: "not-available" }, {
    status, headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
      "Cross-Origin-Resource-Policy": "same-origin",
    },
  });
}

export async function GET(request: Request, context: ReviewRouteContext) {
  if (!isLocalReviewRequestV655(request,
    process.env.ATLAS_MAINLINE_A_LOCAL_REVIEW_IMAGES === "1")) {
    return unavailable();
  }
  const { id, variant } = await context.params;
  const selected = selectCandidateReviewAssetV655(
    manifestJson as CandidateReviewPackV655, id, variant);
  if (!selected) return unavailable();
  const root = process.cwd();
  const relative = selected.pin.path;
  const base = path.resolve(root, "docs/release/v607");
  const absolute = path.resolve(root, relative);
  if (!absolute.startsWith(`${base}${path.sep}`)) return unavailable();
  try {
    const file = await stat(absolute);
    if (!file.isFile() || file.size !== selected.pin.bytes
      || file.size < 100 || file.size > 60_000_000) {
      return unavailable(503);
    }
    const bytes = await readFile(absolute);
    const digest = createHash("sha256").update(bytes).digest("hex");
    if (digest !== selected.pin.sha256) return unavailable(503);
    return new Response(new Uint8Array(bytes), {
      status: 200, headers: {
        "Content-Type": selected.mimeType,
        "Content-Length": String(bytes.byteLength),
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
        "Cross-Origin-Resource-Policy": "same-origin",
        "X-Mainline-A-Review-Only": "candidate-hold",
        "X-Mainline-A-Rights": "pending",
        "X-Scientific-Payload-Writeback": "false",
        "X-Artifact-SHA256": digest,
        "X-Candidate-Raw-SHA256": selected.row.candidateRaw.sha256,
      },
    });
  } catch {
    return unavailable(503);
  }
}
