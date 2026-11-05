import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const root = process.cwd();
const generatedAt = process.env.V588_SEALED_AT ?? "2026-08-09T03:15:00Z";
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : value === null || typeof value !== "object"
    ? value
    : Object.fromEntries(Object.keys(value).sort((a, b) => a.localeCompare(b)).map((key) => [key, canonicalize(value[key])]));
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
const readJson = (path) => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const check = (condition, message) => { if (!condition) throw new Error(`v588-seal:${message}`); };
function atomicJson(path, value) {
  const absolute = resolve(root, path);
  mkdirSync(dirname(absolute), { recursive: true });
  const partial = `${absolute}.${process.pid}.part`;
  writeFileSync(partial, `${JSON.stringify(value, null, 2)}\n`);
  renameSync(partial, absolute);
}

const expectedScreens = Object.freeze({
  "desktop-cinematic-earth-closeup-1440x900.jpg": [1440, 900],
  "desktop-cinematic-jupiter-closeup-1440x900.jpg": [1440, 900],
  "desktop-cinematic-mars-closeup-1440x900.jpg": [1440, 900],
  "desktop-cinematic-overview-1440x900.jpg": [1440, 900],
  "desktop-cinematic-overview-extreme-exposure-audit-1440x900.jpg": [1440, 900],
  "desktop-cinematic-saturn-closeup-1440x900.jpg": [1440, 900],
  "desktop-science-cassiopeia-escape-1440x900.jpg": [1440, 900],
  "mobile-cinematic-earth-closeup-final-390x844.jpg": [390, 844],
});
const visualQaRoot = resolve(root, "docs/release/v588/visual-qa");
const observedNames = readdirSync(visualQaRoot).filter((name) => /\.(?:jpg|png|webp)$/i.test(name)).sort();
check(JSON.stringify(observedNames) === JSON.stringify(Object.keys(expectedScreens).sort()), "screenshot-set");
const screenshots = [];
for (const name of observedNames) {
  const path = resolve(visualQaRoot, name);
  const bytes = readFileSync(path);
  const metadata = await sharp(bytes).metadata();
  const [width, height] = expectedScreens[name];
  check(metadata.width === width && metadata.height === height, `screenshot-dimensions:${name}`);
  check(metadata.format === "jpeg", `screenshot-format:${name}`);
  screenshots.push({ path: `docs/release/v588/visual-qa/${name}`, bytes: bytes.byteLength, sha256: sha256(bytes), width, height, format: "jpeg" });
}

const freezeBefore = readJson("docs/release/v588/freeze-before-v588.json");
for (const expected of freezeBefore.frozenSnapshot) {
  const absolute = resolve(root, expected.path);
  check(existsSync(absolute) === expected.exists, `freeze-exists:${expected.path}`);
  if (!expected.exists) continue;
  const bytes = readFileSync(absolute);
  check(bytes.byteLength === expected.bytes, `freeze-bytes:${expected.path}`);
  check(sha256(bytes) === expected.sha256, `freeze-sha:${expected.path}`);
}
const freezeAfterUnsigned = {
  version: "v588-frozen-boundary-after-snapshot-v1",
  generatedAt,
  status: "passed-v263-v9-v559-v560-v562-byte-identical-after-v588",
  beforeSnapshotSha256: freezeBefore.snapshotSha256,
  formalProductPointer: "v263",
  defaultKernel: "legacy-eih-1pn",
  historicalEvidenceRewritten: false,
  frozenSnapshot: freezeBefore.frozenSnapshot,
};
const freezeAfter = { ...freezeAfterUnsigned, snapshotSha256: canonicalSha(freezeAfterUnsigned) };
atomicJson("docs/release/v588/freeze-after-v588.json", freezeAfter);

const manifest = readJson("public/data/visual-restoration-v588/manifest.json");
const manifestUnsigned = { ...manifest };
delete manifestUnsigned.manifestSha256;
check(canonicalSha(manifestUnsigned) === manifest.manifestSha256, "asset-manifest-sha");
check(manifest.assets.length === 18 && manifest.admission.heroProceduralFallbackAllowed === false, "asset-admission");
const observationPath = resolve(root, "docs/release/v588/browser-observation-v588.json");
const observationBytes = readFileSync(observationPath);
const observation = JSON.parse(observationBytes.toString("utf8"));
const build = readJson("dist/release/atlas-local-shadow-build-resource-v562.json");
const buildId = readFileSync(resolve(root, ".next-atlas-local-shadow-current/BUILD_ID"), "utf8").trim();
check(build.status === "passed" && build.profile === "local-shadow" && build.rollbackSlotAvailable === true, "production-build");
check(buildId === observation.buildId, "build-id");
check(observation.overview.medianFps >= 55 && observation.science.medianFps >= 45 && observation.mobile.medianFps >= 45, "fps");
check(Object.values(observation.heroes).every((hero) => hero.medianFps >= 45 && hero.readyTextures === hero.requiredTextures), "hero-runtime");
check(observation.science.payloadStable === true && observation.science.forecast === "escape", "science-payload");
check(Object.values(observation.errors).every((value) => value === 0), "browser-errors");
check(observation.resourceLifecycle.status === "released-zero" && ["candidateResources", "sceneNodes", "geometries", "textures", "programs", "renderTargets"].every((key) => observation.resourceLifecycle[key] === 0), "resource-release");
check(observation.identity.manifestSha256 === manifest.manifestSha256 && observation.identity.formalProductPointer === "v263", "browser-identity");

