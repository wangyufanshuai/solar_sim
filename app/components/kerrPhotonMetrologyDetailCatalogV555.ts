"use client";
import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { KerrPhotonMetrologyDetailSurfaceV555 } from "../lib/kerrPhotonMetrologyObservatoryIntentV555";
import { KERR_PHOTON_METROLOGY_DETAILS_V553, KERR_PHOTON_METROLOGY_LABELS_V553 } from "./kerrPhotonMetrologyDetailCatalogV553";
type IdV555 = Exclude<KerrPhotonMetrologyDetailSurfaceV555, "none">; type LazyDetailV555 = LazyExoticComponent<ComponentType<Record<string, never>>>;
export const KERR_PHOTON_METROLOGY_DETAILS_V555 = Object.freeze({ ...KERR_PHOTON_METROLOGY_DETAILS_V553, "sparse-science-image": lazy(() => import("./KerrSparseScienceImageV555")) } satisfies Readonly<Record<IdV555, LazyDetailV555>>);
export const KERR_PHOTON_METROLOGY_LABELS_V555 = Object.freeze({ ...KERR_PHOTON_METROLOGY_LABELS_V553, "sparse-science-image": "Sparse science image" } satisfies Readonly<Record<IdV555, string>>);
export const KERR_PHOTON_METROLOGY_DETAIL_IDS_V555 = Object.freeze(Object.keys(KERR_PHOTON_METROLOGY_DETAILS_V555) as IdV555[]);
