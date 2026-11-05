import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { canonicalKerrSciencePayloadAdmissionPayloadV463, createKerrSciencePayloadAdmissionSummaryV463, evaluateKerrSciencePayloadAdmissionV463, parseKerrSciencePayloadAdmissionArtifactV463, type KerrSciencePayloadAdmissionInputV463 } from "./kerrSciencePayloadAdmissionV463";

const artifact = JSON.parse(readFileSync("dist/science/kerr-science-payload-admission-v463/payload-admission.json", "utf8"));
const ready: KerrSciencePayloadAdmissionInputV463 = {
  measurementJoinArtifactSha256: "a".repeat(64),
  measurementJoinFileSha256: "b".repeat(64),
  measurementJoin: {
    status: "join-protocol-qualified-inputs-available",
    source: { v458IntakeArtifactSha256: "c".repeat(64), v460ResultsArtifactSha256: "d".repeat(64), v461LedgerArtifactSha256: "e".repeat(64) },
    join: { status: "qualified", joinAllowed: true, sourceChainQualified: true, ledgerReady: true, authorityGranted: true },
    inspect: { committed: true, joinSha256: "a".repeat(64), productionPixelRows: 4 },
    qualification: { scienceProductJoinQualified: true, detectorAuthorityGranted: true },
  },
};

describe("v463 science payload admission", () => {
  it("admits only a complete authoritative join with a closed ledger", () => {
    expect(evaluateKerrSciencePayloadAdmissionV463(ready)).toMatchObject({ status: "admitted", reason: "none", sciencePayloadAllowed: true, fitsWriteAllowed: true, pngWriteAllowed: true, cinematicScienceWritebackAllowed: false, authorityGranted: true });
    expect(evaluateKerrSciencePayloadAdmissionV463({ ...ready, measurementJoin: { ...ready.measurementJoin, join: { ...ready.measurementJoin.join, ledgerReady: false } } })).toMatchObject({ status: "blocked", reason: "residual-ledger-open", sciencePayloadAllowed: false });
  });
  it("rejects incomplete joins and invalid source identities", () => {
    expect(evaluateKerrSciencePayloadAdmissionV463({ ...ready, measurementJoin: { ...ready.measurementJoin, inspect: { ...ready.measurementJoin.inspect, committed: false } } })).toMatchObject({ status: "blocked", reason: "measurement-join-incomplete" });
    expect(evaluateKerrSciencePayloadAdmissionV463({ ...ready, measurementJoinFileSha256: "not-a-sha" })).toMatchObject({ status: "blocked", reason: "source-sha-invalid" });
  });
  it("preserves canonical artifact SHA and zero-row fail-closed summary", () => {
    const parsed = parseKerrSciencePayloadAdmissionArtifactV463(artifact);
    expect(createHash("sha256").update(canonicalKerrSciencePayloadAdmissionPayloadV463(parsed)).digest("hex")).toBe(parsed.artifactSha256);
    expect(createKerrSciencePayloadAdmissionSummaryV463(parsed)).toMatchObject({ inspect: { productionPayloadRows: 0, committed: false }, payload: { rowCount: 0, payloadSha256: null }, admission: { sciencePayloadAllowed: false, authorityGranted: false } });
  });
});
