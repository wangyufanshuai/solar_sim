import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";

import {
  assertV596ResealKeySet,
  assertV596VerifierAuthority,
  assertV596VerifierGovernance,
  assertV596VerifierKnownZero,
  assertV596VerifierResealBindings,
  auditV596ReadonlyOperation,
  createV596ReadonlyResult,
  declaredV596ReceiptPaths,
  V596_VERIFIER_STATUS,
  verifyV596Readonly,
} from "./verify-v596-stellar-visible-leap-candidate.mjs";
import {
  V596_PARENT_V595_IDENTITY,
} from "./v596-formal-contract.mjs";

const sha = (character) => character.repeat(64);

function identity(deliveryTier, fingerprint) {
  const sourceManifestSha256 = sha("1");
  const candidateManifestSha256 = sha("2");
  return {
    sourceManifestSha256,
    candidateManifestSha256,
    buildFingerprint: fingerprint,
    buildId: `v596b-${fingerprint}`,
    deploymentId:
      `v596-${sourceManifestSha256.slice(0, 12)}-${candidateManifestSha256.slice(0, 12)}`,
    formalProductPointer: "v263",
    deliveryTier,
    bindingStatus: "bound",
  };
}

function authority() {
  return {
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
  };
}

function parent({ immutable = false } = {}) {
  return {
    ...V596_PARENT_V595_IDENTITY,
    ...(immutable ? { immutable: true } : {}),
  };
}

function governanceFixture() {
  return {
    candidate: {
      formalProductPointer: "v263",
      parentV595: parent(),
      governance: {
        additiveOnly: true,
        parentV595Immutable: true,
        priorV595HumanDecisionInherited: false,
      },
    },
    browserGate: {
      priorV595HumanDecisionInherited: false,
      humanDecision: "separate-pending-not-generated",
      boundaries: {
        priorV595HumanDecisionInherited: false,
        priorV595HumanDecisionReceiptSha256: null,
        formalProductPointer: "v263",
      },
    },
    human: {
      parentV595: parent({ immutable: true }),
      policy: {
        priorV595DecisionRejected: true,
        priorV595HumanDecisionInherited: false,
      },
      decisionChallenge: { priorV595HumanDecisionInherited: false },
    },
    closure: {
      parentV595: parent({ immutable: true }),
      governance: {
        additiveOnly: true,
        parentV595Immutable: true,
        priorV595HumanDecisionInherited: false,
        currentV596HumanDecisionRequiredAndBound: true,
        formalProductPointer: "v263",
      },
      humanReview: { priorV595HumanDecisionInherited: false },
    },
    reseal: {
      parentV595: parent({ immutable: true }),
      priorV595HumanDecisionInherited: false,
      formalProductPointer: "v263",
    },
  };
}

function authorityFixture() {
  const shared = authority();
  const documents = Object.fromEntries([
    "candidate",
    "lifecycle",
    "soak",
    "lite",
    "browserGate",
    "human",
    "closure",
    "reseal",
  ].map((label) => [label, { authority: { ...shared } }]));
  documents.candidate.relativity = {
    inheritedWeakFieldDefaultKernel: "legacy-eih-1pn",
    inheritedV2Mode: "shadow-only",
  };
  documents.browserGate.boundaries = {
    scientificPayloadMutationAllowed: false,
    productionPromotionAllowed: false,
  };
  documents.human.policy = { scientificPayloadWriteback: false };
  documents.closure.productionPromotionAllowed = false;
  Object.assign(documents.reseal, {
    scientificPayloadMutationAllowed: false,
    measuredAuthorityGranted: false,
    gpuAuthorityGranted: false,
    resolvedSurfaceAuthorityGranted: false,
    observationTextureAuthorityGranted: false,
    radiativeTransferGranted: false,
    grmhdGranted: false,
    productionPromotionAllowed: false,
    productionReleaseAuthorized: false,
  });
  return documents;
}

function knownZeroFixture() {
  return {
    candidate: { stellar: { measurementAdmittedCount: 0 } },
    lifecycle: {
      sampleCount: 17,
      stellarStateCount: 14,
      sameRealm: true,
      sameCanvas: true,
      singleCanvas: true,
      exactReturn: true,
      rawPrototypeCensusExactReturn: true,
    },
    soak: {
      aggregation: { unknownShardCount: 0, failedShardCount: 0 },
      rendererInfoAfterContextLoss: "explicitly-unavailable-not-zero",
    },
    browserGate: {
      supplemental: {
        physicalMobile: {
          status: "not-present-not-faked",
          evidence: null,
          emulatedViewportSubstitutionAllowed: false,
        },
      },
    },
    closure: {
      stellar: { measurementAdmittedCount: 0 },
      gates: {
        unknownAndZeroFailClosed: true,
        physicalMobileNotPresentNotFaked: true,
      },
      unresolved: ["physical-mobile-real-device-evidence-not-present"],
    },
  };
}

test("v596 verifier exposes a readonly qualified status", () => {
  assert.equal(
    V596_VERIFIER_STATUS,
    "passed-readonly-qualified-additive-v596-stellar-visible-leap-candidate",
  );
  const result = createV596ReadonlyResult({ sourceManifestSha256: sha("a") });
  assert.equal(result.writesPerformed, false);
  assert.equal(Object.isFrozen(result), true);
});

