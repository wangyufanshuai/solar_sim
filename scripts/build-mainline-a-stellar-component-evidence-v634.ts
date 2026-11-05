import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";
import { replayStellarComponents } from "./collect-mainline-a-stellar-components-v634.mjs";
import { buildPack as rebuildSimbadPack, verifyPackMetadata } from "./build-mainline-a-beta-stellar-structured-candidate-v621";
import {
  COMPONENT_BOUNDARY_V634,
  buildComponentEvidenceRecordV634,
  summarizeComponentEvidenceV634,
  validateComponentEvidencePackV634,
  type ComponentArtifactV634,
  type ComponentCaptureRecordV634,
  type ComponentEvidencePackV634,
  type ComponentEvidenceRecordV634,
} from "../app/lib/mainlineAStellarComponentEvidenceV634";

export const COMPONENT_OUTPUT_V634 = "app/data/mainlineAStellarComponentEvidenceV634.generated.json";
const MAX_BYTES = 2 * 1024 * 1024;

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function confined(root: string, relative: string): string {
  assert(typeof relative === "string" && relative.length > 0 && !relative.includes("\0"), "invalid path");
  const absolute = path.resolve(root, relative);
  const local = path.relative(path.resolve(root), absolute);
  assert(local && !local.startsWith(`..${path.sep}`) && local !== ".." && !path.isAbsolute(local), "path outside workspace");
  return absolute;
}

function readFile(root: string, relative: string): Buffer {
  const absolute = confined(root, relative);
  const stat = fs.lstatSync(absolute);
  assert(stat.isFile() && !stat.isSymbolicLink() && stat.size > 0 && stat.size <= MAX_BYTES, "bounded regular file required");
  const actualRoot = fs.realpathSync(root);
  confined(actualRoot, fs.realpathSync(absolute));
  const bytes = fs.readFileSync(absolute);
  assert(bytes.length === stat.size, "file changed while reading");
  return bytes;
}

function readArtifact(root: string, artifact: ComponentArtifactV634 | null): Buffer | null {
  if (!artifact) return null;
  const bytes = readFile(root, artifact.path);
  assert(sha256(bytes) === artifact.sha256 && bytes.length === artifact.bytes, "artifact digest or byte count mismatch");
  return bytes;
}

type CaptureLedger = {
  endedAt: string;
  sourceCandidatePack: { path: string; sha256: string };
  readme: { artifact: ComponentArtifactV634 | null };
  records: ComponentCaptureRecordV634[];
};

export function buildStellarComponentEvidenceV634({ root = process.cwd(), ledgerPath }: { root?: string; ledgerPath: string }): ComponentEvidencePackV634 {
  const ledgerBytes = readFile(root, ledgerPath);
  const replay = replayStellarComponents({ root, ledgerPath });
  assert(replay.status === "verified-capture-only", "capture replay required");
  assert(sha256(readFile(root, ledgerPath)) === sha256(ledgerBytes), "capture ledger changed during replay");
  const ledger = JSON.parse(ledgerBytes.toString("utf8")) as CaptureLedger;
  const source = readFile(root, ledger.sourceCandidatePack.path);
  assert(sha256(source) === ledger.sourceCandidatePack.sha256, "candidate pack changed during replay");
  const sourcePack = JSON.parse(source.toString("utf8"));
  const rebuiltSimbad = rebuildSimbadPack(root);
  verifyPackMetadata(sourcePack, rebuiltSimbad);
  assert(isDeepStrictEqual(sourcePack.records, rebuiltSimbad.records), "SIMBAD candidate hints differ from original raw replay");
  const readmeBytes = readArtifact(root, ledger.readme.artifact);
  const readmeText = readmeBytes ? new TextDecoder("utf-8", { fatal: true }).decode(readmeBytes) : "";
  const definitionAvailable = /^B\/wds\s/m.test(readmeText) && readmeText.includes("Comp") && readmeText.includes("Components");
  const records: ComponentEvidenceRecordV634[] = ledger.records.map((capture) => {
    const raw = readArtifact(root, capture.artifact);
    const parsed = buildComponentEvidenceRecordV634(capture, raw);
    if (!definitionAvailable && parsed.status === "catalogue-candidate") {
      return { ...parsed, status: "parse-blocked", blockers: [...parsed.blockers, "catalogue-definition-missing"] };
    }
    if (raw && parsed.table) {
      for (const row of parsed.table.rows) {
        const span = row.source;
        assert(span.byteStart >= 0 && span.byteEnd <= raw.length && span.byteEnd > span.byteStart, "row span out of bounds");
        assert(raw.subarray(span.byteStart, span.byteEnd).toString("utf8") === span.rawText, "raw row span mismatch");
      }
    }
    return parsed;
  });
  const pack: ComponentEvidencePackV634 = {
    schema: "mainline-a-stellar-component-evidence-v634", generatedAt: ledger.endedAt,
    captureLedger: { path: ledgerPath, sha256: sha256(ledgerBytes) }, sourceCandidatePack: ledger.sourceCandidatePack,
    readme: definitionAvailable ? ledger.readme.artifact : null,
    boundary: COMPONENT_BOUNDARY_V634, records,
  };
  const errors = validateComponentEvidencePackV634(pack);
  assert(errors.length === 0, `invalid component pack: ${errors.join(",")}`);
  return pack;
}

export function verifyStellarComponentEvidenceV634(current: unknown, rebuilt: ComponentEvidencePackV634): true {
  assert(isDeepStrictEqual(current, rebuilt), "component evidence differs from raw replay; refusing stored summaries or field claims");
  return true;
}

export function runComponentEvidenceV634({ root = process.cwd(), ledgerPath, output = COMPONENT_OUTPUT_V634, check = false, report }: {
  root?: string; ledgerPath: string; output?: string; check?: boolean; report?: string;
}) {
  const pack = buildStellarComponentEvidenceV634({ root, ledgerPath });
  const destination = confined(root, output);
  if (check) verifyStellarComponentEvidenceV634(JSON.parse(readFile(root, output).toString("utf8")), pack);
  else {
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, `${JSON.stringify(pack, null, 2)}\n`, { flag: "wx" });
  }
  const summary = summarizeComponentEvidenceV634(pack);
  const result = {
    schema: "mainline-a-stellar-component-semantic-replay-v634",
    status: "verified-candidate-only", output, sha256: sha256(readFile(root, output)),
    captureLedger: pack.captureLedger, sourceCandidatePack: pack.sourceCandidatePack,
    summary, records: pack.records.map((row) => ({
      id: row.id, status: row.status, wdsSystemId: row.wdsSystemId,
      pairCount: row.table?.rows.length ?? 0, artifact: row.artifact,
      byteSpansRecomputed: row.table?.rows.length ?? 0, blockers: row.blockers,
    })),
    boundary: COMPONENT_BOUNDARY_V634, rightsApproval: false, scientificValidityClaim: false,
  };
  if (report) {
    const reportPath = confined(root, report);
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, `${JSON.stringify(result, null, 2)}\n`, { flag: "wx" });
  }
  return result;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    const value = (name: string) => args.includes(name) ? args[args.indexOf(name) + 1] : undefined;
    const allowed = new Set(["--ledger", "--output", "--check", "--report"]);
    assert(args.filter((arg) => arg.startsWith("--")).every((arg) => allowed.has(arg)), "unknown option");
    assert(value("--ledger"), "--ledger required");
    console.log(JSON.stringify(runComponentEvidenceV634({ ledgerPath: value("--ledger")!, output: value("--output"), check: args.includes("--check"), report: value("--report") }), null, 2));
  } catch (error) { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; }
}
