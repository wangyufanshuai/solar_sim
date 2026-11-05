import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CANONICAL_COVERAGE_SHA256_V635 } from "../app/lib/mainlineACanonicalRuntimeV635";
import { safeFile, writeExclusiveJson } from "./mainline-a-release-evidence.mjs";
import { evaluateResourceReplayBytesV633, sha256ResourceBytesV633 } from "./replay-mainline-a-resource-observation-v633";
import { replayCanonicalRuntimeV635 } from "./replay-mainline-a-canonical-runtime-v635";

export type CanonicalIndexOptionsV635 = {
  root: string;
  raw: string[];
  buildReceipt: string;
  coverage: string;
  output: string;
  replayOutput?: string;
};

async function boundedJson(root: string, name: string) {
  const file = await safeFile(root, name);
  if (!file.stat.size || file.stat.size > 8 * 1024 * 1024) throw new Error("index:file-size");
  const bytes = await readFile(file.absolute);
  if (bytes.length > 8 * 1024 * 1024) throw new Error("index:file-size");
  const value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("index:object-required");
  return { value, bytes, path: file.relative, sha256: sha256ResourceBytesV633(bytes) };
}

export async function indexCanonicalObservationsV635(options: CanonicalIndexOptionsV635) {
  if (options.raw.length < 1 || options.raw.length > 72) throw new Error("index:raw-count");
  const root = path.resolve(options.root);
  const build = await boundedJson(root, options.buildReceipt);
  const coverage = await boundedJson(root, options.coverage);
  if (coverage.sha256 !== CANONICAL_COVERAGE_SHA256_V635) throw new Error("index:coverage-digest");
  if (build.value.status !== "passed" || build.value.exitCode !== 0 || build.value.sourceStable !== true) throw new Error("index:build-not-passed");
  for (const field of ["buildId", "runtimeBuildId", "branch", "head"]) {
    if (typeof build.value[field] !== "string" || !build.value[field] || build.value[field].startsWith("unknown")) throw new Error(`index:build-${field}`);
  }
  const rawObservations = [];
  const checks = [];
  const seenPaths = new Set<string>();
  const seenHashes = new Set<string>();
  const seenRunIds = new Set<string>();
  for (const requested of options.raw) {
    const raw = await boundedJson(root, requested);
    if (seenPaths.has(raw.path.toLowerCase()) || seenHashes.has(raw.sha256)) throw new Error("index:duplicate-artifact");
    if (raw.value.fixture === true || raw.value.synthetic === true || raw.value.origin === "fixture") throw new Error("index:fixture-not-admitted");
    const runId = raw.value.runId;
    if (typeof runId !== "string" || !runId.trim()) throw new Error("index:run-id-required");
    if (seenRunIds.has(runId)) throw new Error("index:duplicate-run-id");
    seenRunIds.add(runId);
    seenPaths.add(raw.path.toLowerCase());
    seenHashes.add(raw.sha256);
    rawObservations.push({ path: raw.path, sha256: raw.sha256 });
    const replay = evaluateResourceReplayBytesV633(raw.bytes, raw.sha256, build.value);
    checks.push({ runId, rawSha256: raw.sha256, status: replay.status, issues: replay.issues });
  }
  const outputIdentity = path.resolve(root, options.output).toLowerCase();
  const sourceNames = [options.buildReceipt, options.coverage, ...options.raw].map((name) => path.resolve(root, name).toLowerCase());
  if (sourceNames.includes(outputIdentity)) throw new Error("index:output-input-collision");
  if (options.replayOutput) {
    const replayName = path.resolve(root, options.replayOutput).toLowerCase();
    if (replayName === outputIdentity || sourceNames.includes(replayName)) throw new Error("index:replay-output-collision");
  }
  const body = {
    schema: "mainline-a-canonical-runtime-index-v635", mode: "candidate", status: "collected-pending-browser-binding",
    createdAt: new Date().toISOString(),
    build: { buildId: build.value.buildId, runtimeBuildId: build.value.runtimeBuildId, branch: build.value.branch, head: build.value.head },
    buildReceipt: { path: build.path, sha256: build.sha256 },
    coverage: { path: coverage.path, sha256: coverage.sha256 },
    rawObservations, checks,
    boundary: { candidateOnly: true, hold: true, notAdmitted: true, scientificPayloadWriteback: false },
    authenticity: "File intake and raw replay do not authenticate browser origin; release requires separately bound observed browser evidence.",
  };
  const artifact = await writeExclusiveJson(root, options.output, body);
  const replay = await replayCanonicalRuntimeV635({
    root, input: artifact.path, expectedSha256: artifact.sha256, buildReceipt: build.path,
    coverage: coverage.path, coverageSha256: coverage.sha256, output: options.replayOutput,
  });
  return { artifact, replay, sourceFilesMutated: false };
}

export function parseCanonicalIndexArgumentsV635(args: string[], root: string): CanonicalIndexOptionsV635 {
  const singles = new Map<string, string>();
  const raw: string[] = [];
  const known = new Set(["--raw", "--build-receipt", "--coverage", "--output", "--replay-output"]);
  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index], value = args[index + 1];
    if (!known.has(flag) || !value || value.startsWith("--")) throw new Error(`index:argument:${flag}`);
    if (flag === "--raw") raw.push(value);
    else {
      if (singles.has(flag)) throw new Error(`index:duplicate-argument:${flag}`);
      singles.set(flag, value);
    }
  }
  if (!raw.length) throw new Error("index:raw-required");
  for (const flag of ["--build-receipt", "--coverage", "--output"]) if (!singles.has(flag)) throw new Error(`index:required:${flag}`);
  return { root, raw, buildReceipt: singles.get("--build-receipt")!, coverage: singles.get("--coverage")!,
    output: singles.get("--output")!, replayOutput: singles.get("--replay-output") };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  Promise.resolve().then(() => indexCanonicalObservationsV635(parseCanonicalIndexArgumentsV635(process.argv.slice(2), process.cwd()))).then((result) => {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    process.exitCode = result.replay.status === "measured-local" ? 0 : 1;
  }).catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 2;
  });
}
