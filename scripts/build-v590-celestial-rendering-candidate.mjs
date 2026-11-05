import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const generatedAt = process.env.ATLAS_V590_GENERATED_AT ?? "2026-08-10T00:00:00Z";
const docsRoot = resolve(root, "docs/release/v590");
const manifestPath = resolve(root, "public/data/celestial-rendering-v590/manifest.json");
const generatedConstantsPath = resolve(root, "app/data/celestialRenderingManifestV590.generated.ts");
const pointerPath = resolve(root, "dist/release/orbit-atlas-current-celestial-rendering-candidate-v590.json");
const scientificPayloadSha256 = "784ddb4c94aa836b3dc6e517fa559178ae626f6aa5210b52b5ff8cd771785674";

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}

function canonicalSha(value) {
  return sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
}

function atomicWrite(path, text) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.part`;
  writeFileSync(temporary, text);
  rmSync(path, { force: true });
  renameSync(temporary, path);
}

function fileRecord(relativePath, expectedSha256 = null) {
  const path = resolve(root, relativePath);
  if (!existsSync(path)) {
    return { path: relativePath, exists: false, bytes: 0, sha256: null, expectedSha256, status: expectedSha256 ? "preexisting-missing" : "missing" };
  }
  const bytes = readFileSync(path);
  const observed = sha256(bytes);
  return {
    path: relativePath,
    exists: true,
    bytes: bytes.byteLength,
    sha256: observed,
    expectedSha256,
    status: expectedSha256 === null || expectedSha256 === observed ? "matched" : "preexisting-drift",
  };
}

function inheritedFromUrl(url) {
  if (url.includes("candidate-v588")) return "v588";
  if (url.includes("candidate-v589") || url.includes("celestial-art-v589")) return "v589";
  if (url.includes("v9")) return "v9";
  return "v589";
}

const qualityMinimum = (desktopWidth, desktopHeight, mobileWidth = 2048, mobileHeight = 1024) => ({
  desktop: { width: desktopWidth, height: desktopHeight },
  mobile: { width: mobileWidth, height: mobileHeight },
});
const heroAssetQualityMinimums = {
  "sun-photosphere": qualityMinimum(8192, 4096), "sun-chromosphere": qualityMinimum(4096, 2048),
  "mercury-albedo": qualityMinimum(4096, 2048), "mercury-normal": qualityMinimum(2048, 1024), "mercury-roughness": qualityMinimum(2048, 1024),
  "venus-surface": qualityMinimum(4096, 2048), "venus-clouds": qualityMinimum(4096, 2048),
  "earth-albedo": qualityMinimum(8192, 4096), "earth-normal": qualityMinimum(4096, 2048), "earth-roughness": qualityMinimum(4096, 2048),
  "earth-clouds": qualityMinimum(4096, 2048), "earth-cloud-alpha": qualityMinimum(4096, 2048), "earth-night": qualityMinimum(4096, 2048), "earth-night-mask": qualityMinimum(4096, 2048),
  "moon-albedo": qualityMinimum(8192, 4096), "moon-normal": qualityMinimum(4096, 2048), "moon-roughness": qualityMinimum(2048, 1024),
  "mars-albedo": qualityMinimum(8192, 4096), "mars-normal": qualityMinimum(4096, 2048), "mars-roughness": qualityMinimum(2048, 1024),
  "jupiter-albedo": qualityMinimum(8192, 4096), "jupiter-band-mask": qualityMinimum(4096, 2048),
  "saturn-albedo": qualityMinimum(8192, 4096), "saturn-band-mask": qualityMinimum(4096, 2048),
  "saturn-ring-color": qualityMinimum(4096, 4096, 2048, 2048), "saturn-ring-alpha": qualityMinimum(4096, 4096, 2048, 2048),
  "ceres-model": qualityMinimum(1, 1, 1, 1), "vesta-model": qualityMinimum(1, 1, 1, 1), "bennu-model": qualityMinimum(1, 1, 1, 1),
  "eros-model": qualityMinimum(1, 1, 1, 1), "kleopatra-model": qualityMinimum(1, 1, 1, 1), "tempel-1-model": qualityMinimum(1, 1, 1, 1),
  "regolith-cc0": qualityMinimum(4096, 4096, 2048, 2048),
  "regolith-normal-cc0": qualityMinimum(4096, 4096, 2048, 2048),
  "regolith-roughness-cc0": qualityMinimum(4096, 4096, 2048, 2048),
};
const heroRequiredAssets = {
  sun: ["sun-photosphere", "sun-chromosphere"], mercury: ["mercury-albedo", "mercury-normal", "mercury-roughness"],
  venus: ["venus-surface", "venus-clouds"], earth: ["earth-albedo", "earth-normal", "earth-roughness", "earth-clouds", "earth-cloud-alpha", "earth-night", "earth-night-mask"],
  moon: ["moon-albedo", "moon-normal", "moon-roughness"], mars: ["mars-albedo", "mars-normal", "mars-roughness"],
  jupiter: ["jupiter-albedo", "jupiter-band-mask"], saturn: ["saturn-albedo", "saturn-band-mask", "saturn-ring-color", "saturn-ring-alpha"],
  uranus: [], neptune: [], ceres: ["ceres-model", "regolith-cc0", "regolith-normal-cc0", "regolith-roughness-cc0"], vesta: ["vesta-model", "regolith-cc0", "regolith-normal-cc0", "regolith-roughness-cc0"],
  bennu: ["bennu-model", "regolith-cc0", "regolith-normal-cc0", "regolith-roughness-cc0"], eros: ["eros-model", "regolith-cc0", "regolith-normal-cc0", "regolith-roughness-cc0"], kleopatra: ["kleopatra-model", "regolith-cc0", "regolith-normal-cc0", "regolith-roughness-cc0"], "tempel-1": ["tempel-1-model", "regolith-cc0", "regolith-normal-cc0", "regolith-roughness-cc0"],
};
const proceduralPrimaryBodies = new Set(["uranus", "neptune"]);
const rendererCapableBodies = new Set(["sun", "mercury", "venus", "earth", "moon", "mars", "jupiter", "saturn", "uranus", "neptune", "bennu"]);
const rasterFormats = new Set(["webp", "jpeg", "png"]);
const allowedLicenses = new Set(["NASA-public-domain", "USGS-public-domain", "PDS-public-domain", "Poly-Haven-CC0", "Gaia-existing-admission"]);

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
      const expected = heroAssetQualityMinimums[assetId];
      if (!asset || !expected || !asset.fullQualityMinimum || canonicalSha(asset.fullQualityMinimum) !== canonicalSha(expected)) return false;
      const desktop = asset.variants.fullDesktop;
      const mobile = asset.variants.fullMobile;
      if (!meetsMinimum(desktop, expected.desktop) || !meetsMinimum(mobile, expected.mobile)) return false;
      if (desktop.format === "glb") return mobile.format === "glb" && desktop.lod === 0 && mobile.lod === 1;
      return desktop.format === "ktx2" && ["ktx2", ...rasterFormats].includes(mobile.format)
        && rasterFormats.has(asset.variants.liteDesktop?.format) && rasterFormats.has(asset.variants.liteMobile?.format);
    });
    return [body, admitted ? "admitted" : "asset-blocked"];
  }));
}

function v588Variant(file) {
  if (!file) return null;
  return {
    url: file.url,
    bytes: file.bytes,
    sha256: file.sha256,
    width: file.dimensions.width,
    height: file.dimensions.height,
    format: file.format,
    colorSpace: "not-applicable",
    compression: file.compression,
    inheritedFrom: "v588",
  };
}

function inheritAssets(v589Manifest, v588Manifest, fullAssetOverlay) {
  const v588ById = new Map(v588Manifest.assets.map((asset) => [asset.id, asset]));
  const overlayById = new Map(fullAssetOverlay.assets.map((asset) => [asset.id, asset]));
  return v589Manifest.assets.map((asset) => {
    const v588 = v588ById.get(asset.id);
    const overlay = overlayById.get(asset.id);
    const variants = Object.fromEntries(Object.entries(asset.variants).map(([key, file]) => [
      key,
      { ...file, inheritedFrom: inheritedFromUrl(file.url) },
    ]));
    let upgraded = {
      ...asset,
      derivation: {
        ...asset.derivation,
        parameters: `${asset.derivation.parameters}; v590 read-only dependency; source identity preserved`,
      },
      ...(heroAssetQualityMinimums[asset.id] ? { fullQualityMinimum: heroAssetQualityMinimums[asset.id] } : {}),
      variants,
    };
    if (v588 && heroAssetQualityMinimums[asset.id]) {
      const fullDesktop = v588Variant(v588.primary);
      const fullMobile = v588Variant(v588.fallback?.desktop);
      upgraded = {
        ...upgraded,
        sourceBytes: v588.primary.bytes,
        sourceSha256: v588.primary.sha256,
        derivation: {
          ...upgraded.derivation,
          parameters: `${upgraded.derivation.parameters}; v588 byte-locked Full KTX2 + verified 2K mobile raster`,
        },
        variants: {
          ...upgraded.variants,
          ...(fullDesktop ? { fullDesktop: { ...fullDesktop, colorSpace: asset.variants.fullDesktop?.colorSpace ?? asset.variants.liteDesktop?.colorSpace ?? "not-applicable" } } : {}),
          ...(fullMobile ? { fullMobile: { ...fullMobile, colorSpace: asset.variants.fullDesktop?.colorSpace ?? asset.variants.liteDesktop?.colorSpace ?? "not-applicable" } } : {}),
        },
      };
    }
    if (overlay) {
      upgraded = {
        ...upgraded,
        sourceUrl: overlay.source.url,
        sourceHost: overlay.source.host,
        license: overlay.source.license,
        sourceBytes: overlay.source.bytes,
        sourceSha256: overlay.source.sha256,
        derivation: overlay.derivation,
        variants: {
          ...upgraded.variants,
          fullDesktop: { ...overlay.variants.fullDesktop, inheritedFrom: "v590" },
          fullMobile: { ...overlay.variants.fullMobile, inheritedFrom: "v590" },
        },
      };
    }
    return upgraded;
  });
}

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
    if (asset.sourceHost !== localSchemes[source.protocol] || !Object.values(asset.variants).every((file) => !file || file.inheritedFrom)) {
      throw new Error(`v590-local-source-governance:${asset.id}`);
    }
    if (source.protocol === "local-existing-gaia:" && asset.license.id !== "Gaia-existing-admission") throw new Error(`v590-gaia-license:${asset.id}`);
  } else if (source.protocol !== "https:" || source.hostname !== asset.sourceHost || !allowedPublicHost(source.hostname)) {
    throw new Error(`v590-source-host:${asset.id}`);
  }
  if (license.protocol !== "https:") throw new Error(`v590-license-scheme:${asset.id}`);
  if (asset.license.id === "Poly-Haven-CC0" && !(license.hostname === "polyhaven.com" || license.hostname.endsWith(".polyhaven.com"))) throw new Error(`v590-license-host:${asset.id}`);
  if (asset.license.id === "Gaia-existing-admission" && license.hostname !== "www.cosmos.esa.int") throw new Error(`v590-license-host:${asset.id}`);
  if (!["Poly-Haven-CC0", "Gaia-existing-admission"].includes(asset.license.id) && !allowedPublicHost(license.hostname)) throw new Error(`v590-license-host:${asset.id}`);
  if (!Number.isInteger(asset.sourceBytes) || asset.sourceBytes <= 0 || !/^[a-f0-9]{64}$/.test(asset.sourceSha256)) throw new Error(`v590-source-identity:${asset.id}`);
  for (const file of Object.values(asset.variants)) {
    if (!file) continue;
    if (!file.url.startsWith("/") || file.url.startsWith("//") || file.url.includes("\\") || decodeURIComponent(file.url.split("?")[0]).split("/").includes("..")) {
      throw new Error(`v590-variant-url:${asset.id}`);
    }
    if (!file.inheritedFrom) throw new Error(`v590-inherited-identity:${asset.id}`);
  }
}

const v589ManifestPath = resolve(root, "public/data/celestial-art-v589/manifest.json");
const v589ManifestBytes = readFileSync(v589ManifestPath);
const v589Manifest = JSON.parse(v589ManifestBytes.toString("utf8"));
const v589Unsigned = { ...v589Manifest };
delete v589Unsigned.manifestSha256;
if (v589Manifest.version !== "v589-celestial-art-candidate-v1" || canonicalSha(v589Unsigned) !== v589Manifest.manifestSha256) {
  throw new Error("v590-v589-dependency-identity");
}

const v588ManifestPath = resolve(root, "public/data/visual-restoration-v588/manifest.json");
const v588ManifestBytes = readFileSync(v588ManifestPath);
const v588Manifest = JSON.parse(v588ManifestBytes.toString("utf8"));
const v588Unsigned = { ...v588Manifest };
delete v588Unsigned.manifestSha256;
if (v588Manifest.version !== "v588-visual-restoration-candidate-v1" || canonicalSha(v588Unsigned) !== v588Manifest.manifestSha256) {
  throw new Error("v590-v588-dependency-identity");
}

const fullAssetOverlayPath = resolve(root, "public/data/celestial-rendering-v590/full-asset-overlay.json");
const fullAssetOverlayBytes = readFileSync(fullAssetOverlayPath);
const fullAssetOverlay = JSON.parse(fullAssetOverlayBytes.toString("utf8"));
const fullAssetOverlayUnsigned = { ...fullAssetOverlay };
delete fullAssetOverlayUnsigned.receiptSha256;
if (
  fullAssetOverlay.version !== "v590-full-asset-overlay-v1"
  || fullAssetOverlay.status !== "derived-assets-complete"
  || canonicalSha(fullAssetOverlayUnsigned) !== fullAssetOverlay.receiptSha256
) throw new Error("v590-full-asset-overlay-identity");

const basisRuntimeReceiptPath = resolve(root, "public/data/celestial-rendering-v590/basis-runtime-receipt.json");
const basisRuntimeReceiptBytes = readFileSync(basisRuntimeReceiptPath);
const basisRuntimeReceipt = JSON.parse(basisRuntimeReceiptBytes.toString("utf8"));
const basisRuntimeReceiptUnsigned = { ...basisRuntimeReceipt };
delete basisRuntimeReceiptUnsigned.receiptSha256;
if (
  basisRuntimeReceipt.version !== "v590-csp-safe-basis-runtime-v1"
  || basisRuntimeReceipt.status !== "derived-runtime-complete"
  || basisRuntimeReceipt.policy.unsafeEvalRequired !== false
  || canonicalSha(basisRuntimeReceiptUnsigned) !== basisRuntimeReceipt.receiptSha256
) throw new Error("v590-basis-runtime-receipt-identity");

const v589FreezePath = resolve(root, "docs/release/v589/freeze-after-v589.json");
const v589FreezeBytes = readFileSync(v589FreezePath);
const v589Freeze = JSON.parse(v589FreezeBytes.toString("utf8"));
const v589SourceManifestPath = resolve(root, "docs/release/v589/source-manifest-v589.json");
const v589SourceManifest = JSON.parse(readFileSync(v589SourceManifestPath, "utf8"));
if (v589SourceManifest.sourceCount !== 22 || v589SourceManifest.files.length !== 22) throw new Error("v590-v589-source-manifest-count");
const v589SourceUnsigned = { ...v589SourceManifest };
delete v589SourceUnsigned.receiptSha256;
if (canonicalSha(v589SourceUnsigned) !== v589SourceManifest.receiptSha256) throw new Error("v590-v589-source-manifest-receipt");
const inheritedRows = [
  ...(v589Freeze.inheritedFrozenSnapshot ?? []),
  ...(v589Freeze.additiveSnapshot ?? []),
  ...v589SourceManifest.files.map((entry) => ({ path: entry.path, sha256: entry.sha256 })),
];
const uniqueInheritedRows = [...new Map(inheritedRows.map((entry) => [entry.path, entry])).values()];
const inheritedFrozenSnapshot = uniqueInheritedRows.map((entry) => fileRecord(entry.path, entry.sha256));
const explicitFrozenSnapshot = [
  "docs/release/v589/freeze-after-v589.json",
  "docs/release/v589/capability-report-v589.json",
  "public/data/celestial-art-v589/manifest.json",
  "dist/release/orbit-atlas-current-celestial-art-candidate-v589.json",
  "dist/release/orbit-atlas-current-product-evidence-v263.json",
].map((path) => fileRecord(path));
const frozenDrift = [...inheritedFrozenSnapshot, ...explicitFrozenSnapshot].filter((entry) => entry.status !== "matched");
const freezeBeforeUnsigned = {
  version: "v590-frozen-boundary-before-v1",
  generatedAt,
  status: frozenDrift.length === 0 ? "passed" : "blocked-preexisting-frozen-drift",
  formalProductPointer: "v263",
  defaultKernel: "legacy-eih-1pn",
  historicalEvidenceRewritten: false,
  scientificAuthorityChanged: false,
  priorFreezeAfter: {
    path: "docs/release/v589/freeze-after-v589.json",
    bytes: v589FreezeBytes.byteLength,
    sha256: sha256(v589FreezeBytes),
  },
  inheritedFrozenSnapshot,
  explicitFrozenSnapshot,
  drift: frozenDrift.map(({ path, status, expectedSha256, sha256: observedSha256 }) => ({ path, status, expectedSha256, observedSha256 })),
};
const freezeBefore = { ...freezeBeforeUnsigned, snapshotSha256: canonicalSha(freezeBeforeUnsigned) };
atomicWrite(resolve(docsRoot, "freeze-before-v590.json"), `${JSON.stringify(freezeBefore, null, 2)}\n`);

const sourcePaths = [
  "app/local-shadow-v590/page.tsx",
  "app/components/OrbitAtlasCelestialRenderingV590Lazy.tsx",
  "app/components/OrbitAtlasCelestialRenderingV590.tsx",
  "app/components/UniverseCanvasOverrideHostV590.tsx",
  "app/components/UniverseCanvas.tsx",
  "app/components/CelestialRenderingStageV590.tsx",
  "app/components/CelestialDeepSpaceV590.tsx",
  "app/components/CelestialBodiesV590.tsx",
  "app/lib/celestialRenderingV590.ts",
  "app/lib/celestialDeepSpaceV590.ts",
  "app/lib/celestialMaterialsV590.ts",
  "app/lib/useV590Texture.ts",
  "app/lib/kerrObservationV587.ts",
  "app/workers/celestialStarfieldV590.worker.ts",
  "proxy.ts",
  "app/lib/atlasProxyContractV562.ts",
  "scripts/build-v590-celestial-rendering-candidate.mjs",
  "scripts/build-v590-full-assets.mjs",
  "scripts/build-v590-csp-basis.mjs",
  "scripts/seal-v590-celestial-rendering-candidate.mjs",
  "scripts/verify-v590-celestial-rendering-candidate.mjs",
  "scripts/visual-asset-dimensions-v590.mjs",
  "scripts/build-atlas-v590-profile.mjs",
  "scripts/build-atlas-profile.mjs",
  "scripts/start-atlas-v590-standalone.mjs",
  "scripts/start-atlas-standalone.mjs",
  "package.json",
  "docs/release/v590/README.md",
  "app/lib/celestialRenderingV590.test.ts",
  "app/lib/useV590Texture.test.ts",
  "app/lib/celestialMaterialsV590.test.ts",
  "app/lib/celestialDeepSpaceV590.test.ts",
  "app/components/OrbitAtlasCelestialRenderingV590.test.tsx",
  "app/components/CelestialBodiesV590.test.tsx",
  "app/components/CelestialDeepSpaceV590.test.tsx",
  "app/workers/celestialStarfieldV590.worker.test.ts",
];
const sourceFiles = sourcePaths.map((path) => fileRecord(path));
const sourceManifestUnsigned = {
  version: "v590-source-manifest-v1",
  generatedAt,
  status: sourceFiles.every((entry) => entry.exists) ? "complete" : "blocked-missing-source",
  files: sourceFiles,
};
const sourceManifest = { ...sourceManifestUnsigned, receiptSha256: canonicalSha(sourceManifestUnsigned) };
atomicWrite(resolve(docsRoot, "source-manifest-v590.json"), `${JSON.stringify(sourceManifest, null, 2)}\n`);

const frozenV9SkyAssets = [
  {
    id: "milky-way-v9-stars-readonly",
    body: "sky",
    role: "milky-way-catalog-stars-readonly-dependency",
    sourceUrl: "local-admitted-v9://milky-way-stars",
    sourceHost: "local-admitted-v9",
    license: { id: "NASA-public-domain", url: "https://svs.gsfc.nasa.gov/4851/" },
    sourceBytes: 381732,
    sourceSha256: "4c22311b7b87d2b003312a548aca2c904bbade5d9edfaf8cca8b085928cd873c",
    derivation: { tool: "none", version: "v9-frozen-readonly", parameters: "4K/2K catalog-star overlay; no byte or identity rewrite" },
    variants: {
      liteDesktop: { url: "/textures/sky/orbit-atlas-v9-stars-4k.jpg", bytes: 381732, sha256: "4c22311b7b87d2b003312a548aca2c904bbade5d9edfaf8cca8b085928cd873c", width: 4096, height: 2048, format: "jpeg", colorSpace: "srgb", compression: "frozen-v9-jpeg", inheritedFrom: "v9" },
      liteMobile: { url: "/textures/sky/orbit-atlas-v9-stars-2k.jpg", bytes: 122612, sha256: "613625b6d2b71dd943cf62c90b33a9d12522e38f99df50ebc7e9ec60c5f17d65", width: 2048, height: 1024, format: "jpeg", colorSpace: "srgb", compression: "frozen-v9-jpeg", inheritedFrom: "v9" },
    },
    presentationOnly: true,
  },
  {
    id: "milky-way-v9-dust-readonly",
    body: "sky",
    role: "milky-way-dust-mask-readonly-dependency",
    sourceUrl: "local-admitted-v9://milky-way-dust",
    sourceHost: "local-admitted-v9",
    license: { id: "NASA-public-domain", url: "https://svs.gsfc.nasa.gov/4851/" },
    sourceBytes: 700773,
    sourceSha256: "8011f424415f9e8b3841f6a36ce2a63dcdbc5b5161395dc484104e352d9169ce",
    derivation: { tool: "none", version: "v9-frozen-readonly", parameters: "2K dust mask; linear sampling; no byte or identity rewrite" },
    variants: {
      liteDesktop: { url: "/textures/sky/orbit-atlas-v9-dust-2k.jpg", bytes: 700773, sha256: "8011f424415f9e8b3841f6a36ce2a63dcdbc5b5161395dc484104e352d9169ce", width: 2048, height: 1024, format: "jpeg", colorSpace: "linear", compression: "frozen-v9-jpeg", inheritedFrom: "v9" },
      liteMobile: { url: "/textures/sky/orbit-atlas-v9-dust-2k.jpg", bytes: 700773, sha256: "8011f424415f9e8b3841f6a36ce2a63dcdbc5b5161395dc484104e352d9169ce", width: 2048, height: 1024, format: "jpeg", colorSpace: "linear", compression: "frozen-v9-jpeg", inheritedFrom: "v9" },
    },
    presentationOnly: true,
  },
];
const assets = [...inheritAssets(v589Manifest, v588Manifest, fullAssetOverlay), ...frozenV9SkyAssets];
for (const asset of assets) validateAssetGovernance(asset);
const heroBodies = computeHeroBodies(assets);
const sentinelCandidates = assets.flatMap((asset) => {
  const primary = asset.variants.fullDesktop;
  const fallback = asset.variants.liteDesktop ?? asset.variants.liteMobile;
  return primary?.format === "ktx2"
    && primary.width % 4 === 0
    && primary.height % 4 === 0
    && fallback
    && ["webp", "jpeg", "png"].includes(fallback.format)
    ? [{ id: asset.id, bytes: primary.bytes }]
    : [];
}).sort((left, right) => left.bytes - right.bytes || left.id.localeCompare(right.id));
if (sentinelCandidates.length === 0) throw new Error("v590-ktx2-sentinel-candidate");

const deepSpaceLayers = [
  { id: "milky-way", kind: "fixed-celestial-sphere", rightAscensionDeg: 266.4051, declinationDeg: -28.9362, angularSizeDeg: 360, cinematicDepthSlices: 1, mobileDepthSlices: 1, sciencePolicy: "linear-image", admission: "admitted-readonly-dependency", presentationOnly: true },
  { id: "milky-way-stars", kind: "fixed-celestial-sphere", rightAscensionDeg: 266.4051, declinationDeg: -28.9362, angularSizeDeg: 360, cinematicDepthSlices: 1, mobileDepthSlices: 1, sciencePolicy: "linear-image", admission: "admitted-readonly-dependency", presentationOnly: true },
  { id: "milky-way-dust", kind: "dust-sphere", rightAscensionDeg: 266.4051, declinationDeg: -28.9362, angularSizeDeg: 360, cinematicDepthSlices: 2, mobileDepthSlices: 1, sciencePolicy: "linear-image", admission: "admitted-readonly-dependency", presentationOnly: true },
  { id: "orion-nebula", kind: "catalog-nebula", rightAscensionDeg: 83.8221, declinationDeg: -5.3911, angularSizeDeg: 1.1, cinematicDepthSlices: 8, mobileDepthSlices: 2, sciencePolicy: "catalog-outline-only", admission: "asset-blocked", presentationOnly: true },
  { id: "lagoon-nebula", kind: "catalog-nebula", rightAscensionDeg: 270.925, declinationDeg: -24.375, angularSizeDeg: 1.5, cinematicDepthSlices: 6, mobileDepthSlices: 2, sciencePolicy: "catalog-outline-only", admission: "asset-blocked", presentationOnly: true },
  { id: "eagle-nebula", kind: "catalog-nebula", rightAscensionDeg: 274.7, declinationDeg: -13.8067, angularSizeDeg: 0.6, cinematicDepthSlices: 6, mobileDepthSlices: 2, sciencePolicy: "catalog-outline-only", admission: "asset-blocked", presentationOnly: true },
  { id: "helix-nebula", kind: "catalog-nebula", rightAscensionDeg: 337.4108, declinationDeg: -20.8372, angularSizeDeg: 0.47, cinematicDepthSlices: 6, mobileDepthSlices: 1, sciencePolicy: "catalog-outline-only", admission: "asset-blocked", presentationOnly: true },
  { id: "veil-nebula", kind: "catalog-nebula", rightAscensionDeg: 312.75, declinationDeg: 30.7, angularSizeDeg: 3, cinematicDepthSlices: 6, mobileDepthSlices: 1, sciencePolicy: "catalog-outline-only", admission: "asset-blocked", presentationOnly: true },
  { id: "north-america-nebula", kind: "catalog-nebula", rightAscensionDeg: 314.7, declinationDeg: 44.3, angularSizeDeg: 2, cinematicDepthSlices: 6, mobileDepthSlices: 1, sciencePolicy: "catalog-outline-only", admission: "asset-blocked", presentationOnly: true },
];

const unsignedManifest = {
  version: "v590-celestial-rendering-candidate-v1",
  authorityNamespace: "candidate-v590-celestial-rendering",
  generatedAt,
  status: "candidate-integration-partial",
  assets,
  heroBodies,
  deepSpaceLayers,
  runtime: {
    ktx2SentinelAssetId: sentinelCandidates[0].id,
    basisTranscoderPath: "/basis-v590/",
    basisRuntimeReceiptSha256: basisRuntimeReceipt.receiptSha256,
    basisTranscoderJsSha256: basisRuntimeReceipt.output.js.sha256,
    basisTranscoderWasmSha256: basisRuntimeReceipt.output.wasm.sha256,
    unsafeEvalRequired: false,
    coldStartTimeoutMs: 15000,
    warmAssetTimeoutMs: 6000,
    workerLimit: 1,
    assetFailureIsolation: true,
  },
  inheritedDependencies: [
    { candidate: "v589", path: "public/data/celestial-art-v589/manifest.json", sha256: sha256(v589ManifestBytes), mode: "read-only" },
    { candidate: "v589", path: "docs/release/v589/freeze-after-v589.json", sha256: sha256(v589FreezeBytes), mode: "read-only" },
    { candidate: "v589", path: "docs/release/v589/source-manifest-v589.json", sha256: sha256(readFileSync(v589SourceManifestPath)), mode: "read-only" },
    { candidate: "v588", path: "docs/release/v588/freeze-after-v588.json", sha256: sha256(readFileSync(resolve(root, "docs/release/v588/freeze-after-v588.json"))), mode: "read-only" },
    { candidate: "v588", path: "public/data/visual-restoration-v588/manifest.json", sha256: sha256(v588ManifestBytes), mode: "read-only" },
    { candidate: "v588", path: "public/textures/candidate-v588/sky/milky-way-desktop.jpg", sha256: sha256(readFileSync(resolve(root, "public/textures/candidate-v588/sky/milky-way-desktop.jpg"))), mode: "read-only" },
    { candidate: "v590", path: "public/data/celestial-rendering-v590/full-asset-overlay.json", sha256: sha256(fullAssetOverlayBytes), mode: "derived-additive" },
    { candidate: "v590", path: "public/data/celestial-rendering-v590/basis-runtime-receipt.json", sha256: sha256(basisRuntimeReceiptBytes), mode: "derived-additive" },
    { candidate: "v590", path: "public/basis-v590/basis_transcoder.js", sha256: basisRuntimeReceipt.output.js.sha256, mode: "derived-additive" },
    { candidate: "v590", path: "public/basis-v590/basis_transcoder.wasm", sha256: basisRuntimeReceipt.output.wasm.sha256, mode: "derived-additive" },
    { candidate: "runtime-codecs", path: "public/basis/basis_transcoder.js", sha256: basisRuntimeReceipt.source.js.sha256, mode: "read-only" },
    { candidate: "runtime-codecs", path: "public/basis/basis_transcoder.wasm", sha256: basisRuntimeReceipt.source.wasm.sha256, mode: "read-only" },
    { candidate: "v9", path: "public/textures/sky/orbit-atlas-v9-stars-4k.jpg", sha256: "4c22311b7b87d2b003312a548aca2c904bbade5d9edfaf8cca8b085928cd873c", mode: "read-only" },
    { candidate: "v9", path: "public/textures/sky/orbit-atlas-v9-stars-2k.jpg", sha256: "613625b6d2b71dd943cf62c90b33a9d12522e38f99df50ebc7e9ec60c5f17d65", mode: "read-only" },
    { candidate: "v9", path: "public/textures/sky/orbit-atlas-v9-dust-2k.jpg", sha256: "8011f424415f9e8b3841f6a36ce2a63dcdbc5b5161395dc484104e352d9169ce", mode: "read-only" },
  ],
  boundaries: {
    formalProductPointer: "v263",
    frozenCandidatesRewritten: false,
    historicalEvidenceRewritten: false,
    scientificPayloadWriteback: false,
    scientificPayloadSha256,
    singleCanvasRequired: true,
    productionPromotionAllowed: false,
    scientificAuthorityChanged: false,
  },
  budgets: {
    sourceCacheBytesMaximum: 2 * 1024 * 1024 * 1024,
    fullCompressedBytesMaximum: 750 * 1024 * 1024,
    liteIncrementBytesMaximum: 9 * 1024 * 1024,
    liteTotalBytesMaximum: 82 * 1024 * 1024,
  },
};
const manifest = { ...unsignedManifest, manifestSha256: canonicalSha(unsignedManifest) };
atomicWrite(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
atomicWrite(generatedConstantsPath, `// Generated by scripts/build-v590-celestial-rendering-candidate.mjs.\nexport const CELESTIAL_RENDERING_MANIFEST_SHA256_V590 =\n  "${manifest.manifestSha256}" as const;\n\nexport const CELESTIAL_RENDERING_FREEZE_BEFORE_SHA256_V590 =\n  "${freezeBefore.snapshotSha256}" as const;\n`);

