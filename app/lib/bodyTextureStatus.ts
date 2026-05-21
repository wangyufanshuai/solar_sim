"use client";

export type BodyTextureSource = "user" | "nasa" | "fallback";

export type BodyTextureStatus = {
  loaded: boolean;
  source: BodyTextureSource;
  effectiveSource?: BodyTextureSource;
  mapReady?: boolean;
  renderLod?: "mesh" | "sprite" | null;
  usingFallbackBoost?: boolean;
};

const statusMap = new Map<string, BodyTextureStatus>();

export function setBodyTextureStatus(bodyId: string, status: BodyTextureStatus): void {
  statusMap.set(bodyId, status);
}

export function setBodyTextureRenderLod(
  bodyId: string,
  renderLod: "mesh" | "sprite" | null
): void {
  const prev = getBodyTextureStatus(bodyId);
  statusMap.set(bodyId, { ...prev, renderLod });
}

export function getBodyTextureStatus(bodyId: string): BodyTextureStatus {
  return statusMap.get(bodyId) ?? {
    loaded: false,
    source: "fallback",
    effectiveSource: "fallback",
    mapReady: false,
    renderLod: null,
    usingFallbackBoost: false,
  };
}

