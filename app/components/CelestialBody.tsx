"use client";

import type { SunBodyProps } from "./SunBody";
import SunBody from "./SunBody";
import type { PlanetBodyProps } from "./Planet";
import Planet from "./Planet";

export type CelestialBodyProps = SunBodyProps | PlanetBodyProps;

/** Routes to SunBody or Planet while keeping the shared CelestialBody API stable. */
export default function CelestialBody(props: CelestialBodyProps) {
  if (props.variant === "sun") {
    return <SunBody {...props} />;
  }
  return <Planet {...props} />;
}
