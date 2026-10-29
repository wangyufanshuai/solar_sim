"use client";

import { acquireAtlasResource } from "./atlasResourceLifecycle";
import { publishAtlasBrowserObservabilityV294 } from "./atlasBrowserObservabilityV294";
import {
  KERR_SCIENCE_PAYLOAD_AUTHORITY_SHA256_V315,
  createSparseKerrSciencePayloadV315,
} from "./kerrSciencePayloadV315";
import {
  cloneKerrScienceTransferPayloadV299,
  type KerrScienceTransferPayloadV299,
} from "./strongGravityRenderingV299";

type AcquiredKerrSciencePayloadV299 = {
  payload: KerrScienceTransferPayloadV299;
  release: () => void;
};

export type KerrSciencePayloadAcquireOptionsV299 = Readonly<{
  signal?: AbortSignal;
}>;

let payloadPromise: Promise<KerrScienceTransferPayloadV299> | null = null;
let cachedPayload: KerrScienceTransferPayloadV299 | null = null;
let cacheRelease: (() => void) | null = null;
let referenceCount = 0;
let pendingConsumerCount = 0;
let loadAbortController: AbortController | null = null;

function payloadBytes(payload: KerrScienceTransferPayloadV299): number {
  return payload.alphaM.byteLength + payload.betaM.byteLength + payload.spinA.byteLength
    + payload.classification.byteLength + payload.kerrSchildClassification.byteLength
    + payload.selectedEventKind.byteLength + payload.selectedEventParameter.byteLength + payload.selectedEventRadiusM.byteLength
    + payload.eventCount.byteLength + payload.validEventCount.byteLength + payload.invalidEventCount.byteLength
    + payload.validDiskCrossingCount.byteLength
    + payload.emissionRadiusM.byteLength + payload.kerrSchildEmissionRadiusM.byteLength + payload.geometryDiskRadiusDifferenceM.byteLength
    + payload.redshiftFactor.byteLength + payload.kerrSchildRedshiftFactor.byteLength + payload.geometryRedshiftDifference.byteLength
    + payload.redshiftApplicable.byteLength + payload.imageOrder.byteLength + payload.imageOrderApplicable.byteLength
    + payload.photonEnergy.byteLength + payload.photonAngularMomentumZ.byteLength
    + payload.emitterAngularVelocity.byteLength + payload.emitterUt.byteLength + payload.emitterUphi.byteLength
    + payload.emitterPhotonFrequency.byteLength + payload.emitterFourVelocityNormResidual.byteLength
    + payload.emitterWaveOrthogonalityResidual.byteLength + payload.emitterPolarizationOrthogonalityResidual.byteLength
    + payload.emitterPolarizationNormResidual.byteLength
    + payload.diskEventCoordinateT.byteLength + payload.diskEventCoordinateTheta.byteLength + payload.diskEventCoordinatePhi.byteLength
    + payload.photonWavevectorT.byteLength + payload.photonWavevectorR.byteLength
    + payload.photonWavevectorTheta.byteLength + payload.photonWavevectorPhi.byteLength
    + payload.polarizationVectorT.byteLength + payload.polarizationVectorR.byteLength
    + payload.polarizationVectorTheta.byteLength + payload.polarizationVectorPhi.byteLength
    + payload.walkerPenroseConstantReal.byteLength + payload.walkerPenroseConstantImaginary.byteLength
    + payload.parallelTransportSolverTolerance.byteLength + payload.parallelTransportStepCount.byteLength
    + payload.parallelTransportSampleCount.byteLength + payload.parallelTransportFinalKsNormResidual.byteLength
    + payload.evpaDeg.byteLength + payload.parallelTransportEvpaDeg.byteLength + payload.evpaDifferenceDeg.byteLength
    + payload.evpaApplicable.byteLength + payload.polarizationNullResidualNormalized.byteLength
    + payload.polarizationOrthogonalityResidualNormalized.byteLength + payload.polarizationNormResidual.byteLength
    + payload.walkerPenroseInvariantDrift.byteLength + payload.polarizationEndpointResidual.byteLength
    + payload.screenDirectionResidual.byteLength + payload.intensity.byteLength
    + payload.massShellResidualNormalized.byteLength + payload.carterResidualNormalized.byteLength
    + payload.kerrSchildMassShellResidualNormalized.byteLength + payload.metricPullbackResidual.byteLength
    + payload.covectorRoundtripResidual.byteLength + payload.metricDerivativeAuditResidual.byteLength
    + payload.tetradResidual.byteLength + payload.kerrSchildTetradResidual.byteLength;
}

function abortError(): DOMException {
  return new DOMException("Kerr science payload acquisition aborted", "AbortError");
}

function releaseAuthorityCacheIfUnused(): void {
  if (pendingConsumerCount !== 0 || referenceCount !== 0) return;
  if (!cachedPayload) loadAbortController?.abort();
  cacheRelease?.();
  cacheRelease = null;
  cachedPayload = null;
  payloadPromise = null;
}

function awaitWithSignal<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return promise;
  if (signal.aborted) return Promise.reject(abortError());
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(abortError());
    signal.addEventListener("abort", onAbort, { once: true });
    promise.then(
      (value) => {
        signal.removeEventListener("abort", onAbort);
        resolve(value);
      },
      (error) => {
        signal.removeEventListener("abort", onAbort);
        reject(error);
      },
    );
  });
}

