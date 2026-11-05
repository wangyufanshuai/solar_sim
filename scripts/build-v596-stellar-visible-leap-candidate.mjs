import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync, realpathSync } from "node:fs";
import { mkdir, realpath, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  buildV596SourceManifest,
  canonicalShaV596,
} from "./build-v596-source-manifest.mjs";

export const V596_GENERATED_AT =
  process.env.ATLAS_V596_GENERATED_AT ?? "2026-08-31T00:00:00.000Z";
export const V596_FORMAL_PRODUCT_POINTER = "v263";
export const V596_CANDIDATE_VERSION =
  "v596-stellar-visible-leap-additive-candidate-v1";
export const V596_READY_STATUS = "ready-for-v596-formal-evidence-not-promoted";
export const V596_PENDING_STATUS = "blocked-pending-v596-formal-closure-tooling";

const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const V595_SOURCE_SHA256 =
  "e06febbe18cd65ad8d24bb618d09c93032ca7fa02d5d69e2d916ea3b8f802186";
const V595_CANDIDATE_SHA256 =
  "332b5ce6a0b5f26a4f9553d44cb9d0eb8d5cc169ae3242b4cd83259b669abae1";
const V595_RELEASE_SHA256 =
  "ea6a5247cf9708162df26acead217e23159f0d8793466dd98071888831866765";
const V595_RESEAL_SHA256 =
  "ccf9c5cbfc0418c25295a51fde4efdb1364d9a7206dfa056eb004fb53b5c9a13";

export const V596_OUTPUT_PATHS = Object.freeze({
  source: "docs/release/v596/source-manifest-v596.json",
  manifest: "public/data/stellar-visible-leap-v596/manifest.json",
  currentState: "public/data/stellar-visible-leap-v596/current-state.json",
  pointer: "docs/release/v596/capability-pointer-v596.json",
});

const V596_INPUT_PATHS = Object.freeze({
  parentCandidate: "public/data/stellar-relativity-v595/manifest.json",
  parentRelease: "docs/release/v595/release-export-v595.json",
  parentReseal: "docs/release/v595/reseal-receipt-v595.json",
});

const V596_VISIBLE_LEAP_ARCHETYPES = Object.freeze([
  "blue-supergiant-wind",
  "hot-radiative",
  "rapid-rotator-gravity-darkened",
  "solar-like-convective",
  "warm-radiative-convective",
  "cool-convective",
  "red-giant-supergiant",
]);

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function assert(condition, code) {
  if (!condition) throw new Error(code);
}

function resolveInside(root, value, label) {
  assert(typeof value === "string" && value.length > 0, `v596-path:${label}`);
  const portable = value.replaceAll("\\", "/");
  assert(!isAbsolute(value)
    && portable.split("/").every((part) => part.length > 0 && part !== "." && part !== ".."),
  `v596-noncanonical-path:${label}`);
  const workspace = resolve(root);
  const path = resolve(workspace, value);
  const relation = relative(workspace, path);
  assert(relation !== "" && relation !== ".." && !relation.startsWith(`..${sep}`)
    && !isAbsolute(relation), `v596-boundary:${label}`);
  return path;
}

function readJson(root, value, label) {
  const path = resolveInside(root, value, label);
  assert(existsSync(path), `v596-file-missing:${label}`);
  const metadata = lstatSync(path);
  assert(metadata.isFile() && !metadata.isSymbolicLink(), `v596-file-not-regular:${label}`);
  const relation = relative(realpathSync(resolve(root)), realpathSync(path));
  assert(relation !== "" && relation !== ".." && !relation.startsWith(`..${sep}`)
    && !isAbsolute(relation), `v596-realpath-boundary:${label}`);
  return JSON.parse(readFileSync(path, "utf8"));
}

function verifySeal(document, field, label) {
  assert(document && typeof document === "object" && !Array.isArray(document),
    `v596-seal-shape:${label}`);
  assert(SHA256_PATTERN.test(document[field] ?? ""), `v596-seal-value:${label}`);
  const unsigned = { ...document };
  const declared = unsigned[field];
  delete unsigned[field];
  assert(canonicalShaV596(unsigned) === declared, `v596-seal-invalid:${label}`);
  return declared;
}

