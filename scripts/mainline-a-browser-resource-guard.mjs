import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);
export const BROWSER_RESOURCE_POLICY = Object.freeze({ intervalMs: 15_000, freePhysicalBytesMin: 2 * 1024 ** 3,
  commitHeadroomBytesMin: 2 * 1024 ** 3, commitHeadroomRatioMin: .10 });
export const CONSTRAINED_DEVELOPMENT_BROWSER_RESOURCE_POLICY = Object.freeze({ intervalMs: 10_000,
  freePhysicalBytesMin: 1024 ** 3, commitHeadroomBytesMin: 1.5 * 1024 ** 3, commitHeadroomRatioMin: .04 });

export function resolveBrowserResourceProfile(value = process.env.ATLAS_BROWSER_RESOURCE_PROFILE) {
  if (value === undefined || value === "" || value === "default") {
    return { profile: "default", policy: BROWSER_RESOURCE_POLICY,
      use: "browser-resource-protection-not-performance-acceptance", performanceAcceptance: false };
  }
  if (value === "constrained-development") {
    return { profile: value, policy: CONSTRAINED_DEVELOPMENT_BROWSER_RESOURCE_POLICY,
      use: "functional-and-visual-development-only-not-performance-acceptance", performanceAcceptance: false };
  }
  throw new Error(`Unknown ATLAS_BROWSER_RESOURCE_PROFILE: ${value}`);
}

export function inspectBrowserCapacity(sample, policy = BROWSER_RESOURCE_POLICY) {
  const issues = [];
  const { freePhysicalBytes, commitLimitBytes, committedBytes } = sample;
  if (![freePhysicalBytes, commitLimitBytes, committedBytes].every(Number.isFinite) || commitLimitBytes <= 0
    || freePhysicalBytes < 0 || committedBytes < 0 || committedBytes > commitLimitBytes) issues.push("invalid-capacity-sample");
  else {
    if (freePhysicalBytes < policy.freePhysicalBytesMin) issues.push("physical-memory-below-reserve");
    if (commitLimitBytes - committedBytes < policy.commitHeadroomBytesMin
      || (commitLimitBytes - committedBytes) / commitLimitBytes < policy.commitHeadroomRatioMin) issues.push("commit-headroom-below-reserve");
  }
  return { ok: issues.length === 0, issues };
}

export async function readBrowserCapacity() {
  const command = "$capacityOs=Get-CimInstance Win32_OperatingSystem; $capacityMemory=Get-CimInstance Win32_PerfFormattedData_PerfOS_Memory; "
    + "[pscustomobject]@{freePhysicalBytes=([double]$capacityOs.FreePhysicalMemory*1024); "
    + "commitLimitBytes=[double]$capacityMemory.CommitLimit; committedBytes=[double]$capacityMemory.CommittedBytes}|ConvertTo-Json -Compress";
  const { stdout } = await exec("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", command], { timeout: 10_000, windowsHide: true });
  return { at: new Date().toISOString(), ...JSON.parse(stdout.trim()) };
}

/** The callback may close only the browser owned by the invoking capture. No process enumeration or global kill. */
export function createBrowserResourceGuard({ onStop, onSample, sample = readBrowserCapacity, environment = process.env }) {
  const selection = resolveBrowserResourceProfile(environment.ATLAS_BROWSER_RESOURCE_PROFILE ?? "default");
  const evidence = { ...selection, samples: [], stopReason: null };
  let timer; let pending = null;
  const assert = () => { if (evidence.stopReason) throw new Error(`browser-resource-protection:${evidence.stopReason}`); };
  const check = async () => {
    assert();
    try {
      const value = await sample(); const result = inspectBrowserCapacity(value, selection.policy);
      const entry = { ...value, ...result, ...selection }; evidence.samples.push(entry); await onSample?.(entry, evidence.samples.length);
      if (!result.ok) evidence.stopReason = result.issues.join(",");
    } catch (error) { evidence.stopReason = `capacity-observation-failed:${error.message}`; }
    assert();
  };
  const start = () => {
    timer = setInterval(() => {
      if (pending || evidence.stopReason) return;
      pending = check().catch(async () => {
        clearInterval(timer);
        try { await onStop?.(evidence.stopReason); } catch (error) { evidence.cleanupError = error.message; }
      }).finally(() => { pending = null; });
    }, selection.policy.intervalMs);
  };
  const stop = async () => { clearInterval(timer); if (pending) await pending; };
  return { evidence, check, assert, start, stop };
}
