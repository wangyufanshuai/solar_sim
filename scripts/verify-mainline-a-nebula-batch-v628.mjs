import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { OUTPUT, ROOT } from "./collect-mainline-a-nebula-batch-v628.mjs";
import { replayBatch } from "./replay-mainline-a-nebula-batch-v628.mjs";

export function verifyBatchFile(root = ROOT, relative = OUTPUT) {
  const absolute = path.resolve(root, relative);
  if (!fs.existsSync(absolute)) return { status: "blocked", errors: ["batch-file-missing"], path: relative };
  let batch;
  try { batch = JSON.parse(fs.readFileSync(absolute, "utf8")); } catch { return { status: "blocked", errors: ["batch-json-invalid"], path: relative }; }
  const replay = replayBatch(batch, root);
  return { ...replay, path: relative, fileSha256: createHash("sha256").update(fs.readFileSync(absolute)).digest("hex") };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { const report = verifyBatchFile(); console.log(JSON.stringify(report, null, 2)); if (report.status !== "passed") process.exitCode = 1; } catch (error) { console.error(error.stack ?? error.message); process.exitCode = 1; }
}
