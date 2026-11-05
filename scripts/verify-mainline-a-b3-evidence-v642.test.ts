import { readFileSync } from "node:fs";
import { test } from "node:test";
import { sessionNegativeCasesV642, verifyB3SessionV642 } from "./verify-mainline-a-b3-evidence-v642";

const receipt = JSON.parse(readFileSync("docs/release/v607/mainline-a-b3-evidence-session-v642-20260929-final-002.json", "utf8"));

test("V642 evidence session replays the actual build, HTTP and browser receipts", () => {
  const issues = verifyB3SessionV642(receipt);
  if (issues.length > 0) throw new Error(issues.join(","));
});

test("V642 evidence session rejects build, HTTP, component and reportable mutations", () => {
  const cases = sessionNegativeCasesV642(receipt);
  if (cases.length !== 4 || cases.some((entry) => !entry.rejected)) throw new Error(JSON.stringify(cases));
});