test("v596 verifier requires an exact sealed reseal key set", () => {
  const paths = ["a.json", "b.json"];
  const record = { bytes: 1, sha256: sha("a") };
  const outputs = Object.fromEntries(paths.map((path) => [path, { ...record }]));
  assert.doesNotThrow(() => assertV596ResealKeySet(outputs, paths));
  assert.throws(
    () => assertV596ResealKeySet({ "a.json": outputs["a.json"] }, paths),
    /key-set/,
  );
  assert.throws(
    () => assertV596ResealKeySet({ ...outputs, "extra.json": record }, paths),
    /key-set/,
  );
  assert.throws(
    () => assertV596ResealKeySet(outputs, ["a.json", "a.json"]),
    /alias/,
  );
  assert.throws(
    () => assertV596ResealKeySet({ ...outputs, "a.json": { ...record, path: "a.json" } }, paths),
    /output-record/,
  );
});

test("v596 declaration traversal caps containers but accepts wide scalar evidence", () => {
  const path = "tmp/v596-wide-scalar-evidence.json";
  const wideScalarEvidence = {
    samples: Array.from({ length: 50000 }, (_, index) => index),
    artifact: { path, bytes: 1, sha256: sha("a") },
  };
  assert.deepEqual([...declaredV596ReceiptPaths(wideScalarEvidence)], [path]);

  const excessiveContainers = Array.from({ length: 40000 }, () => ({}));
  assert.throws(
    () => declaredV596ReceiptPaths(excessiveContainers),
    /declaration-cap/,
  );
});

test("v596 verifier rejects unknown values substituted for observed zero", () => {
  const fixture = knownZeroFixture();
  assert.doesNotThrow(() => assertV596VerifierKnownZero(fixture));

  const unknown = structuredClone(fixture);
  unknown.soak.aggregation.unknownShardCount = null;
  assert.throws(() => assertV596VerifierKnownZero(unknown), /unknown-zero/);

  const negativeZero = structuredClone(fixture);
  negativeZero.closure.stellar.measurementAdmittedCount = -0;
  assert.throws(() => assertV596VerifierKnownZero(negativeZero), /unknown-zero/);

  const fakeMobile = structuredClone(fixture);
  fakeMobile.browserGate.supplemental.physicalMobile.evidence = {};
  assert.throws(() => assertV596VerifierKnownZero(fakeMobile), /not-faked/);
});

test("v596 verifier rejects authority elevation", () => {
  const fixture = authorityFixture();
  assert.doesNotThrow(() => assertV596VerifierAuthority(fixture));
  const elevated = structuredClone(fixture);
  elevated.browserGate.authority.gpuAuthorityGranted = true;
  assert.throws(() => assertV596VerifierAuthority(elevated), /authority-elevation/);
});

test("v596 verifier rejects inherited v595 human decisions", () => {
  const fixture = governanceFixture();
  assert.doesNotThrow(() => assertV596VerifierGovernance(fixture));
  const inherited = structuredClone(fixture);
  inherited.human.policy.priorV595HumanDecisionInherited = true;
  assert.throws(() => assertV596VerifierGovernance(inherited), /governance:human/);
  const parentDrift = structuredClone(fixture);
  parentDrift.reseal.parentV595.resealReceiptSha256 = sha("f");
  assert.throws(() => assertV596VerifierGovernance(parentDrift), /parent-v595-binding/);
});

test("v596 verifier rejects reseal identity and bound evidence drift", () => {
  const full = identity("standalone-full", sha("3"));
  const lite = identity("vercel-lite", sha("4"));
  const bundle = {
    source: { generatedAt: "2026-08-28T00:00:00.000Z" },
    identities: { standalone: full, lite },
  };
  const closure = { dossierSha256: sha("5") };
  const human = { decisionSha256: sha("6") };
  const reseal = {
    generatedAt: bundle.source.generatedAt,
    qualificationStatus: "qualified-additive-v596-stellar-visible-leap-candidate",
    closureDossierSha256: closure.dossierSha256,
    humanDecisionSha256: human.decisionSha256,
    candidate: { ...full },
    liteCandidate: { ...lite },
  };
  assert.doesNotThrow(() => assertV596VerifierResealBindings({
    reseal,
    bundle,
    closure,
    human,
  }));

  const identityDrift = structuredClone(reseal);
  identityDrift.candidate = identity("standalone-full", sha("7"));
  assert.throws(
    () => assertV596VerifierResealBindings({
      reseal: identityDrift,
      bundle,
      closure,
      human,
    }),
    /identity-drift/,
  );

  const evidenceDrift = { ...reseal, closureDossierSha256: sha("8") };
  assert.throws(
    () => assertV596VerifierResealBindings({
      reseal: evidenceDrift,
      bundle,
      closure,
      human,
    }),
    /evidence-binding/,
  );
});

test("v596 readonly audit detects writes and rejects path escape", async () => {
  const root = await mkdtemp(resolve(tmpdir(), "v596-readonly-verifier-"));
  const path = "docs/release/v596/release-export-v596.json";
  try {
    await mkdir(dirname(resolve(root, path)), { recursive: true });
    await writeFile(resolve(root, path), "before\n", "utf8");
    await assert.rejects(auditV596ReadonlyOperation({
      root,
      paths: [path],
      operation: () => writeFile(resolve(root, path), "after\n", "utf8"),
    }), /readonly-files-mutated/);
    await assert.rejects(auditV596ReadonlyOperation({
      root,
      paths: ["../escape.json"],
      operation: async () => null,
    }), /formal-path|formal-boundary/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("v596 verifier fails closed when formal artifacts are absent", async () => {
  await assert.rejects(
    verifyV596Readonly({ root: "E:/does-not-exist-v596-fixture" }),
    /missing|ENOENT|workspace|source/i,
  );
});
