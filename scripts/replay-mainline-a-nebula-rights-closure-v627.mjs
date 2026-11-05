import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  ROOT,
  DEFAULT_OUTPUT,
  CLOSURE_SCHEMA,
  ROSTER,
  BOUNDARY,
  readJsonAsync,
  safeWorkspacePath,
  containedPath,
  sha256Json,
  canonicalize,
  verifyReceiptShape,
  isIntegrityIssue,
  buildClosure,
  closureProjection,
} from "./build-mainline-a-nebula-rights-closure-v627.mjs";

export const REPLAY_SCHEMA = "mainline-a-nebula-rights-closure-replay-v627";
export const DEFAULT_REPLAY_OUTPUT = "docs/release/v607/mainline-a-r64-nebula-rights-closure-replay-v627-verified-20260921.json";

function safeStatus(value) {
  return ["ready", "pending", "blocked"].includes(value) ? value : "blocked";
}

export function eventForRow(row, ordinal) {
  const issueCodes = Array.isArray(row?.issues) ? row.issues.map((issue) => issue.code) : [];
  return {
    ordinal,
    id: row?.id ?? null,
    input: row?.source ?? "unknown",
    status: safeStatus(row?.status),
    sourceObserved: row?.sourceClosed === true,
    responseCaptured: row?.responseCaptured === true,
    artifactVerified: row?.artifactVerified === true,
    rightsCleared: row?.rightsCleared === true,
    issueCodes: [...new Set(issueCodes)].sort(),
    fingerprint: row?.fingerprint ?? sha256Json(row),
  };
}

export function replayDigest(events) {
  return sha256Json(events.map((event) => ({ ...event, fingerprint: event.fingerprint })));
}

export function replaySummary(events) {
  const summary = {
    total: events.length,
    ready: 0,
    pending: 0,
    blocked: 0,
    sourceObserved: 0,
    responseCaptured: 0,
    artifactVerified: 0,
    rightsCleared: 0,
    issueCodes: {},
  };
  for (const event of events) {
    summary[event.status] += 1;
    for (const key of ["sourceObserved", "responseCaptured", "artifactVerified", "rightsCleared"]) if (event[key]) summary[key] += 1;
    for (const code of event.issueCodes) summary.issueCodes[code] = (summary.issueCodes[code] ?? 0) + 1;
  }
  summary.issueCodes = Object.fromEntries(Object.entries(summary.issueCodes).sort(([a], [b]) => a.localeCompare(b)));
  return summary;
}

export function replayBoundary(receipt) {
  return {
    ...BOUNDARY,
    parentStatus: safeStatus(receipt?.status),
    runtimeAdmission: "candidate-only",
    measurementAdmission: "not-admitted",
    scientificPayloadWriteback: false,
  };
}

export function createReplay(receipt, parentPath = DEFAULT_OUTPUT) {
  const shapeIssues = verifyReceiptShape(receipt);
  if (shapeIssues.length) throw new Error(`cannot replay malformed closure receipt: ${shapeIssues.map((issue) => issue.code).join(",")}`);
  if (receipt.schema !== CLOSURE_SCHEMA) throw new Error("cannot replay a different closure schema");
  const rows = [...receipt.rows].sort((a, b) => ROSTER.indexOf(a.id) - ROSTER.indexOf(b.id));
  const events = rows.map(eventForRow);
  const summary = replaySummary(events);
  const blockers = [...new Set(events.flatMap((event) => event.issueCodes))].sort();
  const parentBlocked = receipt.status === "blocked" || rows.some((row) => row.status === "blocked");
  const replay = {
    schema: REPLAY_SCHEMA,
    version: 627,
    generatedAt: new Date().toISOString(),
    parent: {
      path: parentPath,
      schema: receipt.schema,
      status: receipt.status,
      runId: receipt.runId,
      sourceDigests: { batch: receipt.source?.batch?.sha256 ?? null, ledger: receipt.source?.ledger?.sha256 ?? null },
      deterministicInputDigest: receipt.replay?.deterministicInputDigest ?? null,
    },
    summary,
    events,
    blockers,
    status: parentBlocked || blockers.some(isIntegrityIssue) ? "blocked" : summary.rightsCleared === summary.total ? "ready" : "pending",
    boundary: replayBoundary(receipt),
    evidenceClass: "static-replay-of-external-source-ledger",
    claims: {
      sourceAuthenticity: "not-established-by-replay",
      copyrightApproval: false,
      scientificValidity: false,
      productionPerformance: false,
      realUserValidation: false,
      scientificPayloadWriteback: false,
    },
    replayDigest: null,
  };
  replay.replayDigest = replayDigest(events);
  return replay;
}

export function replayProjection(value) {
  return JSON.stringify(canonicalize({ schema: value.schema, version: value.version, parent: value.parent, summary: value.summary, events: value.events, blockers: value.blockers, status: value.status, boundary: value.boundary, evidenceClass: value.evidenceClass, claims: value.claims, replayDigest: value.replayDigest }));
}

