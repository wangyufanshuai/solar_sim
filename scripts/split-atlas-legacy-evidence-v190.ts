import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

async function main() {
  const root = process.cwd();
  const workbenchPath = resolve(root, "app", "AtlasRuntimeWorkbench.tsx");
  const compactPath = resolve(root, "app", "lib", "atlasLegacyEvidenceCompatibilityV177.ts");
  const detailsPath = resolve(root, "app", "lib", "atlasLegacyEvidenceDetailsV190.ts");
  const [workbenchSource, fullSource] = await Promise.all([
    readFile(workbenchPath, "utf8"),
    readFile(compactPath, "utf8"),
  ]);
  const loaded = await import(`${pathToFileURL(compactPath).href}?v190=${Date.now()}`) as Record<string, unknown>;
  const summaries = loaded.STATIC_LEGACY_RELEASE_SUMMARIES_V177 as Record<string, Record<string, unknown>>;
  if (!summaries || typeof summaries !== "object") {
    throw new Error("STATIC_LEGACY_RELEASE_SUMMARIES_V177 is unavailable");
  }

  await writeFile(
    detailsPath,
    fullSource.replace(
      "Generated compatibility snapshot for static historical release evidence.",
      "Full historical release evidence loaded only by the relativity workbench.",
    ),
    "utf8",
  );

  const compactSummaries: Record<string, Record<string, unknown>> = {};
  for (const [summaryName, summary] of Object.entries(summaries)) {
    const accessed = new Set<string>();
    const accessPattern = new RegExp(`\\b${summaryName}\\.([A-Za-z0-9_]+)`, "g");
    for (const match of workbenchSource.matchAll(accessPattern)) accessed.add(match[1]);
    compactSummaries[summaryName] = Object.fromEntries(
      Object.entries(summary).filter(([key]) => accessed.has(key)),
    );
  }

  const constants = Object.entries(loaded)
    .filter(([name, value]) => /^[A-Z][A-Z0-9_]+$/.test(name)
      && ["string", "number", "boolean"].includes(typeof value))
    .sort(([left], [right]) => left.localeCompare(right));
  const constantSource = constants
    .map(([name, value]) => `export const ${name} = ${JSON.stringify(value)} as const;`)
    .join("\n");
  const compactSource = `/**\n * Generated root-contract compatibility snapshot for historical release evidence.\n * Full panel details live in atlasLegacyEvidenceDetailsV190 and load on intent.\n * Rebuild with: npx tsx scripts/split-atlas-legacy-evidence-v190.ts\n */\n\n${constantSource}\n\nexport const STATIC_LEGACY_RELEASE_SUMMARIES_V177 = ${JSON.stringify(compactSummaries, null, 2)} as const;\n`;
  await writeFile(compactPath, compactSource, "utf8");
  console.log(JSON.stringify({
    compactPath,
    detailsPath,
    summaryCount: Object.keys(compactSummaries).length,
    compactBytes: compactSource.length,
    detailsBytes: fullSource.length,
  }));
}

void main();
