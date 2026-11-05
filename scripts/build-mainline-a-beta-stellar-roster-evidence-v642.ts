import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import rosterPack from "../app/data/mainlineABetaStellarRosterV641.generated.json";
import {
  canonicalEvidenceValueV642,
  createMainlineABetaStellarEvidencePlanV642,
  type MainlineABetaStellarEvidenceBuildV642,
  type MainlineABetaStellarEvidencePackV642,
  withEvidenceFingerprintV642,
} from "../app/lib/mainlineABetaStellarRosterEvidenceV642";
import { replayMainlineABetaStellarRosterEvidenceV642 } from "../app/lib/mainlineABetaStellarRosterEvidenceReplayV642";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PACK_PATH = path.join(ROOT, "app/data/mainlineABetaStellarRosterEvidenceV642.generated.json");
const RECEIPT_PATH = path.join(ROOT, "docs/release/v607/mainline-a-b3-stellar-evidence-v642.json");
const ROSTER_PATH = "app/data/mainlineABetaStellarRosterV641.generated.json";
const SCHEMA = "mainline-a-beta-stellar-roster-evidence-v642";
const GENERATED_AT = "2026-09-29T00:00:00.000Z";
const BRANCH = "codex/solar-sim-mainline-a";

function sha256(value: string | Uint8Array): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalEvidenceValueV642(value));
}

function fileSha256(relativePath: string): string {
  return sha256(fs.readFileSync(path.join(ROOT, relativePath)));
}

function gitHead(): string {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim();
  } catch {
    return "0000000000000000000000000000000000000000000000000000000000000000";
  }
}

function buildMetadata(): MainlineABetaStellarEvidenceBuildV642 {
  return {
    buildId: null,
    branch: BRANCH,
    head: gitHead(),
    distDir: null,
    sourceStableAtBuild: true,
  };
}

function fingerprintPack(pack: MainlineABetaStellarEvidencePackV642): MainlineABetaStellarEvidencePackV642 {
  return withEvidenceFingerprintV642(pack, sha256(canonicalJson(Object.fromEntries(Object.entries(pack).filter(([key]) => key !== "fingerprint")))));
}

function buildPack(): MainlineABetaStellarEvidencePackV642 {
  if (rosterPack.counts.total !== 24 || rosterPack.counts.runtimeExisting !== 20 || rosterPack.counts.candidateHold !== 4 || rosterPack.counts.componentConfirmed !== 0) {
    throw new Error("V642 requires the verified V641 20+4 roster and zero component confirmations");
  }
  const base = createMainlineABetaStellarEvidencePlanV642({
    generatedAt: GENERATED_AT,
    rosterSha256: fileSha256(ROSTER_PATH),
    build: buildMetadata(),
  });
  return fingerprintPack(base);
}

function buildReceipt(pack: MainlineABetaStellarEvidencePackV642) {
  const replay = replayMainlineABetaStellarRosterEvidenceV642(pack);
  return {
    schema: "mainline-a-b3-stellar-evidence-receipt-v642",
    batch: "B3",
    round: "V642 evidence session plan",
    generatedAt: GENERATED_AT,
    status: pack.build.buildId ? "build-bound-awaiting-observations" : "plan-only-awaiting-new-build-observations",
    pack: {
      path: "app/data/mainlineABetaStellarRosterEvidenceV642.generated.json",
      sha256: fileSha256("app/data/mainlineABetaStellarRosterEvidenceV642.generated.json"),
      schema: pack.schema,
      fingerprint: pack.fingerprint,
    },
    input: {
      path: ROSTER_PATH,
      sha256: pack.roster.sha256,
      counts: pack.roster,
    },
    build: pack.build,
    replay: {
      total: replay.total,
      required: replay.required,
      observed: replay.observed,
      openGateIds: replay.openGateIds,
      buildBound: replay.buildBound,
      reportable: replay.reportable,
    },
    evidenceClasses: ["static", "http", "visual", "browser", "performance", "external-source"],
    boundary: pack.boundary,
    claims: pack.claims,
    limits: [
      "This plan does not claim a successful HTTP response, browser draw, visual acceptance, performance, scientific validity or copyright approval.",
      "External-source records remain blocked until real source review; fixture, synthetic and timeout data cannot close them.",
      "The pack is a build-bound intake contract; it is not a replacement for a new build, HTTP receipt or browser receipt.",
    ],
  } as const;
}

function writeJson(relativePath: string, value: unknown): void {
  const absolute = path.join(ROOT, relativePath);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function checkExisting(expected: MainlineABetaStellarEvidencePackV642): void {
  if (!fs.existsSync(PACK_PATH)) throw new Error("V642 evidence pack is missing");
  const actual = JSON.parse(fs.readFileSync(PACK_PATH, "utf8")) as MainlineABetaStellarEvidencePackV642;
  if (canonicalJson(actual) !== canonicalJson(expected)) throw new Error("V642 evidence pack is stale");
  const expectedReceipt = buildReceipt(actual);
  if (!fs.existsSync(RECEIPT_PATH)) throw new Error("V642 evidence receipt is missing");
  const receipt = JSON.parse(fs.readFileSync(RECEIPT_PATH, "utf8")) as { pack?: { sha256?: string } };
  if (receipt.pack?.sha256 !== fileSha256("app/data/mainlineABetaStellarRosterEvidenceV642.generated.json")) throw new Error("V642 receipt is stale");
    if (expectedReceipt.replay.reportable !== false) throw new Error("V642 plan unexpectedly reportable");
    if (actual.build.buildId !== expected.build.buildId) throw new Error("V642 build binding is stale");
}

export function runV642(check = false): MainlineABetaStellarEvidencePackV642 {
  const pack = buildPack();
  if (check) {
    checkExisting(pack);
    return JSON.parse(fs.readFileSync(PACK_PATH, "utf8")) as MainlineABetaStellarEvidencePackV642;
  }
  writeJson("app/data/mainlineABetaStellarRosterEvidenceV642.generated.json", pack);
  writeJson("docs/release/v607/mainline-a-b3-stellar-evidence-v642.json", buildReceipt(pack));
  return pack;
}

function main(): void {
  const check = process.argv.includes("--check");
  const pack = runV642(check);
  const replay = replayMainlineABetaStellarRosterEvidenceV642(pack);
  console.log(JSON.stringify({
    schema: SCHEMA,
    check,
    fingerprint: pack.fingerprint,
    rosterSha256: pack.roster.sha256,
    buildId: pack.build.buildId,
    observed: replay.observed,
    required: replay.required,
    openGateIds: replay.openGateIds,
    reportable: replay.reportable,
  }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
