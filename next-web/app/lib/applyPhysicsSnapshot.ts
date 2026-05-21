import { stateAuToSi } from "./physicsEngine";
import { isPhysicsRuntime } from "./physicsRuntime";
import type { SolarSystemPhysicsRef } from "./solarSystemRef";
import type { HistoryEntry } from "./physicsSnapshot";
import type { SolarSystemPhysics } from "./solarSystemPhysics";

export function applyHistoryEntryToPhysics(
  p: SolarSystemPhysicsRef,
  entry: HistoryEntry,
): void {
  const n = entry.massKg.length;
  if (n !== p.n) {
    console.warn("[physics] applyHistoryEntry: body count mismatch");
    return;
  }
  if (isPhysicsRuntime(p)) {
    p.postApplySnapshot({
      posAu: Array.from(entry.posAu),
      velAuPerDay: Array.from(entry.velAuPerDay),
      massKg: Array.from(entry.massKg),
      n,
      simDays: entry.simDays,
    });
    return;
  }
  (p as SolarSystemPhysics).applySnapshotFromAu(
    entry.posAu,
    entry.velAuPerDay,
    entry.massKg,
    n,
  );
}
