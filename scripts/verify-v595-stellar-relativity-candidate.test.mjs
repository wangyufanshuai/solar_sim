import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";

import {
  assertV595ResealKeySet,
  assertV595VerifierAuthority,
  assertV595VerifierGovernance,
  assertV595VerifierKnownZero,
  assertV595VerifierResealBindings,
  auditV595ReadonlyOperation,
  createV595ReadonlyResult,
  declaredV595ReceiptPaths,
  V595_VERIFIER_STATUS,
  verifyV595Readonly,
} from "./verify-v595-stellar-relativity-candidate.mjs";
import {
  V595_PARENT_V594_IDENTITY,
} from "./v595-formal-contract.mjs";

const sha = (character) => character.repeat(64);

function identity(deliveryTier, fingerprint) {
  const sourceManifestSha256 = sha("1");
  const candidateManifestSha256 = sha("2");
  return {
    sourceManifestSha256,
    candidateManifestSha256,
    buildFingerprint: fingerprint,
    buildId: `v595b-${fingerprint}`,
    deploymentId:
      `v595-${sourceManifestSha256.slice(0, 12)}-${candidateManifestSha256.slice(0, 12)}`,
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
    ...V595_PARENT_V594_IDENTITY,
    ...(immutable ? { immutable: true } : {}),
  };
}

