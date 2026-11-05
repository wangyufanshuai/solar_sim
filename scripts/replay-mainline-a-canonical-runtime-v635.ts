import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  CANONICAL_COVERAGE_SHA256_V635,
  evaluateCanonicalRuntimeCoverageV635,
  type CanonicalReplayedObservationV635,
} from "../app/lib/mainlineACanonicalRuntimeV635";
import {
  evaluateResourceReplayBytesV633,
  sha256ResourceBytesV633,
} from "./replay-mainline-a-resource-observation-v633";
import { safeFile, writeExclusiveJson } from "./mainline-a-release-evidence.mjs";

type Row = Record<string, unknown>;
type Ref = { path: string; sha256: string };
export type CanonicalReplayOptionsV635 = {
  root: string;
  input: string;
  expectedSha256: string;
  buildReceipt: string;
  coverage: string;
  coverageSha256: string;
  output?: string;
};
const MAX_BYTES = 8 * 1024 * 1024;
const MAX_REFERENCES = 72;
const SHA = /^[a-f0-9]{64}$/u;
const isRow = (value: unknown): value is Row => Boolean(value && typeof value === "object" && !Array.isArray(value));

async function readBounded(root: string, name: string) {
  const file = await safeFile(root, name);
  if (file.stat.size <= 0 || file.stat.size > MAX_BYTES) throw new Error("canonical:file-size");
  const bytes = await readFile(file.absolute);
  if (bytes.length > MAX_BYTES) throw new Error("canonical:file-size");
  const decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  const value: unknown = JSON.parse(decoded);
  if (!isRow(value)) throw new Error("canonical:object-required");
  return { bytes, value, path: file.relative, sha256: sha256ResourceBytesV633(bytes) };
}

export function validateCanonicalRuntimeIndexV635(value: unknown): Ref[] {
  if (!isRow(value) || value.schema !== "mainline-a-canonical-runtime-index-v635") throw new Error("canonical:index-schema");
  if (value.mode !== "candidate" || value.fixture === true || value.synthetic === true) throw new Error("canonical:index-origin");
  const boundary = value.boundary;
  if (!isRow(boundary) || boundary.candidateOnly !== true || boundary.hold !== true
    || boundary.notAdmitted !== true || boundary.scientificPayloadWriteback !== false) throw new Error("canonical:index-boundary");
  if (!Array.isArray(value.rawObservations) || value.rawObservations.length === 0
    || value.rawObservations.length > MAX_REFERENCES) throw new Error("canonical:index-observations");
  const paths = new Set<string>();
  const hashes = new Set<string>();
  return value.rawObservations.map((ref: unknown) => {
    if (!isRow(ref) || typeof ref.path !== "string" || !ref.path.trim() || typeof ref.sha256 !== "string"
      || !SHA.test(ref.sha256) || Object.keys(ref).some((key) => !["path", "sha256"].includes(key))) throw new Error("canonical:raw-reference");
    const normalized = ref.path.replaceAll("\\", "/").toLowerCase();
    if (paths.has(normalized) || hashes.has(ref.sha256)) throw new Error("canonical:duplicate-reference");
    paths.add(normalized);
    hashes.add(ref.sha256);
    return { path: ref.path, sha256: ref.sha256 };
  });
}

