import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { parseSimbadHtmlV621, validateStructuredCandidateV621, type StructuredCandidateV621 } from "../app/lib/mainlineABetaStellarStructuredCandidateV621.ts";

export const INPUT_PATH = "app/data/mainlineABetaStellarRawAttemptLedgerV620.generated.json";
export const OUTPUT_PATH = "app/data/mainlineABetaStellarStructuredCandidateV621.generated.json";
export const SCHEMA = "mainline-a-beta-stellar-structured-candidate-pack-v621";
const readJson = (root: string, rel: string) => JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
type CapturedAttempt = {
  responseCaptured: number;
  rawArtifactPath?: string;
  rawPageSha256?: string;
  rawArtifactSha256?: string;
  responseBytes?: number;
  httpStatus?: number;
  transport?: string;
  contentType?: string;
  finalUrl?: string;
  endedAt?: string;
};
export type CapturedRecord = {
  id: StructuredCandidateV621["id"];
  planId: string;
  requestUrl?: string;
  plan: { id: string; planId: string; sourceUrl: string; queryIdentifier: string };
  attemptLedger?: CapturedAttempt[];
  attempts?: CapturedAttempt[];
};
const QUERIES = { acrux: "* alf01 Cru", spica: "* alf Vir", regulus: "* alf Leo", polaris: "* alf UMi" };

function assertSimbadUrl(value: string | undefined, query: string): string {
  const url = new URL(value ?? "");
  if (url.protocol !== "https:" || url.hostname !== "simbad.cds.unistra.fr" || url.username || url.password || url.port || url.pathname !== "/simbad/sim-id" || url.searchParams.get("Ident") !== query) {
    throw new Error("capture source URL or query binding invalid");
  }
  return url.toString();
}

export function buildCandidateFromCapturedRecord(root: string, record: CapturedRecord): StructuredCandidateV621 {
  const query = QUERIES[record.id];
  if (!query || record.plan?.id !== record.id || record.plan?.planId !== record.planId || record.plan.queryIdentifier !== query) throw new Error(`${record.id}: capture plan identity mismatch`);
  const attempts = record.attemptLedger ?? record.attempts ?? [];
  const captured = attempts.filter((entry) => entry.responseCaptured === 1);
  if (captured.length !== 1) throw new Error(`${record.id}: exactly one successful capture required`);
  const attempt = captured[0];
  if (attempt.transport !== "https-html" || attempt.httpStatus !== 200 || !/^text\/html(?:;|$)/i.test(attempt.contentType ?? "")) throw new Error(`${record.id}: authentic HTTPS HTML capture metadata required`);
  const sourceUrl = assertSimbadUrl(record.plan.sourceUrl, query);
  assertSimbadUrl(record.requestUrl, query);
  assertSimbadUrl(attempt.finalUrl, query);
  if (!attempt.endedAt || !/^\d{4}-\d{2}-\d{2}T.*Z$/.test(attempt.endedAt) || !Number.isFinite(Date.parse(attempt.endedAt))) throw new Error(`${record.id}: capture time invalid`);
  const relative = attempt.rawArtifactPath?.replaceAll("\\", "/");
  if (!relative || !relative.startsWith("docs/release/v607/raw-artifacts/r60/") || relative.split("/").includes("..") || path.isAbsolute(relative)) throw new Error(`${record.id}: raw artifact path outside capture root`);
  const artifactPath = path.resolve(root, relative);
  const captureRoot = fs.realpathSync(path.resolve(root, "docs/release/v607/raw-artifacts/r60"));
  const resolved = fs.realpathSync(artifactPath);
  const within = path.relative(captureRoot, resolved);
  if (!within || within.startsWith("..") || path.isAbsolute(within)) throw new Error(`${record.id}: raw artifact real path outside capture root`);
  const raw = fs.readFileSync(resolved);
  const digest = createHash("sha256").update(raw).digest("hex");
  if (digest !== attempt.rawPageSha256 || digest !== attempt.rawArtifactSha256) throw new Error(`${record.id}: raw artifact SHA-256 mismatch`);
  if (raw.length !== attempt.responseBytes || raw.length === 0) throw new Error(`${record.id}: raw artifact byte count mismatch`);
  const html = new TextDecoder("utf-8", { fatal: true }).decode(raw);
  const candidate = parseSimbadHtmlV621(html, { id: record.id, planId: record.planId, artifactPath: attempt.rawArtifactPath!, rawPageSha256: digest, sourceUrl, capturedAt: attempt.endedAt, expectedQueryIdentifier: query });
  const errors = validateStructuredCandidateV621(candidate);
  if (errors.length || candidate.parseStatus !== "parsed-candidate") throw new Error(`${record.id}: ${[...errors, ...candidate.parserWarnings].join(",")}`);
  for (const evidence of candidate.fieldEvidence ?? []) {
    if (evidence.byteEnd > raw.length || !raw.subarray(evidence.byteStart, evidence.byteEnd).toString("utf8").match(/^<TD\b[\s\S]*<\/TD>$/i)) throw new Error(`${record.id}: field evidence byte range mismatch`);
  }
  return candidate;
}

export function buildPack(root = process.cwd()) {
  const ledger = readJson(root, INPUT_PATH);
  if (ledger.schema !== "mainline-a-beta-stellar-raw-attempt-ledger-v620") throw new Error("V620 capture ledger schema required");
  const ids = ledger.records.map((record: CapturedRecord) => record.id);
  if (ids.length !== 4 || new Set(ids).size !== 4 || ids.some((id: string) => !Object.hasOwn(QUERIES, id))) throw new Error("exact four-star capture roster required");
  const rows = ledger.records.map((record: CapturedRecord) => buildCandidateFromCapturedRecord(root, record)) as StructuredCandidateV621[];
  return { schema: SCHEMA, generatedAt: new Date().toISOString(), source: { path: INPUT_PATH, schema: ledger.schema }, counts: { total: rows.length, parsedCandidate: rows.filter((row) => row.parseStatus === "parsed-candidate").length, blocked: rows.filter((row) => row.parseStatus === "parse-blocked").length, componentConfirmed: rows.filter((row) => row.componentIdentityStatus === "confirmed").length }, boundary: { candidateOnly: true, hold: true, notAdmitted: true, scientificPayloadWriteback: false, runtimeWrites: false, measurementWrites: false }, records: rows };
}

export function verifyPackMetadata(current: unknown, rebuilt: ReturnType<typeof buildPack>): true {
  if (!current || typeof current !== "object" || Array.isArray(current)) throw new Error("structured candidate pack must be an object");
  const stored = current as Record<string, unknown>;
  for (const field of ["schema", "counts", "boundary", "source"] as const) {
    if (!isDeepStrictEqual(stored[field], rebuilt[field])) throw new Error(`structured candidate ${field} changed`);
  }
  return true;
}

export function run({ root = process.cwd(), check = false } = {}) {
  const pack = buildPack(root);
  if (check) { const current = readJson(root, OUTPUT_PATH); verifyPackMetadata(current, pack); if (JSON.stringify(current.records) !== JSON.stringify(pack.records)) throw new Error("structured candidate records changed"); return { status: "verified", output: OUTPUT_PATH, counts: current.counts }; }
  fs.writeFileSync(path.join(root, OUTPUT_PATH), `${JSON.stringify(pack, null, 2)}\n`, "utf8");
  return { status: "generated", output: OUTPUT_PATH, counts: pack.counts };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) { try { console.log(JSON.stringify(run({ check: process.argv.includes("--check") }), null, 2)); } catch (error) { console.error(error.message); process.exitCode = 1; } }
