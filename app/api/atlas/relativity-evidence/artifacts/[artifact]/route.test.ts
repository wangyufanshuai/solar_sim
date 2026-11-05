import { afterEach, describe, expect, it } from "vitest";
import { parseKerrObserverEmitterReplayViewV301 } from "../../../../../lib/kerrObserverEmitterReplayV301";
import { parseKerrEventTimelineViewV302 } from "../../../../../lib/kerrEventTimelineV302";
import { parseKerrLayeredErrorBudgetViewV303 } from "../../../../../lib/kerrErrorBudgetV303";
import { parseKerrPolarizationAuthorityViewV304 } from "../../../../../lib/kerrPolarizationViewV304";
import { parseKerrScienceObservablesViewV306 } from "../../../../../lib/kerrScienceObservablesV306";
import { parseKerrDenseShardTruthAuditV311 } from "../../../../../lib/kerrDenseShardTruthV311";
import { parseKerrCorrectedAuthorityViewV312 } from "../../../../../lib/kerrAuthorityV312";
import { parseKerrPolarizationRequalificationViewV313 } from "../../../../../lib/kerrAuthorityV313";
import {
  createSparseKerrSciencePayloadV315,
  parseKerrCanonicalRayViewV315,
  parseKerrScienceGeometrySourceViewV315,
  parseKerrSciencePolarizationSourceViewV315,
} from "../../../../../lib/kerrSciencePayloadV315";
import { parseKerrThinDiskSpectralViewV319 } from "../../../../../lib/kerrThinDiskSpectralV319";
import { parseKerrThinDiskBandImagingViewV320 } from "../../../../../lib/kerrThinDiskBandImagingV320";
import { GET } from "./route";

const originalProfile = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;

afterEach(() => {
  if (originalProfile == null) delete process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE;
  else process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = originalProfile;
});

