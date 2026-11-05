import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { mkdir, realpath, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  ATLAS_PRODUCT_SCENE_FAMILY_CONTRACT_V595,
  ATLAS_PRODUCT_SCENE_FAMILY_CONTRACT_V595_VERSION,
  ATLAS_PRODUCT_SCENE_FAMILY_ORDER_V595,
} from "../app/lib/atlasProductSceneFamilyContractV595.ts";
import {
  buildV595SourceManifest,
  canonicalShaV595,
} from "./build-v595-source-manifest.mjs";

export const V595_GENERATED_AT =
  process.env.ATLAS_V595_GENERATED_AT ?? "2026-08-28T00:00:00.000Z";
export const V595_FORMAL_PRODUCT_POINTER = "v263";
export const V595_CANDIDATE_VERSION =
  "v595-stellar-relativity-additive-candidate-v1";
export const V595_READY_STATUS = "ready-for-v595-formal-evidence-not-promoted";
export const V595_PENDING_STATUS = "blocked-pending-v595-formal-closure-tooling";

const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const V594_SOURCE_SHA256 =
  "6599398a6fab78a1367b234d3a3e9ed428027879a1df4838f76b97ff279b981f";
const V594_CANDIDATE_SHA256 =
  "e92484940ba9a812d0936bbd67b29c4cb3c3ac20d9477cd04a949e35efd33bad";
const V594_RELEASE_SHA256 =
  "a70645f4a124b6fb6d1eb3a061eb15cf66618154c1a2884acc1730cb41bd3865";
const V594_RESEAL_SHA256 =
  "406bb72a58aade66c877c75f4bea220e8b42181217efee1e4d9a1d20b46e4664";

export const V595_OUTPUT_PATHS = Object.freeze({
  source: "docs/release/v595/source-manifest-v595.json",
  manifest: "public/data/stellar-relativity-v595/manifest.json",
  currentState: "public/data/stellar-relativity-v595/current-state.json",
  pointer: "docs/release/v595/capability-pointer-v595.json",
});

const V595_INPUT_PATHS = Object.freeze({
  parentCandidate: "public/data/stellar-relativity-v594/manifest.json",
  parentRelease: "docs/release/v594/release-export-v594.json",
  parentReseal: "docs/release/v594/reseal-receipt-v594.json",
  timelikeAdmission:
    "public/data/post-v593-stellar-relativity/timelike-kerr-reference-v595.json",
  timelikeReceipt:
    "docs/release/post-v593/timelike-kerr-reference-receipt-v595.json",
});

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function assert(condition, code) {
  if (!condition) throw new Error(code);
}

function resolveInside(root, value, label) {
  assert(typeof value === "string" && value.length > 0, `v595-path:${label}`);
  const portable = value.replaceAll("\\", "/");
  assert(!isAbsolute(value)
    && portable.split("/").every((part) => part.length > 0 && part !== "." && part !== ".."),
  `v595-noncanonical-path:${label}`);
  const workspace = resolve(root);
  const path = resolve(workspace, value);
  const relation = relative(workspace, path);
  assert(relation !== "" && relation !== ".." && !relation.startsWith(`..${sep}`)
    && !isAbsolute(relation), `v595-boundary:${label}`);
  return path;
}

function readJson(root, value, label) {
  const path = resolveInside(root, value, label);
  assert(existsSync(path) && statSync(path).isFile(), `v595-file-missing:${label}`);
  return JSON.parse(readFileSync(path, "utf8"));
}

function verifySeal(document, field, label) {
  assert(document && typeof document === "object" && !Array.isArray(document),
    `v595-seal-shape:${label}`);
  assert(SHA256_PATTERN.test(document[field] ?? ""), `v595-seal-value:${label}`);
  const unsigned = { ...document };
  const declared = unsigned[field];
  delete unsigned[field];
  assert(canonicalShaV595(unsigned) === declared, `v595-seal-invalid:${label}`);
  return declared;
}

function fileRecord(root, value, label = value) {
  const path = resolveInside(root, value, label);
  const bytes = readFileSync(path);
  return Object.freeze({
    path: value.replaceAll("\\", "/"),
    bytes: bytes.byteLength,
    sha256: sha256(bytes),
  });
}

function assertFalseAuthority(authority, label) {
  assert(authority && typeof authority === "object", `v595-authority-shape:${label}`);
  for (const field of [
    "scientificAuthorityGranted",
    "measuredAuthorityGranted",
    "gpuAuthorityGranted",
  ]) assert(authority[field] === false, `v595-authority-not-denied:${label}:${field}`);
  if ("scientificPayloadMutationAllowed" in authority) {
    assert(authority.scientificPayloadMutationAllowed === false,
      `v595-authority-not-denied:${label}:scientificPayloadMutationAllowed`);
  }
}

