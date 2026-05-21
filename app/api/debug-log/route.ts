import { appendFile } from "fs/promises";
import path from "path";

const LOG_CANDIDATES = [
  path.join(process.cwd(), "debug-a243dd.log"),
  path.join(process.cwd(), "..", "..", "debug-a243dd.log"),
];

export async function POST(req: Request) {
  try {
    const text = await req.text();
    if (text.length > 16_384) {
      return new Response("payload too large", { status: 413 });
    }
    const line = `${text.trim()}\n`;
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
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
