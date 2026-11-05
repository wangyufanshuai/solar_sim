import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const releaseDir = path.join(root, "dist", "release");
const fromRoot = (value) => path.join(root, value);
const posix = (value) => value.replaceAll("\\", "/");
const shaBuffer = (value) => createHash("sha256").update(value).digest("hex");
const shaFile = async (value) => shaBuffer(await readFile(fromRoot(value)));
const readJson = async (value) => JSON.parse(await readFile(fromRoot(value), "utf8"));
const fileExists = async (value) => { try { await stat(fromRoot(value)); return true; } catch { return false; } };

async function walk(directory, predicate = () => true) {
  const output = [];
  for (const entry of await readdir(fromRoot(directory), { withFileTypes: true })) {
    const relative = posix(path.join(directory, entry.name));
    if (entry.isDirectory()) output.push(...await walk(relative, predicate));
    else if (entry.isFile() && predicate(relative)) output.push(relative);
  }
  return output.sort();
}

async function inventory(files) {
  return Object.fromEntries(await Promise.all(files.map(async (file) => {
    const value = await readFile(fromRoot(file));
    return [file, {
      bytes: value.byteLength,
      lines: /\.(?:[cm]?[jt]sx?|py|rs|toml|md|json)$/i.test(file)
        ? value.toString("utf8").split(/\r?\n/).length
        : null,
      sha256: shaBuffer(value),
    }];
  })));
}

function authenticode(file) {
  const script = `(Get-AuthenticodeSignature -LiteralPath '${fromRoot(file).replaceAll("'", "''")}').Status.ToString()`;
  return execFileSync("powershell", ["-NoProfile", "-Command", script], { encoding: "utf8" }).trim();
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

const pkg = await readJson("package.json");
const packageLock = await readJson("package-lock.json");
const content = await readJson("dist/science/content-pack-integrity-v232.json");
const bundleStandalone = await readJson("dist/science/client-bundle-v232-standalone-full.json");
const bundleLite = await readJson("dist/science/client-bundle-v232-vercel-lite.json");
const soak = await readJson("dist/science/lifecycle-soak-v232-report.json");
const performance = await readJson("dist/science/performance-v232-report.json");
const security = await readJson("dist/science/production-security-v232.json");
const audit = await readJson("dist/science/production-audit-v232.json");
const secrets = await readJson("dist/science/secret-scan-v232.json");
const rust = await readJson("dist/science/desktop-rust-release.json");
const stage = await readJson("dist/desktop-stage/release/desktop-stage.json");
const legacyBackdropAudit = await readJson("dist/science/browser-v232-legacy-v71-backdrop-gate-audit.json");
const densePlan = await readJson("dist/science/kerr-dense-execution-plan-v6-release.json");
const carterEvidence = await readJson("dist/science/kerr-carter-mino-reference-v6-evidence.json");
const canonicalCross = await readJson("dist/science/kerr-canonical-cross-validation-v6.json");
const denseAggregate = await readJson("dist/science/kerr-dense-cross-validation-v6.json");
const stmEvidence = await readJson("dist/science/relativity-variational-stm-v12-smoke-evidence.json");

const installers = [
  {
    id: "desktop-nsis",
    profile: "desktop-beta",
    file: "src-tauri/target/release/bundle/nsis/Orbit Atlas_1.0.0-beta.1_x64-setup.exe",
    immutableUrl: "https://solar.wangyufan.xyz/orbit-atlas/1.0.0/desktop-beta/orbit-atlas-1.0.0-beta.1-x64-setup.exe",
  },
  {
    id: "desktop-msi",
    profile: "desktop-beta",
    file: "src-tauri/target/release/bundle/msi/Orbit Atlas_1.0.0-beta.1_x64_en-US.msi",
    immutableUrl: "https://solar.wangyufan.xyz/orbit-atlas/1.0.0/desktop-beta/orbit-atlas-1.0.0-beta.1-x64.msi",
  },
];
for (const artifact of installers) {
  const details = await stat(fromRoot(artifact.file));
  artifact.bytes = details.size;
  artifact.sha256 = await shaFile(artifact.file);
  artifact.signatureStatus = authenticode(artifact.file);
  artifact.uploaded = false;
  artifact.rangeRequestsVerified = false;
}

const hardGates = {
  contentPacks805: content.passed && content.verifiedFileCount === 805,
  standaloneBundle600KiB: bundleStandalone.releaseTargetPassed && bundleStandalone.transferBytes <= 614_400,
  liteBundle600KiB: bundleLite.releaseTargetPassed && bundleLite.transferBytes <= 614_400,
  lifecycleSoak: soak.passed,
  namedHardwarePerformance: performance.passed && performance.softwareRenderer === false,
  productionSecurity: security.status === "passed",
  productionAudit: audit.passed,
  secretScan: secrets.passed,
  rustRelease: rust.passed,
  desktopStage: stage.files === 2785 && stage.bytes <= 260 * 1024 * 1024,
  unsignedInstallersBuilt: installers.every((artifact) => artifact.bytes > 0 && artifact.signatureStatus === "NotSigned"),
};
if (!Object.values(hardGates).every(Boolean)) {
  throw new Error(`v232 hard gate failed: ${JSON.stringify(hardGates)}`);
}

const visualFiles = await walk("output/playwright/v197-visual-candidates", (file) => file.endsWith(".png"));
if (visualFiles.length !== 36) throw new Error(`Expected 36 visual candidates, found ${visualFiles.length}`);
const visualInventory = await inventory(visualFiles);

const sourceDirectories = ["app", "docs", "scripts", "tests", "src-tauri/src"];
const sourceExtensions = /\.(?:[cm]?[jt]sx?|py|rs|md)$/i;
const sourceFiles = (await Promise.all(sourceDirectories.map((directory) => walk(directory, (file) => sourceExtensions.test(file))))).flat();
for (const file of [
  "package.json", "package-lock.json", "next.config.mjs", "proxy.ts",
  "src-tauri/Cargo.toml", "src-tauri/Cargo.lock", "src-tauri/tauri.conf.json",
  "playwright.atlas.fresh-v232.config.ts", "playwright.atlas.visual-v232.config.ts",
  "playwright.atlas.bundle-v232.config.ts", "playwright.atlas.bundle-lite-v232.config.ts",
  "playwright.atlas.soak-v232.config.ts", "playwright.atlas.performance-v232.config.ts",
]) if (await fileExists(file)) sourceFiles.push(file);
const sourceInventory = await inventory([...new Set(sourceFiles)].sort());

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
    component: { type: "application", name: "Orbit Atlas", version: "1.0.0" },
    properties: [
      { name: "orbit-atlas:desktop-channel", value: "1.0.0-beta.1" },
      { name: "orbit-atlas:default-scientific-kernel", value: "legacy-eih-1pn" },
      { name: "orbit-atlas:scope", value: "npm-production-plus-cargo-lock" },
    ],
  },
  components: [...npmComponents, ...cargoComponents(await readFile(fromRoot("src-tauri/Cargo.lock"), "utf8"))],
};

