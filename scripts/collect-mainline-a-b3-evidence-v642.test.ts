import { readFileSync } from "node:fs";
import { test } from "node:test";
import { validateBrowserReceiptV642 } from "./collect-mainline-a-b3-evidence-v642";

const browser = JSON.parse(readFileSync("docs/release/v607/mainline-a-b3-browser-v642-20260929-final.json", "utf8"));
const build = JSON.parse(readFileSync("docs/release/v607/mainline-a-r66-build-b3v642-20260929-003.json", "utf8"));

test("V642 browser receipt binds to the new production build and two viewports", () => {
  const issues = validateBrowserReceiptV642(browser, build);
  if (issues.length > 0) throw new Error(issues.join(","));
});

test("V642 browser receipt rejects reused build and promoted candidate rows", () => {
  const wrongBuild = validateBrowserReceiptV642({ ...browser, buildId: "old-build" }, build);
  if (!wrongBuild.includes("build-identity")) throw new Error("old build was accepted");
  const promoted = validateBrowserReceiptV642({ ...browser, desktop: { ...browser.desktop, roster: { ...browser.desktop.roster, candidateRows: ["acrux"] } } }, build);
  if (!promoted.includes("candidate-rows")) throw new Error("candidate promotion was accepted");
});

test("V642 browser receipt rejects screenshot, overflow and class-switch tampering", () => {
  const screenshot = validateBrowserReceiptV642({ ...browser, screenshots: browser.screenshots.map((shot: Record<string, unknown>, index: number) => index === 0 ? { ...shot, sha256: "0".repeat(64) } : shot) }, build);
  if (!screenshot.includes("screenshot-integrity")) throw new Error("screenshot tamper was accepted");
  const overflow = validateBrowserReceiptV642({ ...browser, mobileViewport: { ...browser.mobileViewport, scrollWidth: 600 } }, build);
  if (!overflow.includes("mobile-overflow")) throw new Error("mobile overflow was accepted");
  const classSwitch = validateBrowserReceiptV642({ ...browser, classSwitch: { ...browser.classSwitch, selected: "external-source" } }, build);
  if (!classSwitch.includes("class-switch")) throw new Error("class switch tamper was accepted");
});
