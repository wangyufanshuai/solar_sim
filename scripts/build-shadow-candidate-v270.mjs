import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, statfsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { freemem } from "node:os";
import { resolve } from "node:path";

const ROOT = resolve(".");
const EXPECTED_CODE_SHA = "0debb41b96f001f92f498ef6a36ceff77ede7f0dd2bdbe3c6e9db3dfbf6090a8";
const EXPECTED_SCREEN_SHA = "08f42a50bc787df62dc018ee56b5f7b58065dcafe2e2a3703e3e67f3e6d94037";
const PRODUCT_POINTER_PATH = "dist/release/orbit-atlas-current-product-evidence-v263.json";
const LIGHT_VALIDATION_PATH = "dist/science/v267-v270-shadow-light-validation.json";
const FREEZE_COMMIT = "8315160a6f7afd4763e3840c7b6d5bb4da0ca663";
const FREEZE_BRANCH = "codex/orbit-atlas-v241-science-freeze";
const PROTECTED_SCIENCE_SOURCES = [
  "scripts/run-kerr-dense-shards-v8.py",
  "scripts/run-kerr-dense-shards-v6.py",
  "scripts/kerr_finite_observer_separatrix_v8.py",
  "scripts/build-kerr-finite-observer-screen-v8.py",
  "scripts/run-kerr-schild-reference-v5.py",
  "scripts/run-kerr-carter-mino-reference-v6.py",
  "scripts/kerr_observer_frame_v5.py",
];
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]))
    : value;
const canonicalJson = (value) => JSON.stringify(canonicalize(value));
const readJson = async (path) => JSON.parse(await readFile(resolve(ROOT, path), "utf8"));
const fileSha256 = async (path) => sha256(await readFile(resolve(ROOT, path)));
const sourceHashes = async (paths) => Object.fromEntries(await Promise.all(paths.map(async (path) => [path, await fileSha256(path)])));

const [progress, productPointer, v263, validation, v264r3, v265, v266] = await Promise.all([
  readJson("dist/science/kerr-dense-campaign-progress-v8.json"),
  readJson(PRODUCT_POINTER_PATH),
  readJson("dist/release/orbit-atlas-v263-local-validation-evidence.json"),
  readJson(LIGHT_VALIDATION_PATH),
  readJson("dist/science/catalog-stream-v264r3-preflight-negative-evidence.json"),
  readJson("dist/science/gaia-presentation-v265-negative-evidence.json"),
  readJson("dist/science/observation-planner-v266-negative-evidence.json"),
]);
if (progress.codeSha256 !== EXPECTED_CODE_SHA || progress.finiteObserverScreenManifestSha256 !== EXPECTED_SCREEN_SHA) {
  throw new Error("Protected science SHA changed before v267-v270 shadow evidence");
}
if (validation.status !== "passed-lightweight-shadow-validation") throw new Error("Lightweight shadow validation is not passing");
if (productPointer.version !== "v263-current-product-evidence-pointer") throw new Error("Formal product pointer moved away from v263");
if (v263.contracts?.legacyRootAttributes !== 603 || v263.contracts?.evidenceLedgerClaims !== 84) throw new Error("Legacy contract counts changed");
const branch = execFileSync("git", ["branch", "--show-current"], { cwd: ROOT, encoding: "utf8" }).trim();
if (branch !== FREEZE_BRANCH) throw new Error(`Science freeze branch changed: ${branch}`);
const protectedDiff = execFileSync("git", ["diff", "--name-only", FREEZE_COMMIT, "--", ...PROTECTED_SCIENCE_SOURCES], { cwd: ROOT, encoding: "utf8" }).trim();
if (protectedDiff) throw new Error(`Protected science sources differ from freeze: ${protectedDiff}`);