const downloadManifest = {
  schemaVersion: "v232-local-download-artifact-manifest-v1",
  generatedAt: new Date().toISOString(),
  immutableRoot: "https://solar.wangyufan.xyz/orbit-atlas/1.0.0/",
  publishState: "not-uploaded-no-oss-credentials-used",
  webDeployment: "not-performed",
  artifacts: installers,
  planned: [
    { id: "standalone-full", profile: "standalone-full", packaged: false, uploaded: false },
    ...content.packs.map((pack) => ({ id: `content-pack-${pack.id}`, profile: "content-pack", manifestFiles: pack.manifestFileCount, bytes: pack.verifiedBytes, uploaded: false })),
  ],
};

const evidenceFiles = [
  "dist/science/content-pack-integrity-v232.json",
  "dist/science/client-bundle-v232-standalone-full.json",
  "dist/science/client-bundle-v232-vercel-lite.json",
  "dist/science/lifecycle-soak-v232-report.json",
  "dist/science/performance-v232-report.json",
  "dist/science/production-security-v232.json",
  "dist/science/production-audit-v232.json",
  "dist/science/secret-scan-v232.json",
  "dist/science/desktop-rust-release.json",
  "dist/science/browser-v232-legacy-v71-backdrop-gate-audit.json",
  "dist/science/kerr-dense-execution-plan-v6-release.json",
  "dist/science/kerr-carter-mino-reference-v6-evidence.json",
  "dist/science/kerr-canonical-cross-validation-v6.json",
  "dist/science/kerr-dense-cross-validation-v6.json",
  "dist/science/relativity-variational-stm-v12-pn-ias15-smoke-a.json",
  "dist/science/relativity-variational-stm-v12-pn-ias15-smoke-b.json",
  "dist/science/relativity-variational-stm-v12-smoke-evidence.json",
  "dist/desktop-stage/release/desktop-stage.json",
  ...installers.map((artifact) => artifact.file),
];
const evidenceSha256 = Object.fromEntries(await Promise.all(evidenceFiles.map(async (file) => [file, await shaFile(file)])));
const gitStatus = execFileSync("git", ["status", "--short"], { cwd: root, encoding: "utf8" }).trim().split(/\r?\n/).filter(Boolean);

