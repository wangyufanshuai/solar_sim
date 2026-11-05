import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const generatedAt = process.env.ATLAS_STELLAR_PROVENANCE_GENERATED_AT ?? "2026-08-25T00:00:00Z";
const packetPath = "public/data/living-universe-v592/stellar-heroes.json";
const simbadSnapshotPath = "docs/release/post-v593/source-snapshots/simbad-stellar-24-2026-08-25.json";
const literatureSnapshotPath = "docs/release/post-v593/source-snapshots/stellar-literature-intake-2026-08-25.json";
const exaSearchLedgerPath = "docs/release/post-v593/source-snapshots/exa-stellar-source-search-ledger-2026-08-25.json";
const manifestPath = "public/data/post-v593-stellar-relativity/stellar-provenance-v1.json";
const generatedPath = "app/data/stellarProvenanceCandidate.generated.ts";
const receiptPath = "docs/release/post-v593/stellar-provenance-receipt-v1.json";

const FIELD_STATUSES = Object.freeze([
  "direct",
  "derived",
  "estimated",
  "presentation-only",
  "unknown",
  "search-not-found",
]);
const FIELD_AUTHORITIES = Object.freeze([
  "catalog-anchor",
  "curated",
  "derived",
  "estimated",
  "meta-resolver-basic-data",
  "primary-literature",
  "presentation-only",
  "unknown",
]);

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]))
    : value;
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
const writeJson = (path, value) => {
  const absolute = resolve(root, path);
  mkdirSync(dirname(absolute), { recursive: true });
  writeFileSync(absolute, `${JSON.stringify(value, null, 2)}\n`, "utf8");
};
const readJson = (path) => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const assertCanonicalSeal = (document, field, label) => {
  const unsigned = { ...document };
  delete unsigned[field];
  if (document[field] !== canonicalSha(unsigned)) throw new Error(`post-v593-stellar-${label}-seal`);
};
const normalizeLedgerUrl = (value) => {
  const url = new URL(value);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`post-v593-stellar-exa-ledger-url-scheme:${value}`);
  }
  url.protocol = "https:";
  url.hostname = url.hostname.toLowerCase();
  url.hash = "";
  if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, "");
  return url.toString();
};

