export const ATLAS_BUFFERED_RANGE_DELIVERY_VERSION =
  "v264r3-buffered-range-delivery-v1" as const;

export const ATLAS_BUFFERED_RANGE_MAX_BYTES_V1 = 2 * 1024 * 1024;

export type AtlasBufferedRangeDeliveryV1 =
  | "buffered-v1"
  | "streamed-v1";

export type CatalogRangeDeliveryObservationV1 =
  | AtlasBufferedRangeDeliveryV1
  | "unknown";

export function parseAtlasRangeDeliveryHeaderV1(
  value: string | null,
): CatalogRangeDeliveryObservationV1 {
  return value === "buffered-v1" || value === "streamed-v1"
    ? value
    : "unknown";
}

export function shouldBufferAtlasRangeV1(length: number): boolean {
  return (
    Number.isSafeInteger(length) &&
    length > 0 &&
    length <= ATLAS_BUFFERED_RANGE_MAX_BYTES_V1
  );
}
