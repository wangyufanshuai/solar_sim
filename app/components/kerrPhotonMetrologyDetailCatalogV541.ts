"use client";

import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { KerrPhotonMetrologyDetailSurfaceV541 } from "../lib/kerrPhotonMetrologyObservatoryIntentV541";
import { KERR_PHOTON_METROLOGY_DETAILS_V540, KERR_PHOTON_METROLOGY_LABELS_V540 } from "./kerrPhotonMetrologyDetailCatalogV540";

type IdV541 = Exclude<KerrPhotonMetrologyDetailSurfaceV541, "none">;
type LazyDetailV541 = LazyExoticComponent<ComponentType<Record<string, never>>>;
export const KERR_PHOTON_METROLOGY_DETAILS_V541 = Object.freeze({ ...KERR_PHOTON_METROLOGY_DETAILS_V540, "response-aware-replay-kit": lazy(() => import("./KerrResponseAwareReplayKitV541")) } satisfies Readonly<Record<IdV541, LazyDetailV541>>);
export const KERR_PHOTON_METROLOGY_LABELS_V541 = Object.freeze({ ...KERR_PHOTON_METROLOGY_LABELS_V540, "response-aware-replay-kit": "Standalone replay kit" } satisfies Readonly<Record<IdV541, string>>);
export const KERR_PHOTON_METROLOGY_DETAIL_IDS_V541 = Object.freeze(Object.keys(KERR_PHOTON_METROLOGY_DETAILS_V541) as IdV541[]);