function validateExaSearchLedger(ledger, literature) {
  if (
    ledger.version !== "post-v593-exa-stellar-source-search-ledger-v1"
    || ledger.provider !== "Exa"
    || ledger.replayedAt !== null
    || ledger.replayDate !== "2026-08-25"
    || ledger.replayedAtStatus !== "connector-call-timestamp-not-exposed"
    || ledger.historicalAggregate?.status !== "unverifiable-historical-aggregate"
    || ledger.historicalAggregate?.authority !== "historical-note-only-not-used-by-builder"
    || ledger.countingPolicy?.sourcesReviewedDefinition !== "sum-requested-numResults-across-all-search-calls-including-retries"
    || ledger.dedupePolicy?.version !== "exact-normalized-url-first-occurrence-v1"
    || !Array.isArray(ledger.queries)
    || !Array.isArray(ledger.admittedSources)
  ) {
    throw new Error("post-v593-stellar-exa-ledger-schema");
  }

  const queryIds = new Set();
  const slotIds = new Set();
  const firstByNormalizedUrl = new Map();
  const rowsBySlot = new Map();
  let sourcesReviewed = 0;
  let returnedResultSlots = 0;
  for (const query of ledger.queries) {
    if (
      !query.id
      || queryIds.has(query.id)
      || !query.workstream
      || !query.query
      || !Number.isInteger(query.requestedNumResults)
      || query.requestedNumResults < 1
      || query.requestedNumResults > 25
      || !Array.isArray(query.results)
      || query.returnedResultSlots !== query.results.length
    ) {
      throw new Error(`post-v593-stellar-exa-ledger-query:${query.id ?? "missing"}`);
    }
    queryIds.add(query.id);
    sourcesReviewed += query.requestedNumResults;
    returnedResultSlots += query.results.length;
    query.results.forEach((row, index) => {
      const expectedSlotId = `${query.id}:r${String(index + 1).padStart(2, "0")}`;
      const normalizedUrl = normalizeLedgerUrl(row.url);
      const expectedTarget = firstByNormalizedUrl.get(normalizedUrl) ?? expectedSlotId;
      if (
        row.slotId !== expectedSlotId
        || slotIds.has(row.slotId)
        || row.ordinal !== index + 1
        || !row.title
        || row.normalizedUrl !== normalizedUrl
        || !row.sourceClass
        || !["keep", "drop"].includes(row.decision)
        || !row.keepDropReason
        || row.dedupeTargetSlotId !== expectedTarget
      ) {
        throw new Error(`post-v593-stellar-exa-ledger-row:${expectedSlotId}`);
      }
      if (!firstByNormalizedUrl.has(normalizedUrl)) {
        firstByNormalizedUrl.set(normalizedUrl, expectedSlotId);
      }
      slotIds.add(row.slotId);
      rowsBySlot.set(row.slotId, row);
    });
  }

  const admittedSourceKeys = new Set();
  const admittedSlotIds = new Set();
  for (const admitted of ledger.admittedSources) {
    const row = rowsBySlot.get(admitted.selectedSlotId);
    if (
      !admitted.sourceKey
      || admittedSourceKeys.has(admitted.sourceKey)
      || admittedSlotIds.has(admitted.selectedSlotId)
      || !row
      || row.decision !== "keep"
      || admitted.title !== row.title
      || admitted.url !== row.url
      || admitted.normalizedUrl !== row.normalizedUrl
      || admitted.sourceClass !== row.sourceClass
      || !admitted.admissionReason
    ) {
      throw new Error(`post-v593-stellar-exa-ledger-admission:${admitted.sourceKey ?? "missing"}`);
    }
    admittedSourceKeys.add(admitted.sourceKey);
    admittedSlotIds.add(admitted.selectedSlotId);
  }
  const keptSlotIds = new Set(
    [...rowsBySlot.values()].filter((row) => row.decision === "keep").map((row) => row.slotId),
  );
  if (
    keptSlotIds.size !== admittedSlotIds.size
    || [...keptSlotIds].some((slotId) => !admittedSlotIds.has(slotId))
  ) {
    throw new Error("post-v593-stellar-exa-ledger-keep-admission-drift");
  }

  const expectedSourceKeys = [
    "simbad",
    ...Object.keys(literature.reviewedCatalogs ?? {}),
    ...Object.keys(literature.primarySources ?? {}),
  ].sort();
  const actualSourceKeys = [...admittedSourceKeys].sort();
  if (JSON.stringify(actualSourceKeys) !== JSON.stringify(expectedSourceKeys)) {
    throw new Error("post-v593-stellar-exa-ledger-source-coverage");
  }
  const uniqueNormalizedUrls = firstByNormalizedUrl.size;
  const summary = {
    queryCount: queryIds.size,
    workstreamCount: new Set(ledger.queries.map((query) => query.workstream)).size,
    sourcesReviewed,
    returnedResultSlots,
    uniqueNormalizedUrls,
    duplicateResultSlots: returnedResultSlots - uniqueNormalizedUrls,
    uniqueAdmittedSources: admittedSourceKeys.size,
  };
  for (const [key, value] of Object.entries(summary)) {
    if (ledger.summary?.[key] !== value || literature.searchAudit?.[key] !== value) {
      throw new Error(`post-v593-stellar-exa-ledger-summary:${key}`);
    }
  }
  if (
    literature.searchAudit?.ledgerPath !== exaSearchLedgerPath
    || literature.searchAudit?.ledgerSha256 !== ledger.ledgerSha256
    || literature.searchAudit?.replayStatus !== "sealed-replay-replaces-unverifiable-historical-aggregate"
    || literature.searchAudit?.historicalAggregateStatus !== "unverifiable-historical-aggregate"
  ) {
    throw new Error("post-v593-stellar-exa-ledger-literature-binding");
  }
  for (const admitted of ledger.admittedSources) {
    if (admitted.sourceKey === "simbad") continue;
    const source = literature.reviewedCatalogs?.[admitted.sourceKey]
      ?? literature.primarySources?.[admitted.sourceKey];
    if (!source || normalizeLedgerUrl(source.sourceUrl) !== admitted.normalizedUrl) {
      throw new Error(`post-v593-stellar-exa-ledger-selected-url:${admitted.sourceKey}`);
    }
  }
  return Object.freeze(summary);
}

const packet = readJson(packetPath);
const packetUnsigned = { ...packet };
delete packetUnsigned.packetSha256;
if (packet.packetSha256 !== canonicalSha(packetUnsigned)) {
  throw new Error("post-v593-stellar-packet-seal");
}
if (!Array.isArray(packet.heroes) || packet.heroes.length !== 24) {
  throw new Error("post-v593-stellar-roster-count");
}

const simbadSnapshot = readJson(simbadSnapshotPath);
const literatureSnapshot = readJson(literatureSnapshotPath);
const exaSearchLedger = readJson(exaSearchLedgerPath);
assertCanonicalSeal(simbadSnapshot, "snapshotSha256", "simbad-snapshot");
assertCanonicalSeal(literatureSnapshot, "snapshotSha256", "literature-snapshot");
assertCanonicalSeal(exaSearchLedger, "ledgerSha256", "exa-search-ledger");
if (simbadSnapshot.records?.length !== 24 || new Set(simbadSnapshot.records.map((entry) => entry.id)).size !== 24) {
  throw new Error("post-v593-stellar-simbad-roster");
}
if (
  simbadSnapshot.policy?.simbadIsMetaCompilationNotCatalogue !== true
  || simbadSnapshot.policy?.componentAmbiguityBlocksIdentityBinding !== true
  || simbadSnapshot.policy?.coordinateFrameIsNotCoordinateEpoch !== true
  || simbadSnapshot.policy?.missingValuesAreNullNeverZero !== true
) {
  throw new Error("post-v593-stellar-simbad-meta-resolver-policy");
}
validateExaSearchLedger(exaSearchLedger, literatureSnapshot);

const simbadById = new Map(simbadSnapshot.records.map((entry) => [entry.id, entry]));
const literatureById = new Map(literatureSnapshot.records.map((entry) => [entry.id, entry]));

const catalogSource = (source, authorityScope) => ({
  sourceRef: source.sourceRef,
  sourceUrl: source.sourceUrl,
  doi: source.doi ?? null,
  dataRelease: source.dataRelease,
  license: source.license,
  retrievedAt: literatureSnapshot.retrievedAt,
  citationStatus: source.citationStatus,
  authorityScope,
});

