import { NextResponse } from "next/server";
import {
  atlasJsonResponseV275,
  atlasStrongEtagV275,
  consumeAtlasApiPolicyV275,
} from "../../../lib/atlasApiPolicyV275";
import {
  AtlasApiPayloadTooLargeV270,
  atlasUtf8ByteLengthV270,
  readAtlasRequestTextV270,
} from "../../../lib/atlasApiSecurityV270";
import { getGaiaResearchQueryServiceV271 } from "../../../lib/gaiaResearchQueryServiceV271";
import {
  GAIA_RESEARCH_RESPONSE_MAX_BYTES,
  GAIA_RESEARCH_WORKBENCH_VERSION_V271,
  parseGaiaResearchQueryV271,
  type GaiaResearchResponseV271,
} from "../../../lib/gaiaResearchWorkbenchV271";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REQUEST_MAX_BYTES = 16 * 1024;

export async function POST(request: Request) {
  if ((process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE ?? "standalone-full") === "vercel-lite") {
    return NextResponse.json(
      { error: "Gaia Research Workbench is unavailable in Lite", boundary: "standalone-shadow-only-no-loopback" },
      { status: 404 },
    );
  }
  const limited = consumeAtlasApiPolicyV275(request, "science-workbench");
  if (limited) return limited;
  let query: ReturnType<typeof parseGaiaResearchQueryV271>;
  try {
    const body = await readAtlasRequestTextV270(request, REQUEST_MAX_BYTES);
    query = parseGaiaResearchQueryV271(JSON.parse(body));
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof AtlasApiPayloadTooLargeV270
          ? "Gaia research request is too large"
          : error instanceof Error
            ? error.message
            : "Invalid Gaia research request",
      },
      { status: error instanceof AtlasApiPayloadTooLargeV270 ? 413 : 400 },
    );
  }
  try {
    const result = await getGaiaResearchQueryServiceV271().query(query);
    const response: GaiaResearchResponseV271 = {
      version: GAIA_RESEARCH_WORKBENCH_VERSION_V271,
      canonical: true,
      source: "frozen-gaia-science-v8-derived-v271",
      query,
      payload: result.payload,
      provenance: {
        ...result.provenance,
        units: {
          sky: "HEALPix NESTED count",
          magnitude: "Gaia G mag",
          color: "Gaia BP-RP mag",
          astrometry: "mas and mas/yr",
          radialVelocity: "km/s",
        },
      },
      boundary: "frozen-derived-analysis-not-gaia-survey-completeness-or-physics",
    };
    const serialized = JSON.stringify(response);
    if (atlasUtf8ByteLengthV270(serialized) > GAIA_RESEARCH_RESPONSE_MAX_BYTES) {
      return NextResponse.json({ error: "Gaia research response exceeds 2 MiB" }, { status: 413 });
    }
    const etag = atlasStrongEtagV275(serialized);
    return new Response(serialized, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "private, max-age=60",
        "X-Atlas-Canonical": "true",
        "X-Atlas-Research-Version": GAIA_RESEARCH_WORKBENCH_VERSION_V271,
        "X-Atlas-Api-Policy": "v275-unified-bounded-api-policy-v1",
        "ETag": etag,
      },
    });
  } catch {
    return atlasJsonResponseV275("science-workbench",
      { error: "Frozen Gaia research aggregate is unavailable", boundary: "no-network-fallback-no-automatic-retry" },
      { status: 503 },
    );
  }
}
