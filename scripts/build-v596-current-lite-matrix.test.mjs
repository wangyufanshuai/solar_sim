import assert from "node:assert/strict";
import test from "node:test";

import {
  V596_BROWSER_AUDITOR_CONTRACT_CASES,
  V596_BROWSER_AUDITOR_VERSION,
  V596_BROWSER_BATCH_STATUS,
  V596_BROWSER_BATCH_VERSION,
  V596_BROWSER_FRAME_COUNTS,
  V596_BROWSER_PNG_AUDITOR_VERSION,
  V596_BROWSER_STAGE_STATUS,
  V596_BROWSER_STAGE_VERSION,
  V596_EXACT_LANES,
  V596_EXACT_FRAME_DEFINITIONS,
  V596_EXACT_PAIR_DEFINITIONS,
  V596_EXACT_PASSES,
  V596_LITE_RECEIPT_STATUS,
  V596_LITE_RECEIPT_VERSION,
  V596_MATRIX_PASSES,
  V596_PARENT_V595_STANDALONE_PAGE_IDENTITY,
  V596_ROOT_SCIENTIFIC_PROMOTION_STATUS,
  parseV596LiteArgs,
  validateV596BrowserEvidence,
  validateV596LiteReceipt,
} from "./build-v596-current-lite-matrix.mjs";
import { sealV596FormalDocument } from "./v596-formal-contract.mjs";

const SOURCE_SHA = "a".repeat(64);
const CANDIDATE_SHA = "b".repeat(64);
const FULL_FINGERPRINT = "c".repeat(64);
const LITE_FINGERPRINT = "d".repeat(64);

