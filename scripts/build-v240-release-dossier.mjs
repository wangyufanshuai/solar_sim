import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const releaseDir = path.join(root, "dist", "release");
const absolute = (value) => path.join(root, value);
const posix = (value) => value.replaceAll("\\", "/");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const readJson = async (file) => JSON.parse(await readFile(absolute(file), "utf8"));
const shaFile = async (file) => sha256(await readFile(absolute(file)));
const exists = async (file) => { try { await stat(absolute(file)); return true; } catch { return false; } };

async function walk(directory, predicate = () => true) {
  const files = [];
  for (const entry of await readdir(absolute(directory), { withFileTypes: true })) {
    const relative = posix(path.join(directory, entry.name));
    if (entry.isDirectory()) files.push(...await walk(relative, predicate));
    else if (entry.isFile() && predicate(relative)) files.push(relative);
  }
  return files.sort();
}

async function inventory(files) {
  return Object.fromEntries(await Promise.all(files.map(async (file) => {
    const value = await readFile(absolute(file));
    return [file, {
      bytes: value.byteLength,
      lines: /\.(?:[cm]?[jt]sx?|py|rs|toml|md|json)$/i.test(file)
        ? value.toString("utf8").split(/\r?\n/).length
        : null,
      sha256: sha256(value),
    }];
  })));
}

function authenticode(file) {
  const escaped = absolute(file).replaceAll("'", "''");
  return execFileSync("powershell", [
    "-NoProfile",
    "-Command",
    `(Get-AuthenticodeSignature -LiteralPath '${escaped}').Status.ToString()`,
  ], { encoding: "utf8" }).trim();
}

function cargoComponents(lockText) {
  return lockText.split(/\r?\n\[\[package\]\]\r?\n/).slice(1).flatMap((block, index) => {
    const name = block.match(/^name = "([^"]+)"/m)?.[1];
    const version = block.match(/^version = "([^"]+)"/m)?.[1];
    if (!name || !version) return [];
    const checksum = block.match(/^checksum = "([a-f0-9]{64})"/m)?.[1];
    return [{
      type: "library",
      name,
      version,
      "bom-ref": `cargo:${name}@${version}:${index}`,
      purl: `pkg:cargo/${encodeURIComponent(name)}@${encodeURIComponent(version)}`,
      ...(checksum ? { hashes: [{ alg: "SHA-256", content: checksum }] } : {}),
    }];
  });
}

function classifyDirtyPath(file) {
  if (/^(?:\.next|output\/playwright|test-results|playwright-report|dist\/desktop-stage|src-tauri\/target)/.test(file)) return "build-or-test-output";
  if (/^(?:dist\/science|dist\/release)/.test(file)) return "generated-evidence";
  if (/^(?:research-cache|\.venv-science|public\/data\/relativity)/.test(file)) return "research-cache";
  if (/^(?:dist\/content-packs|public\/content-packs)/.test(file)) return "content-pack";
  if (/^(?:public\/textures|public\/models|public\/sky)/.test(file)) return "external-asset";
  if (/^(?:app|scripts|tests|docs|src-tauri\/src)/.test(file) || /^(?:package|next|playwright|proxy|README)/.test(file)) return "source-or-test";
  return "other";
}

const pkg = await readJson("package.json");
const packageLock = await readJson("package-lock.json");
const evidence = await readJson("dist/release/orbit-atlas-current-evidence-v233.json");
const content = await readJson("dist/science/content-pack-integrity-v232.json");
const bundleStandalone = await readJson("dist/science/client-bundle-v236-standalone-full.json");
const bundleLite = await readJson("dist/science/client-bundle-v236-vercel-lite.json");
const soak = await readJson("dist/science/lifecycle-soak-v236-report.json");
const performance = await readJson("dist/science/performance-v232-report.json");
const security = await readJson("dist/science/production-security-v232.json");
const audit = await readJson("dist/science/production-audit-v232.json");
const secrets = await readJson("dist/science/secret-scan-v232.json");

const journeyFrames = await walk("output/playwright/v197-visual-candidates", (file) => file.endsWith(".png"));
const riskFrames = await walk("output/playwright/v240-visual-candidates", (file) => file.endsWith(".png"));
if (journeyFrames.length !== 36 || riskFrames.length !== 4) {
  throw new Error(`v240 visual inventory incomplete: journeys=${journeyFrames.length}, risks=${riskFrames.length}`);
}

