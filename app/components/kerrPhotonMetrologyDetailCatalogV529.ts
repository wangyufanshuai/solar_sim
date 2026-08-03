"use client";

import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { KerrPhotonMetrologyDetailSurfaceV529 } from "../lib/kerrPhotonMetrologyObservatoryIntentV529";
import {
  KERR_PHOTON_METROLOGY_DETAILS_V528,
  KERR_PHOTON_METROLOGY_LABELS_V528,
} from "./kerrPhotonMetrologyDetailCatalogV528";

type DetailIdV529 = Exclude<KerrPhotonMetrologyDetailSurfaceV529, "none">;
type LazyDetail = LazyExoticComponent<ComponentType<Record<string, never>>>;
export const KERR_PHOTON_METROLOGY_DETAILS_V529 = Object.freeze({
  ...KERR_PHOTON_METROLOGY_DETAILS_V528,
  "cost-law-robustness": lazy(() => import("./KerrCostLawRobustnessV529")),
} satisfies Readonly<Record<DetailIdV529, LazyDetail>>);
export const KERR_PHOTON_METROLOGY_LABELS_V529 = Object.freeze({
  ...KERR_PHOTON_METROLOGY_LABELS_V528,
  "cost-law-robustness": "Cost-law robustness",
} satisfies Readonly<Record<DetailIdV529, string>>);
export const KERR_PHOTON_METROLOGY_DETAIL_IDS_V529 = Object.freeze(
  Object.keys(KERR_PHOTON_METROLOGY_DETAILS_V529) as DetailIdV529[],
);
