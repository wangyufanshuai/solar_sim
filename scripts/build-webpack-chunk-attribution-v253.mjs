import fs from "node:fs";
import path from "node:path";

function readArg(name, fallback = "") {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] ?? fallback : fallback;
}

const statsPath = readArg("--stats");
const outputPath = readArg("--output");
const profile = readArg("--profile", "unknown");
if (!statsPath || !outputPath) {
  throw new Error("Usage: node scripts/build-webpack-chunk-attribution-v253.mjs --stats <stats.json> --output <report.json> --profile <profile>");
}

const stats = JSON.parse(fs.readFileSync(statsPath, "utf8"));
if (!Array.isArray(stats.chunks)) throw new Error(`Webpack stats has no chunks: ${statsPath}`);

function leafModules(modules) {
  return (modules ?? []).flatMap((module) =>
    Array.isArray(module.modules) && module.modules.length > 0
      ? leafModules(module.modules)
      : [module],
  );
}

function normalizeName(module) {
  return String(module.nameForCondition || module.name || module.identifier || module.type || "unknown")
    .replaceAll("\\", "/")
    .replace(/^.*!/, "")
    .replace(/^.*\/next-web\//, "./");
}

function categoryFor(name) {
  const normalized = name.toLowerCase();
  if (normalized.includes("/node_modules/three/") || normalized.includes("/node_modules/@react-three/")) {
    return "vendor-three-r3f";
  }
  if (normalized.includes("/node_modules/recharts/") || normalized.includes("/node_modules/d3-")) {
    return "vendor-research-charts";
  }
  if (
    normalized.includes("/node_modules/next/")
    || normalized.includes("/node_modules/react/")
    || normalized.includes("/node_modules/react-dom/")
    || normalized.includes("/node_modules/scheduler/")
  ) return "vendor-framework";
  if (normalized.includes("/node_modules/")) return "vendor-other";
  if (normalized.startsWith("./app/") || normalized.includes("/next-web/app/")) {
    if (/gaiaresearch|science-workbench|observationplanner|observingplanner/i.test(normalized)) return "orbit-atlas-research";
    if (/catalogfaint|gaia(star|presentation)|cosmicscale|deep-space|constellation|nebula|starcluster/i.test(normalized)) return "orbit-atlas-deep-space";
    return "orbit-atlas-app";
  }
  if (normalized.startsWith("./src-tauri/") || normalized.startsWith("./scripts/")) return "orbit-atlas-tooling";
  if (normalized.includes("webpack/runtime") || normalized.includes("runtime modules")) return "bundler-runtime";
  return "orbit-atlas-other";
}

function sumBy(items, key) {
  const result = {};
  for (const item of items) result[item[key]] = (result[item[key]] ?? 0) + item.sourceBytes;
  return Object.fromEntries(Object.entries(result).sort(([left], [right]) => left.localeCompare(right)));
}

const chunks = stats.chunks.map((chunk) => {
  const modules = leafModules(chunk.modules).map((module) => {
    const name = normalizeName(module);
    return {
      name,
      category: categoryFor(name),
      sourceBytes: Number(module.size ?? 0),
    };
  });
  const topModules = modules
    .toSorted((left, right) => right.sourceBytes - left.sourceBytes || left.name.localeCompare(right.name))
    .slice(0, 30);
  return {
    id: chunk.id,
    files: chunk.files ?? [],
    initial: Boolean(chunk.initial),
    entry: Boolean(chunk.entry),
    compiledBytes: Number(chunk.size ?? 0),
    moduleCount: modules.length,
    sourceBytesByCategory: sumBy(modules, "category"),
    topModules,
  };
});

const allModules = chunks.flatMap((chunk) => chunk.topModules.map((module) => ({ ...module, chunkFiles: chunk.files })));
const categoryTotals = {};
for (const chunk of chunks) {
  for (const [category, bytes] of Object.entries(chunk.sourceBytesByCategory)) {
    categoryTotals[category] = (categoryTotals[category] ?? 0) + bytes;
  }
}
const orderedCategoryTotals = Object.fromEntries(
  Object.entries(categoryTotals).sort(([left], [right]) => left.localeCompare(right)),
);

const report = {
  version: "v275-webpack-module-attribution-v2",
  generatedAt: new Date().toISOString(),
  profile,
  sourceStats: path.relative(process.cwd(), path.resolve(statsPath)).replaceAll("\\", "/"),
  chunkCount: chunks.length,
  compiledChunkBytes: chunks.reduce((sum, chunk) => sum + chunk.compiledBytes, 0),
  sourceBytesByCategory: orderedCategoryTotals,
  applicationSourceBytes:
    (orderedCategoryTotals["orbit-atlas-app"] ?? 0)
    + (orderedCategoryTotals["orbit-atlas-research"] ?? 0)
    + (orderedCategoryTotals["orbit-atlas-deep-space"] ?? 0)
    + (orderedCategoryTotals["orbit-atlas-other"] ?? 0),
  vendorSourceBytes:
    (orderedCategoryTotals["vendor-three-r3f"] ?? 0)
    + (orderedCategoryTotals["vendor-research-charts"] ?? 0)
    + (orderedCategoryTotals["vendor-framework"] ?? 0)
    + (orderedCategoryTotals["vendor-other"] ?? 0),
  interpretation:
    "Webpack module source sizes support attribution only; browser transfer evidence remains authoritative for the Canvas-ready bundle gate.",
  chunks: chunks.toSorted((left, right) => right.compiledBytes - left.compiledBytes || String(left.id).localeCompare(String(right.id))),
  topModules: allModules
    .toSorted((left, right) => right.sourceBytes - left.sourceBytes || left.name.localeCompare(right.name))
    .slice(0, 50),
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify({
  output: outputPath,
  profile,
  chunkCount: report.chunkCount,
  compiledChunkBytes: report.compiledChunkBytes,
  applicationSourceBytes: report.applicationSourceBytes,
  vendorSourceBytes: report.vendorSourceBytes,
  sourceBytesByCategory: report.sourceBytesByCategory,
}, null, 2));
