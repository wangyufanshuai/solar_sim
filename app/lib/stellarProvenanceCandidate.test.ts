import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import {
  STELLAR_PROVENANCE_CANDIDATE,
  STELLAR_PROVENANCE_HERO_IDS_V1,
  STELLAR_PROVENANCE_SOURCE_REGISTRY_V1,
  getStellarProvenanceHeroV1,
  isStellarHeroIdentityBoundV1,
  summarizeStellarProvenanceCandidateV1,
  validateStellarProvenanceCandidateV1,
} from "./stellarProvenanceCandidate";
import { STELLAR_HERO_IDS_V592 } from "./stellarHeroesV592";

describe("post-v593 stellar provenance candidate", () => {
  const canonicalize = (value: unknown): unknown => Array.isArray(value)
    ? value.map(canonicalize)
    : value && typeof value === "object"
      ? Object.fromEntries(Object.keys(value as Record<string, unknown>).sort().map((key) => [
          key,
          canonicalize((value as Record<string, unknown>)[key]),
        ]))
      : value;
  const canonicalSha = (value: unknown) => createHash("sha256").update(JSON.stringify(canonicalize(value)), "utf8").digest("hex");

  it("separates 24/24 schema completeness from fail-closed measurement admission", () => {
    expect(() => validateStellarProvenanceCandidateV1()).not.toThrow();
    const summary = summarizeStellarProvenanceCandidateV1();
    expect(summary.rosterCount).toBe(24);
    expect(summary.identityBoundCount).toBe(20);
    expect(summary.renderAnchorOnlyCount).toBe(4);
    expect(summary.schemaCompleteCount).toBe(24);
    expect(summary.measurementAdmittedCount).toBe(0);
    expect(summary.provenanceAdmittedCount).toBe(0);
    expect(summary.presentationAdmittedCount).toBe(24);
    expect(summary.unknownOrSearchNotFoundRequiredFieldCount).toBeGreaterThan(0);
    expect(summary.scientificPayloadWriteback).toBe(false);
    expect(summary.measuredAuthorityGranted).toBe(false);
    expect(summary.productionReleaseAuthorized).toBe(false);
  });

  it("binds exact SIMBAD resolutions but keeps component-ambiguous systems fail-closed", () => {
    expect(isStellarHeroIdentityBoundV1("alpha-centauri-a")).toBe(true);
    expect(isStellarHeroIdentityBoundV1("sirius-a")).toBe(true);
    expect(getStellarProvenanceHeroV1("sirius-a").fields.identity.claim).toBe(
      "identity-bound-simbad-exact-name-or-component-resolution",
    );
    expect(
      STELLAR_PROVENANCE_CANDIDATE.heroes
        .filter((hero) => hero.identityStatus === "render-anchor-only")
        .map((hero) => hero.id),
    ).toEqual(["capella-a", "spica", "regulus", "polaris"]);
    for (const id of ["capella-a", "spica", "regulus", "polaris"] as const) {
      const hero = getStellarProvenanceHeroV1(id);
      expect(hero.fields.identity.status).toBe("search-not-found");
      expect(hero.fields.identity.value).toBeNull();
      expect(hero.identityBinding.gaiaRenderAnchorUsedForIdentity).toBe(false);
    }
    expect(STELLAR_PROVENANCE_HERO_IDS_V1).toHaveLength(24);
    expect([...STELLAR_PROVENANCE_HERO_IDS_V1]).toEqual([...STELLAR_HERO_IDS_V592]);
  });

  it("requires status, value semantics, uncertainty, unit/epoch and citations on every field", () => {
    const allowedStatuses = new Set([
      "direct",
      "derived",
      "estimated",
      "presentation-only",
      "unknown",
      "search-not-found",
    ]);
    for (const hero of STELLAR_PROVENANCE_CANDIDATE.heroes) {
      expect(hero.schemaAdmission).toBe("schema-complete");
      expect(hero.measurementAdmission).toBe("blocked-incomplete-measurement-provenance");
      for (const requiredField of STELLAR_PROVENANCE_CANDIDATE.requiredFields) {
        expect(hero.fields[requiredField]).toBeTruthy();
      }
      for (const field of Object.values(hero.fields)) {
        expect(allowedStatuses.has(field.status)).toBe(true);
        expect(Object.hasOwn(field, "value")).toBe(true);
        expect(Object.hasOwn(field, "unit")).toBe(true);
        expect(Object.hasOwn(field, "epoch")).toBe(true);
        expect(field.uncertainty).toBeTruthy();
        expect(field.citations.length).toBeGreaterThan(0);
        expect(field.sourceRef).toBeTruthy();
        expect(field.sourceKey).toBeTruthy();
        expect(field.sourceVersion).toBeTruthy();
        expect(field.license).toBeTruthy();
        expect(field.citationStatus).toBeTruthy();
        expect(STELLAR_PROVENANCE_SOURCE_REGISTRY_V1[field.sourceKey]).toBeTruthy();
        for (const citation of field.citations) {
          expect(STELLAR_PROVENANCE_SOURCE_REGISTRY_V1[citation.sourceKey]).toBeTruthy();
        }
        if (field.status === "unknown" || field.status === "search-not-found") {
          expect(field.value).toBeNull();
          expect(field.measurementAdmitted).toBe(false);
        }
      }
      expect(hero.provenanceAdmission).toBe("blocked-incomplete-field-provenance");
      expect(hero.presentationAdmission).toBe("presentation-only-allowed");
    }
    expect(STELLAR_PROVENANCE_SOURCE_REGISTRY_V1["gaia-dr3-docs"].doi).toBe(
      "10.1051/0004-6361/202243940",
    );
    expect(STELLAR_PROVENANCE_SOURCE_REGISTRY_V1["simbad"].sourceUrl).toContain("simbad");
  });

  it("keeps catalog zero distinct from unknown and never derives an infinite Acrux distance", () => {
    const acrux = getStellarProvenanceHeroV1("acrux");
    expect(acrux.fields.distance.status).toBe("search-not-found");
    expect(acrux.fields.distance.value).toBeNull();
    expect(acrux.fields.distance.uncertainty.note).toContain("zero");
    expect(JSON.stringify(acrux.fields.distance)).not.toContain("Infinity");
    expect(STELLAR_PROVENANCE_CANDIDATE.policy.zeroParallaxIsNotPhysicalDistance).toBe(true);
    expect(STELLAR_PROVENANCE_CANDIDATE.policy.unknownAndSearchNotFoundAreNotZeroOrFalse).toBe(true);
  });

  it("admits only scoped primary-paper fields for the four reviewed rapid rotators", () => {
    expect(getStellarProvenanceHeroV1("vega").fields.orientation).toMatchObject({
      status: "direct",
      sourceKey: "vega-monnier-2012",
      measurementAdmitted: true,
      value: { inclinationDeg: 6.2 },
    });
    expect(getStellarProvenanceHeroV1("altair").fields.radius).toMatchObject({
      status: "direct",
      sourceKey: "altair-monnier-2007",
      value: { equatorialPolarRatio: 1.241738 },
    });
    expect(getStellarProvenanceHeroV1("achernar").fields.logg).toMatchObject({
      status: "direct",
      sourceKey: "achernar-domiciano-2014",
      value: { polarDexCgs: 3.561, equatorialDexCgs: 2.772 },
    });
    expect(getStellarProvenanceHeroV1("achernar").fields.luminosity).toMatchObject({
      status: "direct",
      sourceKey: "achernar-domiciano-2014",
      unit: "log10-solar-luminosity",
      value: { log10Solar: 3.48 },
    });
    expect(Object.keys(
      getStellarProvenanceHeroV1("achernar").fields.luminosity.value as Record<string, unknown>,
    )).toEqual(["log10Solar"]);
    expect(getStellarProvenanceHeroV1("regulus").fields.orientation).toMatchObject({
      status: "direct",
      sourceKey: "regulus-mcalister-2005",
      value: { inclinationDeg: { lower: 78, upper: 90 } },
    });
  });

  it("seals source versions/licenses, rejects unused registry rows, and keeps SIMBAD non-catalog/non-measured", () => {
    const identities = Object.values(STELLAR_PROVENANCE_SOURCE_REGISTRY_V1).map((source) =>
      source.doi
        ? `doi:${source.doi.toLowerCase()}`
        : source.sourceUrl
          ? `url:${source.sourceUrl.toLowerCase()}`
          : `ref:${source.sourceRef}`,
    );
    expect(new Set(identities).size).toBe(identities.length);
    for (const source of Object.values(STELLAR_PROVENANCE_SOURCE_REGISTRY_V1)) {
      expect(source.dataRelease).toBeTruthy();
      expect(source.license).toBeTruthy();
      expect(source.authorityScope).toBeTruthy();
      expect(source.registryUse.length).toBeGreaterThan(0);
      expect(`${source.sourceRef} ${source.sourceUrl ?? ""}`).not.toMatch(/wikipedia/i);
    }
    const allFields = STELLAR_PROVENANCE_CANDIDATE.heroes.flatMap((hero) =>
      Object.values(hero.fields),
    );
    const simbadFields = allFields.filter((field) => field.sourceKey === "simbad");
    expect(simbadFields.length).toBeGreaterThan(0);
    expect(simbadFields.every((field) => field.measurementAdmitted === false)).toBe(true);
    expect(
      simbadFields
        .filter((field) => field.status === "direct")
        .every((field) => field.authority === "meta-resolver-basic-data"),
    ).toBe(true);
    expect(allFields.some((field) => String(field.authority) === "catalog")).toBe(false);

    const referencedSourceKeys = new Set(
      STELLAR_PROVENANCE_CANDIDATE.heroes.flatMap((hero) =>
        Object.values(hero.fields).flatMap((field) => [
          field.sourceKey,
          ...field.citations.map((citation) => citation.sourceKey),
        ]),
      ),
    );
    const explicitUseKinds = new Set([
      "derivation",
      "license-policy",
      "presentation-policy",
      "resolver-policy",
      "search-policy",
    ]);
    for (const [sourceKey, source] of Object.entries(STELLAR_PROVENANCE_SOURCE_REGISTRY_V1)) {
      expect(
        referencedSourceKeys.has(sourceKey)
          || source.registryUse.some((use) => explicitUseKinds.has(use.kind)),
      ).toBe(true);
    }
    expect(STELLAR_PROVENANCE_SOURCE_REGISTRY_V1["vizier-usage"].registryUse)
      .toContainEqual(expect.objectContaining({ kind: "license-policy" }));
    expect(STELLAR_PROVENANCE_SOURCE_REGISTRY_V1).not.toHaveProperty(
      "ads-1953apj-117-313j",
    );
    expect(STELLAR_PROVENANCE_SOURCE_REGISTRY_V1).not.toHaveProperty(
      "ads-1993aspc-45-59l",
    );
    expect(STELLAR_PROVENANCE_CANDIDATE.registryUseAudit).toMatchObject({
      removedUnusedAdsSourceCount: 2,
      unusedSourceCount: 0,
    });
  });

  it("recomputes the sealed Exa replay ledger instead of trusting the historical aggregate", () => {
    const audit = STELLAR_PROVENANCE_CANDIDATE.searchAudit;
    const ledger = JSON.parse(readFileSync(audit.ledgerPath, "utf8"));
    const unsignedLedger = { ...ledger };
    delete unsignedLedger.ledgerSha256;
    expect(ledger.ledgerSha256).toBe(canonicalSha(unsignedLedger));
    expect(ledger.ledgerSha256).toBe(audit.ledgerSha256);
    expect(ledger.historicalAggregate).toMatchObject({
      status: "unverifiable-historical-aggregate",
      reportedSourcesReviewed: 259,
      authority: "historical-note-only-not-used-by-builder",
    });

    const firstByUrl = new Map<string, string>();
    let sourcesReviewed = 0;
    let returnedResultSlots = 0;
    for (const query of ledger.queries) {
      sourcesReviewed += query.requestedNumResults;
      expect(query.returnedResultSlots).toBe(query.results.length);
      returnedResultSlots += query.results.length;
      query.results.forEach((row: Record<string, unknown>, index: number) => {
        const slotId = `${query.id}:r${String(index + 1).padStart(2, "0")}`;
        const normalizedUrl = String(row.normalizedUrl);
        expect(row.slotId).toBe(slotId);
        expect(row.title).toBeTruthy();
        expect(row.url).toBeTruthy();
        expect(row.sourceClass).toBeTruthy();
        expect(row.keepDropReason).toBeTruthy();
        expect(row.dedupeTargetSlotId).toBe(firstByUrl.get(normalizedUrl) ?? slotId);
        if (!firstByUrl.has(normalizedUrl)) firstByUrl.set(normalizedUrl, slotId);
      });
    }
    expect(sourcesReviewed).toBe(130);
    expect(returnedResultSlots).toBe(130);
    expect(firstByUrl.size).toBe(101);
    expect(ledger.admittedSources).toHaveLength(15);
    expect(audit).toMatchObject({
      provider: "Exa",
      queryCount: ledger.queries.length,
      sourcesReviewed,
      returnedResultSlots,
      uniqueNormalizedUrls: firstByUrl.size,
      duplicateResultSlots: returnedResultSlots - firstByUrl.size,
      uniqueAdmittedSources: ledger.admittedSources.length,
      historicalAggregateStatus: "unverifiable-historical-aggregate",
    });
  });

  it("seals the generated manifest and receipt independently", () => {
    const manifest = JSON.parse(readFileSync("public/data/post-v593-stellar-relativity/stellar-provenance-v1.json", "utf8"));
    const receipt = JSON.parse(readFileSync("docs/release/post-v593/stellar-provenance-receipt-v1.json", "utf8"));
    const unsignedManifest = { ...manifest };
    delete unsignedManifest.manifestSha256;
    const unsignedReceipt = { ...receipt };
    delete unsignedReceipt.receiptSha256;
    expect(manifest.manifestSha256).toBe(canonicalSha(unsignedManifest));
    expect(receipt.receiptSha256).toBe(canonicalSha(unsignedReceipt));
    expect(receipt.manifestSha256).toBe(manifest.manifestSha256);
    expect(manifest.sourceRegistrySha256).toBe(canonicalSha(manifest.sourceRegistry));
    expect(receipt.sourceRegistrySha256).toBe(manifest.sourceRegistrySha256);
    for (const snapshotPath of [manifest.source.simbadSnapshotPath, manifest.source.literatureSnapshotPath]) {
      const snapshot = JSON.parse(readFileSync(snapshotPath, "utf8"));
      const unsignedSnapshot = { ...snapshot };
      delete unsignedSnapshot.snapshotSha256;
      expect(snapshot.snapshotSha256).toBe(canonicalSha(unsignedSnapshot));
    }
    const ledger = JSON.parse(readFileSync(manifest.source.exaSearchLedgerPath, "utf8"));
    const unsignedLedger = { ...ledger };
    delete unsignedLedger.ledgerSha256;
    expect(ledger.ledgerSha256).toBe(canonicalSha(unsignedLedger));
    expect(ledger.ledgerSha256).toBe(manifest.source.exaSearchLedgerSha256);
  });
});
