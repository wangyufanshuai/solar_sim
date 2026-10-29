import { currentReadinessV663,
  type ReadinessViewV663 } from "../../../lib/mainlineAWebReadinessV663";

export const dynamic = "force-dynamic";

const HEADERS = {
  "cache-control": "no-store, max-age=0",
  "x-mainline-a-candidate-only": "true",
  "x-mainline-a-release-admission": "hold",
  "x-scientific-payload-writeback": "false",
};

export function createReadinessResponseV663(view: ReadinessViewV663): Response {
  const valid = view.status === "valid-candidate-hold"
    && view.issues.length === 0
    && view.publicWebReleaseAllowed === false
    && view.scientificPayloadWriteback === false
    && view.rows.length === 9
    && view.gates.length === 6;
  const body = {
    schema: "mainline-a-r76-web-readiness-http-v663",
    status: valid ? "candidate-hold" : "source-invalid-hold",
    sourceFingerprint: valid ? view.fingerprint : null,
    publicWebReleaseAllowed: false,
    scientificPayloadWriteback: false,
    gates: view.gates.map((gate) => ({ key: gate.key,
      label: gate.label, value: gate.value,
      reason: gate.reason, status: "pending" })),
    items: valid ? view.rows.map((row) => ({ id: row.id,
      group: row.group, state: row.state,
      title: row.title, sourceUrl: row.sourceUrl,
      issueCodes: row.issueCodes,
      requestExecuted: false,
      responseCaptured: row.responseCaptured,
      rightsSigned: false,
      runtimeAdmission: "candidate-only" })) : [],
    issueCodes: view.issues,
    claims: { copyrightApproval: false, scientificValidity: false,
      productionPerformance: false, realUserValidation: false,
      physicalMobile: false, publicWebReleaseApproved: false },
  };
  return Response.json(body, { status: valid ? 200 : 503,
    headers: HEADERS });
}
export function GET(): Response {
  return createReadinessResponseV663(currentReadinessV663());
}
