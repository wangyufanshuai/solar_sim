"use client";

import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { KerrPhotonMetrologyDetailSurfaceV533 } from "../lib/kerrPhotonMetrologyObservatoryIntentV533";
import {
  KERR_PHOTON_METROLOGY_DETAILS_V532,
  KERR_PHOTON_METROLOGY_LABELS_V532,
} from "./kerrPhotonMetrologyDetailCatalogV532";

type Id = Exclude<KerrPhotonMetrologyDetailSurfaceV533, "none">;
type LazyDetail = LazyExoticComponent<ComponentType<Record<string, never>>>;

export const KERR_PHOTON_METROLOGY_DETAILS_V533 = Object.freeze({
  ...KERR_PHOTON_METROLOGY_DETAILS_V532,
  "grid-axis-influence": lazy(() => import("./KerrGridAxisInfluenceV533")),
} satisfies Readonly<Record<Id, LazyDetail>>);

export const KERR_PHOTON_METROLOGY_LABELS_V533 = Object.freeze({
  ...KERR_PHOTON_METROLOGY_LABELS_V532,
  "grid-axis-influence": "Axis influence",
} satisfies Readonly<Record<Id, string>>);

export const KERR_PHOTON_METROLOGY_DETAIL_IDS_V533 = Object.freeze(
  Object.keys(KERR_PHOTON_METROLOGY_DETAILS_V533) as Id[],
);
