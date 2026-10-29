import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { atlasJsonResponseV275, atlasStrongEtagV275, consumeAtlasApiPolicyV275 } from "../../../../../lib/atlasApiPolicyV275";
import {
  KERR_DENSE_RAY_PLAN_FILE_SHA256_V298R1,
  KERR_DENSE_RAY_PLAN_SHA256_V298R1,
  type KerrDenseRayPlanEntryV298R1,
} from "../../../../../lib/kerrCampaignV298R1";
import {
  KERR_CRITICAL_CURVE_GEOMETRY_EVIDENCE_SHA256_V300,
  KERR_CRITICAL_CURVE_GEOMETRY_FILE_SHA256_V300,
  createKerrCriticalCurveViewV300,
} from "../../../../../lib/kerrCriticalCurveV300";
import {
  KERR_GEOMETRY_EVIDENCE_SHA256_V301,
  KERR_GEOMETRY_FILE_SHA256_V301,
  KERR_POLARIZATION_EVIDENCE_SHA256_V301,
  KERR_POLARIZATION_FILE_SHA256_V301,
  KERR_RAY_PLAN_FILE_SHA256_V301,
  KERR_RAY_PLAN_SHA256_V301,
} from "../../../../../lib/kerrObserverEmitterReplayV301";
import { createKerrObserverEmitterReplayViewV301 } from "../../../../../lib/kerrObserverEmitterReplayServerV301";
import { createKerrEventTimelineViewV302 } from "../../../../../lib/kerrEventTimelineV302";
import {
  KERR_CAMPAIGN_STATE_FILE_SHA256_V303,
  KERR_CAMPAIGN_STATE_SHA256_V303,
  KERR_SHARD0_AUDIT_FILE_SHA256_V303,
  KERR_SHARD0_AUDIT_SHA256_V303,
} from "../../../../../lib/kerrErrorBudgetV303";
import { createKerrLayeredErrorBudgetViewV303 } from "../../../../../lib/kerrErrorBudgetServerV303";
import { createKerrPolarizationAuthorityViewV304 } from "../../../../../lib/kerrPolarizationViewServerV304";
import { createKerrScienceObservablesViewV306 } from "../../../../../lib/kerrScienceObservablesV306";
import { createSparseKerrSciencePayloadV299 } from "../../../../../lib/strongGravityRenderingV299";
import {
  KERR_DENSE_SHARD_TRUTH_AUDIT_SHA256_V311,
  KERR_DENSE_SHARD_TRUTH_FILE_SHA256_V311,
} from "../../../../../lib/kerrDenseShardTruthV311";
import {
  KERR_CORRECTED_AUTHORITY_EVIDENCE_SHA256_V312,
  KERR_CORRECTED_AUTHORITY_FILE_SHA256_V312,
  createKerrCorrectedAuthorityViewV312,
} from "../../../../../lib/kerrAuthorityV312";
import { KERR_POLARIZATION_AUTHORITY_EVIDENCE_SHA256_V313, KERR_POLARIZATION_AUTHORITY_FILE_SHA256_V313, createKerrPolarizationRequalificationViewV313 } from "../../../../../lib/kerrAuthorityV313";
import {
  KERR_CORRECTED_DENSE_RAY_PLAN_FILE_SHA256_V314,
  KERR_CORRECTED_DENSE_RAY_PLAN_SHA256_V314,
} from "../../../../../lib/kerrCampaignV314";
import {
  createKerrCanonicalRayViewV315,
  createKerrScienceGeometrySourceViewV315,
  createKerrSciencePolarizationSourceViewV315,
  createSparseKerrSciencePayloadV315,
} from "../../../../../lib/kerrSciencePayloadV315";
import { createKerrGpuDifferentialReferenceV318 } from "../../../../../lib/kerrGpuDifferentialV318";
import { createKerrThinDiskSpectralViewV319 } from "../../../../../lib/kerrThinDiskSpectralV319";
import { createKerrThinDiskBandImagingViewV320 } from "../../../../../lib/kerrThinDiskBandImagingV320";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_ARTIFACT_BYTES = 512 * 1024;
const MAX_RAY_PLAN_SOURCE_BYTES = 768 * 1024;
const ARTIFACTS = {
  "v296-geometry": {
    path: "dist/science/kerr-reference-v296/geometry-redshift-short-gate.json",
    evidenceSha256: "76d2d4d3b803104ba477da627c428ed51d7b62b9691d2dc81e53f1e5bb8e81f7",
    fileSha256: "29d17ba84b6017e6f5c5e50c131497abc306f4817689b366676eab7b6f8fbd69",
  },
  "v297-polarization": {
    path: "dist/science/kerr-reference-v297/polarization-short-gate.json",
    evidenceSha256: "a3ac11de0ad8dc48c742507f8aee169c53a3c983cb7a38fbf41eb580b4d58854",
    fileSha256: "c30589b114d2d6b8f4ab4ca85814e5f0524c22613df3aab2b44d8928e712f778",
  },
  "v296-critical-brackets": {
    path: "dist/science/kerr-reference-v296/geometry-redshift-short-gate.json",
    evidenceSha256: KERR_CRITICAL_CURVE_GEOMETRY_EVIDENCE_SHA256_V300,
    fileSha256: KERR_CRITICAL_CURVE_GEOMETRY_FILE_SHA256_V300,
    derived: "critical-bracket-view",
  },
  "v301-observer-emitter-replay": {
    path: "dist/science/kerr-reference-v296/geometry-redshift-short-gate.json",
    evidenceSha256: KERR_GEOMETRY_EVIDENCE_SHA256_V301,
    fileSha256: KERR_GEOMETRY_FILE_SHA256_V301,
    derived: "observer-emitter-redshift-replay-view",
  },
  "v302-event-timelines": {
    path: "dist/science/kerr-reference-v296/geometry-redshift-short-gate.json",
    evidenceSha256: KERR_GEOMETRY_EVIDENCE_SHA256_V301,
    fileSha256: KERR_GEOMETRY_FILE_SHA256_V301,
    derived: "canonical-event-timeline-view",
  },
  "v303-error-budget": {
    path: "dist/science/kerr-reference-v296/geometry-redshift-short-gate.json",
    evidenceSha256: KERR_GEOMETRY_EVIDENCE_SHA256_V301,
    fileSha256: KERR_GEOMETRY_FILE_SHA256_V301,
    derived: "layered-error-budget-view",
  },
  "v304-polarization-view": {
    path: "dist/science/kerr-reference-v296/geometry-redshift-short-gate.json",
    evidenceSha256: KERR_GEOMETRY_EVIDENCE_SHA256_V301,
    fileSha256: KERR_GEOMETRY_FILE_SHA256_V301,
    derived: "bounded-polarization-authority-view",
  },
  "v306-science-observables": {
    path: "dist/science/kerr-reference-v296/geometry-redshift-short-gate.json",
    evidenceSha256: KERR_GEOMETRY_EVIDENCE_SHA256_V301,
    fileSha256: KERR_GEOMETRY_FILE_SHA256_V301,
    derived: "bounded-sparse-science-observables-view",
  },
  "v298r1-canonical-rays": {
    path: "dist/science/kerr-campaign-v298r1/ray-plan.json",
    planSha256: KERR_DENSE_RAY_PLAN_SHA256_V298R1,
    fileSha256: KERR_DENSE_RAY_PLAN_FILE_SHA256_V298R1,
    derived: "canonical-ray-view",
  },
  "v311-shard0-truth-audit": {
    path: "dist/science/kerr-campaign-v298r1/audits/shard-00.truth-audit-v311.json",
    truthAuditSha256: KERR_DENSE_SHARD_TRUTH_AUDIT_SHA256_V311,
    fileSha256: KERR_DENSE_SHARD_TRUTH_FILE_SHA256_V311,
  },
  "v312-corrected-authority": {
    path: "dist/science/kerr-reference-v312/geometry-redshift-tolerance-short-gate.json",
    evidenceSha256: KERR_CORRECTED_AUTHORITY_EVIDENCE_SHA256_V312,
    fileSha256: KERR_CORRECTED_AUTHORITY_FILE_SHA256_V312,
    derived: "corrected-tolerance-authority-view",
  },
  "v313-polarization-requalification": {
    path: "dist/science/kerr-reference-v313/polarization-short-gate.json",
    evidenceSha256: KERR_POLARIZATION_AUTHORITY_EVIDENCE_SHA256_V313,
    fileSha256: KERR_POLARIZATION_AUTHORITY_FILE_SHA256_V313,
    derived: "polarization-requalification-view",
  },
  "v315-corrected-geometry-source": {
    path: "dist/science/kerr-reference-v312/geometry-redshift-tolerance-short-gate.json",
    evidenceSha256: KERR_CORRECTED_AUTHORITY_EVIDENCE_SHA256_V312,
    fileSha256: KERR_CORRECTED_AUTHORITY_FILE_SHA256_V312,
    derived: "v315-corrected-geometry-source-view",
  },
  "v315-corrected-polarization-source": {
    path: "dist/science/kerr-reference-v313/polarization-short-gate.json",
    evidenceSha256: KERR_POLARIZATION_AUTHORITY_EVIDENCE_SHA256_V313,
    fileSha256: KERR_POLARIZATION_AUTHORITY_FILE_SHA256_V313,
    derived: "v315-corrected-polarization-source-view",
  },
  "v314-canonical-rays": {
    path: "dist/science/kerr-campaign-v314/ray-plan.json",
    planSha256: KERR_CORRECTED_DENSE_RAY_PLAN_SHA256_V314,
    fileSha256: KERR_CORRECTED_DENSE_RAY_PLAN_FILE_SHA256_V314,
    derived: "v315-canonical-ray-view",
  },
  "v315-science-observables": {
    path: "dist/science/kerr-reference-v312/geometry-redshift-tolerance-short-gate.json",
    evidenceSha256: KERR_CORRECTED_AUTHORITY_EVIDENCE_SHA256_V312,
    fileSha256: KERR_CORRECTED_AUTHORITY_FILE_SHA256_V312,
    derived: "v315-corrected-sparse-science-observables",
  },
  "v318-gpu-differential-reference": {
    path: "dist/science/kerr-reference-v312/geometry-redshift-tolerance-short-gate.json",
    evidenceSha256: KERR_CORRECTED_AUTHORITY_EVIDENCE_SHA256_V312,
    fileSha256: KERR_CORRECTED_AUTHORITY_FILE_SHA256_V312,
    derived: "v318-current-authority-gpu-differential-reference",
  },
  "v319-thin-disk-spectrum": {
    path: "dist/science/kerr-reference-v312/geometry-redshift-tolerance-short-gate.json",
    evidenceSha256: KERR_CORRECTED_AUTHORITY_EVIDENCE_SHA256_V312,
    fileSha256: KERR_CORRECTED_AUTHORITY_FILE_SHA256_V312,
    derived: "v319-page-thorne-sparse-spectrum",
  },
  "v320-thin-disk-bands": {
    path: "dist/science/kerr-reference-v312/geometry-redshift-tolerance-short-gate.json",
    evidenceSha256: KERR_CORRECTED_AUTHORITY_EVIDENCE_SHA256_V312,
    fileSha256: KERR_CORRECTED_AUTHORITY_FILE_SHA256_V312,
    derived: "v320-fixed-band-sparse-science-imaging",
  },
} as const;

