import { existsSync, readFileSync } from "node:fs";

const failures = [];

for (const file of [
  "app/lib/missionReview.ts",
  "app/lib/missionRiskClient.ts",
  "app/workers/missionRisk.worker.ts",
  "app/lib/cinematicPostProfile.ts",
]) {
  if (!existsSync(file)) failures.push(`Missing ${file}`);
}

const types = readFileSync("app/lib/missionDesignerTypes.ts", "utf8");
for (const symbol of [
  "MissionReviewPackage",
  "MissionRunNotebookEntry",
  "MissionArtifactRecord",
  "MissionMonteCarloConfig",
  "MissionMonteCarloResult",
  "MissionRiskMetric",
  "MissionTrajectoryInspectionSample",
]) {
  if (!types.includes(symbol)) failures.push(`Missing type ${symbol}`);
}

const postProfile = readFileSync("app/lib/cinematicPostProfile.ts", "utf8");
if (!postProfile.includes("CinematicPostProfile")) failures.push("Missing type CinematicPostProfile");
if (!postProfile.includes("tour-cover")) failures.push("Missing post profile tour-cover");

const panel = readFileSync("app/components/MissionDesignerPanel.tsx", "utf8");
for (const marker of [
  'data-solar-mission-review',
  'data-solar-action="mission-monte-carlo"',
  'data-solar-action="mission-review-export-json"',
  'data-solar-action="mission-trajectory-inspect"',
]) {
  if (!panel.includes(marker)) failures.push(`Missing UI marker ${marker}`);
}

const hud = readFileSync("app/components/UniverseSandboxHud.tsx", "utf8");
for (const marker of ["POST PROFILE", "Export cover frame", "CINEMATIC_POST_PROFILES"]) {
  if (!hud.includes(marker)) failures.push(`Missing cinematic post UI ${marker}`);
}

const missionReview = readFileSync("app/lib/missionReview.ts", "utf8");
for (const symbol of [
  "runMissionMonteCarloLite",
  "createMissionReviewPackage",
  "missionReviewPackageToMarkdown",
  "missionStateHistoryToCsv",
  "missionManeuverEventsToCsv",
  "trajectoryInspectionSamples",
]) {
  if (!missionReview.includes(`function ${symbol}`)) failures.push(`Missing helper ${symbol}`);
}

if (failures.length) {
  console.error(`FAIL mission review audit:\n${failures.map((item) => `- ${item}`).join("\n")}`);
  process.exit(1);
}

console.log("PASS mission review audit: review, Monte Carlo, inspector, and cinematic post interfaces present");