const sourceRegistry = {
  "v592-packet": {
    sourceRef: packetPath,
    sourceUrl: null,
    doi: null,
    dataRelease: packet.version,
    license: "not-recorded",
    retrievedAt: generatedAt,
    citationStatus: "local-sealed-presentation-input",
    authorityScope: "presentation-values-only-not-measurement-authority",
    snapshotSha256: packet.packetSha256,
  },
  simbad: {
    sourceRef: "Wenger et al. 2000; SIMBAD Astronomical Database",
    sourceUrl: simbadSnapshot.service.endpoint,
    doi: simbadSnapshot.service.serviceDoi,
    dataRelease: simbadSnapshot.service.release,
    license: simbadSnapshot.service.license,
    retrievedAt: simbadSnapshot.retrievedAt,
    citationStatus: "sealed-24-object-name-resolution-and-basic-data-snapshot",
    authorityScope: "meta-resolver-name-resolution-cross-identification-and-basic-data-with-upstream-bibcodes; not-a-catalogue-or-measurement-authority",
    snapshotPath: simbadSnapshotPath,
    snapshotSha256: simbadSnapshot.snapshotSha256,
  },
  "source-search-audit": {
    sourceRef: literatureSnapshotPath,
    sourceUrl: null,
    doi: null,
    dataRelease: literatureSnapshot.version,
    license: "project-generated-source-audit",
    retrievedAt: literatureSnapshot.retrievedAt,
    citationStatus: "sealed-exa-source-discovery-and-primary-table-extraction",
    authorityScope: "documents-search-not-found-and-reviewed-source-boundaries",
    snapshotSha256: literatureSnapshot.snapshotSha256,
    ledgerPath: exaSearchLedgerPath,
    ledgerSha256: exaSearchLedger.ledgerSha256,
  },
  ...Object.fromEntries(Object.entries(literatureSnapshot.reviewedCatalogs).map(([key, source]) => [
    key,
    catalogSource(source, "reviewed-catalog-documentation; no per-star row admitted unless separately cited"),
  ])),
  ...Object.fromEntries(Object.entries(literatureSnapshot.primarySources).map(([key, source]) => [
    key,
    {
      ...catalogSource(source, "primary-literature-field-values-explicitly-transcribed-with-table/model-scope"),
      bibcode: source.bibcode,
    },
  ])),
  "derived-v592": {
    sourceRef: "v592 deterministic Stefan-Boltzmann derivation",
    sourceUrl: null,
    doi: null,
    dataRelease: "v592 local derivation",
    license: "not-applicable",
    retrievedAt: generatedAt,
    citationStatus: "derivation-reproducible-from-presentation-inputs",
    authorityScope: "derived-presentation-value-not-observation",
  },
  "presentation-contract": {
    sourceRef: "post-v593 presentation contract",
    sourceUrl: null,
    doi: null,
    dataRelease: "post-v593-stellar-provenance-candidate-v1+field-schema-v2",
    license: "project-code",
    retrievedAt: generatedAt,
    citationStatus: "presentation-only",
    authorityScope: "render-model-boundary-only",
  },
};

const bibcodes = new Set();
for (const record of simbadSnapshot.records) {
  for (const bibcode of [record.coordinate?.bibcode, record.parallax?.bibcode, record.spectralType?.bibcode]) {
    if (bibcode) bibcodes.add(bibcode);
  }
}
const bibcodeKey = (bibcode) => `ads-${bibcode.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
for (const bibcode of [...bibcodes].sort()) {
  const key = bibcodeKey(bibcode);
  if (sourceRegistry[key]) throw new Error(`post-v593-stellar-duplicate-source-key:${key}`);
  sourceRegistry[key] = {
    sourceRef: `ADS bibliographic record ${bibcode}`,
    sourceUrl: `https://ui.adsabs.harvard.edu/abs/${encodeURIComponent(bibcode)}/abstract`,
    doi: bibcode === "2007A&A...474..653V" ? "10.1051/0004-6361:20078357" : null,
    dataRelease: `upstream-publication-${bibcode}`,
    license: "publisher-specific-citation-record; no full-text redistribution",
    retrievedAt: simbadSnapshot.retrievedAt,
    citationStatus: "upstream-bibcode-recorded-by-simbad",
    authorityScope: "upstream-publication-pointer-not-independent-row-extraction",
    bibcode,
  };
}

const registryIdentities = new Set();
for (const [key, source] of Object.entries(sourceRegistry)) {
  const identity = source.doi ? `doi:${source.doi.toLowerCase()}` : source.sourceUrl ? `url:${source.sourceUrl.toLowerCase()}` : `ref:${source.sourceRef}`;
  if (registryIdentities.has(identity)) throw new Error(`post-v593-stellar-duplicate-source:${key}`);
  registryIdentities.add(identity);
  if (/wikipedia/i.test(`${source.sourceRef} ${source.sourceUrl ?? ""}`)) {
    throw new Error(`post-v593-stellar-wikipedia-authority:${key}`);
  }
  if (!source.dataRelease || !source.license || !source.citationStatus || !source.authorityScope) {
    throw new Error(`post-v593-stellar-source-metadata:${key}`);
  }
}

