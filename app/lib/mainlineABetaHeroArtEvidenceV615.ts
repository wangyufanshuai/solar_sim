export type HeroArtEvidenceStatusV615 = "runtime-baseline" | "candidate-presentation" | "evidence-pending";
export type HeroArtEvidenceRecordV615 = Readonly<{
  id: string;
  displayName: string;
  status: "runtime-baseline" | "candidate-only";
  artStatus: HeroArtEvidenceStatusV615;
  runtimeAdmission: "admitted" | "candidate-only";
  measurementAdmission: "not-admitted";
  scientificPayloadWriteback: false;
  source: Readonly<{ heroPacketSha256: string; presentationOnly: boolean; projectionRow: unknown }>;
  visualProfile: Readonly<{ shaderProfile: string; coronaModel: string; temperatureK: number; radiusSolar: number; luminositySolar: number; equatorialPolarRadiusRatio: number; textureMode: string }>;
  checks: Readonly<Record<string, boolean>>;
  blockers: readonly string[];
}>;

export type HeroArtEvidencePackV615 = Readonly<{
  schema: string;
  generatedAt: string;
  heroCatalog: Readonly<{ path: string; packetSha256: string; contentSha256: string; count: number }>;
  projection: Readonly<{ path: string; contentSha256: string; snapshotSha256: string; sourceLicense: string; citation: string }>;
  counts: Readonly<{ total: number; runtimeBaseline: number; candidateOnly: number; artReady: number; evidencePending: number }>;
  presentationBoundary: Readonly<{ runtimeWrites: boolean; scienceWrites: boolean; sourceIsSynthetic: boolean; textureMode: string }>;
  records: readonly HeroArtEvidenceRecordV615[];
}>;

export type HeroArtEvidenceFilterV615 = Readonly<{ query?: string; status?: HeroArtEvidenceRecordV615["status"]; artStatus?: HeroArtEvidenceStatusV615; blocker?: string }>;

export const HERO_ART_EVIDENCE_STATUSES_V615: readonly HeroArtEvidenceStatusV615[] = ["runtime-baseline", "candidate-presentation", "evidence-pending"];

export function heroArtEvidenceStatusLabelV615(status: HeroArtEvidenceStatusV615): string {
  return ({ "runtime-baseline": "运行时美术基线", "candidate-presentation": "候选展示就绪", "evidence-pending": "来源证据待补" } satisfies Record<HeroArtEvidenceStatusV615, string>)[status];
}

export function heroArtEvidenceStatusToneV615(status: HeroArtEvidenceStatusV615): "positive" | "neutral" | "warning" {
  if (status === "runtime-baseline") return "positive";
  if (status === "candidate-presentation") return "neutral";
  return "warning";
}

export function heroArtEvidenceIsSafeForPresentationV615(record: HeroArtEvidenceRecordV615): boolean {
  return record.source.presentationOnly
    && record.measurementAdmission === "not-admitted"
    && record.scientificPayloadWriteback === false
    && record.visualProfile.textureMode === "parameterized-photosphere"
    && Object.values(record.checks).every(Boolean);
}

export function heroArtEvidenceHasOpenGateV615(record: HeroArtEvidenceRecordV615): boolean {
  return record.artStatus === "evidence-pending" || record.blockers.length > 0 || record.runtimeAdmission !== "admitted";
}

export function filterHeroArtEvidenceV615(records: readonly HeroArtEvidenceRecordV615[], filter: HeroArtEvidenceFilterV615 = {}): readonly HeroArtEvidenceRecordV615[] {
  const needle = filter.query?.trim().toLocaleLowerCase() ?? "";
  return records.filter((record) => {
    if (filter.status && record.status !== filter.status) return false;
    if (filter.artStatus && record.artStatus !== filter.artStatus) return false;
    if (filter.blocker && !record.blockers.includes(filter.blocker)) return false;
    return !needle || [record.id, record.displayName, record.visualProfile.shaderProfile, record.visualProfile.coronaModel, ...record.blockers].join(" ").toLocaleLowerCase().includes(needle);
  });
}

export function summarizeHeroArtEvidenceV615(pack: HeroArtEvidencePackV615): Readonly<{ total: number; runtimeBaseline: number; candidateOnly: number; artReady: number; evidencePending: number; safePresentation: number; openGates: number }> {
  const safePresentation = pack.records.filter(heroArtEvidenceIsSafeForPresentationV615).length;
  return Object.freeze({ ...pack.counts, safePresentation, openGates: pack.records.filter(heroArtEvidenceHasOpenGateV615).length });
}

export function heroArtEvidenceSummaryLabelV615(summary: ReturnType<typeof summarizeHeroArtEvidenceV615>): string {
  return `${summary.runtimeBaseline}/${summary.total} runtime baseline · ${summary.candidateOnly} candidate-only · ${summary.evidencePending} evidence pending`;
}

export function heroArtEvidenceBlockerLabelsV615(record: HeroArtEvidenceRecordV615): readonly string[] {
  const labels: Record<string, string> = {
    "runtime-allowlist-closed": "运行时白名单关闭",
    "component-identity-ambiguous": "组件身份待确认",
    "positive-parallax-missing": "正视差待补",
    "upstream-reference-missing": "上游引用待补",
    "art-sourceReference-missing": "来源参考待补",
  };
  return Object.freeze(record.blockers.map((blocker) => labels[blocker] ?? blocker));
}

