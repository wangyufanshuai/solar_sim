import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = process.cwd();
const PREFIX = "docs/release/v607/stellar-component-tap-v646";
const LEDGER = `${PREFIX}/ledger-r66-tap-20261007-001.json`;
const REPLAY = `${PREFIX}/replay-r66-tap-20261007-001.json`;
const REVIEW = "docs/release/v607/mainline-a-r66-stellar-component-review-packet-20261007.json";
const OUTPUT = `${PREFIX}/analysis-r66-tap-20261007-001.json`;
const hash = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");
const assert = (value, message) => { if (!value) throw new Error(`tap-analysis:${message}`); };
const read = (relative) => fs.readFileSync(path.join(ROOT, relative));
const json = (relative) => JSON.parse(read(relative).toString("utf8"));
const ref = (relative) => ({ path: relative, bytes: read(relative).length, sha256: hash(read(relative)) });

function analyze() {
  const ledger = json(LEDGER), replay = json(REPLAY), review = json(REVIEW);
  assert(ledger.schema === "mainline-a-stellar-tap-cross-id-capture-v646" && ledger.counts.responseCaptured === 4, "capture-incomplete");
  assert(replay.schema === "mainline-a-stellar-tap-cross-id-replay-v646" && replay.status === "verified-candidate-only", "replay-not-verified");
  assert(replay.ledger.sha256 === ref(LEDGER).sha256 && replay.counts.responseCaptured === 4, "replay-ledger-drift");
  assert(review.schema === "mainline-a-r66-stellar-component-review-packet-v645" && review.records.length === 4, "review-input-drift");
  assert(ledger.boundary.scientificPayloadWriteback === false && review.boundary.scientificPayloadWriteback === false, "boundary-open");
  const records = ledger.records.map((record) => {
    const reviewRow = review.records.find((row) => row.id === record.id);
    assert(reviewRow && record.responseCaptured === 1 && record.artifact && record.status === "structured-cross-id-candidate", `${record.id}:capture-state`);
    assert(ref(record.artifact.path).sha256 === record.artifact.sha256 && ref(record.artifact.path).bytes === record.artifact.bytes, `${record.id}:artifact-drift`);
    const prefix = `WDS J${record.plan.wdsSystemId}`;
    const hero = record.parsedRows.find((row) => row.identifier === record.plan.identifiers[0]);
    const primary = record.parsedRows.find((row) => row.identifier === `${prefix}A`);
    assert(hero && primary && hero.oidref === primary.oidref, `${record.id}:hero-primary-cross-id-not-matched`);
    assert(reviewRow.wdsSystemId === record.plan.wdsSystemId, `${record.id}:wds-system-drift`);
    const otherComponents = record.parsedRows.filter((row) =>
      [`${prefix}B`, `${prefix}C`, `${prefix}D`].includes(row.identifier));
    assert(otherComponents.every((row) => row.oidref !== hero.oidref), `${record.id}:other-component-aliases-primary`);
    const closePairAlias = record.parsedRows.find((row) => row.identifier === `${prefix}Aa,Ab`) ?? null;
    const physicalSubcomponents = record.parsedRows.filter((row) =>
      [`${prefix}Aa`, `${prefix}Ab`].includes(row.identifier));
    const warnings = [];
    if (closePairAlias && closePairAlias.oidref === hero.oidref) warnings.push("close-pair-identifier-aliases-primary-simbad-object");
    if (physicalSubcomponents.length === 0) warnings.push("no-individually-resolved-aa-or-ab-cross-id-in-bounded-query");
    if (otherComponents.length === 0) warnings.push("no-distinct-wide-companion-in-bounded-query");
    return {
      id: record.id,
      wdsSystemId: record.plan.wdsSystemId,
      heroIdentifier: hero.identifier,
      simbadObject: { oidref: hero.oidref, mainId: hero.mainId, objectType: hero.objectType,
        raDeg: hero.raDeg, decDeg: hero.decDeg },
      wdsPrimaryCrossId: primary.identifier,
      heroAndWdsPrimarySameSimbadObject: true,
      otherComponentObjects: otherComponents.map((row) => ({ identifier: row.identifier, oidref: row.oidref, mainId: row.mainId })),
      closePairAlias: closePairAlias ? { identifier: closePairAlias.identifier, oidref: closePairAlias.oidref,
        sameSimbadObjectAsHero: closePairAlias.oidref === hero.oidref } : null,
      individuallyResolvedCloseComponentsFound: physicalSubcomponents.length,
      warnings,
      rawCsv: ref(record.artifact.path),
      candidateCrossIdStatus: "same-simbad-object",
      physicalComponentIdentityStatus: "review-required",
      componentIdentityConfirmed: false,
      scientificPayloadWriteback: false,
    };
  });
  assert(records.length === 4 && records.every((row) => row.heroAndWdsPrimarySameSimbadObject), "four-cross-id-status");
  return {
    schema: "mainline-a-stellar-tap-cross-id-analysis-v646",
    createdAt: new Date().toISOString(),
    evidenceClass: "external-source-structured-candidate",
    status: "four-cross-ids-matched-four-component-identities-pending",
    inputs: { captureLedger: ref(LEDGER), offlineReplay: ref(REPLAY), wdsReviewPacket: ref(REVIEW) },
    summary: { responseCaptured: 4, heroToWdsPrimaryCrossIdsMatched: 4, physicalComponentIdentitiesConfirmed: 0,
      rightsApproved: 0 },
    records,
    reviewRule: "SIMBAD oidref equality proves an exact database cross-identification for queried labels. It does not prove that a product hero denotes one physical star rather than an unresolved or composite component.",
    boundary: { candidateOnly: true, hold: true, notAdmitted: true, componentConfirmed: false,
      scientificPayloadWriteback: false, runtimeWrites: false, rightsApproved: false },
  };
}

function check(existing) {
  const { createdAt, ...stored } = existing;
  const { createdAt: ignored, ...rebuilt } = analyze();
  assert(Number.isFinite(Date.parse(createdAt)) && JSON.stringify(stored) === JSON.stringify(rebuilt), "analysis-drift");
  return { status: "verified-candidate-only", analysis: ref(OUTPUT), summary: existing.summary,
    componentIdentityConfirmed: false };
}

function main(argv) {
  assert(json("package.json").name === "solar-next-web", "wrong-workspace");
  if (argv.length === 1 && argv[0] === "--build") {
    assert(!fs.existsSync(path.join(ROOT, OUTPUT)), "output-exists");
    const body = analyze();
    fs.writeFileSync(path.join(ROOT, OUTPUT), JSON.stringify(body, null, 2) + "\n", { flag: "wx" });
    return { status: body.status, analysis: ref(OUTPUT), summary: body.summary };
  }
  if (argv.length === 1 && argv[0] === "--check") return check(json(OUTPUT));
  throw new Error("Usage: node analyze-cross-ids.mjs --build | --check");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { process.stdout.write(`${JSON.stringify(main(process.argv.slice(2)), null, 2)}\n`); }
  catch (error) { process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`); process.exitCode = 1; }
}
