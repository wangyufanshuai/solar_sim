import {
  atlasJsonResponseV275,
  atlasStrongEtagV275,
  consumeAtlasApiPolicyV275,
} from "../../../../../lib/atlasApiPolicyV275";
import { atlasUtf8ByteLengthV270 } from "../../../../../lib/atlasApiSecurityV270";
import { loadKerrSpectralCorrelationResponseV354 } from "../../../../../lib/kerrSpectralCorrelationResponseServerV354";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if ((process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE ?? "standalone-full") === "vercel-lite") {
    return atlasJsonResponseV275("relativity-evidence", {
      version: "v354-kerr-correlated-spectral-shape-response-v1",
      available: false,
      reason: "lite-boundary",
      artifact: null,
    }, { status: 200 });
  }
  const limited = consumeAtlasApiPolicyV275(request, "relativity-evidence");
  if (limited) return limited;
  try {
    const artifact = await loadKerrSpectralCorrelationResponseV354();
    const serialized = JSON.stringify({
      version: artifact.version,
      available: true,
      reason: "ready",
      artifact,
    });
    if (atlasUtf8ByteLengthV270(serialized) > 128 * 1024) {
      return atlasJsonResponseV275("relativity-evidence", {
        error: "Relativity v354 spectral correlation exceeds 128 KiB",
      }, { status: 413 });
    }
    return new Response(serialized, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        ETag: atlasStrongEtagV275(serialized),
        "X-Atlas-Spectral-Correlation": "v354",
      },
    });
  } catch {
    return atlasJsonResponseV275("relativity-evidence", {
      version: "v354-kerr-correlated-spectral-shape-response-v1",
      available: false,
      reason: "evidence-corrupt",
      artifact: null,
    }, { status: 503 });
  }
}
