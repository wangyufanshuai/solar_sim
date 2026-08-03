export const ATLAS_CAMERA_PRESENTATION_LEASE_VERSION = "v273-camera-presentation-lease-v1" as const;

export type AtlasCameraPresentationOwnerV273 = "ordinary-orbit" | "focus-lock" | "scale-journey" | "scene-handoff";

export type AtlasCameraPresentationLeaseV273 = {
  version: typeof ATLAS_CAMERA_PRESENTATION_LEASE_VERSION;
  token: number;
  owner: AtlasCameraPresentationOwnerV273;
  requestId: number;
  acquiredAtMs: number;
  active: boolean;
};

const PRIORITY: Readonly<Record<AtlasCameraPresentationOwnerV273, number>> = {
  "ordinary-orbit": 0,
  "focus-lock": 1,
  "scale-journey": 2,
  "scene-handoff": 3,
};

let token = 0;
let current: AtlasCameraPresentationLeaseV273 | null = null;

export function requestAtlasCameraPresentationLeaseV273(
  owner: AtlasCameraPresentationOwnerV273,
  requestId: number,
  acquiredAtMs = typeof performance === "undefined" ? Date.now() : performance.now(),
): AtlasCameraPresentationLeaseV273 {
  if (!Number.isInteger(requestId) || requestId < 0 || !Number.isFinite(acquiredAtMs)) {
    throw new Error("Atlas camera lease request is invalid");
  }
  if (current && PRIORITY[current.owner] > PRIORITY[owner]) {
    return { version: ATLAS_CAMERA_PRESENTATION_LEASE_VERSION, token: ++token, owner, requestId, acquiredAtMs, active: false };
  }
  if (current) current = { ...current, active: false };
  current = { version: ATLAS_CAMERA_PRESENTATION_LEASE_VERSION, token: ++token, owner, requestId, acquiredAtMs, active: true };
  return current;
}

export function releaseAtlasCameraPresentationLeaseV273(lease: AtlasCameraPresentationLeaseV273): void {
  if (current?.token === lease.token) current = null;
}

export function atlasCameraPresentationCanWriteV273(owner: AtlasCameraPresentationOwnerV273): boolean {
  return current === null || current.owner === owner || PRIORITY[owner] > PRIORITY[current.owner];
}

export function getAtlasCameraPresentationLeaseV273(): AtlasCameraPresentationLeaseV273 | null {
  return current ? { ...current } : null;
}

export function resetAtlasCameraPresentationLeaseForTestsV273(): void {
  current = null;
  token = 0;
}
