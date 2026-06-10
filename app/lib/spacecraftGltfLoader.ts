import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export type SpacecraftGltfLoader = {
  loader: GLTFLoader;
  dispose: () => void;
};

export function createSpacecraftGltfLoader(): SpacecraftGltfLoader {
  const draco = new DRACOLoader();
  draco.setDecoderPath("/draco/");
  draco.setDecoderConfig({ type: "wasm" });
  draco.preload();
  const loader = new GLTFLoader();
  loader.setDRACOLoader(draco);
  return {
    loader,
    dispose: () => draco.dispose(),
  };
}
