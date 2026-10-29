/// <reference types="@webgpu/types" />

import {
  KERR_GPU_DIFFERENTIAL_SAMPLE_COUNT_V318,
  validateKerrGpuDifferentialReferenceV318,
  type KerrGpuDifferentialProbeRequestV318,
  type KerrGpuDifferentialProbeWorkerResponseV318,
  type KerrGpuReferenceClassV318,
} from "../lib/kerrGpuDifferentialV318";

const shader = /* wgsl */ `
struct Parameters { count: u32, }
struct ProbeValues { values: array<vec4<f32>>, }
@group(0) @binding(0) var<uniform> params: Parameters;
@group(0) @binding(1) var<storage, read> probes: ProbeValues;
@group(0) @binding(2) var<storage, read_write> results: ProbeValues;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) invocation: vec3<u32>) {
  let index = invocation.x;
  if (index >= params.count) { return; }
  let probe = probes.values[index];
  let alpha_m = probe.x;
  let beta_m = probe.y;
  let spin = probe.z;
  let uv = vec2<f32>(alpha_m / 22.0, beta_m / 16.0);
  let p = vec2<f32>(uv.x * 1.12, uv.y);
  let radius = length(p);
  let shadow_radius = 0.205 - abs(spin) * 0.018;
  let captured = radius < shadow_radius;
  let disk_band = abs(p.y + 0.055 * sin(p.x * 7.0 + spin)) < 0.055 && radius > shadow_radius && radius < 0.72;
  var classification = 2.0;
  if (captured) { classification = 1.0; }
  if (disk_band) { classification = 3.0; }
  let disk_radius = select(0.0, 4.0 + radius * 28.0, disk_band);
  let doppler = clamp(1.0 + 0.38 * spin * p.x / max(radius, 0.05), 0.2, 2.4);
  let gravitational = sqrt(max(0.02, 1.0 - 2.0 / max(2.02, disk_radius)));
  let redshift = select(0.0, doppler * gravitational, disk_band);
  results.values[index] = vec4<f32>(classification, redshift, disk_radius, 0.0);
}
`;

function className(value: number): KerrGpuReferenceClassV318 | null {
  return value === 1 ? "capture" : value === 2 ? "escape" : value === 3 ? "disk-hit" : null;
}

