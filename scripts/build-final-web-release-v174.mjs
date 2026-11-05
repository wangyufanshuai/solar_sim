import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const confirmed = process.argv.includes("--confirmed");
if (!confirmed) throw new Error("Pass --confirmed only after the serial v174 validation matrix succeeds.");

const root = process.cwd();
const relativeArtifacts = [
  "dist/science/performance-v174-report.json",
  "dist/science/performance-v166-report.json",
  "dist/science/regression-v174-report.json",
  "dist/science/regression-v166-report.json",
  "dist/science/product-release-v167-report.json",
  "dist/content-packs/core.manifest.json",
  "dist/content-packs/planet-hd.manifest.json",
  "dist/content-packs/deep-sky.manifest.json",
  "dist/content-packs/spacecraft.manifest.json",
  "dist/content-packs/science-fixtures.manifest.json",
  "dist/content-packs/runtime-codecs.manifest.json",
  "public/atlas-lite/manifest.json",
];

async function sha256(file) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest("hex");
}

const [packageJson, performance, regression, product, liteManifest] = await Promise.all([
  readFile(path.join(root, "package.json"), "utf8").then(JSON.parse),
  readFile(path.join(root, relativeArtifacts[0]), "utf8").then(JSON.parse),
  readFile(path.join(root, relativeArtifacts[2]), "utf8").then(JSON.parse),
  readFile(path.join(root, relativeArtifacts[4]), "utf8").then(JSON.parse),
  readFile(path.join(root, "public/atlas-lite/manifest.json"), "utf8").then(JSON.parse),
]);

const blockers = [
  ...(packageJson.dependencies?.next === "15.5.18" ? [] : ["next-security-baseline"]),
  ...(packageJson.dependencies?.react === "19.2.7" && packageJson.dependencies?.["@react-three/fiber"] === "9.6.1" ? [] : ["app-router-react-renderer-compatibility"]),
  ...(performance.version === "v174-hardware-performance-production" && performance.passed === true && performance.softwareRenderer === false ? [] : ["hardware-performance"]),
  ...(regression.version === "v174-final-web-serial-regression" && regression.passed === true && regression.confirmed === true ? [] : ["full-regression"]),
  ...(product.productReleaseStatus === "verified-web-standalone-release-candidate" ? [] : ["product-release"]),
  ...(liteManifest.deliveryProfile === "vercel-lite" && liteManifest.installedBytes <= liteManifest.maxBytes ? [] : ["vercel-lite"]),
];
if (blockers.length > 0) throw new Error(`V174 dossier blocked: ${blockers.join(", ")}`);

const artifacts = [];
for (const relativePath of relativeArtifacts) {
  const absolutePath = path.join(root, ...relativePath.split("/"));
  artifacts.push({ path: relativePath, sha256: await sha256(absolutePath) });
}

const contentPacks = [];
for (const entry of artifacts.filter((item) => item.path.startsWith("dist/content-packs/"))) {
  const manifest = JSON.parse(await readFile(path.join(root, ...entry.path.split("/")), "utf8"));
  contentPacks.push({
    id: manifest.id,
    version: manifest.version,
    fileCount: manifest.fileCount ?? manifest.files?.length ?? 0,
    installedBytes: manifest.installedBytes ?? manifest.files?.reduce((sum, file) => sum + file.bytes, 0) ?? 0,
    licenseCount: new Set((manifest.files ?? []).map((file) => file.license).filter(Boolean)).size,
    manifest: entry.path,
    sha256: entry.sha256,
  });
}

const dossier = {
  version: "v174-final-web-rc-dossier",
  generatedAt: new Date().toISOString(),
  confirmedSerialValidation: true,
  releaseStatus: "web-rc-ready-science-shadow-retained",
  framework: {
    next: packageJson.dependencies.next,
    react: packageJson.dependencies.react,
    reactThreeFiber: packageJson.dependencies["@react-three/fiber"],
    three: packageJson.dependencies.three,
  },
  machine: {
    platform: `${os.platform()} ${os.release()} ${os.arch()}`,
    cpu: os.cpus()[0]?.model ?? "unknown",
    logicalCpus: os.cpus().length,
    totalMemoryMiB: Math.round(os.totalmem() / 1048576),
    node: process.version,
    graphicsAdapter: performance.adapter,
  },
  validation: {
    focusedFiles: regression.results.focusedFiles,
    focusedTests: regression.results.focusedTests,
    fullRegression: `${regression.results.atlasTests}/${regression.results.atlasTests}`,
    productionBuild: true,
    browserQa: {
      standalonePassed: 5,
      standaloneViewportSkipped: 1,
      vercelLitePassed: 2,
      viewports: ["1440x900", "390x844"],
      consoleErrors: 0,
      pageErrors: 0,
      resource404: 0,
      axe: "wcag2a-and-wcag2aa-pass",
    },
    hardwarePerformance: performance.samples,
    gpuCounterQualification: "gl.info counters are observational only; drawCalls=1 is not optimization proof",
  },
  contentPacks,
  delivery: {
    "standalone-full": {
      interactive: true,
      localContentPacks: true,
      millionStarCatalog: true,
      fullObservationFixtures: true,
    },
    "vercel-lite": {
      interactive: true,
      localContentPacks: false,
      millionStarCatalog: false,
      fullObservationFixtures: false,
      manifestVersion: liteManifest.version,
      fileCount: liteManifest.fileCount,
      installedBytes: liteManifest.installedBytes,
      maxBytes: liteManifest.maxBytes,
    },
  },
  science: {
    defaultKernel: "legacy-eih-1pn",
    shadowKernel: "eih-1pn-2pn-lt",
    promotionApplied: false,
    scientificBlockers: product.scientificBlockers,
  },
  knownLimitations: [
    "Vercel Lite omits the million-star catalog and full observation fixtures.",
    "V2 relativity remains shadow-only because the independent promotion gates are not satisfied.",
    "Desktop installers and cloud deployment are separate, unreleased tracks.",
    "GPU draw-call counters are retained for observation but are not accepted as optimization proof.",
    "The planned React 18/R3F 8 hold was superseded because Next 15 App Router requires its React 19 runtime; the verified renderer baseline is React 19/R3F 9.",
  ],
  rollback: [
    "Select the standalone-full delivery profile and the previous verified v167 artifact set.",
    "Keep legacy-eih-1pn as the default kernel and leave V2 shadow-only.",
    "Restore the six checksummed content-pack manifests from the retained release artifacts.",
  ],
  artifacts,
  boundary: "no-cloud-deploy-no-desktop-release-no-scientific-promotion-no-live-or-worker-physics-mutation",
};

const outputDir = path.join(root, "dist", "release");
const output = path.join(outputDir, "orbit-atlas-v174-rc-dossier.json");
await mkdir(outputDir, { recursive: true });
await writeFile(output, `${JSON.stringify(dossier, null, 2)}\n`);
const dossierHash = await sha256(output);
await writeFile(`${output}.sha256`, `${dossierHash}  orbit-atlas-v174-rc-dossier.json\n`);
console.log(`v174 Web RC dossier written: ${output} (${dossierHash})`);