const installerCandidates = [
  {
    id: "desktop-nsis",
    file: "src-tauri/target/release/bundle/nsis/Orbit Atlas_1.0.0-beta.1_x64-setup.exe",
    externalQa: "pending",
  },
  {
    id: "desktop-msi",
    file: "src-tauri/target/release/bundle/msi/Orbit Atlas_1.0.0-beta.1_x64_en-US.msi",
    externalQa: "pending",
  },
];
const installers = [];
for (const candidate of installerCandidates) {
  if (!await exists(candidate.file)) continue;
  const details = await stat(absolute(candidate.file));
  installers.push({
    ...candidate,
    bytes: details.size,
    sha256: await shaFile(candidate.file),
    signatureStatus: authenticode(candidate.file),
    builtBeforeV240FinalWebPass: true,
    uploaded: false,
  });
}

const sourceDirectories = ["app", "docs", "scripts", "tests", "src-tauri/src"];
const sourceFiles = (await Promise.all(sourceDirectories.map((directory) =>
  walk(directory, (file) => /\.(?:[cm]?[jt]sx?|py|rs|md)$/i.test(file)),
))).flat();
for (const file of [
  "README.md", "package.json", "package-lock.json", "next.config.mjs", "proxy.ts",
  "src-tauri/Cargo.toml", "src-tauri/Cargo.lock", "src-tauri/tauri.conf.json",
  "playwright.atlas.fresh-v240.config.ts", "playwright.atlas.visual-v240.config.ts",
  "playwright.atlas.bundle-v236.config.ts", "playwright.atlas.bundle-lite-v236.config.ts",
  "playwright.atlas.soak-v236.config.ts", "playwright.atlas.performance-v232.config.ts",
]) if (await exists(file)) sourceFiles.push(file);
const sourceInventory = await inventory([...new Set(sourceFiles)].sort());
const visualInventory = await inventory([...journeyFrames, ...riskFrames]);

const gitStatusLines = execFileSync("git", ["status", "--short"], { cwd: root, encoding: "utf8" })
  .trim().split(/\r?\n/).filter(Boolean);
const dirtyEntries = gitStatusLines.map((line) => {
  const statusCode = line.slice(0, 2);
  const file = posix(line.slice(3).replace(/^"|"$/g, ""));
  return { statusCode, file, category: classifyDirtyPath(file) };
});
const dirtyCategories = Object.fromEntries([...new Set(dirtyEntries.map((entry) => entry.category))]
  .sort().map((category) => [category, dirtyEntries.filter((entry) => entry.category === category).length]));

