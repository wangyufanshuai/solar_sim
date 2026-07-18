import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import {
  catalogPackManifestForClient,
  loadLocalCatalogPackDescriptor,
  resolveAllowedCatalogChunk,
  resolveLocalCatalogPackRoot,
} from "../../../../lib/catalogPackServerV7";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ path: string[] }> };

function unavailable(message = "本地百万恒星目录包未配置") {
  return NextResponse.json({ available: false, error: message }, { status: 404 });
}

export async function GET(_request: Request, context: RouteContext) {
  const { path } = await context.params;
  const root = resolveLocalCatalogPackRoot({
    configuredRoot: process.env.ATLAS_LOCAL_CONTENT_PACK_ROOT,
  });
  if (!root) return unavailable();

  let descriptor;
  try {
    descriptor = await loadLocalCatalogPackDescriptor(root);
  } catch (error) {
    return unavailable(error instanceof Error ? error.message : String(error));
  }

  const requested = path.join("/");
  if (requested === "manifest" || requested === "manifest.json") {
    return NextResponse.json(catalogPackManifestForClient(descriptor), {
      headers: { "Cache-Control": "no-store" },
    });
  }
  if (path.length !== 1) return unavailable("目录分块路径无效");
  const file = resolveAllowedCatalogChunk(descriptor, requested);
  if (!file) return unavailable("目录分块不在清单白名单中");

  const chunk = descriptor.allowedChunks.get(requested)!;
  const stream = Readable.toWeb(createReadStream(file)) as ReadableStream<Uint8Array>;
  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Length": String(chunk.bytes),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "X-Atlas-Chunk-SHA256": chunk.sha256,
    },
  });
}
