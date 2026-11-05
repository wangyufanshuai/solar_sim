import { atlasJsonResponseV275, atlasStrongEtagV275, consumeAtlasApiPolicyV275 } from "../../../../../lib/atlasApiPolicyV275";
import { KERR_DETECTOR_ELECTRON_EXPECTATION_PREFLIGHT_API_VERSION_V445, type KerrDetectorElectronExpectationApiV445 } from "../../../../../lib/kerrDetectorElectronExpectationPreflightV445";
import { loadKerrDetectorElectronExpectationV445 } from "../../../../../lib/kerrDetectorElectronExpectationPreflightServerV445";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const API_VERSION = KERR_DETECTOR_ELECTRON_EXPECTATION_PREFLIGHT_API_VERSION_V445;
const EXPORTS = new Set(["preflight", "contract"] as const);

export async function GET(request: Request): Promise<Response> {
  const delivery = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE ?? "standalone-full";
  if (delivery !== "local-shadow") return atlasJsonResponseV275("relativity-evidence", { version: API_VERSION, available: false, reason: delivery === "vercel-lite" ? "lite-boundary" : "local-shadow-only", summary: null } satisfies KerrDetectorElectronExpectationApiV445, { status: 200, headers: { "Cache-Control": "no-store" } });
  const limited = consumeAtlasApiPolicyV275(request, "relativity-evidence"); if (limited) return limited;
  try {
    const loaded = await loadKerrDetectorElectronExpectationV445(), format = new URL(request.url).searchParams.get("download");
    if (format !== null) { if (!EXPORTS.has(format as never)) return atlasJsonResponseV275("relativity-evidence", { error: "unsupported-export" }, { status: 400, headers: { "Cache-Control": "no-store" } }); const entry = loaded.exports[format as keyof typeof loaded.exports], body = entry.bytes.buffer.slice(entry.bytes.byteOffset, entry.bytes.byteOffset + entry.bytes.byteLength) as ArrayBuffer; return new Response(body, { status: 200, headers: { "Content-Type": entry.contentType, "Content-Disposition": `attachment; filename=${entry.name}`, "Cache-Control": "no-store", ETag: `"${entry.fileSha256}"`, "X-Atlas-Kerr-Detector-Electron": `v445-${format}` } }); }
    const body = JSON.stringify({ version: API_VERSION, available: true, reason: "ready", summary: loaded.summary } satisfies KerrDetectorElectronExpectationApiV445); if (Buffer.byteLength(body, "utf8") > 128 * 1024) throw new Error("v445-summary-size"); return new Response(body, { status: 200, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ETag: atlasStrongEtagV275(body), "X-Atlas-Kerr-Detector-Electron": "v445-summary" } });
  } catch { return atlasJsonResponseV275("relativity-evidence", { version: API_VERSION, available: false, reason: "evidence-corrupt", summary: null } satisfies KerrDetectorElectronExpectationApiV445, { status: 503, headers: { "Cache-Control": "no-store" } }); }
}
