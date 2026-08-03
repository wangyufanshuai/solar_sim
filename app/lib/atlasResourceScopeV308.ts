export const ATLAS_RESOURCE_SCOPE_VERSION_V308 = "v308-atlas-idempotent-resource-scope" as const;

export type AtlasResourceScopeFailureV308 = Readonly<{
  label: string;
  message: string;
}>;

export type AtlasResourceScopeReleaseReportV308 = Readonly<{
  version: typeof ATLAS_RESOURCE_SCOPE_VERSION_V308;
  reason: string;
  releasedCount: number;
  failures: readonly AtlasResourceScopeFailureV308[];
  pendingCount: 0;
}>;

export type AtlasResourceScopeSnapshotV308 = Readonly<{
  version: typeof ATLAS_RESOURCE_SCOPE_VERSION_V308;
  label: string;
  released: boolean;
  registeredCount: number;
  releasedCount: number;
  pendingCount: number;
  failureCount: number;
}>;

export type AtlasResourceScopeV308 = Readonly<{
  add: (label: string, finalizer: () => void) => () => void;
  releaseAll: (reason: string) => AtlasResourceScopeReleaseReportV308;
  snapshot: () => AtlasResourceScopeSnapshotV308;
}>;

type Entry = {
  readonly label: string;
  readonly finalizer: () => void;
  active: boolean;
};

const cleanMessage = (error: unknown) => error instanceof Error
  ? error.message.slice(0, 256)
  : "unknown-finalizer-error";

export function createAtlasResourceScopeV308(label: string): AtlasResourceScopeV308 {
  if (!label || label.length > 128) throw new Error("v308-resource-scope-label-invalid");
  const entries: Entry[] = [];
  const failures: AtlasResourceScopeFailureV308[] = [];
  let released = false;
  let releasedCount = 0;

  const releaseEntry = (entry: Entry): void => {
    if (!entry.active) return;
    entry.active = false;
    try {
      entry.finalizer();
    } catch (error: unknown) {
      failures.push(Object.freeze({ label: entry.label, message: cleanMessage(error) }));
    } finally {
      releasedCount += 1;
    }
  };

  const add = (entryLabel: string, finalizer: () => void): (() => void) => {
    if (!entryLabel || entryLabel.length > 128 || typeof finalizer !== "function") throw new Error("v308-resource-finalizer-invalid");
    const entry: Entry = { label: entryLabel, finalizer, active: true };
    entries.push(entry);
    if (released) releaseEntry(entry);
    return () => releaseEntry(entry);
  };

  const releaseAll = (reason: string): AtlasResourceScopeReleaseReportV308 => {
    if (!reason || reason.length > 128) throw new Error("v308-resource-release-reason-invalid");
    released = true;
    const before = releasedCount;
    for (let index = entries.length - 1; index >= 0; index -= 1) releaseEntry(entries[index]);
    return Object.freeze({
      version: ATLAS_RESOURCE_SCOPE_VERSION_V308,
      reason,
      releasedCount: releasedCount - before,
      failures: Object.freeze([...failures]),
      pendingCount: 0,
    });
  };

  const snapshot = (): AtlasResourceScopeSnapshotV308 => Object.freeze({
    version: ATLAS_RESOURCE_SCOPE_VERSION_V308,
    label,
    released,
    registeredCount: entries.length,
    releasedCount,
    pendingCount: entries.reduce((count, entry) => count + (entry.active ? 1 : 0), 0),
    failureCount: failures.length,
  });

  return Object.freeze({ add, releaseAll, snapshot });
}
