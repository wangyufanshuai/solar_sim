import {
  atlasJsonResponseV275,
  atlasStrongEtagV275,
  consumeAtlasApiPolicyV275,
} from "../../../../../lib/atlasApiPolicyV275";
import { loadMeasuredVisibleSourceForensicV382R1 } from "../../../../../lib/measuredVisibleSourceForensicServerV382R1";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const delivery =
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE ?? "standalone-full";
  if (delivery !== "local-shadow") {
    return atlasJsonResponseV275(
      "relativity-evidence",
      {
        version: "v382r1-visible-source-offline-forensic-v1",
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
    const artifact = await loadMeasuredVisibleSourceForensicV382R1();
    const body = JSON.stringify({
      version: artifact.version,
      available: true,
      reason: "ready",
      artifact,
    });
    if (Buffer.byteLength(body, "utf8") > 128 * 1024) {
      throw new Error("v382r1-response-size");
    }
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        ETag: atlasStrongEtagV275(body),
        "X-Atlas-Visible-Source-Forensic": "v382r1",
      },
    });
  } catch {
    return atlasJsonResponseV275(
      "relativity-evidence",
      {
        version: "v382r1-visible-source-offline-forensic-v1",
        available: false,
        reason: "evidence-corrupt",
        artifact: null,
      },
      { status: 503 },
    );
  }
}
