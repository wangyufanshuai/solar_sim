export const ATLAS_API_SECURITY_VERSION = "v270-bounded-api-security-v1" as const;

export class AtlasApiPayloadTooLargeV270 extends RangeError {
  constructor(message = "Atlas API payload exceeds its byte limit") {
    super(message);
    this.name = "AtlasApiPayloadTooLargeV270";
  }
}

function declaredContentLength(headers: Headers): number | null {
  const raw = headers.get("content-length");
  if (raw == null || raw === "") return null;
  const value = Number(raw);
  return Number.isSafeInteger(value) && value >= 0 ? value : null;
}

async function readBoundedStream(
  stream: ReadableStream<Uint8Array> | null,
  declaredBytes: number | null,
  maxBytes: number,
): Promise<string> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) throw new RangeError("Atlas API byte limit is invalid");
  if (declaredBytes != null && declaredBytes > maxBytes) throw new AtlasApiPayloadTooLargeV270();
  if (!stream) return "";
  const reader = stream.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let bytes = 0;
  let text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) {
        await reader.cancel("atlas-api-byte-limit");
        throw new AtlasApiPayloadTooLargeV270();
      }
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } catch (error) {
    if (error instanceof AtlasApiPayloadTooLargeV270) throw error;
    throw new Error("Atlas API payload could not be decoded");
  } finally {
    reader.releaseLock();
  }
}

export function atlasUtf8ByteLengthV270(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

export async function readAtlasRequestTextV270(request: Request, maxBytes: number): Promise<string> {
  return readBoundedStream(request.body, declaredContentLength(request.headers), maxBytes);
}

export async function readAtlasResponseTextV270(response: Response, maxBytes: number): Promise<string> {
  return readBoundedStream(response.body, declaredContentLength(response.headers), maxBytes);
}

export async function readAtlasResponseJsonV270(response: Response, maxBytes: number): Promise<unknown> {
  const text = await readAtlasResponseTextV270(response, maxBytes);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Atlas upstream returned invalid JSON");
  }
}

export function atlasBoundedTextV270(value: unknown, maxCharacters: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxCharacters) : "";
}
