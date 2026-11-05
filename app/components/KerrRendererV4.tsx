"use client";

/**
 * R3F wrapper for the Kerr v4 per-pixel ray tracer (app/lib/kerr-v4).
 *
 * Replaces the 2D heuristic in KerrRayTraceRendererV3 for the black-hole view:
 * every pixel integrates a Kerr null geodesic from the current three.js camera,
 * so orbiting the camera, changing spin or inclination all change the image
 * physically. The same shader is scored against the float64 reference in
 * app/lib/kerr-v4/validation (see README there).
 *
 * Coordinates: the hole sits at `center` (scene units) with its spin along
 * scene +Y (default) or +Z (`spinAxis="z"`). `sceneUnitsPerM` sets the scale
 * (how many scene units one gravitational radius M occupies). For +Y, three
 * (x, y, z) maps to Kerr–Schild (x, −z, y), a proper rotation; for +Z the
 * axes coincide.
 *
 * Cost control: the trace is rendered into an offscreen target at
 * `resolutionScale` and only re-traced when the camera, spin or settings
 * change (or every frame when `animateDisk` is on). Once the view has been
 * unchanged for `settleMs`, one more trace at `stillResolutionScale` replaces
 * it. Measured on an RTX 4060 Laptop GPU (scripts/kerr-v4/benchmark.mts):
 * 1920x1080 per-pixel trace 43 ms, 960x540 trace 11.6 ms.
 */
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { orbitCamera, type KerrCameraInput } from "../lib/kerr-v4/kerrCameraV4";
import { KERR_V4_CINEMATIC, prepareKerrUniformsV4, type KerrRenderSettingsV4 } from "../lib/kerr-v4/kerrShaderV4";
import { applyKerrUniformsV4, createKerrTracePassV4 } from "../lib/kerr-v4/kerrThreeV4";
import { outerHorizon } from "../lib/kerr-v4/kerrMetricKS";

const displayVertex = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const displayFragment = /* glsl */ `
uniform sampler2D uTrace;
varying vec2 vUv;
void main() { gl_FragColor = texture2D(uTrace, vUv); }
`;

export type KerrRendererV4Props = {
  spin: number;
  center?: [number, number, number];
  sceneUnitsPerM?: number;
  settings?: Partial<KerrRenderSettingsV4>;
  /** fraction of the canvas resolution traced while the view changes */
  resolutionScale?: number;
  /** fraction traced once the view has settled (1 = native resolution) */
  stillResolutionScale?: number;
  /** milliseconds without change before the still trace */
  settleMs?: number;
  /** re-trace every frame with Keplerian disk rotation */
  animateDisk?: boolean;
  /** scene axis along which the hole spins (the disk lies in the perpendicular plane) */
  spinAxis?: "y" | "z";
  /** "tonemapped" draws final sRGB; "linear-hdr" leaves tone mapping/bloom to the scene's post pipeline */
  output?: "tonemapped" | "linear-hdr";
};

function toKS(v: THREE.Vector3, spinAxis: "y" | "z"): [number, number, number] {
  return spinAxis === "z" ? [v.x, v.y, v.z] : [v.x, -v.z, v.y];
}

