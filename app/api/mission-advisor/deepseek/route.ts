import { NextResponse } from "next/server";
import { explainMissionPlan } from "../../../lib/missionPlanningAdvisor";
import type { MissionAdvisorReport, MissionPlan } from "../../../lib/missionDesignerTypes";

export type DeepSeekMissionAdvisorRequest = {
  plan: MissionPlan | null;
};

export type DeepSeekMissionAdvisorResponse = {
  report: MissionAdvisorReport;
  ok: boolean;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  model?: string;
};

const DEFAULT_MODEL = "deepseek-v4-flash";
const DEFAULT_BASE = "https://api.deepseek.com";
const TIMEOUT_MS = 18_000;

function fallback(plan: MissionPlan | null, error?: string, latencyMs?: number): DeepSeekMissionAdvisorResponse {
  return {
    ok: false,
    report: {
      ...explainMissionPlan(plan),
      provider: "fallback",
      model: process.env.DEEPSEEK_MODEL?.trim() || DEFAULT_MODEL,
      latencyMs,
      error,
    },
  };
}

function compactPlan(plan: MissionPlan) {
  return {
    name: plan.name,
    sequence: plan.sequence,
    departureDay: Math.round(plan.departureDay),
    durationDays: Math.round(plan.durationDays),
    totalDeltaVKms: Number(plan.totalDeltaVKms.toFixed(3)),
    deterministicDeltaVKms: Number(plan.deterministicDeltaVKms.toFixed(3)),
    dsmReserveDeltaVKms: Number(plan.dsmReserveDeltaVKms.toFixed(3)),
    fuelEstimateKg: Math.round(plan.fuelEstimateKg),
    score: Math.round(plan.score),
    validationStatus: plan.validationStatus,
    constraintChecks: plan.constraintChecks.map((check) => ({
      id: check.id,
      label: check.label,
      actual: Number(check.actual.toFixed(3)),
      limit: Number(check.limit.toFixed(3)),
      margin: Number(check.margin.toFixed(3)),
      unit: check.unit,
      status: check.status,
      explanation: check.explanation,
    })),
    assumptions: plan.assumptions,
    solverProvenance: plan.solverProvenance,
    sensitivitySummary: plan.sensitivitySummary,
    maxCommunicationDelayMin: Number(plan.maxCommunicationDelayMin.toFixed(2)),
    navigationUncertaintyKm: Math.round(plan.navigationUncertaintyKm),
    risk: plan.risk,
    grCorrectionNote: plan.grCorrectionNote,
    segments: plan.segments.map((s) => ({
      fromBody: s.fromBody,
      toBody: s.toBody,
      tofDays: Math.round(s.tofDays),
      deltaVKms: Number(s.deltaVKms.toFixed(3)),
      dsmDeltaVKms: Number(s.dsmDeltaVKms.toFixed(3)),
      c3Km2S2: Number(s.c3Km2S2.toFixed(3)),
      lambertConverged: s.lambertConverged,
      lambertResidual: Number(s.lambertResidual.toFixed(1)),
      departureVinfinityKms: Number(s.departureVinfinityKms.toFixed(3)),
      arrivalVinfinityKms: Number(s.arrivalVinfinityKms.toFixed(3)),
      flybySafetyMargin: Number.isFinite(s.flybySafetyMargin) ? Number(s.flybySafetyMargin.toFixed(3)) : null,
      flybyFeasible: s.flybyFeasible,
      requiredTurnAngleDeg: Number(s.requiredTurnAngleDeg.toFixed(1)),
      maxTurnAngleDeg: Number(s.maxTurnAngleDeg.toFixed(1)),
      bPlaneRisk: s.bPlaneRisk,
      closestApproachKm: Math.round(s.closestApproachKm),
      turnAngleDeg: Number(s.turnAngleDeg.toFixed(1)),
      communicationDelayMin: Number(s.communicationDelayMin.toFixed(2)),
      kalmanSigmaKm: Math.round(s.kalmanSigmaKm),
      risk: s.risk,
      burnAttitude: s.burnAttitude,
      antennaPointing: s.antennaPointing,
      solarArrayPointing: s.solarArrayPointing,
    })),
  };
}

