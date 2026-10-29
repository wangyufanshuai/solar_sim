/// <reference lib="webworker" />

import {
  loadHorizonsValidationDatasetFromJson,
} from "../lib/relativityValidation";
import { fetchAtlasAsset } from "../lib/atlasAssetResolver";
import { runHorizonsValidationDataset } from "../lib/horizonsValidationRunner";
import type {
  HorizonsValidationRun,
} from "../lib/simulationDiagnosticsTypes";

type StartMsg = { type: "start" };
type WorkerOut =
  | { type: "status"; payload: HorizonsValidationRun }
  | { type: "complete"; payload: HorizonsValidationRun };

const VALIDATION_URL = "/data/horizons-validation-j2000.json";

function post(out: WorkerOut): void {
  self.postMessage(out);
}

self.onmessage = (event: MessageEvent<StartMsg>) => {
  if (event.data.type !== "start") return;
  void runValidation();
};

async function runValidation(): Promise<void> {
  try {
    post({
      type: "status",
      payload: { status: "running", progress: 0.02, source: "JPL Horizons API", modes: [] },
    });
    const response = await fetchAtlasAsset(VALIDATION_URL, { cache: "force-cache" });
    if (!response.ok) throw new Error(`Horizons validation fetch failed: ${response.status}`);
    const dataset = loadHorizonsValidationDatasetFromJson(await response.text());
    const result = await runHorizonsValidationDataset(dataset, {
      onProgress: ({ mode, elapsedDays, maxDays }) => {
        const progressBase = mode === "newton" ? 0.05 : 0.52;
        const modeSpan = mode === "newton" ? 0.42 : 0.43;
        post({
          type: "status",
          payload: {
            status: "running",
            progress: Math.min(0.98, progressBase + (elapsedDays / maxDays) * modeSpan),
            source: dataset.source,
            modes: [],
          },
        });
      },
      yieldControl: () => new Promise((resolve) => setTimeout(resolve, 0)),
    });
    post({
      type: "complete",
      payload: result,
    });
  } catch (error) {
    post({
      type: "complete",
      payload: {
        status: "failed",
        progress: 1,
        source: "JPL Horizons API",
        modes: [],
        error: error instanceof Error ? error.message : String(error),
      },
    });
  }
}

export {};