function fileRecord(root, value, label = value) {
  const path = resolveInside(root, value, label);
  const bytes = readFileSync(path);
  return Object.freeze({ path: value, bytes: bytes.byteLength, sha256: sha256(bytes) });
}

function assertFalseAuthority(authority, label) {
  assert(authority && typeof authority === "object", `v596-authority-shape:${label}`);
  for (const field of [
    "scientificAuthorityGranted",
    "scientificPayloadMutationAllowed",
    "measuredAuthorityGranted",
    "gpuAuthorityGranted",
    "radiativeTransferGranted",
    "grmhdGranted",
    "geometryReferenceGranted",
    "polarizationTransportReferenceGranted",
    "productionReleaseAuthorized",
    "productionPromotionAllowed",
  ]) assert(authority[field] === false, `v596-authority-not-denied:${label}:${field}`);
}

function loadV595Parent(root, source) {
  const candidate = readJson(root, V596_INPUT_PATHS.parentCandidate, "parent-candidate");
  const release = readJson(root, V596_INPUT_PATHS.parentRelease, "parent-release");
  const reseal = readJson(root, V596_INPUT_PATHS.parentReseal, "parent-reseal");
  verifySeal(candidate, "manifestSha256", "parent-candidate");
  verifySeal(release, "dossierSha256", "parent-release");
  verifySeal(reseal, "receiptSha256", "parent-reseal");
  assert(source.baseSourceManifestSha256 === V595_SOURCE_SHA256
    && source.baseCandidateManifestSha256 === V595_CANDIDATE_SHA256
    && source.baseReleaseDossierSha256 === V595_RELEASE_SHA256
    && source.baseResealReceiptSha256 === V595_RESEAL_SHA256,
  "v596-parent-source-binding");
  assert(candidate.manifestSha256 === V595_CANDIDATE_SHA256
    && candidate.formalProductPointer === V596_FORMAL_PRODUCT_POINTER
    && candidate.authority?.productionPromotionAllowed === false,
  "v596-parent-candidate-binding");
  assert(release.dossierSha256 === V595_RELEASE_SHA256
    && release.qualification?.status
      === "qualified-additive-v595-stellar-relativity-candidate"
    && release.candidate?.sourceManifestSha256 === V595_SOURCE_SHA256
    && release.candidate?.candidateManifestSha256 === V595_CANDIDATE_SHA256
    && release.productionPromotionAllowed === false,
  "v596-parent-release-binding");
  assert(reseal.receiptSha256 === V595_RESEAL_SHA256
    && reseal.status === "passed-double-byte-identical-current-v595-reseal"
    && reseal.candidate?.sourceManifestSha256 === V595_SOURCE_SHA256
    && reseal.candidate?.candidateManifestSha256 === V595_CANDIDATE_SHA256,
  "v596-parent-reseal-binding");
  assertFalseAuthority(candidate.authority, "parent-candidate");
  assertFalseAuthority(release.authority, "parent-release");
  assertFalseAuthority(reseal.authority, "parent-reseal");
  return Object.freeze({ candidate, release, reseal });
}

function createAuthority() {
  return Object.freeze({
    defaultKernel: "legacy-eih-1pn",
    v2Mode: "shadow-only",
    scientificAuthorityGranted: false,
    scientificPayloadMutationAllowed: false,
    measuredAuthorityGranted: false,
    gpuAuthorityGranted: false,
    resolvedSurfaceAuthorityGranted: false,
    observationTextureAuthorityGranted: false,
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
    && !isAbsolute(relation)), "v596-output-root-boundary");
  await mkdir(destination, { recursive: true });
  const realDestination = await realpath(destination);
  const realRelation = relative(workspace, realDestination);
  assert(realDestination === workspace || (realRelation !== ".."
    && !realRelation.startsWith(`..${sep}`) && !isAbsolute(realRelation)),
  "v596-output-root-realpath-boundary");
  return realDestination;
}

