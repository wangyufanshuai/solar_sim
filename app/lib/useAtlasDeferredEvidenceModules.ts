"use client";

import { useEffect, useState } from "react";

export type AtlasDeferredEvidenceModulesV190 = {
  report: typeof import("./atlasScientificReport");
  validation: typeof import("./atlasValidationConsole");
  observatory: typeof import("./atlasObservatoryDeck");
};

export type AtlasDeferredEvidenceModuleSetV195 = Partial<AtlasDeferredEvidenceModulesV190>;

export type AtlasDeferredEvidenceRequestsV195 = {
  report: boolean;
  validation: boolean;
  observatory: boolean;
};

export type AtlasLegacyEvidenceDetailsV190 =
  (typeof import("./atlasLegacyEvidenceDetailsV190"))["STATIC_LEGACY_RELEASE_SUMMARIES_V177"];

export function useAtlasDeferredEvidenceModules(
  requested: AtlasDeferredEvidenceRequestsV195,
): AtlasDeferredEvidenceModuleSetV195 {
  const [modules, setModules] = useState<AtlasDeferredEvidenceModuleSetV195>({});

  useEffect(() => {
    if (!requested.report || modules.report) return;
    let active = true;
    void import("./atlasScientificReport").then((report) => {
      if (active) setModules((current) => ({ ...current, report }));
    });
    return () => { active = false; };
  }, [modules.report, requested.report]);

  useEffect(() => {
    if (!requested.validation || modules.validation) return;
    let active = true;
    void import("./atlasValidationConsole").then((validation) => {
      if (active) setModules((current) => ({ ...current, validation }));
    });
    return () => { active = false; };
  }, [modules.validation, requested.validation]);

  useEffect(() => {
    if (!requested.observatory || modules.observatory) return;
    let active = true;
    void import("./atlasObservatoryDeck").then((observatory) => {
      if (active) setModules((current) => ({ ...current, observatory }));
    });
    return () => { active = false; };
  }, [modules.observatory, requested.observatory]);

  return modules;
}

export function useAtlasLegacyEvidenceDetails(
  requested: boolean,
): AtlasLegacyEvidenceDetailsV190 | null {
  const [details, setDetails] = useState<AtlasLegacyEvidenceDetailsV190 | null>(null);

  useEffect(() => {
    if (!requested || details) return;
    let active = true;
    void import("./atlasLegacyEvidenceDetailsV190").then((module) => {
      if (active) setDetails(module.STATIC_LEGACY_RELEASE_SUMMARIES_V177);
    });
    return () => { active = false; };
  }, [details, requested]);

  return details;
}
