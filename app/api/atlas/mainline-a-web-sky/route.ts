import { createHash } from "node:crypto";
import data from "../../../data/mainlineAWebSkyAtlasV656.generated.json";
import { inspectWebSkyAtlasV656,
  type WebSkyAtlasPackV656,
} from "../../../lib/mainlineAWebSkyV656";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const pack = data as WebSkyAtlasPackV656;
  if (!inspectWebSkyAtlasV656(pack).ok) {
    return Response.json({ status: "candidate-manifest-invalid" }, {
      status: 503,
      headers: { "Cache-Control": "no-store",
        "X-Scientific-Payload-Writeback": "false" },
    });
  }
  const bytes = Buffer.from(JSON.stringify(pack));
  const digest = createHash("sha256").update(bytes).digest("hex");
  return new Response(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Length": String(bytes.byteLength),
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
      "X-Artifact-SHA256": digest,
      "X-Mainline-A-Candidate-Only": "true",
      "X-Mainline-A-Admission": "hold",
      "X-Scientific-Payload-Writeback": "false",
    },
  });
}
