"use client";

import { lazy } from "react";

type AtlasSceneModule = Promise<{ default: React.ComponentType<any> }>;

let launchSceneModule: AtlasSceneModule | undefined;
let exoplanetSceneModule: AtlasSceneModule | undefined;
let kerrSceneModule: AtlasSceneModule | undefined;

const loadLaunchSceneView = () => (
  launchSceneModule ??= import("./LaunchSceneView")
);
const loadExoplanetSystemScene = () => (
  exoplanetSceneModule ??= import("./ExoplanetSystemScene")
);
const loadKerrBlackHole = () => (
  kerrSceneModule ??= import("./KerrBlackHole")
);

export const LazyLaunchSceneView = lazy(loadLaunchSceneView);
export const LazyExoplanetSystemScene = lazy(loadExoplanetSystemScene);
export const LazyKerrBlackHole = lazy(loadKerrBlackHole);

export type AtlasLazySceneId = "launch" | "exoplanet-system" | "kerr";

/** Starts a scene chunk on user intent without mounting a second Canvas. */
export function preloadAtlasSceneModule(sceneId: AtlasLazySceneId): Promise<unknown> {
  if (sceneId === "launch") return loadLaunchSceneView();
  if (sceneId === "exoplanet-system") return loadExoplanetSystemScene();
  return loadKerrBlackHole();
}