async function writeJson(outputRoot, value, document) {
  const path = resolveInside(outputRoot, value, `output:${value}`);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(document, null, 2)}\n`, "utf8");
}

export async function buildV596StellarVisibleLeapCandidate(options = {}) {
  const root = resolve(options.root ?? process.cwd());
  const generatedAt = options.generatedAt ?? V596_GENERATED_AT;
  assert(typeof generatedAt === "string" && Number.isFinite(Date.parse(generatedAt)),
    "v596-generated-at");
  const outputRoot = await assertOutputRoot(root, options.outputRoot ?? root);
  const source = buildV596SourceManifest(root, { generatedAt });
  const pendingClosurePaths = source.pendingClosurePaths ?? [];
  if (pendingClosurePaths.length > 0 && options.allowPendingClosure !== true) {
    throw new Error(`v596-closure-source-pending:${pendingClosurePaths.join(",")}`);
  }
  const parent = loadV595Parent(root, source);
  const parentStellar = parent.candidate.stellar;
  const parentFamilies = parent.candidate.productSceneFamilies;
  const parentRelativity = parent.candidate.relativity;
  assert(parentStellar?.rosterCount === 24
    && parentStellar.presentationAdmittedCount === 24
    && parentStellar.measurementAdmittedCount === 0
    && parentStellar.presentationOnly === true
    && parentStellar.resolvedSurfaceClaim === false
    && parentStellar.observationTextureClaim === false,
  "v596-parent-stellar-contract");
  assert(parentFamilies?.familyCount === 6
    && parentFamilies.sharedMainCanvas === true
    && parentFamilies.webglCanvasCount === 1
    && parentFamilies.independentWebglSceneCountClaim === false,
  "v596-parent-scene-family-contract");
  assert(parentRelativity?.inheritedWeakFieldDefaultKernel === "legacy-eih-1pn"
    && parentRelativity.inheritedV2Mode === "shadow-only"
    && parentRelativity.timelikeKerr?.fixtureCount === 4
    && parentRelativity.timelikeKerr?.analyticAnchorCount === 3
    && parentRelativity.timelikeKerr?.referenceCandidateOnly === true
    && parentRelativity.timelikeKerr?.formalEvidence === false
    && parentRelativity.timelikeKerr?.promotion === "none",
  "v596-parent-relativity-contract");

  const closureToolingComplete = pendingClosurePaths.length === 0;
  const status = closureToolingComplete ? V596_READY_STATUS : V596_PENDING_STATUS;
  const authority = createAuthority();
  const unresolved = Object.freeze([
    "stellar-provenance-scientific-admission-remains-fail-closed-0-of-24",
    "physical-mobile-real-device-evidence-not-present",
    ...(closureToolingComplete ? [] : pendingClosurePaths.map((path) => `closure-source-pending:${path}`)),
    "v596-full-lite-24x2-lifecycle-cdp-exact-and-new-human-signoff-not-yet-bound",
  ]);
  const manifestUnsigned = {
    version: V596_CANDIDATE_VERSION,
    generatedAt,
    identityStage: "ready-for-formal-evidence-candidate-identity",
    status,
    route: "/",
    namespace: "stellar-visible-leap-v596",
    formalProductPointer: V596_FORMAL_PRODUCT_POINTER,
    governance: {
      additiveOnly: true,
      parentV595Immutable: true,
      parentSourceManifestSha256: source.baseSourceManifestSha256,
      parentCandidateManifestSha256: source.baseCandidateManifestSha256,
      parentReleaseDossierSha256: source.baseReleaseDossierSha256,
      parentResealReceiptSha256: source.baseResealReceiptSha256,
      sourceManifestSha256: source.receiptSha256,
      legacyDefaultKernelFrozen: true,
      v2ShadowOnly: true,
      priorV595HumanDecisionInherited: false,
      checkpointDecisionInheritedAsFinalSignoff: false,
    },
    parentV595: {
      status: parent.release.qualification.status,
      sourceManifestSha256: source.baseSourceManifestSha256,
      candidateManifestSha256: source.baseCandidateManifestSha256,
      releaseDossierSha256: source.baseReleaseDossierSha256,
      resealReceiptSha256: source.baseResealReceiptSha256,
      deploymentId: parent.release.candidate.deploymentId,
      buildId: parent.release.candidate.buildId,
      formalProductPointer: V596_FORMAL_PRODUCT_POINTER,
    },
    stellar: {
      admission: { ...parentStellar.admission },
      rosterCount: parentStellar.rosterCount,
      presentationAdmittedCount: parentStellar.presentationAdmittedCount,
      measurementAdmittedCount: parentStellar.measurementAdmittedCount,
      presentationOnly: true,
      resolvedSurfaceClaim: false,
      observationTextureClaim: false,
      visibleLeap: {
        version: "v596-stellar-visible-leap-candidate-surface-v1",
        archetypeCount: V596_VISIBLE_LEAP_ARCHETYPES.length,
        orderedArchetypes: V596_VISIBLE_LEAP_ARCHETYPES,
        rendererContract: fileRecord(root,
          "app/lib/stellarPortraitRenderContractV596.ts", "visible-leap-render-contract"),
        rendererImplementation: fileRecord(root,
          "app/components/StellarPortraitMaterialV596.tsx", "visible-leap-renderer"),
        formalEvidenceContract: fileRecord(root,
          "app/lib/v596FormalEvidenceContract.ts", "visible-leap-formal-evidence-contract"),
        exactEightPassHumanDecisionRequired: true,
        formalEvidence: "pending-current-identity-evidence",
        presentationOnly: true,
      },
      currentV596ScienceCinematicMatrix: "pending-current-identity-evidence",
    },
    productSceneFamilies: {
      contractVersion: parentFamilies.contractVersion,
      contractSha256: parentFamilies.contractSha256,
      orderedFamilyIds: [...parentFamilies.orderedFamilyIds],
      familyCount: parentFamilies.familyCount,
      sharedMainCanvas: true,
      webglCanvasCount: 1,
      independentWebglSceneCountClaim: false,
      inheritedFromParentV595CandidateManifestSha256: V595_CANDIDATE_SHA256,
      currentJourneyEvidence: "pending-current-identity-evidence",
    },
    relativity: {
      inheritedWeakFieldDefaultKernel: "legacy-eih-1pn",
      inheritedV2Mode: "shadow-only",
      inheritedV595CandidateManifestSha256: V595_CANDIDATE_SHA256,
      timelikeKerr: {
        status: parentRelativity.timelikeKerr.status,
        admissionSha256: parentRelativity.timelikeKerr.admissionSha256,
        receiptSha256: parentRelativity.timelikeKerr.receiptSha256,
        manifestSha256: parentRelativity.timelikeKerr.manifestSha256,
        summarySha256: parentRelativity.timelikeKerr.summarySha256,
        sourceSha256: parentRelativity.timelikeKerr.sourceSha256,
        fixtureCount: 4,
        analyticAnchorCount: 3,
        referenceCandidateOnly: true,
        formalEvidence: false,
        promotion: "none",
        relationship: "immutable-parent-v595-reference-candidate",
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
      realDesktopChrome: "pending-supplemental-only",
      realMobile: "not-present-not-faked",
      lifecycle: "pending",
      sameRealmSceneExit: "pending",
      cdpHeapSoak: "pending",
      exactAb: "pending-v595-to-v596-eight-pass-current-identity",
      humanVisualSignoff: "pending-new-v596-final-identity-challenge",
      doubleByteIdenticalReseal: "pending",
      readonlyVerifier: "pending",
    },
    authority,
    unresolved,
  };
  const manifest = Object.freeze({
    ...manifestUnsigned,
    manifestSha256: canonicalShaV596(manifestUnsigned),
  });
  const deploymentId =
    `v596-${source.receiptSha256.slice(0, 12)}-${manifest.manifestSha256.slice(0, 12)}`;
  assert(/^v596-[0-9a-f]{12}-[0-9a-f]{12}$/.test(deploymentId),
    "v596-deployment-identity");
  const currentStateUnsigned = {
    version: "v596-stellar-visible-leap-current-state-v1",
    generatedAt,
    identityStage: "ready-for-formal-evidence-current-state-identity",
    status,
    candidate: {
      route: "/",
      namespace: manifest.namespace,
      deploymentId,
      sourceManifestSha256: source.receiptSha256,
      manifestSha256: manifest.manifestSha256,
      parentV595ManifestSha256: source.baseCandidateManifestSha256,
      formalProductPointer: V596_FORMAL_PRODUCT_POINTER,
    },
    gates: {
      parentV595ImmutableReceiptsBound: true,
      oldV595HumanDecisionInherited: false,
      checkpointDecisionInheritedAsFinalSignoff: false,
      stellarRosterPresentationAdmitted24Of24: true,
      stellarProvenanceScientificAdmission: "blocked:0/24",
      visibleLeapArchetypesDeclared: "7/7",
      productSceneFamilyContractSixOfSix: true,
      singleCanvasPolicy: true,
      timelikeKerrReferenceFixturesInherited: "4/4",
      timelikeKerrAnalyticAnchorsInherited: "3/3",
      defaultKernelUnchanged: true,
      closureToolingComplete,
      formalClosureEvidenceBound: false,
    },
    evidence: {
      visibleLeapRendererContractSha256:
        manifest.stellar.visibleLeap.rendererContract.sha256,
      visibleLeapFormalEvidenceContractSha256:
        manifest.stellar.visibleLeap.formalEvidenceContract.sha256,
      parentTimelikeKerrAdmissionSha256: manifest.relativity.timelikeKerr.admissionSha256,
      parentTimelikeKerrReceiptSha256: manifest.relativity.timelikeKerr.receiptSha256,
    },
    qualificationLayer:
      "new-v596-evidence-and-human-decision-required-no-v595-decision-migration",
    authority,
    unresolved,
  };
  const currentState = Object.freeze({
    ...currentStateUnsigned,
    receiptSha256: canonicalShaV596(currentStateUnsigned),
  });
  const pointerUnsigned = {
    version: "v596-stellar-visible-leap-capability-pointer-v1",
    generatedAt,
    identityStage: "ready-for-formal-evidence-capability-pointer-identity",
    status,
    route: "/",
    namespace: manifest.namespace,
    deploymentId,
    sourceManifestSha256: source.receiptSha256,
    manifestSha256: manifest.manifestSha256,
    currentStateReceiptSha256: currentState.receiptSha256,
    parentV595CandidateManifestSha256: source.baseCandidateManifestSha256,
    parentV595ReleaseDossierSha256: source.baseReleaseDossierSha256,
    formalProductPointer: V596_FORMAL_PRODUCT_POINTER,
    authority,
    productionPromotionAllowed: false,
  };
  const pointer = Object.freeze({
    ...pointerUnsigned,
    pointerSha256: canonicalShaV596(pointerUnsigned),
  });

  await Promise.all([
    writeJson(outputRoot, V596_OUTPUT_PATHS.source, source),
    writeJson(outputRoot, V596_OUTPUT_PATHS.manifest, manifest),
    writeJson(outputRoot, V596_OUTPUT_PATHS.currentState, currentState),
    writeJson(outputRoot, V596_OUTPUT_PATHS.pointer, pointer),
  ]);
  return Object.freeze({
    status,
    sourceManifestSha256: source.receiptSha256,
    manifestSha256: manifest.manifestSha256,
    currentStateReceiptSha256: currentState.receiptSha256,
    pointerSha256: pointer.pointerSha256,
    deploymentId,
    pendingClosurePathCount: pendingClosurePaths.length,
    visibleLeapArchetypeCount: V596_VISIBLE_LEAP_ARCHETYPES.length,
    outputs: V596_OUTPUT_PATHS,
  });
}

function parseArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--allow-pending-closure") values.allowPendingClosure = true;
    else if (token === "--output-root" || token === "--generated-at") {
      values[token.slice(2).replace("-", "_")] = argv[++index];
    } else throw new Error(`v596-candidate-argument:${token}`);
  }
  return values;
}

if (process.argv[1]
  && pathToFileURL(resolve(process.argv[1])).href
    === pathToFileURL(fileURLToPath(import.meta.url)).href) {
  const args = parseArgs(process.argv.slice(2));
  buildV596StellarVisibleLeapCandidate({
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
