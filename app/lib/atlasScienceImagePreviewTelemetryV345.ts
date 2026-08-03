import { getAtlasResourceSnapshot, type AtlasRuntimeResourceSnapshot } from "./atlasResourceLifecycle";
import { getKerrScienceImageProductClientSnapshotV344, type KerrScienceImageProductClientSnapshotV344 } from "./kerrScienceImageProductClientV344";

export const ATLAS_SCIENCE_IMAGE_PREVIEW_TELEMETRY_VERSION_V345 = "v345-science-image-preview-telemetry-v1" as const;
export type AtlasScienceImagePreviewTelemetryV345 = Readonly<{
  version: typeof ATLAS_SCIENCE_IMAGE_PREVIEW_TELEMETRY_VERSION_V345;
  route: "research" | "kerr-lab" | "none";
  intent: "none" | "png-preview" | "fits-download";
  product: "none" | "png" | "fits";
  orientation: "portrait" | "landscape" | "unknown";
  sceneRevisionDelta: 0;
  canvasCount: 1;
  resourceBaseline: "baseline" | "drift";
  objectUrls: number;
  typedArrayCaches: number;
  cameraLocks: number;
  client: KerrScienceImageProductClientSnapshotV344;
  boundary: "non-react-dom-dataset-bridge-no-science-payload-no-profile-mutation";
}>;
export type AtlasScienceImagePreviewTelemetryBridgeOptionsV345 = Readonly<{
  node?: Pick<HTMLElement, "dataset"> | null;
  route?: "research" | "kerr-lab";
  getOrientation?: () => "portrait" | "landscape" | "unknown";
  getResources?: () => AtlasRuntimeResourceSnapshot;
  getClient?: () => KerrScienceImageProductClientSnapshotV344;
  subscribe?: (listener: () => void) => () => void;
}>;
let current: AtlasScienceImagePreviewTelemetryV345 = createSnapshot();
function createSnapshot(): AtlasScienceImagePreviewTelemetryV345 { const resources = getAtlasResourceSnapshot(); return Object.freeze({ version: ATLAS_SCIENCE_IMAGE_PREVIEW_TELEMETRY_VERSION_V345, route: "none", intent: "none", product: "none", orientation: "unknown", sceneRevisionDelta: 0, canvasCount: 1, resourceBaseline: resources.total === 0 ? "baseline" : "drift", objectUrls: resources.objectUrls, typedArrayCaches: resources.typedArrayCaches, cameraLocks: resources.cameraLocks, client: getKerrScienceImageProductClientSnapshotV344(), boundary: "non-react-dom-dataset-bridge-no-science-payload-no-profile-mutation" }); }
function write(node: Pick<HTMLElement, "dataset"> | null, snapshot: AtlasScienceImagePreviewTelemetryV345): void { if (!node) return; node.dataset.atlasSciencePreviewRouteV345 = snapshot.route; node.dataset.atlasSciencePreviewIntentV345 = snapshot.intent; node.dataset.atlasSciencePreviewProductV345 = snapshot.product; node.dataset.atlasSciencePreviewOrientationV345 = snapshot.orientation; node.dataset.atlasSciencePreviewSceneRevisionDeltaV345 = String(snapshot.sceneRevisionDelta); node.dataset.atlasSciencePreviewCanvasCountV345 = String(snapshot.canvasCount); node.dataset.atlasSciencePreviewResourceBaselineV345 = snapshot.resourceBaseline; node.dataset.atlasSciencePreviewObjectUrlCountV345 = String(snapshot.objectUrls); node.dataset.atlasSciencePreviewTypedArrayCacheCountV345 = String(snapshot.typedArrayCaches); node.dataset.atlasSciencePreviewCameraLockCountV345 = String(snapshot.cameraLocks); }
export function getAtlasScienceImagePreviewTelemetryV345(): AtlasScienceImagePreviewTelemetryV345 { return current; }
export function publishAtlasScienceImagePreviewTelemetryV345(update: Readonly<Partial<Pick<AtlasScienceImagePreviewTelemetryV345, "route" | "intent" | "product" | "orientation">>> & { node?: Pick<HTMLElement, "dataset"> | null; getResources?: () => AtlasRuntimeResourceSnapshot; getClient?: () => KerrScienceImageProductClientSnapshotV344 }): AtlasScienceImagePreviewTelemetryV345 { const resources = update.getResources?.() ?? getAtlasResourceSnapshot(); current = Object.freeze({ ...current, route: update.route ?? current.route, intent: update.intent ?? current.intent, product: update.product ?? current.product, orientation: update.orientation ?? current.orientation, resourceBaseline: resources.total === 0 ? "baseline" : "drift", objectUrls: resources.objectUrls, typedArrayCaches: resources.typedArrayCaches, cameraLocks: resources.cameraLocks, client: update.getClient?.() ?? getKerrScienceImageProductClientSnapshotV344() }); write(update.node ?? (typeof document === "undefined" ? null : document.querySelector<HTMLElement>("[data-atlas-app-shell]")), current); return current; }
export function startAtlasScienceImagePreviewTelemetryBridgeV345(options: AtlasScienceImagePreviewTelemetryBridgeOptionsV345 = {}): () => void { const route = options.route ?? "research"; const getOrientation = options.getOrientation ?? (() => typeof window === "undefined" ? "unknown" : window.matchMedia("(orientation: portrait)").matches ? "portrait" : "landscape"); const getResources = options.getResources ?? getAtlasResourceSnapshot; const getClient = options.getClient ?? getKerrScienceImageProductClientSnapshotV344; const publish = () => publishAtlasScienceImagePreviewTelemetryV345({ node: options.node, route, orientation: getOrientation(), getResources, getClient }); const unsubscribe = options.subscribe?.(publish) ?? (() => undefined); publish(); return () => { unsubscribe(); publishAtlasScienceImagePreviewTelemetryV345({ node: options.node, route: "none", intent: "none", product: "none", orientation: "unknown", getResources, getClient }); }; }
export function resetAtlasScienceImagePreviewTelemetryV345ForTests(): void { current = createSnapshot(); }
