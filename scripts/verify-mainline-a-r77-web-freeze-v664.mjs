import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";
import { pinFileV662, safeWorkspacePathV662 } from
  "./build-mainline-a-r75-matrix-v662.mjs";
import { buildR77WebFreezeV664, R77_GROUPS_V664,
  R77_NEBULA_HOLDS_V664, R77_STAR_HOLDS_V664,
  sha256R77V664 } from
  "./build-mainline-a-r77-web-freeze-v664.mjs";

const SHA = /^[a-f0-9]{64}$/;
function same(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}
function add(issues, code, detail) {
  issues.push(detail ? code + ":" + detail : code);
}
function sorted(values) {
  return [...values].sort((a, b) => a.localeCompare(b));
}
export function inspectR77FreezeV664(snapshot) {
  const issues = [];
  if (snapshot?.schema !== "mainline-a-r77-web-freeze-v664"
    || snapshot.evidenceClass
      !== "static-source-and-asset-replay-candidate-only"
    || !SHA.test(snapshot.appSourceSha256 ?? "")
    || !SHA.test(snapshot.fingerprint ?? "")) {
    add(issues, "schema-or-source-invalid");
  }
  const payload = { ...snapshot };
  delete payload.fingerprint;
  delete payload.generatedAt;
  if (sha256R77V664(JSON.stringify(payload))
    !== snapshot?.fingerprint) {
    add(issues, "fingerprint-not-reproducible");
  }
  const rows = snapshot?.matrixRows;
  const scenes = snapshot?.scenes;
  const counts = snapshot?.counts ?? {};
  if (!Array.isArray(rows) || rows.length !== 96
    || new Set(rows.map((row) => row.key)).size !== 96
    || sha256R77V664(JSON.stringify(rows))
      !== snapshot.matrixRowDigest) {
    add(issues, "matrix-row-digest-or-coverage");
  }
  for (const [group, count] of Object.entries(R77_GROUPS_V664)) {
    if (rows?.filter((row) => row.group === group).length !== count
      || counts[group] !== count) {
      add(issues, "group-count", group);
    }
  }
  const stars = rows?.filter((row) => row.group === "beta-star") ?? [];
  const nebulae = rows?.filter((row) =>
    row.group === "beta-nebula") ?? [];
  if (!same(sorted(stars.filter((row) =>
    row.state === "identity-hold").map((row) => row.id)),
  R77_STAR_HOLDS_V664)
    || stars.filter((row) => row.state === "reviewable").length !== 20
    || counts.betaStarIdentityHolds !== 4) {
    add(issues, "stellar-hold-promoted-or-missing");
  }
  if (!same(sorted(nebulae.filter((row) =>
    row.state === "source-hold").map((row) => row.id)),
  R77_NEBULA_HOLDS_V664)
    || nebulae.filter((row) => row.imageRoute).length !== 19
    || nebulae.filter((row) => row.imageRoute === null).length !== 5
    || nebulae.some((row) => row.state === "source-hold"
      && (row.imageRoute !== null
        || row.imageSha256 !== null))
    || counts.betaNebulaImageHolds !== 5
    || counts.betaNebulaReviewRoutes !== 19) {
    add(issues, "nebula-hold-promoted-or-missing");
  }
  if (!Array.isArray(scenes) || scenes.length !== 36
    || new Set(scenes.map((row) => row.key)).size !== 36
    || counts.canonicalScenes !== 36
    || ["star", "constellation", "nebula"].some((kind) =>
      scenes.filter((row) => row.kind === kind).length !== 12)
    || scenes.some((row) => row.runtimeAdmission !== "candidate-only"
      || row.rightsSigned !== false
      || !rows?.some((item) => item.key === "a:" + row.key)
      || row.catalogId !== (row.kind === "star"
        ? "stellar-hero:" + row.id : row.key))) {
    add(issues, "canonical-scene-coverage-or-admission");
  }
  const allPins = [...(snapshot?.inputs ?? []),
    ...(snapshot?.assetPins ?? []),
    ...(snapshot?.v616Pins ?? []),
    snapshot?.readinessPin, snapshot?.canonicalPin];
  if (snapshot?.inputs?.length !== 4
    || snapshot.assetPins?.length !== 49
    || snapshot.v616Pins?.length !== 2
    || snapshot.readinessPin?.path
      !== "app/data/mainlineAWebReadinessV663.generated.json"
    || snapshot.canonicalPin?.path
      !== "app/data/mainlineACanonicalCoverageV622.generated.json") {
    add(issues, "source-pin-coverage");
  }
  for (const pin of allPins) {
    try {
      safeWorkspacePathV662(pin.path);
      if (!Number.isSafeInteger(pin.bytes) || pin.bytes <= 0
        || !SHA.test(pin.sha256)) add(issues, "invalid-pin", pin.path);
    } catch {
      add(issues, "unsafe-or-missing-pin", pin?.path);
    }
  }
  if (snapshot?.v616Pins?.[0]?.sha256
      !== "706be4e043fce25df4cd0e01522dd6ef5863c5cdf902c3e08ab6563e6c7a863b"
    || snapshot?.v616Pins?.[1]?.sha256
      !== "8fbb31166d5b96890236da6842ce9f53a4ace3133ffbaabccd9811e8005e0dce"
    || !SHA.test(snapshot.readinessFingerprint ?? "")
    || counts.aRightsSigned !== 0
    || counts.betaRightsSigned !== 0
    || counts.runtimeAdmitted !== 0
    || snapshot?.browserPlan?.matrixRowsPerViewport !== 96
    || snapshot.browserPlan.canonicalScenesPerViewport !== 36
    || snapshot.browserPlan.physicalMobile !== "not-run"
    || snapshot?.boundary?.candidateOnly !== true
    || snapshot.boundary.hold !== true
    || snapshot.boundary.notAdmitted !== true
    || snapshot.boundary.scientificPayloadWriteback !== false
    || snapshot.boundary.publicWebReleaseApproved !== false
    || snapshot?.claims?.scientificValidity !== false
    || snapshot.claims.copyrightApproval !== false
    || snapshot.claims.productionPerformance !== false
    || snapshot.claims.realUserValidation !== false
    || snapshot.claims.publicWebReleaseApproved !== false) {
    add(issues, "gate-or-boundary-promotion");
  }
  return { ok: issues.length === 0, issues,
    rows: rows?.length ?? 0,
    scenes: scenes?.length ?? 0,
    pins: allPins.length };
}
export async function replayR77FreezeV664(snapshot) {
  const shape = inspectR77FreezeV664(snapshot);
  const issues = [...shape.issues];
  const pins = [...(snapshot?.inputs ?? []),
    ...(snapshot?.assetPins ?? []),
    ...(snapshot?.v616Pins ?? []),
    snapshot?.readinessPin, snapshot?.canonicalPin];
  let pinChecks = 0;
  for (const expected of pins) {
    if (!expected?.path) continue;
    try {
      const actual = await pinFileV662(expected.path);
      pinChecks += 1;
      if (actual.bytes !== expected.bytes
        || actual.sha256 !== expected.sha256) {
        add(issues, "source-or-asset-drift", expected.path);
      }
    } catch {
      add(issues, "pin-unreadable", expected.path);
    }
  }
  try {
    const fresh = await buildR77WebFreezeV664();
    if (!same({ ...fresh, generatedAt: null },
      { ...snapshot, generatedAt: null })) {
      add(issues, "recomputed-freeze-differs");
    }
  } catch (error) {
    add(issues, "freeze-recomputation-failed",
      error?.message ?? "unknown");
  }
  const current = await captureBuildInputs();
  if (current.sha256 !== snapshot?.appSourceSha256) {
    add(issues, "current-source-changed");
  }
  return { schema: "mainline-a-r77-web-freeze-replay-v664",
    status: issues.length ? "rejected" : "verified-candidate-hold",
    observedAt: new Date().toISOString(),
    fingerprint: snapshot?.fingerprint ?? null,
    appSourceSha256: current.sha256,
    pinChecks, rows: shape.rows,
    scenes: shape.scenes, issues,
    boundary: { candidateOnly: true, hold: true,
      notAdmitted: true, scientificPayloadWriteback: false,
      publicWebReleaseApproved: false } };
}
export function parseR77ReplayOptionsV664(argv) {
  if (argv.length !== 2 || argv[0] !== "--run-id"
    || !/^20261013v664r77freeze0[1-9]$/.test(argv[1])) {
    throw new Error("r77-freeze-replay:usage");
  }
  return argv[1];
}
if (process.argv[1] && path.resolve(process.argv[1])
  === fileURLToPath(import.meta.url)) {
  const runId = parseR77ReplayOptionsV664(
    process.argv.slice(2));
  const input = "docs/release/v607/mainline-a-r77-v664-freeze-"
    + runId + ".json";
  const snapshot = JSON.parse(await readFile(
    safeWorkspacePathV662(input), "utf8"));
  const result = await replayR77FreezeV664(snapshot);
  const output = "docs/release/v607/mainline-a-r77-v664-freeze-replay-"
    + runId + ".json";
  await writeFile(safeWorkspacePathV662(output),
    JSON.stringify(result, null, 2) + "\n", { flag: "wx" });
  console.log(JSON.stringify({ status: result.status,
    rows: result.rows, scenes: result.scenes,
    pinChecks: result.pinChecks, issues: result.issues,
    output }));
  if (result.issues.length) process.exitCode = 1;
}
