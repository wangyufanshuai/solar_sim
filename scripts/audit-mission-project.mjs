import { existsSync, readFileSync } from "node:fs";

const requiredFiles = [
  "app/lib/missionProject.ts",
  "app/lib/missionDesignerTypes.ts",
  "app/components/MissionDesignerPanel.tsx",
  "public/data/low-thrust-solution-library-v1.json",
];

const failures = [];
for (const file of requiredFiles) {
  if (!existsSync(file)) failures.push(`Missing required file: ${file}`);
}

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
for (const script of ["audit:mission-project", "export:demo-scenario", "visual:tour"]) {
  if (!packageJson.scripts?.[script]) failures.push(`Missing package script: ${script}`);
}

const types = readFileSync("app/lib/missionDesignerTypes.ts", "utf8");
for (const symbol of [
  "MissionProject",
  "MissionScenario",
  "MissionRunRecord",
  "MissionEngineeringMatrixRow",
  "MissionExportFormat",
]) {
  if (!types.includes(` ${symbol}`) && !types.includes(`type ${symbol}`)) {
    failures.push(`Missing Mission type: ${symbol}`);
  }
}

const workbench = readFileSync("app/lib/missionProject.ts", "utf8");
for (const symbol of [
  "createMissionProject",
  "parseMissionProjectJson",
  "missionEngineeringMatrix",
  "missionLegsToCsv",
  "missionPlanToCcsdsOemLike",
]) {
  if (!workbench.includes(`export function ${symbol}`)) failures.push(`Missing missionProject helper: ${symbol}`);
}

const lowThrust = JSON.parse(readFileSync("public/data/low-thrust-solution-library-v1.json", "utf8"));
const solutions = Array.isArray(lowThrust.solutions) ? lowThrust.solutions : [];
for (const solution of solutions) {
  if (solution.status === "converged") {
    const positionKm = Number(solution.terminalResidual?.positionKm ?? solution.terminalPositionErrorKm);
    const velocityMps = Number(solution.terminalResidual?.velocityMps ?? solution.terminalVelocityErrorMps);
    const defects = Number(solution.defectSummary?.maxPositionDefectKm ?? solution.maxDefect);
    if (!(positionKm < 1000 && velocityMps < 10 && defects < 1000)) {
      failures.push(`Low-thrust solution ${solution.id} is converged but exceeds residual limits`);
    }
  }
  if (solution.status === "seed" && !solution.unavailableReason) {
    failures.push(`Low-thrust seed ${solution.id} must include unavailableReason`);
  }
}

if (failures.length) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  process.exit(1);
}

console.log(`PASS mission workbench audit (${solutions.length} low-thrust records checked)`);
