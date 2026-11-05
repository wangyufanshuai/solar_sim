import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadKerrDetectorCalibrationPackV364 } from "../../../../../../../lib/kerrDetectorCalibrationPackServerV364";

export const runtime = "nodejs"; export const dynamic = "force-dynamic";
const IDS = new Set(["manifest-template", "throughput-template", "noise-template", "acquisition-plan", "readme"]);
export async function GET(_request: Request, context: { params: Promise<{ file: string }> }) {
  if ((process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE ?? "standalone-full") !== "local-shadow") return Response.json({ available: false, reason: "local-shadow-only" }, { status: 404 });
  const { file } = await context.params; if (!IDS.has(file)) return Response.json({ available: false, reason: "not-whitelisted" }, { status: 404 });
  try {
    const pack = await loadKerrDetectorCalibrationPackV364(); const entry = pack.files.find((candidate) => candidate.id === file); if (!entry) return Response.json({ available: false, reason: "not-whitelisted" }, { status: 404 });
    const bytes = await readFile(resolve(process.cwd(), "dist/science/kerr-detector-calibration-pack-v364", entry.relativePath)); if (bytes.byteLength !== entry.bytes || bytes.byteLength > 64 * 1024) throw new Error("v364-file-size");
    return new Response(bytes, { status: 200, headers: { "Content-Type": `${entry.mediaType}; charset=utf-8`, "Content-Length": String(entry.bytes), "Cache-Control": "no-store", "Content-Disposition": `attachment; filename="${entry.relativePath}"`, "X-Atlas-Artifact-SHA256": entry.sha256, "X-Content-Type-Options": "nosniff" } });
  } catch { return Response.json({ available: false, reason: "evidence-corrupt" }, { status: 503 }); }
}
