import { appendFile } from "fs/promises";
import path from "path";
import {
  isAtlasDebugLogRequestAllowed,
  normalizeAtlasDebugLogLine,
} from "../../lib/atlasDebugLogSecurity";

const LOG_CANDIDATES = [
  path.join(process.cwd(), "debug-a243dd.log"),
  path.join(process.cwd(), "..", "..", "debug-a243dd.log"),
];

export async function POST(req: Request) {
  if (!isAtlasDebugLogRequestAllowed({
    nodeEnv: process.env.NODE_ENV,
    enabled: process.env.ATLAS_ENABLE_DEBUG_LOG,
    requestUrl: req.url,
  })) {
    return new Response(null, { status: 404 });
  }
  try {
    const text = await req.text();
    if (text.length > 16_384) {
      return new Response("payload too large", { status: 413 });
    }
    const line = `${normalizeAtlasDebugLogLine(text)}\n`;
    let lastErr: unknown;
    for (const p of LOG_CANDIDATES) {
      try {
        await appendFile(p, line, "utf8");
        return new Response(null, { status: 204 });
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr;
  } catch {
    return new Response(JSON.stringify({ error: "debug-log-write-failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
