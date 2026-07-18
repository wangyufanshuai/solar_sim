"use client";

import { memo } from "react";
import { useAtlasRuntimeStore } from "../lib/atlasRuntimeStore";
import UniverseCanvas, {
  shallowEqualSimulationProps,
  type UniverseCanvasSimulationProps,
} from "./UniverseCanvas";

export const ATLAS_SCENE_HOST_VERSION = "v161-single-canvas-scene-host" as const;

function AtlasSceneHost({ simulation }: { simulation: UniverseCanvasSimulationProps }) {
  const sceneRevision = useAtlasRuntimeStore((snapshot) => snapshot.sceneRevision);
  return (
    <div
      className="h-full w-full"
      data-atlas-scene-host={ATLAS_SCENE_HOST_VERSION}
      data-atlas-scene-host-mode={simulation.sceneMode}
      data-atlas-scene-host-revision={sceneRevision}
      data-atlas-scene-host-canvas-limit="1"
    >
      <UniverseCanvas simulation={simulation} />
    </div>
  );
}

export type AtlasSceneModule = {
  id: UniverseCanvasSimulationProps["sceneMode"];
  canvasCount: 1;
  unloadsUnrelatedLayers: true;
};

export default memo(
  AtlasSceneHost,
  (previous, next) => shallowEqualSimulationProps(previous.simulation, next.simulation),
);
