import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import {
  createKerrUncertaintyIndependentVerificationSummaryV517,
  parseKerrUncertaintyIndependentVerificationReceiptV517,
  type KerrUncertaintyIndependentVerificationReceiptV517,
  type KerrUncertaintyIndependentVerificationSummaryV517,
} from "./kerrUncertaintyIndependentVerificationV517";

const RELATIVE =
  "dist/science/kerr-uncertainty-independent-verification-v517/verification-receipt.json";
const MAX_BYTES = 128 * 1024;
const digest = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");
let cache: Readonly<{
  fingerprint: string;
  promise: Promise<KerrUncertaintyIndependentVerificationLoadedV517>;
}> | null = null;

export type KerrUncertaintyIndependentVerificationLoadedV517 = Readonly<{
  receipt: KerrUncertaintyIndependentVerificationReceiptV517;
  summary: KerrUncertaintyIndependentVerificationSummaryV517;
  export: Readonly<{
    name: "orbit-atlas-kerr-uncertainty-independent-verification-v517.json";
    bytes: Uint8Array;
    fileSha256: string;
    contentType: "application/json; charset=utf-8";
  }>;
}>;

export async function loadKerrUncertaintyIndependentVerificationV517(
  root = process.cwd(),
): Promise<KerrUncertaintyIndependentVerificationLoadedV517> {
  const target = resolve(root, RELATIVE);
  const metadata = await stat(target);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > MAX_BYTES) {
    throw new Error("v517-verification-size");
  }
  const bytes = new Uint8Array(await readFile(target));
  const fingerprint = `${metadata.mtimeMs}:${metadata.size}:${digest(bytes)}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(() => {
    const receipt = parseKerrUncertaintyIndependentVerificationReceiptV517(
      JSON.parse(new TextDecoder().decode(bytes)),
    );
    return Object.freeze({
      receipt,
      summary: createKerrUncertaintyIndependentVerificationSummaryV517(receipt),
      export: Object.freeze({
        name: "orbit-atlas-kerr-uncertainty-independent-verification-v517.json" as const,
        bytes,
        fileSha256: digest(bytes),
        contentType: "application/json; charset=utf-8" as const,
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

export function resetKerrUncertaintyIndependentVerificationServerCacheForTestsV517() {
  cache = null;
}
