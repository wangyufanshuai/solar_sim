import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { collectBrowserEvidenceV645 } from "./collect-mainline-a-r66-browser-evidence-v645.mjs";
import { jsonBytes, safeFile, sha256, writeExclusiveJson } from "./mainline-a-release-evidence.mjs";

export const WEB_BROWSER_SCHEMA_V647 = "mainline-a-web-browser-v647";
const EXPECTED_COUNTS = Object.freeze([12, 18, 0, 30]);

function requireValue(value, code) {
  if (!value) throw new Error(`web-browser-v647:${code}`);
}

export function verifyWebRightsObservationV647(raw, device) {
  const rights = raw?.webRights;
  requireValue(rights && rights.atlasOpen === true, `${device}:atlas-not-open`);
  requireValue(rights.webRelease === "blocked-rights-pending", `${device}:release-promoted`);
  requireValue(Array.isArray(rights.summaryCounts) && rights.summaryCounts.length === 4
    && rights.summaryCounts.every((count, index) => count === EXPECTED_COUNTS[index]),
  `${device}:rights-summary-invalid`);
  requireValue(rights.licenseRecorded === 12, `${device}:license-count-invalid`);
  requireValue(rights.selectedAdmission === "candidate-only", `${device}:selected-admission-promoted`);
  requireValue(rights.selectedRightsReview === "pending", `${device}:selected-rights-promoted`);
  requireValue(rights.clearedClaimVisible === false, `${device}:false-clearance-visible`);
  requireValue(rights.closeButtonNoWrap === true, `${device}:close-button-wrap`);
  return Object.freeze({
    device,
    atlasOpen: true,
    webRelease: "blocked-rights-pending",
    localDisplayed: rights.summaryCounts[0],
    candidateRecords: rights.summaryCounts[1],
    signedRights: rights.summaryCounts[2],
    reviewPending: rights.summaryCounts[3],
    licenseRecorded: rights.licenseRecorded,
    selectedAdmission: rights.selectedAdmission,
    selectedRightsReview: rights.selectedRightsReview,
    clearedClaimVisible: false,
    closeButtonNoWrap: true,
  });
}

async function readRaw(workspace, relative) {
  const file = await safeFile(workspace, relative);
  requireValue(file.stat.size > 0 && file.stat.size <= 2 * 1024 * 1024, `raw-size:${relative}`);
  const bytes = await readFile(file.absolute);
  try { return JSON.parse(bytes.toString("utf8")); }
  catch { throw new Error(`web-browser-v647:raw-json-invalid:${relative}`); }
}

export async function collectMainlineAWebBrowserV647(workspace, paths) {
  const base = await collectBrowserEvidenceV645(workspace, paths);
  const [desktopRaw, mobileRaw] = await Promise.all([
    readRaw(workspace, paths.desktopRaw),
    readRaw(workspace, paths.mobileRaw),
  ]);
  const desktopRights = verifyWebRightsObservationV647(desktopRaw, "desktop");
  const mobileRights = verifyWebRightsObservationV647(mobileRaw, "mobile-viewport");
  requireValue(base.desktop.viewport[0] >= 1024 && base.mobileViewport.viewport[0] <= 600,
    "viewport-class-invalid");
  requireValue(base.build.runtimeBuildId === base.desktop.dom.build.runtimeBuildId
    && base.build.runtimeBuildId === base.mobileViewport.dom.build.runtimeBuildId,
  "build-identity-drift");
  return {
    ...base,
    schema: WEB_BROWSER_SCHEMA_V647,
    status: "observed-local-release-blocked",
    technicalObservation: "passed",
    evidenceClass: "browser",
    webRights: { desktop: desktopRights, mobileViewport: mobileRights },
    claims: { ...base.claims, copyrightApproval: false, publicWebReleaseApproved: false },
    note: "Local Chrome DOM and screenshot verification; source license labels did not promote rights or web release.",
  };
}

function args(argv) {
  const permitted = new Set(["build", "desktop-raw", "desktop-shot", "mobile-raw", "mobile-shot", "output", "check", "json"]);
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const key = token?.replace(/^--/, "");
    if (!token?.startsWith("--") || !permitted.has(key) || Object.hasOwn(options, key)) {
      throw new Error(`web-browser-v647:option-invalid:${token}`);
    }
    if (key === "check" || key === "json") options[key] = true;
    else options[key] = argv[++index];
  }
  for (const key of ["build", "desktop-raw", "desktop-shot", "mobile-raw", "mobile-shot"]) {
    requireValue(typeof options[key] === "string" && options[key].trim(), `missing-${key}`);
  }
  if (!options.check) requireValue(typeof options.output === "string" && options.output.trim(), "missing-output");
  return options;
}

async function main() {
  const options = args(process.argv.slice(2));
  const receipt = await collectMainlineAWebBrowserV647(process.cwd(), {
    build: options.build,
    desktopRaw: options["desktop-raw"], desktopShot: options["desktop-shot"],
    mobileRaw: options["mobile-raw"], mobileShot: options["mobile-shot"],
  });
  if (!options.check) await writeExclusiveJson(process.cwd(), options.output, receipt);
  console.log(options.json ? JSON.stringify(receipt, null, 2)
    : `Web browser V647: ${receipt.technicalObservation}; release blocked; sha256=${sha256(jsonBytes(receipt))}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
}
