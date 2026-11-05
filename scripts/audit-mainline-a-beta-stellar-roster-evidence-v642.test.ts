import { test } from "node:test";
import { runAuditV642 } from "./audit-mainline-a-beta-stellar-roster-evidence-v642";

test("V642 audit verifies the plan-only pack and negative cases", () => {
  const receipt = runAuditV642(true);
  if (receipt.status !== "verified-plan-only") throw new Error(`unexpected status: ${receipt.status}`);
  if (receipt.validation.negativePassed !== 4) throw new Error("negative cases did not all pass");
  if (receipt.counts.records !== 11 || receipt.counts.openGates !== 6) throw new Error("unexpected V642 counts");
});
