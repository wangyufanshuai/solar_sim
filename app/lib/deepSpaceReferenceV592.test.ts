import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  DEEP_SPACE_CLUSTERS_V592,
  DEEP_SPACE_GALAXIES_V592,
  DEEP_SPACE_REFERENCE_BY_ID_V592,
  DEEP_SPACE_REFERENCE_OBJECTS_V592,
  DEEP_SPACE_REFERENCE_PACKET_SHA256_V592,
  DEEP_SPACE_REFERENCE_RECEIPT_SHA256_V592,
  formatDeepSpaceDistanceV592,
  isDeepSpaceReferenceIdV592,
} from "./deepSpaceReferenceV592";

const root = process.cwd();
const sha256 = (bytes: Buffer | string) => createHash("sha256").update(bytes).digest("hex");
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize((value as Record<string, unknown>)[key])]));
}
const canonicalSha = (value: unknown) => sha256(JSON.stringify(canonicalize(value)));
const readJson = <T,>(path: string): T => JSON.parse(readFileSync(resolve(root, path), "utf8")) as T;

describe("v592 deep-space reference", () => {
  const packet = readJson<Record<string, unknown>>("public/data/living-universe-v592/deep-space-reference.json") as {
    packetSha256: string;
    admission: { admittedGalaxyReferenceCount: number; admittedClusterReferenceCount: number; visualMetadataCandidateCount: number; visualMetadataBlockedCount: number; visualAssetAdmittedCount: number };
    policy: { payloadDownloadPerformed: boolean; observationImageClaimRequiresAssetAdmission: boolean; scientificPayloadWriteback: boolean };
    objects: Array<{ id: string; category: string; raDeg: number; decDeg: number; distancePc: number; angularSize: { majorArcmin: number; minorArcmin: number }; visualMetadata: { candidateCount: number; payloadDownloaded: boolean; visualAssetAdmitted: boolean }; presentationOnly: boolean; scientificAuthority: boolean; scientificPayloadWriteback: boolean }>;
  };
  const receipt = readJson<Record<string, unknown>>("docs/release/v592/deep-space-reference-receipt-v592.json") as { receiptSha256: string; packetSha256: string; sourceFiles: Array<{ path: string; bytes: number; sha256: string }> };

  it("seals twelve galaxies and twelve clusters without admitting observation imagery", () => {
    const packetUnsigned = { ...packet } as Record<string, unknown>;
    delete packetUnsigned.packetSha256;
    const receiptUnsigned = { ...receipt } as Record<string, unknown>;
    delete receiptUnsigned.receiptSha256;
    expect(packet.packetSha256).toBe(canonicalSha(packetUnsigned));
    expect(receipt.receiptSha256).toBe(canonicalSha(receiptUnsigned));
    expect(packet.packetSha256).toBe(DEEP_SPACE_REFERENCE_PACKET_SHA256_V592);
    expect(receipt.receiptSha256).toBe(DEEP_SPACE_REFERENCE_RECEIPT_SHA256_V592);
    expect(receipt.packetSha256).toBe(packet.packetSha256);
    expect(packet.admission).toMatchObject({
      admittedGalaxyReferenceCount: 12,
      admittedClusterReferenceCount: 12,
      visualMetadataCandidateCount: 18,
      visualMetadataBlockedCount: 6,
      visualAssetAdmittedCount: 0,
    });
    expect(packet.policy).toMatchObject({ payloadDownloadPerformed: false, observationImageClaimRequiresAssetAdmission: true, scientificPayloadWriteback: false });
    expect(DEEP_SPACE_GALAXIES_V592).toHaveLength(12);
    expect(DEEP_SPACE_CLUSTERS_V592).toHaveLength(12);
    expect(DEEP_SPACE_REFERENCE_OBJECTS_V592).toHaveLength(24);
  });

  it("keeps every direction, footprint and distance finite in ICRS/J2000", () => {
    expect(new Set(packet.objects.map((entry) => entry.id)).size).toBe(24);
    for (const entry of packet.objects) {
      expect(entry.raDeg, entry.id).toBeGreaterThanOrEqual(0);
      expect(entry.raDeg, entry.id).toBeLessThan(360);
      expect(entry.decDeg, entry.id).toBeGreaterThanOrEqual(-90);
      expect(entry.decDeg, entry.id).toBeLessThanOrEqual(90);
      expect(entry.distancePc, entry.id).toBeGreaterThan(0);
      expect(entry.angularSize.majorArcmin, entry.id).toBeGreaterThan(0);
      expect(entry.angularSize.minorArcmin, entry.id).toBeGreaterThan(0);
      expect(entry.visualMetadata.payloadDownloaded, entry.id).toBe(false);
      expect(entry.visualMetadata.visualAssetAdmitted, entry.id).toBe(false);
      expect(entry.presentationOnly, entry.id).toBe(true);
      expect(entry.scientificAuthority, entry.id).toBe(false);
      expect(entry.scientificPayloadWriteback, entry.id).toBe(false);
      expect(isDeepSpaceReferenceIdV592(entry.id), entry.id).toBe(true);
    }
    expect(DEEP_SPACE_REFERENCE_BY_ID_V592.pleiades.raDeg).toBeGreaterThan(50);
    expect(DEEP_SPACE_REFERENCE_BY_ID_V592.pleiades.raDeg).toBeLessThan(65);
    expect(DEEP_SPACE_REFERENCE_BY_ID_V592.hyades.decDeg).toBeGreaterThan(10);
    expect(DEEP_SPACE_REFERENCE_BY_ID_V592.hyades.decDeg).toBeLessThan(22);
  });

  it("binds every source file by bytes and SHA and formats distance without changing authority", () => {
    for (const entry of receipt.sourceFiles) {
      const bytes = readFileSync(resolve(root, entry.path));
      expect(bytes.byteLength, entry.path).toBe(entry.bytes);
      expect(sha256(bytes), entry.path).toBe(entry.sha256);
    }
    expect(formatDeepSpaceDistanceV592(47)).toBe("47 pc");
    expect(formatDeepSpaceDistanceV592(7_200)).toBe("7.20 kpc");
    expect(formatDeepSpaceDistanceV592(16_400_000)).toBe("16.4 Mpc");
    expect(() => formatDeepSpaceDistanceV592(0)).toThrow(/v592-deep-space-distance/);
  });
});
