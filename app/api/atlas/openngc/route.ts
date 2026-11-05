import { resolve } from "node:path";
import {
  atlasNotModifiedV275,
  atlasSanitizedUnavailableV275,
  consumeAtlasApiPolicyV275,
  readImmutableAtlasFileV275,
} from "../../../lib/atlasApiPolicyV275";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OPEN_NGC = resolve(process.cwd(), "public/data/openngc-v260/openngc-v260.json.gz");

export async function GET(request: Request) {
  const limited = consumeAtlasApiPolicyV275(request, "openngc");
  if (limited) return limited;
  try {
    const payload = await readImmutableAtlasFileV275(OPEN_NGC, "openngc");
    const notModified = atlasNotModifiedV275(request, payload.etag);
    if (notModified) return notModified;
    return new Response(new Uint8Array(payload.bytes), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Encoding": "gzip",
        "Cache-Control": "public, max-age=31536000, immutable",
        "ETag": payload.etag,
        "Last-Modified": new Date(payload.lastModifiedMs).toUTCString(),
        "X-Atlas-Api-Policy": "v275-unified-bounded-api-policy-v1",
        "X-Atlas-Provenance": "OpenNGC-CC-BY-SA-4.0-v260",
      },
    });
  } catch {
    return atlasSanitizedUnavailableV275("openngc", "frozen-openngc-unavailable-no-network-fallback");
  }
}