const citation = (sourceKey, role = "field-authority") => {
  if (!sourceRegistry[sourceKey]) throw new Error(`post-v593-stellar-citation-source:${sourceKey}`);
  return { sourceKey, role };
};
const upstreamCitation = (bibcode) => bibcode ? citation(bibcodeKey(bibcode), "upstream-publication") : null;
const uncertainty = (status, value = null, unit = null, note = null) => ({ status, value, unit, note });
const field = ({
  sourceKey,
  status,
  authority,
  claim,
  value = null,
  unit = null,
  epoch = null,
  fieldUncertainty = uncertainty("not-provided"),
  citations = [citation(sourceKey)],
  measurementAdmitted = false,
  details = null,
}) => {
  const source = sourceRegistry[sourceKey];
  if (!source) throw new Error(`post-v593-stellar-source-key:${sourceKey}`);
  if (!FIELD_STATUSES.includes(status)) throw new Error(`post-v593-stellar-field-status:${status}`);
  if (!FIELD_AUTHORITIES.includes(authority)) throw new Error(`post-v593-stellar-field-authority:${authority}`);
  if (authority === "meta-resolver-basic-data" && sourceKey !== "simbad") {
    throw new Error(`post-v593-stellar-meta-resolver-source:${sourceKey}`);
  }
  if (sourceKey === "simbad" && measurementAdmitted) {
    throw new Error(`post-v593-stellar-simbad-measurement-admission:${claim}`);
  }
  if ((status === "unknown" || status === "search-not-found") && value !== null) {
    throw new Error(`post-v593-stellar-unknown-value:${claim}`);
  }
  if ((status === "unknown" || status === "search-not-found" || status === "presentation-only") && measurementAdmitted) {
    throw new Error(`post-v593-stellar-measurement-admission:${claim}`);
  }
  return {
    status,
    authority,
    claim,
    value,
    unit,
    epoch,
    uncertainty: fieldUncertainty,
    sourceKey,
    sourceRef: source.sourceRef,
    sourceUrl: source.sourceUrl,
    doi: source.doi,
    sourceVersion: source.dataRelease,
    license: source.license,
    citationStatus: source.citationStatus,
    citations,
    measurementAdmitted,
    details,
  };
};

const requiredFields = Object.freeze([
  "identity",
  "raDec",
  "epoch",
  "distance",
  "spectralType",
  "temperature",
  "logg",
  "radius",
  "luminosity",
  "rotation",
  "orientation",
  "variability",
  "companions",
]);

const presentationField = (hero, name, value, unit, claim = `${name}-v592-presentation-value`) => field({
  sourceKey: "v592-packet",
  status: "presentation-only",
  authority: "presentation-only",
  claim,
  value,
  unit,
  fieldUncertainty: uncertainty("unknown", null, unit, "v592 packet contains no cited measurement uncertainty"),
  measurementAdmitted: false,
  details: { presentationFallbackForHero: hero.id },
});

const searchNotFoundField = (name, sourceKeys, note) => field({
  sourceKey: "source-search-audit",
  status: "search-not-found",
  authority: "unknown",
  claim: `${name}-searched-not-found-for-this-hero`,
  value: null,
  unit: null,
  fieldUncertainty: uncertainty("unknown", null, null, note),
  citations: [citation("source-search-audit"), ...sourceKeys.map((key) => citation(key, "searched-source"))],
  measurementAdmitted: false,
  details: { searchOutcome: "not-found-not-confirmed-absent", note },
});

const primaryField = (sourceKey, name, entry, unit, measurementEpoch) => field({
  sourceKey,
  status: "direct",
  authority: "primary-literature",
  claim: `${name}-direct-primary-literature-scoped-model-value`,
  value: entry.value,
  unit,
  epoch: measurementEpoch,
  fieldUncertainty: uncertainty(entry.uncertainty === null ? "not-provided" : "direct", entry.uncertainty, unit),
  citations: [citation(sourceKey)],
  measurementAdmitted: true,
  details: { modelScopeMustBePreserved: true },
});

