import { diffAtlasResourceSnapshotsV300, type AtlasRuntimeResourceKind, type AtlasRuntimeResourceSnapshot } from "./atlasResourceLifecycle";

export const MAINLINE_A_R65_GUIDED_CATALOG_ID_V645 = "nebula:m42" as const;
export const MAINLINE_A_R65_GUIDED_OBJECT_ID_V645 = "m42" as const;

type Identity = AtlasRuntimeResourceSnapshot["byIdentity"][string];

export type MainlineAR65ResourceGrowthV645 = Readonly<{
  identity: string;
  kind: AtlasRuntimeResourceKind;
  owner: string;
  label: string;
  count: number;
  estimatedBytes: number;
  contentSha256: string | null;
}>;

export type MainlineAR65SceneActivityV645 = Readonly<{
  status: "ready" | "registry-unchanged" | "no-new-resource" | "renderable-resource-missing";
  acquiredCount: number;
  acquiredEstimatedBytes: number;
  renderableCount: number;
  renderableEstimatedBytes: number;
  registryRevisionDelta: number;
  owners: readonly string[];
  growth: readonly MainlineAR65ResourceGrowthV645[];
}>;

const RENDERABLE_KINDS = new Set<AtlasRuntimeResourceKind>([
  "texture",
  "model",
  "gpu-buffer",
  "gpu-render-target",
  "gpu-compute-pipeline",
]);

function increase(before: number | undefined, after: number): number {
  return Math.max(0, after - (before ?? 0));
}

/**
 * This compares resources owned by mounted scene components. A focus command,
 * camera lock, subscription or revision bump alone cannot satisfy activity.
 * The result is still a local registry observation, not physical GPU memory.
 */
export function evaluateMainlineAR65SceneActivityV645(
  baseline: AtlasRuntimeResourceSnapshot,
  active: AtlasRuntimeResourceSnapshot,
): MainlineAR65SceneActivityV645 {
  const growth: MainlineAR65ResourceGrowthV645[] = [];
  for (const [identity, current] of Object.entries(active.byIdentity)) {
    const previous: Identity | undefined = baseline.byIdentity[identity];
    const count = increase(previous?.count, current.count);
    if (count === 0) continue;
    growth.push({
      identity,
      kind: current.kind,
      owner: current.owner,
      label: current.label,
      count,
      estimatedBytes: increase(previous?.estimatedBytes, current.estimatedBytes),
      contentSha256: current.contentSha256,
    });
  }
  growth.sort((left, right) => left.identity.localeCompare(right.identity));
  const renderable = growth.filter((item) => RENDERABLE_KINDS.has(item.kind) && item.estimatedBytes > 0);
  const diff = diffAtlasResourceSnapshotsV300(baseline, active);
  const status = diff.status === "baseline" ? "registry-unchanged"
    : growth.length === 0 ? "no-new-resource"
      : renderable.length === 0 ? "renderable-resource-missing"
        : "ready";
  return Object.freeze({
    status,
    acquiredCount: growth.reduce((total, item) => total + item.count, 0),
    acquiredEstimatedBytes: growth.reduce((total, item) => total + item.estimatedBytes, 0),
    renderableCount: renderable.reduce((total, item) => total + item.count, 0),
    renderableEstimatedBytes: renderable.reduce((total, item) => total + item.estimatedBytes, 0),
    registryRevisionDelta: active.revision - baseline.revision,
    owners: Object.freeze([...new Set(growth.map((item) => item.owner))].sort()),
    growth: Object.freeze(growth),
  });
}

export function describeMainlineAR65SceneActivityV645(activity: MainlineAR65SceneActivityV645): string {
  if (activity.status === "registry-unchanged") return "资源 registry 仍与起点相同；请选择真实场景对象并等待加载。";
  if (activity.status === "no-new-resource") return "registry 已变化，但没有新获取的资源；仅释放或修订记录不能作为活动快照。";
  if (activity.status === "renderable-resource-missing") return "只观察到相机锁、订阅或零字节资源；需等待图像或几何资源真实加载。";
  return `已观察到 ${activity.renderableCount} 项场景渲染资源，估算 ${Math.round(activity.renderableEstimatedBytes / 1024)} KiB；仍需返回起点并验证释放。`;
}
