import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { parseVisualAssetDimensionsV590 } from "./visual-asset-dimensions-v590.mjs";

const root = process.cwd();
const generatedAt = process.env.ATLAS_V590_GENERATED_AT ?? "2026-08-10T00:00:00Z";
const docsRoot = resolve(root, "docs/release/v590");

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
function atomicWrite(path, text) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.part`;
  writeFileSync(temporary, text);
  rmSync(path, { force: true });
  renameSync(temporary, path);
}
function writeSealed(path, unsigned, field) {
  const sealed = { ...unsigned, [field]: canonicalSha(unsigned) };
  atomicWrite(path, `${JSON.stringify(sealed, null, 2)}\n`);
  return sealed;
}
function localPathFromUrl(url) {
  if (!url.startsWith("/") || url.startsWith("//")) return null;
  const normalized = url.split("?")[0].replaceAll("/", "\\").replace(/^\\+/, "");
  const path = resolve(root, "public", normalized);
  const publicRoot = resolve(root, "public");
  if (!path.toLowerCase().startsWith(`${publicRoot.toLowerCase()}\\`)) throw new Error(`v590-path-traversal:${url}`);
  return path;
}

const rasterFormats = new Set(["webp", "jpeg", "png"]);
const proceduralPrimaryBodies = new Set(["uranus", "neptune"]);
const allowedLicenses = new Set(["NASA-public-domain", "USGS-public-domain", "PDS-public-domain", "Poly-Haven-CC0", "Gaia-existing-admission"]);
const heroRequiredAssets = {
  sun: ["sun-photosphere", "sun-chromosphere"], mercury: ["mercury-albedo", "mercury-normal", "mercury-roughness"],
  venus: ["venus-surface", "venus-clouds"], earth: ["earth-albedo", "earth-normal", "earth-roughness", "earth-clouds", "earth-cloud-alpha", "earth-night", "earth-night-mask"],
  moon: ["moon-albedo", "moon-normal", "moon-roughness"], mars: ["mars-albedo", "mars-normal", "mars-roughness"],
  jupiter: ["jupiter-albedo", "jupiter-band-mask"], saturn: ["saturn-albedo", "saturn-band-mask", "saturn-ring-color", "saturn-ring-alpha"],
  uranus: [], neptune: [], ceres: ["ceres-model", "regolith-cc0", "regolith-normal-cc0", "regolith-roughness-cc0"], vesta: ["vesta-model", "regolith-cc0", "regolith-normal-cc0", "regolith-roughness-cc0"],
  bennu: ["bennu-model", "regolith-cc0", "regolith-normal-cc0", "regolith-roughness-cc0"], eros: ["eros-model", "regolith-cc0", "regolith-normal-cc0", "regolith-roughness-cc0"], kleopatra: ["kleopatra-model", "regolith-cc0", "regolith-normal-cc0", "regolith-roughness-cc0"], "tempel-1": ["tempel-1-model", "regolith-cc0", "regolith-normal-cc0", "regolith-roughness-cc0"],
};
const rendererCapableBodies = new Set(["sun", "mercury", "venus", "earth", "moon", "mars", "jupiter", "saturn", "uranus", "neptune", "bennu"]);

function allowedPublicHost(host) {
  const normalized = host.toLowerCase();
  return ["nasa.gov", "gsfc.nasa.gov", "jpl.nasa.gov", "usgs.gov", "polyhaven.org"]
    .some((suffix) => normalized === suffix || normalized.endsWith(`.${suffix}`));
}

function validateAssetGovernance(asset) {
  if (!allowedLicenses.has(asset.license.id)) throw new Error(`v590-license-id:${asset.id}`);
  const source = new URL(asset.sourceUrl);
  const license = new URL(asset.license.url);
  const localSchemes = { "local-admitted-v588:": "local-admitted-v588", "local-admitted-v9:": "local-admitted-v9", "local-existing-gaia:": "local-existing-gaia" };
  if (localSchemes[source.protocol]) {
    if (asset.sourceHost !== localSchemes[source.protocol] || !Object.values(asset.variants).every((file) => !file || file.inheritedFrom)) throw new Error(`v590-local-source-governance:${asset.id}`);
    if (source.protocol === "local-existing-gaia:" && asset.license.id !== "Gaia-existing-admission") throw new Error(`v590-gaia-license:${asset.id}`);
  } else if (source.protocol !== "https:" || source.hostname !== asset.sourceHost || !allowedPublicHost(source.hostname)) {
    throw new Error(`v590-source-host:${asset.id}`);
  }
  if (license.protocol !== "https:") throw new Error(`v590-license-scheme:${asset.id}`);
  if (asset.license.id === "Poly-Haven-CC0" && !(license.hostname === "polyhaven.com" || license.hostname.endsWith(".polyhaven.com"))) throw new Error(`v590-license-host:${asset.id}`);
  if (asset.license.id === "Gaia-existing-admission" && license.hostname !== "www.cosmos.esa.int") throw new Error(`v590-license-host:${asset.id}`);
  if (!["Poly-Haven-CC0", "Gaia-existing-admission"].includes(asset.license.id) && !allowedPublicHost(license.hostname)) throw new Error(`v590-license-host:${asset.id}`);
  for (const file of Object.values(asset.variants)) {
    if (!file) continue;
    const decoded = decodeURIComponent(file.url.split("?")[0]);
    if (!file.url.startsWith("/") || file.url.startsWith("//") || file.url.includes("\\") || decoded.split("/").includes("..")) throw new Error(`v590-variant-url:${asset.id}`);
  }
}

function meetsMinimum(file, minimum) {
  return Boolean(file && minimum && file.width >= minimum.width && file.height >= minimum.height);
}

function computeHeroBodies(assets) {
  const byId = new Map(assets.map((asset) => [asset.id, asset]));
  return Object.fromEntries(Object.entries(heroRequiredAssets).map(([body, required]) => {
    if (proceduralPrimaryBodies.has(body)) return [body, "admitted"];
    if (!rendererCapableBodies.has(body)) return [body, "asset-blocked"];
    const admitted = required.length > 0 && required.every((assetId) => {
      const asset = byId.get(assetId);
      const minimum = asset?.fullQualityMinimum;
      if (!asset || !minimum) return false;
      const desktop = asset.variants.fullDesktop;
      const mobile = asset.variants.fullMobile;
      if (desktop?.format !== "glb" && (minimum.desktop.width < 2048 || minimum.mobile.width < 2048)) return false;
      if (!meetsMinimum(desktop, minimum.desktop) || !meetsMinimum(mobile, minimum.mobile)) return false;
      if (desktop.format === "glb") return mobile.format === "glb" && desktop.lod === 0 && mobile.lod === 1;
      return desktop.format === "ktx2" && ["ktx2", ...rasterFormats].includes(mobile.format)
        && rasterFormats.has(asset.variants.liteDesktop?.format) && rasterFormats.has(asset.variants.liteMobile?.format);
    });
    return [body, admitted ? "admitted" : "asset-blocked"];
  }));
}

function sumUnique(rows, identity, bytes) {
  const unique = new Map();
  for (const row of rows) unique.set(identity(row), bytes(row));
  return [...unique.values()].reduce((sum, value) => sum + value, 0);
}

const manifestPath = resolve(root, "public/data/celestial-rendering-v590/manifest.json");
const manifest = readJson(manifestPath);
const unsignedManifest = { ...manifest };
delete unsignedManifest.manifestSha256;
if (
  manifest.version !== "v590-celestial-rendering-candidate-v1"
  || manifest.authorityNamespace !== "candidate-v590-celestial-rendering"
  || canonicalSha(unsignedManifest) !== manifest.manifestSha256
) throw new Error("v590-manifest-seal-identity");
if (
  manifest.boundaries.formalProductPointer !== "v263"
  || manifest.boundaries.frozenCandidatesRewritten !== false
  || manifest.boundaries.historicalEvidenceRewritten !== false
  || manifest.boundaries.scientificPayloadWriteback !== false
  || manifest.boundaries.singleCanvasRequired !== true
  || manifest.boundaries.productionPromotionAllowed !== false
  || manifest.boundaries.scientificAuthorityChanged !== false
) throw new Error("v590-manifest-seal-boundary");

for (const asset of manifest.assets) validateAssetGovernance(asset);
const computedHeroBodies = computeHeroBodies(manifest.assets);
if (canonicalSha(computedHeroBodies) !== canonicalSha(manifest.heroBodies)) {
  throw new Error("v590-manifest-hero-admission-drift");
}

const sourceCacheBytes = sumUnique(manifest.assets, (asset) => asset.sourceSha256, (asset) => asset.sourceBytes);
const fullFiles = manifest.assets.flatMap((asset) => [asset.variants.fullDesktop, asset.variants.fullMobile].filter(Boolean));
const liteFiles = manifest.assets.flatMap((asset) => [asset.variants.liteDesktop, asset.variants.liteMobile].filter(Boolean));
const liteIncrementFiles = liteFiles.filter((file) => !file.inheritedFrom);
const fullCompressedBytes = sumUnique(fullFiles, (file) => file.url, (file) => file.bytes);
const liteAssetProjectionBytes = sumUnique(liteFiles, (file) => file.url, (file) => file.bytes);
const liteIncrementBytes = sumUnique(liteIncrementFiles, (file) => file.url, (file) => file.bytes);
const liteBase = readJson(resolve(root, "public/atlas-lite/manifest.json"));
if (liteBase.maxBytes !== manifest.budgets.liteTotalBytesMaximum) throw new Error("v590-lite-base-budget-identity");
const liteTotalBytes = liteBase.installedBytes + liteIncrementBytes;
const budgetChecks = {
  sourceCache: { actualBytes: sourceCacheBytes, maximumBytes: manifest.budgets.sourceCacheBytesMaximum, status: sourceCacheBytes <= manifest.budgets.sourceCacheBytesMaximum ? "passed" : "blocked" },
  fullCompressed: { actualBytes: fullCompressedBytes, maximumBytes: manifest.budgets.fullCompressedBytesMaximum, status: fullCompressedBytes <= manifest.budgets.fullCompressedBytesMaximum ? "passed" : "blocked" },
  liteIncrement: { actualBytes: liteIncrementBytes, maximumBytes: manifest.budgets.liteIncrementBytesMaximum, status: liteIncrementBytes <= manifest.budgets.liteIncrementBytesMaximum ? "passed" : "blocked" },
  liteTotal: { actualBytes: liteTotalBytes, baselineBytes: liteBase.installedBytes, assetProjectionBytes: liteAssetProjectionBytes, maximumBytes: manifest.budgets.liteTotalBytesMaximum, status: liteTotalBytes <= manifest.budgets.liteTotalBytesMaximum ? "passed" : "blocked" },
};
const budgetDrift = Object.entries(budgetChecks).filter(([, check]) => check.status !== "passed").map(([budget, check]) => ({ budget, ...check }));

const dependencyChecks = manifest.inheritedDependencies.map((dependency) => {
  const path = resolve(root, dependency.path);
  const actualSha256 = existsSync(path) ? sha256(readFileSync(path)) : null;
  return { ...dependency, actualSha256, status: actualSha256 === dependency.sha256 ? "matched" : "drift" };
});
const dependencyDrift = dependencyChecks.filter((entry) => entry.status !== "matched");

const assetChecks = [];
for (const asset of manifest.assets) {
  for (const [variant, file] of Object.entries(asset.variants)) {
    const path = localPathFromUrl(file.url);
    if (!path) continue;
    if (!existsSync(path)) {
      assetChecks.push({ assetId: asset.id, variant, url: file.url, status: "missing", bytes: null, sha256: null });
      continue;
    }
    const bytes = readFileSync(path);
    const actualSha = sha256(bytes);
    let actualDimensions = null;
    let dimensionStatus = "not-applicable";
    try {
      actualDimensions = parseVisualAssetDimensionsV590(bytes, file.format);
      if (actualDimensions) {
        dimensionStatus = actualDimensions.width === file.width && actualDimensions.height === file.height
          ? "matched"
          : "drift";
      }
    } catch (error) {
      dimensionStatus = `invalid:${error instanceof Error ? error.message : "unknown"}`;
    }
    const identityMatched = bytes.byteLength === file.bytes && actualSha === file.sha256;
    assetChecks.push({
      assetId: asset.id,
      variant,
      url: file.url,
      status: identityMatched && ["matched", "not-applicable"].includes(dimensionStatus) ? "matched" : "drift",
      bytes: bytes.byteLength,
      sha256: actualSha,
      declaredDimensions: { width: file.width, height: file.height },
      actualDimensions,
      dimensionStatus,
    });
  }
}
const assetDrift = assetChecks.filter((entry) => entry.status !== "matched");

const freezeBefore = readJson(resolve(docsRoot, "freeze-before-v590.json"));
const freezeRows = [...freezeBefore.inheritedFrozenSnapshot, ...freezeBefore.explicitFrozenSnapshot];
const freezeChecks = freezeRows.map((entry) => {
  const path = resolve(root, entry.path);
  const currentSha256 = existsSync(path) ? sha256(readFileSync(path)) : null;
  return {
    path: entry.path,
    beforeSha256: entry.sha256,
    currentSha256,
    status: currentSha256 === entry.sha256 ? "matched" : entry.sha256 === null && currentSha256 === null ? "preexisting-missing-unchanged" : "post-build-drift",
  };
});
const postBuildFreezeDrift = freezeChecks.filter((entry) => !["matched", "preexisting-missing-unchanged"].includes(entry.status));

const sourceManifest = readJson(resolve(docsRoot, "source-manifest-v590.json"));
const requiredOperationalSources = [
  "proxy.ts",
  "app/lib/atlasProxyContractV562.ts",
  "scripts/build-atlas-profile.mjs",
  "scripts/start-atlas-v590-standalone.mjs",
  "scripts/start-atlas-standalone.mjs",
];
const sourceManifestPaths = new Set(sourceManifest.files.map((entry) => entry.path));
const sourceCoverageDrift = requiredOperationalSources
  .filter((path) => !sourceManifestPaths.has(path))
  .map((path) => ({ path, status: "missing-source-manifest-coverage" }));
const sourceChecks = sourceManifest.files.map((entry) => {
  const path = resolve(root, entry.path);
  const currentSha256 = existsSync(path) ? sha256(readFileSync(path)) : null;
  return { path: entry.path, expectedSha256: entry.sha256, currentSha256, status: currentSha256 === entry.sha256 ? "matched" : "drift" };
});
const sourceDrift = sourceChecks.filter((entry) => entry.status !== "matched");

function evaluateBuildGate(kind, expectedDistDir, expectedDeliveryTier) {
  const relativeReceiptPath = `dist/release/atlas-v590-${kind}-build-resource.json`;
  const receiptPath = resolve(root, relativeReceiptPath);
  if (!existsSync(receiptPath)) return { kind, status: "not-run", receiptPath: relativeReceiptPath, reasons: ["receipt-missing"] };
  try {
    const receiptBytes = readFileSync(receiptPath);
    const receipt = JSON.parse(receiptBytes.toString("utf8"));
    const profilePath = resolve(root, expectedDistDir, "atlas-build-profile.json");
    const buildIdPath = resolve(root, expectedDistDir, "BUILD_ID");
    const profile = existsSync(profilePath) ? readJson(profilePath) : null;
    const buildId = existsSync(buildIdPath) ? readFileSync(buildIdPath, "utf8").trim() : null;
    const reasons = [];
    if (receipt.version !== "v562-atlas-build-resource-receipt-v1" || receipt.status !== "passed") reasons.push("receipt-not-passed");
    if (receipt.profile !== "local-shadow" || receipt.distDir !== expectedDistDir) reasons.push("profile-or-dist-mismatch");
    if (receipt.deliveryTier !== expectedDeliveryTier) reasons.push("delivery-tier-mismatch");
    if (receipt.candidateSourceManifestSha256 !== sourceManifest.receiptSha256) reasons.push("source-manifest-mismatch");
    if (receipt.heapMb !== 8192 || receipt.lowMemoryMode !== true || receipt.standaloneTopologyQualified !== true) reasons.push("resource-policy-mismatch");
    if (receipt.browserStarted !== false || receipt.denseStarted !== false || receipt.gpuStarted !== false) reasons.push("forbidden-task-overlap");
    if (!profile || profile.buildId !== receipt.buildId || profile.deliveryTier !== expectedDeliveryTier || profile.candidateSourceManifestSha256 !== sourceManifest.receiptSha256) reasons.push("build-profile-mismatch");
    if (!buildId || buildId !== receipt.buildId) reasons.push("build-id-mismatch");
    return {
      kind,
      status: reasons.length === 0 ? "passed" : "blocked",
      receiptPath: relativeReceiptPath,
      receiptSha256: sha256(receiptBytes),
      distDir: expectedDistDir,
      deliveryTier: expectedDeliveryTier,
      buildId: receipt.buildId ?? null,
      sourceManifestSha256: receipt.candidateSourceManifestSha256 ?? null,
      heapMb: receipt.heapMb ?? null,
      swcRuntime: receipt.swcRuntime?.mode ?? "unavailable",
      rollbackSlotAvailable: receipt.rollbackSlotAvailable === true,
      reasons,
    };
  } catch (error) {
    return { kind, status: "blocked", receiptPath: relativeReceiptPath, reasons: [error instanceof Error ? error.message : String(error)] };
  }
}

const standaloneBuildGate = evaluateBuildGate("standalone", ".next-atlas-v590-standalone-current", "standalone-full");
const liteBuildGate = evaluateBuildGate("lite", ".next-atlas-v590-lite-current", "vercel-lite");
const buildGatesPassed = standaloneBuildGate.status === "passed" && liteBuildGate.status === "passed";

const v589SourceManifest = readJson(resolve(root, "docs/release/v589/source-manifest-v589.json"));
const freezeByPath = new Map(freezeRows.map((entry) => [entry.path, entry]));
const v589SourceFreezeCoverage = v589SourceManifest.files.map((entry) => {
  const frozen = freezeByPath.get(entry.path);
  return {
    path: entry.path,
    expectedSha256: entry.sha256,
    frozenSha256: frozen?.sha256 ?? null,
    status: frozen?.sha256 === entry.sha256 ? "covered" : "missing-or-drift",
  };
});
const v589SourceFreezeDrift = v589SourceFreezeCoverage.filter((entry) => entry.status !== "covered");

const sealStatus = dependencyDrift.length === 0
  && assetDrift.length === 0
  && postBuildFreezeDrift.length === 0
  && sourceDrift.length === 0
  && sourceCoverageDrift.length === 0
  && v589SourceFreezeDrift.length === 0
  && budgetDrift.length === 0
  ? freezeBefore.status === "passed" ? "sealed-gates-pending" : "sealed-with-preexisting-freeze-blocker"
  : "seal-blocked-drift";
const verification = writeSealed(resolve(docsRoot, "verification-receipt-v590.json"), {
  version: "v590-verification-receipt-v1",
  generatedAt,
  status: sealStatus,
  manifestSha256: manifest.manifestSha256,
  dependencyChecks,
  assetChecks,
  budgetChecks,
  v589SourceFreezeCoverage,
  freezeChecks,
  sourceChecks,
  blockers: {
    dependencyDrift,
    assetDrift,
    postBuildFreezeDrift,
    sourceDrift,
    sourceCoverageDrift,
    v589SourceFreezeDrift,
    budgetDrift,
    preexistingFrozenDrift: freezeBefore.drift,
    standaloneBuild: standaloneBuildGate,
    liteBuild: liteBuildGate,
    browserMatrix: "not-run",
    thirtyMinuteSoak: "not-run",
    productionRelease: "not-authorized",
  },
}, "receiptSha256");

const freezeAfter = writeSealed(resolve(docsRoot, "freeze-after-v590.json"), {
  version: "v590-frozen-boundary-after-v1",
  generatedAt,
  status: postBuildFreezeDrift.length === 0 ? "frozen-surfaces-unchanged-after-v590" : "blocked-post-build-frozen-drift",
  beforeSnapshotSha256: freezeBefore.snapshotSha256,
  formalProductPointer: "v263",
  historicalEvidenceRewritten: false,
  scientificAuthorityChanged: false,
  inheritedFrozenSnapshot: freezeBefore.inheritedFrozenSnapshot,
  explicitFrozenSnapshot: freezeBefore.explicitFrozenSnapshot,
  postBuildChecks: freezeChecks,
}, "snapshotSha256");

const admittedBodies = Object.entries(manifest.heroBodies).filter(([, status]) => status === "admitted").map(([body]) => body);
const blockedBodies = Object.entries(manifest.heroBodies).filter(([, status]) => status !== "admitted").map(([body]) => body);
const blockedNebulae = manifest.deepSpaceLayers.filter((layer) => layer.kind === "catalog-nebula" && layer.admission !== "admitted-readonly-dependency").map((layer) => layer.id);
const capability = writeSealed(resolve(docsRoot, "capability-report-v590.json"), {
  version: "v590-celestial-rendering-capability-report-v1",
  generatedAt,
  status: sealStatus === "sealed-gates-pending" && buildGatesPassed ? "implemented-core-browser-qualification-pending" : "implemented-core-with-blocked-gates",
  candidate: {
    route: "/local-shadow-v590",
    manifestSha256: manifest.manifestSha256,
    formalProductPointer: "v263",
    scientificPayloadWriteback: false,
  },
  capabilities: {
    singleCanvas: true,
    scienceCinematicSharedGeometry: true,
    cleanViewPresentationOnly: true,
    ktx2SentinelPrewarm: true,
    ktx2AssetFailureIsolation: true,
    verifiedFallback: true,
    fullQualityDimensionGate: true,
    actualFileDimensionChecks: `${assetChecks.filter((entry) => entry.dimensionStatus === "matched").length}/${assetChecks.filter((entry) => entry.dimensionStatus !== "not-applicable").length}`,
    mobileDeviceStrictSelection: true,
    fullMobileRasterSemantic: "exact-fullMobile-raster-can-pass;lite-raster-remains-fallback",
    rendererCapabilityGate: true,
    scientificProjectionProbe: {
      source: "/data/kerr-observation-v587/observation-summary.json",
      parser: "ObservationSummaryV3",
      unavailableStatus: "blocked-not-connected",
      selfCertificationAllowed: false,
    },
    operationalSourceCoverage: `${requiredOperationalSources.length - sourceCoverageDrift.length}/${requiredOperationalSources.length}`,
    v589SourceFreezeCoverage: `${v589SourceFreezeCoverage.length - v589SourceFreezeDrift.length}/${v589SourceFreezeCoverage.length}`,
    budgetChecks,
    buildGates: {
      standalone: standaloneBuildGate,
      lite: liteBuildGate,
    },
    inheritedSkyIdentity: {
      base: "v588-readonly",
      catalogStars: "V9-readonly",
      dustMask: "V9-readonly",
    },
    heroAdmittedBodies: admittedBodies,
    heroBlockedBodies: blockedBodies,
    blockedNebulae,
  },
  blockedGates: {
    allSixteenHeroAdmission: blockedBodies.length === 0 ? "passed" : `blocked:${blockedBodies.join(",")}`,
    allSixNebulaAdmission: blockedNebulae.length === 0 ? "passed" : `blocked:${blockedNebulae.join(",")}`,
    frozenHistory: freezeBefore.status,
    browserVisualMatrix: "not-run",
    fps: "not-run",
    soak30Minutes: "not-run",
    standaloneBuild: standaloneBuildGate.status,
    liteBuild: liteBuildGate.status,
    productionRelease: "not-authorized",
  },
  evidence: {
    verificationReceiptSha256: verification.receiptSha256,
    freezeAfterSha256: freezeAfter.snapshotSha256,
    sourceManifestSha256: sourceManifest.receiptSha256,
  },
  releaseAuthorized: false,
}, "reportSha256");

const pointerPath = resolve(root, "dist/release/orbit-atlas-current-celestial-rendering-candidate-v590.json");
const priorPointer = readJson(pointerPath);
const pointerUnsigned = {
  ...priorPointer,
  status: sealStatus === "sealed-gates-pending" && buildGatesPassed ? "additive-candidate-sealed-browser-gates-pending" : "additive-candidate-sealed-blocked",
  verificationReceiptSha256: verification.receiptSha256,
  freezeAfterSha256: freezeAfter.snapshotSha256,
  capabilityReportSha256: capability.reportSha256,
};
delete pointerUnsigned.pointerSha256;
const pointer = { ...pointerUnsigned, pointerSha256: canonicalSha(pointerUnsigned) };
atomicWrite(pointerPath, `${JSON.stringify(pointer, null, 2)}\n`);

console.log(JSON.stringify({
  status: capability.status,
  manifestSha256: manifest.manifestSha256,
  verificationReceiptSha256: verification.receiptSha256,
  freezeAfterSha256: freezeAfter.snapshotSha256,
  capabilityReportSha256: capability.reportSha256,
  admittedBodies,
  blockedBodies,
  blockedNebulae,
  formalProductPointer: "v263",
}, null, 2));
