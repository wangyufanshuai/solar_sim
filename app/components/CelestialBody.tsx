"use client";

import type { SunBodyProps } from "./SunBody";
import SunBody from "./SunBody";
import type { PlanetBodyProps } from "./Planet";
import Planet from "./Planet";

export type CelestialBodyProps = SunBodyProps | PlanetBodyProps;

/**
 * 路由到 {@link SunBody} 或 {@link Planet}；保持 `SolarSystemBodies` 等处的 `CelestialBody` API 不变。
 */
export default function CelestialBody(props: CelestialBodyProps) {
  if (props.variant === "sun") {
    return <SunBody {...props} />;
  }
  return <Planet {...props} />;
}
