import { existsSync, readFileSync } from "node:fs";

const failures = [];
const requiredFiles = [
  "app/lib/missionDesignerTypes.ts",
  "app/lib/missionOperations.ts",
  "app/lib/missionHighFidelityClient.ts",
  "app/components/MissionDesignerPanel.tsx",
  "app/components/MissionTrajectoryPreview.tsx",
  "app/components/UniverseScene.tsx",
  "app/UniversePage.tsx",
];

for (const file of requiredFiles) {
  if (!existsSync(file)) failures.push(`Missing Mission Operations file: ${file}`);
}

const types = readFileSync("app/lib/missionDesignerTypes.ts", "utf8");
for (const token of [
  "MissionWorkspaceMode",
  "MissionWorkflowStage",
  "MissionRunProgressState",
  "MissionInspectionSelection",
]) {
  if (!types.includes(token)) failures.push(`Missing Mission Operations type: ${token}`);
}

const operations = readFileSync("app/lib/missionOperations.ts", "utf8");
for (const token of [
  "MISSION_WORKFLOW_STAGES",
  "canEnterMissionStage",
  "nextMissionStage",
  "filterMissionInspectionSamples",
  "missionInspectionPositionAu",
]) {
  if (!operations.includes(token)) failures.push(`Missing Mission Operations helper: ${token}`);
}

const workerClient = readFileSync("app/lib/missionHighFidelityClient.ts", "utf8");
if (!workerClient.includes("AbortSignal")) failures.push("Mission worker client missing AbortSignal interface");
if (!workerClient.includes("AbortError")) failures.push("Mission worker client missing AbortError cancellation path");

const panel = readFileSync("app/components/MissionDesignerPanel.tsx", "utf8");
for (const marker of [
  'data-solar-mission-mode',
  'data-solar-mission-stage',
  'data-solar-mission-workflow',
  'data-solar-mission-progress',
  'data-solar-mission-inspection-controls',
  'data-solar-action="mission-mode-toggle"',
  'data-solar-action="mission-run-cancel"',
]) {
  if (!panel.includes(marker)) failures.push(`Missing Mission Operations UI marker: ${marker}`);
}
if (!panel.includes("mission-stage-${item}")) failures.push("Mission workflow stage action binding missing");
if (!panel.includes('top-[42dvh]')) failures.push("Mobile immersive workspace does not preserve the top canvas region");

const page = readFileSync("app/UniversePage.tsx", "utf8");
if (!page.includes('missionWorkspaceMode === "immersive"')) failures.push("Mission immersive HUD suppression missing");
if (!page.includes("setMissionWorkspaceMode(\"panel\")")) failures.push("Escape or section exit does not leave Mission immersive mode");
if (!page.includes("onInspectionSelectionChange={setMissionInspectionSelection}")) failures.push("Mission inspection selection is not managed by UniversePage");

const scene = readFileSync("app/components/UniverseScene.tsx", "utf8");
if (!scene.includes("missionInspectionSelection")) failures.push("UniverseScene missing Mission inspection selection prop");

const trajectory = readFileSync("app/components/MissionTrajectoryPreview.tsx", "utf8");
if (!trajectory.includes("inspectionSelection")) failures.push("MissionTrajectoryPreview missing inspection selection highlight");

const readme = readFileSync("README.md", "utf8");
if (!/Mission Operations v3/i.test(readme)) failures.push("README missing Mission Operations v3 section");
if (!/not GMAT\/STK\/SPICE certification/i.test(readme)) failures.push("README missing Mission certification boundary");
if (/adds? .*solver|new .*solver/i.test(readme) && !/does not add solver capability/i.test(readme)) {
  failures.push("README may imply new Mission solver capability");
}

if (failures.length) {
  console.error(`FAIL mission operations audit:\n${failures.map((item) => `- ${item}`).join("\n")}`);
  process.exit(1);
}

console.log("PASS Mission Operations v3 immersive workflow, cancellation, inspection highlight, HUD suppression, and boundary audit.");