const currentStateUnsigned = {
  version: "v590-current-state-receipt-v1",
  generatedAt,
  status: frozenDrift.length === 0 && sourceManifest.status === "complete" ? "candidate-built" : "candidate-built-with-blocked-gates",
  formalProduct: { pointer: "v263", changed: false },
  candidate: { version: manifest.version, route: "/local-shadow-v590", manifestSha256: manifest.manifestSha256, promotion: "additive-only" },
  inherited: {
    v589: "read-only",
    v588: "read-only",
    v9: "read-only",
    historicalEvidence: "read-only",
    legacyKernel: "legacy-eih-1pn-read-only",
  },
  authorities: {
    visualCandidateQualified: false,
    scientificAuthorityChanged: false,
    measuredAuthorityGranted: false,
    gpuAuthorityGranted: false,
  },
  evidence: { freezeBeforeSha256: freezeBefore.snapshotSha256, sourceManifestSha256: sourceManifest.receiptSha256 },
};
const currentState = { ...currentStateUnsigned, receiptSha256: canonicalSha(currentStateUnsigned) };
atomicWrite(resolve(docsRoot, "current-state-receipt-v590.json"), `${JSON.stringify(currentState, null, 2)}\n`);

const pointerUnsigned = {
  version: "v590-current-research-visual-candidate-pointer-v1",
  generatedAt,
  status: "additive-candidate-only",
  route: "/local-shadow-v590",
  candidate: manifest.version,
  manifestSha256: manifest.manifestSha256,
  currentStateReceiptSha256: currentState.receiptSha256,
  formalProductPointer: "v263",
  scientificPayloadSha256,
  scientificPayloadWriteback: false,
  productionPromotionAllowed: false,
};
const pointer = { ...pointerUnsigned, pointerSha256: canonicalSha(pointerUnsigned) };
atomicWrite(pointerPath, `${JSON.stringify(pointer, null, 2)}\n`);

console.log(JSON.stringify({
  status: currentState.status,
  manifestSha256: manifest.manifestSha256,
  freezeBeforeSha256: freezeBefore.snapshotSha256,
  sourceManifestSha256: sourceManifest.receiptSha256,
  pointerSha256: pointer.pointerSha256,
  ktx2SentinelAssetId: manifest.runtime.ktx2SentinelAssetId,
  inheritedFrozenDrift: frozenDrift,
  formalProductPointer: "v263",
}, null, 2));
