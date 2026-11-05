export type KerrGpuWorkerRequestV283 = {
  version: "v283-kerr-gpu-worker-request";
  requestId: string;
  intent: "research-kerr";
  width: number;
  height: number;
  spinA: number;
  observerRadiusM: number;
  authorityArtifactSha256: string;
};

export type KerrGpuWorkerResponseV283 = {
  version: "v283-kerr-gpu-worker-response";
  requestId: string;
  backend: "webgpu-shadow" | "bounded-worker" | "precomputed-transfer-map";
  authoritative: false;
  rayCount: number;
  gpuBytes: number;
  validation: { classificationAgreement: number; criticalCurveErrorPx: number; redshiftError: number; passed: boolean };
  error: string | null;
};

export type KerrGpuComputeSnapshotV283 = {
  status: "disabled" | "loading" | "active" | "fallback" | "failed";
  backend: KerrGpuWorkerResponseV283["backend"] | "none";
  cpuAuthority: "v283-float64-dop853";
  chunkLoaded: boolean;
  liteAllowed: false;
  estimatedBytes: number;
};

export function resolveKerrGpuBackendV283(args: {
  intent: "solar" | "ordinary-research" | "research-kerr";
  lite: boolean;
  webGpuAvailable: boolean;
  differential?: KerrGpuWorkerResponseV283["validation"];
}): KerrGpuComputeSnapshotV283 {
  if (args.lite || args.intent !== "research-kerr") return { status: "disabled", backend: "none", cpuAuthority: "v283-float64-dop853", chunkLoaded: false, liteAllowed: false, estimatedBytes: 0 };
  const validation = args.differential;
  const gpuPassed = validation && validation.passed && validation.classificationAgreement >= 0.999 && validation.criticalCurveErrorPx < 0.5 && validation.redshiftError < 0.005;
  if (args.webGpuAvailable && gpuPassed) return { status: "active", backend: "webgpu-shadow", cpuAuthority: "v283-float64-dop853", chunkLoaded: true, liteAllowed: false, estimatedBytes: 64 * 2 ** 20 };
  return { status: "fallback", backend: "bounded-worker", cpuAuthority: "v283-float64-dop853", chunkLoaded: true, liteAllowed: false, estimatedBytes: 16 * 2 ** 20 };
}