const heroes = packet.heroes.map((hero) => {
  const simbad = simbadById.get(hero.id);
  if (!simbad || simbad.queryStatus !== "resolved") throw new Error(`post-v593-stellar-simbad-resolution:${hero.id}`);
  const identityBound = simbad.resolutionClass !== "system-only-component-ambiguous";
  const primary = literatureById.get(hero.id) ?? null;
  const primarySourceKey = primary?.sourceKey ?? null;
  const primaryFields = primary?.fields ?? {};
  const coordinateCitation = upstreamCitation(simbad.coordinate?.bibcode);
  const parallaxCitation = upstreamCitation(simbad.parallax?.bibcode);
  const spectralCitation = upstreamCitation(simbad.spectralType?.bibcode);
  const validParallax = identityBound
    && Number.isFinite(simbad.parallax?.valueMas)
    && simbad.parallax.valueMas > 0
    && Number.isFinite(simbad.parallax?.errorMas)
    && simbad.parallax.errorMas >= 0;
  const distancePc = validParallax ? 1000 / simbad.parallax.valueMas : null;
  const distanceErrorPc = validParallax
    ? (1000 * simbad.parallax.errorMas) / (simbad.parallax.valueMas ** 2)
    : null;
  const variableIdentifiers = simbad.identifiers.filter((identifier) => identifier.startsWith("V* "));
  const multiplicityIdentifiers = simbad.identifiers.filter((identifier) => identifier.startsWith("WDS "));
  const multiplicityEvidence = multiplicityIdentifiers.length > 0 || ["SB*", "bC*"].includes(simbad.objectType);

  const fields = {
    identity: identityBound ? field({
      sourceKey: "simbad",
      status: "direct",
      authority: "meta-resolver-basic-data",
      claim: "identity-bound-simbad-exact-name-or-component-resolution",
      value: { mainId: simbad.mainId, queryId: simbad.queryId, identifiers: simbad.identifiers },
      unit: "identifier",
      fieldUncertainty: uncertainty("not-applicable", null, null, "direct resolver identity with exact named-star/component query"),
      measurementAdmitted: false,
      details: { resolutionClass: simbad.resolutionClass, gaiaRenderAnchorUsedForIdentity: false },
    }) : field({
      sourceKey: "simbad",
      status: "search-not-found",
      authority: "unknown",
      claim: "component-identity-search-resolved-system-only-not-component",
      value: null,
      unit: "identifier",
      fieldUncertainty: uncertainty("unknown", null, null, "system record exists but exact roster component was not independently resolved"),
      measurementAdmitted: false,
      details: { resolutionClass: simbad.resolutionClass, resolvedSystemMainId: simbad.mainId, gaiaRenderAnchorUsedForIdentity: false },
    }),
    raDec: identityBound ? field({
      sourceKey: "simbad",
      status: "direct",
      authority: "meta-resolver-basic-data",
      claim: "simbad-basic-data-icrs-coordinate",
      value: { raDeg: simbad.raDeg, decDeg: simbad.decDeg, frame: "ICRS" },
      unit: "deg",
      epoch: null,
      fieldUncertainty: uncertainty("direct", {
        majorMas: simbad.coordinate.errorMajorMas,
        minorMas: simbad.coordinate.errorMinorMas,
        angleDeg: simbad.coordinate.errorAngleDeg,
      }, "mas+deg"),
      citations: [citation("simbad"), ...(coordinateCitation ? [coordinateCitation] : [])],
      measurementAdmitted: false,
      details: { coordinateFrame: "ICRS", coordinateEpochKnown: false },
    }) : presentationField(hero, "raDec", { raDeg: hero.raDeg, decDeg: hero.decDeg }, "deg", "component-coordinate-presentation-fallback-system-only-resolution"),
    epoch: field({
      sourceKey: "simbad",
      status: "unknown",
      authority: "unknown",
      claim: "coordinate-epoch-not-exposed-by-sealed-simbad-basic-query",
      value: null,
      unit: null,
      epoch: null,
      fieldUncertainty: uncertainty("unknown", null, null, "ICRS is a reference frame and must not be substituted for an observation/reference epoch"),
      citations: [citation("simbad"), ...(coordinateCitation ? [coordinateCitation] : [])],
      measurementAdmitted: false,
    }),
    distance: validParallax ? field({
      sourceKey: "simbad",
      status: "derived",
      authority: "derived",
      claim: "inverse-positive-parallax-distance-no-bayesian-prior",
      value: distancePc,
      unit: "pc",
      epoch: null,
      fieldUncertainty: uncertainty("propagated-first-order", distanceErrorPc, "pc", "sigma_d=1000*sigma_parallax/parallax^2"),
      citations: [citation("simbad"), ...(parallaxCitation ? [parallaxCitation] : [])],
      measurementAdmitted: false,
      details: { parallaxMas: simbad.parallax.valueMas, parallaxErrorMas: simbad.parallax.errorMas },
    }) : searchNotFoundField("distance", ["hipparcos-new-reduction"], identityBound && simbad.parallax?.valueMas === 0
      ? "catalog returned zero parallax; zero is treated as invalid/missing, never as a physical measurement"
      : "exact component distance not independently resolved"),
    spectralType: identityBound && simbad.spectralType?.value ? field({
      sourceKey: "simbad",
      status: "direct",
      authority: "meta-resolver-basic-data",
      claim: "simbad-basic-data-spectral-type-with-upstream-bibcode",
      value: simbad.spectralType.value,
      unit: "MK-spectral-type",
      fieldUncertainty: uncertainty("not-provided", null, null, `SIMBAD quality=${simbad.spectralType.quality ?? "not-provided"}`),
      citations: [citation("simbad"), ...(spectralCitation ? [spectralCitation] : [])],
      measurementAdmitted: false,
      details: { quality: simbad.spectralType.quality, bibcode: simbad.spectralType.bibcode },
    }) : presentationField(hero, "spectralType", hero.spectralType, "MK-spectral-type", "component-spectral-type-presentation-fallback"),
    temperature: primaryFields.temperature
      ? primaryField(primarySourceKey, "temperature", primaryFields.temperature, "K", primary.measurementEpoch)
      : presentationField(hero, "temperature", hero.temperatureK, "K"),
    logg: primaryFields.logg
      ? primaryField(primarySourceKey, "logg", primaryFields.logg, "dex(cgs)", primary.measurementEpoch)
      : searchNotFoundField("logg", ["pastel-2020", "gaia-dr3-docs"], "no licensed, identity-bound per-star logg row was sealed in this intake"),
    radius: primaryFields.radius
      ? primaryField(primarySourceKey, "radius", primaryFields.radius, "solar-radius", primary.measurementEpoch)
      : field({
        sourceKey: "derived-v592",
        status: "derived",
        authority: "derived",
        claim: "derived-stefan-boltzmann-from-presentation-only-inputs",
        value: hero.radiusSolar,
        unit: "solar-radius",
        fieldUncertainty: uncertainty("unknown", null, "solar-radius", "input temperature/luminosity uncertainties were not recorded"),
        citations: [citation("derived-v592"), citation("v592-packet", "derivation-input")],
        measurementAdmitted: false,
        details: { derivationReproducible: true, inputAuthority: "presentation-only" },
      }),
    luminosity: primaryFields.luminosity
      ? primaryField(
        primarySourceKey,
        "luminosity",
        primaryFields.luminosity,
        hero.id === "achernar" && Number.isFinite(primaryFields.luminosity.value?.log10Solar)
          ? "log10-solar-luminosity"
          : "solar-luminosity",
        primary.measurementEpoch,
      )
      : presentationField(hero, "luminosity", hero.luminositySolar, "solar-luminosity"),
    rotation: primaryFields.rotation
      ? primaryField(primarySourceKey, "rotation", primaryFields.rotation, "mixed-see-value-keys", primary.measurementEpoch)
      : presentationField(hero, "rotation", { periodDays: hero.rotationPeriodDays }, "day", "rotation-period-v592-presentation-value"),
    orientation: primaryFields.orientation
      ? primaryField(primarySourceKey, "orientation", primaryFields.orientation, "deg", primary.measurementEpoch)
      : searchNotFoundField("orientation", ["jmmc-jsdc-v2", "glebocki-rotation"], "no primary interferometric inclination/pole solution admitted for this hero"),
    variability: variableIdentifiers.length > 0 ? field({
      sourceKey: "simbad",
      status: "direct",
      authority: "meta-resolver-basic-data",
      claim: "simbad-variable-star-identifier-present-classification-only",
      value: { variableIdentifiers, objectType: simbad.objectType },
      unit: "catalog-designation",
      fieldUncertainty: uncertainty("not-applicable", null, null, "classification evidence; no amplitude or period inferred"),
      measurementAdmitted: false,
      details: { amplitudeKnown: false, variabilityFalseClaimed: false },
    }) : searchNotFoundField("variability", ["gcvs-5-1", "aavso-vsx"], "no identity-bound GCVS/VSX row was sealed; absence is not a non-variable claim"),
    companions: multiplicityEvidence ? field({
      sourceKey: "simbad",
      status: "direct",
      authority: "meta-resolver-basic-data",
      claim: "catalog-multiplicity-evidence-present-no-orbit-claim",
      value: { objectType: simbad.objectType, wdsIdentifiers: multiplicityIdentifiers },
      unit: "catalog-identifiers",
      fieldUncertainty: uncertainty("not-applicable", null, null, "multiplicity existence only; visual companion layout remains presentation-only"),
      citations: [citation("simbad"), citation("usno-wds", "catalog-context"), citation("sb9", "catalog-context")],
      measurementAdmitted: false,
      details: { packetCompanionIdsPresentationOnly: hero.companions, noCompanionFalseClaimed: false },
    }) : searchNotFoundField("companions", ["usno-wds", "sb9"], "no sealed multiplicity row; empty packet list is not evidence of singleness"),
    photometry: field({
      sourceKey: "v592-packet",
      status: "presentation-only",
      authority: "catalog-anchor",
      claim: "gaia-render-anchor-photometry-not-named-star-identity-photometry",
      value: { gMagnitude: hero.gaiaAnchorMagnitudeG, bpRp: hero.colorBpRp },
      unit: "mag",
      fieldUncertainty: uncertainty("unknown", null, "mag", "anchor photometric uncertainty not recorded"),
      citations: [citation("v592-packet"), citation("gaia-dr3-docs", "catalog-context")],
      measurementAdmitted: false,
      details: { gaiaSourceId: hero.gaiaSourceId, anchorAngularDistanceDeg: hero.gaiaAnchorAngularDistanceDeg, identityClaim: false },
    }),
    photosphere: field({
      sourceKey: "presentation-contract",
      status: "presentation-only",
      authority: "presentation-only",
      claim: "physics-generated-presentation-model-not-observation-texture",
      value: hero.shaderProfile,
      unit: null,
      fieldUncertainty: uncertainty("not-applicable", null, null, "presentation model is not a measurement"),
      measurementAdmitted: false,
    }),
  };

  const schemaComplete = requiredFields.every((name) => {
    const item = fields[name];
    return item
      && FIELD_STATUSES.includes(item.status)
      && Object.hasOwn(item, "value")
      && Object.hasOwn(item, "unit")
      && Object.hasOwn(item, "epoch")
      && item.uncertainty
      && item.citations.length > 0;
  });
  if (!schemaComplete) throw new Error(`post-v593-stellar-schema-incomplete:${hero.id}`);
  const measurementAdmitted = identityBound && requiredFields.every((name) => fields[name].measurementAdmitted === true);
  const blockingReasons = [
    ...(identityBound ? [] : ["identity-component-ambiguous-system-only-resolution"]),
    ...requiredFields.filter((name) => fields[name].measurementAdmitted !== true).map((name) => `required-field-not-measurement-admitted:${name}:${fields[name].status}`),
  ];

  return {
    id: hero.id,
    name: hero.name,
    identityStatus: identityBound ? "identity-bound" : "render-anchor-only",
    identityBinding: {
      method: identityBound ? "simbad-exact-name-or-component-resolution" : "blocked-system-only-component-ambiguous",
      confidence: identityBound ? "high" : "insufficient-component-specific",
      resolvedMainId: simbad.mainId,
      queryId: simbad.queryId,
      gaiaRenderAnchorUsedForIdentity: false,
    },
    gaiaSourceId: hero.gaiaSourceId,
    gaiaAnchorAngularDistanceDeg: hero.gaiaAnchorAngularDistanceDeg,
    fields,
    schemaAdmission: "schema-complete",
    measurementAdmission: measurementAdmitted ? "measurement-admitted" : "blocked-incomplete-measurement-provenance",
    presentationOnly: true,
    scientificPayloadWriteback: false,
    presentationAdmission: "presentation-only-allowed",
    provenanceAdmission: measurementAdmitted ? "admitted" : "blocked-incomplete-field-provenance",
    blockingReasons,
  };
});

