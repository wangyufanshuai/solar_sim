"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { TRUE_VOID_TONE_MAPPING_EXPOSURE } from "../lib/trueVoid";

export default function CinematicExposureController({
  enabled,
  selectedBodyId,
  visualTest,
}: {
  enabled: boolean;
  selectedBodyId: string | null;
  visualTest: boolean;
}) {
  const gl = useThree((state) => state.gl);
  const frameRef = useRef(0);
  const exposureRef = useRef(TRUE_VOID_TONE_MAPPING_EXPOSURE);
  const sample = useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = 16;
    canvas.height = 16;
    return { canvas, context: canvas.getContext("2d", { willReadFrequently: true }) };
  }, []);

  useFrame((_, delta) => {
    if (!enabled || visualTest || !sample?.context) {
      gl.toneMappingExposure = TRUE_VOID_TONE_MAPPING_EXPOSURE;
      exposureRef.current = TRUE_VOID_TONE_MAPPING_EXPOSURE;
      return;
    }
    frameRef.current += 1;
    if (frameRef.current % 12 !== 0) return;
    try {
      sample.context.drawImage(gl.domElement, 0, 0, 16, 16);
      const pixels = sample.context.getImageData(0, 0, 16, 16).data;
      let logSum = 0;
      let count = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        const luminance =
          (pixels[i]! * 0.2126 + pixels[i + 1]! * 0.7152 + pixels[i + 2]! * 0.0722) / 255;
        logSum += Math.log(Math.max(luminance, 1e-4));
        count += 1;
      }
      const average = Math.exp(logSum / Math.max(count, 1));
      const isSun = selectedBodyId === "sun";
      const minExposure = isSun ? 0.65 : selectedBodyId ? 0.72 : 0.68;
      const maxExposure = isSun ? 0.88 : selectedBodyId ? 1.04 : 1.15;
      const target = THREE.MathUtils.clamp(0.18 / Math.max(average, 0.025), minExposure, maxExposure);
      const alpha = 1 - Math.pow(0.015, Math.max(delta, 0.001));
      exposureRef.current = THREE.MathUtils.lerp(exposureRef.current, target, alpha);
      gl.toneMappingExposure = exposureRef.current;
    } catch {
      gl.toneMappingExposure = TRUE_VOID_TONE_MAPPING_EXPOSURE;
    }
  }, 3);
  return null;
}
