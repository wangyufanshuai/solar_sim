import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const outputPath = process.argv[2] ?? "public/data/demo-mission-project-v1.json";
const now = "2026-06-10T00:00:00.000Z";

const constraints = {
  preset: "aggressive",
  dryMassKg: 4200,
  ispSeconds: 450,
  parkingOrbitAltitudeKm: 300,
  maxC3Km2S2: 120,
  maxTotalDeltaVKms: 18,
  maxDsmDeltaVKms: 5,
  maxDurationDays: 4200,
  minVenusFlybyAltitudeKm: 350,
  minJupiterFlybyAltitudeKm: 120000,
  maxNavigationUncertaintyKm: 1500,
};

const scenario = {
  schemaVersion: 1,
  id: "scenario-demo-evjs",
  name: "Demo Earth-Venus-Jupiter-Saturn Scenario",
  createdAt: now,
  updatedAt: now,
  epochSimDays: 0,
  options: {
    sequence: ["earth", "venus", "jupiter", "saturn"],
    departureStartDay: 35,
    departureWindowDays: 540,
    departureStepDays: 45,
    maxCandidates: 12,
    includeRelativity: true,
    ephemerisMode: "spice-table",
    constraintPreset: "aggressive",
    constraints,
  },
  constraints,
  selectedPlanId: null,
  notes: [
    "Preliminary aerospace engineering workbench scenario.",
    "Not GMAT/STK/SPICE certification.",
    "Finite-thrust solutions require offline Hermite-Simpson convergence before ranking.",
  ],
};

const project = {
  schemaVersion: 1,
  id: "project-demo-evjs",
  name: "Solar Sim Demo Mission Workbench",
  createdAt: now,
  updatedAt: now,
  activeScenarioId: scenario.id,
  scenarios: [scenario],
  runs: [],
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(project, null, 2)}\n`);
console.log(`Wrote ${outputPath}`);
