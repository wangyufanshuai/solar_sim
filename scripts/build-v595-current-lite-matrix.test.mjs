import assert from "node:assert/strict";
import test from "node:test";

import {
  V595_BROWSER_AUDITOR_CONTRACT_CASES,
  V595_BROWSER_AUDITOR_VERSION,
  V595_BROWSER_BATCH_STATUS,
  V595_BROWSER_BATCH_VERSION,
  V595_BROWSER_FRAME_COUNTS,
  V595_BROWSER_PNG_AUDITOR_VERSION,
  V595_BROWSER_STAGE_STATUS,
  V595_BROWSER_STAGE_VERSION,
  V595_EXACT_LANES,
  V595_EXACT_PASSES,
  V595_LITE_RECEIPT_STATUS,
  V595_LITE_RECEIPT_VERSION,
  V595_MATRIX_PASSES,
  V595_ROOT_SCIENTIFIC_PROMOTION_STATUS,
  parseV595LiteArgs,
  validateV595BrowserEvidence,
  validateV595LiteReceipt,
} from "./build-v595-current-lite-matrix.mjs";
import { sealV595FormalDocument } from "./v595-formal-contract.mjs";

const SOURCE_SHA = "a".repeat(64);
const CANDIDATE_SHA = "b".repeat(64);
const FULL_FINGERPRINT = "c".repeat(64);
const LITE_FINGERPRINT = "d".repeat(64);

function identity(tier = "standalone-full") {
  const fingerprint = tier === "vercel-lite" ? LITE_FINGERPRINT : FULL_FINGERPRINT;
  return {
    sourceManifestSha256: SOURCE_SHA,
    candidateManifestSha256: CANDIDATE_SHA,
    buildId: `v595b-${fingerprint}`,
    buildFingerprint: fingerprint,
    deploymentId: `v595-${SOURCE_SHA.slice(0, 12)}-${CANDIDATE_SHA.slice(0, 12)}`,
    formalProductPointer: "v263",
    deliveryTier: tier,
    bindingStatus: "bound",
  };
}

