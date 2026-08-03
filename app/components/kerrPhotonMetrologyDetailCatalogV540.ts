"use client";

import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { KerrPhotonMetrologyDetailSurfaceV540 } from "../lib/kerrPhotonMetrologyObservatoryIntentV540";
import { KERR_PHOTON_METROLOGY_DETAILS_V539, KERR_PHOTON_METROLOGY_LABELS_V539 } from "./kerrPhotonMetrologyDetailCatalogV539";

type IdV540 = Exclude<KerrPhotonMetrologyDetailSurfaceV540, "none">;
type LazyDetailV540 = LazyExoticComponent<ComponentType<Record<string, never>>>;
export const KERR_PHOTON_METROLOGY_DETAILS_V540 = Object.freeze({ ...KERR_PHOTON_METROLOGY_DETAILS_V539, "response-aware-offline-replay": lazy(() => import("./KerrResponseAwareOfflineReplayV540")) } satisfies Readonly<Record<IdV540, LazyDetailV540>>);
export const KERR_PHOTON_METROLOGY_LABELS_V540 = Object.freeze({ ...KERR_PHOTON_METROLOGY_LABELS_V539, "response-aware-offline-replay": "Offline replay receipt" } satisfies Readonly<Record<IdV540, string>>);
export const KERR_PHOTON_METROLOGY_DETAIL_IDS_V540 = Object.freeze(Object.keys(KERR_PHOTON_METROLOGY_DETAILS_V540) as IdV540[]);
