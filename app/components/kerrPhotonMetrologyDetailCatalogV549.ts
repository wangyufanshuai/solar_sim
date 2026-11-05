"use client";
import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { KerrPhotonMetrologyDetailSurfaceV549 } from "../lib/kerrPhotonMetrologyObservatoryIntentV549";
import { KERR_PHOTON_METROLOGY_DETAILS_V548, KERR_PHOTON_METROLOGY_LABELS_V548 } from "./kerrPhotonMetrologyDetailCatalogV548";
type IdV549 = Exclude<KerrPhotonMetrologyDetailSurfaceV549, "none">; type LazyDetailV549 = LazyExoticComponent<ComponentType<Record<string, never>>>;
export const KERR_PHOTON_METROLOGY_DETAILS_V549 = Object.freeze({ ...KERR_PHOTON_METROLOGY_DETAILS_V548, "measured-sidecar-admission": lazy(() => import("./KerrMeasuredSidecarAdmissionV549")) } satisfies Readonly<Record<IdV549, LazyDetailV549>>);
export const KERR_PHOTON_METROLOGY_LABELS_V549 = Object.freeze({ ...KERR_PHOTON_METROLOGY_LABELS_V548, "measured-sidecar-admission": "Measured sidecar admission" } satisfies Readonly<Record<IdV549, string>>);
export const KERR_PHOTON_METROLOGY_DETAIL_IDS_V549 = Object.freeze(Object.keys(KERR_PHOTON_METROLOGY_DETAILS_V549) as IdV549[]);
