/// <reference types="@webgpu/types" />

import {
  KERR_INTERACTIVE_COMPUTE_V299_VERSION,
  kerrGpuDifferentialPassedV299,
  validateKerrInteractiveComputeRequestV299,
  type KerrInteractiveComputeRequestV299,
  type KerrInteractiveComputeResponseV299,
} from "../lib/kerrInteractiveComputeV299";
import {
  KERR_INTERACTIVE_AUTHORITY_SHA256_V317,
  KERR_INTERACTIVE_COMPUTE_VERSION_V317,
  kerrGpuDifferentialPassedV317,
  validateKerrInteractiveComputeRequestV317,
  type KerrInteractiveComputeRequestV317,
  type KerrInteractiveComputeResponseV317,
} from "../lib/kerrInteractiveAuthorityV317";

type KerrInteractiveComputeRequest = KerrInteractiveComputeRequestV299 | KerrInteractiveComputeRequestV317;
type KerrInteractiveComputeResponse = KerrInteractiveComputeResponseV299 | KerrInteractiveComputeResponseV317;

const shader = /* wgsl */ `
struct Parameters {
  width: u32,
  height: u32,
  spin: f32,
  seed: f32,
}
struct Results { values: array<vec4<f32>>, }
@group(0) @binding(0) var<uniform> params: Parameters;
@group(0) @binding(1) var<storage, read_write> results: Results;

fn hash21(p: vec2<f32>) -> f32 {
  let q = fract(p * vec2<f32>(123.34, 456.21));
  return fract((q.x + dot(q, q + 45.32) + params.seed * 0.001) * q.y);
}

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) invocation: vec3<u32>) {
  let count = params.width * params.height;
  let index = invocation.x;
  if (index >= count) { return; }
  let x = index % params.width;
  let y = index / params.width;
  let uv = (vec2<f32>(f32(x) + 0.5, f32(y) + 0.5) / vec2<f32>(f32(params.width), f32(params.height))) * 2.0 - 1.0;
  let p = vec2<f32>(uv.x * 1.12, uv.y);
  let radius = length(p);
  let shadowRadius = 0.205 - abs(params.spin) * 0.018;
  let captured = radius < shadowRadius;
  let diskBand = abs(p.y + 0.055 * sin(p.x * 7.0 + params.spin)) < 0.055 && radius > shadowRadius && radius < 0.72;
  var status = 2.0;
  if (captured) { status = 1.0; }
  if (diskBand) { status = 3.0; }
  let doppler = clamp(1.0 + 0.38 * params.spin * p.x / max(radius, 0.05), 0.2, 2.4);
  let gravitational = sqrt(max(0.02, 1.0 - 2.0 / max(2.02, 4.0 + radius * 28.0)));
  let redshift = select(0.0, doppler * gravitational, diskBand);
  let diskRadius = select(0.0, 4.0 + radius * 28.0, diskBand);
  let detail = 0.82 + 0.18 * hash21(vec2<f32>(f32(x), f32(y)));
  let intensity = select(0.0, detail * redshift * redshift * redshift / max(1.0, diskRadius * diskRadius), diskBand);
  results.values[index] = vec4<f32>(status, redshift, diskRadius, intensity);
}
`;

function cpuFallback(request: KerrInteractiveComputeRequest): Float32Array {
  const count = request.width * request.height;
  const values = new Float32Array(count * 4);
  const hash = (x: number, y: number): number => {
    const value = Math.sin((x * 12.9898 + y * 78.233 + request.seed * 0.071) * 43758.5453);
    return value - Math.floor(value);
  };
  for (let index = 0; index < count; index += 1) {
    const x = index % request.width;
    const y = Math.floor(index / request.width);
    const ux = ((x + 0.5) / request.width * 2 - 1) * 1.12;
    const uy = (y + 0.5) / request.height * 2 - 1;
    const radius = Math.hypot(ux, uy);
    const shadowRadius = 0.205 - Math.abs(request.spinA) * 0.018;
    const captured = radius < shadowRadius;
    const disk = Math.abs(uy + 0.055 * Math.sin(ux * 7 + request.spinA)) < 0.055 && radius > shadowRadius && radius < 0.72;
    const status = captured ? 1 : disk ? 3 : 2;
    const diskRadius = disk ? 4 + radius * 28 : 0;
    const doppler = Math.min(2.4, Math.max(0.2, 1 + 0.38 * request.spinA * ux / Math.max(radius, 0.05)));
    const gravitational = Math.sqrt(Math.max(0.02, 1 - 2 / Math.max(2.02, diskRadius)));
    const redshift = disk ? doppler * gravitational : 0;
    const intensity = disk ? (0.82 + 0.18 * hash(x, y)) * redshift ** 3 / Math.max(1, diskRadius ** 2) : 0;
    const offset = index * 4;
    values[offset] = status;
    values[offset + 1] = redshift;
    values[offset + 2] = diskRadius;
    values[offset + 3] = intensity;
  }
  return values;
}

