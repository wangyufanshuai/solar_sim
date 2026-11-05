import assert from "node:assert/strict";
import test from "node:test";
import { verifyWebRightsObservationV647 } from "./collect-mainline-a-web-browser-v647.mjs";

const observation = Object.freeze({
  webRights: {
    atlasOpen: true,
    webRelease: "blocked-rights-pending",
    summaryCounts: [12, 18, 0, 30],
    licenseRecorded: 12,
    selectedAdmission: "candidate-only",
    selectedRightsReview: "pending",
    clearedClaimVisible: false,
    closeButtonNoWrap: true,
  },
});

test("the local web rights observation keeps all thirty entries in review", () => {
  const result = verifyWebRightsObservationV647(observation, "desktop");
  assert.deepEqual({ displayed: result.localDisplayed, candidates: result.candidateRecords,
    signed: result.signedRights, pending: result.reviewPending },
  { displayed: 12, candidates: 18, signed: 0, pending: 30 });
  assert.equal(result.webRelease, "blocked-rights-pending");
});

test("a forged signed count or public release marker is rejected", () => {
  for (const webRights of [
    { ...observation.webRights, summaryCounts: [12, 18, 12, 18] },
    { ...observation.webRights, webRelease: "approved" },
    { ...observation.webRights, clearedClaimVisible: true },
    { ...observation.webRights, closeButtonNoWrap: false },
  ]) {
    assert.throws(() => verifyWebRightsObservationV647({ webRights }, "mobile-viewport"), /web-browser-v647:/);
  }
});

test("an absent atlas and missing selected state are rejected", () => {
  assert.throws(() => verifyWebRightsObservationV647({ webRights: { ...observation.webRights, atlasOpen: false } }, "desktop"), /atlas-not-open/);
  assert.throws(() => verifyWebRightsObservationV647({ webRights: { ...observation.webRights, selectedRightsReview: null } }, "desktop"), /selected-rights-promoted/);
  assert.throws(() => verifyWebRightsObservationV647({ webRights: { ...observation.webRights, selectedAdmission: "current" } }, "desktop"), /selected-admission-promoted/);
});
