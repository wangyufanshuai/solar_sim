import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import {
  shouldBufferAtlasRangeV1,
  type AtlasBufferedRangeDeliveryV1,
} from "../../../../../../lib/atlasBufferedRangeDeliveryV1";
import {
  atlasContentTypeForPath,
  loadCachedAtlasContentPackDescriptorV3,
  parseAtlasByteRange,
  readExactAtlasByteRangeV1,
  resolveAtlasContentPackRoot,
  verifyAllowedAtlasContentPackFileV3,
} from "../../../../../../lib/atlasContentPackServerV3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function notFound(message: string) {
  return Response.json({ available: false, error: message }, { status: 404 });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ pack: string; path: string[] }> },
) {
  const { pack, path } = await context.params;
  const root = resolveAtlasContentPackRoot({
    configuredRoot: process.env.ATLAS_LOCAL_ASSET_PACK_ROOT,
  });
  if (!root) return notFound("Local content pack is not configured");

  try {
    const descriptor = await loadCachedAtlasContentPackDescriptorV3(root, pack);
    const resolved = await verifyAllowedAtlasContentPackFileV3(
      descriptor,
      path.join("/"),
    );
    if (!resolved) {
      return notFound("Content pack file is not in the manifest whitelist");
    }

    const etag = `"${resolved.entry.sha256}"`;
    if (request.headers.get("if-none-match") === etag) {
      return new Response(null, { status: 304, headers: { ETag: etag } });
    }

    const range = parseAtlasByteRange(request.headers.get("range"), resolved.entry.bytes);
    if (range === "invalid") {
      return new Response(null, {
        status: 416,
        headers: {
          "Content-Range": `bytes */${resolved.entry.bytes}`,
          "Accept-Ranges": "bytes",
        },
      });
    }

    let body: BodyInit;
    let rangeDelivery: AtlasBufferedRangeDeliveryV1 = "streamed-v1";
    if (range && shouldBufferAtlasRangeV1(range.length)) {
      const buffered = await readExactAtlasByteRangeV1(
        resolved.absolutePath,
        range,
        resolved.entry.bytes,
        request.signal,
      );
      body = buffered.bytes as BodyInit;
      rangeDelivery = "buffered-v1";
    } else {
      body = Readable.toWeb(createReadStream(
        resolved.absolutePath,
        range ? { start: range.start, end: range.end } : undefined,
      )) as ReadableStream<Uint8Array>;
    }
    const headers = new Headers({
      "Content-Type": atlasContentTypeForPath(resolved.entry.path),
      "Content-Length": String(range?.length ?? resolved.entry.bytes),
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=31536000, immutable",
      "Cross-Origin-Resource-Policy": "same-origin",
      "X-Content-Type-Options": "nosniff",
      "X-Atlas-Asset-SHA256": resolved.entry.sha256,
      "X-Atlas-Range-Delivery": rangeDelivery,
      ETag: etag,
    });
    if (range) {
      headers.set("Content-Range", `bytes ${range.start}-${range.end}/${resolved.entry.bytes}`);
    }
    return new Response(body, { status: range ? 206 : 200, headers });
  } catch (error) {
    return notFound(error instanceof Error ? error.message : String(error));
  }
}