async function loadPayload(signal: AbortSignal): Promise<KerrScienceTransferPayloadV299> {
  const [geometryResponse, polarizationResponse, rayPlanResponse] = await Promise.all([
    fetch("/api/atlas/relativity-evidence/artifacts/v315-corrected-geometry-source", { cache: "no-store", signal }),
    fetch("/api/atlas/relativity-evidence/artifacts/v315-corrected-polarization-source", { cache: "no-store", signal }),
    fetch("/api/atlas/relativity-evidence/artifacts/v314-canonical-rays", { cache: "no-store", signal }),
  ]);
  if (!geometryResponse.ok || !polarizationResponse.ok || !rayPlanResponse.ok) throw new Error("qualified-kerr-artifact-unavailable");
  const [geometry, polarization, rayPlan] = await Promise.all([geometryResponse.json(), polarizationResponse.json(), rayPlanResponse.json()]);
  return createSparseKerrSciencePayloadV315(geometry, polarization, rayPlan);
}

export async function acquireKerrSciencePayloadV299(
  options: KerrSciencePayloadAcquireOptionsV299 = {},
): Promise<AcquiredKerrSciencePayloadV299> {
  const { signal } = options;
  if (signal?.aborted) throw abortError();
  pendingConsumerCount += 1;
  let pending = true;
  const releasePending = (cleanup: boolean) => {
    if (!pending) return;
    pending = false;
    pendingConsumerCount = Math.max(0, pendingConsumerCount - 1);
    if (cleanup) releaseAuthorityCacheIfUnused();
  };
  if (!payloadPromise) {
    const controller = new AbortController();
    loadAbortController = controller;
    payloadPromise = loadPayload(controller.signal).then((payload) => {
      if (controller.signal.aborted) throw abortError();
      cachedPayload = payload;
      cacheRelease = acquireAtlasResource("typed-array-cache", "kerr", "kerr-v315-corrected-short-authority-payload", {
        owner: "strong-gravity-science",
        estimatedBytes: payloadBytes(payload),
      });
      if (loadAbortController === controller) loadAbortController = null;
      publishAtlasBrowserObservabilityV294({
        scientificPayloadSha256: KERR_SCIENCE_PAYLOAD_AUTHORITY_SHA256_V315,
        geometryAuthoritySha256: payload.geometryEvidenceSha256,
        polarizationAuthoritySha256: payload.polarizationEvidenceSha256,
        rayPlanAuthoritySha256: payload.rayPlanSha256,
        denseAggregateSha256: payload.denseAggregateSha256,
        scienceAuthorityKind: payload.authorityKind,
        scienceErrorBudgetVersion: payload.errorBudgetVersion,
        observerFrameVersion: payload.observerFrameVersion,
        emitterFrameVersion: payload.emitterFrameVersion,
        walkerPenroseModel: payload.walkerPenroseModel,
        parallelTransportModel: payload.parallelTransportModel,
        applicableDiskRayCount: payload.classification.reduce((count, value) => count + (value === 3 ? 1 : 0), 0),
      });
      return payload;
    }).catch((error) => {
      if (loadAbortController === controller) {
        loadAbortController = null;
        payloadPromise = null;
      }
      throw error;
    });
  }
  let payload: KerrScienceTransferPayloadV299;
  try {
    payload = cachedPayload ?? await awaitWithSignal(payloadPromise, signal);
    if (signal?.aborted) throw abortError();
    releasePending(false);
  } catch (error) {
    releasePending(true);
    throw error;
  }
  // TypedArrays remain writable even when their containing object is frozen.
  // Give every consumer an isolated view so UI/cinematic code cannot mutate
  // the cached CPU authority or another consumer's scientific measurements.
  const isolatedPayload = cloneKerrScienceTransferPayloadV299(payload);
  const releaseIsolatedPayload = acquireAtlasResource("typed-array-cache", "kerr", "kerr-v299-science-payload-view", {
    owner: "strong-gravity-science-consumer",
    estimatedBytes: payloadBytes(isolatedPayload),
  });
  referenceCount += 1;
  let released = false;
  const acquired: AcquiredKerrSciencePayloadV299 = {
    payload: isolatedPayload,
    release: () => {
      if (released) return;
      released = true;
      signal?.removeEventListener("abort", acquired.release);
      releaseIsolatedPayload();
      referenceCount = Math.max(0, referenceCount - 1);
      if (referenceCount === 0) {
        releaseAuthorityCacheIfUnused();
        publishAtlasBrowserObservabilityV294({
          scientificPayloadSha256: null,
          geometryAuthoritySha256: null,
          polarizationAuthoritySha256: null,
          rayPlanAuthoritySha256: null,
          denseAggregateSha256: null,
          scienceAuthorityKind: null,
          scienceErrorBudgetVersion: null,
          observerFrameVersion: null,
          emitterFrameVersion: null,
          walkerPenroseModel: null,
          parallelTransportModel: null,
          applicableDiskRayCount: null,
        });
      }
    },
  };
  signal?.addEventListener("abort", acquired.release, { once: true });
  return acquired;
}
