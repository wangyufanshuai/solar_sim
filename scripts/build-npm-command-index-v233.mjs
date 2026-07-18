import { readFile, writeFile } from "node:fs/promises";

const pkg = JSON.parse(await readFile("package.json", "utf8"));
const canonicalNames = new Set([
  "dev",
  "build",
  "build:atlas:standalone:current",
  "build:atlas:lite:current",
  "build:evidence:current",
  "check:evidence:current",
  "test:atlas:current-evidence-v233",
  "verify:atlas:current:focused",
  "build:dossier:v233",
]);
const commands = Object.entries(pkg.scripts)
  .map(([name, command]) => ({
    name,
    command,
    classification: canonicalNames.has(name)
      ? "canonical-current"
      : /(?:^|[-:])v\d+(?:$|[-:])/.test(name)
        ? "historical-versioned"
        : "supported-specialized",
  }))
  .sort((left, right) => left.name.localeCompare(right.name));
const document = {
  version: "v233-npm-command-index",
  generatedAt: new Date().toISOString(),
  commandCount: commands.length,
  counts: Object.fromEntries(
    [...new Set(commands.map((entry) => entry.classification))]
      .sort()
      .map((classification) => [classification, commands.filter((entry) => entry.classification === classification).length]),
  ),
  commands,
  boundary: "inventory-only-no-pre-1.0-historical-command-removal",
};
await writeFile("docs/archive/npm-command-index-v233.json", `${JSON.stringify(document, null, 2)}\n`);
console.log(JSON.stringify({ commandCount: document.commandCount, counts: document.counts }, null, 2));
