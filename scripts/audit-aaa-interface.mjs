import { existsSync, readFileSync } from "node:fs";

const failures = [];

function requireFile(file) {
  if (!existsSync(file)) failures.push(`Missing file: ${file}`);
  return existsSync(file) ? readFileSync(file, "utf8") : "";
}

function requireToken(file, token, label = token) {
  const source = requireFile(file);
  if (!source.includes(token)) failures.push(`${file} missing ${label}`);
}

const solarUi = requireFile("app/lib/solarUi.ts");
for (const token of ["SolarUiMode", "SolarUiDensity", "HudVisibilityState", "SolarConsoleCopyKey"]) {
  if (!solarUi.includes(token)) failures.push(`Missing UI interface ${token}`);
}

requireToken("app/components/SolarConsoleShell.tsx", 'data-solar-console="v5"', "v5 console marker");
requireToken("app/components/SolarConsoleShell.tsx", "data-solar-ui-mode", "mode marker");
for (const action of ["aaa-explore", "aaa-deep", "aaa-atlas", "aaa-mission", "aaa-gallery", "aaa-search"]) {
  requireToken("app/components/SolarConsoleShell.tsx", action, `console action ${action}`);
}

const page = requireFile("app/UniversePage.tsx");
for (const token of [
  "HudVisibilityState",
  "developerHudVisible",
  "debugHudRequested",
  "activeSection === \"tools\" || debugHudRequested",
  "skyAtlasMode === \"immersive\" || missionWorkspaceMode === \"immersive\"",
  "setMissionWorkspaceMode(\"panel\")",
  "setSkyAtlasMode(\"panel\")",
]) {
  if (!page.includes(token)) failures.push(`UniversePage missing ${token}`);
}

requireToken("app/components/BottomControlBar.tsx", "max-md:hidden", "mobile compact nav");
requireToken("app/components/UniverseSandboxHud.tsx", "backdrop-blur-ui", "shared console panel styling");

const visual = requireFile("scripts/visual-acceptance.mjs");
for (const scenario of [
  "aaa-first-screen-v5",
  "aaa-solar-console-v5",
  "aaa-deep-universe-console-v5",
  "aaa-atlas-immersive-v5",
  "aaa-mission-workbench-v5",
  "aaa-gallery-studio-v5",
  "aaa-mobile-console-v5",
]) {
  if (!visual.includes(scenario)) failures.push(`Missing visual scenario ${scenario}`);
}

const readme = requireFile("README.md");
if (!/AAA Interface v5/i.test(readme)) failures.push("README missing AAA Interface v5 boundary");
if (/GMAT\/STK\/SPICE certification capability/i.test(readme)) {
  failures.push("README may imply certified Mission capability");
}

if (failures.length) {
  console.error(`AAA Interface audit failed (${failures.length})`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PASS AAA Interface v5 audit: console shell, modes, HUD policy, visual scenes, and boundaries are present.");
