"use client";

import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { KerrPhotonMetrologyDetailSurfaceV539 } from "../lib/kerrPhotonMetrologyObservatoryIntentV539";
import { KERR_PHOTON_METROLOGY_DETAILS_V538, KERR_PHOTON_METROLOGY_LABELS_V538 } from "./kerrPhotonMetrologyDetailCatalogV538";

type IdV539 = Exclude<KerrPhotonMetrologyDetailSurfaceV539, "none">;
type LazyDetailV539 = LazyExoticComponent<ComponentType<Record<string, never>>>;
export const KERR_PHOTON_METROLOGY_DETAILS_V539 = Object.freeze({ ...KERR_PHOTON_METROLOGY_DETAILS_V538, "response-aware-portable-crate": lazy(() => import("./KerrResponseAwarePortableCrateV539")) } satisfies Readonly<Record<IdV539, LazyDetailV539>>);
export const KERR_PHOTON_METROLOGY_LABELS_V539 = Object.freeze({ ...KERR_PHOTON_METROLOGY_LABELS_V538, "response-aware-portable-crate": "Portable science crate" } satisfies Readonly<Record<IdV539, string>>);
export const KERR_PHOTON_METROLOGY_DETAIL_IDS_V539 = Object.freeze(Object.keys(KERR_PHOTON_METROLOGY_DETAILS_V539) as IdV539[]);
