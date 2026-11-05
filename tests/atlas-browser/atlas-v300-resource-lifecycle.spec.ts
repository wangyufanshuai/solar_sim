import { expect, test } from "./atlasBrowserTestV263";
import type { Locator, Page } from "@playwright/test";
import {
  evaluateAtlasStrongGravityBrowserGateV321,
  type AtlasStrongGravityBrowserSnapshotV321,
} from "../../app/lib/atlasStrongGravityBrowserGateV321";

// Historical v318 evaluator remains immutable for its archived evidence; the
// active browser matrix intentionally consumes the v321 gate below.
// evaluateAtlasStrongGravityBrowserGateV318

const SHELL = "[data-atlas-app-shell]";

type ResourceBaseline = {
  canvasCount: number;
  sceneRevision: string | undefined;
  total: string | undefined;
  workers: string | undefined;
  renderTargets: string | undefined;
  gpuBuffers: string | undefined;
  gpuPipelines: string | undefined;
  gpuQueries: string | undefined;
  textures: string | undefined;
  objectUrls: string | undefined;
  typedArrayCaches: string | undefined;
  cameraLocks: string | undefined;
  estimatedGpuBytes: string | undefined;
  identityDigest: string | undefined;
  ownerCount: string | undefined;
};

async function readBaseline(page: Page): Promise<ResourceBaseline> {
  const shell = page.locator(SHELL);
  return {
    canvasCount: await page.locator("canvas").count(),
    sceneRevision: await shell.getAttribute("data-atlas-scene-revision-v294") ?? undefined,
    total: await shell.getAttribute("data-atlas-resource-total") ?? undefined,
    workers: await shell.getAttribute("data-atlas-resource-workers") ?? undefined,
    renderTargets: await shell.getAttribute("data-atlas-resource-render-targets") ?? undefined,
    gpuBuffers: await shell.getAttribute("data-atlas-resource-gpu-buffers") ?? undefined,
    gpuPipelines: await shell.getAttribute("data-atlas-resource-gpu-pipelines") ?? undefined,
    gpuQueries: await shell.getAttribute("data-atlas-resource-gpu-queries") ?? undefined,
    textures: await shell.getAttribute("data-atlas-resource-textures") ?? undefined,
    objectUrls: await shell.getAttribute("data-atlas-resource-object-urls") ?? undefined,
    typedArrayCaches: await shell.getAttribute("data-atlas-resource-typed-array-caches") ?? undefined,
    cameraLocks: await shell.getAttribute("data-atlas-resource-camera-locks") ?? undefined,
    estimatedGpuBytes: await shell.getAttribute("data-atlas-resource-estimated-gpu-bytes") ?? undefined,
    identityDigest: await shell.getAttribute("data-atlas-resource-identity-digest") ?? undefined,
    ownerCount: await shell.getAttribute("data-atlas-resource-owner-count") ?? undefined,
  };
}

async function readRequiredAttribute(node: Locator, name: string): Promise<string> {
  const value = await node.getAttribute(name);
  if (value == null) throw new Error(`missing-browser-telemetry:${name}`);
  return value;
}

async function readRequiredInteger(node: Locator, name: string): Promise<number> {
  const value = Number(await readRequiredAttribute(node, name));
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`invalid-browser-telemetry:${name}`);
  return value;
}

async function readAttributeOrUnavailable(node: Locator, name: string): Promise<string> {
  return await node.getAttribute(name) ?? "unavailable";
}

async function readOptionalBoolean(node: Locator, name: string): Promise<boolean | null> {
  const value = await node.getAttribute(name);
  return value === "true" ? true : value === "false" ? false : null;
}

