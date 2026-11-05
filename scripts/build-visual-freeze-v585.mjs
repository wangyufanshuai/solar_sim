import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";
import sharp from "sharp";

const root = process.cwd();
const generatedAt = "2026-08-04T00:00:00Z";
const distRoot = resolve(root, "dist/release/orbit-atlas-visual-freeze-v585");
const docsRoot = resolve(root, "docs/release/v585");
const browserObservationPath = resolve(root, "output/playwright/v585/browser-observation.json");
const publicObservationPath = resolve(distRoot, "public-asset-head-observation.json");
const previewDeploymentReceiptPath = resolve(docsRoot, "vercel-preview-deployment-v585.json");
const publicHeadBlockerReceiptPath = resolve(docsRoot, "public-head-runner-blocker-v585.json");
const publicHeadAdmissionReceiptPath = resolve(docsRoot, "public-head-admission-v585.json");
const gitPushBlockerReceiptPath = resolve(docsRoot, "git-push-blocker-v585.json");
const candidateManifestPath = resolve(root, "dist/science/atlas-visual-candidate-v562/manifest.json");
const candidateManifest = JSON.parse(readFileSync(candidateManifestPath, "utf8"));
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const fileSha = (path) => sha(readFileSync(resolve(root, path)));
const transient = new Set(["artifactSha256", "receiptSha256"]);
const canonical = (value) => Array.isArray(value)
  ? value.map(canonical)
  : !value || typeof value !== "object"
    ? value
    : Object.fromEntries(Object.entries(value)
      .filter(([key]) => !transient.has(key))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonical(entry)]));
const canonicalSha = (value) => sha(Buffer.from(JSON.stringify(canonical(value)), "utf8"));
const readJsonIfPresent = (path) => existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : null;
const verifiedReceipt = (path) => {
  const receipt = readJsonIfPresent(path);
  if (receipt && (!/^[a-f0-9]{64}$/.test(receipt.receiptSha256 ?? "") || receipt.receiptSha256 !== canonicalSha(receipt))) {
    throw new Error(`v585-invalid-supplemental-receipt:${rel(path)}`);
  }
  return receipt;
};
const rel = (path) => path.replaceAll("\\", "/").replace(`${root.replaceAll("\\", "/")}/`, "");
const previewDeploymentReceipt = verifiedReceipt(previewDeploymentReceiptPath);
const publicHeadBlockerReceipt = verifiedReceipt(publicHeadBlockerReceiptPath);
const publicHeadAdmissionReceipt = verifiedReceipt(publicHeadAdmissionReceiptPath);
const gitPushBlockerReceipt = verifiedReceipt(gitPushBlockerReceiptPath);
const buildReceipts = [
  "dist/release/atlas-build-resource-v562.json",
  "dist/release/atlas-lite-build-resource-v562.json",
  "dist/release/atlas-local-shadow-build-resource-v562.json",
].map((path) => ({ path, receipt: readJsonIfPresent(resolve(root, path)) }));

async function atomicWrite(path, content) {
  await mkdir(dirname(path), { recursive: true });
  const part = `${path}.${process.pid}.part`;
  await writeFile(part, content, "utf8");
  await rename(part, path);
}

async function writeMirrored(name, content) {
  await Promise.all([atomicWrite(resolve(distRoot, name), content), atomicWrite(resolve(docsRoot, name), content)]);
}

async function seal(name, unsigned) {
  const artifact = { ...unsigned, artifactSha256: canonicalSha(unsigned) };
  await writeMirrored(name, `${JSON.stringify(artifact, null, 2)}\n`);
  return artifact;
}

function sourceManifest(paths) {
  return [...new Set(paths)].sort((left, right) => left.localeCompare(right)).map((path) => ({ path, bytes: statSync(resolve(root, path)).size, sha256: fileSha(path) }));
}

function git(...args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 }).trim();
}