type ArtifactId = keyof typeof ARTIFACTS;

export async function GET(
  request: Request,
  context: { params: Promise<{ artifact: string }> },
) {
  const deliveryProfile = process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE ?? "standalone-full";
  if (deliveryProfile === "vercel-lite") {
    return atlasJsonResponseV275("relativity-evidence", { available: false, reason: "lite-boundary" }, {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  }
  const limited = consumeAtlasApiPolicyV275(request, "relativity-evidence");
  if (limited) return limited;
  const { artifact } = await context.params;
  if (!(artifact in ARTIFACTS)) {
    return atlasJsonResponseV275("relativity-evidence", { error: "Relativity artifact is not allowed" }, {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  }
  try {
    const entry = ARTIFACTS[artifact as ArtifactId];
    const bytes = await readFile(resolve(process.cwd(), entry.path));
    const sourceLimit = artifact === "v298r1-canonical-rays" || artifact === "v314-canonical-rays"
      ? MAX_RAY_PLAN_SOURCE_BYTES
      : MAX_ARTIFACT_BYTES;
    if (bytes.byteLength <= 0 || bytes.byteLength > sourceLimit) throw new Error("artifact-size-boundary");
    const document = JSON.parse(bytes.toString("utf8")) as Record<string, unknown>;
    const fileSha256 = createHash("sha256").update(bytes).digest("hex");
    const authorityMatches = "truthAuditSha256" in entry
      ? document.truthAuditSha256 === entry.truthAuditSha256
      : "evidenceSha256" in entry
        ? document.evidenceSha256 === entry.evidenceSha256
        : document.planSha256 === entry.planSha256;
    if (fileSha256 !== entry.fileSha256 || !authorityMatches) {
      throw new Error("artifact-authority-lock-mismatch");
    }
    let serialized = bytes.toString("utf8");
    if (artifact === "v318-gpu-differential-reference" || artifact === "v319-thin-disk-spectrum" || artifact === "v320-thin-disk-bands") {
      const [polarizationBytes, rayPlanBytes] = await Promise.all([
        readFile(resolve(process.cwd(), "dist/science/kerr-reference-v313/polarization-short-gate.json")),
        readFile(resolve(process.cwd(), "dist/science/kerr-campaign-v314/ray-plan.json")),
      ]);
      if (polarizationBytes.byteLength <= 0 || polarizationBytes.byteLength > MAX_ARTIFACT_BYTES
        || rayPlanBytes.byteLength <= 0 || rayPlanBytes.byteLength > MAX_RAY_PLAN_SOURCE_BYTES
        || createHash("sha256").update(polarizationBytes).digest("hex") !== KERR_POLARIZATION_AUTHORITY_FILE_SHA256_V313
        || createHash("sha256").update(rayPlanBytes).digest("hex") !== KERR_CORRECTED_DENSE_RAY_PLAN_FILE_SHA256_V314) {
        throw new Error("v318-gpu-differential-source-authority-lock-mismatch");
      }
      const polarization = JSON.parse(polarizationBytes.toString("utf8")) as Record<string, unknown>;
      const rayPlan = JSON.parse(rayPlanBytes.toString("utf8")) as Record<string, unknown>;
      const geometryView = createKerrScienceGeometrySourceViewV315(document);
      const polarizationView = createKerrSciencePolarizationSourceViewV315(polarization);
      const canonicalRayView = createKerrCanonicalRayViewV315(rayPlan);
      const payload = createSparseKerrSciencePayloadV315(geometryView, polarizationView, canonicalRayView);
      const spectrum = createKerrThinDiskSpectralViewV319(payload);
      serialized = artifact === "v318-gpu-differential-reference"
        ? JSON.stringify(createKerrGpuDifferentialReferenceV318(payload, canonicalRayView, document))
        : artifact === "v319-thin-disk-spectrum"
          ? JSON.stringify(spectrum)
          : JSON.stringify(createKerrThinDiskBandImagingViewV320(spectrum));
      if (Buffer.byteLength(serialized, "utf8") > 64 * 1024) throw new Error("v318-v320-derived-view-size-boundary");
    } else if (artifact === "v315-science-observables") {
      const [polarizationBytes, rayPlanBytes] = await Promise.all([
        readFile(resolve(process.cwd(), "dist/science/kerr-reference-v313/polarization-short-gate.json")),
        readFile(resolve(process.cwd(), "dist/science/kerr-campaign-v314/ray-plan.json")),
      ]);
      if (polarizationBytes.byteLength <= 0 || polarizationBytes.byteLength > MAX_ARTIFACT_BYTES
        || rayPlanBytes.byteLength <= 0 || rayPlanBytes.byteLength > MAX_RAY_PLAN_SOURCE_BYTES
        || createHash("sha256").update(polarizationBytes).digest("hex") !== KERR_POLARIZATION_AUTHORITY_FILE_SHA256_V313
        || createHash("sha256").update(rayPlanBytes).digest("hex") !== KERR_CORRECTED_DENSE_RAY_PLAN_FILE_SHA256_V314) {
        throw new Error("v315-science-observables-source-authority-lock-mismatch");
      }
      const polarization = JSON.parse(polarizationBytes.toString("utf8")) as Record<string, unknown>;
      const rayPlan = JSON.parse(rayPlanBytes.toString("utf8")) as Record<string, unknown>;
      const geometryView = createKerrScienceGeometrySourceViewV315(document);
      const polarizationView = createKerrSciencePolarizationSourceViewV315(polarization);
      const canonicalRayView = createKerrCanonicalRayViewV315(rayPlan);
      const payload = createSparseKerrSciencePayloadV315(geometryView, polarizationView, canonicalRayView);
      serialized = JSON.stringify(createKerrScienceObservablesViewV306(payload, canonicalRayView.canonicalRays));
      if (Buffer.byteLength(serialized, "utf8") > 32 * 1024) throw new Error("v315-science-observables-view-size-boundary");
    } else if (artifact === "v315-corrected-geometry-source") {
      serialized = JSON.stringify(createKerrScienceGeometrySourceViewV315(document));
      if (Buffer.byteLength(serialized, "utf8") > 64 * 1024) throw new Error("v315-geometry-source-view-size-boundary");
    } else if (artifact === "v315-corrected-polarization-source") {
      serialized = JSON.stringify(createKerrSciencePolarizationSourceViewV315(document));
      if (Buffer.byteLength(serialized, "utf8") > 16 * 1024) throw new Error("v315-polarization-source-view-size-boundary");
    } else if (artifact === "v314-canonical-rays") {
      serialized = JSON.stringify(createKerrCanonicalRayViewV315(document));
      if (Buffer.byteLength(serialized, "utf8") > 32 * 1024) throw new Error("v315-canonical-ray-view-size-boundary");
    } else if (artifact === "v313-polarization-requalification") {
      serialized = JSON.stringify(createKerrPolarizationRequalificationViewV313(document));
      if (Buffer.byteLength(serialized, "utf8") > 32 * 1024) throw new Error("v313-authority-view-size-boundary");
    } else if (artifact === "v312-corrected-authority") {
      serialized = JSON.stringify(createKerrCorrectedAuthorityViewV312(document));
      if (Buffer.byteLength(serialized, "utf8") > 32 * 1024) throw new Error("v312-authority-view-size-boundary");
    } else if (artifact === "v306-science-observables") {
      const [polarizationBytes, rayPlanBytes] = await Promise.all([
        readFile(resolve(process.cwd(), "dist/science/kerr-reference-v297/polarization-short-gate.json")),
        readFile(resolve(process.cwd(), "dist/science/kerr-campaign-v298r1/ray-plan.json")),
      ]);
      if (polarizationBytes.byteLength <= 0 || polarizationBytes.byteLength > MAX_ARTIFACT_BYTES
        || rayPlanBytes.byteLength <= 0 || rayPlanBytes.byteLength > MAX_RAY_PLAN_SOURCE_BYTES) throw new Error("science-observables-source-size-boundary");
      const polarization = JSON.parse(polarizationBytes.toString("utf8")) as Record<string, unknown>;
      const rayPlan = JSON.parse(rayPlanBytes.toString("utf8")) as Record<string, unknown>;
      if (createHash("sha256").update(polarizationBytes).digest("hex") !== KERR_POLARIZATION_FILE_SHA256_V301
        || polarization.evidenceSha256 !== KERR_POLARIZATION_EVIDENCE_SHA256_V301
        || createHash("sha256").update(rayPlanBytes).digest("hex") !== KERR_RAY_PLAN_FILE_SHA256_V301
        || rayPlan.planSha256 !== KERR_RAY_PLAN_SHA256_V301) throw new Error("science-observables-source-authority-lock-mismatch");
      const rays = Array.isArray(rayPlan.rays) ? rayPlan.rays as KerrDenseRayPlanEntryV298R1[] : [];
      const canonicalRays = rays.slice(0, 16);
      const payload = createSparseKerrSciencePayloadV299(document, polarization, {
        version: "v299-kerr-canonical-ray-view-v1",
        planSha256: KERR_RAY_PLAN_SHA256_V301,
        planFileSha256: KERR_RAY_PLAN_FILE_SHA256_V301,
        canonicalRays,
      });
      serialized = JSON.stringify(createKerrScienceObservablesViewV306(payload, canonicalRays));
      if (Buffer.byteLength(serialized, "utf8") > 32 * 1024) throw new Error("science-observables-view-size-boundary");
    } else if (artifact === "v304-polarization-view") {
      const [polarizationBytes, rayPlanBytes] = await Promise.all([
        readFile(resolve(process.cwd(), "dist/science/kerr-reference-v297/polarization-short-gate.json")),
        readFile(resolve(process.cwd(), "dist/science/kerr-campaign-v298r1/ray-plan.json")),
      ]);
      if (polarizationBytes.byteLength <= 0 || polarizationBytes.byteLength > MAX_ARTIFACT_BYTES
        || rayPlanBytes.byteLength <= 0 || rayPlanBytes.byteLength > MAX_RAY_PLAN_SOURCE_BYTES) throw new Error("polarization-view-source-size-boundary");
      const polarization = JSON.parse(polarizationBytes.toString("utf8")) as Record<string, unknown>;
      const rayPlan = JSON.parse(rayPlanBytes.toString("utf8")) as Record<string, unknown>;
      if (createHash("sha256").update(polarizationBytes).digest("hex") !== KERR_POLARIZATION_FILE_SHA256_V301
        || polarization.evidenceSha256 !== KERR_POLARIZATION_EVIDENCE_SHA256_V301
        || createHash("sha256").update(rayPlanBytes).digest("hex") !== KERR_RAY_PLAN_FILE_SHA256_V301
        || rayPlan.planSha256 !== KERR_RAY_PLAN_SHA256_V301) throw new Error("polarization-view-source-authority-lock-mismatch");
      serialized = JSON.stringify(createKerrPolarizationAuthorityViewV304(document, polarization, rayPlan));
      if (Buffer.byteLength(serialized, "utf8") > 32 * 1024) throw new Error("polarization-view-size-boundary");
    } else if (artifact === "v303-error-budget") {
      const [polarizationBytes, rayPlanBytes, shardAuditBytes, campaignStateBytes] = await Promise.all([
        readFile(resolve(process.cwd(), "dist/science/kerr-reference-v297/polarization-short-gate.json")),
        readFile(resolve(process.cwd(), "dist/science/kerr-campaign-v298r1/ray-plan.json")),
        readFile(resolve(process.cwd(), "dist/science/kerr-campaign-v298r1/audits/shard-00.science-audit.json")),
        readFile(resolve(process.cwd(), "dist/science/kerr-campaign-v298r1/campaign-state.json")),
      ]);
      if (polarizationBytes.byteLength <= 0 || polarizationBytes.byteLength > MAX_ARTIFACT_BYTES
        || rayPlanBytes.byteLength <= 0 || rayPlanBytes.byteLength > MAX_RAY_PLAN_SOURCE_BYTES
        || shardAuditBytes.byteLength <= 0 || shardAuditBytes.byteLength > MAX_ARTIFACT_BYTES
        || campaignStateBytes.byteLength <= 0 || campaignStateBytes.byteLength > MAX_ARTIFACT_BYTES) {
        throw new Error("error-budget-source-size-boundary");
      }
      const polarization = JSON.parse(polarizationBytes.toString("utf8")) as Record<string, unknown>;
      const rayPlan = JSON.parse(rayPlanBytes.toString("utf8")) as Record<string, unknown>;
      const shardAudit = JSON.parse(shardAuditBytes.toString("utf8")) as Record<string, unknown>;
      const campaignState = JSON.parse(campaignStateBytes.toString("utf8")) as Record<string, unknown>;
      if (createHash("sha256").update(polarizationBytes).digest("hex") !== KERR_POLARIZATION_FILE_SHA256_V301
        || polarization.evidenceSha256 !== KERR_POLARIZATION_EVIDENCE_SHA256_V301
        || createHash("sha256").update(rayPlanBytes).digest("hex") !== KERR_RAY_PLAN_FILE_SHA256_V301
        || rayPlan.planSha256 !== KERR_RAY_PLAN_SHA256_V301
        || createHash("sha256").update(shardAuditBytes).digest("hex") !== KERR_SHARD0_AUDIT_FILE_SHA256_V303
        || shardAudit.auditSha256 !== KERR_SHARD0_AUDIT_SHA256_V303
        || createHash("sha256").update(campaignStateBytes).digest("hex") !== KERR_CAMPAIGN_STATE_FILE_SHA256_V303
        || campaignState.stateSha256 !== KERR_CAMPAIGN_STATE_SHA256_V303) {
        throw new Error("error-budget-source-authority-lock-mismatch");
      }
      serialized = JSON.stringify(createKerrLayeredErrorBudgetViewV303(document, polarization, rayPlan, shardAudit, campaignState));
      if (Buffer.byteLength(serialized, "utf8") > 32 * 1024) throw new Error("error-budget-view-size-boundary");
    } else if (artifact === "v302-event-timelines") {
      serialized = JSON.stringify(createKerrEventTimelineViewV302(document));
      if (Buffer.byteLength(serialized, "utf8") > 32 * 1024) throw new Error("event-timeline-view-size-boundary");
    } else if (artifact === "v301-observer-emitter-replay") {
      const [polarizationBytes, rayPlanBytes] = await Promise.all([
        readFile(resolve(process.cwd(), "dist/science/kerr-reference-v297/polarization-short-gate.json")),
        readFile(resolve(process.cwd(), "dist/science/kerr-campaign-v298r1/ray-plan.json")),
      ]);
      if (polarizationBytes.byteLength <= 0 || polarizationBytes.byteLength > MAX_ARTIFACT_BYTES
        || rayPlanBytes.byteLength <= 0 || rayPlanBytes.byteLength > MAX_RAY_PLAN_SOURCE_BYTES) {
        throw new Error("observer-emitter-source-size-boundary");
      }
      const polarization = JSON.parse(polarizationBytes.toString("utf8")) as Record<string, unknown>;
      const rayPlan = JSON.parse(rayPlanBytes.toString("utf8")) as Record<string, unknown>;
      if (createHash("sha256").update(polarizationBytes).digest("hex") !== KERR_POLARIZATION_FILE_SHA256_V301
        || polarization.evidenceSha256 !== KERR_POLARIZATION_EVIDENCE_SHA256_V301
        || createHash("sha256").update(rayPlanBytes).digest("hex") !== KERR_RAY_PLAN_FILE_SHA256_V301
        || rayPlan.planSha256 !== KERR_RAY_PLAN_SHA256_V301) {
        throw new Error("observer-emitter-source-authority-lock-mismatch");
      }
      serialized = JSON.stringify(createKerrObserverEmitterReplayViewV301(document, polarization, rayPlan));
      if (Buffer.byteLength(serialized, "utf8") > 32 * 1024) throw new Error("observer-emitter-view-size-boundary");
    } else if (artifact === "v296-critical-brackets") {
      serialized = JSON.stringify(createKerrCriticalCurveViewV300(document));
      if (Buffer.byteLength(serialized, "utf8") > 32 * 1024) throw new Error("critical-bracket-view-size-boundary");
    } else if (artifact === "v298r1-canonical-rays") {
      const rays = Array.isArray(document.rays) ? document.rays as KerrDenseRayPlanEntryV298R1[] : [];
      const canonicalRays = rays.slice(0, 16);
      if (rays.length !== 3097
        || canonicalRays.length !== 16
        || canonicalRays.some((ray, index) => ray.rayIndex !== index
          || ray.stratum !== "canonical"
          || typeof ray.rayId !== "string"
          || !Number.isFinite(ray.alphaM)
          || !Number.isFinite(ray.betaM)
          || !Number.isFinite(ray.spinA))) throw new Error("canonical-ray-conservation");
      serialized = JSON.stringify({
        version: "v299-kerr-canonical-ray-view-v1",
        planSha256: KERR_DENSE_RAY_PLAN_SHA256_V298R1,
        planFileSha256: KERR_DENSE_RAY_PLAN_FILE_SHA256_V298R1,
        canonicalRays,
      });
      if (Buffer.byteLength(serialized, "utf8") > 32 * 1024) throw new Error("canonical-ray-view-size-boundary");
    }
    return new Response(serialized, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "ETag": atlasStrongEtagV275(serialized),
        "X-Atlas-Relativity-Artifact": artifact,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return atlasJsonResponseV275("relativity-evidence", { error: "Relativity artifact is unavailable" }, {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