const authority = Object.freeze({
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

function evidenceEnvelope(suite) {
  return {
    fixture: { synthetic: true },
    formalEvidence: false,
    evidenceClaim: false,
    qualificationScope: "synthetic-test-only",
    promotion: "none",
    syntheticZeroClaim: false,
    suite,
  };
}

function definitions(suite) {
  if (suite === "exact-ab") {
    return V595_EXACT_PASSES.flatMap((pass) => V595_EXACT_LANES.map((lane) => ({
      id: `exact-${pass}-${lane}`,
      pass,
      lane,
    })));
  }
  const count = V595_BROWSER_FRAME_COUNTS[suite];
  return Array.from({ length: count }, (_, index) => ({
    id: `${suite}-frame-${index}`,
    pass: V595_MATRIX_PASSES[index % V595_MATRIX_PASSES.length],
    lane: null,
  }));
}

function artifact(path) {
  return { path, bytes: 100, sha256: "e".repeat(64) };
}

function browserEvidence(suite = "lite") {
  const tier = suite === "lite" ? "vercel-lite" : "standalone-full";
  const currentIdentity = identity(tier);
  const frames = definitions(suite);
  const width = suite === "lite" ? 390 : 1440;
  const height = suite === "lite" ? 844 : 900;
  const batch = sealV595FormalDocument({
    version: V595_BROWSER_BATCH_VERSION,
    status: V595_BROWSER_BATCH_STATUS,
    ...evidenceEnvelope(suite),
    identity: currentIdentity,
    delivery: {
      expectedProfile: tier,
      fullLiteSeparated: suite !== "exact-ab",
      exactAbSameBuild: suite === "exact-ab",
    },
    frameDefinitions: frames,
    exactAbPasses: suite === "exact-ab" ? V595_EXACT_PASSES : [],
    exactAbLanes: suite === "exact-ab" ? V595_EXACT_LANES : [],
    prerequisiteBlockers: [],
    boundaries: {
      formalProductPointer: "v263",
      priorV594IdentityReused: false,
      priorV594HumanDecisionInherited: false,
      priorChallengeReused: false,
      automaticHumanApproval: false,
      humanDecisionArtifactGenerated: false,
      scientificPayloadMutationAllowed: false,
      promotionAllowed: false,
      unknownOrZeroCountsAsPass: false,
    },
    evidenceIntegrity: {
      attestationAuthority: "none",
      humanSignoffGate: "separate-not-collected",
    },
    results: frames.map((frame, index) => ({
      id: frame.id,
      status: "captured-offline-audit-required",
      blockers: [],
      screenshot: {
        ...artifact(`tmp/v595-browser-fixture/${suite}/screenshots/${index}.png`),
        png: { complete: true, width, height },
      },
      telemetry: artifact(`tmp/v595-browser-fixture/${suite}/telemetry/${index}.json`),
      observed: {
        domIdentity: currentIdentity,
        formalDefaultKernel: "legacy-eih-1pn",
        rootPromotionStatus: V595_ROOT_SCIENTIFIC_PROMOTION_STATUS,
        canvasCount: 1,
        errors: [],
        network: { summary: {
          totalRequests: 2,
          totalResponses: 2,
          failedRequestCount: 0,
          nonSuccessResponseCount: 0,
          externalRequestCount: 0,
          overflow: false,
          paired: true,
        } },
      },
    })),
  }, "batchSha256");
  const stage = sealV595FormalDocument({
    version: V595_BROWSER_STAGE_VERSION,
    status: V595_BROWSER_STAGE_STATUS,
    ...evidenceEnvelope(suite),
    identity: currentIdentity,
    tooling: {
      collectorVersion: V595_BROWSER_BATCH_VERSION,
      auditorVersion: V595_BROWSER_AUDITOR_VERSION,
      pngAuditorVersion: V595_BROWSER_PNG_AUDITOR_VERSION,
      auditorContractCaseCount: V595_BROWSER_AUDITOR_CONTRACT_CASES,
    },
    gates: {
      completeDomIdentityAndBuildReceipt: true,
      deterministicRuntimeAndCamera: true,
      exactRuntimeConsumer: true,
      exactRelativityObservationMarker: true,
      pngStructureAndDimensions: true,
      networkRecomputed: true,
      profileWrapperAndClosureSources: true,
      stellarRosterAndArchetypes: true,
      relativityModesAndTrajectory: true,
      v595CurrentIdentityMarkers: true,
      formalV263AndPromotionBlocked: true,
      failClosedUnknownZero: true,
      automaticHumanApproval: false,
      priorV594HumanDecisionInherited: false,
    },
    matrix: {
      expectedFrameCount: frames.length,
      auditedFrameCount: frames.length,
      exactAbPasses: suite === "exact-ab" ? V595_EXACT_PASSES : [],
      exactAbLanes: suite === "exact-ab" ? V595_EXACT_LANES : [],
    },
    errors: [],
  });
  return { stage, batch, currentIdentity };
}

function reseal(document, overrides, field = "receiptSha256") {
  const unsigned = { ...document, ...overrides };
  delete unsigned[field];
  return sealV595FormalDocument(unsigned, field);
}

test("v595 lite validator accepts a complete current-identity synthetic matrix", async () => {
  const fixture = browserEvidence("lite");
  const result = await validateV595BrowserEvidence({
    ...fixture,
    expectedIdentity: fixture.currentIdentity,
    suite: "lite",
    syntheticFixture: true,
  });
  assert.equal(result.frameCount, 8);
  assert.equal(result.identity.deliveryTier, "vercel-lite");
});

test("v595 exact validator binds all eight pairs to baseline-v594/candidate-v595", async () => {
  const fixture = browserEvidence("exact-ab");
  const result = await validateV595BrowserEvidence({
    ...fixture,
    expectedIdentity: fixture.currentIdentity,
    suite: "exact-ab",
    syntheticFixture: true,
  });
  assert.equal(result.frameCount, 16);

  const badDefinitions = fixture.batch.frameDefinitions.map((row, index) => (
    index === 0 ? { ...row, lane: "baseline-v593" } : row
  ));
  const batch = reseal(fixture.batch, { frameDefinitions: badDefinitions }, "batchSha256");
  await assert.rejects(validateV595BrowserEvidence({
    ...fixture,
    batch,
    expectedIdentity: fixture.currentIdentity,
    suite: "exact-ab",
    syntheticFixture: true,
  }), /exact-frame-order/);
});

test("v595 browser evidence rejects unknown zero and tampered seals", async () => {
  const fixture = browserEvidence("lite");
  const results = fixture.batch.results.map((row, index) => index === 0 ? {
    ...row,
    observed: {
      ...row.observed,
      network: { summary: { ...row.observed.network.summary, failedRequestCount: null } },
    },
  } : row);
  const unknown = reseal(fixture.batch, { results }, "batchSha256");
  await assert.rejects(validateV595BrowserEvidence({
    ...fixture,
    batch: unknown,
    expectedIdentity: fixture.currentIdentity,
    suite: "lite",
    syntheticFixture: true,
  }), /unknown-zero/);

  const tampered = { ...fixture.batch, status: "tampered" };
  await assert.rejects(validateV595BrowserEvidence({
    ...fixture,
    batch: tampered,
    expectedIdentity: fixture.currentIdentity,
    suite: "lite",
    syntheticFixture: true,
  }), /seal-invalid/);
});

test("v595 browser evidence rejects v594 identity drift and traversal evidence paths", async () => {
  const fixture = browserEvidence("lite");
  const oldIdentity = {
    ...fixture.batch.identity,
    buildId: `v594b-${LITE_FINGERPRINT}`,
  };
  const old = reseal(fixture.batch, { identity: oldIdentity }, "batchSha256");
  await assert.rejects(validateV595BrowserEvidence({
    ...fixture,
    batch: old,
    expectedIdentity: fixture.currentIdentity,
    suite: "lite",
    syntheticFixture: true,
  }), /build-id|identity/);

  const results = fixture.batch.results.map((row, index) => index === 0
    ? { ...row, screenshot: { ...row.screenshot, path: "../escape.png" } }
    : row);
  const escaped = reseal(fixture.batch, { results }, "batchSha256");
  await assert.rejects(validateV595BrowserEvidence({
    ...fixture,
    batch: escaped,
    expectedIdentity: fixture.currentIdentity,
    suite: "lite",
    syntheticFixture: true,
  }), /path|boundary/);
});

test("v595 lite receipt is sealed, independent, and never inherits v594 approval", () => {
  const liteIdentity = identity("vercel-lite");
  const receipt = sealV595FormalDocument({
    version: V595_LITE_RECEIPT_VERSION,
    status: V595_LITE_RECEIPT_STATUS,
    candidate: liteIdentity,
    frameCount: 8,
    deliverySeparation: "independent-vercel-lite-build-and-evidence",
    priorV594HumanDecisionInherited: false,
    authority,
    synthetic: true,
  });
  assert.equal(
    validateV595LiteReceipt(receipt, liteIdentity, { syntheticFixture: true }).identity.buildId,
    liteIdentity.buildId,
  );
  const replay = reseal(receipt, { priorV594HumanDecisionInherited: true });
  assert.throws(
    () => validateV595LiteReceipt(replay, liteIdentity, { syntheticFixture: true }),
    /receipt-gates/,
  );
});

test("v595 lite CLI rejects traversal before any artifact read", () => {
  assert.throws(
    () => parseV595LiteArgs(["--stage", "../stage.json", "--batch", "tmp/v595/batch.json"]),
    /path|boundary/,
  );
});
