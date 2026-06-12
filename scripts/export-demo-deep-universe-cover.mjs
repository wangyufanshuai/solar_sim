import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const outDir = path.resolve("exports");
const outPath = path.join(outDir, "demo-deep-universe-cover-metadata.json");

await mkdir(outDir, { recursive: true });
await writeFile(outPath, `${JSON.stringify({
  targetId: "deep-sky-image:m42_v2",
  targetName: "Orion Nebula Hubble",
  routeId: "deep-sky-flight-route",
  routeStopIndex: 0,
  projection: "galactic",
  postProfile: "deep-universe-v4",
  timestamp: new Date().toISOString(),
  deepUniverse: {
    selectedTargetId: "deep-sky-image:m42_v2",
    title: "Orion Nebula Hubble",
    scaleLabel: "core",
    sourceCredit: "NASA Image and Video Library",
    renderProfile: "deep-universe-v4-observational",
    resourcePack: "pack-v3",
    qualityState: "preview",
    timestamp: new Date().toISOString(),
  },
  boundary: "Solar Sim Deep Universe v4 cover metadata is local-only and not a certified planetarium or scientific astrometry export.",
}, null, 2)}\n`, "utf8");

console.log(`Wrote ${path.relative(process.cwd(), outPath)}`);
