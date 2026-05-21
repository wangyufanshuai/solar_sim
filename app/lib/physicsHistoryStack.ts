import type { SolarSystemPhysicsRef } from "./solarSystemRef";
import { captureHistoryEntry, type HistoryEntry } from "./physicsSnapshot";

export const SNAPSHOT_EVERY_SUBSTEPS = 100;
export const MAX_HISTORY_SNAPSHOTS = 500;

/**
 * Ring of automatic snapshots (every {@link SNAPSHOT_EVERY_SUBSTEPS} accepted substeps).
 */
export class PhysicsHistoryStack {
  private readonly snaps: HistoryEntry[] = [];
  private stepAccum = 0;

  get length(): number {
    return this.snaps.length;
  }

  getSnapshots(): readonly HistoryEntry[] {
    return this.snaps;
  }

  clear(): void {
    this.snaps.length = 0;
    this.stepAccum = 0;
  }

  resetStepAccumulator(): void {
    this.stepAccum = 0;
  }

  /** Remove recorded future after a branch cut (time travel). */
  trimSnapshotsAfterSimDays(cutSimDays: number): void {
    while (
      this.snaps.length > 0 &&
      this.snaps[this.snaps.length - 1]!.simDays > cutSimDays + 1e-9
    ) {
      this.snaps.pop();
    }
  }

  /**
   * After forward integration, accumulate substeps and maybe push a snapshot.
   */
  recordAfterFrame(
    p: SolarSystemPhysicsRef | null,
    simDays: number,
    substeps: number,
    shouldRecord: boolean,
  ): void {
    if (!p || !shouldRecord || substeps <= 0) return;
    this.stepAccum += substeps;
    while (this.stepAccum >= SNAPSHOT_EVERY_SUBSTEPS) {
      this.stepAccum -= SNAPSHOT_EVERY_SUBSTEPS;
      const e = captureHistoryEntry(p, simDays, p.n);
      this.snaps.push(e);
      while (this.snaps.length > MAX_HISTORY_SNAPSHOTS) this.snaps.shift();
    }
  }
}