function parseReport(raw: string, plan: MissionPlan, model: string, latencyMs: number): MissionAdvisorReport | null {
  const trimmed = raw.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    parsed = JSON.parse(trimmed.slice(start, end + 1));
  }
  if (!parsed || typeof parsed !== "object") return null;
  const obj = parsed as Partial<MissionAdvisorReport>;
  const local = explainMissionPlan(plan);
  return {
    summary: typeof obj.summary === "string" && obj.summary ? obj.summary : local.summary,
    fuelTradeoff: typeof obj.fuelTradeoff === "string" && obj.fuelTradeoff ? obj.fuelTradeoff : local.fuelTradeoff,
    gravityAssist: typeof obj.gravityAssist === "string" && obj.gravityAssist ? obj.gravityAssist : local.gravityAssist,
    risk: typeof obj.risk === "string" && obj.risk ? obj.risk : local.risk,
    communication: typeof obj.communication === "string" && obj.communication ? obj.communication : local.communication,
    recommendation: typeof obj.recommendation === "string" && obj.recommendation ? obj.recommendation : local.recommendation,
    tags: Array.isArray(obj.tags) ? obj.tags.filter((t): t is string => typeof t === "string").slice(0, 6) : local.tags,
    provider: "deepseek",
    model,
    latencyMs,
  };
}

export async function POST(req: Request) {
  const started = Date.now();
  let plan: MissionPlan | null = null;
  try {
    const body = (await req.json()) as DeepSeekMissionAdvisorRequest;
    plan = body.plan ?? null;
  } catch {
    return NextResponse.json(fallback(null, "invalid request json", Date.now() - started), { status: 200 });
  }

  if (!plan) {
    return NextResponse.json(fallback(null, "missing mission plan", Date.now() - started), { status: 200 });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(fallback(plan, "not_configured", Date.now() - started), { status: 200 });
  }

  const model = process.env.DEEPSEEK_MODEL?.trim() || DEFAULT_MODEL;
  const base = (process.env.DEEPSEEK_API_BASE?.trim() || DEFAULT_BASE).replace(/\/+$/, "");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        response_format: { type: "json_object" },
        temperature: 0.35,
        messages: [
          {
            role: "system",
            content:
              "You are a space mission engineering advisor. Use only the provided structured constraint checks, assumptions, solver provenance, sensitivity summary, and Lambert patched-conics data. Never override the audit verdict or invent feasibility evidence. Do not claim GMAT, STK, NASA, real mission feasibility, or high-fidelity optimal-control validation. Return strict JSON with keys: summary, fuelTradeoff, gravityAssist, risk, communication, recommendation, tags.",
          },
          {
            role: "user",
            content: JSON.stringify({
              instruction:
                "Explain this Earth-Venus-Jupiter-Saturn mission candidate in concise engineering language. Emphasize delta-v, DSM reserve, B-plane turn feasibility, flyby periapsis risk, communications delay, attitude/navigation concerns, and practical next steps.",
              plan: compactPlan(plan),
            }),
          },
        ],
      }),
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const latencyMs = Date.now() - started;
    if (!res.ok) {
      return NextResponse.json(fallback(plan, `DeepSeek HTTP ${res.status}`, latencyMs), { status: 200 });
    }
    const data = (await res.json()) as ChatCompletionResponse;
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json(fallback(plan, "DeepSeek returned empty content", latencyMs), { status: 200 });
    }
    const report = parseReport(content, plan, data.model || model, latencyMs);
    if (!report) {
      return NextResponse.json(fallback(plan, "DeepSeek returned non-JSON advisor content", latencyMs), { status: 200 });
    }
    return NextResponse.json({ ok: true, report } satisfies DeepSeekMissionAdvisorResponse);
  } catch (e) {
    clearTimeout(timeout);
    const message = e instanceof Error && e.name === "AbortError" ? "DeepSeek request timed out" : "DeepSeek request failed";
    return NextResponse.json(fallback(plan, message, Date.now() - started), { status: 200 });
  }
}
