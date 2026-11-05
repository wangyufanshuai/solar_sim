import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { ASTERISM_LINES } from "../app/data/asterismCatalog";
import { NEBULAE_V255_ADDITIONS } from "../app/data/nebulaCatalogV255";
import { STAR_CLUSTERS_V255_ADDITIONS } from "../app/data/starClusterCatalogV255";

const outputRoot = path.resolve("public/data");
const files = [
  ["asterisms-v255.json", ASTERISM_LINES],
  ["nebulae-v255-additions.json", NEBULAE_V255_ADDITIONS],
  ["star-clusters-v255-additions.json", STAR_CLUSTERS_V255_ADDITIONS],
] as const;
async function main() {
  await mkdir(outputRoot, { recursive: true });
  for (const [name, rows] of files) {
    await writeFile(path.join(outputRoot, name), `${JSON.stringify(rows)}\n`, "utf8");
    console.log(`${name}: ${rows.length} rows`);
  }
}

void main();
