import {
  expect,
  test as base,
  type Locator,
  type Page,
  type TestInfo,
} from "@playwright/test";

type AtlasRuntimeAuditV263 = {
  version: "v263-browser-runtime-audit-v1";
  consoleErrors: string[];
  pageErrors: string[];
  missingResources: string[];
  rendererFaults: number;
};

export const test = base.extend<{ atlasRuntimeAuditV263: void }>({
  atlasRuntimeAuditV263: [async ({ page }, use, testInfo) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const missingResources: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("response", (response) => {
      if (response.status() === 404) missingResources.push(response.url());
    });

    await use();

    const rendererFaults = page.isClosed()
      ? 0
      : await page.getByText("Renderer Fault", { exact: true }).count();
    const audit: AtlasRuntimeAuditV263 = {
      version: "v263-browser-runtime-audit-v1",
      consoleErrors,
      pageErrors,
      missingResources,
      rendererFaults,
    };
    await testInfo.attach("atlas-runtime-audit-v263", {
      body: Buffer.from(JSON.stringify(audit)),
      contentType: "application/json",
    });

    expect(consoleErrors, "fresh matrix console errors").toEqual([]);
    expect(pageErrors, "fresh matrix page errors").toEqual([]);
    expect(missingResources, "fresh matrix missing resources").toEqual([]);
    expect(rendererFaults, "fresh matrix Renderer Fault count").toBe(0);
  }, { auto: true }],
});

export async function enterAtlasResearchModeV263(
  page: Page,
  testInfo: TestInfo,
): Promise<void> {
  if (testInfo.project.name.startsWith("mobile-")) {
    await page.getByRole("button", { name: "更多", exact: true }).click();
    await page.getByRole("button", { name: "切换到研究模式", exact: true }).click();
  } else {
    await page.locator('[data-atlas-experience-mode-toggle="desktop"]:visible').click();
  }
  await expect(page.locator('[data-atlas-observing-planner="v258-lazy-boundary"]')).toBeVisible();
}

export { expect };
export type { Locator, Page, TestInfo };