const fieldUseBySource = new Map();
const recordFieldUse = (sourceKey, heroId, fieldName, role) => {
  if (!sourceRegistry[sourceKey]) {
    throw new Error(`post-v593-stellar-reverse-registry-source:${sourceKey}`);
  }
  const use = fieldUseBySource.get(sourceKey) ?? {
    referenceCount: 0,
    heroIds: new Set(),
    fieldNames: new Set(),
    roles: new Set(),
  };
  use.referenceCount += 1;
  use.heroIds.add(heroId);
  use.fieldNames.add(fieldName);
  use.roles.add(role);
  fieldUseBySource.set(sourceKey, use);
};
for (const hero of heroes) {
  for (const [fieldName, entry] of Object.entries(hero.fields)) {
    recordFieldUse(entry.sourceKey, hero.id, fieldName, "field-source");
    for (const citationEntry of entry.citations) {
      recordFieldUse(citationEntry.sourceKey, hero.id, fieldName, citationEntry.role);
    }
  }
}

const removedUnusedAdsSourceKeys = [];
for (const sourceKey of Object.keys(sourceRegistry)) {
  if (sourceKey.startsWith("ads-") && !fieldUseBySource.has(sourceKey)) {
    delete sourceRegistry[sourceKey];
    removedUnusedAdsSourceKeys.push(sourceKey);
  }
}