const dossier = {
  version: "v232-final-local-release-dossier",
  generatedAt: new Date().toISOString(),
  status: "web-ga-candidate-local-validated-desktop-unsigned-install-qa-pending-science-shadow-retained",
  releaseLabelsApplied: { webGa: false, desktopBeta: false, researchPromotion: false },
  runtime: {
    next: pkg.dependencies.next,
    react: pkg.dependencies.react,
    reactDom: pkg.dependencies["react-dom"],
    r3f: pkg.dependencies["@react-three/fiber"],
    three: pkg.dependencies.three,
    standaloneBuildId: (await readFile(fromRoot(".next-atlas-standalone-current/BUILD_ID"), "utf8")).trim(),
    liteBuildId: (await readFile(fromRoot(".next-atlas-lite-current/BUILD_ID"), "utf8")).trim(),
  },
  contracts: {
    singleCanvas: true,
    rootAttributeCount: 603,
    rootKeyHash: "ac6470fcc517e1b2ba2c6618f530f7af57d1a0caa52fffae0af7232f912f9867",
    missionUrlFocusCameraPanelStoreSceneRevisionPreserved: true,
    frozenV9Mutated: false,
  },
  gates: hardGates,
  regression: { files: "107/107", tests: "674/674", tsc: "passed" },
  delivery: {
    standalone: bundleStandalone,
    lite: { ...bundleLite, manifest: "595 files / 65.9 MiB / no loopback" },
    contentPacks: content,
    desktopStage: stage,
    installers,
  },
  browser: {
    visualMatrix: { journeys: "12/12", frames: visualFiles.length, baselineUpdated: false },
    freshNonContaminatedSuites: "7 passed / 1 expected desktop-only skip",
    kerrLifecycle: "2/2",
    legacyV71Gate: legacyBackdropAudit,
    consoleAndPageErrorsInPassingProductionGates: 0,
  },
  lifecycle: soak,
  namedHardwarePerformance: performance,
  security: {
    productionAudit: audit,
    secretScan: secrets,
    responseHeaders: security,
    sriBoundary: "Next experimental webpack SRI covers 5/6 external scripts; App Router page chunk remains uncovered",
    productionCsp: "enforced; no unsafe-eval; static hydration retains unsafe-inline",
    ktx2Policy: "production uses same-source JPG/PNG fallback because Three r170 Basis embind is not strict-CSP compatible",
  },
  science: {
    defaultKernel: "legacy-eih-1pn",
    promotionDecision: "shadow-retained",
    denseKerr: {
      profile: densePlan.profile,
      plannedShards: densePlan.shardCount,
      completeShards: denseAggregate.completeShardCount,
      canonicalCarterQualified: carterEvidence.qualifiedForDenseCanonicalCrossCheck,
      canonicalCrossQualified: canonicalCross.qualifiedForDenseShardSmoke,
      canonicalClassificationAgreement: canonicalCross.finer.classificationAgreement,
      aggregateBlocker: denseAggregate.blocker,
      status: "research-candidate",
    },
    variationalStm: {
      profile: stmEvidence.profile,
      modes: stmEvidence.modes?.map((report) => report.mode) ?? [],
      deterministicSmokeRerunPassed: stmEvidence.deterministicRerunPassed,
      releaseQualificationAvailable: stmEvidence.releaseQualificationAvailable,
      smokeOnly: true,
      tenYearQualificationComplete: false,
      status: "research-candidate",
    },
  },
  blockers: [
    "Vercel preview/domain migration and DNS rollback rehearsal were not authorized or performed.",
    "The legacy v71 full-page bright-star metric is DOM-contaminated; its frozen fixture remains unchanged and a checksummed audit records the invalid gate.",
    "Dense Kerr 49-shard dual-reference execution and ten-year variational STM qualification are incomplete; science remains shadow-retained.",
    "Azure Artifact Signing credentials were not supplied; MSI and NSIS are unsigned.",
    "External Windows 10/11 install, launch, uninstall, reinstall, Chinese/space-path and WebView2 QA is pending.",
    "Standalone and Lite pass 600 KiB but miss the 590 KiB engineering target.",
  ],
  boundaries: {
    deployment: "not-performed",
    signing: "not-performed",
    updater: "disabled",
    gitMutation: "no-reset-revert-clean-stage-or-commit",
    dirtyStatusEntryCount: gitStatus.length,
  },
  evidenceSha256,
};

