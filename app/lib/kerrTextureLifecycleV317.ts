export const KERR_TEXTURE_LIFECYCLE_VERSION_V317 = "v317-kerr-texture-lifecycle-v1" as const;

type DisposableDataTextureV317 = {
  image: { data: ArrayBufferView<ArrayBufferLike>; width: number; height: number };
  needsUpdate: boolean;
  dispose: () => void;
};

export type KerrTextureReleaseSnapshotV317 = Readonly<{
  version: typeof KERR_TEXTURE_LIFECYCLE_VERSION_V317;
  released: boolean;
  sourceByteLength: number;
  retainedByteLength: 0;
}>;

const releasedTextures = new WeakSet<object>();

export function releaseKerrDataTextureV317(texture: DisposableDataTextureV317): KerrTextureReleaseSnapshotV317 {
  if (releasedTextures.has(texture)) {
    return Object.freeze({ version: KERR_TEXTURE_LIFECYCLE_VERSION_V317, released: false, sourceByteLength: 0, retainedByteLength: 0 });
  }
  releasedTextures.add(texture);
  const sourceByteLength = texture.image.data.byteLength;
  texture.needsUpdate = false;
  texture.image.data = new Uint8Array(new ArrayBuffer(0));
  texture.image.width = 0;
  texture.image.height = 0;
  texture.dispose();
  return Object.freeze({ version: KERR_TEXTURE_LIFECYCLE_VERSION_V317, released: true, sourceByteLength, retainedByteLength: 0 });
}

export function clearKerrInteractiveValuesV317(values: Float32Array): number {
  const byteLength = values.byteLength;
  values.fill(0);
  return byteLength;
}
