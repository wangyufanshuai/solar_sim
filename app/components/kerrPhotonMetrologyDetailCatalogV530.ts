"use client";

import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { KerrPhotonMetrologyDetailSurfaceV530 } from "../lib/kerrPhotonMetrologyObservatoryIntentV530";
import {
  KERR_PHOTON_METROLOGY_DETAILS_V529,
  KERR_PHOTON_METROLOGY_LABELS_V529,
} from "./kerrPhotonMetrologyDetailCatalogV529";

type DetailIdV530 = Exclude<KerrPhotonMetrologyDetailSurfaceV530, "none">;
type LazyDetail = LazyExoticComponent<ComponentType<Record<string, never>>>;
export const KERR_PHOTON_METROLOGY_DETAILS_V530 = Object.freeze({
  ...KERR_PHOTON_METROLOGY_DETAILS_V529,
  "allocation-regret": lazy(() => import("./KerrAllocationRegretV530")),
} satisfies Readonly<Record<DetailIdV530, LazyDetail>>);
export const KERR_PHOTON_METROLOGY_LABELS_V530 = Object.freeze({
  ...KERR_PHOTON_METROLOGY_LABELS_V529,
  "allocation-regret": "Allocation regret",
} satisfies Readonly<Record<DetailIdV530, string>>);
export const KERR_PHOTON_METROLOGY_DETAIL_IDS_V530 = Object.freeze(
  Object.keys(KERR_PHOTON_METROLOGY_DETAILS_V530) as DetailIdV530[],
);