function loadV594Parent(root, source) {
  const candidate = readJson(root, V595_INPUT_PATHS.parentCandidate, "parent-candidate");
  const release = readJson(root, V595_INPUT_PATHS.parentRelease, "parent-release");
  const reseal = readJson(root, V595_INPUT_PATHS.parentReseal, "parent-reseal");
  verifySeal(candidate, "manifestSha256", "parent-candidate");
  verifySeal(release, "dossierSha256", "parent-release");
  verifySeal(reseal, "receiptSha256", "parent-reseal");
  assert(source.baseSourceManifestSha256 === V594_SOURCE_SHA256
    && source.baseCandidateManifestSha256 === V594_CANDIDATE_SHA256
    && source.baseReleaseDossierSha256 === V594_RELEASE_SHA256
    && source.baseResealReceiptSha256 === V594_RESEAL_SHA256,
  "v595-parent-source-binding");
  assert(candidate.manifestSha256 === V594_CANDIDATE_SHA256
    && candidate.formalProductPointer === V595_FORMAL_PRODUCT_POINTER
    && candidate.authority?.productionPromotionAllowed === false,
  "v595-parent-candidate-binding");
  assert(release.dossierSha256 === V594_RELEASE_SHA256
    && release.qualification?.status
      === "qualified-additive-v594-stellar-relativity-candidate"
    && release.productionPromotionAllowed === false,
  "v595-parent-release-binding");
  assert(reseal.receiptSha256 === V594_RESEAL_SHA256
    && reseal.status === "passed-double-byte-identical-reseal"
    && reseal.byteIdentical === true
    && reseal.productionPromotionAllowed === false,
  "v595-parent-reseal-binding");
  assertFalseAuthority(candidate.authority, "parent-candidate");
  assertFalseAuthority(release.authority, "parent-release");
  assertFalseAuthority(reseal.authority, "parent-reseal");
  return Object.freeze({ candidate, release, reseal });
}

function loadTimelikeKerrAdmission(root) {
  const admission = readJson(root, V595_INPUT_PATHS.timelikeAdmission, "timelike-admission");
  const receipt = readJson(root, V595_INPUT_PATHS.timelikeReceipt, "timelike-receipt");
  verifySeal(admission, "admissionSha256", "timelike-admission");
  verifySeal(receipt, "receiptSha256", "timelike-receipt");
  const record = fileRecord(root, V595_INPUT_PATHS.timelikeAdmission, "timelike-admission");
  assert(admission.version === "v595-timelike-kerr-web-admission-v1"
    && admission.status === "admitted-reference-candidate-not-promoted"
    && admission.hostBase?.sourceManifestSha256 === V594_SOURCE_SHA256
    && admission.hostBase?.candidateManifestSha256 === V594_CANDIDATE_SHA256
    && admission.gates?.allQualified === true
    && admission.fixtures?.length === 4
    && admission.fixtures.every((row) => row.qualified === true)
    && admission.analyticAnchors?.length === 3
    && admission.analyticAnchors.every((row) => row.qualified === true),
  "v595-timelike-admission-contract");
  assert(receipt.version === "v595-timelike-kerr-web-admission-receipt-v1"
    && receipt.status === "passed-source-bound-compact-admission-not-promoted"
    && receipt.output?.path === V595_INPUT_PATHS.timelikeAdmission
    && receipt.output?.bytes === record.bytes
    && receipt.output?.sha256 === record.sha256
    && receipt.output?.admissionSha256 === admission.admissionSha256
    && receipt.validation?.writesPerformedByExternalVerifier === false,
  "v595-timelike-receipt-contract");
  assertFalseAuthority(admission.authority, "timelike-admission");
  assertFalseAuthority(receipt.authority, "timelike-receipt");
  for (const authority of [admission.authority, receipt.authority]) {
    assert(authority.formalEvidence === false
      && authority.promotion === "none"
      && authority.radiativeTransferAuthorityGranted === false
      && authority.grmhdAuthorityGranted === false
      && authority.productionAuthorityGranted === false
      && authority.webTeachingKernelModified === false,
    "v595-timelike-authority-boundary");
  }
  return Object.freeze({ admission, receipt, record });
}

