"use client";

import { useEffect, useMemo } from "react";
import type { BufferGeometry, Material, Mesh } from "three";
import coverage from "../data/mainlineACanonicalCoverageV622.generated.json";
import { acquireAtlasResource } from "./atlasResourceLifecycle";
import {
  publishCanonicalRuntimeSelectionV635,
  readCanonicalRuntimeSelectionV635,
  reportCanonicalRuntimeCleanupFailureV635,
} from "./mainlineACanonicalRuntimeV635";

type Selection = NonNullable<Parameters<typeof publishCanonicalRuntimeSelectionV635>[0]>;
type RuntimeSnapshot = ReturnType<typeof readCanonicalRuntimeSelectionV635>;
export type CanonicalProducerTargetV635 = Pick<Selection, "kind" | "id" | "route" | "assetHash">;
export type CanonicalProducerDependenciesV635 = {
  publish: (selection: Selection | null) => RuntimeSnapshot;
  read: () => RuntimeSnapshot;
};
export type CanonicalProducerLeaseV635 = {
  target: CanonicalProducerTargetV635;
  ready: () => boolean;
  loading: () => boolean;
  failed: (error: string) => boolean;
  unobserved: () => boolean;
  release: () => void;
};

const defaultDependencies: CanonicalProducerDependenciesV635 = {
  publish: publishCanonicalRuntimeSelectionV635,
  read: readCanonicalRuntimeSelectionV635,
};

export function resolveCanonicalProducerTargetV635(
  kind: Selection["kind"], id: string | null, route: string, assetHash: string | null,
): CanonicalProducerTargetV635 | null {
  const row = coverage.records.find((entry) => entry.kind === kind && entry.id === id);
  if (!row || row.route.route !== route || row.route.assetHash !== assetHash) return null;
  return { kind, id: row.id, route, assetHash };
}

function identity(target: CanonicalProducerTargetV635): string {
  return JSON.stringify([target.kind, target.id, target.route, target.assetHash]);
}

function safeFailure(message: string): string {
  return message.replace(/[\u0000-\u001f]/g, " ").trim().slice(0, 1000) || "runtime-producer-failed";
}

/** Ownership is tied to the publish revision, including equal-id replacements. */
export function createCanonicalProducerLeaseV635(
  target: CanonicalProducerTargetV635,
  dependencies: CanonicalProducerDependenciesV635 = defaultDependencies,
): CanonicalProducerLeaseV635 {
  const accepted = resolveCanonicalProducerTargetV635(target.kind, target.id, target.route, target.assetHash);
  if (!accepted) throw new Error("canonical-producer-target-not-in-manifest");
  let released = false;
  let ownedRevision = dependencies.publish({ ...accepted, loading: "loading", error: null }).revision;
  const owns = () => {
    const current = dependencies.read();
    return !released && current.revision === ownedRevision
      && current.selection !== null && identity(current.selection) === identity(accepted);
  };
  const update = (loading: Selection["loading"], error: string | null): boolean => {
    if (!owns()) return false;
    const current = dependencies.read().selection!;
    if (current.loading === loading && current.error === error) return true;
    ownedRevision = dependencies.publish({ ...accepted, loading, error }).revision;
    return true;
  };
  return {
    target: accepted,
    ready: () => update("ready", null),
    loading: () => update("loading", null),
    failed: (error) => update("failed", safeFailure(error)),
    unobserved: () => update("unobserved", null),
    release: () => {
      if (owns()) dependencies.publish(null);
      released = true;
    },
  };
}

export function createCanonicalProducerHandleV635(
  target: CanonicalProducerTargetV635,
  dependencies: CanonicalProducerDependenciesV635 = defaultDependencies,
) {
  let active: CanonicalProducerLeaseV635 | null = null;
  return {
    activate: () => {
      active?.release();
      const current = createCanonicalProducerLeaseV635(target, dependencies);
      active = current;
      return () => {
        current.release();
        if (active === current) active = null;
      };
    },
    rendered: () => active?.ready() ?? false,
    loading: () => active?.loading() ?? false,
    failed: (error: string) => active?.failed(error) ?? false,
    unobserved: () => active?.unobserved() ?? false,
  };
}

/** Each memoized handle belongs to one selection generation, even for A to B to A. */
export function useCanonicalProducerV635(
  kind: Selection["kind"], id: string | null, route: string, assetHash: string | null,
  enabled = true,
) {
  const target = useMemo(() => enabled
    ? resolveCanonicalProducerTargetV635(kind, id, route, assetHash) : null,
  [kind, id, route, assetHash, enabled]);
  const handle = useMemo(() => target ? createCanonicalProducerHandleV635(target) : null, [target]);
  useEffect(() => {
    if (!handle) {
      if (readCanonicalRuntimeSelectionV635().revision === 0) publishCanonicalRuntimeSelectionV635(null);
      return;
    }
    return handle.activate();
  }, [handle]);
  return useMemo(() => ({
    rendered: () => handle?.rendered() ?? false,
    loading: () => handle?.loading() ?? false,
    failed: (error: string) => handle?.failed(error) ?? false,
    unobserved: () => handle?.unobserved() ?? false,
  }), [handle]);
}