const explicitRegistryUse = {
  simbad: [{
    kind: "resolver-policy",
    scope: "name-resolution-cross-identification-and-basic-data-with-upstream-bibcodes-not-catalogue-or-measurement-authority",
  }],
  "source-search-audit": [{
    kind: "search-policy",
    ledgerPath: exaSearchLedgerPath,
    ledgerSha256: exaSearchLedger.ledgerSha256,
  }],
  "vizier-usage": [{
    kind: "license-policy",
    appliesToSourceKeys: [
      "glebocki-rotation",
      "hipparcos-new-reduction",
      "jmmc-jsdc-v2",
      "pastel-2020",
    ],
  }],
  "derived-v592": [{
    kind: "derivation",
    scope: "deterministic-stefan-boltzmann-presentation-input-derivation",
  }],
  "presentation-contract": [{
    kind: "presentation-policy",
    scope: "physics-generated-render-model-not-observation-texture",
  }],
};
for (const [sourceKey, source] of Object.entries(sourceRegistry)) {
  const fieldUse = fieldUseBySource.get(sourceKey);
  source.registryUse = [
    ...(fieldUse ? [{
      kind: "field-reference",
      referenceCount: fieldUse.referenceCount,
      heroIds: [...fieldUse.heroIds].sort(),
      fieldNames: [...fieldUse.fieldNames].sort(),
      roles: [...fieldUse.roles].sort(),
    }] : []),
    ...(explicitRegistryUse[sourceKey] ?? []),
  ];
  if (source.registryUse.length === 0) {
    throw new Error(`post-v593-stellar-unused-registry-source:${sourceKey}`);
  }
}
const registryUseAudit = {
  sourceCount: Object.keys(sourceRegistry).length,
  sourcesWithUseCount: Object.values(sourceRegistry).filter((source) => source.registryUse.length > 0).length,
  removedUnusedAdsSourceCount: removedUnusedAdsSourceKeys.length,
  removedUnusedAdsSourceKeys: removedUnusedAdsSourceKeys.sort(),
  unusedSourceCount: Object.values(sourceRegistry).filter((source) => source.registryUse.length === 0).length,
};

const fieldCoverage = Object.fromEntries(requiredFields.map((name) => [
  name,
  Object.fromEntries(FIELD_STATUSES.map((status) => [status, heroes.filter((hero) => hero.fields[name].status === status).length])),
]));
const requiredFieldStatusCounts = Object.fromEntries(FIELD_STATUSES.map((status) => [
  status,
  heroes.reduce((count, hero) => count + requiredFields.filter((name) => hero.fields[name].status === status).length, 0),
]));

