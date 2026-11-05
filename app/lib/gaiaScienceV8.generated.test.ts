import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import {
  gaiaScienceRecordFromDatabaseRowV8,
  reconstructGaiaAstrometricCovarianceV1,
} from "./gaiaScienceV8";

const databasePath = resolve(process.cwd(), "dist/gaia-science-v8/gaia-science-v8.sqlite");
const manifestPath = resolve(process.cwd(), "dist/gaia-science-v8/gaia-science-v8.manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
  rowCount: number;
  validCandidateCount: number;
  qualityCounts: Record<string, number>;
  output: { bytes: number; sha256: string };
  motherCatalog: { sha256: string; rowCount: number };
};

describe("generated v259 Gaia science subset", () => {
  it("freezes exactly 200k unique rows against the V7 mother SHA", () => {
    expect(manifest.rowCount).toBe(200_000);
    expect(manifest.validCandidateCount).toBeGreaterThanOrEqual(200_000);
    expect(manifest.motherCatalog).toMatchObject({
      rowCount: 1_224_219,
      sha256: "cf121d7ae5179996fb080d54f18e087f798e9e196c472238d23d1d3469f3ab17",
    });
    expect(manifest.qualityCounts).toEqual({ gold: 30_028, silver: 169_972, limited: 0 });
    expect(statSync(databasePath).size).toBe(manifest.output.bytes);
    expect(createHash("sha256").update(readFileSync(databasePath)).digest("hex")).toBe(manifest.output.sha256);
  });

  it("reconstructs symmetric PSD covariance for a deterministic database sample", () => {
    const database = new DatabaseSync(databasePath, { readOnly: true });
    try {
      const counts = database.prepare("SELECT count(*) AS rows, count(DISTINCT source_id) AS unique_rows FROM gaia_science").get() as { rows: number; unique_rows: number };
      expect(counts).toEqual(expect.objectContaining({ rows: 200_000, unique_rows: 200_000 }));
      const sampleStatement = database.prepare("SELECT * FROM gaia_science WHERE source_id % 199 = 0 ORDER BY source_id LIMIT 128");
      sampleStatement.setReadBigInts(true);
      const rows = sampleStatement.all() as Record<string, unknown>[];
      expect(rows).toHaveLength(128);
      for (const row of rows) {
        const record = gaiaScienceRecordFromDatabaseRowV8(row);
        const covariance = reconstructGaiaAstrometricCovarianceV1(record);
        expect(covariance.positiveSemidefinite).toBe(true);
        expect(covariance.matrix.every((matrixRow) => matrixRow.every(Number.isFinite))).toBe(true);
      }
    } finally {
      database.close();
    }
  });
});
