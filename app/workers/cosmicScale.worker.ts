/// <reference lib="webworker" />

export type CosmicScaleWorkerRequestV260 = { type: "load"; band: "local-group" | "near-universe"; requestId: number };
export type CosmicScaleWorkerResponseV260 =
  | { type: "points"; requestId: number; band: "local-group" | "near-universe"; positions: Float32Array; colors: Float32Array; sizes: Float32Array; count: number; provenance: string; publicDeploymentBlocked: boolean }
  | { type: "error"; requestId: number; message: string };

function equatorialToGalactic(raDeg: number, decDeg: number, radius: number): [number, number, number] {
  const ra = raDeg * Math.PI / 180;
  const dec = decDeg * Math.PI / 180;
  const x = Math.cos(dec) * Math.cos(ra);
  const y = Math.cos(dec) * Math.sin(ra);
  const z = Math.sin(dec);
  return [
    (-0.0548755604 * x - 0.8734370902 * y - 0.4838350155 * z) * radius,
    (0.4941094279 * x - 0.44482963 * y + 0.7469822445 * z) * radius,
    (-0.867666149 * x - 0.1980763734 * y + 0.4559837762 * z) * radius,
  ];
}

async function decompressJson<T>(response: Response): Promise<T> {
  if (!response.ok || !response.body) throw new Error(`OpenNGC fetch failed: ${response.status}`);
  if (typeof DecompressionStream === "undefined") return response.json() as Promise<T>;
  const stream = response.body.pipeThrough(new DecompressionStream("gzip"));
  return JSON.parse(await new Response(stream).text()) as T;
}

async function openNgcPoints() {
  const url = typeof DecompressionStream === "undefined"
    ? "/api/atlas/openngc"
    : "/data/openngc-v260/openngc-v260.json.gz";
  const rows = await decompressJson<Array<{ type: string; raDeg: number; decDeg: number; vMag: number | null }>>(
    await fetch(url, { cache: "force-cache" }),
  );
  const positions = new Float32Array(rows.length * 3);
  const colors = new Float32Array(rows.length * 3);
  const sizes = new Float32Array(rows.length);
  rows.forEach((row, index) => {
    const position = equatorialToGalactic(row.raDeg, row.decDeg, 8_000);
    positions.set(position, index * 3);
    const galaxy = row.type.startsWith("G");
    colors.set(galaxy ? [0.28, 0.72, 0.82] : row.type.includes("Cl") ? [0.82, 0.63, 0.31] : [0.46, 0.58, 0.78], index * 3);
    sizes[index] = Math.max(1, Math.min(3.2, 2.5 - ((row.vMag ?? 14) - 8) * 0.12));
  });
  return { positions, colors, sizes, count: rows.length, provenance: "OpenNGC CC-BY-SA-4.0", publicDeploymentBlocked: false as const };
}

async function cosmicflowsPoints() {
  const response = await fetch("/api/atlas/cosmicflows", { cache: "force-cache" });
  if (!response.ok) throw new Error(`Cosmicflows local candidate failed: ${response.status}`);
  const lines = (await response.text()).trim().split(/\r?\n/);
  const header = lines.shift()!.split(",");
  const index = Object.fromEntries(header.map((key, column) => [key, column])) as Record<string, number>;
  const positions = new Float32Array(lines.length * 3);
  const colors = new Float32Array(lines.length * 3);
  const sizes = new Float32Array(lines.length);
  let count = 0;
  for (const line of lines) {
    const values = line.split(",");
    const raDeg = Number(values[index.RAJ2000!]);
    const decDeg = Number(values[index.DEJ2000!]);
    const distanceMpc = Number(values[index.distance_mpc!]);
    if (![raDeg, decDeg, distanceMpc].every(Number.isFinite) || distanceMpc <= 0) continue;
    const position = equatorialToGalactic(raDeg, decDeg, distanceMpc * 20);
    positions.set(position, count * 3);
    const normalized = Math.min(1, Math.log10(1 + distanceMpc) / 3);
    colors.set([0.2 + normalized * 0.35, 0.7 - normalized * 0.28, 0.82 - normalized * 0.18], count * 3);
    sizes[count] = 1.1;
    count += 1;
  }
  return {
    positions: positions.slice(0, count * 3),
    colors: colors.slice(0, count * 3),
    sizes: sizes.slice(0, count),
    count,
    provenance: "Cosmicflows-4 / Tully et al. 2023",
    publicDeploymentBlocked: true as const,
  };
}

self.addEventListener("message", (event: MessageEvent<CosmicScaleWorkerRequestV260>) => {
  const request = event.data;
  if (request.type !== "load") return;
  const operation = request.band === "local-group" ? openNgcPoints() : cosmicflowsPoints();
  void operation.then((points) => {
    const response = { type: "points", requestId: request.requestId, band: request.band, ...points } satisfies CosmicScaleWorkerResponseV260;
    self.postMessage(response, [points.positions.buffer, points.colors.buffer, points.sizes.buffer]);
  }).catch((error: unknown) => {
    self.postMessage({ type: "error", requestId: request.requestId, message: error instanceof Error ? error.message : String(error) } satisfies CosmicScaleWorkerResponseV260);
  });
});

export {};