async function webGpu(request: KerrInteractiveComputeRequest): Promise<Float32Array> {
  if (!("gpu" in navigator)) throw new Error("webgpu-unavailable");
  const adapter = await navigator.gpu.requestAdapter({ powerPreference: "high-performance" });
  if (!adapter) throw new Error("webgpu-adapter-unavailable");
  const device = await adapter.requestDevice();
  const count = request.width * request.height;
  const byteLength = count * 4 * Float32Array.BYTES_PER_ELEMENT;
  const parameterBytes = new ArrayBuffer(16);
  const view = new DataView(parameterBytes);
  view.setUint32(0, request.width, true);
  view.setUint32(4, request.height, true);
  view.setFloat32(8, request.spinA, true);
  view.setFloat32(12, request.seed, true);
  const parameters = device.createBuffer({ size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
  const output = device.createBuffer({ size: byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC });
  const readback = device.createBuffer({ size: byteLength, usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST });
  try {
    device.queue.writeBuffer(parameters, 0, parameterBytes);
    const shaderModule = device.createShaderModule({ code: shader });
    const pipeline = device.createComputePipeline({ layout: "auto", compute: { module: shaderModule, entryPoint: "main" } });
    const bindGroup = device.createBindGroup({ layout: pipeline.getBindGroupLayout(0), entries: [
      { binding: 0, resource: { buffer: parameters } },
      { binding: 1, resource: { buffer: output } },
    ] });
    const encoder = device.createCommandEncoder();
    const pass = encoder.beginComputePass();
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.dispatchWorkgroups(Math.ceil(count / 64));
    pass.end();
    encoder.copyBufferToBuffer(output, 0, readback, 0, byteLength);
    device.queue.submit([encoder.finish()]);
    await readback.mapAsync(GPUMapMode.READ);
    return new Float32Array(readback.getMappedRange().slice(0));
  } finally {
    if (readback.mapState === "mapped") readback.unmap();
    parameters.destroy();
    output.destroy();
    readback.destroy();
    device.destroy();
  }
}

self.onmessage = (event: MessageEvent<KerrInteractiveComputeRequest>) => {
  const request = event.data;
  void (async () => {
    const currentAuthority = request.version === KERR_INTERACTIVE_COMPUTE_VERSION_V317;
    const requestValid = currentAuthority
      ? validateKerrInteractiveComputeRequestV317(request).passed
      : validateKerrInteractiveComputeRequestV299(request).passed;
    if (!requestValid) throw new Error(currentAuthority ? "invalid-v317-compute-request" : "invalid-v299-compute-request");
    let backend: KerrInteractiveComputeResponse["backend"] = "bounded-worker";
    let values: Float32Array;
    let error: string | null = null;
    const differentialPassed = currentAuthority
      ? kerrGpuDifferentialPassedV317(request.differential)
      : kerrGpuDifferentialPassedV299(request.differential);
    if (request.allowWebGpu && differentialPassed) {
      try {
        values = await webGpu(request);
        backend = "webgpu-shadow";
      } catch (reason) {
        error = reason instanceof Error ? reason.message : "webgpu-failed";
        values = cpuFallback(request);
      }
    } else {
      values = cpuFallback(request);
    }
    const common = {
      requestId: request.requestId, backend, authoritative: false as const,
      width: request.width, height: request.height, rayCount: request.width * request.height, values,
      estimatedGpuBytes: backend === "webgpu-shadow" ? values.byteLength * 2 + 16 : 0,
      resources: backend === "webgpu-shadow" ? { buffers: 3, pipelines: 1, queries: 0 } : { buffers: 0, pipelines: 0, queries: 0 },
      error,
    };
    const response: KerrInteractiveComputeResponse = currentAuthority
      ? { ...common, version: KERR_INTERACTIVE_COMPUTE_VERSION_V317, authoritySha256: KERR_INTERACTIVE_AUTHORITY_SHA256_V317 }
      : { ...common, version: KERR_INTERACTIVE_COMPUTE_V299_VERSION };
    self.postMessage(response, { transfer: [values.buffer] });
  })().catch((reason: unknown) => {
    const values = new Float32Array();
    const currentAuthority = request?.version === KERR_INTERACTIVE_COMPUTE_VERSION_V317;
    const common = {
      requestId: request?.requestId ?? "invalid", backend: "precomputed-transfer-map" as const,
      authoritative: false as const, width: 0, height: 0, rayCount: 0, values,
      estimatedGpuBytes: 0, resources: { buffers: 0, pipelines: 0, queries: 0 },
      error: reason instanceof Error ? reason.message : currentAuthority ? "v317-compute-failed" : "v299-compute-failed",
    };
    const response: KerrInteractiveComputeResponse = currentAuthority
      ? { ...common, version: KERR_INTERACTIVE_COMPUTE_VERSION_V317, authoritySha256: KERR_INTERACTIVE_AUTHORITY_SHA256_V317 }
      : { ...common, version: KERR_INTERACTIVE_COMPUTE_V299_VERSION };
    self.postMessage(response, { transfer: [values.buffer] });
  });
};