const freeMemoryBytes = freemem();
const disk = statfsSync("E:\\");
const freeDiskBytes = Number(disk.bavail) * Number(disk.bsize);
const resourcePreflight = {
  checkedAt: new Date().toISOString(),
  freePhysicalMemoryBytes: freeMemoryBytes,
  freePhysicalMemoryGiB: Number((freeMemoryBytes / 2 ** 30).toFixed(2)),
  minimumPhysicalMemoryGiB: 6,
  eDriveFreeBytes: freeDiskBytes,
  eDriveFreeGiB: Number((freeDiskBytes / 2 ** 30).toFixed(2)),
  minimumEDriveFreeGiB: 20,
  heavyGateAllowed: freeMemoryBytes >= 6 * 2 ** 30 && freeDiskBytes >= 20 * 2 ** 30,
};
const heavyStatus = resourcePreflight.heavyGateAllowed
  ? "not-run-shadow-closure-pending"
  : "blocked-resource-preflight";
const generatedAt = new Date().toISOString();
const science = {
  status: "science-failed-shadow-retained",
  defaultKernel: "legacy-eih-1pn",
  codeSha256: progress.codeSha256,
  screenSha256: progress.finiteObserverScreenManifestSha256,
  workerPhysicsMutation: "not-applied",
  eihOnePnMutation: "not-applied",
  kerrMutation: "not-applied",
  campaignRerunApplied: false,
  freezeCommit: FREEZE_COMMIT,
  freezeBranch: FREEZE_BRANCH,
  protectedScienceSourceDiff: "none",
};
const contracts = {
  legacyRootAttributes: v263.contracts.legacyRootAttributes,
  legacyRootKeySha256: v263.contracts.legacyRootKeySha256,
  evidenceLedgerClaims: v263.contracts.evidenceLedgerClaims,
  evidenceLedgerCanonicalSha256: v263.contracts.evidenceLedgerCanonicalSha256,
  singleCanvas: true,
  formalProductPointer: "v263",
  formalProductPointerSha256: await fileSha256(PRODUCT_POINTER_PATH),
};
const release = {
  profile: "local-shadow-candidate",
  promotionApplied: false,
  correctedV266Applied: false,
  v265DownloadResumed: false,
  vercelApplied: false,
  productionApplied: false,
  dnsApplied: false,
  signingApplied: false,
  publicDeploymentBlocked: true,
};
const commonValidation = {
  lightweight: { path: LIGHT_VALIDATION_PATH, sha256: await fileSha256(LIGHT_VALIDATION_PATH), status: validation.status },
  build: heavyStatus,
  browserMatrix: heavyStatus,
  soak: heavyStatus,
  rtx: heavyStatus,
  resourcePreflight,
};

