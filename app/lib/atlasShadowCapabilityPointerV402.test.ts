import { describe, expect, it } from "vitest";
import { parseAtlasShadowCapabilityPointerV402 } from "./atlasShadowCapabilityPointerV402";

const SHA = "a".repeat(64);
describe("v402 shadow pointer", () => {
  it("keeps lifecycle qualification separate from browser and dense qualification", () => {
    const pointer = { version: "orbit-atlas-current-local-shadow-candidate-v402", status: "observation-evidence-lifecycle-static-qualified-browser-pending-dense-incomplete-0-of-49", formalProductPointer: "v263", formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true, capabilities: { v401EvidenceCache: "static-qualified-4-stage-single-flight-maximum-1-request-each", v402CacheLifecycle: "static-qualified-final-scope-release-entries-0-bytes-0", v402PendingRequests: "aborted-on-release-generation-isolated-not-scientific-failure", v402AuditLedger: "retained-lifetime-success-failure-released-counts", v402StrictMode: "microtask-deferred-idempotent-reacquire-stable", v402ScopeWiring: "v11-and-v12-profile-scoped", v402BrowserQualification: "not-run", v402VisualMatrix: "not-run", v402Soak: "not-run", v402RtxWebGpu: "not-run", v314CorrectedDense: "incomplete-0-of-49", denseAggregate: "unavailable" }, evidence: { path: "dist/science/orbit-atlas-shadow-v402-evidence.json", fileSha256: SHA, canonicalSha256: SHA }, pointerSha256: SHA } as const;
    expect(parseAtlasShadowCapabilityPointerV402(pointer)).toBe(pointer);
  });
});