type Disposable = Pick<BufferGeometry | Material, "dispose">;
type ResourceEntry = { resource: Disposable; label: string; estimatedBytes?: number };
type ResourceDependencies = {
  acquire: typeof acquireAtlasResource;
  report: typeof reportCanonicalRuntimeCleanupFailureV635;
};

/** Registry removal follows successful disposal; failures remain observable. */
export function acquireCanonicalProducerResourcesV635(
  owner: string,
  resources: readonly ResourceEntry[],
  dependencies: ResourceDependencies = {
    acquire: acquireAtlasResource, report: reportCanonicalRuntimeCleanupFailureV635,
  },
): () => void {
  const entries = resources.map(({ resource, label, estimatedBytes = 0 }) => ({
    resource, label, released: false,
    releaseRegistry: dependencies.acquire("model", "atlas", label, { owner, estimatedBytes }),
  }));
  return () => {
    for (const entry of entries) {
      if (entry.released) continue;
      try {
        entry.resource.dispose();
        entry.releaseRegistry();
        entry.released = true;
      } catch (error) {
        dependencies.report(safeFailure(`${owner}:${entry.label}:${error instanceof Error ? error.message : String(error)}`));
      }
    }
  };
}

export function estimateCanonicalGeometryBytesV635(geometry: BufferGeometry): number {
  const arrays = new Set<ArrayBufferView>();
  if (geometry.index) arrays.add(geometry.index.array);
  for (const attribute of Object.values(geometry.attributes)) {
    arrays.add("isInterleavedBufferAttribute" in attribute ? attribute.data.array : attribute.array);
  }
  return [...arrays].reduce((total, array) => total + array.byteLength, 0);
}

export function useCanonicalDisposableV635(resource: BufferGeometry | Material, owner: string, label: string) {
  useEffect(() => acquireCanonicalProducerResourcesV635(owner, [{
    resource, label,
    estimatedBytes: "isBufferGeometry" in resource ? estimateCanonicalGeometryBytesV635(resource) : 0,
  }]), [resource, owner, label]);
}

export function releaseCanonicalTextureLeaseV635(release: (() => void) | undefined, objectId: string): void {
  try { release?.(); }
  catch (error) {
    reportCanonicalRuntimeCleanupFailureV635(safeFailure(`mainline-a-nebula:${objectId}:${error instanceof Error ? error.message : String(error)}`));
  }
}

/** Observe existing owners without calling dispose or releasing on unmount.
 * Shared objects keep their first semantic slot until their actual disposal event.
 * Object identity deduplicates frames; semantic slots make recreation comparable.
 */
export function createCanonicalRenderedResourceObserverV635(
  dependencies: ResourceDependencies = {
    acquire: acquireAtlasResource, report: reportCanonicalRuntimeCleanupFailureV635,
  },
) {
  const tracked = new WeakMap<BufferGeometry | Material, { released: boolean }>();
  return (mesh: Pick<Mesh, "geometry" | "material">, owner: string, label: string): number => {
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const resources: { resource: BufferGeometry | Material; slot: string }[] = [
      { resource: mesh.geometry, slot: "geometry" },
      ...materials.map((resource, index) => ({ resource, slot: `material-${index}` })),
    ];
    let acquired = 0;
    for (const { resource, slot } of resources) {
      if (!resource || tracked.has(resource)) continue;
      const geometry = "isBufferGeometry" in resource ? resource : null;
      const releaseRegistry = dependencies.acquire("model", "atlas", `${label}-${slot}`, {
        owner, estimatedBytes: geometry ? estimateCanonicalGeometryBytesV635(geometry) : 0,
      });
      const entry = { released: false };
      const disposed = () => {
        if (entry.released) return;
        try {
          releaseRegistry();
          entry.released = true;
          tracked.delete(resource);
          resource.removeEventListener("dispose", disposed);
        } catch (error) {
          dependencies.report(safeFailure(`${owner}:${label}:dispose-event:${error instanceof Error ? error.message : String(error)}`));
        }
      };
      resource.addEventListener("dispose", disposed);
      tracked.set(resource, entry);
      acquired += 1;
    }
    return acquired;
  };
}

export const observeCanonicalRenderedResourcesV635 = createCanonicalRenderedResourceObserverV635();

export type CanonicalStellarLayerV636 = "surface" | "halo" | "corona";

/** A drawn decorative layer owns resources, but cannot mark the surface ready. */
export function observeCanonicalStellarLayerV636(
  mesh: Pick<Mesh, "geometry" | "material">,
  heroId: string,
  layer: CanonicalStellarLayerV636,
  observe = observeCanonicalRenderedResourcesV635,
): number {
  if (!resolveCanonicalProducerTargetV635("star", heroId, "mainline-a-stellar-parametric", null)) return 0;
  return observe(mesh, "mainline-a-stellar-portrait", `stellar-hero:${heroId}:${layer}`);
}