const manifestUnsigned = {
  version: "post-v593-stellar-provenance-candidate-v1",
  provenanceSchemaVersion: "post-v593-stellar-field-provenance-v2",
  generatedAt,
  status: "24-hero-schema-complete-measurement-admission-blocked-honest-unknowns",
  source: {
    packetPath,
    packetSha256: packet.packetSha256,
    packetVersion: packet.version,
    simbadSnapshotPath,
    simbadSnapshotSha256: simbadSnapshot.snapshotSha256,
    literatureSnapshotPath,
    literatureSnapshotSha256: literatureSnapshot.snapshotSha256,
    exaSearchLedgerPath,
    exaSearchLedgerSha256: exaSearchLedger.ledgerSha256,
  },
  sourceRegistry,
  sourceRegistrySha256: canonicalSha(sourceRegistry),
  registryUseAudit,
  searchAudit: literatureSnapshot.searchAudit,
  policy: {
    firstRosterCount: 24,
    renderAnchorIdentityClaimAllowed: false,
    simbadSystemResolutionMayNotBindComponentIdentity: true,
    simbadIsMetaResolverNotCatalogue: true,
    simbadBasicDataMeasurementAdmissionAllowed: false,
    upstreamBibcodeIsNotIndependentMeasurementAdmission: true,
    schemaCompleteDoesNotImplyMeasurementAdmission: true,
    unknownFieldsBlockMeasurementAdmission: true,
    unknownAndSearchNotFoundAreNotZeroOrFalse: true,
    zeroParallaxIsNotPhysicalDistance: true,
    presentationOnly: true,
    scientificPayloadWriteback: false,
    observationTextureClaim: false,
    simbadCatalogueAuthorityGranted: false,
    simbadMeasurementAuthorityGranted: false,
    remotePsfRemainsPointLike: true,
    noRandomTwinkle: true,
  },
  fieldStatuses: FIELD_STATUSES,
  requiredFields,
  heroes,
  coverage: {
    requiredFieldStatusCounts,
    fields: fieldCoverage,
  },
  admission: {
    rosterCount: heroes.length,
    schemaCompleteCount: heroes.filter((hero) => hero.schemaAdmission === "schema-complete").length,
    identityBoundCount: heroes.filter((hero) => hero.identityStatus === "identity-bound").length,
    renderAnchorOnlyCount: heroes.filter((hero) => hero.identityStatus === "render-anchor-only").length,
    measurementAdmittedCount: heroes.filter((hero) => hero.measurementAdmission === "measurement-admitted").length,
    provenanceAdmittedCount: heroes.filter((hero) => hero.provenanceAdmission === "admitted").length,
    presentationAdmittedCount: heroes.filter((hero) => hero.presentationAdmission === "presentation-only-allowed").length,
    status: "schema-complete-measurement-admission-blocked",
  },
  authority: {
    scientificPayloadWriteback: false,
    scientificAuthorityChanged: false,
    measuredAuthorityGranted: false,
    gpuAuthorityGranted: false,
    observationTextureClaim: false,
  },
};
const manifest = { ...manifestUnsigned, manifestSha256: canonicalSha(manifestUnsigned) };
writeJson(manifestPath, manifest);

const generatedText = `// Generated by scripts/build-post-v593-stellar-provenance.mjs. Do not edit.\n` +
  `export const STELLAR_PROVENANCE_CANDIDATE_SHA256 = ${JSON.stringify(manifest.manifestSha256)} as const;\n` +
  `export const STELLAR_PROVENANCE_CANDIDATE = Object.freeze(${JSON.stringify(manifest, null, 2)} as const);\n`;
const generatedAbsolutePath = resolve(root, generatedPath);
mkdirSync(dirname(generatedAbsolutePath), { recursive: true });
writeFileSync(generatedAbsolutePath, generatedText, "utf8");

const receiptUnsigned = {
  version: "post-v593-stellar-provenance-receipt-v1",
  provenanceSchemaVersion: manifest.provenanceSchemaVersion,
  generatedAt,
  status: manifest.status,
  manifestPath,
  manifestSha256: manifest.manifestSha256,
  sourceRegistrySha256: canonicalSha(sourceRegistry),
  generatedModulePath: generatedPath,
  generatedModuleSha256: sha256(Buffer.from(generatedText, "utf8")),
  source: manifest.source,
  searchAudit: manifest.searchAudit,
  registryUseAudit: manifest.registryUseAudit,
  coverage: manifest.coverage,
  admission: manifest.admission,
  authority: manifest.authority,
  formalProductPointer: "v263",
  productionReleaseAuthorized: false,
};
const receipt = { ...receiptUnsigned, receiptSha256: canonicalSha(receiptUnsigned) };
writeJson(receiptPath, receipt);

console.log(JSON.stringify({
  status: manifest.status,
  rosterCount: manifest.admission.rosterCount,
  schemaCompleteCount: manifest.admission.schemaCompleteCount,
  identityBoundCount: manifest.admission.identityBoundCount,
  renderAnchorOnlyCount: manifest.admission.renderAnchorOnlyCount,
  measurementAdmittedCount: manifest.admission.measurementAdmittedCount,
  provenanceAdmittedCount: manifest.admission.provenanceAdmittedCount,
  sourcesReviewed: manifest.searchAudit.sourcesReviewed,
  uniqueAdmittedSources: manifest.searchAudit.uniqueAdmittedSources,
  manifestSha256: manifest.manifestSha256,
  receiptSha256: receipt.receiptSha256,
}, null, 2));
