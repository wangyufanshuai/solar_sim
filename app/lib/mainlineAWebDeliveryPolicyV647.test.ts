import { describe, expect, it } from "vitest";
import { MAINLINE_A_WEB_NEBULA_RIGHTS_V647 } from "./mainlineAWebRightsTruthV647";
import { evaluateWebDeliveryV647, validateWebEvidenceV647,
  type WebEvidenceV647, type WebDeliveryInputsV647 } from "./mainlineAWebDeliveryPolicyV647";

const hash = "a".repeat(64);
function evidence(evidenceClass: WebEvidenceV647["evidenceClass"], state: WebEvidenceV647["state"]): WebEvidenceV647 {
  return { evidenceClass, state, sourceSha256: state === "verified-current" ? hash : null,
    artifact: state === "verified-current" ? `docs/release/v607/${evidenceClass}.json` : null,
    artifactSha256: state === "verified-current" ? "b".repeat(64) : null,
    detail: `${evidenceClass} ${state}` };
}
function inputs(state: WebEvidenceV647["state"]): WebDeliveryInputsV647 {
  return { sourceSha256: hash, canonicalCounts: { stars: 12, constellations: 12, nebulae: 12 },
    rightsBook: MAINLINE_A_WEB_NEBULA_RIGHTS_V647, heroComponentIdentitiesConfirmed: 0,
    heroComponentIdentitiesTarget: 4, productionBuild: evidence("static", state), http: evidence("HTTP", state),
    desktopBrowser: evidence("browser", state), mobileViewportBrowser: evidence("browser", state),
    visual: evidence("visual", state), performance: evidence("performance", state),
    externalSource: evidence("external-source", state) };
}

describe("V647 web-only delivery decision", () => {
  it("keeps a fully measured local web review separate from public release", () => {
    const decision = evaluateWebDeliveryV647(inputs("verified-current"));
    expect(decision.localTechnicalReview).toBe("verified");
    expect(decision.publicWebRelease).toBe("blocked");
    expect(decision.scientificAdmission).toBe("blocked");
    expect(decision.assetRightsApproval).toBe(false);
    expect(decision.rootAppParity).toBe("out-of-scope-for-web-only-review");
    expect(decision.physicalMobile).toBe("not-run-optional-for-web-only-review");
    expect(decision.gates.find((gate) => gate.id === "nebula-rights-signoff")?.state).toBe("pending");
  });

  it("does not call historical browser or viewport evidence current", () => {
    const old = inputs("historical");
    const decision = evaluateWebDeliveryV647(old);
    expect(decision.localTechnicalReview).toBe("pending");
    expect(decision.gates.find((gate) => gate.id === "desktop-browser")?.state).toBe("pending");
    expect(decision.gates.find((gate) => gate.id === "mobile-browser-viewport")?.state).toBe("pending");
  });

  it("rejects a forged current marker without matching hash and artifact", () => {
    const malformed = { ...evidence("browser", "verified-current"), sourceSha256: "c".repeat(64), artifactSha256: null };
    expect(validateWebEvidenceV647(malformed, "browser", hash)).toEqual([
      "evidence-source-stale", "evidence-artifact-hash-missing",
    ]);
    const forged = { ...inputs("verified-current"), mobileViewportBrowser: malformed };
    const result = evaluateWebDeliveryV647(forged);
    expect(result.localTechnicalReview).toBe("pending");
    expect(result.gates.find((gate) => gate.id === "mobile-browser-viewport")?.state).toBe("failed");
  });

  it("requires twelve canonical rows and intact preview source binding", () => {
    const wrongCounts = { ...inputs("verified-current"), canonicalCounts: { stars: 12, constellations: 11, nebulae: 12 } };
    expect(evaluateWebDeliveryV647(wrongCounts).localTechnicalReview).toBe("pending");
    const wrongBook = { ...MAINLINE_A_WEB_NEBULA_RIGHTS_V647, valid: false, issues: ["m42:route-record-mismatch"] };
    expect(evaluateWebDeliveryV647({ ...inputs("verified-current"), rightsBook: wrongBook }).localTechnicalReview).toBe("pending");
  });

  it("rejects impossible component counts and malformed source identities", () => {
    expect(() => evaluateWebDeliveryV647({ ...inputs("not-run"), heroComponentIdentitiesConfirmed: 5 })).toThrow("stellar-component-count-invalid");
    expect(() => evaluateWebDeliveryV647({ ...inputs("not-run"), sourceSha256: "not-a-sha" })).toThrow("source-hash-invalid");
  });
});