function createAuthority() {
  return Object.freeze({
    defaultKernel: "legacy-eih-1pn",
    v2Mode: "shadow-only",
    scientificAuthorityGranted: false,
    scientificPayloadMutationAllowed: false,
    measuredAuthorityGranted: false,
    gpuAuthorityGranted: false,
    radiativeTransferGranted: false,
    grmhdGranted: false,
    geometryReferenceGranted: false,
    polarizationTransportReferenceGranted: false,
    productionReleaseAuthorized: false,
    productionPromotionAllowed: false,
  });
}

async function assertOutputRoot(root, outputRoot) {
  const workspace = await realpath(resolve(root));
  const destination = resolve(outputRoot);
  const relation = relative(workspace, destination);
  assert(destination === workspace || (relation !== ".." && !relation.startsWith(`..${sep}`)
    && !isAbsolute(relation)), "v595-output-root-boundary");
  await mkdir(destination, { recursive: true });
  const realDestination = await realpath(destination);
  const realRelation = relative(workspace, realDestination);
  assert(realDestination === workspace || (realRelation !== ".."
    && !realRelation.startsWith(`..${sep}`) && !isAbsolute(realRelation)),
  "v595-output-root-realpath-boundary");
  return realDestination;
}

async function writeJson(outputRoot, value, document) {
  const path = resolveInside(outputRoot, value, `output:${value}`);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(document, null, 2)}\n`, "utf8");
}

export async function buildV595StellarRelativityCandidate(options = {}) {
  const root = resolve(options.root ?? process.cwd());
  const generatedAt = options.generatedAt ?? V595_GENERATED_AT;
  assert(typeof generatedAt === "string" && Number.isFinite(Date.parse(generatedAt)),
    "v595-generated-at");
  const outputRoot = await assertOutputRoot(root, options.outputRoot ?? root);
  const source = buildV595SourceManifest(root, { generatedAt });
  const pendingClosurePaths = source.pendingClosurePaths ?? [];
  if (pendingClosurePaths.length > 0 && options.allowPendingClosure !== true) {
    throw new Error(`v595-closure-source-pending:${pendingClosurePaths.join(",")}`);
  }
  const parent = loadV594Parent(root, source);
  const stellarAdmission = parent.candidate.stellar?.admission;
  assert(stellarAdmission?.rosterCount === 24
    && stellarAdmission.schemaCompleteCount === 24
    && Number.isInteger(stellarAdmission.identityBoundCount)
    && stellarAdmission.identityBoundCount >= 0
    && Number.isInteger(stellarAdmission.renderAnchorOnlyCount)
    && stellarAdmission.renderAnchorOnlyCount >= 0
    && stellarAdmission.identityBoundCount + stellarAdmission.renderAnchorOnlyCount === 24
    && stellarAdmission.measurementAdmittedCount === 0
    && stellarAdmission.provenanceAdmittedCount === 0
    && stellarAdmission.presentationAdmittedCount === 24,
  "v595-parent-stellar-admission-contract");
  const timelike = loadTimelikeKerrAdmission(root);
  const closureToolingComplete = pendingClosurePaths.length === 0;
  const status = closureToolingComplete ? V595_READY_STATUS : V595_PENDING_STATUS;
  const deploymentId = `v595-${source.receiptSha256.slice(0, 12)}-pending000000`;
  const authority = createAuthority();
  const sceneContractValue = Object.freeze({
    version: ATLAS_PRODUCT_SCENE_FAMILY_CONTRACT_V595_VERSION,
    order: ATLAS_PRODUCT_SCENE_FAMILY_ORDER_V595,
    families: ATLAS_PRODUCT_SCENE_FAMILY_CONTRACT_V595,
  });
  const sceneContractSha256 = canonicalShaV595(sceneContractValue);
  const unresolved = Object.freeze([
    "stellar-provenance-scientific-admission-remains-fail-closed-0-of-24",
    "physical-mobile-real-device-evidence-not-present",
    ...(closureToolingComplete ? [] : pendingClosurePaths.map((path) => `closure-source-pending:${path}`)),
    "v595-full-lite-product-family-24x2-real-desktop-lifecycle-cdp-exact-and-human-signoff-not-yet-bound",
  ]);
  const manifestUnsigned = {
    version: V595_CANDIDATE_VERSION,
    generatedAt,
    identityStage: "ready-for-formal-evidence-candidate-identity",
    status,
    route: "/",
    namespace: "stellar-relativity-v595",
    formalProductPointer: V595_FORMAL_PRODUCT_POINTER,
    governance: {
      additiveOnly: true,
      parentV594Immutable: true,
      parentSourceManifestSha256: source.baseSourceManifestSha256,
      parentCandidateManifestSha256: source.baseCandidateManifestSha256,
      parentReleaseDossierSha256: source.baseReleaseDossierSha256,
      parentResealReceiptSha256: source.baseResealReceiptSha256,
      sourceManifestSha256: source.receiptSha256,
      legacyDefaultKernelFrozen: true,
      v2ShadowOnly: true,
      priorV594HumanDecisionInherited: false,
    },
    parentV594: {
      status: parent.release.qualification.status,
      sourceManifestSha256: source.baseSourceManifestSha256,
      candidateManifestSha256: source.baseCandidateManifestSha256,
      releaseDossierSha256: source.baseReleaseDossierSha256,
      resealReceiptSha256: source.baseResealReceiptSha256,
      deploymentId: parent.release.candidate?.deploymentId,
      formalProductPointer: V595_FORMAL_PRODUCT_POINTER,
    },
    stellar: {
      inheritedCandidateManifestSha256: parent.candidate.stellar?.manifestSha256,
      inheritedReceiptSha256: parent.candidate.stellar?.receiptSha256,
      admission: { ...stellarAdmission },
      rosterCount: stellarAdmission.rosterCount,
      presentationAdmittedCount: stellarAdmission.presentationAdmittedCount,
      measurementAdmittedCount: stellarAdmission.measurementAdmittedCount,
      presentationOnly: true,
      resolvedSurfaceClaim: false,
      observationTextureClaim: false,
      currentV595ScienceCinematicMatrix: "pending-current-identity-evidence",
    },
    productSceneFamilies: {
      contractVersion: ATLAS_PRODUCT_SCENE_FAMILY_CONTRACT_V595_VERSION,
      contractSha256: sceneContractSha256,
      orderedFamilyIds: ATLAS_PRODUCT_SCENE_FAMILY_ORDER_V595,
      familyCount: ATLAS_PRODUCT_SCENE_FAMILY_ORDER_V595.length,
      sharedMainCanvas: true,
      webglCanvasCount: 1,
      independentWebglSceneCountClaim: false,
      contractSource: fileRecord(root,
        "app/lib/atlasProductSceneFamilyContractV595.ts", "product-scene-contract"),
      currentJourneyEvidence: "pending-current-identity-evidence",
    },
    relativity: {
      inheritedWeakFieldDefaultKernel: "legacy-eih-1pn",
      inheritedV2Mode: "shadow-only",
      inheritedV594CandidateManifestSha256: source.baseCandidateManifestSha256,
      timelikeKerr: {
        status: timelike.admission.status,
        admissionSha256: timelike.admission.admissionSha256,
        receiptSha256: timelike.receipt.receiptSha256,
        manifestSha256: timelike.admission.source.manifestSha256,
        summarySha256: timelike.admission.source.summarySha256,
        sourceSha256: timelike.admission.source.sourceSha256,
        fixtureCount: timelike.admission.fixtures.length,
        analyticAnchorCount: timelike.admission.analyticAnchors.length,
        dynamicThetaAndPolarMomentumQualified: true,
        convergenceAndReverseTimeQualified: true,
        independentReferenceQualified: true,
        referenceCandidateOnly: true,
        formalEvidence: false,
        promotion: "none",
        admission: timelike.record,
        receipt: fileRecord(root, V595_INPUT_PATHS.timelikeReceipt, "timelike-receipt"),
      },
    },
    closure: {
      toolingComplete: closureToolingComplete,
      sourcePaths: source.closureSourcePaths,
      formalEvidenceBound: false,
      fullBuild: "pending",
      liteBuild: "pending",
      productSceneFamilyJourneys: "pending",
      stellarScienceCinematic24x2: "pending",
      realDesktopChrome: "pending",
      realMobile: "not-present-not-faked",
      lifecycle: "pending",
      sameRealmSceneExit: "pending",
      cdpHeapSoak: "pending",
      exactAb: "pending",
      humanVisualSignoff: "pending-new-v595-challenge",
      doubleByteIdenticalReseal: "pending",
      readonlyVerifier: "pending",
    },
    authority,
    unresolved,
  };
  const manifest = Object.freeze({
    ...manifestUnsigned,
    manifestSha256: canonicalShaV595(manifestUnsigned),
  });
  const boundDeploymentId = `v595-${source.receiptSha256.slice(0, 12)}-${manifest.manifestSha256.slice(0, 12)}`;
  assert(/^v595-[0-9a-f]{12}-[0-9a-f]{12}$/.test(boundDeploymentId),
    "v595-deployment-identity");
  // This temporary value exists only while the candidate hash is being formed;
  // no serialized artifact contains it.
  assert(deploymentId.endsWith("pending000000"), "v595-deployment-preimage-sentinel");
  const currentStateUnsigned = {
    version: "v595-stellar-relativity-current-state-v1",
    generatedAt,
    identityStage: "ready-for-formal-evidence-current-state-identity",
    status,
    candidate: {
      route: "/",
      namespace: manifest.namespace,
      deploymentId: boundDeploymentId,
      sourceManifestSha256: source.receiptSha256,
      manifestSha256: manifest.manifestSha256,
      parentV594ManifestSha256: source.baseCandidateManifestSha256,
      formalProductPointer: V595_FORMAL_PRODUCT_POINTER,
    },
    gates: {
      parentV594ImmutableReceiptsBound: true,
      oldV594HumanDecisionInherited: false,
      stellarRosterPresentationAdmitted24Of24: true,
      stellarProvenanceScientificAdmission: "blocked:0/24",
      productSceneFamilyContractSixOfSix: true,
      singleCanvasPolicy: true,
      timelikeKerrReferenceFixturesQualified: "4/4",
      timelikeKerrAnalyticAnchorsQualified: "3/3",
      defaultKernelUnchanged: true,
      closureToolingComplete,
      formalClosureEvidenceBound: false,
    },
    evidence: {
      productSceneFamilyContractSha256: sceneContractSha256,
      timelikeKerrAdmissionSha256: timelike.admission.admissionSha256,
      timelikeKerrReceiptSha256: timelike.receipt.receiptSha256,
      timelikeKerrManifestSha256: timelike.admission.source.manifestSha256,
      timelikeKerrSummarySha256: timelike.admission.source.summarySha256,
      timelikeKerrSourceSha256: timelike.admission.source.sourceSha256,
    },
    qualificationLayer:
      "new-v595-evidence-and-human-decision-required-no-v594-decision-migration",
    authority,
    unresolved,
  };
  const currentState = Object.freeze({
    ...currentStateUnsigned,
    receiptSha256: canonicalShaV595(currentStateUnsigned),
  });
  const pointerUnsigned = {
    version: "v595-stellar-relativity-capability-pointer-v1",
    generatedAt,
    identityStage: "ready-for-formal-evidence-capability-pointer-identity",
    status,
    route: "/",
    namespace: manifest.namespace,
    deploymentId: boundDeploymentId,
    sourceManifestSha256: source.receiptSha256,
    manifestSha256: manifest.manifestSha256,
    currentStateReceiptSha256: currentState.receiptSha256,
    parentV594CandidateManifestSha256: source.baseCandidateManifestSha256,
    parentV594ReleaseDossierSha256: source.baseReleaseDossierSha256,
    formalProductPointer: V595_FORMAL_PRODUCT_POINTER,
    authority,
    productionPromotionAllowed: false,
  };
  const pointer = Object.freeze({
    ...pointerUnsigned,
    pointerSha256: canonicalShaV595(pointerUnsigned),
  });

  await Promise.all([
    writeJson(outputRoot, V595_OUTPUT_PATHS.source, source),
    writeJson(outputRoot, V595_OUTPUT_PATHS.manifest, manifest),
    writeJson(outputRoot, V595_OUTPUT_PATHS.currentState, currentState),
    writeJson(outputRoot, V595_OUTPUT_PATHS.pointer, pointer),
  ]);
  return Object.freeze({
    status,
    sourceManifestSha256: source.receiptSha256,
    manifestSha256: manifest.manifestSha256,
    currentStateReceiptSha256: currentState.receiptSha256,
    pointerSha256: pointer.pointerSha256,
    deploymentId: boundDeploymentId,
    pendingClosurePathCount: pendingClosurePaths.length,
    sceneContractSha256,
    timelikeKerrAdmissionSha256: timelike.admission.admissionSha256,
    outputs: V595_OUTPUT_PATHS,
  });
}

function parseArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--allow-pending-closure") values.allowPendingClosure = true;
    else if (token === "--output-root" || token === "--generated-at") {
      values[token.slice(2).replace("-", "_")] = argv[++index];
    } else throw new Error(`v595-candidate-argument:${token}`);
  }
  return values;
}

if (process.argv[1]
  && pathToFileURL(resolve(process.argv[1])).href === pathToFileURL(fileURLToPath(import.meta.url)).href) {
  const args = parseArgs(process.argv.slice(2));
  buildV595StellarRelativityCandidate({
    outputRoot: args.output_root,
    generatedAt: args.generated_at,
    allowPendingClosure: args.allowPendingClosure === true,
  }).then((result) => {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  }).catch((error) => {
    console.error(error instanceof Error ? error.stack : String(error));
    process.exitCode = 1;
  });
}
