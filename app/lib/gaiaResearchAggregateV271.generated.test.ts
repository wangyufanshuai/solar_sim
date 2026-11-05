import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { POST as scienceWorkbenchPost } from "../api/atlas/science-workbench/route";
import { resetAtlasApiRateLimitsForTestsV270 } from "./atlasApiRateLimitV270";
import { disposeGaiaResearchQueryServiceV271ForTests } from "./gaiaResearchQueryServiceV271";
import {
  GAIA_RESEARCH_RESPONSE_MAX_BYTES,
  serializeGaiaResearchExportV271,
  type GaiaResearchResponseV271,
} from "./gaiaResearchWorkbenchV271";

type Manifest = {
  version: string;
  generatedAt: string;
  manifestSha256: string;
  scienceSource: { path: string; bytes: number; sha256: string };
  motherCatalog: { path: string; bytes: number; sha256: string; rows: number };
  aggregate: { path: string; bytes: number; sha256: string };
  counts: Record<string, number>;
  dependencies: { astropyHealpix: string };
};

const PROFILE = "NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE";
const originalProfile = process.env[PROFILE];
const sha256 = (value: Buffer | string) => createHash("sha256").update(value).digest("hex");
const canonicalize = (value: unknown): unknown => Array.isArray(value)
  ? value.map(canonicalize)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]))
    : value;

async function post(body: unknown): Promise<{ response: Response; payload: GaiaResearchResponseV271 & { error?: string } }> {
  const response = await scienceWorkbenchPost(new Request("http://atlas.test/api/atlas/science-workbench", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "127.0.0.71" },
    body: JSON.stringify(body),
  }));
  return { response, payload: await response.json() as GaiaResearchResponseV271 & { error?: string } };
}

beforeAll(() => {
  process.env[PROFILE] = "standalone-full";
});

afterEach(() => {
  resetAtlasApiRateLimitsForTestsV270();
});

afterAll(async () => {
  await disposeGaiaResearchQueryServiceV271ForTests();
  if (originalProfile === undefined) delete process.env[PROFILE];
  else process.env[PROFILE] = originalProfile;
});

describe("generated v271 Gaia research aggregate", () => {
  it("binds frozen inputs, the content-addressed SQLite and canonical manifest", () => {
    const manifest = JSON.parse(readFileSync("dist/gaia-research-v271/gaia-research-v271.manifest.json", "utf8")) as Manifest;
    const manifestSha256 = manifest.manifestSha256;
    const canonical = { ...manifest } as Partial<Manifest>;
    delete canonical.generatedAt;
    delete canonical.manifestSha256;
    expect(manifest.version).toBe("v271-gaia-research-aggregate-v2");
    expect(manifest.dependencies.astropyHealpix).toBe("1.1.2");
    expect(manifestSha256).toBe(sha256(JSON.stringify(canonicalize(canonical))));
    for (const source of [manifest.scienceSource, manifest.motherCatalog, manifest.aggregate]) {
      const bytes = readFileSync(source.path);
      expect(bytes.byteLength).toBe(source.bytes);
      expect(sha256(bytes)).toBe(source.sha256);
    }
    expect(manifest.counts).toMatchObject({
      scienceRows: 200000,
      skyOrder3Rows: 200000,
      skyOrder5Rows: 200000,
      motherEligibleRows: 1066208,
      motherGaiaEligibleRows: 1047028,
      motherWithoutGaiaIdRows: 19180,
      selectionEligibleRows: 199957,
      hrEligibleRows: 159330,
      gold: 30028,
      silver: 169972,
      limited: 0,
      astrophysicalOverlapRows: 51145,
    });
  });

  it("serves overview, HEALPix, HR and both selection denominators within the response cap", async () => {
    const overview = await post({ kind: "overview" });
    expect(overview.response.status).toBe(200);
    expect(overview.payload.payload).toMatchObject({
      kind: "overview",
      frozenRows: 200000,
      selectionDomainRows: 199957,
      motherPopulations: { "v7-presentation": 1066208, "v7-gaia-id": 1047028 },
      hrEligibleRows: 159330,
      astrophysicalOverlapRows: 51145,
      gaiaSurveyCompleteness: "unavailable",
    });

    const sky = await post({ kind: "healpix-density", order: 3 });
    expect(sky.response.status).toBe(200);
    expect(sky.payload.payload.kind).toBe("healpix-density");
    if (sky.payload.payload.kind !== "healpix-density") throw new Error("unexpected payload");
    expect(sky.payload.payload.cells.reduce((sum, cell) => sum + cell.count, 0)).toBe(200000);

    const hr = await post({ kind: "hr-density", bins: 64 });
    expect(hr.response.status).toBe(200);
    expect(hr.payload.payload.kind).toBe("hr-density");

    const gaia = await post({ kind: "selection", order: 3 });
    const presentation = await post({ kind: "selection", order: 3, population: "v7-presentation" });
    expect(gaia.payload.payload).toMatchObject({ kind: "selection", selected: 199957, mother: 1047028 });
    expect(presentation.payload.payload).toMatchObject({ kind: "selection", selected: 199957, mother: 1066208 });
    for (const result of [overview, sky, hr, gaia, presentation]) {
      expect(Number(result.response.headers.get("content-length") ?? JSON.stringify(result.payload).length)).toBeLessThanOrEqual(GAIA_RESEARCH_RESPONSE_MAX_BYTES);
      expect(result.payload).toMatchObject({
        canonical: true,
        boundary: "frozen-derived-analysis-not-gaia-survey-completeness-or-physics",
      });
      expect(result.payload.provenance.units).toMatchObject({ magnitude: "Gaia G mag", color: "Gaia BP-RP mag" });
    }
  }, 20_000);

  it("rejects unsupported fields and keeps Lite explicitly unavailable without local paths", async () => {
    const injected = await post({ kind: "selection", order: 3, filters: { sql: "SELECT * FROM private" } });
    expect(injected.response.status).toBe(400);
    expect(JSON.stringify(injected.payload)).not.toMatch(/[A-Z]:[\\/]/i);
    process.env[PROFILE] = "vercel-lite";
    const lite = await post({ kind: "overview" });
    expect(lite.response.status).toBe(404);
    expect(lite.payload).toMatchObject({ error: "Gaia Research Workbench is unavailable in Lite" });
    expect(JSON.stringify(lite.payload)).not.toMatch(/[A-Z]:[\\/]/i);
    process.env[PROFILE] = "standalone-full";
  });

  it("exports provenance-rich JSON and CSV with units and completeness boundaries", async () => {
    const result = await post({ kind: "overview" });
    const json = serializeGaiaResearchExportV271(result.payload, "json");
    const csv = serializeGaiaResearchExportV271(result.payload, "csv");
    expect(JSON.parse(json.content)).toMatchObject({ canonical: true, provenance: { manifestSha256: result.payload.provenance.manifestSha256 } });
    expect(csv.content).toContain(`# manifest_sha256=${result.payload.provenance.manifestSha256}`);
    expect(csv.content).toContain("# units=");
    expect(csv.content).toContain("# gaia_survey_completeness=unavailable");
    expect(csv.content).toContain("# boundary=frozen-derived-analysis-not-gaia-survey-completeness-or-physics");
  });
});