export async function replayCanonicalRuntimeV635(options: CanonicalReplayOptionsV635) {
  const root = path.resolve(options.root);
  if (!SHA.test(options.expectedSha256) || !SHA.test(options.coverageSha256)) throw new Error("canonical:expected-sha-required");
  const input = await readBounded(root, options.input);
  const coverage = await readBounded(root, options.coverage);
  const build = await readBounded(root, options.buildReceipt);
  if (input.sha256 !== options.expectedSha256) throw new Error("canonical:index-byte-mismatch");
  if (coverage.sha256 !== options.coverageSha256 || coverage.sha256 !== CANONICAL_COVERAGE_SHA256_V635) throw new Error("canonical:coverage-byte-mismatch");
  const refs = validateCanonicalRuntimeIndexV635(input.value);
  const source = build.value.buildIdentity ?? build.value.build ?? build.value;
  if (!isRow(source) || typeof (source.runtimeBuildId ?? source.buildId) !== "string"
    || typeof source.branch !== "string" || typeof source.head !== "string"
    || build.value.exitCode !== 0 || build.value.sourceStable !== true) throw new Error("canonical:build-invalid");
  const expectedBuild = { buildId: String(source.runtimeBuildId ?? source.buildId), branch: source.branch, head: source.head };
  const observationInputs: CanonicalReplayedObservationV635[] = [];
  const replays = [];
  const sourceReferences = [];
  for (const ref of refs) {
    const raw = await readBounded(root, ref.path);
    if (raw.sha256 !== ref.sha256) throw new Error(`canonical:raw-byte-mismatch:${raw.path}`);
    if (sourceReferences.some((item) => item.path.toLowerCase() === raw.path.toLowerCase())) throw new Error("canonical:duplicate-resolved-path");
    const replay = evaluateResourceReplayBytesV633(raw.bytes, ref.sha256, build.value);
    replays.push(replay);
    sourceReferences.push({ path: raw.path, sha256: raw.sha256, bytes: raw.bytes.length });
    observationInputs.push({ rawSha256: raw.sha256, observation: raw.value as unknown as typeof observationInputs[number]["observation"], evidenceClass: "browser-export" });
  }
  const evaluation = evaluateCanonicalRuntimeCoverageV635({
    coverage: coverage.value,
    observations: observationInputs, expectedBuild, expectedManifestDigest: coverage.sha256,
  });
  const replayIssues = replays.flatMap((replay, index) => replay.issues.map((issue) => `raw:${index}:${issue}`));
  const issues = [...new Set([...evaluation.issues, ...replayIssues])];
  const report = {
    ...evaluation,
    schema: "mainline-a-canonical-runtime-replay-v635",
    status: issues.length ? "blocked" : evaluation.status,
    evidenceClass: "offline-replay-of-local-browser-observation",
    issues, rawSha256: input.sha256, input: input.path,
    coverageSha256: coverage.sha256, coveragePath: coverage.path,
    buildReceiptSha256: build.sha256, buildReceiptPath: build.path, build: expectedBuild,
    rawObservations: sourceReferences,
    limits: {
      authenticity: "Exact bytes and structural replay do not independently authenticate browser origin; a separately bound actual browser observation is required.",
      visual: "Resource callbacks do not prove visual quality or real-user acceptance.",
      performance: "RAF intervals and resource estimates are local observations, not renderer frame time or production performance.",
      rights: "Technical coverage does not grant rights, component identity or scientific validity.",
    },
  };
  if (options.output) await writeExclusiveJson(root, options.output, report);
  return report;
}

export function parseCanonicalReplayArgumentsV635(args: string[], root: string): CanonicalReplayOptionsV635 {
  const values = new Map<string, string>();
  const known = ["--input", "--expected-sha256", "--build-receipt", "--coverage", "--coverage-sha256", "--output"];
  for (let index = 0; index < args.length; index += 2) {
    const [flag, value] = args.slice(index, index + 2);
    if (!known.includes(flag) || values.has(flag) || !value || value.startsWith("--")) throw new Error(`canonical:argument:${flag}`);
    values.set(flag, value);
  }
  for (const flag of known.slice(0, -1)) if (!values.has(flag)) throw new Error(`canonical:required:${flag}`);
  return {
    root, input: values.get("--input")!, expectedSha256: values.get("--expected-sha256")!,
    buildReceipt: values.get("--build-receipt")!, coverage: values.get("--coverage")!,
    coverageSha256: values.get("--coverage-sha256")!, output: values.get("--output"),
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  Promise.resolve().then(() => replayCanonicalRuntimeV635(parseCanonicalReplayArgumentsV635(process.argv.slice(2), process.cwd()))).then((report) => {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    process.exitCode = report.status === "measured-local" ? 0 : 1;
  }).catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 2;
  });
}
