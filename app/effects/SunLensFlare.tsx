"use client";

import { useFrame } from "@react-three/fiber";
import { LensFlare } from "@react-three/postprocessing";
import * as THREE from "three";
import { useMemo } from "react";
import { BlendFunction } from "postprocessing";

/**
 * 跟随太阳 PointLight 世界坐标的镜头光晕（postprocessing `LensFlare`）。
 * 分辨率由 `@react-three/postprocessing` 内对 viewport 的 `useEffect` 同步；`opacity` uniform 表示遮挡（1=被挡满），会按射线检测向目标值阻尼。
 */
export default function SunLensFlare({
  sunLight,
  boost = false,
}: {
  sunLight: THREE.PointLight | null;
  /** 视觉增强：略增光斑与 ghost 强度。 */
  boost?: boolean;
}) {
  const pos = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    if (sunLight) sunLight.getWorldPosition(pos);
  }, -10);

  const colorGain = useMemo(
    () => (boost ? new THREE.Color(19, 17, 22) : new THREE.Color(14, 12, 15)),
    [boost]
  );

  if (!sunLight) return null;

  const glareSize = boost ? 0.5 : 0.38;
  const haloScale = boost ? 0.7 : 0.55;
  const ghostScale = boost ? 0.048 : 0.036;

  return (
    <LensFlare
      blendFunction={BlendFunction.SCREEN}
      lensPosition={pos}
      glareSize={glareSize}
      starPoints={10}
      flareSize={boost ? 0.02 : 0.017}
      flareSpeed={0.38}
      flareShape={0.02}
      animated
      anamorphic={false}
      colorGain={colorGain}
      haloScale={haloScale}
      secondaryGhosts
      aditionalStreaks
      ghostScale={ghostScale}
      opacity={1}
      starBurst={false}
      smoothTime={0.085}
    />
  );
}