function identity(tier = "standalone-full") {
  const fingerprint = tier === "vercel-lite" ? LITE_FINGERPRINT : FULL_FINGERPRINT;
  return {
    sourceManifestSha256: SOURCE_SHA,
    candidateManifestSha256: CANDIDATE_SHA,
    buildId: `v596b-${fingerprint}`,
    buildFingerprint: fingerprint,
    deploymentId: `v596-${SOURCE_SHA.slice(0, 12)}-${CANDIDATE_SHA.slice(0, 12)}`,
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
  resolvedSurfaceAuthorityGranted: false,
  observationTextureAuthorityGranted: false,
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
    return V596_EXACT_FRAME_DEFINITIONS.map((row) => ({ ...row }));
  }
  const count = V596_BROWSER_FRAME_COUNTS[suite];
  return Array.from({ length: count }, (_, index) => ({
    id: `${suite}-frame-${index}`,
    pass: V596_MATRIX_PASSES[index % V596_MATRIX_PASSES.length],
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
  const batch = sealV596FormalDocument({
    version: V596_BROWSER_BATCH_VERSION,
    status: V596_BROWSER_BATCH_STATUS,
    ...evidenceEnvelope(suite),
    identity: currentIdentity,
    delivery: {
      expectedProfile: tier,
      fullLiteSeparated: suite !== "exact-ab",
      exactAbSameBuild: suite === "exact-ab",
    },
    frameDefinitions: frames,
    exactAbPasses: suite === "exact-ab" ? V596_EXACT_PASSES : [],
    exactAbLanes: suite === "exact-ab" ? V596_EXACT_LANES : [],
    exactAbPairs: suite === "exact-ab" ? V596_EXACT_PAIR_DEFINITIONS : [],
    prerequisiteBlockers: [],
    boundaries: {
      formalProductPointer: "v263",
      priorV595IdentityReused: false,
      priorV595HumanDecisionInherited: false,
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
    results: frames.map((frame, index) => {
      const baselineV595 = suite === "exact-ab"
        && frame.lane === "baseline-v595-cinematic";
      const pageIdentity = baselineV595
        ? (() => {
          const { buildFingerprint: _omitted, ...v595DomIdentity } =
            V596_PARENT_V595_STANDALONE_PAGE_IDENTITY;
          return v595DomIdentity;
        })()
        : currentIdentity;
      return ({
      id: frame.id,
      status: "captured-offline-audit-required",
      blockers: [],
      screenshot: {
        ...artifact(`tmp/v596-browser-fixture/${suite}/screenshots/${index}.png`),
        png: { complete: true, width, height },
      },
      telemetry: artifact(`tmp/v596-browser-fixture/${suite}/telemetry/${index}.json`),
      observed: {
        domIdentity: currentIdentity,
        pageIdentity,
        formalDefaultKernel: "legacy-eih-1pn",
        rootPromotionStatus: V596_ROOT_SCIENTIFIC_PROMOTION_STATUS,
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
      });
    }),
  }, "batchSha256");
  const stage = sealV596FormalDocument({
    version: V596_BROWSER_STAGE_VERSION,
    status: V596_BROWSER_STAGE_STATUS,
    ...evidenceEnvelope(suite),
    identity: currentIdentity,
    tooling: {
      collectorVersion: V596_BROWSER_BATCH_VERSION,
      auditorVersion: V596_BROWSER_AUDITOR_VERSION,
      pngAuditorVersion: V596_BROWSER_PNG_AUDITOR_VERSION,
      auditorContractCaseCount: V596_BROWSER_AUDITOR_CONTRACT_CASES,
    },
    gates: {
      completeDomIdentityAndBuildReceipt: true,
      deterministicRuntimeAndCamera: true,
      exactRuntimeConsumer: true,
      exactVisibleLeapBoundary: true,
      pngStructureAndDimensions: true,
      networkRecomputed: true,
      profileWrapperAndClosureSources: true,
      stellarRosterAndArchetypes: true,
      relativityModesAndTrajectory: true,
      v596CurrentIdentityMarkers: true,
      formalV263AndPromotionBlocked: true,
      failClosedUnknownZero: true,
      automaticHumanApproval: false,
      priorV595HumanDecisionInherited: false,
    },
    matrix: {
      expectedFrameCount: frames.length,
      auditedFrameCount: frames.length,
      exactAbPasses: suite === "exact-ab" ? V596_EXACT_PASSES : [],
      exactAbLanes: suite === "exact-ab" ? V596_EXACT_LANES : [],
      exactAbPairs: suite === "exact-ab" ? V596_EXACT_PAIR_DEFINITIONS : [],
    },
    errors: [],
  });
  return { stage, batch, currentIdentity };
}

function reseal(document, overrides, field = "receiptSha256") {
  const unsigned = { ...document, ...overrides };
  delete unsigned[field];
  return sealV596FormalDocument(unsigned, field);
}

test("v596 lite validator accepts a complete current-identity synthetic matrix", async () => {
  const fixture = browserEvidence("lite");
  const result = await validateV596BrowserEvidence({
    ...fixture,
    expectedIdentity: fixture.currentIdentity,
    suite: "lite",
    syntheticFixture: true,
  });
  assert.equal(result.frameCount, 8);
  assert.equal(result.identity.deliveryTier, "vercel-lite");
});

test("v596 exact validator binds eight review pairs to sixteen capture records", async () => {
  const fixture = browserEvidence("exact-ab");
  const result = await validateV596BrowserEvidence({
    ...fixture,
    expectedIdentity: fixture.currentIdentity,
    suite: "exact-ab",
    syntheticFixture: true,
  });
  assert.equal(result.frameCount, 16);
  assert.equal(
    fixture.batch.results.filter((row) => row.observed.domIdentity.buildId.startsWith("v595b-")).length,
    0,
  );
  assert.equal(
    fixture.batch.results.filter((row) => row.observed.domIdentity.buildId.startsWith("v596b-")).length,
    16,
  );
  assert.equal(
    fixture.batch.results.filter((row) => row.observed.pageIdentity.buildId.startsWith("v595b-")).length,
    7,
  );
  assert.equal(
    fixture.batch.results.filter((row) => row.observed.pageIdentity.buildId.startsWith("v596b-")).length,
    9,
  );

  const badDefinitions = fixture.batch.frameDefinitions.map((row, index) => (
    index === 0 ? { ...row, lane: "baseline-v593" } : row
  ));
  const batch = reseal(fixture.batch, { frameDefinitions: badDefinitions }, "batchSha256");
  await assert.rejects(validateV596BrowserEvidence({
    ...fixture,
    batch,
    expectedIdentity: fixture.currentIdentity,
    suite: "exact-ab",
    syntheticFixture: true,
  }), /exact-frame-order/);

  const migratedPageResults = fixture.batch.results.map((row, index) => index === 0 ? {
    ...row,
    observed: {
      ...row.observed,
      pageIdentity: fixture.currentIdentity,
    },
  } : row);
  const migratedPage = reseal(
    fixture.batch,
    { results: migratedPageResults },
    "batchSha256",
  );
  await assert.rejects(validateV596BrowserEvidence({
    ...fixture,
    batch: migratedPage,
    expectedIdentity: fixture.currentIdentity,
    suite: "exact-ab",
    syntheticFixture: true,
  }), /v595-page-identity/);

  const staleDomResults = fixture.batch.results.map((row, index) => index === 0 ? {
    ...row,
    observed: {
      ...row.observed,
      domIdentity: row.observed.pageIdentity,
    },
  } : row);
  const staleDom = reseal(fixture.batch, { results: staleDomResults }, "batchSha256");
  await assert.rejects(validateV596BrowserEvidence({
    ...fixture,
    batch: staleDom,
    expectedIdentity: fixture.currentIdentity,
    suite: "exact-ab",
    syntheticFixture: true,
  }), /v596-identity/);
});

test("v596 browser evidence rejects unknown zero and tampered seals", async () => {
  const fixture = browserEvidence("lite");
  const results = fixture.batch.results.map((row, index) => index === 0 ? {
    ...row,
    observed: {
      ...row.observed,
      network: { summary: { ...row.observed.network.summary, failedRequestCount: null } },
    },
  } : row);
  const unknown = reseal(fixture.batch, { results }, "batchSha256");
  await assert.rejects(validateV596BrowserEvidence({
    ...fixture,
    batch: unknown,
    expectedIdentity: fixture.currentIdentity,
    suite: "lite",
    syntheticFixture: true,
  }), /unknown-zero/);

  const tampered = { ...fixture.batch, status: "tampered" };
  await assert.rejects(validateV596BrowserEvidence({
    ...fixture,
    batch: tampered,
    expectedIdentity: fixture.currentIdentity,
    suite: "lite",
    syntheticFixture: true,
  }), /seal-invalid/);
});

test("v596 browser evidence rejects v595 identity drift and traversal evidence paths", async () => {
  const fixture = browserEvidence("lite");
  const oldIdentity = {
    ...fixture.batch.identity,
    buildId: `v595b-${LITE_FINGERPRINT}`,
  };
  const old = reseal(fixture.batch, { identity: oldIdentity }, "batchSha256");
  await assert.rejects(validateV596BrowserEvidence({
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
  await assert.rejects(validateV596BrowserEvidence({
    ...fixture,
    batch: escaped,
    expectedIdentity: fixture.currentIdentity,
    suite: "lite",
    syntheticFixture: true,
  }), /path|boundary/);
});

test("v596 lite receipt is sealed, independent, and never inherits v595 approval", () => {
  const liteIdentity = identity("vercel-lite");
  const receipt = sealV596FormalDocument({
    version: V596_LITE_RECEIPT_VERSION,
    status: V596_LITE_RECEIPT_STATUS,
    candidate: liteIdentity,
    frameCount: 8,
    deliverySeparation: "independent-vercel-lite-build-and-evidence",
    priorV595HumanDecisionInherited: false,
    authority,
    synthetic: true,
  });
  assert.equal(
    validateV596LiteReceipt(receipt, liteIdentity, { syntheticFixture: true }).identity.buildId,
    liteIdentity.buildId,
  );
  const replay = reseal(receipt, { priorV595HumanDecisionInherited: true });
  assert.throws(
    () => validateV596LiteReceipt(replay, liteIdentity, { syntheticFixture: true }),
    /receipt-gates/,
  );
});

test("v596 lite CLI rejects traversal before any artifact read", () => {
  assert.throws(
    () => parseV596LiteArgs(["--stage", "../stage.json", "--batch", "tmp/v596/batch.json"]),
    /path|boundary/,
  );
});
