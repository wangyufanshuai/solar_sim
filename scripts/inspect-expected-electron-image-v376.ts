import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { parseExpectedElectronScienceImageInspectV376 } from "../app/lib/expectedElectronScienceImageInspectV376";

const root = process.cwd();
const input = "dist/science/measured-expectation-v375/envelope.json";
const output = "dist/science/expected-electron-image-v376/inspect.json";
const canonicalize = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : !value || typeof value !== "object"
      ? value
      : Object.fromEntries(
          Object.entries(value as Record<string, unknown>)
            .filter(([key]) => !["generatedAt", "artifactSha256"].includes(key))
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );
const sha = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const present = existsSync(resolve(root, input));
let invalidReason: string | null = null;
if (present) {
  try {
    const envelope = JSON.parse(readFileSync(resolve(root, input), "utf8")) as {
      status?: string;
      measuredExpectationAvailable?: boolean;
      counts?: { expectationRowCount?: number };
      artifactSha256?: string;
    };
    if (
      envelope.status !== "qualified-dual-authority-measured-expectation" ||
      envelope.measuredExpectationAvailable !== true ||
      envelope.counts?.expectationRowCount !== 12 ||
      sha(envelope) !== envelope.artifactSha256
    ) {
      throw new Error("v376-envelope-invalid");
    }
  } catch (error) {
    invalidReason = error instanceof Error ? error.message.slice(0, 160) : "v376-envelope-invalid";
  }
}
const unsigned = {
  version: "v376-expected-electron-science-image-inspect-v1" as const,
  generatedAt: new Date().toISOString(),
  status: (!present
    ? "blocked-envelope-unavailable"
    : invalidReason
      ? "blocked-envelope-invalid"
      : "ready-for-explicit-image-build") as
    | "blocked-envelope-unavailable"
    | "blocked-envelope-invalid"
    | "ready-for-explicit-image-build",
  expectedInput: "v375-dual-authority-envelope" as const,
  presentInputCount: (present ? 1 : 0) as 0 | 1,
  missingInputs: present ? [] : ["v375-dual-authority-envelope"],
  invalidReason,
  compilerImplemented: true as const,
  buildCommand:
    "npm run atlas -- relativity expected-electron-image-v376-build" as const,
  buildExecuted: false as const,
  imageAvailable: false as const,
  jsonPublished: false as const,
  csvPublished: false as const,
  zeroImageFallbackUsed: false as const,
  observedCountsAvailable: false as const,
  attemptConsumed: false as const,
  networkAttempted: false as const,
  formalProductPointer: "v263" as const,
  denseCampaignStatus: "incomplete-0-of-49" as const,
  browserQualification: "not-run" as const,
};
const artifact = parseExpectedElectronScienceImageInspectV376({
  ...unsigned,
  artifactSha256: sha(unsigned),
});
const target = resolve(root, output);
mkdirSync(dirname(target), { recursive: true });
const temporary = `${target}.${process.pid}.part`;
writeFileSync(temporary, `${JSON.stringify(artifact, null, 2)}\n`);
renameSync(temporary, target);
console.log(
  JSON.stringify(
    {
      status: artifact.status,
      artifactSha256: artifact.artifactSha256,
      present: artifact.presentInputCount,
      missing: artifact.missingInputs,
      compiler: artifact.compilerImplemented,
      imageAvailable: artifact.imageAvailable,
      zeroImageFallbackUsed: artifact.zeroImageFallbackUsed,
      observedCountsAvailable: artifact.observedCountsAvailable,
      attemptConsumed: artifact.attemptConsumed,
    },
    null,
    2,
  ),
);