async function readStrongGravitySnapshotV321(page: Page): Promise<AtlasStrongGravityBrowserSnapshotV321> {
  const shell = page.locator(SHELL);
  return {
    canvasCount: await page.locator("canvas").count(),
    sceneRevision: await readRequiredInteger(shell, "data-atlas-scene-revision-v294"),
    renderMode: await readRequiredAttribute(shell, "data-atlas-strong-gravity-render-mode-v294") as AtlasStrongGravityBrowserSnapshotV321["renderMode"],
    postFxPolicy: await readRequiredAttribute(shell, "data-atlas-post-fx-policy-v294") as AtlasStrongGravityBrowserSnapshotV321["postFxPolicy"],
    scienceAuthorityKind: await readAttributeOrUnavailable(shell, "data-atlas-science-authority-kind-v300"),
    geometryAuthoritySha256: await readAttributeOrUnavailable(shell, "data-atlas-geometry-authority-sha-v294"),
    polarizationAuthoritySha256: await readAttributeOrUnavailable(shell, "data-atlas-polarization-authority-sha-v294"),
    rayPlanAuthoritySha256: await readAttributeOrUnavailable(shell, "data-atlas-ray-plan-authority-sha-v300"),
    denseAggregateSha256: await readAttributeOrUnavailable(shell, "data-atlas-dense-aggregate-sha-v300"),
    scienceRasterVersion: await readRequiredAttribute(shell, "data-atlas-science-raster-version-v309"),
    scienceRasterBoundary: await readRequiredAttribute(shell, "data-atlas-science-raster-boundary-v309"),
    scienceRasterSampleCount: await readRequiredInteger(shell, "data-atlas-science-raster-sample-count-v309"),
    scienceRasterEvpaGlyphCount: await readRequiredInteger(shell, "data-atlas-science-raster-evpa-glyph-count-v309"),
    scienceRasterImageOrderGlyphCount: await readRequiredInteger(shell, "data-atlas-science-raster-image-order-glyph-count-v309"),
    sciencePayloadDigestSha256: await readAttributeOrUnavailable(shell, "data-atlas-science-payload-digest-v317"),
    scienceRasterDigestSha256: await readAttributeOrUnavailable(shell, "data-atlas-science-raster-digest-v317"),
    sciencePayloadUnchanged: await readOptionalBoolean(shell, "data-atlas-science-payload-unchanged-v317"),
    scienceBuffersDisjoint: await readOptionalBoolean(shell, "data-atlas-science-buffers-disjoint-v317"),
    scienceDenseBoundary: await readAttributeOrUnavailable(shell, "data-atlas-science-dense-boundary-v317"),
    scienceBandArtifactSha256: await readAttributeOrUnavailable(shell, "data-atlas-science-band-artifact-sha-v321"),
    scienceBandViewDigestSha256: await readAttributeOrUnavailable(shell, "data-atlas-science-band-view-digest-v321"),
    scienceBandViewUnchanged: await readOptionalBoolean(shell, "data-atlas-science-band-view-unchanged-v321"),
    scienceBandCount: await readRequiredInteger(shell, "data-atlas-science-band-count-v321"),
    scienceBandSaturationCount: await readRequiredInteger(shell, "data-atlas-science-band-saturation-count-v321"),
    scienceBandNormalization: await readAttributeOrUnavailable(shell, "data-atlas-science-band-normalization-v321"),
    scienceCinematicBufferShared: await readOptionalBoolean(shell, "data-atlas-science-cinematic-buffer-shared-v321"),
    lifecycleBaselineDigest: await readAttributeOrUnavailable(shell, "data-atlas-lifecycle-baseline-digest-v317"),
    lifecycleReturnDigest: await readAttributeOrUnavailable(shell, "data-atlas-lifecycle-return-digest-v317"),
    lifecycleReturnedToBaseline: await readOptionalBoolean(shell, "data-atlas-lifecycle-returned-to-baseline-v317"),
    resourceScopeReleaseCount: await readRequiredInteger(shell, "data-atlas-resource-scope-release-count-v309"),
    resourceScopeFailureCount: await readRequiredInteger(shell, "data-atlas-resource-scope-failure-count-v309"),
    resources: {
      total: await readRequiredInteger(shell, "data-atlas-resource-total"),
      workers: await readRequiredInteger(shell, "data-atlas-resource-workers"),
      renderTargets: await readRequiredInteger(shell, "data-atlas-resource-render-targets"),
      gpuBuffers: await readRequiredInteger(shell, "data-atlas-resource-gpu-buffers"),
      gpuPipelines: await readRequiredInteger(shell, "data-atlas-resource-gpu-pipelines"),
      gpuQueries: await readRequiredInteger(shell, "data-atlas-resource-gpu-queries"),
      textures: await readRequiredInteger(shell, "data-atlas-resource-textures"),
      models: await readRequiredInteger(shell, "data-atlas-resource-models"),
      subscriptions: await readRequiredInteger(shell, "data-atlas-resource-subscriptions"),
      objectUrls: await readRequiredInteger(shell, "data-atlas-resource-object-urls"),
      typedArrayCaches: await readRequiredInteger(shell, "data-atlas-resource-typed-array-caches"),
      cameraLocks: await readRequiredInteger(shell, "data-atlas-resource-camera-locks"),
      estimatedBytes: await readRequiredInteger(shell, "data-atlas-resource-estimated-bytes"),
      estimatedGpuBytes: await readRequiredInteger(shell, "data-atlas-resource-estimated-gpu-bytes"),
      identityDigest: await readRequiredAttribute(shell, "data-atlas-resource-identity-digest"),
      ownerCount: await readRequiredInteger(shell, "data-atlas-resource-owner-count"),
    },
  };
}