export function validateHeroArtEvidencePackV615(pack: HeroArtEvidencePackV615): HeroArtEvidencePackV615 {
  if (pack.schema !== "mainline-a-beta-hero-art-evidence-pack-v615" || pack.counts.total !== pack.records.length) throw new Error("hero art evidence pack shape invalid");
  if (pack.presentationBoundary.runtimeWrites || pack.presentationBoundary.scienceWrites || pack.presentationBoundary.sourceIsSynthetic) throw new Error("hero art evidence boundary invalid");
  for (const record of pack.records) {
    if (!record.id || !record.displayName || !HERO_ART_EVIDENCE_STATUSES_V615.includes(record.artStatus)) throw new Error(`hero art evidence record invalid: ${record.id}`);
    if (record.artStatus !== "evidence-pending" && !heroArtEvidenceIsSafeForPresentationV615(record)) throw new Error(`hero art evidence presentation unsafe: ${record.id}`);
  }
  return pack;
}

export function compareHeroArtEvidenceIdentityV615(left: HeroArtEvidenceRecordV615, right: HeroArtEvidenceRecordV615): boolean {
  return left.id === right.id && left.displayName === right.displayName && left.source.heroPacketSha256 === right.source.heroPacketSha256;
}

export function sortHeroArtEvidenceByGateV615(records: readonly HeroArtEvidenceRecordV615[]): readonly HeroArtEvidenceRecordV615[] {
  const order: Record<HeroArtEvidenceStatusV615, number> = { "evidence-pending": 0, "candidate-presentation": 1, "runtime-baseline": 2 };
  return Object.freeze([...records].sort((left, right) => order[left.artStatus] - order[right.artStatus] || left.displayName.localeCompare(right.displayName)));
}

const CHECK_LABELS_V615: Readonly<Record<string, string>> = {
  identity: "恒星身份",
  photometry: "温度半径光度",
  geometry: "形状参数",
  shader: "光球材质",
  corona: "日冕模型",
  presentationBoundary: "展示边界",
  sourceReference: "来源参考",
};

export function heroArtEvidenceCheckSummaryV615(record: HeroArtEvidenceRecordV615): readonly { key: string; label: string; passed: boolean }[] {
  return Object.freeze(Object.entries(record.checks).map(([key, passed]) => ({ key, label: CHECK_LABELS_V615[key] ?? key, passed })));
}

export function heroArtEvidenceVisualProfileLabelV615(record: HeroArtEvidenceRecordV615): string {
  const temperature = Math.round(record.visualProfile.temperatureK).toLocaleString("zh-CN");
  const radius = record.visualProfile.radiusSolar.toFixed(2);
  const luminosity = record.visualProfile.luminositySolar.toFixed(2);
  return `${temperature} K · R☉ ${radius} · L☉ ${luminosity} · ${record.visualProfile.shaderProfile}`;
}

export function partitionHeroArtEvidenceV615(records: readonly HeroArtEvidenceRecordV615[]): Readonly<{ baseline: readonly HeroArtEvidenceRecordV615[]; candidates: readonly HeroArtEvidenceRecordV615[]; pending: readonly HeroArtEvidenceRecordV615[] }> {
  return Object.freeze({
    baseline: Object.freeze(records.filter((record) => record.status === "runtime-baseline")),
    candidates: Object.freeze(records.filter((record) => record.status === "candidate-only")),
    pending: Object.freeze(records.filter((record) => record.artStatus === "evidence-pending")),
  });
}

export function heroArtEvidenceNextGateV615(record: HeroArtEvidenceRecordV615): string {
  if (record.blockers.includes("component-identity-ambiguous")) return "identity-review";
  if (record.blockers.some((blocker) => blocker.includes("parallax") || blocker.includes("reference"))) return "source-capture";
  if (record.blockers.includes("runtime-allowlist-closed")) return "runtime-signoff";
  return record.artStatus === "runtime-baseline" ? "complete" : "visual-signoff";
}

export function heroArtEvidenceRecordFingerprintV615(record: HeroArtEvidenceRecordV615): string {
  const checks = Object.entries(record.checks).sort(([left], [right]) => left.localeCompare(right)).map(([key, passed]) => `${key}:${passed ? "1" : "0"}`).join(",");
  return [record.id, record.source.heroPacketSha256, record.artStatus, record.runtimeAdmission, record.visualProfile.shaderProfile, checks, [...record.blockers].sort().join(",")].join("|");
}

export function heroArtEvidenceCountsConsistentV615(pack: HeroArtEvidencePackV615): boolean {
  const partition = partitionHeroArtEvidenceV615(pack.records);
  return pack.counts.total === pack.records.length
    && pack.counts.runtimeBaseline === partition.baseline.length
    && pack.counts.candidateOnly === partition.candidates.length
    && pack.counts.evidencePending === partition.pending.length
    && pack.counts.artReady + pack.counts.evidencePending === pack.counts.total;
}

export function heroArtEvidenceGateLabelV615(gate: string): string {
  return ({
    "identity-review": "身份复核",
    "source-capture": "来源捕获",
    "runtime-signoff": "运行时签核",
    "visual-signoff": "视觉签核",
    complete: "已完成",
  } as Record<string, string>)[gate] ?? gate;
}

export function heroArtEvidenceCheckPassRateV615(record: HeroArtEvidenceRecordV615): number {
  const checks = Object.values(record.checks);
  return checks.length === 0 ? 0 : Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export function heroArtEvidenceStatusOrderV615(status: HeroArtEvidenceStatusV615): number {
  return ({ "evidence-pending": 0, "candidate-presentation": 1, "runtime-baseline": 2 } as Record<HeroArtEvidenceStatusV615, number>)[status];
}