export function verifyReplay(replay) {
  const issues = [];
  if (replay?.schema !== REPLAY_SCHEMA) issues.push("schema-invalid");
  if (replay?.version !== 627) issues.push("version-invalid");
  if (!Array.isArray(replay?.events) || replay.events.length !== ROSTER.length) issues.push("event-count-invalid");
  const ids = replay?.events?.map((event) => event.id) ?? [];
  if (new Set(ids).size !== ids.length || ROSTER.some((id) => !ids.includes(id))) issues.push("event-roster-invalid");
  if (!replay?.parent?.deterministicInputDigest) issues.push("parent-digest-missing");
  if (!replay?.boundary || replay.boundary.candidateOnly !== true || replay.boundary.hold !== true || replay.boundary.notAdmitted !== true || replay.boundary.scientificPayloadWriteback !== false) issues.push("boundary-invalid");
  if (replay?.claims?.copyrightApproval !== false || replay?.claims?.scientificValidity !== false || replay?.claims?.scientificPayloadWriteback !== false) issues.push("claims-open");
  if (replay?.replayDigest !== replayDigest(replay.events ?? [])) issues.push("replay-digest-mismatch");
  if (replay?.parent?.status === "blocked" && replay.status !== "blocked") issues.push("parent-blocked-downgrade");
  if ((replay?.blockers ?? []).some(isIntegrityIssue) && replay.status !== "blocked") issues.push("integrity-blocker-downgrade");
  if (JSON.stringify(replay.summary) !== JSON.stringify(replaySummary(replay.events ?? []))) issues.push("summary-mismatch");
  if ((replay.events ?? []).some((event) => event.rightsCleared)) issues.push("rights-promotion-forbidden");
  return [...new Set(issues)];
}

export async function loadParent(root = ROOT, parentPath = DEFAULT_OUTPUT) {
  safeWorkspacePath(root, parentPath, { allowMissing: false });
  return readJsonAsync(root, parentPath);
}

export async function replayFromCurrent({ root = ROOT, parentPath = DEFAULT_OUTPUT } = {}) {
  const parent = await loadParent(root, parentPath);
  const rebuilt = await buildClosure({ root, runId: parent.runId });
  if (closureProjection(parent) !== closureProjection(rebuilt.receipt)) throw new Error("parent closure projection differs from current source and artifact bytes");
  return createReplay(parent, parentPath);
}

export async function writeReplay(root, output, replay, refuseOverwrite = true) {
  if (!containedPath(root, output, ["docs/release/v607"])) throw new Error(`replay output outside release root: ${output}`);
  const outputPath = safeWorkspacePath(root, output, { allowMissing: true });
  if (refuseOverwrite && fs.existsSync(outputPath)) throw new Error(`refusing to overwrite replay receipt: ${output}`);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(replay, null, 2)}\n`, "utf8");
  return output;
}

export async function checkReplay(root, output, parentPath = DEFAULT_OUTPUT) {
  const stored = await readJsonAsync(root, output);
  const current = await replayFromCurrent({ root, parentPath });
  const storedProjection = replayProjection(stored);
  const currentProjection = replayProjection(current);
  if (storedProjection !== currentProjection) throw new Error("v627 replay receipt projection is stale");
  const issues = verifyReplay(stored);
  if (issues.length) throw new Error(`v627 replay receipt invalid: ${issues.join(",")}`);
  return { status: stored.status, output, parent: parentPath, summary: stored.summary, replayDigest: stored.replayDigest };
}

export function parseArgs(argv = process.argv.slice(2)) {
  const args = { root: ROOT, output: DEFAULT_REPLAY_OUTPUT, parent: DEFAULT_OUTPUT, check: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--check") args.check = true;
    else if (arg === "--json") args.json = true;
    else if (["--root", "--output", "--parent"].includes(arg)) {
      const value = argv[index + 1];
      if (!value) throw new Error(`${arg} requires a value`);
      index += 1;
      if (arg === "--root") args.root = path.resolve(value);
      if (arg === "--output") args.output = value;
      if (arg === "--parent") args.parent = value;
    } else throw new Error(`unknown argument: ${arg}`);
  }
  return args;
}

export async function run(args = parseArgs()) {
  if (args.check) return checkReplay(args.root, args.output, args.parent);
  const replay = await replayFromCurrent({ root: args.root, parentPath: args.parent });
  const issues = verifyReplay(replay);
  if (issues.length) throw new Error(`v627 replay failed closed: ${issues.join(",")}`);
  await writeReplay(args.root, args.output, replay, true);
  return { status: replay.status, output: args.output, parent: args.parent, summary: replay.summary, replayDigest: replay.replayDigest };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(path.dirname(fileURLToPath(import.meta.url)), "replay-mainline-a-nebula-rights-closure-v627.mjs")) {
  run().then((result) => { console.log(JSON.stringify(result, null, 2)); if (result.status === "blocked") process.exitCode = 1; }).catch((error) => { console.error(error.stack ?? error.message); process.exitCode = 1; });
}
