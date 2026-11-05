import { TRUE_VOID_TONE_MAPPING_EXPOSURE } from "./trueVoid";

let exposure = TRUE_VOID_TONE_MAPPING_EXPOSURE;

export function setAtlasRenderExposureV274(value: number): void {
  if (!Number.isFinite(value) || value <= 0) throw new Error("Atlas render exposure must be positive and finite");
  exposure = value;
}

export function getAtlasRenderExposureV274(): number {
  return exposure;
}
