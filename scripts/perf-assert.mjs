import { readFileSync } from "node:fs";
import { stdin } from "node:process";
import baseline from "./perf-baseline.json" with { type: "json" };

function readStdin() {
  return new Promise((resolve, reject) => {
    let data = "";
    stdin.setEncoding("utf8");
    stdin.on("data", (chunk) => {
      data += chunk;
    });
    stdin.on("end", () => resolve(data));
    stdin.on("error", reject);
  });
}

function parseProfile(raw) {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error("No perf profile JSON was provided.");
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start < 0 || end <= start) throw new Error("Could not find JSON object in perf profile output.");
    return JSON.parse(trimmed.slice(start, end + 1));
  }
}

function scenario(profile, name) {
  const found = profile.scenarios?.find((item) => item.scenario === name);
  if (!found) throw new Error(`Missing perf scenario: ${name}`);
  return found;
}

const inputPath = process.argv[2];
const raw = inputPath ? readFileSync(inputPath, "utf8") : await readStdin();
const profile = parseProfile(raw);

const checks = [
  ["rotate", "Balanced rotate", baseline.balancedRotateMaxTaskMs],
  ["quality", "Showcase", baseline.showcaseMaxTaskMs],
  ["safe", "Perf/Safe", baseline.safeMaxTaskMs],
  ["mission", "Mission", baseline.missionMaxTaskMs],
];

const rows = checks.map(([id, label, limit]) => {
  const result = scenario(profile, id);
  const value = result.maxTaskMs;
  const sampled =
    result.scenarioResult?.ok === true &&
    Number(result.scenarioResult?.frames ?? 0) > 30;
  return { id, label, value, limit, sampled, pass: sampled && value <= limit };
});

for (const row of rows) {
  const status = row.pass ? "PASS" : "FAIL";
  console.log(
    `${status} ${row.label}: ${row.value}ms <= ${row.limit}ms${row.sampled ? "" : " (scenario did not produce a valid frame sample)"}`,
  );
}

const failed = rows.filter((row) => !row.pass);
if (failed.length > 0) {
  process.exitCode = 1;
}
