"use client";

/**
 * Glowing anti-aliased trajectory line for the launch vehicle.
 *
 * Dual-pass rendering:
 *   1. Thin white core line (1-2px, crisp)
 *   2. Wider glow pass (6-8px, lower opacity, cyan/white tint)
 *
 * Reads trajectory points from the launch telemetry ring buffer and
 * converts SI positions to scene units. Uses adaptive decimation for
 * large point counts (caps at ~50k rendered vertices).
 *
 * Registered as bloom targets for post-processing glow.
 */

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Line2, LineGeometry, LineMaterial } from "three-stdlib";
import type { LaunchSimState } from "../lib/launchTelemetryTypes";

type Props = {
  state: LaunchSimState;
  maxRenderedPoints?: number;
};

const MAX_RENDER = 50_000;
const CORE_WIDTH = 1.5;
const GLOW_WIDTH = 6.0;
const CORE_COLOR = new THREE.Color("#ffffff");
const GLOW_COLOR = new THREE.Color("#44ddff");

export default function LaunchTrajectoryLine({
  state,
  maxRenderedPoints = MAX_RENDER,
}: Props) {
  const coreRef = useRef<Line2>(null);
  const glowRef = useRef<Line2>(null);
  const coreGeoRef = useRef<LineGeometry | null>(null);
  const glowGeoRef = useRef<LineGeometry | null>(null);
  const lastCountRef = useRef(0);

  // Create line bundles
  const { coreBundle, glowBundle } = useMemo(() => {
    const coreGeo = new LineGeometry();
    const coreMat = new LineMaterial({
      linewidth: CORE_WIDTH,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      depthTest: true,
      toneMapped: false,
    });
    coreMat.color.copy(CORE_COLOR);
    const coreLine = new Line2(coreGeo, coreMat);
    coreLine.frustumCulled = false;
    coreLine.renderOrder = -30;
    coreLine.raycast = () => {};

    const glowGeo = new LineGeometry();
    const glowMat = new LineMaterial({
      linewidth: GLOW_WIDTH,
      transparent: true,
      opacity: 0.25,
      depthWrite: false,
      depthTest: true,
      toneMapped: false,
    });
    glowMat.color.copy(GLOW_COLOR);
    const glowLine = new Line2(glowGeo, glowMat);
    glowLine.frustumCulled = false;
    glowLine.renderOrder = -31;
    glowLine.raycast = () => {};

    coreGeoRef.current = coreGeo;
    glowGeoRef.current = glowGeo;

    return {
      coreBundle: { line: coreLine, geo: coreGeo, mat: coreMat },
      glowBundle: { line: glowLine, geo: glowGeo, mat: glowMat },
    };
  }, []);

  // Update geometry when trajectory points change
  useFrame(() => {
    const count = state.trajectoryCount;
    if (count < 2) return;

    // Decimation: pick every Nth point if count exceeds max
    const stride = Math.max(1, Math.ceil(count / maxRenderedPoints));
    const renderedCount = Math.ceil(count / stride);
    if (renderedCount < 2) return;

    // Only update if new points have arrived
    if (count === lastCountRef.current) return;
    lastCountRef.current = count;

    const src = state.trajectoryPoints;
    const flat = new Float32Array(renderedCount * 3);

    let outIdx = 0;
    for (let i = 0; i < count && outIdx < renderedCount; i += stride) {
      const base = i * 3;
      flat[outIdx++] = src[base];
      flat[outIdx++] = src[base + 1];
      flat[outIdx++] = src[base + 2];
    }

    try {
      coreGeoRef.current?.setPositions(flat);
      coreBundle.line.computeLineDistances();
      glowGeoRef.current?.setPositions(flat);
      glowBundle.line.computeLineDistances();
    } catch {
      // geometry update failed, skip this frame
    }
  });

  // Cleanup
  useEffect(() => {
    return () => {
      coreBundle.geo.dispose();
      coreBundle.mat.dispose();
      glowBundle.geo.dispose();
      glowBundle.mat.dispose();
    };
  }, [coreBundle, glowBundle]);

  if (state.trajectoryCount < 2) return null;

  return (
    <group>
      <primitive object={coreBundle.line} />
      <primitive object={glowBundle.line} />
    </group>
  );
}