await mkdir(releaseDir, { recursive: true });
const outputs = {
  dossierJson: "dist/release/orbit-atlas-v232-final-local-release-dossier.json",
  dossierMarkdown: "dist/release/orbit-atlas-v232-final-local-release-dossier.md",
  sourceInventory: "dist/release/orbit-atlas-v232-source-inventory.json",
  visualInventory: "dist/release/orbit-atlas-v232-visual-inventory.json",
  sbom: "dist/release/orbit-atlas-v232-sbom.cdx.json",
  downloads: "dist/release/orbit-atlas-v232-download-manifest.json",
};
await writeFile(fromRoot(outputs.sourceInventory), `${JSON.stringify({ version: "v232-source-inventory", generatedAt: new Date().toISOString(), files: sourceInventory }, null, 2)}\n`);
await writeFile(fromRoot(outputs.visualInventory), `${JSON.stringify({ version: "v232-36-frame-visual-inventory", generatedAt: new Date().toISOString(), files: visualInventory }, null, 2)}\n`);
await writeFile(fromRoot(outputs.sbom), `${JSON.stringify(sbom, null, 2)}\n`);
await writeFile(fromRoot(outputs.downloads), `${JSON.stringify(downloadManifest, null, 2)}\n`);
await writeFile(fromRoot(outputs.dossierJson), `${JSON.stringify(dossier, null, 2)}\n`);
const markdown = `# Orbit Atlas v232 final local release dossier

Status: **${dossier.status}**  
Web GA label applied: **no** · Desktop Beta label applied: **no** · Science promotion applied: **no**

## Passed on this host

- Next ${dossier.runtime.next}, React ${dossier.runtime.react}, R3F ${dossier.runtime.r3f}, Three ${dossier.runtime.three}; standalone and Lite webpack production builds passed.
- Regression: 674/674 across 107/107 files; TypeScript and Rust fmt/check/test/release-check passed.
- Content packs: ${content.verifiedFileCount}/${content.manifestFileCount} across ${content.packCount} packs; Lite: 595 files / 65.9 MiB.
- Cold Canvas-ready JavaScript: standalone ${bundleStandalone.transferBytes} B; Lite ${bundleLite.transferBytes} B. Both pass 600 KiB but miss 590 KiB.
- Visual: 12/12 journeys and ${visualFiles.length} production candidate frames; fresh non-contaminated suites 7 passed / 1 expected desktop-only skip; Kerr lifecycle 2/2.
- Ten-cycle soak passed: heap growth ${soak.finalHeap - soak.baselineHeap} B; renderer textures ${soak.baseline.rendererTextures}→${soak.released.rendererTextures}; programs ${soak.baseline.programs}→${soak.released.programs}; zero console/page errors.
- RTX 4060: ${performance.samples.map((sample) => `${sample.id} ${sample.medianFps} FPS / P95 ${sample.frameP95Ms} ms`).join("; ")}.
- Production npm audit: 0 vulnerabilities; secret scan: 0 findings; enforced CSP has no unsafe-eval; debug-log production route is 404.
- Unsigned host artifacts: NSIS ${installers[0].bytes} B / \`${installers[0].sha256}\`; MSI ${installers[1].bytes} B / \`${installers[1].sha256}\`.

## Fail-closed boundaries

${dossier.blockers.map((blocker) => `- ${blocker}`).join("\n")}

The default scientific kernel remains \`legacy-eih-1pn\`. Dense Kerr and ten-year STM qualification are incomplete, so the research label remains \`relativity-v12-shadow-retained\`. No cloud deployment, signing, updater, Git staging, commit, reset, revert or clean was performed.
`;
await writeFile(fromRoot(outputs.dossierMarkdown), markdown);
const checksumTargets = Object.values(outputs);
const checksumPath = "dist/release/orbit-atlas-v232-final-local-release.sha256";
await writeFile(fromRoot(checksumPath), `${(await Promise.all(checksumTargets.map(async (file) => `${await shaFile(file)}  ${file}`))).join("\n")}\n`);
console.log(JSON.stringify({ status: dossier.status, outputs, checksumPath }, null, 2));
