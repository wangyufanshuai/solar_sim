import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(".");
const manifestPath = path.join(root, "dist/science/gaia-dr3-nearby-46000-v255.manifest.json");
const outputPath = path.join(root, "dist/science/catalog-expansion-v255.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

function countRows(text) {
  return (text.match(/^\s*\{ id:/gm) ?? []).length;
}

const constellationText = await readFile(path.join(root, "app/data/constellationCatalog.ts"), "utf8");
const asterismText = await readFile(path.join(root, "app/data/asterismCatalog.ts"), "utf8");
const nebulaText = await readFile(path.join(root, "app/data/nebulaCatalog.ts"), "utf8");
const nebulaExpansionText = await readFile(path.join(root, "app/data/nebulaCatalogV255.ts"), "utf8");
const clusterText = await readFile(path.join(root, "app/data/starClusterCatalog.ts"), "utf8");
const clusterExpansionText = await readFile(path.join(root, "app/data/starClusterCatalogV255.ts"), "utf8");
const asterisms = (asterismText.match(/id: "/g) ?? []).length;
const summary = {
  version: "v255-catalog-expansion",
  profile: "v255-gaia-asterism-deep-sky-expansion",
  status: "ready",
  scienceState: "science-failed-shadow-retained",
  defaultScientificKernel: "legacy-eih-1pn",
  candidatePolicy: "shadow-retained",
  gaia: {
    rowCount: manifest.rowCount,
    candidateCount: manifest.candidateCount,
    sourceSha256: manifest.sourceSha256,
    outputSha256: manifest.outputSha256,
    asset: manifest.outputPath,
    selection: manifest.selection,
  },
  visualCounts: {
    iauConstellations: Math.max(0, (constellationText.match(/iauCode: "/g) ?? []).length),
    asterisms,
    nebulae: countRows(nebulaText) + countRows(nebulaExpansionText),
    starClusters: countRows(clusterText) + Math.min(52, countRows(clusterExpansionText)),
  },
  activeRenderBudget: { mobile: 1000, balanced: 4000, dense: 8000, closeup: 1200 },
  livePhysicsMutation: "not-applied",
  workerPhysicsMutation: "not-applied",
  eihOnePnMutation: "not-applied",
  trustedBoundary: "Offline curated presentation/catalog expansion; not a full Gaia archive, not a formal IAU constellation revision, not a scientific gate and not a physics input.",
};
summary.canonicalSha256 = createHash("sha256").update(JSON.stringify(summary)).digest("hex");
await writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
console.log(`${summary.version}: Gaia ${summary.gaia.rowCount}; IAU ${summary.visualCounts.iauConstellations}; asterisms ${summary.visualCounts.asterisms}; clusters ${summary.visualCounts.starClusters}; nebulae ${summary.visualCounts.nebulae}; sha ${summary.canonicalSha256}`);
