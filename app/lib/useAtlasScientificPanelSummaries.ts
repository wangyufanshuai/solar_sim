"use client";

import { useEffect, useMemo, useRef } from "react";
import type { AtlasObservatoryZoneId, AtlasValidationDomainId } from "./simulationDiagnosticsTypes";
import {
  ATLAS_COMPACT_OBSERVATORY_DECK_V190,
  ATLAS_COMPACT_REPORT_STUDIO_V190,
  ATLAS_COMPACT_SCIENTIFIC_REPORT_V190,
  ATLAS_COMPACT_VALIDATION_CONSOLE_V190,
} from "./atlasDeferredEvidenceContractV190";
import type {
  AtlasDeferredEvidenceModulesV190,
  AtlasDeferredEvidenceModuleSetV195,
} from "./useAtlasDeferredEvidenceModules";

type ReportArgs = Parameters<
  AtlasDeferredEvidenceModulesV190["report"]["createAtlasScientificReportSummary"]
>[0];
type StudioArgs = Parameters<
  AtlasDeferredEvidenceModulesV190["report"]["createAtlasReportStudioSummary"]
>[0];
type ValidationArgs = Parameters<
  AtlasDeferredEvidenceModulesV190["validation"]["createAtlasValidationConsoleSummary"]
>[0];
type ObservatoryArgs = Parameters<
  AtlasDeferredEvidenceModulesV190["observatory"]["createAtlasObservatoryDeckSummary"]
>[0];

type Options = {
  modules: AtlasDeferredEvidenceModuleSetV195;
  createMissionCapsule: () => ReportArgs["missionCapsule"];
  reportArgs: Omit<ReportArgs, "missionCapsule">;
  studioSettings: NonNullable<StudioArgs["settings"]>;
  validationArgs: Omit<ValidationArgs, "reportStudioSummary">;
  observatoryArgs: Omit<
    ObservatoryArgs,
    "reportStudioSummary" | "validationConsoleSummary" | "kerrLab"
  > & { kerrLab: NonNullable<ObservatoryArgs["kerrLab"]> };
  selectedValidationDomainId: AtlasValidationDomainId;
  setSelectedValidationDomainId: (id: AtlasValidationDomainId) => void;
  activeObservatoryZoneId: AtlasObservatoryZoneId;
  setActiveObservatoryZoneId: (id: AtlasObservatoryZoneId) => void;
};

function useShallowStable<T extends object>(value: T): T {
  const ref = useRef(value);
  const previous = ref.current;
  const previousKeys = Object.keys(previous) as (keyof T)[];
  const nextKeys = Object.keys(value) as (keyof T)[];
  if (
    previousKeys.length !== nextKeys.length ||
    nextKeys.some((key) => !Object.is(previous[key], value[key]))
  ) {
    ref.current = value;
  }
  return ref.current;
}

export function useAtlasScientificPanelSummaries({
  modules,
  createMissionCapsule,
  reportArgs,
  studioSettings,
  validationArgs,
  observatoryArgs,
  selectedValidationDomainId,
  setSelectedValidationDomainId,
  activeObservatoryZoneId,
  setActiveObservatoryZoneId,
}: Options) {
  const stableReportKerrLab = useShallowStable(reportArgs.kerrLab);
  const stableReportArgs = useShallowStable({ ...reportArgs, kerrLab: stableReportKerrLab });
  const stableStudioSettings = useShallowStable(studioSettings);
  const stableValidationArgs = useShallowStable(validationArgs);
  const stableObservatoryKerrLab = useShallowStable(observatoryArgs.kerrLab);
  const stableObservatoryArgs = useShallowStable({
    ...observatoryArgs,
    kerrLab: stableObservatoryKerrLab,
  });

  const scientificReportSummary = useMemo(() => {
    if (!modules.report) return ATLAS_COMPACT_SCIENTIFIC_REPORT_V190;
    return modules.report.createAtlasScientificReportSummary({
      ...stableReportArgs,
      missionCapsule: createMissionCapsule(),
    });
  }, [createMissionCapsule, modules, stableReportArgs]);

  const reportStudioSummary = useMemo(() => {
    if (!modules.report) return ATLAS_COMPACT_REPORT_STUDIO_V190;
    return modules.report.createAtlasReportStudioSummary({
      reportSummary: scientificReportSummary,
      settings: stableStudioSettings,
    });
  }, [modules, scientificReportSummary, stableStudioSettings]);

  const validationConsoleSummary = useMemo(() => {
    if (!modules.validation) return ATLAS_COMPACT_VALIDATION_CONSOLE_V190;
    return modules.validation.createAtlasValidationConsoleSummary({
      ...stableValidationArgs,
      reportStudioSummary,
    });
  }, [modules, reportStudioSummary, stableValidationArgs]);

  const observatoryDeckSummary = useMemo(() => {
    if (!modules.observatory) return ATLAS_COMPACT_OBSERVATORY_DECK_V190;
    return modules.observatory.createAtlasObservatoryDeckSummary({
      ...stableObservatoryArgs,
      validationConsoleSummary,
      reportStudioSummary,
    });
  }, [modules, reportStudioSummary, stableObservatoryArgs, validationConsoleSummary]);

  useEffect(() => {
    if (!validationConsoleSummary.domains.some(({ id }) => id === selectedValidationDomainId)) {
      setSelectedValidationDomainId(validationConsoleSummary.selectedDefaultDomainId);
    }
  }, [
    selectedValidationDomainId,
    setSelectedValidationDomainId,
    validationConsoleSummary.domains,
    validationConsoleSummary.selectedDefaultDomainId,
  ]);

  useEffect(() => {
    if (!observatoryDeckSummary.zones.some(({ id }) => id === activeObservatoryZoneId)) {
      setActiveObservatoryZoneId(observatoryDeckSummary.zones[0]?.id ?? "current-target");
    }
  }, [activeObservatoryZoneId, observatoryDeckSummary.zones, setActiveObservatoryZoneId]);

  return {
    atlasScientificReportSummary: scientificReportSummary,
    atlasReportStudioSummary: reportStudioSummary,
    atlasValidationConsoleSummary: validationConsoleSummary,
    atlasObservatoryDeckSummary: observatoryDeckSummary,
  };
}
