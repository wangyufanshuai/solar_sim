export interface AtlasV271AttemptNegativeEvidence {
  version: "v271-gaia-research-attempt-1-negative-evidence-v1";
  status: "blocked-v271-aggregate-attempt-1-not-retried";
  capabilityState: "blocked";
  attempt: {
    ordinal: 1;
    command: "npm run atlas -- catalog research-v271";
    exitCode: 1;
    durationMs: number;
    automaticRetryApplied: false;
    error: {
      exception: "TypeError";
      message: string;
      source: "scripts/build-gaia-research-v271.py";
      line: number;
      function: "scalar";
    };
  };
  retainedPart: {
    path: string;
    bytes: number;
    sha256: string;
    integrity: "ok";
    checkpointReusable: true;
  };
  downstream: {
    v272ShardSeriesStarted: false;
    gaia10mBuildStarted: false;
    v273ToV275HeavyClosureStarted: false;
  };
  science: {
    defaultKernel: "legacy-eih-1pn";
    codeSha256: string;
    screenSha256: string;
    workerPhysicsMutation: "not-applied";
    eihOnePnMutation: "not-applied";
    kerrMutation: "not-applied";
  };
  formalProduct: {
    version: "v263";
    advanced: false;
    defaultVisualProfile: "legacy-v9";
  };
  evidenceSha256: string;
}

export interface AtlasV271ClosureEvidence {
  version: "v271-gaia-research-closure-evidence-v1";
  status: "implemented-awaiting-browser-qualification";
  capabilityState: "implemented-awaiting-browser-qualification";
  attempts: {
    attempt1: { retainedAsNegativeEvidence: true };
    attempt2: {
      exitCode: 0;
      durationMs: number;
      explicitUserAuthorization: string;
      automaticRetryApplied: false;
      checkpointResumeApplied: true;
    };
  };
  aggregate: {
    integrity: "ok";
    contentAddressed: true;
    counts: Record<string, number>;
  };
  validation: {
    generatedIntegrity: { status: "passed-v271-generated-integrity" };
    focusedTests: { total: number; passed: number; failed: number };
    browserQualification: "not-run";
  };
  science: {
    defaultKernel: "legacy-eih-1pn";
    codeSha256: string;
    screenSha256: string;
    workerPhysicsMutation: "not-applied";
    eihOnePnMutation: "not-applied";
    kerrMutation: "not-applied";
  };
  release: {
    formalProductVersion: "v263";
    formalProductPointerAdvanced: false;
    defaultVisualProfile: "legacy-v9";
    localShadowPromotionApplied: false;
    v272ShardSeriesStarted: false;
  };
  evidenceSha256: string;
}
