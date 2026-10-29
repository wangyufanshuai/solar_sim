import {
  DEEP_SPACE_REFERENCE_OBJECTS_V592,
  DEEP_SPACE_REFERENCE_PACKET_SHA256_V592,
  DEEP_SPACE_REFERENCE_RECEIPT_SHA256_V592,
} from "../data/deepSpaceReferenceV592.generated";

export {
  DEEP_SPACE_REFERENCE_OBJECTS_V592,
  DEEP_SPACE_REFERENCE_PACKET_SHA256_V592,
  DEEP_SPACE_REFERENCE_RECEIPT_SHA256_V592,
};

export const DEEP_SPACE_REFERENCE_PACKET_URL_V592 = "/data/living-universe-v592/deep-space-reference.json" as const;
export type DeepSpaceReferenceObjectV592 = typeof DEEP_SPACE_REFERENCE_OBJECTS_V592[number];
export type DeepSpaceReferenceIdV592 = DeepSpaceReferenceObjectV592["id"];

export const DEEP_SPACE_GALAXIES_V592 = Object.freeze(
  DEEP_SPACE_REFERENCE_OBJECTS_V592.filter((entry) => entry.category === "galaxy"),
);
export const DEEP_SPACE_CLUSTERS_V592 = Object.freeze(
  DEEP_SPACE_REFERENCE_OBJECTS_V592.filter((entry) => entry.category === "cluster"),
);
export const DEEP_SPACE_REFERENCE_BY_ID_V592 = Object.freeze(Object.fromEntries(
  DEEP_SPACE_REFERENCE_OBJECTS_V592.map((entry) => [entry.id, entry]),
)) as Readonly<Record<DeepSpaceReferenceIdV592, DeepSpaceReferenceObjectV592>>;

const DEEP_SPACE_REFERENCE_ID_SET_V592 = new Set<string>(DEEP_SPACE_REFERENCE_OBJECTS_V592.map((entry) => entry.id));

export function isDeepSpaceReferenceIdV592(value: string): value is DeepSpaceReferenceIdV592 {
  return DEEP_SPACE_REFERENCE_ID_SET_V592.has(value);
}

export function formatDeepSpaceDistanceV592(distancePc: number): string {
  if (!Number.isFinite(distancePc) || distancePc <= 0) throw new Error("v592-deep-space-distance");
  if (distancePc >= 1_000_000) return `${(distancePc / 1_000_000).toFixed(distancePc >= 10_000_000 ? 1 : 2)} Mpc`;
  if (distancePc >= 1_000) return `${(distancePc / 1_000).toFixed(distancePc >= 10_000 ? 1 : 2)} kpc`;
  return `${distancePc.toFixed(0)} pc`;
}