export function KerrRendererV4({
  spin,
  center = [0, 0, 0],
  sceneUnitsPerM = 1,
  settings,
  resolutionScale = 0.5,
  stillResolutionScale = 1,
  settleMs = 250,
  animateDisk = false,
  spinAxis = "y",
  output = "tonemapped",
}: KerrRendererV4Props) {
  const gl = useThree((s) => s.gl);
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);
  const merged = useMemo(() => ({ ...KERR_V4_CINEMATIC, ...settings }), [settings]);

  const width = Math.max(64, Math.floor(size.width * dpr * resolutionScale));
  const height = Math.max(64, Math.floor(size.height * dpr * resolutionScale));
  const stillScale = Math.max(resolutionScale, stillResolutionScale);
  const stillWidth = Math.max(64, Math.floor(size.width * dpr * stillScale));
  const stillHeight = Math.max(64, Math.floor(size.height * dpr * stillScale));

  const makeTarget = (w: number, h: number) =>
    new THREE.WebGLRenderTarget(w, h, {
      type: output === "linear-hdr" ? THREE.HalfFloatType : THREE.UnsignedByteType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: false,
      stencilBuffer: false,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const target = useMemo(() => makeTarget(width, height), [width, height, output]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stillTarget = useMemo(() => makeTarget(stillWidth, stillHeight), [stillWidth, stillHeight, output]);

  const trace = useMemo(() => createKerrTracePassV4(), []);

  const display = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: displayVertex,
        fragmentShader: displayFragment,
        uniforms: { uTrace: { value: target.texture } },
        depthTest: false,
        depthWrite: false,
        toneMapped: output === "linear-hdr",
      }),
    [target, output],
  );

  useEffect(
    () => () => {
      target.dispose();
    },
    [target],
  );
  useEffect(
    () => () => {
      stillTarget.dispose();
    },
    [stillTarget],
  );
  useEffect(
    () => () => {
      display.dispose();
    },
    [display],
  );
  useEffect(
    () => () => {
      trace.dispose();
    },
    [trace],
  );

  const lastKey = useRef("");
  const lastChange = useRef(0);
  const stillDone = useRef(true);
  const lastInput = useRef<KerrCameraInput | null>(null);
  const tmp = useMemo(() => ({ pos: new THREE.Vector3(), dir: new THREE.Vector3(), up: new THREE.Vector3() }), []);

  useFrame((state) => {
    const cam = state.camera as THREE.PerspectiveCamera;
    tmp.pos.copy(cam.position).sub(new THREE.Vector3(...center)).divideScalar(sceneUnitsPerM);
    cam.getWorldDirection(tmp.dir);
    tmp.up.set(0, 1, 0).applyQuaternion(cam.quaternion);
    const time = animateDisk ? state.clock.elapsedTime * 20 : 0;
    const key = [tmp.pos.toArray(), tmp.dir.toArray(), tmp.up.toArray(), spin, spinAxis, cam.fov, width, height, JSON.stringify(merged), animateDisk ? time : 0]
      .flat()
      .map((v) => (typeof v === "number" ? v.toFixed(5) : v))
      .join("|");
    const traceInto = (into: THREE.WebGLRenderTarget, input: KerrCameraInput, w: number, h: number) => {
      const values = prepareKerrUniformsV4({ ...input, aspect: w / h }, merged);
      applyKerrUniformsV4(trace.material, values, merged, w, h, output === "linear-hdr" ? 2 : 0, time);
      const previous = gl.getRenderTarget();
      gl.setRenderTarget(into);
      gl.render(trace.scene, trace.camera);
      gl.setRenderTarget(previous);
      display.uniforms.uTrace.value = into.texture;
    };
    if (key === lastKey.current) {
      const settled = performance.now() - lastChange.current >= settleMs;
      if (!stillDone.current && settled && !animateDisk && lastInput.current) {
        stillDone.current = true;
        try {
          traceInto(stillTarget, lastInput.current, stillWidth, stillHeight);
        } catch {
          /* keep the interactive trace */
        }
      }
      return;
    }

    // a static observer needs to be outside the ergosphere; keep a safety margin
    const rMin = outerHorizon(spin) + 4;
    if (tmp.pos.length() < rMin) tmp.pos.setLength(rMin);
    const input: KerrCameraInput = {
      spin,
      position: toKS(tmp.pos, spinAxis),
      forward: toKS(tmp.dir, spinAxis),
      up: toKS(tmp.up, spinAxis),
      fovY: THREE.MathUtils.degToRad(cam.fov ?? 45),
      aspect: width / height,
    };
    try {
      traceInto(target, input, width, height);
    } catch {
      return;
    }
    lastKey.current = key;
    lastInput.current = input;
    lastChange.current = performance.now();
    stillDone.current = stillScale <= resolutionScale;
  }, -1);

  return (
    <mesh frustumCulled={false} renderOrder={-1000} material={display}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}

/** Convenience: camera input for a fixed orbit pose, e.g. for stills or tests. */
export { orbitCamera };