async function runProbe(request: KerrGpuDifferentialProbeRequestV318): Promise<KerrGpuDifferentialProbeWorkerResponseV318> {
  const validation = validateKerrGpuDifferentialReferenceV318(request.reference);
  if (request.version !== "v318-kerr-gpu-probe-request-v1" || typeof request.requestId !== "string"
    || request.requestId.length < 1 || request.requestId.length > 128 || !validation.passed) {
    throw new Error("v318-gpu-probe-request-invalid");
  }
  if (!("gpu" in navigator)) throw new Error("webgpu-unavailable");
  const adapter = await navigator.gpu.requestAdapter({ powerPreference: "high-performance" });
  if (!adapter) throw new Error("webgpu-adapter-unavailable");
  const device = await adapter.requestDevice();
  const probeCount = request.reference.sampleCount + request.reference.criticalBracketCount * 2;
  const inputValues = new Float32Array(probeCount * 4);
  request.reference.samples.forEach((sample, index) => {
    inputValues.set([sample.alphaM, sample.betaM, sample.spinA, 0], index * 4);
  });
  request.reference.criticalBrackets.forEach((bracket, index) => {
    const offset = (KERR_GPU_DIFFERENTIAL_SAMPLE_COUNT_V318 + index * 2) * 4;
    inputValues.set([bracket.leftImpactM, 0, bracket.spinA, 1], offset);
    inputValues.set([bracket.rightImpactM, 0, bracket.spinA, 1], offset + 4);
  });
  const parameterBytes = new Uint32Array([probeCount, 0, 0, 0]);
  const byteLength = inputValues.byteLength;
  const parameters = device.createBuffer({ size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
  const inputs = device.createBuffer({ size: byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });
  const outputs = device.createBuffer({ size: byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC });
  const readback = device.createBuffer({ size: byteLength, usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST });
  let gpuValidationErrorCount = 0;
  try {
    device.pushErrorScope("validation");
    device.queue.writeBuffer(parameters, 0, parameterBytes);
    device.queue.writeBuffer(inputs, 0, inputValues);
    const shaderModule = device.createShaderModule({ code: shader });
    const pipeline = device.createComputePipeline({ layout: "auto", compute: { module: shaderModule, entryPoint: "main" } });
    const bindGroup = device.createBindGroup({ layout: pipeline.getBindGroupLayout(0), entries: [
      { binding: 0, resource: { buffer: parameters } },
      { binding: 1, resource: { buffer: inputs } },
      { binding: 2, resource: { buffer: outputs } },
    ] });
    const encoder = device.createCommandEncoder();
    const pass = encoder.beginComputePass();
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.dispatchWorkgroups(Math.ceil(probeCount / 64));
    pass.end();
    encoder.copyBufferToBuffer(outputs, 0, readback, 0, byteLength);
    device.queue.submit([encoder.finish()]);
    await readback.mapAsync(GPUMapMode.READ);
    const resultValues = new Float32Array(readback.getMappedRange().slice(0));
    const validationError = await device.popErrorScope();
    if (validationError) gpuValidationErrorCount += 1;
    let invalidCount = 0;
    const samples = request.reference.samples.map((sample, index) => {
      const classification = className(resultValues[index * 4]);
      const redshift = resultValues[index * 4 + 1];
      if (!classification || !Number.isFinite(redshift) || redshift < 0) invalidCount += 1;
      return Object.freeze({
        sampleIndex: index,
        rayId: sample.rayId,
        classification: classification ?? "escape",
        redshiftFactor: classification === "disk-hit" && Number.isFinite(redshift) && redshift > 0 ? redshift : null,
      });
    });
    const criticalBrackets = request.reference.criticalBrackets.map((bracket, index) => {
      const offset = KERR_GPU_DIFFERENTIAL_SAMPLE_COUNT_V318 + index * 2;
      const leftClass = className(resultValues[offset * 4]);
      const rightClass = className(resultValues[(offset + 1) * 4]);
      if (!leftClass || !rightClass) invalidCount += 1;
      return Object.freeze({
        bracketIndex: index,
        leftClass: leftClass ?? "escape",
        rightClass: rightClass ?? "escape",
        estimatedImpactM: (bracket.leftImpactM + bracket.rightImpactM) / 2,
      });
    });
    return Object.freeze({
      version: "v318-kerr-gpu-probe-worker-response-v1",
      requestId: request.requestId,
      status: "completed",
      result: Object.freeze({
        version: "v318-kerr-gpu-probe-result-v1",
        authoritySha256: request.reference.authoritySha256,
        backend: "webgpu-shadow",
        samples: Object.freeze(samples),
        criticalBrackets: Object.freeze(criticalBrackets),
        invalidCount,
        gpuValidationErrorCount,
      }),
      error: null,
    });
  } finally {
    if (readback.mapState === "mapped") readback.unmap();
    parameters.destroy();
    inputs.destroy();
    outputs.destroy();
    readback.destroy();
    device.destroy();
  }
}

self.onmessage = (event: MessageEvent<KerrGpuDifferentialProbeRequestV318>) => {
  const request = event.data;
  void runProbe(request).then((response) => self.postMessage(response)).catch((reason: unknown) => {
    const response: KerrGpuDifferentialProbeWorkerResponseV318 = {
      version: "v318-kerr-gpu-probe-worker-response-v1",
      requestId: typeof request?.requestId === "string" ? request.requestId.slice(0, 128) : "invalid",
      status: "unavailable",
      result: null,
      error: (reason instanceof Error ? reason.message : "v318-gpu-probe-failed").slice(0, 256),
    };
    self.postMessage(response);
  });
};
