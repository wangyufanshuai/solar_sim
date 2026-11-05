import type { WebNebulaRightsBookV647 } from "./mainlineAWebRightsTruthV647";

export type WebEvidenceClassV647 = "static" | "HTTP" | "visual" | "browser" | "performance" | "external-source";
export type WebEvidenceStateV647 = "verified-current" | "historical" | "not-run" | "failed";
export type WebEvidenceV647 = Readonly<{
  evidenceClass: WebEvidenceClassV647;
  state: WebEvidenceStateV647;
  sourceSha256: string | null;
  artifact: string | null;
  artifactSha256: string | null;
  detail: string;
}>;

export type WebDeliveryInputsV647 = Readonly<{
  sourceSha256: string;
  canonicalCounts: Readonly<{ stars: number; constellations: number; nebulae: number }>;
  rightsBook: WebNebulaRightsBookV647;
  heroComponentIdentitiesConfirmed: number;
  heroComponentIdentitiesTarget: 4;
  desktopBrowser: WebEvidenceV647;
  mobileViewportBrowser: WebEvidenceV647;
  productionBuild: WebEvidenceV647;
  http: WebEvidenceV647;
  visual: WebEvidenceV647;
  performance: WebEvidenceV647;
  externalSource: WebEvidenceV647;
}>;

export type WebDeliveryGateV647 = Readonly<{
  id: string;
  state: "passed" | "pending" | "failed" | "out-of-scope";
  evidenceClass: WebEvidenceClassV647 | "policy";
  detail: string;
}>;

export type WebDeliveryDecisionV647 = Readonly<{
  schema: "mainline-a-web-delivery-policy-v647";
  deliveryTarget: "next-web-only";
  currentSourceSha256: string;
  localTechnicalReview: "verified" | "pending";
  publicWebRelease: "blocked";
  scientificAdmission: "blocked";
  assetRightsApproval: false;
  rootAppParity: "out-of-scope-for-web-only-review";
  physicalMobile: "not-run-optional-for-web-only-review";
  mobileViewportRequired: true;
  candidateOnly: true;
  hold: true;
  notAdmitted: true;
  scientificPayloadWriteback: false;
  gates: readonly WebDeliveryGateV647[];
  evidence: readonly WebEvidenceV647[];
}>;

const SHA256 = /^[a-f0-9]{64}$/;
const EVIDENCE_CLASSES = new Set<WebEvidenceClassV647>(["static", "HTTP", "visual", "browser", "performance", "external-source"]);
const EVIDENCE_STATES = new Set<WebEvidenceStateV647>(["verified-current", "historical", "not-run", "failed"]);

export function validateWebEvidenceV647(
  evidence: WebEvidenceV647,
  expectedClass: WebEvidenceClassV647,
  sourceSha256: string,
): readonly string[] {
  const issues: string[] = [];
  if (!EVIDENCE_CLASSES.has(evidence.evidenceClass)) issues.push("evidence-class-invalid");
  if (evidence.evidenceClass !== expectedClass) issues.push("evidence-class-mismatch");
  if (!EVIDENCE_STATES.has(evidence.state)) issues.push("evidence-state-invalid");
  if (evidence.state === "verified-current") {
    if (!SHA256.test(evidence.sourceSha256 ?? "")) issues.push("evidence-source-hash-missing");
    if (evidence.sourceSha256 !== sourceSha256) issues.push("evidence-source-stale");
    if (!evidence.artifact || !evidence.artifact.trim()) issues.push("evidence-artifact-missing");
    if (!SHA256.test(evidence.artifactSha256 ?? "")) issues.push("evidence-artifact-hash-missing");
  }
  if (!evidence.detail.trim()) issues.push("evidence-detail-missing");
  return Object.freeze(issues);
}

function evidenceGate(
  id: string,
  evidence: WebEvidenceV647,
  expectedClass: WebEvidenceClassV647,
  currentSource: string,
): WebDeliveryGateV647 {
  const issues = validateWebEvidenceV647(evidence, expectedClass, currentSource);
  if (issues.length) return Object.freeze({ id, state: "failed", evidenceClass: expectedClass, detail: issues.join(",") });
  if (evidence.state === "verified-current") return Object.freeze({ id, state: "passed", evidenceClass: expectedClass, detail: evidence.detail });
  return Object.freeze({ id, state: evidence.state === "failed" ? "failed" : "pending", evidenceClass: expectedClass, detail: evidence.detail });
}

