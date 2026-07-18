import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const releaseDir = path.join(root, "dist", "release");
const fromRoot = (value) => path.join(root, value);
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const readJson = async (file) => JSON.parse(await readFile(fromRoot(file), "utf8"));
const gitTopLevel = execFileSync("git", ["rev-parse", "--show-toplevel"], { cwd: root, encoding: "utf8" }).trim();
const workspacePrefix = path.relative(gitTopLevel, root).replaceAll("\\", "/");

function workspacePath(repositoryFile) {
  const normalized = repositoryFile.replaceAll("\\", "/");
  return normalized === workspacePrefix
    ? "."
    : normalized.startsWith(`${workspacePrefix}/`)
      ? normalized.slice(workspacePrefix.length + 1)
      : `../${normalized}`;
}

function classifyPath(input) {
  const file = input.replaceAll("\\", "/");
  if (file.startsWith("../")) return "parent-workspace";
  if (/^(?:\.next|src-tauri\/target|dist\/desktop-stage)/.test(file)) return "build-output";
  if (/^(?:\.venv-science|science-cache|dist\/science\/kerr-shards)/.test(file)) return "science-cache";
  if (/^(?:dist\/content-packs|public\/(?:atlas-lite|assets|data))/.test(file)) return "content-or-runtime-asset";
  if (/^(?:dist\/(?:release|science)|output\/playwright)/.test(file) || file.endsWith(".generated.ts")) return "generated-evidence";
  if (/^(?:app|scripts|tests|src-tauri\/src)\//.test(file)) return "source-or-test";
  if (/^(?:docs\/|README\.md$)/.test(file)) return "documentation";
  if (/^(?:package(?:-lock)?\.json|next\.config\.mjs|proxy\.ts|playwright\.|tsconfig|eslint|postcss|tailwind|src-tauri\/.*\.(?:toml|json))/.test(file)) return "configuration";
  return "other";
}

const rawStatus = execFileSync(
  "git",
  ["status", "--porcelain=v1", "-z", "--untracked-files=normal"],
  { cwd: root },
).toString("utf8");
const entries = rawStatus
  .split("\0")
  .filter(Boolean)
  .map((record) => {
    const status = record.slice(0, 2);
    const repositoryFile = record.slice(3).replaceAll("\\", "/");
    const file = workspacePath(repositoryFile);
    return { status, file, repositoryFile, category: classifyPath(file) };
  });
const categoryCounts = Object.fromEntries(
  [...new Set(entries.map((entry) => entry.category))]
    .sort()
    .map((category) => [category, entries.filter((entry) => entry.category === category).length]),
);
const statusCounts = Object.fromEntries(
  [...new Set(entries.map((entry) => entry.status))]
    .sort()
    .map((status) => [status, entries.filter((entry) => entry.status === status).length]),
);

const evidenceFile = "dist/release/orbit-atlas-current-evidence-v233.json";
const evidence = await readJson(evidenceFile);
const inventory = {
  version: "v233-dirty-worktree-classified-inventory",
  generatedAt: new Date().toISOString(),
  gitTopLevel: gitTopLevel.replaceAll("\\", "/"),
  workspacePrefix,
  entryCount: entries.length,
  statusCounts,
  categoryCounts,
  entries,
  boundary: "inventory-only-no-stage-commit-reset-revert-clean-or-file-removal",
};
const dossier = {
  version: "v233-release-governance-dossier",
  generatedAt: inventory.generatedAt,
  status: "governance-verified-product-candidate-science-shadow-retained",
  releaseLabelsApplied: { webGa: false, desktopBeta: false, researchPromotion: false },
  currentEvidence: {
    file: evidenceFile,
    sha256: sha256(await readFile(fromRoot(evidenceFile))),
    manifestSha256: evidence.manifestSha256,
  },
  contracts: {
    rootAttributeCount: 603,
    rootKeyHash: "ac6470fcc517e1b2ba2c6618f530f7af57d1a0caa52fffae0af7232f912f9867",
    rootContractRole: "historical-browser-compatibility-snapshot-not-live-research-progress",
    singleCanvas: true,
    defaultScientificKernel: "legacy-eih-1pn",
    runtimePromotionApplied: false,
  },
  product: evidence.product,
  science: {
    decision: evidence.promotionInput.perBodyNoRegression && evidence.promotionInput.supportingGatesPassed
      ? "promotion-qualified-not-applied"
      : "shadow-retained",
    weakField: evidence.weakField,
    denseKerr: evidence.denseKerr,
    variationalStm: evidence.variationalStm,
  },
  dirtyWorktree: {
    inventory: "dist/release/orbit-atlas-v233-dirty-worktree-inventory.json",
    entryCount: inventory.entryCount,
    statusCounts,
    categoryCounts,
  },
  blockers: [
    "Dense Kerr release execution is incomplete; partial results are not aggregated.",
    "Variational STM evidence is smoke-only; 30-day calibration and ten-year blind qualification are pending.",
    "The worktree has no authorized Git release baseline.",
    "Vercel preview, domain migration, DNS rollback, signing and external Windows install QA were not performed.",
    "Standalone and Lite pass 600 KiB but have not reached the 590 KiB engineering target.",
  ],
  boundary: "local-governance-evidence-only-no-deployment-signing-or-git-mutation",
};

await mkdir(releaseDir, { recursive: true });
const inventoryFile = "dist/release/orbit-atlas-v233-dirty-worktree-inventory.json";
const dossierFile = "dist/release/orbit-atlas-v233-governance-dossier.json";
const markdownFile = "dist/release/orbit-atlas-v233-governance-dossier.md";
await writeFile(fromRoot(inventoryFile), `${JSON.stringify(inventory, null, 2)}\n`);
await writeFile(fromRoot(dossierFile), `${JSON.stringify(dossier, null, 2)}\n`);
const markdown = `# Orbit Atlas v233 release governance dossier

Status: **${dossier.status}**

## Current authority

- Evidence manifest: \`${evidenceFile}\`
- Manifest SHA-256: \`${evidence.manifestSha256}\`
- Default scientific kernel: \`legacy-eih-1pn\`
- Scientific status: **${dossier.science.decision}**
- Dense Kerr: **${evidence.denseKerr.completedReleaseShardCount}/${evidence.denseKerr.plannedShardCount} shards**, ${evidence.denseKerr.completedRayCount}/${evidence.denseKerr.plannedRayCount} rays, no partial aggregation
- Variational STM: **${evidence.variationalStm.profile}**, release qualification ${evidence.variationalStm.releaseQualificationAvailable ? "available" : "pending"}
- Weak-field per-body regressions: **${evidence.weakField.perBodyRegressionCount}**

## Product evidence

- Content packs: ${evidence.product.contentPacks.verifiedFileCount}/${evidence.product.contentPacks.manifestFileCount}
- Standalone Canvas-ready JavaScript: ${evidence.product.bundles.standaloneTransferBytes} B
- Lite Canvas-ready JavaScript: ${evidence.product.bundles.liteTransferBytes} B
- Local product gates: ${evidence.product.localProductGatesPassed ? "passed" : "failed"}

## Compatibility boundary

- The 603 root attributes remain the historical Browser compatibility snapshot.
- Current research progress is published on the non-root evidence surface.
- Root key hash remains \`${dossier.contracts.rootKeyHash}\`.
- No runtime or Worker physics, frozen scientific gate, fixture, V9 asset or visual budget was modified.

## Dirty worktree inventory

- Entries: ${inventory.entryCount}
${Object.entries(categoryCounts).map(([category, count]) => `- ${category}: ${count}`).join("\n")}

## Fail-closed blockers

${dossier.blockers.map((blocker) => `- ${blocker}`).join("\n")}

No deployment, signing, staging, commit, reset, revert or clean operation was performed.
`;
await writeFile(fromRoot(markdownFile), markdown);
const checksumFile = "dist/release/orbit-atlas-v233-governance.sha256";
const checksumTargets = [evidenceFile, inventoryFile, dossierFile, markdownFile];
await writeFile(
  fromRoot(checksumFile),
  `${(await Promise.all(checksumTargets.map(async (file) => `${sha256(await readFile(fromRoot(file)))}  ${file}`))).join("\n")}\n`,
);

console.log(JSON.stringify({
  status: dossier.status,
  evidenceManifestSha256: evidence.manifestSha256,
  dirtyEntryCount: inventory.entryCount,
  categoryCounts,
  outputs: { inventoryFile, dossierFile, markdownFile, checksumFile },
}, null, 2));
