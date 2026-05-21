import type { SolarSystemPhysics } from "./solarSystemPhysics";

/** Main-thread `SolarSystemPhysics` or worker-backed `PhysicsRuntime` (shared buffers). */
export type SolarSystemPhysicsRef =
  | SolarSystemPhysics
  | import("./physicsRuntime").PhysicsRuntime;
