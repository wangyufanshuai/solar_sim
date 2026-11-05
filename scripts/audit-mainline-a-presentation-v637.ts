import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type PresentationBoundsV637 = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type PresentationObservationV637 = {
  schema: "mainline-a-layout-observation-v637";
  capturedAt: string;
  viewport: { width: number; height: number };
  buildId: string;
  url: string;
  elements: {
    navigation: PresentationBoundsV637 | null;
    toolbar: PresentationBoundsV637 | null;
    brand: PresentationBoundsV637 | null;
  };
  foregroundPanels: string[];
  activePanel: string;
  focusedInsidePanel: boolean | null;
  horizontalOverflowPx: number;
};

type Finding = { code: string; detail: string };
const ELEMENTS = ["navigation", "toolbar", "brand"] as const;

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function bounds(value: unknown): value is PresentationBoundsV637 {
  return record(value)
    && finite(value.x) && finite(value.y)
    && finite(value.width) && value.width > 0
    && finite(value.height) && value.height > 0;
}

export function overlapAreaV637(a: PresentationBoundsV637, b: PresentationBoundsV637): number {
  const width = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const height = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return width * height;
}

export function inspectPresentationObservationV637(input: unknown, expectedBuildId: string) {
  const findings: Finding[] = [];
  const fail = (code: string, detail: string) => findings.push({ code, detail });
  if (!record(input)) {
    return { status: "invalid" as const, findings: [{ code: "input", detail: "Observation must be an object" }] };
  }
  if (input.schema !== "mainline-a-layout-observation-v637") fail("schema", "Unsupported observation schema");
  if (typeof input.capturedAt !== "string" || !Number.isFinite(Date.parse(input.capturedAt))) {
    fail("timestamp", "A valid capture time is required");
  }
  if (!/^mainline-a-[a-f0-9]{16}$/.test(expectedBuildId)) fail("expected-build", "Expected identity is invalid");
  if (input.buildId !== expectedBuildId) fail("build-mismatch", "Observation belongs to another build");
  try {
    const url = new URL(String(input.url));
    if (!["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)
      || !["http:", "https:"].includes(url.protocol) || url.username || url.password) {
      fail("origin", "This verifier only handles local production preview observations");
    }
  } catch {
    fail("origin", "Capture URL is invalid");
  }
  const viewport = input.viewport;
  if (!record(viewport) || !finite(viewport.width) || !finite(viewport.height)
    || viewport.width < 1 || viewport.height < 1) {
    fail("viewport", "Positive finite viewport dimensions are required");
  }
  if (!record(input.elements)) {
    fail("elements", "Measured header elements are missing");
  } else {
    for (const name of ELEMENTS) {
      const rect = input.elements[name];
      if (!bounds(rect)) {
        fail(`missing-${name}`, "Visible, positive bounds are required");
        continue;
      }
      if (record(viewport) && finite(viewport.width) && finite(viewport.height)) {
        if (rect.x < -1 || rect.y < -1 || rect.x + rect.width > viewport.width + 1
          || rect.y + rect.height > viewport.height + 1) {
          fail(`offscreen-${name}`, "Element extends outside the captured viewport");
        }
      }
    }
    for (let i = 0; i < ELEMENTS.length; i += 1) {
      for (let j = i + 1; j < ELEMENTS.length; j += 1) {
        const first = input.elements[ELEMENTS[i]];
        const second = input.elements[ELEMENTS[j]];
        if (bounds(first) && bounds(second) && overlapAreaV637(first, second) > 1) {
          fail("header-overlap", `${ELEMENTS[i]} overlaps ${ELEMENTS[j]}`);
        }
      }
    }
  }
  if (!finite(input.horizontalOverflowPx) || input.horizontalOverflowPx < 0) {
    fail("overflow-measurement", "Horizontal overflow must be measured");
  } else if (input.horizontalOverflowPx > 1) {
    fail("horizontal-overflow", `${input.horizontalOverflowPx}px beyond viewport`);
  }
  const panels = input.foregroundPanels;
  if (!Array.isArray(panels) || !panels.every((panel) => typeof panel === "string" && panel.length > 0)) {
    fail("panel-inventory", "Foreground panel identities must be listed");
  } else {
    if (panels.length > 1) fail("concurrent-panels", "Multiple foreground panels are visible");
    if (new Set(panels).size !== panels.length) fail("duplicate-panels", "Duplicate panel identities");
    if (input.activePanel === "none" && panels.length !== 0) fail("panel-state", "Closed state has an open panel");
    if (typeof input.activePanel !== "string" || input.activePanel.length === 0) fail("panel-state", "Active panel is missing");
    else if (input.activePanel !== "none" && input.activePanel !== "performance"
      && (panels.length !== 1 || panels[0] !== input.activePanel)) {
      fail("panel-state", "Visible foreground panel does not match navigation state");
    }
    if (panels.length > 0 && input.focusedInsidePanel !== true) fail("panel-focus", "Foreground panel has no observed focus");
    if (panels.length === 0 && input.focusedInsidePanel !== null) fail("panel-focus", "Absent panel requires a null focus measurement");
  }
  return { status: findings.length === 0 ? "consistent" as const : "inconsistent" as const, findings };
}

export function presentationInputPathV637(root: string, requested: string): string {
  const absolute = path.resolve(root, requested);
  const relative = path.relative(root, absolute);
  if (relative.startsWith(`..${path.sep}`) || relative === ".." || path.isAbsolute(relative) || relative === "") {
    throw new Error("Presentation audit paths must remain inside next-web");
  }
  return absolute;
}

export async function auditPresentationFileV637(options: {
  root: string;
  input: string;
  buildReceipt: string;
  output: string;
}) {
  const inputPath = presentationInputPathV637(options.root, options.input);
  const buildPath = presentationInputPathV637(options.root, options.buildReceipt);
  const outputPath = presentationInputPathV637(options.root, options.output);
  const [bytes, buildBytes] = await Promise.all([readFile(inputPath), readFile(buildPath)]);
  const build: unknown = JSON.parse(buildBytes.toString("utf8"));
  if (!record(build) || build.status !== "passed" || build.sourceStable !== true
    || typeof build.runtimeBuildId !== "string") {
    throw new Error("A successful source-stable production build receipt is required");
  }
  const observations: unknown = JSON.parse(bytes.toString("utf8"));
  if (!Array.isArray(observations) || observations.length === 0) throw new Error("No layout observations supplied");
  const results = observations.map((item) => inspectPresentationObservationV637(item, build.runtimeBuildId as string));
  const report = {
    schema: "mainline-a-presentation-audit-v637",
    auditedAt: new Date().toISOString(),
    evidenceClass: "static-replay-of-supplied-browser-observations",
    status: results.every((item) => item.status === "consistent") ? "consistent" : "inconsistent",
    runtimeBuildId: build.runtimeBuildId,
    input: { path: options.input, sha256: createHash("sha256").update(bytes).digest("hex") },
    buildReceipt: { path: options.buildReceipt, sha256: createHash("sha256").update(buildBytes).digest("hex") },
    observations: results,
    boundary: {
      independentBrowserAttestation: false,
      visualApproval: false,
      performanceClaim: false,
      scientificPayloadWriteback: false,
      rightsApproval: false,
    },
  };
  await writeFile(outputPath, JSON.stringify(report, null, 2) + "\n", { flag: "wx" });
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const argument = (name: string) => process.argv[process.argv.indexOf(name) + 1];
  const required = ["--input", "--build-receipt", "--output"];
  if (required.some((flag) => !process.argv.includes(flag) || !argument(flag) || argument(flag).startsWith("--"))) {
    console.error("Usage: node --import tsx scripts/audit-mainline-a-presentation-v637.ts --input FILE --build-receipt FILE --output NEW_FILE");
    process.exitCode = 1;
  } else {
    auditPresentationFileV637({ root: path.resolve(fileURLToPath(new URL("..", import.meta.url))), input: argument("--input"), buildReceipt: argument("--build-receipt"), output: argument("--output") })
      .then((report) => { console.log(JSON.stringify(report)); if (report.status !== "consistent") process.exitCode = 1; })
      .catch((error: unknown) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
  }
}
