"use client";

import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { KerrPhotonMetrologyDetailSurfaceV538 } from "../lib/kerrPhotonMetrologyObservatoryIntentV538";
import { KERR_PHOTON_METROLOGY_DETAILS_V537, KERR_PHOTON_METROLOGY_LABELS_V537 } from "./kerrPhotonMetrologyDetailCatalogV537";

type IdV538 = Exclude<KerrPhotonMetrologyDetailSurfaceV538, "none">;
type LazyDetailV538 = LazyExoticComponent<ComponentType<Record<string, never>>>;
export const KERR_PHOTON_METROLOGY_DETAILS_V538 = Object.freeze({ ...KERR_PHOTON_METROLOGY_DETAILS_V537, "response-aware-fits-column-schema": lazy(() => import("./KerrResponseAwareFitsColumnSchemaV538")) } satisfies Readonly<Record<IdV538, LazyDetailV538>>);
export const KERR_PHOTON_METROLOGY_LABELS_V538 = Object.freeze({ ...KERR_PHOTON_METROLOGY_LABELS_V537, "response-aware-fits-column-schema": "FITS column semantics" } satisfies Readonly<Record<IdV538, string>>);
export const KERR_PHOTON_METROLOGY_DETAIL_IDS_V538 = Object.freeze(Object.keys(KERR_PHOTON_METROLOGY_DETAILS_V538) as IdV538[]);