function governanceFixture() {
  return {
    candidate: {
      formalProductPointer: "v263",
      parentV594: parent(),
      governance: {
        additiveOnly: true,
        parentV594Immutable: true,
        priorV594HumanDecisionInherited: false,
      },
    },
    browserGate: {
      priorV594HumanDecisionInherited: false,
      humanDecision: "separate-pending-not-generated",
      boundaries: {
        priorV594HumanDecisionInherited: false,
        priorV594HumanDecisionReceiptSha256: null,
        formalProductPointer: "v263",
      },
    },
    human: {
      parentV594: parent({ immutable: true }),
      policy: {
        priorV594DecisionRejected: true,
        priorV594HumanDecisionInherited: false,
      },
      decisionChallenge: { priorV594HumanDecisionInherited: false },
    },
    closure: {
      parentV594: parent({ immutable: true }),
      governance: {
        additiveOnly: true,
        parentV594Immutable: true,
        priorV594HumanDecisionInherited: false,
        currentV595HumanDecisionRequiredAndBound: true,
        formalProductPointer: "v263",
      },
      humanReview: { priorV594HumanDecisionInherited: false },
    },
    reseal: {
      parentV594: parent({ immutable: true }),
      priorV594HumanDecisionInherited: false,
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
      observations: {
        observedKnownZeroAfterDetach: true,
        observedKnownZeroAfterExit: true,
        rendererInfoAfterContextLoss: "explicitly-unavailable-not-zero",
      },
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

test("v595 verifier exposes a readonly qualified status", () => {
  assert.equal(
    V595_VERIFIER_STATUS,
    "passed-readonly-qualified-additive-v595-stellar-relativity-candidate",
  );
  const result = createV595ReadonlyResult({ sourceManifestSha256: sha("a") });
  assert.equal(result.writesPerformed, false);
  assert.equal(Object.isFrozen(result), true);
});

test("v595 verifier requires an exact sealed reseal key set", () => {
  const paths = ["a.json", "b.json"];
  const record = { bytes: 1, sha256: sha("a") };
  const outputs = Object.fromEntries(paths.map((path) => [path, { ...record }]));
  assert.doesNotThrow(() => assertV595ResealKeySet(outputs, paths));
  assert.throws(
    () => assertV595ResealKeySet({ "a.json": outputs["a.json"] }, paths),
    /key-set/,
  );
  assert.throws(
    () => assertV595ResealKeySet({ ...outputs, "extra.json": record }, paths),
    /key-set/,
  );
  assert.throws(
    () => assertV595ResealKeySet(outputs, ["a.json", "a.json"]),
    /alias/,
  );
  assert.throws(
    () => assertV595ResealKeySet({ ...outputs, "a.json": { ...record, path: "a.json" } }, paths),
    /output-record/,
  );
});

test("v595 declaration traversal caps containers but accepts wide scalar evidence", () => {
  const path = "tmp/v595-wide-scalar-evidence.json";
  const wideScalarEvidence = {
    samples: Array.from({ length: 50000 }, (_, index) => index),
    artifact: { path, bytes: 1, sha256: sha("a") },
  };
  assert.deepEqual([...declaredV595ReceiptPaths(wideScalarEvidence)], [path]);

  const excessiveContainers = Array.from({ length: 40000 }, () => ({}));
  assert.throws(
    () => declaredV595ReceiptPaths(excessiveContainers),
    /declaration-cap/,
  );
});

test("v595 verifier rejects unknown values substituted for observed zero", () => {
  const fixture = knownZeroFixture();
  assert.doesNotThrow(() => assertV595VerifierKnownZero(fixture));

  const unknown = structuredClone(fixture);
  unknown.soak.aggregation.unknownShardCount = null;
  assert.throws(() => assertV595VerifierKnownZero(unknown), /unknown-zero/);

  const negativeZero = structuredClone(fixture);
  negativeZero.closure.stellar.measurementAdmittedCount = -0;
  assert.throws(() => assertV595VerifierKnownZero(negativeZero), /unknown-zero/);

  const fakeMobile = structuredClone(fixture);
  fakeMobile.browserGate.supplemental.physicalMobile.evidence = {};
  assert.throws(() => assertV595VerifierKnownZero(fakeMobile), /not-faked/);
});

test("v595 verifier rejects authority elevation", () => {
  const fixture = authorityFixture();
  assert.doesNotThrow(() => assertV595VerifierAuthority(fixture));
  const elevated = structuredClone(fixture);
  elevated.browserGate.authority.gpuAuthorityGranted = true;
  assert.throws(() => assertV595VerifierAuthority(elevated), /authority-elevation/);
});

test("v595 verifier rejects inherited v594 human decisions", () => {
  const fixture = governanceFixture();
  assert.doesNotThrow(() => assertV595VerifierGovernance(fixture));
  const inherited = structuredClone(fixture);
  inherited.human.policy.priorV594HumanDecisionInherited = true;
  assert.throws(() => assertV595VerifierGovernance(inherited), /governance:human/);
  const parentDrift = structuredClone(fixture);
  parentDrift.reseal.parentV594.resealReceiptSha256 = sha("f");
  assert.throws(() => assertV595VerifierGovernance(parentDrift), /parent-v594-binding/);
});

test("v595 verifier rejects reseal identity and bound evidence drift", () => {
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
    qualificationStatus: "qualified-additive-v595-stellar-relativity-candidate",
    closureDossierSha256: closure.dossierSha256,
    humanDecisionSha256: human.decisionSha256,
    candidate: { ...full },
    liteCandidate: { ...lite },
  };
  assert.doesNotThrow(() => assertV595VerifierResealBindings({
    reseal,
    bundle,
    closure,
    human,
  }));

  const identityDrift = structuredClone(reseal);
  identityDrift.candidate = identity("standalone-full", sha("7"));
  assert.throws(
    () => assertV595VerifierResealBindings({
      reseal: identityDrift,
      bundle,
      closure,
      human,
    }),
    /identity-drift/,
  );

  const evidenceDrift = { ...reseal, closureDossierSha256: sha("8") };
  assert.throws(
    () => assertV595VerifierResealBindings({
      reseal: evidenceDrift,
      bundle,
      closure,
      human,
    }),
    /evidence-binding/,
  );
});

test("v595 readonly audit detects writes and rejects path escape", async () => {
  const root = await mkdtemp(resolve(tmpdir(), "v595-readonly-verifier-"));
  const path = "docs/release/v595/release-export-v595.json";
  try {
    await mkdir(dirname(resolve(root, path)), { recursive: true });
    await writeFile(resolve(root, path), "before\n", "utf8");
    await assert.rejects(auditV595ReadonlyOperation({
      root,
      paths: [path],
      operation: () => writeFile(resolve(root, path), "after\n", "utf8"),
    }), /readonly-files-mutated/);
    await assert.rejects(auditV595ReadonlyOperation({
      root,
      paths: ["../escape.json"],
      operation: async () => null,
    }), /formal-path|formal-boundary/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("v595 verifier fails closed when formal artifacts are absent", async () => {
  await assert.rejects(
    verifyV595Readonly({ root: "E:/does-not-exist-v595-fixture" }),
    /missing|ENOENT|workspace|source/i,
  );
});
