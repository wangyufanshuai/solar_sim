export const ATLAS_UNIVERSAL_FOCUS_VERSION =
  "v154-universal-stellar-picking-focus" as const;

export type AtlasFocusSource =
  | "scene-pointer"
  | "scene-label"
  | "navigator"
  | "deep-link"
  | "object-browser"
  | "bottom-control";

export type CatalogObjectIdentity = {
  objectId: string;
  namespace: "solar-system" | "gaia-dr3" | "hyg" | "curated" | "nasa-exoplanet";
  gaiaSourceId: string | null;
  hygId: string | null;
  designation: string | null;
};

export type AtlasFocusTargetV2 =
  | {
      kind: "solar-body";
      objectId: string;
      bodyIndex: number;
      mode: "inspect" | "lock";
    }
  | {
      kind: "stellar";
      objectId: string;
      catalogId: string;
      direction: readonly [number, number, number];
      identity: CatalogObjectIdentity;
    }
  | {
      kind: "catalog-object";
      objectId: string;
      catalogId: string;
      direction: readonly [number, number, number];
    }
  | {
      kind: "exoplanet-system";
      objectId: string;
      systemId: string;
    };

export type AtlasFocusCommandV2 = {
  version: typeof ATLAS_UNIVERSAL_FOCUS_VERSION;
  requestId: number;
  issuedAtMs: number;
  source: AtlasFocusSource;
  phase: "command" | "transition" | "locked" | "idle";
  target: AtlasFocusTargetV2;
};

export type StellarPickCandidate = {
  kind: "bright-star" | "gaia-star";
  stableId: string;
  catalogId: string;
  screenX: number;
  screenY: number;
  magnitude: number;
  labelled: boolean;
};

export type StellarPickPointer = {
  screenX: number;
  screenY: number;
  pointerType: string;
};

export const STELLAR_PICK_RADIUS_PX = {
  desktop: 12,
  touch: 20,
} as const;

export function stellarPointerIsShortClick(args: {
  downX: number;
  downY: number;
  upX: number;
  upY: number;
  elapsedMs: number;
}): boolean {
  return Math.hypot(args.upX - args.downX, args.upY - args.downY) <= 5 && args.elapsedMs <= 500;
}

export function chooseStellarPickCandidate(
  candidates: readonly StellarPickCandidate[],
  pointer: StellarPickPointer,
): StellarPickCandidate | null {
  const radius = pointer.pointerType === "touch"
    ? STELLAR_PICK_RADIUS_PX.touch
    : STELLAR_PICK_RADIUS_PX.desktop;
  let selected: StellarPickCandidate | null = null;
  let selectedScore = Number.POSITIVE_INFINITY;
  for (const candidate of candidates) {
    const distance = Math.hypot(
      candidate.screenX - pointer.screenX,
      candidate.screenY - pointer.screenY,
    );
    if (distance > radius) continue;
    const labelBonus = candidate.labelled ? 2.5 : 0;
    const brightnessBonus = Math.max(0, Math.min(3, 2.5 - candidate.magnitude)) * 0.45;
    const score = distance - labelBonus - brightnessBonus;
    if (
      score < selectedScore ||
      (score === selectedScore && candidate.stableId.localeCompare(selected?.stableId ?? "") < 0)
    ) {
      selected = candidate;
      selectedScore = score;
    }
  }
  return selected;
}

export function catalogIdentityFromSourceId(args: {
  objectId: string;
  sourceId: string;
  designation?: string | null;
}): CatalogObjectIdentity {
  const sourceId = args.sourceId.trim();
  const numericGaia = /^\d{10,22}$/.test(sourceId);
  const hygMatch = /^hyg:(\d+)$/i.exec(sourceId);
  return {
    objectId: args.objectId,
    namespace: numericGaia ? "gaia-dr3" : hygMatch ? "hyg" : "curated",
    gaiaSourceId: numericGaia ? sourceId : null,
    hygId: hygMatch?.[1] ?? null,
    designation: args.designation?.trim() || null,
  };
}
