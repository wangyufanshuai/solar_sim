import { defineConfig } from "@playwright/test";
import releaseConfig from "./playwright.atlas.release.config";

const desktopProjects = releaseConfig.projects?.filter((project) => project.name?.startsWith("desktop-")) ?? [];

export default defineConfig({
  ...releaseConfig,
  fullyParallel: false,
  projects: desktopProjects,
  workers: 1,
});