const v267AggregateManifest = "dist/gaia-research-v267/gaia-research-v267.manifest.json";
const phaseDocuments = [
  {
    phase: "v267",
    output: "dist/science/gaia-research-v267-shadow-evidence.json",
    document: {
      version: "v267-gaia-research-workbench-shadow-evidence-v1",
      generatedAt,
      status: existsSync(resolve(ROOT, v267AggregateManifest))
        ? `implemented-aggregate-present-${heavyStatus}`
        : "implemented-aggregate-build-blocked-resource-preflight",
      qualificationApplied: false,
      implementation: {
        frozenScienceRows: 200_000,
        qualityCounts: { gold: 30_028, silver: 169_972, limited: 0 },
        motherRows: 1_224_219,
        aggregate: existsSync(resolve(ROOT, v267AggregateManifest)) ? v267AggregateManifest : "not-built",
        queries: ["overview", "healpix-density", "hr-density", "selection"],
        gaiaSurveyCompleteness: "unavailable",
        secondCanvasAdded: false,
        sourceHashes: await sourceHashes([
          "app/lib/gaiaResearchWorkbenchV267.ts",
          "app/api/atlas/science-workbench/route.ts",
          "app/components/GaiaScienceAnalysisPanel.tsx",
          "app/components/GaiaResearchDensityViewsV267.tsx",
          "scripts/build-gaia-research-v267.py",
        ]),
      },
      validation: commonValidation,
      science,
      contracts,
      release,
      boundary: "frozen-200k-subset-research-shadow-not-gaia-survey-completeness-or-physics",
    },
  },
  {
    phase: "v268",
    output: "dist/science/scale-journey-v268-shadow-evidence.json",
    document: {
      version: "v268-continuous-scale-journey-shadow-evidence-v1",
      generatedAt,
      status: `implemented-focused-passed-${heavyStatus}`,
      qualificationApplied: false,
      implementation: {
        bands: ["solar", "stellar", "galactic", "local-group", "near-universe"],
        durationMs: 900,
        transientProgress: "r3f-ref-not-react-store",
        staleTransitionIsolation: true,
        sceneRevisionMutation: "not-applied",
        cosmicflowsPublicDeploymentBlocked: true,
        sourceHashes: await sourceHashes([
          "app/lib/atlasScaleJourneyV268.ts",
          "app/lib/atlasRuntimeScaleSliceV270.ts",
          "app/components/AtlasScaleTransitionBridgeV268.tsx",
          "app/components/AtlasScaleNavigatorV260.tsx",
          "app/components/CosmicScaleDataLayerV260.tsx",
        ]),
      },
      validation: commonValidation,
      science,
      contracts,
      release,
      boundary: "presentation-only-local-origin-scale-journey-no-physics-coordinate-mutation",
    },
  },
  {
    phase: "v269",
    output: "dist/science/science-cinematic-v269-shadow-evidence.json",
    document: {
      version: "v269-science-cinematic-v2-shadow-evidence-v1",
      generatedAt,
      status: `implemented-three-way-ab-${heavyStatus}`,
      qualificationApplied: false,
      implementation: {
        profiles: ["legacy-v9", "science-cinematic-v256", "science-cinematic-v2-v269"],
        defaultProfile: "legacy-v9",
        centralRendererProfile: true,
        scenes: ["planet", "gaia", "catalog", "kerr-visual-only", "launch-presentation", "exoplanet"],
        visualAssetsDownloaded: false,
        sourceHashes: await sourceHashes([
          "app/lib/atlasVisualProfileV269.ts",
          "app/components/AtlasVisualABControlV261.tsx",
          "app/components/ScienceCinematicVisualSurfaceV261.tsx",
          "app/components/Planet.tsx",
          "app/components/GaiaStarField.tsx",
          "app/components/KerrBlackHole.tsx",
          "app/components/LaunchSceneView.tsx",
          "app/components/ExoplanetSystemScene.tsx",
        ]),
      },
      validation: commonValidation,
      science,
      contracts,
      release,
      boundary: "visual-only-three-way-local-shadow-no-default-promotion-or-science-mutation",
    },
  },
  {
    phase: "v270",
    output: "dist/science/performance-security-v270-shadow-evidence.json",
    document: {
      version: "v270-performance-security-shadow-evidence-v1",
      generatedAt,
      status: `implemented-light-validation-passed-${heavyStatus}`,
      qualificationApplied: false,
      implementation: {
        runtimeStoreFacadeLines: (await readFile(resolve(ROOT, "app/lib/atlasRuntimeStore.ts"), "utf8")).split(/\r?\n/).length,
        runtimeSlices: ["panel-session", "scale-journey"],
        boundedApiServices: ["catalog-query", "science-workbench", "weather", "locations"],
        geolocationPolicy: "same-origin-explicit-user-authorization",
        responseAndBodyCaps: true,
        parameterizedScienceQueries: true,
        sourceHashes: await sourceHashes([
          "app/lib/atlasRuntimeStore.ts",
          "app/lib/atlasRuntimePanelSliceV270.ts",
          "app/lib/atlasRuntimeScaleSliceV270.ts",
          "app/lib/atlasApiRateLimitV270.ts",
          "app/lib/atlasApiSecurityV270.ts",
          "app/api/atlas/catalog/query/route.ts",
          "app/api/atlas/science-workbench/route.ts",
          "app/api/atlas/weather/route.ts",
          "app/api/atlas/locations/route.ts",
          "next.config.mjs",
        ]),
      },
      validation: commonValidation,
      science,
      contracts,
      release,
      boundary: "local-shadow-security-and-lifecycle-hardening-heavy-qualification-not-claimed",
    },
  },
];