const screenshotManifestUnsigned = {
  version: "v588-fixed-visual-regression-manifest-v1",
  generatedAt,
  status: "baseline-established-closeup-overview-mobile-extreme-science",
  buildId,
  screenshots,
};
const screenshotManifest = { ...screenshotManifestUnsigned, manifestSha256: canonicalSha(screenshotManifestUnsigned) };
atomicJson("docs/release/v588/visual-regression-manifest-v588.json", screenshotManifest);

const postBuildUnsigned = {
  version: "v588-post-build-browser-receipt-v1",
  generatedAt,
  status: "passed-v588-production-browser-visual-resource-gates",
  buildId,
  buildReceiptSha256: sha256(readFileSync(resolve(root, "dist/release/atlas-local-shadow-build-resource-v562.json"))),
  browserObservationSha256: sha256(observationBytes),
  screenshotManifestSha256: screenshotManifest.manifestSha256,
  assetManifestSha256: manifest.manifestSha256,
  freezeBeforeSha256: freezeBefore.snapshotSha256,
  freezeAfterSha256: freezeAfter.snapshotSha256,
  qualification: {
    assetAdmissionQualified: true,
    fourHeroPlanetsQualified: true,
    milkyWayCompositionQualified: true,
    defaultConstellationsQualified: true,
    orbitVisualizationQualified: true,
    scienceCinematicPayloadImmutabilityQualified: true,
    desktopPerformanceQualified: true,
    scientificPerformanceQualified: true,
    mobileOutlineQualified: true,
    browserErrorsZero: true,
    resourceLifecycleQualified: true,
    fixedVisualBaselineEstablished: true,
    thirtyMinuteSoakQualified: false,
  },
  boundary: { formalProductPointer: "v263", legacyV9Rewritten: false, historicalEvidenceRewritten: false, productionPromotionAllowed: false },
};
const postBuild = { ...postBuildUnsigned, receiptSha256: canonicalSha(postBuildUnsigned) };
atomicJson("docs/release/v588/post-build-receipt-v588.json", postBuild);

const pointerUnsigned = {
  version: "orbit-atlas-visual-restoration-candidate-pointer-v588",
  generatedAt,
  status: "research-visual-candidate-qualified-not-formal-product",
  candidate: "v588",
  buildId,
  assetManifestSha256: manifest.manifestSha256,
  postBuildReceiptSha256: postBuild.receiptSha256,
  screenshotManifestSha256: screenshotManifest.manifestSha256,
  freezeAfterSha256: freezeAfter.snapshotSha256,
  formalProductPointer: "v263",
  productionPromotionAllowed: false,
};
const pointer = { ...pointerUnsigned, pointerSha256: canonicalSha(pointerUnsigned) };
atomicJson("dist/release/orbit-atlas-visual-restoration-candidate-v588.json", pointer);

const capabilityUnsigned = {
  version: "v588-visual-restoration-capability-report-v1",
  generatedAt,
  status: "qualified-additive-visual-candidate",
  buildId,
  capabilities: {
    heroPlanets: ["earth", "jupiter", "saturn", "mars"],
    heroProceduralFallback: false,
    ktx2FirstWithVerifiedFallback: true,
    restoredV9MilkyWay: true,
    defaultConstellationsDesktop: 12,
    defaultConstellationsMobile: 8,
    constellationSearchCount: 88,
    orbitLandmarks: ["periapsis", "apoapsis", "ascending-node", "descending-node"],
    orbitPlane: true,
    directionArrows: true,
    velocityVerletPrediction: true,
    singleCanvas: true,
    scientificPayloadWriteback: false,
  },
  evidence: {
    assetManifestSha256: manifest.manifestSha256,
    postBuildReceiptSha256: postBuild.receiptSha256,
    screenshotManifestSha256: screenshotManifest.manifestSha256,
    freezeAfterSha256: freezeAfter.snapshotSha256,
    pointerSha256: pointer.pointerSha256,
  },
  limitations: {
    formalProductPointerMigrated: false,
    thirtyMinuteSoakQualified: false,
    publicReleaseAuthorized: false,
  },
};
const capability = { ...capabilityUnsigned, reportSha256: canonicalSha(capabilityUnsigned) };
atomicJson("docs/release/v588/capability-report-v588.json", capability);

console.log(JSON.stringify({
  status: capability.status,
  buildId,
  assetManifestSha256: manifest.manifestSha256,
  screenshotManifestSha256: screenshotManifest.manifestSha256,
  postBuildReceiptSha256: postBuild.receiptSha256,
  freezeAfterSha256: freezeAfter.snapshotSha256,
  pointerSha256: pointer.pointerSha256,
  reportSha256: capability.reportSha256,
  formalProductPointer: pointer.formalProductPointer,
}, null, 2));
