/**
 * three.js bindings for the Kerr v4 shader: material creation and uniform
 * upload. Kept framework-agnostic (no React) so it can be exercised in a plain
 * three.js test as well as from the R3F component.
 */
import * as THREE from "three";
import { kerrFragmentShaderV4, type KerrRenderSettingsV4, type KerrUniformValuesV4 } from "./kerrShaderV4";

const traceVertex = /* glsl */ `
in vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

export type KerrTracePassV4 = {
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  material: THREE.RawShaderMaterial;
  dispose: () => void;
};

export function createKerrTracePassV4(): KerrTracePassV4 {
  const material = new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader: traceVertex,
    fragmentShader: kerrFragmentShaderV4.replace(/^#version 300 es\s*/m, ""),
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uResolution: { value: new THREE.Vector2(1, 1) },
      uSpin: { value: 0 },
      uRh: { value: 2 },
      uCapture: { value: 2.02 },
      uRIn: { value: 6 },
      uROut: { value: 20 },
      uEscapeR: { value: 600 },
      uStepScale: { value: 0.04 },
      uMaxSteps: { value: 1500 },
      uCamPos: { value: new THREE.Vector3() },
      uU: { value: new THREE.Vector4() },
      uEF: { value: new THREE.Vector4() },
      uER: { value: new THREE.Vector4() },
      uEU: { value: new THREE.Vector4() },
      uG: { value: new THREE.Matrix4() },
      uTanHalfFov: { value: 0.3 },
      uAspect: { value: 1 },
      uFlux4: { value: new Float32Array(128) },
      uBB: { value: new Float32Array(64 * 3) },
      uBBLogY4: { value: new Float32Array(64) },
      uDiskTMax: { value: 7000 },
      uExposure: { value: 0.6 },
      uStarBrightness: { value: 1 },
      uTime: { value: 0 },
      uDiskDetail: { value: 0.85 },
      uLumGamma: { value: 0.5 },
      uMode: { value: 0 },
    },
  });
  const geometry = new THREE.BufferGeometry();
  // itemSize 3 keeps three's bounding-sphere code happy; the shader reads .xy
  geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  const scene = new THREE.Scene();
  scene.add(mesh);
  return {
    scene,
    camera: new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1),
    material,
    dispose: () => {
      material.dispose();
      geometry.dispose();
    },
  };
}

export function applyKerrUniformsV4(
  material: THREE.RawShaderMaterial,
  values: KerrUniformValuesV4,
  settings: KerrRenderSettingsV4,
  width: number,
  height: number,
  mode: 0 | 1 | 2,
  time: number,
) {
  const u = material.uniforms;
  const f = values.frame;
  u.uResolution.value.set(width, height);
  u.uSpin.value = f.spin;
  u.uRh.value = values.rh;
  u.uCapture.value = values.capture;
  u.uRIn.value = values.flux.rIn;
  u.uROut.value = values.flux.rOut;
  u.uEscapeR.value = values.escapeR;
  u.uStepScale.value = settings.stepScale;
  u.uMaxSteps.value = settings.maxSteps;
  u.uCamPos.value.set(f.position[0], f.position[1], f.position[2]);
  u.uU.value.fromArray(f.u);
  u.uEF.value.fromArray(f.eForward);
  u.uER.value.fromArray(f.eRight);
  u.uEU.value.fromArray(f.eUp);
  // Matrix4.set takes row-major arguments; the metric is symmetric anyway
  const g = f.metric;
  u.uG.value.set(g[0][0], g[0][1], g[0][2], g[0][3], g[1][0], g[1][1], g[1][2], g[1][3], g[2][0], g[2][1], g[2][2], g[2][3], g[3][0], g[3][1], g[3][2], g[3][3]);
  u.uTanHalfFov.value = f.tanHalfFovY;
  u.uAspect.value = f.aspect;
  u.uFlux4.value = values.flux.values;
  u.uBB.value = values.bb;
  u.uBBLogY4.value = values.bbLogY;
  u.uDiskTMax.value = settings.diskTMax;
  u.uExposure.value = settings.exposure;
  u.uStarBrightness.value = settings.starBrightness;
  u.uTime.value = time;
  u.uDiskDetail.value = mode === 1 ? 0 : settings.diskDetail;
  u.uLumGamma.value = settings.luminanceGamma;
  u.uMode.value = mode;
}