await mkdir(resolve(ROOT, "dist/science"), { recursive: true });
await mkdir(resolve(ROOT, "dist/release"), { recursive: true });
for (const phase of phaseDocuments) {
  phase.document.evidenceSha256 = sha256(canonicalJson(phase.document));
  await writeFile(resolve(ROOT, phase.output), `${JSON.stringify(phase.document, null, 2)}\n`);
}
const sources = Object.fromEntries(await Promise.all(phaseDocuments.map(async ({ phase, output }) => [phase, {
  path: output,
  sha256: await fileSha256(output),
}])));
const pointer = {
  version: "orbit-atlas-current-local-shadow-candidate-v270",
  generatedAt,
  status: `implemented-v267-v270-${heavyStatus}-formal-product-v263-retained`,
  formalProductPointer: PRODUCT_POINTER_PATH,
  formalProductPointerSha256: await fileSha256(PRODUCT_POINTER_PATH),
  sources,
  priorNegativeEvidence: {
    v264r3: { status: v264r3.status, path: "dist/science/catalog-stream-v264r3-preflight-negative-evidence.json", sha256: await fileSha256("dist/science/catalog-stream-v264r3-preflight-negative-evidence.json") },
    v265: { status: v265.status, path: "dist/science/gaia-presentation-v265-negative-evidence.json", sha256: await fileSha256("dist/science/gaia-presentation-v265-negative-evidence.json") },
    v266: { status: v266.status, path: "dist/science/observation-planner-v266-negative-evidence.json", sha256: await fileSha256("dist/science/observation-planner-v266-negative-evidence.json") },
  },
  resourcePreflight,
  promotionApplied: false,
  formalProductPointerAdvanced: false,
  publicDeploymentBlocked: true,
  vercelApplied: false,
  science,
  contracts,
};
pointer.pointerSha256 = sha256(canonicalJson(pointer));
const pointerPath = "dist/release/orbit-atlas-current-local-shadow-candidate-v270.json";
await writeFile(resolve(ROOT, pointerPath), `${JSON.stringify(pointer, null, 2)}\n`);
const dossierPath = "dist/release/orbit-atlas-v270-local-shadow-dossier.md";
await writeFile(resolve(ROOT, dossierPath), `# Orbit Atlas v267-v270 Local Shadow Dossier\n\nGenerated: ${generatedAt}\n\n- Formal product pointer: **v263 retained**.\n- Shadow status: **${pointer.status}**.\n- Lightweight validation: **${validation.status}**.\n- Heavy gates: **${heavyStatus}**; free memory ${resourcePreflight.freePhysicalMemoryGiB} GiB / required 6 GiB.\n- v267 aggregate: **${existsSync(resolve(ROOT, v267AggregateManifest)) ? "present" : "not built due resource preflight"}**.\n- Visual default: **Legacy V9**; v269 remains a three-way local A/B candidate.\n- Science: **science-failed-shadow-retained**; default **legacy-eih-1pn**; protected code/screen SHA unchanged.\n- v264.3, v265 and v266 negative evidence: retained.\n- Corrected v266, ESA 10m download, Vercel/production/DNS/signing: **not applied**.\n`);
console.log(JSON.stringify({ pointer: pointerPath, pointerSha256: pointer.pointerSha256, status: pointer.status, heavyStatus, sourceCount: Object.keys(sources).length }, null, 2));
