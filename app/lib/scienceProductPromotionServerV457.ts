import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import {
  createScienceProductPromotionSummaryV457,
  parseScienceProductPromotionGateV457,
  type ScienceProductPromotionGateV457,
  type ScienceProductPromotionSummaryV457,
} from "./scienceProductPromotionGateV457";

const ROOT = "dist/science/kerr-science-product-promotion-gate-v457";
const FILE = Object.freeze({
  name: "science-product-promotion-gate.json",
  maxBytes: 128 * 1024,
  contentType: "application/json; charset=utf-8",
});

export type ScienceProductPromotionLoadedV457 = Readonly<{
  artifact: ScienceProductPromotionGateV457;
  summary: ScienceProductPromotionSummaryV457;
  export: Readonly<{
    name: string;
    bytes: Uint8Array;
    fileSha256: string;
    contentType: string;
  }>;
}>;

const sha256 = (value: Uint8Array): string =>
  createHash("sha256").update(value).digest("hex");
let cache: Readonly<{
  fingerprint: string;
  promise: Promise<ScienceProductPromotionLoadedV457>;
}> | null = null;

export async function loadScienceProductPromotionV457(
  root = process.cwd(),
): Promise<ScienceProductPromotionLoadedV457> {
  const path = resolve(root, ROOT, FILE.name);
  const metadata = await stat(path);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > FILE.maxBytes) {
    throw new Error("v457-promotion-artifact-size");
  }
  const bytes = new Uint8Array(await readFile(path));
  const digest = sha256(bytes);
  const fingerprint = `${path}:${metadata.mtimeMs}:${metadata.size}:${digest}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(() => {
    const artifact = parseScienceProductPromotionGateV457(
      JSON.parse(new TextDecoder().decode(bytes)),
    );
    return Object.freeze({
      artifact,
      summary: createScienceProductPromotionSummaryV457(artifact),
      export: Object.freeze({
        name: FILE.name,
        bytes,
        fileSha256: digest,
        contentType: FILE.contentType,
      }),
    });
  });
  cache = Object.freeze({ fingerprint, promise });
  try {
    return await promise;
  } catch (error) {
    if (cache?.promise === promise) cache = null;
    throw error;
  }
}

export function resetScienceProductPromotionServerCacheForTestsV457(): void {
  cache = null;
}