export function evaluateWebDeliveryV647(input: WebDeliveryInputsV647): WebDeliveryDecisionV647 {
  if (!SHA256.test(input.sourceSha256)) throw new Error("web-delivery:source-hash-invalid");
  if (input.heroComponentIdentitiesTarget !== 4 || !Number.isInteger(input.heroComponentIdentitiesConfirmed)
    || input.heroComponentIdentitiesConfirmed < 0 || input.heroComponentIdentitiesConfirmed > 4) {
    throw new Error("web-delivery:stellar-component-count-invalid");
  }
  const evidence = Object.freeze([
    input.productionBuild, input.http, input.visual, input.desktopBrowser,
    input.mobileViewportBrowser, input.performance, input.externalSource,
  ]);
  const coverageComplete = input.canonicalCounts.stars === 12
    && input.canonicalCounts.constellations === 12
    && input.canonicalCounts.nebulae === 12;
  const assetsAligned = input.rightsBook.valid
    && input.rightsBook.counts.total === 12
    && input.rightsBook.counts.localPreviewAvailable === 12
    && input.rightsBook.counts.mismatched === 0;
  const gates: WebDeliveryGateV647[] = [
    { id: "canonical-coverage", state: coverageComplete ? "passed" : "failed", evidenceClass: "static", detail: `${input.canonicalCounts.stars}/${input.canonicalCounts.constellations}/${input.canonicalCounts.nebulae}` },
    { id: "local-nebula-preview-integrity", state: assetsAligned ? "passed" : "failed", evidenceClass: "static", detail: `${input.rightsBook.counts.localPreviewAvailable}/${input.rightsBook.counts.total}; ${input.rightsBook.issues.join(",") || "aligned"}` },
    evidenceGate("production-build", input.productionBuild, "static", input.sourceSha256),
    evidenceGate("http", input.http, "HTTP", input.sourceSha256),
    evidenceGate("desktop-browser", input.desktopBrowser, "browser", input.sourceSha256),
    evidenceGate("mobile-browser-viewport", input.mobileViewportBrowser, "browser", input.sourceSha256),
    evidenceGate("visual-review", input.visual, "visual", input.sourceSha256),
    evidenceGate("performance", input.performance, "performance", input.sourceSha256),
    evidenceGate("external-source", input.externalSource, "external-source", input.sourceSha256),
    { id: "nebula-rights-signoff", state: "pending", evidenceClass: "external-source", detail: `${input.rightsBook.counts.rightsApproved}/12 individually signed; labels and metadata are not signatures` },
    { id: "hero-physical-component-identity", state: input.heroComponentIdentitiesConfirmed === 4 ? "passed" : "pending", evidenceClass: "external-source", detail: `${input.heroComponentIdentitiesConfirmed}/4 component identities reviewed` },
    { id: "root-app-parity", state: "out-of-scope", evidenceClass: "policy", detail: "next-web is the sole web-only technical review target; no root parity claim" },
    { id: "physical-device", state: "out-of-scope", evidenceClass: "policy", detail: "physical mobile not-run; mobile browser viewport remains required" },
  ];
  const reviewIds = ["canonical-coverage", "local-nebula-preview-integrity", "production-build", "http", "desktop-browser", "mobile-browser-viewport", "visual-review"];
  const localTechnicalReview = reviewIds.every((id) => gates.find((gate) => gate.id === id)?.state === "passed") ? "verified" : "pending";
  return Object.freeze({
    schema: "mainline-a-web-delivery-policy-v647",
    deliveryTarget: "next-web-only",
    currentSourceSha256: input.sourceSha256,
    localTechnicalReview,
    publicWebRelease: "blocked",
    scientificAdmission: "blocked",
    assetRightsApproval: false,
    rootAppParity: "out-of-scope-for-web-only-review",
    physicalMobile: "not-run-optional-for-web-only-review",
    mobileViewportRequired: true,
    candidateOnly: true,
    hold: true,
    notAdmitted: true,
    scientificPayloadWriteback: false,
    gates: Object.freeze(gates),
    evidence,
  });
}
