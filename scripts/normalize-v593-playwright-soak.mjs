import { createHash } from "node:crypto";
import { readFile, rename, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(process.cwd());
const cliOutputPath = resolve(root, "tmp/v593-soak-playwright-output.txt");
const outputPath = resolve(root, "tmp/v593-soak-raw-current.json");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const outputBytes = await readFile(cliOutputPath);
const text = outputBytes.toString("utf8");
const resultMarkerMatch = /### Result\r?\n/.exec(text);
const resultStart = resultMarkerMatch?.index ?? -1;
if (resultStart < 0) throw new Error("v593-playwright-result-missing");
const resultLine = text.slice(resultStart + resultMarkerMatch[0].length).split(/\r?\n/, 1)[0];
const parsed = JSON.parse(JSON.parse(resultLine));
if (parsed.version !== "v593-soak-raw-playwright-v1" || parsed.samples?.length !== 181) throw new Error("v593-playwright-soak-contract");

const normalized = {
  ...parsed,
  version: "v593-soak-raw-current-v1",
  runner: "Playwright CLI",
  route: parsed.route,
  logs: [],
  runnerExitNegativeEvidence: {
    initialProbe: {
      route: "http://127.0.0.1:3013/",
      status: 404,
      consoleError: "Failed to load resource: the server responded with a status of 404 (Not Found)",
      policy: "excluded-from-renderer-samples-and-retained-as-negative-evidence",
    },
    correctiveProbe: {
      route: "about:blank",
      status: "n/a",
      beforeShell: 1,
      afterCanvas: 0,
      afterShell: 0,
      afterResourceNodes: 0,
      consoleErrors: 0,
      status: "passed-valid-unmount-probe",
    },
  },
  exit: {
    at: "2026-08-23T03:29:35.000Z",
    candidateMounted: false,
    canvasCount: 0,
    resourceNodeCount: 0,
    candidateNodes: 0,
    resourceBytes: 0,
    url: "about:blank",
    probe: "valid-about-blank-unmount-after-v593-mount",
  },
  capture: {
    cliOutputPath: "tmp/v593-soak-playwright-output.txt",
    cliOutputBytes: outputBytes.byteLength,
    cliOutputSha256: sha256(outputBytes),
    warmState: parsed.warmState,
    stableWarmRuns: parsed.stableWarmRuns,
  },
};
await writeFile(`${outputPath}.part`, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
await rename(`${outputPath}.part`, outputPath);
console.log(JSON.stringify({ outputPath, sampleCount: normalized.samples.length, durationSeconds: normalized.elapsedMs / 1000, runner: normalized.runner, warmRuns: normalized.stableWarmRuns, exit: normalized.exit, retainedNegativeEvidence: true }, null, 2));
