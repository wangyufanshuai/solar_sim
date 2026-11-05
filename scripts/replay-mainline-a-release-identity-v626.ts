import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { replayMainlineAIdentityCsvV626, replayMainlineAIdentityGatesV626, replayMainlineAIdentityJsonV626, identityReplaySummaryV626 } from "../app/lib/mainlineAReleaseIdentityReplayV626";
import type { MainlineAIdentityBridgeReceiptV626 } from "../app/lib/mainlineAReleaseIdentityBridgeV626";

const workspace = process.cwd();
const receiptArg = process.argv.indexOf("--receipt");
const receiptPath = path.resolve(workspace, receiptArg >= 0 ? process.argv[receiptArg + 1] : "docs/release/v607/mainline-a-r66-identity-bridge-v626-final-004.json");
const outputArg = process.argv.indexOf("--output");
const outputPath = outputArg >= 0 ? path.resolve(workspace, process.argv[outputArg + 1]) : null;
const checkOnly = process.argv.includes("--check");
const csvOnly = process.argv.includes("--csv");

function assertBoundary(receipt: MainlineAIdentityBridgeReceiptV626): void {
  if (receipt.boundary.candidateOnly !== true || receipt.boundary.hold !== true || receipt.boundary.notAdmitted !== true || receipt.boundary.scientificPayloadWriteback !== false) throw new Error("identity replay crossed the candidate boundary");
}

async function main(): Promise<void> {
  const receipt = JSON.parse(await readFile(receiptPath, "utf8")) as MainlineAIdentityBridgeReceiptV626;
  assertBoundary(receipt);
  const replay = replayMainlineAIdentityGatesV626(receipt);
  const summary = identityReplaySummaryV626(replay);
  if (checkOnly && (summary.requiredOpen > 0 || summary.status !== "passed")) process.exitCode = 1;
  if (outputPath) {
    if (checkOnly) throw new Error("refusing to write replay output in --check mode");
    const body = csvOnly ? replayMainlineAIdentityCsvV626(receipt) : replayMainlineAIdentityJsonV626(receipt);
    await writeFile(outputPath, csvOnly ? `${body}\n` : `${body}\n`, "utf8");
  }
  process.stdout.write(JSON.stringify({ schema: "mainline-a-release-identity-replay-cli-v626", receiptPath: path.relative(workspace, receiptPath).replaceAll("\\", "/"), summary, events: replay.events.length, output: outputPath ? path.relative(workspace, outputPath).replaceAll("\\", "/") : null }, null, 2) + "\n");
}

main().catch((error: unknown) => {
  process.stderr.write(error instanceof Error ? error.message + "\n" : String(error) + "\n");
  process.exitCode = 1;
});
