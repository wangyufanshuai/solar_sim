import { existsSync, readFileSync } from "node:fs";

const uiFiles = [
  "app/UniversePage.tsx",
  "app/components/BottomControlBar.tsx",
  "app/components/UniverseSandboxHud.tsx",
  "app/components/SolarConsoleShell.tsx",
  "app/components/ScienceTelemetryPanel.tsx",
  "app/components/SkyAtlasExplorer.tsx",
  "app/components/MissionDesignerPanel.tsx",
  "app/components/SpacecraftGalleryPanel.tsx",
];

const mojibakeTokens = [
  String.fromCodePoint(0xfffd),
  String.fromCodePoint(0x9225),
  String.fromCodePoint(0x9239),
  String.fromCodePoint(0x951b),
  String.fromCodePoint(0x9286),
  String.fromCodePoint(0x93b5),
  String.fromCodePoint(0x93c0),
  String.fromCodePoint(0x93bc),
  String.fromCodePoint(0x9352),
  String.fromCodePoint(0x947b),
  "涓荤嚎",
  "鏃犳硶",
  " 路 ",
];

const failures = [];

for (const file of uiFiles) {
  if (!existsSync(file)) {
    failures.push(`Missing UI file: ${file}`);
    continue;
  }
  const source = readFileSync(file, "utf8");
  for (const token of mojibakeTokens) {
    if (source.includes(token)) {
      failures.push(`${file} contains likely mojibake token ${JSON.stringify(token)}`);
    }
  }
}

const consoleShell = readFileSync("app/components/SolarConsoleShell.tsx", "utf8");
for (const label of ["Explore", "Deep", "Atlas", "Mission", "Gallery", "Search objects"]) {
  if (!consoleShell.includes(label)) failures.push(`Solar console copy missing ${label}`);
}

const bottomBar = readFileSync("app/components/BottomControlBar.tsx", "utf8");
for (const label of ["Explore", "Layers", "Launch", "Mission", "Atlas", "Tools", "days/s"]) {
  if (!bottomBar.includes(label)) failures.push(`Bottom control copy missing ${label}`);
}

const hud = readFileSync("app/components/UniverseSandboxHud.tsx", "utf8");
for (const label of ["Solar System", "Nearby Stars", "Deep Sky", "Milky Way background", "High-quality render"]) {
  if (!hud.includes(label)) failures.push(`Object browser copy missing ${label}`);
}

if (failures.length) {
  console.error(`UI copy audit failed (${failures.length})`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PASS AAA Interface v5 UI copy audit: no mojibake tokens and console copy is present.");
