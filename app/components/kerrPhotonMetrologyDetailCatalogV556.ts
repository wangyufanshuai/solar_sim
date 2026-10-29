"use client";
import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { KerrPhotonMetrologyDetailSurfaceV556 } from "../lib/kerrPhotonMetrologyObservatoryIntentV556";
import { KERR_PHOTON_METROLOGY_DETAILS_V555, KERR_PHOTON_METROLOGY_LABELS_V555 } from "./kerrPhotonMetrologyDetailCatalogV555";
type IdV556 = Exclude<KerrPhotonMetrologyDetailSurfaceV556, "none">;
type LazyDetailV556 = LazyExoticComponent<ComponentType<Record<string, never>>>;
export const KERR_PHOTON_METROLOGY_DETAILS_V556 = Object.freeze({ ...KERR_PHOTON_METROLOGY_DETAILS_V555, "sparse-science-products": lazy(() => import("./KerrSparseScienceImageProductsV556")) } satisfies Readonly<Record<IdV556, LazyDetailV556>>);
export const KERR_PHOTON_METROLOGY_LABELS_V556 = Object.freeze({ ...KERR_PHOTON_METROLOGY_LABELS_V555, "sparse-science-products": "PNG / FITS science products" } satisfies Readonly<Record<IdV556, string>>);
export const KERR_PHOTON_METROLOGY_DETAIL_IDS_V556 = Object.freeze(Object.keys(KERR_PHOTON_METROLOGY_DETAILS_V556) as IdV556[]);
