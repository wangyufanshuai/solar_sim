import { createHash } from "node:crypto";
import { lstat, readFile, realpath, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { evaluateMainlineAResourceObservationV633 } from "../app/lib/mainlineAResourceObservationV633";

const LIMIT_BYTES = 8 * 1024 * 1024;
const SHA = /^[a-f0-9]{64}$/u;
export type ResourceReplayOptionsV633 = {
  root: string;
  input: string;
  expectedSha256: string;
  buildReceipt: string;
  output?: string;
};

export function sha256ResourceBytesV633(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export function resolveResourceReplayPathV633(root: string, input: string): string {
  if (!input || input.includes("\0")) throw new Error("path:invalid");
  const absolute = path.resolve(root, input);
  const relative = path.relative(root, absolute);
  if (!relative || relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) throw new Error("path:outside-workspace");
  return absolute;
}

async function validateRealPath(root: string, absolute: string): Promise<void> {
  const actualRoot = await realpath(root);
  const actual = await realpath(absolute);
  resolveResourceReplayPathV633(actualRoot, actual);
  const relative = path.relative(root, absolute);
  let current = root;
  for (const segment of relative.split(path.sep)) {
    current = path.join(current, segment);
    if ((await lstat(current)).isSymbolicLink()) throw new Error("path:symlink-not-allowed");
  }
}

async function readBounded(root: string, input: string): Promise<Buffer> {
  const absolute = resolveResourceReplayPathV633(root, input);
  await validateRealPath(root, absolute);
  const stat = await lstat(absolute);
  if (!stat.isFile() || stat.size === 0 || stat.size > LIMIT_BYTES) throw new Error("file:regular-bounded-required");
  const bytes = await readFile(absolute);
  if (bytes.length > LIMIT_BYTES) throw new Error("file:too-large");
  return bytes;
}

function parseObject(bytes: Buffer): Record<string, unknown> {
  const parsed: unknown = JSON.parse(bytes.toString("utf8"));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("file:object-required");
  return parsed as Record<string, unknown>;
}

export function evaluateResourceReplayBytesV633(bytes: Buffer, expectedSha256: string, build: Record<string, unknown>) {
  if (bytes.length === 0 || bytes.length > LIMIT_BYTES) throw new Error("file:regular-bounded-required");
  if (!SHA.test(expectedSha256)) throw new Error("sha256:expected-required");
  const rawSha256 = sha256ResourceBytesV633(bytes);
  const observation = parseObject(bytes);
  const evaluation = evaluateMainlineAResourceObservationV633(observation);
  if (rawSha256 !== expectedSha256) evaluation.issues.push("sha256:raw-byte-mismatch");
  const observedBuild = observation.build as Record<string, unknown> | undefined;
  const buildIdentity = (build.buildIdentity ?? build.build ?? build) as Record<string, unknown>;
  const expectedBuildId = buildIdentity.runtimeBuildId ?? buildIdentity.buildId;
  if (!observedBuild || observedBuild.buildId !== expectedBuildId || observedBuild.branch !== buildIdentity.branch
    || observedBuild.head !== buildIdentity.head) evaluation.issues.push("build:receipt-mismatch");
  if (build.exitCode !== undefined && build.exitCode !== 0 || build.sourceStable === false) evaluation.issues.push("build:failed-or-unstable");
  if (evaluation.issues.length > 0) evaluation.status = "blocked";
  const session = observation.session as Record<string, unknown> | undefined;
  const viewport = observation.viewport as Record<string, unknown> | undefined;
  const durationMs = typeof observation.startedAt === "string" && typeof observation.endedAt === "string"
    ? Date.parse(observation.endedAt) - Date.parse(observation.startedAt) : NaN;
  const observationSummary = {
    validated: evaluation.status === "measured-local",
    startedAt: observation.startedAt ?? null,
    endedAt: observation.endedAt ?? null,
    durationMs: Number.isFinite(durationMs) ? durationMs : null,
    requestedDurationMs: session?.requestedDurationMs ?? null,
    device: viewport?.device ?? null,
    viewport: viewport ? structuredClone(viewport) : null,
    visibility: structuredClone(observation.visibility ?? null),
    sessionState: session?.state ?? null,
    durationSatisfied: session?.durationSatisfied ?? null,
    frameSummarySource: session?.frameSummarySource ?? null,
    frameSummaryMethod: session?.frameSummaryMethod ?? null,
    frameSummary: structuredClone(observation.frameSummary ?? null),
    checkpoints: Array.isArray(observation.checkpoints) ? observation.checkpoints.map((value: unknown) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return null;
      const checkpoint = value as Record<string, unknown>;
      return { phase: checkpoint.phase, capturedAt: checkpoint.capturedAt, elapsedMs: checkpoint.elapsedMs, scene: checkpoint.scene };
    }) : null,
    timeline: structuredClone(session?.timeline ?? null),
    sessionIssues: structuredClone(session?.issues ?? null),
    ...(evaluation.status === "measured-local" && observation.objectCycle
      ? { objectCycle: structuredClone(observation.objectCycle) } : {}),
  };
  return {
    schema: "mainline-a-resource-observation-replay-v633",
    evidenceClass: "offline-replay-of-local-browser-observation",
    rawSha256,
    expectedSha256,
    byteLength: bytes.length,
    runId: observation.runId,
    build: observedBuild,
    observationSummary,
    ...evaluation,
    limits: {
      registryBytes: "estimated allocation accounting; not physical GPU memory",
      authenticity: "hash and structure validation do not independently authenticate browser origin",
      performance: "local sample; not production performance or real-user validation",
      frameSummary: "browser requestAnimationFrame (RAF) intervals; not renderer frame time or proof that a canvas rendered",
      admission: "candidate-only / hold / not-admitted",
    },
  };
}

export async function replayMainlineAResourceObservationV633(options: ResourceReplayOptionsV633) {
  const root = path.resolve(options.root);
  const bytes = await readBounded(root, options.input);
  const buildBytes = await readBounded(root, options.buildReceipt);
  const report = {
    ...evaluateResourceReplayBytesV633(bytes, options.expectedSha256, parseObject(buildBytes)),
    input: path.relative(root, resolveResourceReplayPathV633(root, options.input)).replaceAll("\\", "/"),
    buildReceipt: path.relative(root, resolveResourceReplayPathV633(root, options.buildReceipt)).replaceAll("\\", "/"),
    buildReceiptSha256: sha256ResourceBytesV633(buildBytes),
  };
  if (options.output) {
    const output = resolveResourceReplayPathV633(root, options.output);
    const parent = path.dirname(output);
    if (parent !== root) await validateRealPath(root, parent);
    if (output === resolveResourceReplayPathV633(root, options.input) || output === resolveResourceReplayPathV633(root, options.buildReceipt)) throw new Error("output:input-collision");
    await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, { flag: "wx" });
  }
  return report;
}

export function parseResourceReplayArgumentsV633(args: string[], root: string): ResourceReplayOptionsV633 {
  const values = new Map<string, string>();
  const known = new Set(["--input", "--expected-sha256", "--build-receipt", "--output"]);
  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index];
    const value = args[index + 1];
    if (!known.has(flag) || values.has(flag) || !value || value.startsWith("--")) throw new Error(`argument:invalid:${flag}`);
    values.set(flag, value);
  }
  for (const flag of ["--input", "--expected-sha256", "--build-receipt"]) {
    if (!values.has(flag)) throw new Error(`argument:required:${flag}`);
  }
  return { root, input: values.get("--input")!, expectedSha256: values.get("--expected-sha256")!, buildReceipt: values.get("--build-receipt")!, output: values.get("--output") };
}

async function main(): Promise<void> {
  try {
    const report = await replayMainlineAResourceObservationV633(parseResourceReplayArgumentsV633(process.argv.slice(2), process.cwd()));
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    process.exitCode = report.status === "measured-local" ? 0 : 1;
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 2;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) void main();
