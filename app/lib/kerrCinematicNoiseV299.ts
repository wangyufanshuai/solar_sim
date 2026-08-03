import * as THREE from "three";

function mulberry32(seedValue: number): () => number {
  let seed = seedValue >>> 0;
  return () => {
    seed += 0x6d2b79f5;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function createKerrFlowNoiseTextureV299(seed = 299): THREE.DataTexture {
  const width = 64;
  const height = 64;
  const data = new Uint8Array(width * height * 4);
  const random = mulberry32(seed);
  for (let index = 0; index < width * height; index += 1) {
    data[index * 4] = Math.floor(random() * 256);
    data[index * 4 + 1] = Math.floor(random() * 256);
    data[index * 4 + 2] = Math.floor(random() * 200 + 28);
    data[index * 4 + 3] = 255;
  }
  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}
