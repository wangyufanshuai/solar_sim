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
  ["mission-run-worker", "Mission run worker", baseline.missionRunWorkerMaxTaskMs],
  ["mission-immersive", "Mission immersive", baseline.missionImmersiveMaxTaskMs],
  ["mission-stage-switch", "Mission stage switch", baseline.missionStageSwitchMaxTaskMs],
  ["mission-inspect-select", "Mission inspect select", baseline.missionInspectSelectMaxTaskMs],
  ["showcase-tour", "Showcase tour", baseline.showcaseTourMaxTaskMs],
  ["gallery-open", "Gallery open", baseline.galleryOpenMaxTaskMs],
  ["gallery-all-models", "Gallery all models", baseline.galleryAllModelsMaxTaskMs],
  ["mission-compare", "Mission compare", baseline.missionCompareMaxTaskMs],
  ["ccsds-export", "CCSDS export", baseline.ccsdsExportMaxTaskMs],
  ["monte-carlo-worker", "Monte Carlo worker", baseline.monteCarloWorkerMaxTaskMs],
  ["review-export", "Review export", baseline.reviewExportMaxTaskMs],
  ["trajectory-inspector", "Trajectory inspector", baseline.trajectoryInspectorMaxTaskMs],
  ["cinematic-post", "Cinematic post", baseline.cinematicPostMaxTaskMs],
  ["sky-atlas-open", "Sky Atlas open", baseline.skyAtlasOpenMaxTaskMs],
  ["sky-atlas-route", "Sky Atlas route", baseline.skyAtlasRouteMaxTaskMs],
  ["atlas-cover", "Atlas cover", baseline.atlasCoverMaxTaskMs],
  ["sky-atlas-map", "Sky Atlas map", baseline.skyAtlasMapMaxTaskMs],
  ["sky-atlas-route-builder", "Sky Atlas route builder", baseline.skyAtlasRouteBuilderMaxTaskMs],
  ["sky-atlas-route-export", "Sky Atlas route export", baseline.skyAtlasRouteExportMaxTaskMs],
  ["sky-atlas-immersive", "Sky Atlas immersive", baseline.skyAtlasImmersiveMaxTaskMs],
  ["sky-atlas-ranked-search", "Sky Atlas ranked search", baseline.skyAtlasRankedSearchMaxTaskMs],
  ["sky-atlas-timeline", "Sky Atlas timeline", baseline.skyAtlasTimelineMaxTaskMs],
  ["sky-atlas-album", "Sky Atlas album", baseline.skyAtlasAlbumMaxTaskMs],
];
const requestedScenarios = process.env.SOLAR_PERF_SCENARIOS
  ? new Set(process.env.SOLAR_PERF_SCENARIOS.split(",").map((value) => value.trim()).filter(Boolean))
  : null;
const activeChecks = requestedScenarios
  ? checks.filter(([id]) => requestedScenarios.has(id))
  : checks;

const rows = activeChecks.map(([id, label, limit]) => {
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