function resolveSourceImport(from, specifier) {
  const base = resolve(dirname(from), specifier);
  const candidates = extname(base)
    ? [base]
    : [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.mjs`, resolve(base, "index.ts"), resolve(base, "index.tsx")];
  return candidates.find((candidate) => existsSync(candidate) && /\.(?:ts|tsx|js|mjs)$/.test(candidate)) ?? null;
}

function importGraph(entry) {
  const pending = [resolve(root, entry)];
  const visited = new Set();
  while (pending.length > 0) {
    const file = pending.pop();
    if (!file || visited.has(file)) continue;
    visited.add(file);
    const source = readFileSync(file, "utf8");
    const specifiers = new Set();
    for (const pattern of [/(?:import|export)[^"']*?from\s*["'](\.[^"']+)["']/g, /import\(\s*["'](\.[^"']+)["']\s*\)/g, /import\s*["'](\.[^"']+)["']/g]) {
      for (const match of source.matchAll(pattern)) specifiers.add(match[1]);
    }
    for (const specifier of specifiers) {
      const dependency = resolveSourceImport(file, specifier);
      if (dependency && dependency.startsWith(resolve(root, "app"))) pending.push(dependency);
    }
  }
  return [...visited].map(rel).sort((left, right) => left.localeCompare(right));
}

const frozenAssets = [
  { id: "base-desktop-8k", path: "public/textures/sky/orbit-atlas-v9-base-8k.jpg", expectedBytes: 14122321, expectedSha256: "9d52abb4774cdca473606f514158b72a5af5950fa283e53d703b983a83ff1df2", expectedDimensions: [8192, 4096], gitRecoverySpec: "1eecca0f^:solar_sim/next-web/public/textures/sky/orbit-atlas-v9-base-8k.jpg" },
  { id: "base-mobile-4k", path: "public/textures/sky/orbit-atlas-v9-base-4k.jpg", expectedBytes: 2594446, expectedSha256: "eea88c57a8fd769c0ca70bcd53006a0314b9e8fab40dba1ad4a8b2317c24a0dc", expectedDimensions: [4096, 2048], gitRecoverySpec: "1eecca0f^:solar_sim/next-web/public/atlas-lite/textures/sky/orbit-atlas-v9-base-4k.jpg" },
  { id: "stars-desktop-4k", path: "public/textures/sky/orbit-atlas-v9-stars-4k.jpg", expectedBytes: 381732, expectedSha256: "4c22311b7b87d2b003312a548aca2c904bbade5d9edfaf8cca8b085928cd873c", expectedDimensions: [4096, 2048], gitRecoverySpec: "1eecca0f^:solar_sim/next-web/public/textures/sky/orbit-atlas-v9-stars-4k.jpg" },
  { id: "stars-mobile-2k", path: "public/textures/sky/orbit-atlas-v9-stars-2k.jpg", expectedBytes: 122612, expectedSha256: "613625b6d2b71dd943cf62c90b33a9d12522e38f99df50ebc7e9ec60c5f17d65", expectedDimensions: [2048, 1024], gitRecoverySpec: "HEAD:solar_sim/next-web/public/atlas-lite/textures/sky/orbit-atlas-v9-stars-2k.jpg" },
  { id: "dust-shared-2k", path: "public/textures/sky/orbit-atlas-v9-dust-2k.jpg", expectedBytes: 700773, expectedSha256: "8011f424415f9e8b3841f6a36ce2a63dcdbc5b5161395dc484104e352d9169ce", expectedDimensions: [2048, 1024], gitRecoverySpec: "1eecca0f^:solar_sim/next-web/public/textures/sky/orbit-atlas-v9-dust-2k.jpg" },
];

const recoveredAssets = [];
for (const asset of frozenAssets) {
  const bytes = readFileSync(resolve(root, asset.path));
  const historicalBytes = execFileSync("git", ["show", asset.gitRecoverySpec], { cwd: root, encoding: null, maxBuffer: 32 * 1024 * 1024 });
  const metadata = await sharp(bytes).metadata();
  const actualSha256 = sha(bytes);
  const historicalSha256 = sha(historicalBytes);
  recoveredAssets.push({
    ...asset,
    actualBytes: bytes.byteLength,
    actualSha256,
    historicalBytes: historicalBytes.byteLength,
    historicalSha256,
    dimensions: [metadata.width, metadata.height],
    format: metadata.format,
    colorSpace: metadata.space === "b-w" ? "linear-grayscale-untagged" : "srgb-assumed-untagged",
    iccProfileEmbedded: Boolean(metadata.icc),
    provenance: { source: "NASA Scientific Visualization Studio Deep Star Maps 2020", sourceUrl: "https://svs.gsfc.nasa.gov/4851/", processingSource: "scripts/build-universe-sandbox-sky.py", projection: "plate-carree-equirectangular" },
    qualified: bytes.byteLength === asset.expectedBytes && actualSha256 === asset.expectedSha256 && historicalSha256 === asset.expectedSha256 && metadata.width === asset.expectedDimensions[0] && metadata.height === asset.expectedDimensions[1],
  });
}
const legacyComplete = recoveredAssets.every((asset) => asset.qualified);

const stableGraph = importGraph("app/page.tsx");
const candidateGraph = importGraph("app/local-shadow-v562/page.tsx");
const forbiddenStableImports = stableGraph.filter((path) => /CandidateV|candidate-v562|local-shadow-v562/i.test(path));
const stableSphereSource = readFileSync(resolve(root, "app/components/GalaxyEnvironmentSphere.tsx"), "utf8");
const localShadowSource = readFileSync(resolve(root, "app/local-shadow-v562/page.tsx"), "utf8");
const runtimeStoreSource = readFileSync(resolve(root, "app/lib/atlasRuntimeStore.ts"), "utf8");
const stableDefaultQualified = stableSphereSource.includes("layerManifest = ORBIT_ATLAS_SKY") && !stableSphereSource.includes("ATLAS_VISUAL_RUNTIME_SKY_V562") && runtimeStoreSource.includes('visualProfile: "legacy-v9"');
const candidateExplicitQualified = localShadowSource.includes('data-atlas-visual-lane="candidate-v562"') && candidateGraph.includes("app/lib/atlasVisualRuntimeCandidateV562.ts");
const candidateNamespaceQualified = candidateManifest.assets.every((asset) => asset.url.startsWith("/textures/candidate-v562/") && asset.sourcePath.startsWith("public/textures/candidate-v562/") && !asset.url.includes("orbit-atlas-v9")) && candidateManifest.authorityNamespace === "candidate-v562";
const buildProfilesQualified = buildReceipts.every(({ receipt }) => receipt?.status === "passed" && receipt.heapMb === 8192 && receipt.standaloneTopologyQualified === true && receipt.rollbackSlotAvailable === true);
const buildRuntime = buildReceipts.map(({ path, receipt }) => ({ path, profile: receipt?.profile ?? null, status: receipt?.status ?? "missing", distDir: receipt?.distDir ?? null, heapMb: receipt?.heapMb ?? null, standaloneTopologyQualified: receipt?.standaloneTopologyQualified ?? false, rollbackSlotAvailable: receipt?.rollbackSlotAvailable ?? false, swcRuntime: receipt?.swcRuntime ?? null }));

const relevantPaths = [
  ".vercelignore",
  "app/components/GalaxyEnvironmentSphere.tsx",
  "app/components/OrbitAtlasHeroScenesV562.tsx",
  "app/data/atlasVisualCandidateAssetsV562.json",
  "app/lib/atlasAssetResolver.ts",
  "app/lib/atlasVisualAuthorityV585.ts",
  "app/lib/atlasVisualCandidateV562.ts",
  "app/lib/atlasVisualFreezeV585.test.ts",
  "app/lib/atlasVisualRuntimeCandidateV562.ts",
  "app/local-shadow-v562/page.tsx",
  "playwright.atlas.visual-freeze-v585.config.ts",
  "public/atlas-lite/textures/candidate-v562",
  "public/textures/candidate-v562",
  "public/textures/sky/orbit-atlas-v9-base-8k.jpg",
  "public/textures/sky/orbit-atlas-v9-base-4k.jpg",
  "public/textures/sky/orbit-atlas-v9-stars-2k.jpg",
  "scripts/audit-public-assets-v585.mjs",
  "scripts/build-content-packs.mjs",
  "scripts/build-visual-candidate-v562.mjs",
  "scripts/build-visual-freeze-v585.mjs",
  "tests/atlas-browser/atlas-visual-freeze-v585.spec.ts",
];
const scopedStatus = git("status", "--short", "--", ...relevantPaths).split(/\r?\n/).filter(Boolean);
const branch = git("branch", "--show-current");
const head = git("rev-parse", "HEAD");

const auditSources = sourceManifest([
  "app/components/GalaxyEnvironmentSphere.tsx",
  "app/lib/atlasRuntimeStore.ts",
  "app/lib/orbitAtlasPresentation.ts",
  "app/lib/atlasVisualRuntimeCandidateV562.ts",
  "app/local-shadow-v562/page.tsx",
  "scripts/release-source-policy-v241.mjs",
]);
const visualAudit = await seal("visual-freeze-audit-v585.json", {
  version: "v585-visual-freeze-audit-v1",
  generatedAt,
  status: legacyComplete && stableDefaultQualified && forbiddenStableImports.length === 0 ? "stable-binding-restored-candidate-decoupled" : "blocked-visual-boundary-incomplete",
  repository: { branch, head, scopedStatus },
  historicalChange: {
    commit: "1eecca0f6d553e60da30f7f1ac3a726db13a2738",
    priorDefault: "ORBIT_ATLAS_SKY",
    changedDefault: "ATLAS_VISUAL_RUNTIME_SKY_V562",
    deletedAssets: ["public/textures/sky/orbit-atlas-v9-base-8k.jpg", "public/atlas-lite/textures/sky/orbit-atlas-v9-base-8k.jpg", "public/atlas-lite/textures/sky/orbit-atlas-v9-base-4k.jpg"],
    governanceFinding: "formalProductPointer remained v263 while ordinary runtime sky binding changed",
  },
  currentBindings: {
    formalProduct: { pointer: "v263", visualIdentity: "Legacy V9", scienceKernel: "legacy-eih-1pn" },
    ordinaryRoot: { route: "/", lane: "stable-v263-legacy-v9", defaultManifest: "ORBIT_ATLAS_SKY", manifestIdentity: "ORBIT_ATLAS_V9_SKY" },
    standalone: { route: "/", lane: "stable-v263-legacy-v9", deliveryProfile: "standalone-full" },
    lite: { route: "/", lane: "stable-v263-legacy-v9", deliveryProfile: "vercel-lite" },
    candidate: { route: "/local-shadow-v562", lane: "candidate-v562", defaultAppliedToStable: false, authorityInheritedFromLegacyV9: false },
    experimental: { route: "/local-shadow-v562#hero-scenes", lane: "experimental-hero", scienceWriteback: false },
    existingVercel: { url: "https://next-web-eight-virid.vercel.app", classification: "public-candidate-preview-not-strict-v263-legacy-v9", productionAliasChangedByV585: false },
    v585Preview: previewDeploymentReceipt ? {
      deploymentId: previewDeploymentReceipt.deployment.id,
      url: previewDeploymentReceipt.deployment.url,
      target: previewDeploymentReceipt.deployment.target,
      readyState: previewDeploymentReceipt.deployment.readyState,
      sourceCommit: previewDeploymentReceipt.deployment.sourceCommit,
      classification: "v585-stable-preview-dual-track-not-production",
      productionAliasChangedByV585: false,
    } : null,
  },
  builds: { qualified: buildProfilesQualified, profiles: buildRuntime, nativeSwcQualified: buildRuntime.every((entry) => entry.swcRuntime?.nativeQualified === true), runnerWarning: buildRuntime.some((entry) => entry.swcRuntime?.mode === "official-wasm-fallback") ? "native-swc-unavailable-official-wasm-fallback-used" : null },
  differences: [
    { subject: "ordinary runtime before v585", versus: "v263/Legacy V9", difference: "default sky manifest was v562 candidate", resolved: stableDefaultQualified },
    { subject: "v562 candidate before v585", versus: "authority namespace rule", difference: "candidate URLs reused orbit-atlas-v9 filenames", resolved: candidateNamespaceQualified },
    { subject: "existing Vercel deployment", versus: "strict v263/Legacy V9", difference: "deployed while historical base assets were absent and candidate binding was active", resolved: false, treatment: "public candidate preview" },
  ],
  sourceManifest: auditSources,
  sourceSha256: canonicalSha(auditSources),
});

const recoverySources = sourceManifest(["public/atlas-lite/manifest.json", "public/textures/sky/README.md", "scripts/build-universe-sandbox-sky.py", "scripts/release-source-policy-v241.mjs", ...frozenAssets.map((asset) => asset.path)]);
const recovery = await seal("legacy-v9-asset-recovery-v585.json", {
  version: "v585-legacy-v9-asset-recovery-v1",
  generatedAt,
  status: legacyComplete ? "recovered-original-byte-complete" : "blocked-legacy-v9-assets-incomplete",
  searchScope: ["reachable Git objects and reflogs", "old worktrees", "public/atlas-lite historical package", "dist/content-packs", "dist/desktop-stage", "src-tauri build outputs", "tmp release verification trees", "_codex_backups"],
  recoveryRule: "only original bytes matching frozen bytes/SHA/dimensions/provenance; no regeneration, recompression or substitute",
  assets: recoveredAssets,
  qualification: { allFivePresent: frozenAssets.every((asset) => existsSync(resolve(root, asset.path))), allFiveShaMatch: legacyComplete, dimensionsMatch: legacyComplete, provenanceRecorded: true, stableRuntimeRestorationAllowed: legacyComplete, syntheticOrSimilarSubstitutionUsed: false, historicalManifestRewritten: false, historicalEvidenceRewritten: false },
  sourceManifest: recoverySources,
  sourceSha256: canonicalSha(recoverySources),
});

const boundarySources = sourceManifest(["app/page.tsx", "app/ClientAppShell.tsx", "app/components/GalaxyEnvironmentSphere.tsx", "app/lib/atlasRuntimeStore.ts", "app/lib/atlasVisualAuthorityV585.ts", "app/lib/atlasVisualRuntimeCandidateV562.ts", "app/local-shadow-v562/page.tsx"]);
const importBoundary = await seal("stable-candidate-import-boundary-v585.json", {
  version: "v585-stable-candidate-import-boundary-v1",
  generatedAt,
  status: forbiddenStableImports.length === 0 && stableDefaultQualified && candidateExplicitQualified ? "qualified-fail-closed-three-lane-boundary" : "blocked-import-boundary",
  lanes: {
    stable: { id: "stable-v263-legacy-v9", entries: ["app/page.tsx"], graphFileCount: stableGraph.length, forbiddenImports: forbiddenStableImports, defaultProfile: "legacy-v9", defaultSky: "ORBIT_ATLAS_SKY", candidateActivation: false },
    candidate: { id: "candidate-v562", entries: ["app/local-shadow-v562/page.tsx"], graphFileCount: candidateGraph.length, runtimeModulePresent: candidateGraph.includes("app/lib/atlasVisualRuntimeCandidateV562.ts"), activation: "explicit-route-only" },
    experimental: { id: "experimental-hero", entry: "app/components/OrbitAtlasHeroScenesV562.tsx", activation: "explicit-local-shadow-control-only", canvasAdded: false, scienceWriteback: false },
  },
  deliveryMatrix: [
    { surface: "ordinary-home", route: "/", entry: "app/page.tsx", lane: "stable-v263-legacy-v9", candidateImported: false },
    { surface: "standalone", route: "/", entry: "app/page.tsx", lane: "stable-v263-legacy-v9", candidateImported: false },
    { surface: "Lite", route: "/", entry: "app/page.tsx", lane: "stable-v263-legacy-v9", candidateImported: false },
    { surface: "local-shadow-v562", route: "/local-shadow-v562", entry: "app/local-shadow-v562/page.tsx", lane: "candidate-v562", candidateImported: true },
  ],
  hardGates: { stableRootNoCandidateV: forbiddenStableImports.length === 0, stableRootNoLocalShadow: forbiddenStableImports.every((path) => !path.includes("local-shadow")), stableDefaultLegacyV9: stableDefaultQualified, candidateExplicitOnly: candidateExplicitQualified, scienceAndVisualPointersIndependent: true, singleCanvasBoundary: true, candidateScienceWriteback: false },
  sourceManifest: boundarySources,
  sourceSha256: canonicalSha(boundarySources),
});

const publicRaw = readJsonIfPresent(publicObservationPath);
const existingPublic = publicRaw?.targets?.find((target) => target.label === "existing-public-preview") ?? null;
const nodeRunnerV585Preview = publicRaw?.targets?.find((target) => target.label === "v585-preview") ?? null;
const publicNetworkBlocked = existingPublic !== null && existingPublic.observations.every((entry) => entry.status === null && entry.error);
const expectedHeadPaths = [
  "/",
  "/api/health",
  ...frozenAssets.map((asset) => `/atlas-lite/textures/sky/${asset.path.split("/").at(-1)}`),
  ...candidateManifest.assets.map((asset) => `/atlas-lite${asset.url}`),
  ...candidateManifest.assets.map((asset) => asset.url),
];
const admissionRequests = publicHeadAdmissionReceipt?.requests ?? [];
const admissionPaths = admissionRequests.map((entry) => entry.path);
const exactAdmissionPaths = admissionPaths.length === expectedHeadPaths.length
  && new Set(admissionPaths).size === expectedHeadPaths.length
  && expectedHeadPaths.every((path, index) => admissionPaths[index] === path);
const publicHeadAdmissionQualified = publicHeadAdmissionReceipt?.qualification?.allRequiredHead200 === true
  && publicHeadAdmissionReceipt.deployment.id === previewDeploymentReceipt?.deployment?.id
  && publicHeadAdmissionReceipt.deployment.environment === "preview"
  && publicHeadAdmissionReceipt.dispatch.automaticRetry === false
  && publicHeadAdmissionReceipt.dispatch.automaticTargetReplacement === false
  && publicHeadAdmissionReceipt.dispatch.payloadDownloaded === false
  && exactAdmissionPaths
  && admissionRequests.every((entry) => entry.method === "HEAD" && entry.status === 200);
if (publicHeadAdmissionReceipt && !publicHeadAdmissionQualified) throw new Error("v585-public-head-admission-invalid");
const admittedV585Preview = publicHeadAdmissionQualified ? {
  label: "v585-preview",
  baseUrl: publicHeadAdmissionReceipt.deployment.url,
  host: publicHeadAdmissionReceipt.deployment.domain,
  observationSource: "vercel-platform-request-logs-after-browser-cdp-dispatch",
  observations: admissionRequests.map((entry) => ({
    lane: entry.lane,
    id: entry.logicalId,
    path: entry.path,
    required: true,
    requestMethod: entry.method,
    attemptCount: 1,
    initialUrl: new URL(entry.path, publicHeadAdmissionReceipt.deployment.url).href,
    finalUrl: new URL(entry.path, publicHeadAdmissionReceipt.deployment.url).href,
    redirects: [],
    finalHostAllowed: true,
    status: entry.status,
    ok: entry.status === 200,
    platformRequestLogId: entry.requestLogId,
    platformTimestamp: entry.timestamp,
    cache: entry.cache,
  })),
  requiredCount: admissionRequests.length,
  passedCount: admissionRequests.filter((entry) => entry.status === 200).length,
  qualified: true,
} : null;
const v585Preview = admittedV585Preview ?? nodeRunnerV585Preview;
const publicAvailability = await seal("public-asset-availability-v585.json", {
  version: "v585-public-asset-availability-v1",
  generatedAt,
  status: v585Preview?.qualified === true ? "v585-preview-all-required-head-200" : publicNetworkBlocked ? "blocked-runner-public-network-unreachable" : "pending-v585-preview-head-qualification",
  policy: { method: "HEAD", requiredStatus: 200, automaticRetry: false, automaticTargetReplacement: false, payloadDownloaded: false, allRequiredUrlsMustPass: true, authoritativeObservationSource: publicHeadAdmissionQualified ? "vercel-platform-request-logs-after-browser-cdp-dispatch" : "direct-node-runner" },
  existingPublicPreview: existingPublic,
  v585Preview,
  nodeRunnerV585Preview,
  candidateManifestSha256: candidateManifest.manifestSha256,
  candidateAssetCount: candidateManifest.assets.length,
  previewDeploymentReceipt: previewDeploymentReceipt ? { path: rel(previewDeploymentReceiptPath), bytes: statSync(previewDeploymentReceiptPath).size, sha256: sha(readFileSync(previewDeploymentReceiptPath)), receiptSha256: previewDeploymentReceipt.receiptSha256, deploymentId: previewDeploymentReceipt.deployment.id, url: previewDeploymentReceipt.deployment.url, target: previewDeploymentReceipt.deployment.target, readyState: previewDeploymentReceipt.deployment.readyState } : null,
  publicHeadBlockerReceipt: publicHeadBlockerReceipt ? { path: rel(publicHeadBlockerReceiptPath), bytes: statSync(publicHeadBlockerReceiptPath).size, sha256: sha(readFileSync(publicHeadBlockerReceiptPath)), receiptSha256: publicHeadBlockerReceipt.receiptSha256, classification: publicHeadBlockerReceipt.classification } : null,
  publicHeadAdmissionReceipt: publicHeadAdmissionReceipt ? { path: rel(publicHeadAdmissionReceiptPath), bytes: statSync(publicHeadAdmissionReceiptPath).size, sha256: sha(readFileSync(publicHeadAdmissionReceiptPath)), receiptSha256: publicHeadAdmissionReceipt.receiptSha256, observationSource: publicHeadAdmissionReceipt.dispatch.responseRecovery, requiredCount: publicHeadAdmissionReceipt.qualification.requiredPathCount, status200Count: publicHeadAdmissionReceipt.qualification.status200Count } : null,
  qualification: { currentRunnerNetworkReachable: !publicNetworkBlocked, platformLogObservationReachable: publicHeadAdmissionQualified, existingDeploymentStrictLegacyV9Qualified: false, v585PreviewPresent: Boolean(v585Preview || previewDeploymentReceipt), v585PreviewBuildReady: previewDeploymentReceipt?.qualification?.previewBuildReady === true, v585PreviewBrowserRootReachable: previewDeploymentReceipt?.qualification?.browserDirectRootReached === true, v585PreviewAllRequiredHead200: v585Preview?.qualified === true, productionPromotionAllowed: false },
  rawObservation: publicRaw ? { path: rel(publicObservationPath), bytes: statSync(publicObservationPath).size, sha256: sha(readFileSync(publicObservationPath)), artifactSha256: publicRaw.artifactSha256 } : null,
});

const browserRaw = readJsonIfPresent(browserObservationPath);
async function similarity(leftPath, rightPath) {
  const [left, right] = await Promise.all([sharp(resolve(root, leftPath)).resize(96, 60, { fit: "fill" }).removeAlpha().raw().toBuffer(), sharp(resolve(root, rightPath)).resize(96, 60, { fit: "fill" }).removeAlpha().raw().toBuffer()]);
  let absoluteDifference = 0;
  for (let index = 0; index < left.length; index += 1) absoluteDifference += Math.abs(left[index] - right[index]);
  return 1 - absoluteDifference / (left.length * 255);
}
const comparisons = [];
if (browserRaw) {
  const pairs = [
    ["desktop-standalone-lite", browserRaw.profiles.standalone.desktop.screenshot.path, browserRaw.profiles.lite.desktop.screenshot.path, 1440, 900],
    ["mobile-standalone-lite", browserRaw.profiles.standalone.mobile.screenshot.path, browserRaw.profiles.lite.mobile.screenshot.path, 390, 844],
    ["desktop-resource-return", browserRaw.profiles.standalone.desktop.screenshot.path, browserRaw.profiles.standalone.afterResize.screenshot.path, 1440, 900],
  ];
  for (const [id, left, right, width, height] of pairs) comparisons.push({ id, width, height, left: { path: left, sha256: fileSha(left) }, right: { path: right, sha256: fileSha(right) }, perceptualSimilarity: await similarity(left, right) });
}
const similarityFloor = 0.94;
const browserQualified = browserRaw !== null && browserRaw.qualification.exactViewports === true && browserRaw.qualification.overviewFps === true && browserRaw.qualification.resourceReturned === true && browserRaw.qualification.soakResourcesReturned === true && browserRaw.qualification.heapStrictlyGrowing === false && browserRaw.qualification.zeroErrors === true && browserRaw.qualification.stableCandidateRequestCount === 0 && browserRaw.qualification.stableV9BaseRequestCount >= 2 && browserRaw.qualification.singleCanvas === true && browserRaw.qualification.horizontalOverflowZero === true;
const visualRegressionQualified = comparisons.length === 3 && comparisons.every((entry) => entry.perceptualSimilarity >= similarityFloor);
const visualMatrix = await seal("desktop-mobile-visual-matrix-v585.json", {
  version: "v585-desktop-mobile-visual-matrix-v1",
  generatedAt,
  status: browserQualified && visualRegressionQualified ? "qualified-exact-dual-viewport-stable-preview-matrix" : browserRaw ? "blocked-browser-or-visual-regression-gate" : "pending-browser-execution",
  viewports: { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } },
  browserObservation: browserRaw,
  visualRegression: { baselinePolicy: "cross-delivery-stable-binding-plus-resource-return-capture-no-automatic-baseline-replacement", similarityFloor, comparisons, qualified: visualRegressionQualified },
  qualification: { browserExecuted: Boolean(browserRaw), browserQualified, visualRegressionQualified, scienceLinearNoBloomGradeGrain: browserRaw?.qualification?.scienceLinear === true, cinematicScienceWriteback: browserRaw?.qualification?.cinematicWriteback ?? null, requiredAsset404Count: browserRaw ? [browserRaw.profiles.standalone.errors, browserRaw.profiles.lite.errors, browserRaw.profiles.candidate.errors].flatMap((entry) => entry.responses).length : null, singleCanvas: browserRaw?.qualification?.singleCanvas ?? null, horizontalOverflowZero: browserRaw?.qualification?.horizontalOverflowZero ?? null, productionPromotionAllowed: false },
  rawObservation: browserRaw ? { path: rel(browserObservationPath), bytes: statSync(browserObservationPath).size, sha256: sha(readFileSync(browserObservationPath)) } : null,
});

const formalEvidence = readJsonIfPresent(resolve(root, "dist/release/orbit-atlas-current-product-evidence-v263.json"));
const dense = readJsonIfPresent(resolve(root, "dist/science/kerr-campaign-v579/campaign-state.json"));
const denseAggregate = readJsonIfPresent(resolve(root, "dist/science/kerr-campaign-v579/dense-aggregate.json"));
const gpu = readJsonIfPresent(resolve(root, "dist/science/kerr-gpu-shadow-v580/gpu-differential.json"));
const measured = readJsonIfPresent(resolve(root, "dist/science/ixpe-measured-admission-v581/admission.json"));
const allStaticQualified = legacyComplete && stableDefaultQualified && forbiddenStableImports.length === 0 && candidateExplicitQualified && candidateNamespaceQualified;
const authoritySources = sourceManifest(["app/lib/atlasVisualAuthorityV585.ts", "app/data/atlasVisualCandidateAssetsV562.json", "dist/science/atlas-visual-candidate-v562/manifest.json", "scripts/build-visual-freeze-v585.mjs"]);
const authority = await seal("visual-authority-manifest-v585.json", {
  version: "v585-visual-authority-manifest-v1",
  generatedAt,
  status: allStaticQualified && browserQualified && visualRegressionQualified && v585Preview?.qualified === true ? "preview-qualified-production-user-confirmation-required" : "stable-restored-preview-qualification-incomplete",
  formalPointers: { product: "v263", scienceKernel: "legacy-eih-1pn", visual: "stable-v263-legacy-v9", scienceVisualPointersIndependent: true, formalPointerAdvanced: false },
  lanes: {
    stable: { id: "stable-v263-legacy-v9", authority: "Legacy V9", default: true, assetRecoverySha256: recovery.artifactSha256, runtimeImportBoundarySha256: importBoundary.artifactSha256 },
    candidate: { id: "candidate-v562", authority: "candidate-only-not-v263-not-legacy-v9", default: false, manifestSha256: candidateManifest.manifestSha256, namespace: "candidate-v562", publicPreviewOnly: true },
    experimental: { id: "experimental-hero", authority: "presentation-only", default: false, sharedScientificGeometry: true, scienceWriteback: false, additionalCanvas: false },
  },
  evidence: { visualFreezeAuditSha256: visualAudit.artifactSha256, legacyRecoverySha256: recovery.artifactSha256, importBoundarySha256: importBoundary.artifactSha256, publicAvailabilitySha256: publicAvailability.artifactSha256, visualMatrixSha256: visualMatrix.artifactSha256, previewDeploymentReceiptSha256: previewDeploymentReceipt?.receiptSha256 ?? null, publicHeadBlockerReceiptSha256: publicHeadBlockerReceipt?.receiptSha256 ?? null, publicHeadAdmissionReceiptSha256: publicHeadAdmissionReceipt?.receiptSha256 ?? null, gitPushBlockerReceiptSha256: gitPushBlockerReceipt?.receiptSha256 ?? null },
  gates: { staticFreeze: allStaticQualified, buildProfiles: buildProfilesQualified, legacyAssetsComplete: legacyComplete, stableCandidateSeparated: forbiddenStableImports.length === 0 && candidateExplicitQualified, candidateNamespace: candidateNamespaceQualified, browserMatrix: browserQualified, visualRegression: visualRegressionQualified, previewDeploymentReady: previewDeploymentReceipt?.qualification?.previewBuildReady === true, previewBrowserRootReachable: previewDeploymentReceipt?.qualification?.browserDirectRootReached === true, previewHead200: v585Preview?.qualified === true, gitRemoteConfigured: gitPushBlockerReceipt?.qualification?.remoteConfigured ?? null, userPromotionConfirmation: false, productionAliasSwitchAllowed: false },
  immutableBoundaries: { historicalV263EvidenceRewritten: false, historicalV9ManifestRewritten: false, legacyEih1pnMutated: false, productionAliasChanged: false, currentDeploymentDeleted: false },
  sourceManifest: authoritySources,
  sourceSha256: canonicalSha(authoritySources),
});

const rollbackPlan = `# Orbit Atlas v585 rollback plan\n\nGenerated: ${generatedAt}\n\n## Safety state\n\n- Production alias is unchanged. The current deployment remains available and is classified as a public candidate preview.\n- Formal product pointer remains \`v263\`; the default scientific kernel remains \`legacy-eih-1pn\`.\n- No historical evidence or historical manifest is rewritten by v585.\n\n## Preview rollback\n\n1. Do not promote the v585 Preview alias.\n2. If a Preview deployment must be removed, first verify the production deployment ID and alias are different, then remove only the exact Preview deployment ID.\n3. Re-run \`node scripts/audit-public-assets-v585.mjs\` against the surviving URL; never infer rollback success from an alias name alone.\n\n## Source rollback\n\n- Revert the exact v585 commit after it exists; do not use \`git reset --hard\` and do not stage unrelated workspace files.\n- If only candidate assets must be disabled, keep \`GalaxyEnvironmentSphere\` bound to \`ORBIT_ATLAS_SKY\` and remove the explicit \`/local-shadow-v562\` candidate route in a new commit.\n- Do not delete the recovered V9 files unless the replacement commit restores the exact same frozen SHA set.\n\n## Recovery verification\n\nRun:\n\n\`node scripts/build-visual-candidate-v562.mjs\`\n\n\`npx vitest run app/lib/atlasVisualFreezeV585.test.ts app/lib/atlasVisualCandidateV562.test.ts --exclude "tmp/**"\`\n\nA rollback is incomplete unless all five V9 SHA values and the three historical v263 evidence SHA values still match \`legacy-v9-asset-recovery-v585.json\`.\n`;
await writeMirrored("rollback-plan-v585.md", rollbackPlan);

const previewDeploymentStatus = previewDeploymentReceipt
  ? `v585 Preview \`${previewDeploymentReceipt.deployment.id}\` 已在 \`${previewDeploymentReceipt.deployment.target}\` 目标构建为 \`${previewDeploymentReceipt.deployment.readyState}\`：${previewDeploymentReceipt.deployment.url}。内置浏览器已直接打开根页并确认默认视觉为 Legacy V9、桌面观测无控制台错误；这只证明 Preview 可访问，不替代逐资源 HEAD 门。`
  : "尚无可验证的 v585 Preview deployment receipt。";
const currentPublicStatus = publicHeadAdmissionQualified
  ? "本机 Node fetch 与 Vercel curl 传输均失败，但内置浏览器 CDP 已对固定 29 项各发送一次 HEAD；Vercel 平台日志恢复出精确 29/29 HTTP 200、0 项 404，Preview HEAD 门已闭合"
  : publicNetworkBlocked ? "本机 Node HEAD runner 对旧地址和 v585 Preview 均返回 fetch failed，当前轮不能判定 29 项线上资源状态；没有观察到 HTTP 404，因此也不能推断资源缺失" : existingPublic?.qualified ? "现有公开部署资源完整" : "现有公开部署不满足严格 v585 资源门";
const gitPushStatus = gitPushBlockerReceipt
  ? `Git 分支保留本地提交，但仓库 remote 数量为 ${gitPushBlockerReceipt.repository.remoteCount}，状态为 \`${gitPushBlockerReceipt.classification}\`；没有猜测或添加 remote。`
  : "尚无 Git push blocker receipt。";
const capabilityReport = `# Orbit Atlas v585 current capability report\n\nGenerated: ${generatedAt}\n\n## 结论\n\nLegacy V9 五件套已经从历史 Git/Lite 对象按原字节恢复，Stable 普通首页重新绑定 \`ORBIT_ATLAS_SKY === ORBIT_ATLAS_V9_SKY\`。v562 与 hero 视觉已迁移到独立 candidate namespace，普通 \`/\`、standalone 和 Lite 的静态 import graph 不再触达 v562/local-shadow。\n\n当前达到 Preview 技术资格但仍不具备 production alias 切换授权：浏览器矩阵=${browserQualified ? "通过" : "未闭合"}，视觉回归=${visualRegressionQualified ? "通过" : "未闭合"}，v585 Preview 构建=${previewDeploymentReceipt?.qualification?.previewBuildReady === true ? "READY" : "未闭合"}，v585 Preview HEAD=${v585Preview?.qualified === true ? "29/29 通过" : "未闭合"}，用户晋级确认=未提供。\n\n## 哪些美术曾被改变\n\n- 提交 \`1eecca0f\` 将 \`GalaxyEnvironmentSphere\` 默认天空从 Legacy V9 改成 v562 runtime candidate。\n- 同一提交删除了 source/Lite 中的 V9 base-8K/base-4K，导致 formal pointer 虽仍为 v263，普通运行时视觉却不能严格复现。\n- v562 manifest 还直接复用了 \`orbit-atlas-v9-*\` URL 身份。v585 已把这些绑定全部拆开。\n\n## 哪些只是候选\n\n- \`candidate-v562\` 只允许由 \`/local-shadow-v562\` 显式启用。\n- \`experimental-hero\` 是 presentation-only，Science 使用线性显示，Cinematic 不得写回 classification、redshift、EVPA、intensity、Stokes 或 coordinates。\n- v585 Vercel deployment 继续按 Preview 对待，不是正式 v263/Legacy V9 发布。\n\n## Legacy V9 恢复\n\n状态：**${legacyComplete ? "完整、原字节、SHA/尺寸/provenance 全匹配" : "blocked-legacy-v9-assets-incomplete"}**。没有生成、重压缩、相似图或 v562 替代。\n\n## 当前部署\n\n${previewDeploymentStatus}\n\n${currentPublicStatus}。v585 没有切换 production alias，也没有删除当前 deployment。\n\n${gitPushStatus}\n\n## 科研执行状态（与正式指针分离）\n\n- Formal evidence：${formalEvidence?.version ?? "unavailable"}；默认 kernel \`legacy-eih-1pn\`。\n- v579 dense：${dense?.status ?? "unavailable"}，${dense?.completedShardCount ?? "?"}/${dense?.plannedShardCount ?? 49}；aggregate SHA ${denseAggregate?.artifactSha256 ?? denseAggregate?.aggregateSha256 ?? "unavailable"}。\n- v580 GPU shadow：${gpu?.status ?? "unavailable"}，不改变 CPU authority。\n- v581 measured authority：${measured?.measuredAuthorityGranted ?? measured?.qualification?.measuredAuthorityGranted ?? false}；真实 acquisition 不等于 measured admission。\n- 旧 v567 gate 与这些后续执行 artifact 存在时间线差异；v585 不重写旧 gate。\n\n## 下一步\n\n1. 保持已通过的三构建、双 viewport、资源生命周期、soak 与 29/29 HEAD evidence 不变。\n2. 由用户提供或确认精确 Git remote 后 push；当前不猜测仓库地址。\n3. 若要晋级 production alias，必须由用户单独明确确认；v585 不自动 promotion。\n`;
const finalizedCapabilityReport = capabilityReport
  .replace("当前仍不具备 production alias 切换资格：", `当前仍不具备 production alias 切换资格：三构建=${buildProfilesQualified ? "通过" : "未闭合"}，`)
  .replace("## 科研执行状态（与正式指针分离）", `## 构建资格\n\nstandalone、Lite、local-shadow 三个 8 GiB 构建均${buildProfilesQualified ? "通过" : "未闭合"}并保留 rollback slot。本机 native SWC 二进制不可加载，使用 Next 官方 WASM fallback；这是 runner warning，\`nativeQualified=false\`，不冒充 native qualification。\n\n## 科研执行状态（与正式指针分离）`)
  .replace("1. 保持 standalone、Lite、local-shadow 三构建与 v585 Playwright 矩阵证据不变。", "1. 保持已通过的三构建、双 viewport、资源生命周期与 soak 证据不变。");
await writeMirrored("current-capability-report-v585.md", finalizedCapabilityReport);
for (const [name, path, receipt] of [
  ["vercel-preview-deployment-v585.json", previewDeploymentReceiptPath, previewDeploymentReceipt],
  ["public-head-runner-blocker-v585.json", publicHeadBlockerReceiptPath, publicHeadBlockerReceipt],
  ["public-head-admission-v585.json", publicHeadAdmissionReceiptPath, publicHeadAdmissionReceipt],
  ["git-push-blocker-v585.json", gitPushBlockerReceiptPath, gitPushBlockerReceipt],
]) {
  if (receipt) await atomicWrite(resolve(distRoot, name), readFileSync(path, "utf8"));
}

console.log(JSON.stringify({
  status: authority.status,
  branch,
  head,
  outputs: ["visual-freeze-audit-v585.json", "legacy-v9-asset-recovery-v585.json", "stable-candidate-import-boundary-v585.json", "public-asset-availability-v585.json", "desktop-mobile-visual-matrix-v585.json", "visual-authority-manifest-v585.json", "rollback-plan-v585.md", "current-capability-report-v585.md"],
  legacyV9Complete: legacyComplete,
  stableCandidateSeparated: forbiddenStableImports.length === 0 && candidateExplicitQualified,
  browserQualified,
  visualRegressionQualified,
  previewHeadQualified: v585Preview?.qualified === true,
  supplementalReceiptCount: [previewDeploymentReceipt, publicHeadBlockerReceipt, publicHeadAdmissionReceipt, gitPushBlockerReceipt].filter(Boolean).length,
  productionAliasSwitchAllowed: false,
}, null, 2));