describe("v299 relativity authority artifact route", () => {
  it("serves only the verified bounded geometry allowlist", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(new Request("http://localhost/api/atlas/relativity-evidence/artifacts/v296-geometry", { headers: { "x-forwarded-for": "127.0.0.41" } }), { params: Promise.resolve({ artifact: "v296-geometry" }) });
    expect(response.status).toBe(200);
    expect(response.headers.get("x-atlas-relativity-artifact")).toBe("v296-geometry");
    const text = await response.text();
    expect(text).toContain('"geometryRedshiftQualified": true');
    expect(text).not.toContain(process.cwd());
  });

  it("derives only 16 canonical rays from the SHA-locked 3097-ray plan", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(new Request("http://localhost/api/atlas/relativity-evidence/artifacts/v298r1-canonical-rays", { headers: { "x-forwarded-for": "127.0.0.44" } }), { params: Promise.resolve({ artifact: "v298r1-canonical-rays" }) });
    expect(response.status).toBe(200);
    const document = await response.json() as { version: string; planSha256: string; canonicalRays: Array<{ rayIndex: number; stratum: string }> };
    expect(document.version).toBe("v299-kerr-canonical-ray-view-v1");
    expect(document.planSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(document.canonicalRays).toHaveLength(16);
    expect(document.canonicalRays.every((ray, index) => ray.rayIndex === index && ray.stratum === "canonical")).toBe(true);
  });

  it("serves a bounded 40-bracket critical-curve view without execution records", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(new Request("http://localhost/api/atlas/relativity-evidence/artifacts/v296-critical-brackets", { headers: { "x-forwarded-for": "127.0.0.45" } }), { params: Promise.resolve({ artifact: "v296-critical-brackets" }) });
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("etag")).toBeTruthy();
    const text = await response.text();
    expect(Buffer.byteLength(text, "utf8")).toBeLessThanOrEqual(32 * 1024);
    expect(text).not.toContain("executions");
    expect(text).not.toContain(process.cwd());
    const document = JSON.parse(text) as { version: string; bracketCount: number; maxBracketWidthPx: number; brackets: unknown[] };
    expect(document.version).toBe("v300-kerr-critical-curve-view-v1");
    expect(document.bracketCount).toBe(40);
    expect(document.brackets).toHaveLength(40);
    expect(document.maxBracketWidthPx).toBeGreaterThan(0);
    expect(document.maxBracketWidthPx).toBeLessThan(0.5);
  });

  it("derives a bounded four-ray observer, emitter and redshift replay view", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(new Request("http://localhost/api/atlas/relativity-evidence/artifacts/v301-observer-emitter-replay", { headers: { "x-forwarded-for": "127.0.0.46" } }), { params: Promise.resolve({ artifact: "v301-observer-emitter-replay" }) });
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const text = await response.text();
    expect(Buffer.byteLength(text, "utf8")).toBeLessThanOrEqual(32 * 1024);
    expect(text).not.toContain("executions");
    expect(text).not.toContain("payloads");
    expect(text).not.toContain(process.cwd());
    const view = parseKerrObserverEmitterReplayViewV301(JSON.parse(text));
    expect(view.records).toHaveLength(4);
    expect(view.records.every((entry) => entry.emitter.replayDifference < 1e-12)).toBe(true);
    expect(view.boundary).toBe("four-canonical-disk-rays-not-dense-transfer-map");
  });

  it("derives 16 bounded dual-formula event timelines without full executions", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(new Request("http://localhost/api/atlas/relativity-evidence/artifacts/v302-event-timelines", { headers: { "x-forwarded-for": "127.0.0.47" } }), { params: Promise.resolve({ artifact: "v302-event-timelines" }) });
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(Buffer.byteLength(text, "utf8")).toBeLessThanOrEqual(32 * 1024);
    expect(text).not.toContain('"executions"');
    expect(text).not.toContain(process.cwd());
    const view = parseKerrEventTimelineViewV302(JSON.parse(text));
    expect(view.timelines).toHaveLength(16);
    expect(view.classCounts).toEqual({ capture: 6, escape: 6, "disk-hit": 4 });
    expect(view.parameterComparisonBoundary).toBe("formula-parameters-are-not-cross-compared");
  });

  it("keeps sparse qualification separate from the shard-only dense error budget", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(new Request("http://localhost/api/atlas/relativity-evidence/artifacts/v303-error-budget", { headers: { "x-forwarded-for": "127.0.0.48" } }), { params: Promise.resolve({ artifact: "v303-error-budget" }) });
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(Buffer.byteLength(text, "utf8")).toBeLessThanOrEqual(32 * 1024);
    expect(text).not.toContain('"executions"');
    expect(text).not.toContain(process.cwd());
    const view = parseKerrLayeredErrorBudgetViewV303(JSON.parse(text));
    expect(view.sparse.status).toBe("qualified-short-authority");
    expect(view.dense).toMatchObject({ status: "incomplete-1-of-49", aggregateEligible: false, statisticalGatesApplied: false, denseAggregateSha256: null });
    expect(view.policy.scalarCombinedUncertainty).toBe("forbidden");
  });

  it("serves the four-ray WP/PT polarization view without transport trajectories", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(new Request("http://localhost/api/atlas/relativity-evidence/artifacts/v304-polarization-view", { headers: { "x-forwarded-for": "127.0.0.49" } }), { params: Promise.resolve({ artifact: "v304-polarization-view" }) });
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(Buffer.byteLength(text, "utf8")).toBeLessThanOrEqual(32 * 1024);
    expect(text).not.toContain('"trajectory":[');
    expect(text).not.toContain(process.cwd());
    const view = parseKerrPolarizationAuthorityViewV304(JSON.parse(text));
    expect(view.rays).toHaveLength(4);
    expect(view.counts).toMatchObject({ applicableExecutionCount: 16, captureEscapeNotApplicableCount: 96 });
    expect(view.maxima.releaseEvpaDifferenceDeg).toBeLessThan(0.5);
    expect(view.denseBoundary).toBe("not-a-dense-polarization-map");
  });

  it("serves 16 componentwise sparse observables without a dense transfer map", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(new Request("http://localhost/api/atlas/relativity-evidence/artifacts/v306-science-observables", { headers: { "x-forwarded-for": "127.0.0.50" } }), { params: Promise.resolve({ artifact: "v306-science-observables" }) });
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const text = await response.text();
    expect(Buffer.byteLength(text, "utf8")).toBeLessThanOrEqual(32 * 1024);
    expect(text).not.toContain('"executions"');
    expect(text).not.toContain('"trajectory"');
    expect(text).not.toContain(process.cwd());
    const view = parseKerrScienceObservablesViewV306(JSON.parse(text));
    expect(view.records).toHaveLength(16);
    expect(view.counts).toMatchObject({ capture: 6, escape: 6, diskHit: 4, polarizationApplicable: 4 });
    expect(view.policy).toMatchObject({ uncertaintyCombination: "componentwise-no-rss-no-scalar-total", denseQualificationAccepted: false });
    expect(view.records.filter((record) => record.classification !== "disk-hit").every((record) => record.redshiftFactor === null && record.evpaDifferenceDeg === null)).toBe(true);
  });

  it("serves the immutable shard 0 tolerance-ladder negative truth audit", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(new Request("http://localhost/api/atlas/relativity-evidence/artifacts/v311-shard0-truth-audit", { headers: { "x-forwarded-for": "127.0.0.51" } }), { params: Promise.resolve({ artifact: "v311-shard0-truth-audit" }) });
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const text = await response.text();
    expect(Buffer.byteLength(text, "utf8")).toBeLessThanOrEqual(32 * 1024);
    expect(text).not.toContain(process.cwd());
    const audit = parseKerrDenseShardTruthAuditV311(JSON.parse(text));
    expect(audit).toMatchObject({
      status: "failed-tolerance-ladder-degenerate",
      campaign: { status: "incomplete-1-of-49", campaignStateMutationApplied: false, nextShardAttempted: false },
      toleranceLadder: { expectedPairCount: 256, strictSolverLadderPairCount: 0, geometryDistinctPairCount: 0, passed: false },
      qualification: { denseToleranceConvergenceStatus: "withdrawn", aggregateEligible: false },
    });
  });

  it("serves the bounded v312 corrected solver-ladder authority", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(new Request("http://localhost/api/atlas/relativity-evidence/artifacts/v312-corrected-authority", { headers: { "x-forwarded-for": "127.0.0.52" } }), { params: Promise.resolve({ artifact: "v312-corrected-authority" }) });
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(Buffer.byteLength(text, "utf8")).toBeLessThanOrEqual(32 * 1024);
    expect(text).not.toContain('"executions"');
    expect(text).not.toContain(process.cwd());
    const view = parseKerrCorrectedAuthorityViewV312(JSON.parse(text));
    expect(view.solverLadder).toMatchObject({ qualified: true, pairCount: 64, expectedPairCount: 64, observableCount: 256, releaseRtol: 1e-11, internalRtol: 1e-13 });
    expect(view.resource.peakRssGiB).toBeGreaterThan(0);
    expect(view.priorNegative).toMatchObject({ status: "corrected-authority-failed", preserved: true });
  });

  it("serves the bounded v313 v312-locked polarization authority", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(new Request("http://localhost/api/atlas/relativity-evidence/artifacts/v313-polarization-requalification", { headers: { "x-forwarded-for": "127.0.0.53" } }), { params: Promise.resolve({ artifact: "v313-polarization-requalification" }) });
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(Buffer.byteLength(text, "utf8")).toBeLessThanOrEqual(32 * 1024);
    expect(text).not.toContain('"payloads"');
    const view = parseKerrPolarizationRequalificationViewV313(JSON.parse(text));
    expect(view.counts).toMatchObject({ applicableExecutionCount: 16, captureEscapeNotApplicableCount: 96, uniqueDiskRayCount: 4 });
    expect(view.maxima.releaseEvpaDifferenceDeg).toBeLessThan(0.5);
    expect(view.maxima.internalEvpaDifferenceDeg).toBeLessThan(0.1);
  });

  it("serves bounded v315 runtime sources and rebuilds the corrected sparse payload", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const [geometryResponse, polarizationResponse, rayResponse] = await Promise.all([
      GET(new Request("http://localhost/api/atlas/relativity-evidence/artifacts/v315-corrected-geometry-source", { headers: { "x-forwarded-for": "127.0.0.54" } }), { params: Promise.resolve({ artifact: "v315-corrected-geometry-source" }) }),
      GET(new Request("http://localhost/api/atlas/relativity-evidence/artifacts/v315-corrected-polarization-source", { headers: { "x-forwarded-for": "127.0.0.55" } }), { params: Promise.resolve({ artifact: "v315-corrected-polarization-source" }) }),
      GET(new Request("http://localhost/api/atlas/relativity-evidence/artifacts/v314-canonical-rays", { headers: { "x-forwarded-for": "127.0.0.56" } }), { params: Promise.resolve({ artifact: "v314-canonical-rays" }) }),
    ]);
    expect([geometryResponse.status, polarizationResponse.status, rayResponse.status]).toEqual([200, 200, 200]);
    const [geometryText, polarizationText, rayText] = await Promise.all([
      geometryResponse.text(), polarizationResponse.text(), rayResponse.text(),
    ]);
    expect(Buffer.byteLength(geometryText, "utf8")).toBeLessThanOrEqual(64 * 1024);
    expect(Buffer.byteLength(polarizationText, "utf8")).toBeLessThanOrEqual(16 * 1024);
    expect(Buffer.byteLength(rayText, "utf8")).toBeLessThanOrEqual(32 * 1024);
    const geometryView = parseKerrScienceGeometrySourceViewV315(JSON.parse(geometryText));
    const polarizationView = parseKerrSciencePolarizationSourceViewV315(JSON.parse(polarizationText));
    const rayView = parseKerrCanonicalRayViewV315(JSON.parse(rayText));
    expect(geometryView.executions).toHaveLength(32);
    expect(polarizationView.payloads).toHaveLength(4);
    expect(rayView.canonicalRays).toHaveLength(16);
    expect(createSparseKerrSciencePayloadV315(geometryView, polarizationView, rayView)).toMatchObject({
      authorityKind: "v312-v313-short-gate-sparse",
      sampleCount: 16,
      denseCampaignComplete: false,
      denseAggregateSha256: null,
    });
  });

  it("serves corrected v315 componentwise observables without accepting a dense map", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(new Request("http://localhost/api/atlas/relativity-evidence/artifacts/v315-science-observables", { headers: { "x-forwarded-for": "127.0.0.57" } }), { params: Promise.resolve({ artifact: "v315-science-observables" }) });
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(Buffer.byteLength(text, "utf8")).toBeLessThanOrEqual(32 * 1024);
    expect(text).not.toContain(process.cwd());
    const view = parseKerrScienceObservablesViewV306(JSON.parse(text));
    expect(view.authority).toMatchObject({
      kind: "v312-v313-short-gate-sparse",
      geometryEvidenceSha256: "dec9aa5644e602dd41c82d3a21faf9edf9865d4c2a430010ecae890388e5290e",
      polarizationEvidenceSha256: "e4b6044ed828f31b7eb511b4e722bc474414acdcab8cedbdf16484b20216ae6f",
      rayPlanSha256: "89ce45769978650c177acb83a0c37ceb1c0a1a6f6db34655448f5c6fcb896c04",
      denseAggregateSha256: null,
    });
    expect(view.counts).toMatchObject({ sampleCount: 16, capture: 6, escape: 6, diskHit: 4, polarizationApplicable: 4 });
    expect(view.policy).toMatchObject({ displayAuthority: "cpu-v312-geometry+v313-polarization", denseQualificationAccepted: false });
  });

  it("serves the bounded v318 CPU reference packet without claiming a GPU pass", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(new Request("http://localhost/api/atlas/relativity-evidence/artifacts/v318-gpu-differential-reference", { headers: { "x-forwarded-for": "127.0.0.58" } }), { params: Promise.resolve({ artifact: "v318-gpu-differential-reference" }) });
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(Buffer.byteLength(text, "utf8")).toBeLessThanOrEqual(64 * 1024);
    expect(text).not.toContain(process.cwd());
    const packet = JSON.parse(text);
    expect(packet).toMatchObject({
      version: "v318-kerr-gpu-canonical-differential-v1",
      authoritySha256: "99e591c0a8fd1f342ef622239301d04cf9f5cd33cbe1c45f1159e0804f2e81a6",
      geometryAuthoritySha256: "dec9aa5644e602dd41c82d3a21faf9edf9865d4c2a430010ecae890388e5290e",
      sampleCount: 16,
      criticalBracketCount: 40,
      boundary: "cpu-authority-reference-only-no-gpu-qualification-without-hardware-result",
    });
    expect(packet.samples).toHaveLength(16);
    expect(packet.criticalBrackets).toHaveLength(40);
    expect(text).not.toContain("webgpu-shadow-eligible");
  });

  it("serves a bounded v319 physical spectrum for only four corrected disk rays", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(new Request("http://localhost/api/atlas/relativity-evidence/artifacts/v319-thin-disk-spectrum", { headers: { "x-forwarded-for": "127.0.0.59" } }), { params: Promise.resolve({ artifact: "v319-thin-disk-spectrum" }) });
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(Buffer.byteLength(text, "utf8")).toBeLessThanOrEqual(64 * 1024);
    expect(text).not.toContain(process.cwd());
    const view = parseKerrThinDiskSpectralViewV319(JSON.parse(text));
    expect(view).toMatchObject({
      status: "qualified-sparse-derived-spectrum",
      counts: { sampleCount: 16, applicableDiskRayCount: 4, unavailableRayCount: 12 },
      boundary: "four-authority-disk-rays-derived-spectrum-not-dense-image",
    });
    expect(view.samples.filter((sample) => sample.applicable)).toHaveLength(4);
  });

  it("serves a bounded v320 fixed-band view without adaptive normalization", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const response = await GET(new Request("http://localhost/api/atlas/relativity-evidence/artifacts/v320-thin-disk-bands", { headers: { "x-forwarded-for": "127.0.0.60" } }), { params: Promise.resolve({ artifact: "v320-thin-disk-bands" }) });
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(Buffer.byteLength(text, "utf8")).toBeLessThanOrEqual(64 * 1024);
    expect(text).not.toContain(process.cwd());
    const view = parseKerrThinDiskBandImagingViewV320(JSON.parse(text));
    expect(view).toMatchObject({
      status: "qualified-fixed-band-sparse-science-imaging",
      counts: { sampleCount: 16, applicableDiskRayCount: 4, unavailableRayCount: 12, explicitSaturationFlagCount: 12 },
      normalizationPolicy: "fixed-physical-reference-no-data-adaptive-rescale",
      boundary: "four-authority-disk-rays-fixed-band-product-not-dense-image",
    });
    expect(view.samples.filter((sample) => sample.applicable)).toHaveLength(4);
  });

  it("rejects unknown artifacts and keeps Lite unavailable", async () => {
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "local-shadow";
    const unknown = await GET(new Request("http://localhost/api/atlas/relativity-evidence/artifacts/secret", { headers: { "x-forwarded-for": "127.0.0.42" } }), { params: Promise.resolve({ artifact: "secret" }) });
    expect(unknown.status).toBe(404);
    process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE = "vercel-lite";
    const lite = await GET(new Request("http://localhost/api/atlas/relativity-evidence/artifacts/v297-polarization", { headers: { "x-forwarded-for": "127.0.0.43" } }), { params: Promise.resolve({ artifact: "v297-polarization" }) });
    expect(lite.status).toBe(404);
  });
});