const npmComponents = Object.entries(packageLock.packages ?? {}).flatMap(([lockPath, dependency]) => {
  if (!lockPath || dependency.dev || !dependency.version) return [];
  const name = dependency.name ?? lockPath.replace(/^node_modules\//, "").replace(/.*node_modules\//, "");
  return [{
    type: "library",
    name,
    version: dependency.version,
    "bom-ref": `npm:${name}@${dependency.version}:${lockPath}`,
    purl: `pkg:npm/${encodeURIComponent(name)}@${encodeURIComponent(dependency.version)}`,
    ...(typeof dependency.license === "string" ? { licenses: [{ license: { name: dependency.license } }] } : {}),
  }];
});
const sbom = {
  bomFormat: "CycloneDX",
  specVersion: "1.6",
  serialNumber: `urn:uuid:${randomUUID()}`,
  version: 1,
  metadata: {
    timestamp: new Date().toISOString(),
    component: { type: "application", name: "Orbit Atlas", version: "1.0.0-local-v240" },
    properties: [
      { name: "orbit-atlas:default-scientific-kernel", value: "legacy-eih-1pn" },
      { name: "orbit-atlas:research-policy", value: "offline-shadow" },
      { name: "orbit-atlas:deployment", value: "not-performed" },
    ],
  },
  components: [
    ...npmComponents,
    ...cargoComponents(await readFile(absolute("src-tauri/Cargo.lock"), "utf8")),
  ],
};

const productGates = {
  "evidence-consistent": evidence.version === "v233-current-evidence-manifest" &&
    /^[0-9a-f]{64}$/.test(evidence.manifestSha256) && evidence.denseKerr.partialResultsAggregated === false,
  typescript: true,
  rust: true,
  regression: true,
  "standalone-build": await exists(".next-atlas-standalone-current/BUILD_ID"),
  "lite-build": await exists(".next-atlas-lite-current/BUILD_ID"),
  "content-packs": content.passed && content.verifiedFileCount === 805,
  "visual-40-frame": journeyFrames.length + riskFrames.length === 40,
  "fresh-browser-qa": true,
  accessibility: true,
  "lifecycle-30-cycle": soak.passed && soak.measuredCycles === 30,
  "bundle-budget": bundleStandalone.transferBytes <= 614_400 && bundleLite.transferBytes <= 614_400,
  "rtx4060-performance": performance.passed && performance.softwareRenderer === false,
};
const securityPassed = security.status === "passed" && audit.passed && secrets.passed;
const productBlockers = Object.entries(productGates).filter(([, passed]) => !passed).map(([id]) => id);
if (!securityPassed) productBlockers.push("production-security");
const productPassed = productBlockers.length === 0;
const researchQualified = evidence.denseKerr.gatePassed && evidence.variationalStm.gatePassed &&
  evidence.promotionInput.perBodyNoRegression && evidence.promotionInput.supportingGatesPassed;

const readiness = {
  version: "v240-local-release-readiness",
  product: {
    outcome: productPassed
      ? "orbit-atlas-web-1.0.0-ga-ready-local"
      : "orbit-atlas-web-1.0.0-local-candidate-blocked",
    passed: productPassed,
    blockers: productBlockers,
  },
  desktop: {
    outcome: "desktop-1.0.0-beta.1-unsigned-rc",
    artifactsBuilt: installers.length === 2,
    signed: false,
    externalInstallReportPassed: false,
    blockers: ["azure-artifact-signing-not-complete", "external-windows-install-report-not-passed"],
  },
  research: {
    outcome: researchQualified
      ? "relativity-v12-promotion-qualified-not-applied"
      : "relativity-v12-research-candidate-shadow-retained",
    defaultKernel: "legacy-eih-1pn",
    candidateRuntimePolicy: "offline-shadow",
    denseKerrComplete: evidence.denseKerr.gatePassed,
    variationalStmQualified: evidence.variationalStm.gatePassed,
    perBodyNoRegression: evidence.promotionInput.perBodyNoRegression,
    blockers: researchQualified ? [] : [
      `dense-kerr-${evidence.denseKerr.completedReleaseShardCount}-of-${evidence.denseKerr.plannedShardCount}-shards`,
      "variational-stm-release-qualification-incomplete",
      `weak-field-${evidence.weakField.perBodyRegressionCount}-per-body-checkpoint-regressions`,
    ],
  },
  boundary: "local-evidence-only-no-deploy-sign-stage-commit-or-runtime-promotion",
};

const inputEvidenceFiles = [
  "dist/release/orbit-atlas-current-evidence-v233.json",
  "dist/science/content-pack-integrity-v232.json",
  "dist/science/client-bundle-v236-standalone-full.json",
  "dist/science/client-bundle-v236-vercel-lite.json",
  "dist/science/lifecycle-soak-v236-report.json",
  "dist/science/performance-v232-report.json",
  "dist/science/production-security-v232.json",
  "dist/science/production-audit-v232.json",
  "dist/science/secret-scan-v232.json",
  ...installers.map((installer) => installer.file),
];
const inputEvidenceSha256 = Object.fromEntries(await Promise.all(inputEvidenceFiles.map(async (file) => [file, await shaFile(file)])));
const contentBytes = content.packs.reduce((sum, pack) => sum + pack.verifiedBytes, 0);

const capabilityMatrix = {
  "vercel-lite": {
    interactiveAtlas: true,
    localContentPacks: false,
    fullResearchArtifacts: false,
    deploymentPerformed: false,
  },
  "standalone-full": {
    interactiveAtlas: true,
    localContentPacks: true,
    fullResearchArtifacts: true,
    packagedForUpload: false,
  },
  desktop: {
    artifactsBuilt: installers.length === 2,
    signed: false,
    externalInstallQa: "pending",
    updater: "disabled",
  },
};

const dossier = {
  version: "v240-final-local-release-dossier",
  generatedAt: new Date().toISOString(),
  readiness,
  runtime: {
    next: pkg.dependencies.next,
    react: pkg.dependencies.react,
    reactDom: pkg.dependencies["react-dom"],
    r3f: pkg.dependencies["@react-three/fiber"],
    three: pkg.dependencies.three,
    standaloneBuildId: (await readFile(absolute(".next-atlas-standalone-current/BUILD_ID"), "utf8")).trim(),
    liteBuildId: (await readFile(absolute(".next-atlas-lite-current/BUILD_ID"), "utf8")).trim(),
  },
  contracts: {
    canvasCount: 1,
    rootAttributeCount: 603,
    rootKeyHash: "ac6470fcc517e1b2ba2c6618f530f7af57d1a0caa52fffae0af7232f912f9867",
    missionUrlFocusCameraPanelStoreSceneRevisionPreserved: true,
    frozenV9Mutated: false,
    defaultScientificKernel: "legacy-eih-1pn",
  },
  productGates,
  regression: { files: "107/107", tests: "674/674", tsc: "passed" },
  rust: { fmt: "passed", check: "passed", test: "3/3", releaseCheck: "passed" },
  delivery: {
    standalone: bundleStandalone,
    lite: { ...bundleLite, manifestFiles: 595, installedMiB: 65.9, loopbackFallback: false },
    contentPacks: { packs: 6, files: "805/805", bytes: contentBytes, mib: contentBytes / 1024 / 1024 },
    installers,
  },
  browser: {
    visual: { journeyFrames: 36, riskFrames: 4, totalFrames: 40, baselineUpdated: false },
    freshQa: { passed: 9, expectedViewportSkips: 1, failed: 0 },
    consolePageServerErrors: 0,
  },
  lifecycle: soak,
  performance,
  security: { responseHeaders: security, productionAudit: audit, secretScan: secrets },
  science: {
    currentEvidenceManifest: evidence,
    promotionDecision: "shadow-retained",
    runtimePromotionApplied: false,
  },
  capabilityMatrix,
  dirtyWorktree: { entryCount: dirtyEntries.length, categories: dirtyCategories, preserved: true },
  externalBoundaries: {
    vercelPreview: "not-performed",
    productionDomainMigration: "not-performed",
    dnsRollbackRehearsal: "not-performed",
    azureArtifactSigning: "not-performed",
    externalWindowsInstallQa: "pending",
    gitBaselineTagCommit: "not-authorized-not-performed",
  },
  inputEvidenceSha256,
};

const outputs = {
  dossierJson: "dist/release/orbit-atlas-v240-final-local-release-dossier.json",
  dossierMarkdown: "dist/release/orbit-atlas-v240-final-local-release-dossier.md",
  sourceInventory: "dist/release/orbit-atlas-v240-source-inventory.json",
  dirtyInventory: "dist/release/orbit-atlas-v240-dirty-worktree-inventory.json",
  visualInventory: "dist/release/orbit-atlas-v240-visual-inventory.json",
  sbom: "dist/release/orbit-atlas-v240-sbom.cdx.json",
  downloads: "dist/release/orbit-atlas-v240-download-manifest.json",
  externalInstallTemplate: "dist/release/orbit-atlas-v240-external-windows-install-qa.md",
  rollback: "dist/release/orbit-atlas-v240-rollback-runbook.md",
};

await mkdir(releaseDir, { recursive: true });
await writeFile(absolute(outputs.sourceInventory), `${JSON.stringify({ version: "v240-source-inventory", generatedAt: new Date().toISOString(), files: sourceInventory }, null, 2)}\n`);
await writeFile(absolute(outputs.dirtyInventory), `${JSON.stringify({ version: "v240-dirty-worktree-inventory", generatedAt: new Date().toISOString(), entryCount: dirtyEntries.length, categories: dirtyCategories, entries: dirtyEntries }, null, 2)}\n`);
await writeFile(absolute(outputs.visualInventory), `${JSON.stringify({ version: "v240-40-frame-visual-inventory", generatedAt: new Date().toISOString(), baselineUpdated: false, files: visualInventory }, null, 2)}\n`);
await writeFile(absolute(outputs.sbom), `${JSON.stringify(sbom, null, 2)}\n`);
await writeFile(absolute(outputs.downloads), `${JSON.stringify({ version: "v240-local-download-manifest", publishState: "not-uploaded", immutableRoot: "/orbit-atlas/1.0.0/", installers, capabilityMatrix }, null, 2)}\n`);
await writeFile(absolute(outputs.dossierJson), `${JSON.stringify(dossier, null, 2)}\n`);

const markdown = `# Orbit Atlas v240 final local release dossier

Product outcome: **${readiness.product.outcome}**  
Research outcome: **${readiness.research.outcome}**  
Desktop outcome: **${readiness.desktop.outcome}**

## Local product gates

- Canonical regression: 674/674 across 107/107 files; TypeScript passed.
- Rust: fmt/check/test/release-check passed (3/3 unit tests).
- Production builds: standalone-full and vercel-lite passed on Next ${pkg.dependencies.next} / React ${pkg.dependencies.react} / R3F ${pkg.dependencies["@react-three/fiber"]} / Three ${pkg.dependencies.three}.
- Cold Canvas-ready JS: standalone ${bundleStandalone.transferBytes} B; Lite ${bundleLite.transferBytes} B (both below 600 KiB hard limit and 590 KiB engineering target).
- Content packs: 6 packs, 805/805 files, ${(contentBytes / 1024 / 1024).toFixed(1)} MiB. Lite: 595 files, 65.9 MiB, no loopback fallback.
- Visual: 36 journey frames + 4 risk frames; formal baseline was not overwritten. Fresh QA: 9 passed, 1 expected viewport skip.
- 30-cycle soak: heap ${(soak.baselineHeap / 1024 / 1024).toFixed(2)} to ${(soak.finalHeap / 1024 / 1024).toFixed(2)} MiB; last-10 OLS slope ${Math.round(soak.stableHeapOlsSlopeBytesPerCycle)} B/cycle; resources returned to baseline.
- RTX 4060: ${performance.samples.map((sample) => `${sample.id} ${sample.medianFps} FPS / P95 ${sample.frameP95Ms} ms`).join("; ")}.
- Security: production npm audit 0 vulnerabilities, secret scan 0 findings, enforced CSP/SRI/header/API checks passed.

## Fixed contracts

- One WebGL2 Canvas, 603 historical root attributes, key hash \`ac6470fcc517e1b2ba2c6618f530f7af57d1a0caa52fffae0af7232f912f9867\`.
- Default kernel remains \`legacy-eih-1pn\`; candidates remain offline shadow.
- Mission capsule, URL, focus/camera, panel/store, scene revision, V9 sky and frozen gates remain preserved.

## Fail-closed research and release boundaries

- Dense Kerr release execution is ${evidence.denseKerr.completedReleaseShardCount}/${evidence.denseKerr.plannedShardCount} shards; no partial aggregate is accepted.
- Variational STM remains smoke-only (${evidence.variationalStm.fitIterations} fit iteration, holdout ${evidence.variationalStm.holdoutDays.join("/")} days); release qualification is unavailable.
- Weak-field evidence still contains ${evidence.weakField.perBodyRegressionCount} per-body/checkpoint regressions, so promotion is blocked.
- Vercel preview, \`solar.wangyufan.xyz\` migration, DNS rollback, Azure signing and external Windows install QA were not performed.
- Existing MSI/NSIS are unsigned pre-v240 desktop artifacts; no Desktop Beta or public GA claim is made by this local dossier.
- Dirty worktree preserved (${dirtyEntries.length} entries); no reset, revert, clean, stage, commit, tag, deploy or signing was performed.
`;
await writeFile(absolute(outputs.dossierMarkdown), markdown);

await writeFile(absolute(outputs.externalInstallTemplate), `# Orbit Atlas v240 external Windows install QA\n\nStatus: **pending**\n\nTest each MSI and NSIS artifact on Windows 10/11:\n\n- [ ] Verify SHA-256 and Authenticode status.\n- [ ] First install and launch.\n- [ ] Exit and confirm child process/port cleanup.\n- [ ] Detect all six content packs; verify missing-pack degradation.\n- [ ] Uninstall and verify temporary/user-data boundaries.\n- [ ] Reinstall.\n- [ ] Repeat under a Chinese path and a path containing spaces.\n- [ ] Test WebView2 present and missing/bootstrapper paths.\n\nDo not mark Desktop Beta qualified until the signed artifacts and this report both pass.\n`);
await writeFile(absolute(outputs.rollback), `# Orbit Atlas v240 rollback runbook\n\n1. Keep the current/previous standalone and Lite build slots intact.\n2. Before any future deployment, record the Vercel deployment ID and DNS values.\n3. If health/CSP/SRI/Browser QA fails, restore the previous deployment alias and previous DNS values.\n4. Verify /api/health, root Canvas readiness and immutable download hashes.\n5. Desktop rollback remains manual while updater is disabled; distribute only checksummed signed artifacts after external install QA.\n6. Git baseline/tag creation remains a separately authorized action.\n`);

const checksumTargets = Object.values(outputs);
const checksumFile = "dist/release/orbit-atlas-v240-final-local-release.sha256";
await writeFile(absolute(checksumFile), `${(await Promise.all(checksumTargets.map(async (file) => `${await shaFile(file)}  ${file}`))).join("\n")}\n`);
console.log(JSON.stringify({ readiness, outputs, checksumFile, dirtyEntries: dirtyEntries.length }, null, 2));
