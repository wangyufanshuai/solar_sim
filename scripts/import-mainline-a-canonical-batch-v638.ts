import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { CANONICAL_BATCH_MAX_BYTES_V638, evaluateCanonicalBrowserBatchV638, type CanonicalBrowserBatchV638 } from "../app/lib/mainlineACanonicalBatchV638";
import { ensureOutputParent, safeFile, writeExclusiveJson } from "./mainline-a-release-evidence.mjs";
import { indexCanonicalObservationsV635 } from "./index-mainline-a-canonical-observations-v635";

type Options = { root: string; input: string; expectedSha256: string; buildReceipt: string; outputDirectory: string; coverage: string };
const hash = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");
const isRow = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === "object" && !Array.isArray(value));

async function readBounded(root: string, requested: string, limit: number) {
  const file = await safeFile(root, requested);
  if (!file.stat.size || file.stat.size > limit) throw new Error("batch-intake:file-size");
  const raw = await readFile(file.absolute);
  if (raw.length > limit) throw new Error("batch-intake:file-size");
  const json: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(raw));
  if (!isRow(json)) throw new Error("batch-intake:object-required");
  return { value: json, raw, reference: { path: file.relative, bytes: raw.length, sha256: hash(raw) } };
}

export async function importCanonicalBatchV638(options: Options) {
  if (!/^[a-f0-9]{64}$/u.test(options.expectedSha256)) throw new Error("batch-intake:expected-sha-required");
  const root = path.resolve(options.root);
  const input = await readBounded(root, options.input, CANONICAL_BATCH_MAX_BYTES_V638);
  if (input.reference.sha256 !== options.expectedSha256) throw new Error("batch-intake:byte-mismatch");
  const build = await readBounded(root, options.buildReceipt, 8 * 1024 * 1024);
  if (build.value.status !== "passed" || build.value.exitCode !== 0 || build.value.sourceStable !== true
    || typeof build.value.runtimeBuildId !== "string" || typeof build.value.branch !== "string" || typeof build.value.head !== "string") throw new Error("batch-intake:build-not-passed");
  const expectedBuild = { buildId: build.value.runtimeBuildId, branch: build.value.branch, head: build.value.head };
  const evaluation = evaluateCanonicalBrowserBatchV638(input.value, expectedBuild);
  if (evaluation.issues.length) throw new Error(`batch-intake:invalid:${evaluation.issues.join(",")}`);
  const batch = input.value as unknown as CanonicalBrowserBatchV638;
  const requestedOutput = options.outputDirectory.replaceAll("\\", "/").replace(/\/$/u, "");
  const destination = await ensureOutputParent(root, requestedOutput);
  await mkdir(destination.absolute);
  const records = [];
  for (let index = 0; index < batch.records.length; index += 1) {
    const record = batch.records[index];
    const relative = `${destination.relative}/run-${String(index + 1).padStart(2, "0")}-${hash(record.rawJson).slice(0, 12)}.json`;
    const encoded = Buffer.from(record.rawJson, "utf8");
    await writeFile(path.resolve(root, relative), encoded, { flag: "wx" });
    records.push({ path: relative, sha256: hash(encoded), bytes: encoded.length, runId: record.runId,
      status: evaluation.rows[index].status, issues: evaluation.rows[index].issues,
      sourceRecordIndex: index, sourceBundleSha256: input.reference.sha256 });
  }
  const accepted = evaluation.latest.filter((row) => row.status === "measured-local").map((row) => records[row.index]);
  let replay: Awaited<ReturnType<typeof indexCanonicalObservationsV635>> | null = null;
  if (accepted.length) replay = await indexCanonicalObservationsV635({
    root, raw: accepted.map((record) => record.path), buildReceipt: options.buildReceipt,
    coverage: options.coverage, output: `${destination.relative}/index.json`,
    replayOutput: `${destination.relative}/replay.json`,
  });
  const report = {
    schema: "mainline-a-canonical-batch-intake-v638", checkedAt: new Date().toISOString(),
    status: evaluation.status === "complete-local" && replay?.replay.status === "measured-local" ? "measured-local" : "incomplete-local",
    evidenceClass: "offline-replay-of-local-browser-observation",
    input: input.reference, buildReceipt: build.reference, build: expectedBuild,
    evaluation, records, selectedRawRecords: accepted.map((record) => record.path),
    replay: replay ? { index: replay.artifact, replay: replay.replay } : null,
    limits: {
      authenticity: "Bundle bytes and embedded record strings are retained; a separate actual browser receipt must bind extraction to the running build.",
      performance: "This intake does not create frame, long-run or physical-device evidence.",
      rawBytes: "Extracted record bytes are the exact UTF-8 rawJson strings in the source bundle; they are not independently signed artifacts.",
    },
    boundary: { candidateOnly: true, hold: true, notAdmitted: true, scientificPayloadWriteback: false, rightsApproval: false },
  };
  const receipt = await writeExclusiveJson(root, `${destination.relative}/intake.json`, report);
  return { status: report.status, verified: evaluation.verified, retainedRuns: records.length, receipt };
}

export function parseCanonicalBatchArgumentsV638(argv: string[], root: string): Options {
  const known = new Set(["--input", "--expected-sha256", "--build-receipt", "--output-directory", "--coverage"]);
  const values = new Map<string, string>();
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index], value = argv[index + 1];
    if (!known.has(flag) || values.has(flag) || !value || value.startsWith("--")) throw new Error(`batch-intake:argument:${flag}`);
    values.set(flag, value);
  }
  for (const flag of known) if (!values.has(flag)) throw new Error(`batch-intake:required:${flag}`);
  return { root, input: values.get("--input")!, expectedSha256: values.get("--expected-sha256")!,
    buildReceipt: values.get("--build-receipt")!, outputDirectory: values.get("--output-directory")!, coverage: values.get("--coverage")! };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  importCanonicalBatchV638(parseCanonicalBatchArgumentsV638(process.argv.slice(2), process.cwd())).then((result) => {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    process.exitCode = result.status === "measured-local" ? 0 : 1;
  }).catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 2;
  });
}
