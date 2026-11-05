import { describe, expect, it } from "vitest";
import {
  assertReceiptLinkageShape,
  compareReceiptLinkageIdentity,
  formatReceiptLinkage,
  receiptAliasPaths,
  receiptEvidencePaths,
  receiptLinkageIsValid,
  receiptLinkageRiskReasons,
  receiptLinkageStatusLabel,
  receiptLinkageStatusTone,
  selectReceiptLinks,
  sortReceiptLinkagesByRisk,
  summarizeNebulaReceiptLinkages,
  receiptLinkageCompletionLabel,
  type NebulaReceiptLinkage,
} from "./mainlineANebulaReceiptLinkageV614";

const candidate = (id: string, status: "payload-linked" | "identity-linked" = "payload-linked"): NebulaReceiptLinkage => ({
  candidateId: id,
  links: [{
    key: "acquisitionReceiptSha256",
    declaredSha256: "a".repeat(64),
    requiredLevel: status === "identity-linked" ? "identity" : "payload",
    status,
    identityLinked: status !== "missing-reference",
    payloadLinked: status === "payload-linked",
    candidates: [{ path: "docs/release/v592/acquisition.json", parseable: true, sealValid: status !== "missing-reference", receiptSha256: "b".repeat(64), identityMatch: true, exactRowMatch: status === "payload-linked", alias: id === "tarantula-nebula", sourceMatch: status === "payload-linked", pathMatch: status === "payload-linked", bytesMatch: status === "payload-linked", digestMatch: status === "payload-linked", payloadMatch: status === "payload-linked", fileSha256: null }],
  }],
  valid: status !== "missing-reference",
  payloadLinked: status === "payload-linked" ? 1 : 0,
  identityLinked: status !== "missing-reference" ? 1 : 0,
  missing: status === "missing-reference" ? 1 : 0,
});

describe("Mainline A nebula receipt linkage v614", () => {
  it("summarizes complete, identity-only and missing linkages", () => {
    const summary = summarizeNebulaReceiptLinkages([candidate("a"), candidate("b", "identity-linked"), candidate("c", "missing-reference")]);
    expect(summary).toMatchObject({ candidates: 3, validCandidates: 2, receiptReferences: 3, payloadLinked: 1, identityLinked: 2, missing: 1, completionPercent: 67 });
  });

  it("labels status and risk tone without changing evidence state", () => {
    expect(receiptLinkageStatusLabel("payload-linked")).toContain("载荷");
    expect(receiptLinkageStatusTone("identity-linked")).toBe("neutral");
    expect(receiptLinkageStatusTone("reference-only")).toBe("warning");
    expect(receiptLinkageStatusTone("missing-reference")).toBe("danger");
  });

  it("selects paths and alias paths deterministically", () => {
    const linkage = candidate("tarantula-nebula");
    expect(selectReceiptLinks(linkage, "payload-linked")).toHaveLength(1);
    expect(receiptEvidencePaths(linkage)).toEqual(["docs/release/v592/acquisition.json"]);
    expect(receiptAliasPaths(linkage)).toEqual(["docs/release/v592/acquisition.json"]);
  });

  it("reports missing and invalid seal risks", () => {
    const linkage = candidate("bad", "missing-reference");
    expect(receiptLinkageIsValid(linkage)).toBe(false);
    expect(receiptLinkageRiskReasons(linkage)).toEqual(expect.arrayContaining(["acquisitionReceiptSha256:missing-reference", "acquisitionReceiptSha256:payload-unlinked", "acquisitionReceiptSha256:receipt-seal-invalid"]));
  });

  it("validates shape, formatting and identity comparison", () => {
    const linkage = candidate("heart-nebula");
    expect(assertReceiptLinkageShape(linkage)).toBe(linkage);
    expect(formatReceiptLinkage(linkage)).toContain("已校验");
    expect(compareReceiptLinkageIdentity(linkage, structuredClone(linkage))).toBe(true);
    expect(compareReceiptLinkageIdentity(linkage, candidate("other"))).toBe(false);
    expect(() => assertReceiptLinkageShape({ ...linkage, links: [{ ...linkage.links[0], declaredSha256: "bad" }] })).toThrow(/hash/);
  });

  it("orders risky candidates first and exposes a stable completion label", () => {
    const ordered = sortReceiptLinkagesByRisk([candidate("z"), candidate("a", "missing-reference"), candidate("b", "identity-linked")]);
    expect(ordered.map((entry) => entry.candidateId)).toEqual(["a", "b", "z"]);
    expect(receiptLinkageCompletionLabel(summarizeNebulaReceiptLinkages([candidate("z")]))).toBe("1/1 candidates valid");
    expect(receiptLinkageCompletionLabel({ ...summarizeNebulaReceiptLinkages([]), candidates: 0 })).toBe("暂无回执候选");
  });
});