test("V6 manual A/B preserves Canvas, sceneRevision and the full resource baseline", async ({ page }) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/?presentation=sandbox", { waitUntil: "domcontentloaded" });
  const shell = page.locator(SHELL);
  await expect(shell).toHaveAttribute("data-atlas-delivery-profile", "local-shadow");
  await expect(shell).toHaveAttribute("data-atlas-resource-revision", /\d+/);
  await expect(page.locator("canvas")).toHaveCount(1);
  await page.waitForTimeout(1_200);
  const before = await readBaseline(page);

  await page.getByRole("button", { name: "V6 Shadow", exact: true }).click();
  await expect(shell).toHaveAttribute("data-atlas-visual-profile-v294", "science-cinematic-v6-v300");
  await page.getByRole("button", { name: "Legacy V9", exact: true }).click();
  await expect(shell).toHaveAttribute("data-atlas-visual-profile-v294", "legacy-v9");
  await page.waitForTimeout(250);

  expect(await readBaseline(page)).toEqual(before);
  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("v321 Science fixed-band cycle preserves authority bytes and returns every resource to baseline", async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const mobile = testInfo.project.name.includes("mobile");
  if (mobile) await page.setViewportSize({ width: 1440, height: 900 });
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/?presentation=sandbox", { waitUntil: "domcontentloaded" });
  const shell = page.locator(SHELL);
  await expect(shell).toHaveAttribute("data-atlas-delivery-profile", "local-shadow");
  await expect(shell).toHaveAttribute("data-atlas-strong-gravity-render-mode-v294", "inactive");
  await expect(shell).toHaveAttribute("data-atlas-resource-scope-failure-count-v309", "0");
  const baseline = await readStrongGravitySnapshotV321(page);

  await page.getByRole("button", { exact: true, name: "视图" }).click();
  const kerrToggle = page.getByLabel("Kerr 相对论实验室", { exact: true });
  await kerrToggle.check();
  const panel = page.locator("[data-kerr-v299-render-mode]");
  await expect(panel).toBeVisible();
  await panel.getByRole("button", { exact: true, name: "Science · sparse authority" }).click();
  await expect(shell).toHaveAttribute("data-atlas-strong-gravity-render-mode-v294", "science");
  await expect(shell).toHaveAttribute("data-atlas-post-fx-policy-v294", "science-bypassed");
  await expect(shell).toHaveAttribute("data-atlas-science-raster-version-v309", "v321-kerr-fixed-band-sparse-science-raster-v1", { timeout: 30_000 });
  await expect(shell).toHaveAttribute("data-atlas-science-raster-sample-count-v309", "16");
  const science = await readStrongGravitySnapshotV321(page);

  await kerrToggle.uncheck();
  await expect(shell).toHaveAttribute("data-atlas-strong-gravity-render-mode-v294", "inactive");
  await expect.poll(async () => {
    const afterExit = await readStrongGravitySnapshotV321(page);
    return evaluateAtlasStrongGravityBrowserGateV321({ baseline, science, afterExit, mobile }).passed;
  }, { timeout: 30_000 }).toBe(true);
  const afterExit = await readStrongGravitySnapshotV321(page);
  expect(evaluateAtlasStrongGravityBrowserGateV321({ baseline, science, afterExit, mobile })).toEqual({
    version: "v321-strong-gravity-fixed-band-browser-gate",
    passed: true,
    failures: [],
    boundary: "local-shadow-fixed-band-browser-qualification-only-no-product-promotion",
  });
  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});
