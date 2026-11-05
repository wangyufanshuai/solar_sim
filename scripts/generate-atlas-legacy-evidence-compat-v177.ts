import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

async function main() {
const root = process.cwd();
const workbenchPath = resolve(root, "app", "AtlasRuntimeWorkbench.tsx");
const outputPath = resolve(root, "app", "lib", "atlasLegacyEvidenceCompatibilityV177.ts");
const source = await readFile(workbenchPath, "utf8");

const importedFrom = new Map<string, string>();
const importedByModule = new Map<string, string[]>();
for (const match of source.matchAll(/import\s*\{([\s\S]*?)\}\s*from\s*"(\.\/lib\/[^"\n]+)";/g)) {
  const modulePath = match[2];
  const names = match[1]
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value && !value.startsWith("type "))
    .map((value) => value.split(/\s+as\s+/)[0]);
  importedByModule.set(modulePath, names);
  for (const name of names) importedFrom.set(name, modulePath);
}

const staticBlock = source.match(
  /const STATIC_LEGACY_RELEASE_SUMMARIES = \{([\s\S]*?)\n\} as const;/,
)?.[1];
if (!staticBlock) throw new Error("STATIC_LEGACY_RELEASE_SUMMARIES block was not found");

const entries = [...staticBlock.matchAll(/(\w+):\s*(\w+)\(\),/g)].map((match) => ({
  name: match[1],
  factory: match[2],
}));
if (entries.length === 0) throw new Error("No legacy summary factories were found");

const moduleCache = new Map<string, Record<string, unknown>>();
async function loadModule(modulePath: string) {
  const cached = moduleCache.get(modulePath);
  if (cached) return cached;
  const absolute = resolve(root, "app", `${modulePath.slice(2)}.ts`);
  const loaded = await import(pathToFileURL(absolute).href) as Record<string, unknown>;
  moduleCache.set(modulePath, loaded);
  return loaded;
}

const summaries: Record<string, unknown> = {};
for (const entry of entries) {
  const modulePath = importedFrom.get(entry.factory);
  if (!modulePath) throw new Error(`No import found for ${entry.factory}`);
  const loaded = await loadModule(modulePath);
  const factory = loaded[entry.factory];
  if (typeof factory !== "function") throw new Error(`${entry.factory} is not callable`);
  summaries[entry.name] = factory();
}

const constants: Record<string, string | number | boolean> = {};
for (const modulePath of new Set(entries.map((entry) => importedFrom.get(entry.factory)!))) {
  const loaded = await loadModule(modulePath);
  for (const name of importedByModule.get(modulePath) ?? []) {
    if (!/^[A-Z][A-Z0-9_]+$/.test(name)) continue;
    const value = loaded[name];
    if (["string", "number", "boolean"].includes(typeof value)) {
      constants[name] = value as string | number | boolean;
    }
  }
}

const constantSource = Object.entries(constants)
  .sort(([left], [right]) => left.localeCompare(right))
  .map(([name, value]) => `export const ${name} = ${JSON.stringify(value)} as const;`)
  .join("\n");
const output = `/**\n * Generated compatibility snapshot for static historical release evidence.\n * Rebuild with: npx tsx scripts/generate-atlas-legacy-evidence-compat-v177.ts\n * Detailed source modules remain available to tests and on-demand panels; the\n * cold runtime only carries the values required by the frozen root contract.\n */\n\n${constantSource}\n\nexport const STATIC_LEGACY_RELEASE_SUMMARIES_V177 = ${JSON.stringify(summaries, null, 2)} as const;\n`;
await writeFile(outputPath, output, "utf8");
console.log(JSON.stringify({ outputPath, summaryCount: entries.length, constantCount: Object.keys(constants).length, bytes: output.length }));
}

void main();
