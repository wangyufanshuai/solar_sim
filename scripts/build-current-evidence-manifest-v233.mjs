import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const checkOnly = process.argv.includes("--check");
const generatedModule = "app/lib/atlasCurrentEvidenceManifestV233.generated.ts";
const releaseArtifact = "dist/release/orbit-atlas-current-evidence-v233.json";

const fromRoot = (value) => path.join(root, value);
const posix = (value) => value.replaceAll("\\", "/");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const readBuffer = (file) => readFile(fromRoot(file));
const readJson = async (file) => JSON.parse(await readFile(fromRoot(file), "utf8"));
const fileSha256 = async (file) => sha256(await readBuffer(file));

function invariant(condition, message) {
  if (!condition) throw new Error(`v233 evidence invariant failed: ${message}`);
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, canonical(entry)]),
    );
  }
  return value;
}

function maxGeneratedAt(documents) {
  return documents
    .map((document) => document.generatedAt)
    .filter(Boolean)
    .sort((left, right) => Date.parse(left) - Date.parse(right))
    .at(-1);
}

async function optionalDirectoryFiles(directory, pattern) {
  try {
    return (await readdir(fromRoot(directory), { withFileTypes: true }))
      .filter((entry) => entry.isFile() && pattern.test(entry.name))
      .map((entry) => posix(path.join(directory, entry.name)))
      .sort();
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

const sourceFiles = {
  researchCampaign: "dist/release/orbit-atlas-research-campaign-v13.json",
  denseScreen: "dist/science/kerr-finite-observer-screen-v8.json",
  densePlan: "dist/science/kerr-dense-execution-plan-v8-release.json",
  denseAggregate: "dist/science/kerr-dense-cross-validation-v8.json",
  kerrGateV8: "dist/science/kerr-dense-gate-v8.json",
  kerrCampaignProgressV8: "dist/science/kerr-dense-campaign-progress-v8.json",
  v6ShardQuarantine: "dist/science/quarantine/kerr-shards-v6-pre-v8/quarantine-manifest.json",
  stm: "dist/science/relativity-variational-stm-v12-smoke-evidence.json",
  bundleStandalone: "dist/science/client-bundle-v253-standalone-full.json",
  bundleLite: "dist/science/client-bundle-v253-vercel-lite.json",
  lifecycle: "dist/science/lifecycle-soak-v236-report.json",
  contentPacks: "dist/science/content-pack-integrity-v232.json",
  catalogExpansion: "dist/science/catalog-expansion-v255.json",
  security: "dist/science/production-security-v232.json",
  productionAudit: "dist/science/production-audit-v232.json",
  secretScan: "dist/science/secret-scan-v232.json",
};

const entries = await Promise.all(
  Object.entries(sourceFiles).map(async ([id, file]) => [id, file, await readJson(file)]),
);
const reports = Object.fromEntries(entries.map(([id, , document]) => [id, document]));

invariant(reports.researchCampaign.version === "v241-atlas-research-campaign-manifest-v13", "unexpected research campaign version");
invariant(reports.researchCampaign.weakField.historicalRegressionCount === 15, "research campaign must retain all 15 historical rows");
invariant(reports.denseScreen.version === "v248-kerr-finite-observer-screen-manifest-v8", "unexpected V8 finite-observer screen version");
invariant(reports.densePlan.version === "v248-kerr-dense-finite-observer-sharded-v8", "unexpected V8 dense plan version");
invariant(reports.densePlan.profile === "release" && reports.densePlan.shardCount === 49, "dense Kerr release plan must contain 49 shards");
invariant(reports.kerrGateV8.gatePassed === true, "current V8 short gate has not passed");
invariant(reports.kerrGateV8.provenance?.codeSha256 === reports.densePlan.codeSha256, "V8 gate code provenance drifted");
invariant(reports.kerrGateV8.provenance?.environmentSha256 === reports.densePlan.environmentSha256, "V8 gate environment provenance drifted");
invariant(reports.kerrGateV8.provenance?.finiteObserverScreenManifestSha256 === reports.densePlan.finiteObserverScreenManifestSha256, "V8 gate screen provenance drifted");
invariant(reports.kerrCampaignProgressV8.freezeCommitSha === reports.researchCampaign.denseKerr.freezeCommitSha, "current evidence freeze commit disagrees with the campaign");
invariant(reports.kerrCampaignProgressV8.progressSha256 === reports.researchCampaign.denseKerr.campaignProgressSha256, "current evidence progress hash disagrees with the campaign");
invariant(reports.kerrCampaignProgressV8.v6QuarantineManifestSha256 === reports.v6ShardQuarantine.manifestSha256, "current evidence V6 quarantine provenance drifted");
invariant(reports.kerrCampaignProgressV8.status === reports.researchCampaign.denseKerr.campaignStatus, "current evidence campaign status disagrees with V13");
invariant(reports.kerrCampaignProgressV8.failedShardIndex === reports.researchCampaign.denseKerr.failedShardIndex, "current evidence failed shard disagrees with V13");
invariant(reports.kerrCampaignProgressV8.noAutomaticRetry === reports.researchCampaign.denseKerr.noAutomaticRetry, "current evidence retry boundary disagrees with V13");
invariant(reports.stm.version === "v229-relativity-variational-stm-evidence-v12", "unexpected variational STM evidence version");
invariant(reports.catalogExpansion.version === "v255-catalog-expansion", "unexpected catalog expansion evidence");
invariant(reports.catalogExpansion.status === "ready", "catalog expansion evidence is not ready");
invariant(reports.catalogExpansion.defaultScientificKernel === "legacy-eih-1pn", "catalog expansion changed the default kernel");
invariant(
  reports.catalogExpansion.livePhysicsMutation === "not-applied" &&
  reports.catalogExpansion.workerPhysicsMutation === "not-applied" &&
  reports.catalogExpansion.eihOnePnMutation === "not-applied",
  "catalog expansion crossed the presentation-only boundary",
);

const shardDirectory = "dist/science/kerr-shards-v8";
const shardFiles = await optionalDirectoryFiles(shardDirectory, /^shard-\d{4}\.json$/);
const shards = await Promise.all(shardFiles.map(async (file) => ({ file, document: await readJson(file) })));
const completeShards = shards.filter(({ document }) => document.complete === true);
const seenIndices = new Set();
for (const { file, document } of completeShards) {
  invariant(document.profile === "release", `${file} is not a release shard`);
  invariant(document.codeSha256 === reports.densePlan.codeSha256, `${file} code hash does not match the frozen plan`);
  invariant(document.environmentSha256 === reports.densePlan.environmentSha256, `${file} environment hash does not match the frozen plan`);
  invariant(document.version === reports.densePlan.version, `${file} version does not match the V8 plan`);
  invariant(document.finiteObserverScreenManifestSha256 === reports.densePlan.finiteObserverScreenManifestSha256, `${file} screen manifest hash does not match the frozen plan`);
  invariant(!seenIndices.has(document.shardIndex), `${file} duplicates shard ${document.shardIndex}`);
  seenIndices.add(document.shardIndex);
  invariant(document.rays?.length === document.rayCount, `${file} ray count is incomplete`);
  invariant(document.rays.every((ray) => ray.executions?.length === 8), `${file} does not contain eight executions per ray`);
  invariant(
    document.rays.every((ray) => ray.executions.every((execution) => execution.status === "captured" || execution.status === "escaped" || execution.status === "disk-hit")),
    `${file} contains a nonphysical or incomplete execution`,
  );
}

const productGates = {
  contentPacks: reports.contentPacks.passed === true && reports.contentPacks.verifiedFileCount === reports.contentPacks.manifestFileCount,
  standaloneBundle: reports.bundleStandalone.transferBytes <= 604_160,
  liteBundle: reports.bundleLite.transferBytes <= 604_160,
  lifecycle: reports.lifecycle.passed === true,
  catalogExpansion: reports.catalogExpansion.status === "ready",
  security: reports.security.status === "passed",
  productionAudit: reports.productionAudit.passed === true,
  secretScan: reports.secretScan.passed === true,
};
const localProductGatesPassed = Object.values(productGates).every(Boolean);
const denseGatePassed =
  completeShards.length === reports.densePlan.shardCount &&
  reports.denseAggregate.gatePassed === true;
invariant(reports.kerrCampaignProgressV8.completedShardCount === completeShards.length, "current evidence V8 progress/shard coverage disagrees");
const stmGatePassed = reports.stm.releaseQualificationAvailable === true;
const campaign = reports.researchCampaign;
const perBodyRegressionCount = campaign.weakField.historicalRegressionCount;

const sourceSha256 = Object.fromEntries(
  await Promise.all(
    [...Object.entries(sourceFiles), ...shardFiles.map((file) => [`shard:${path.basename(file)}`, file])]
      .map(async ([id, file]) => [id, await fileSha256(file)]),
  ),
);
const core = {
  version: "v233-current-evidence-manifest",
  generatedAt: maxGeneratedAt([...entries.map(([, , document]) => document), ...shards.map(({ document }) => document)]),
  sourceSha256,
  promotionInput: {
    ...campaign.promotionInput,
    supportingGatesPassed: localProductGatesPassed && denseGatePassed && stmGatePassed,
  },
  weakField: {
    checkpointCount: 3,
    bodyCount: 12,
    perBodyRegressionCount,
    regressionsByCheckpoint: Object.fromEntries(
      ["+30d", "+365d", "+10y"].map((checkpoint) => [
        checkpoint,
        campaign.weakField.attributions.filter((row) => row.checkpoint === checkpoint).length,
      ]),
    ),
    confirmedRegressionCount: campaign.weakField.confirmedRegressionCount,
    attributionCounts: campaign.weakField.attributionCounts,
    effectIsolationComplete: campaign.weakField.effectIsolationComplete,
  },
  denseKerr: campaign.denseKerr,
  variationalStm: campaign.variationalStm,
  product: {
    gates: productGates,
    localProductGatesPassed,
    bundles: {
      standaloneTransferBytes: reports.bundleStandalone.transferBytes,
      liteTransferBytes: reports.bundleLite.transferBytes,
      hardLimitBytes: 614_400,
      engineeringTargetBytes: 604_160,
    },
    contentPacks: {
      packCount: reports.contentPacks.packCount,
      manifestFileCount: reports.contentPacks.manifestFileCount,
      verifiedFileCount: reports.contentPacks.verifiedFileCount,
    },
    catalogExpansion: {
      version: reports.catalogExpansion.version,
      canonicalSha256: reports.catalogExpansion.canonicalSha256,
      gaiaRowCount: reports.catalogExpansion.gaia.rowCount,
      iauConstellationCount: reports.catalogExpansion.visualCounts.iauConstellations,
      asterismCount: reports.catalogExpansion.visualCounts.asterisms,
      starClusterCount: reports.catalogExpansion.visualCounts.starClusters,
      nebulaCount: reports.catalogExpansion.visualCounts.nebulae,
      activeRenderBudget: reports.catalogExpansion.activeRenderBudget,
      livePhysicsMutation: reports.catalogExpansion.livePhysicsMutation,
      workerPhysicsMutation: reports.catalogExpansion.workerPhysicsMutation,
      eihOnePnMutation: reports.catalogExpansion.eihOnePnMutation,
    },
  },
  boundary: "generated-current-evidence-no-root-contract-or-runtime-physics-mutation",
};
const document = { ...core, manifestSha256: sha256(JSON.stringify(canonical(core))) };
const jsonText = `${JSON.stringify(document, null, 2)}\n`;
const moduleText = `/* This file is generated by scripts/build-current-evidence-manifest-v233.mjs. */\nexport const ATLAS_CURRENT_EVIDENCE_INPUT_V233 = ${JSON.stringify(document, null, 2)} as const;\n`;

if (checkOnly) {
  const [existingModule, existingArtifact] = await Promise.all([
    readFile(fromRoot(generatedModule), "utf8"),
    readFile(fromRoot(releaseArtifact), "utf8"),
  ]);
  invariant(existingModule === moduleText, `${generatedModule} is stale`);
  invariant(existingArtifact === jsonText, `${releaseArtifact} is stale`);
} else {
  await mkdir(path.dirname(fromRoot(generatedModule)), { recursive: true });
  await mkdir(path.dirname(fromRoot(releaseArtifact)), { recursive: true });
  await Promise.all([
    writeFile(fromRoot(generatedModule), moduleText),
    writeFile(fromRoot(releaseArtifact), jsonText),
  ]);
}

console.log(JSON.stringify({
  mode: checkOnly ? "check" : "write",
  generatedModule,
  releaseArtifact,
  manifestSha256: document.manifestSha256,
  denseKerr: document.denseKerr,
  promotionInput: document.promotionInput,
}, null, 2));
