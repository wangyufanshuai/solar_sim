import { resolve } from "node:path";
import {
  atlasJsonResponseV275,
  atlasNotModifiedV275,
  atlasSanitizedUnavailableV275,
  consumeAtlasApiPolicyV275,
  readImmutableAtlasFileV275,
} from "../../../lib/atlasApiPolicyV275";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LOCAL_CANDIDATE = resolve(process.cwd(), "dist/local-candidate/cosmicflows4-v260/cosmicflows4-v260.csv.gz");

export async function GET(request: Request) {
  const limited = consumeAtlasApiPolicyV275(request, "cosmicflows");
  if (limited) return limited;
  if (process.env.VERCEL === "1" || process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "vercel-lite") {
    return atlasJsonResponseV275("cosmicflows", { error: "Cosmicflows-4 redistribution is blocked for public delivery" }, { status: 451 });
  }
  try {
    const data = await readImmutableAtlasFileV275(LOCAL_CANDIDATE, "cosmicflows");
    const notModified = atlasNotModifiedV275(request, data.etag);
    if (notModified) return notModified;
    return new Response(new Uint8Array(data.bytes), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Encoding": "gzip",
        "Cache-Control": "private, max-age=3600",
        "ETag": data.etag,
        "Last-Modified": new Date(data.lastModifiedMs).toUTCString(),
        "X-Atlas-Api-Policy": "v275-unified-bounded-api-policy-v1",
        "X-Atlas-Public-Deployment-Blocked": "true",
      },
    });
  } catch {
    return atlasSanitizedUnavailableV275("cosmicflows", "local-only-licensed-candidate-unavailable-no-network-fallback");
  }
}
