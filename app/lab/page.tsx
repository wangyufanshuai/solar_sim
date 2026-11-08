import type { Metadata } from "next";
import Link from "next/link";
import lab from "../data/relativityLab.generated.json";

export const metadata: Metadata = {
  title: "相对论实验室 | Orbit Atlas",
  description: "数值相对论内核、Kerr 光线追踪与太阳系积分器的真实验证结果（只读）。",
};

// Read-only roadmap S5 page. Every number comes from app/data/relativityLab.generated.json,
// written by scripts/export-relativity-lab.mts from the recorded runs; nothing is recomputed here.

type Status = "pass" | "fail" | "open";

function Badge({ status, posthoc }: { status: Status; posthoc?: boolean }) {
  const label = status === "pass" ? "通过" : status === "fail" ? "未通过" : "未做";
  const tone = status === "pass" ? "border-emerald-300/40 text-emerald-200" : status === "fail" ? "border-rose-300/40 text-rose-200" : "border-slate-400/30 text-slate-300";
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className={`rounded border px-2 py-0.5 text-xs ${tone}`}>{label}</span>
      {posthoc ? <span className="rounded border border-amber-300/40 px-2 py-0.5 text-xs text-amber-200">判据在看过前一次结果后制定</span> : null}
    </span>
  );
}

const fmt = (x: number, digits = 3) => (Math.abs(x) < 1e-3 || Math.abs(x) >= 1e5 ? x.toExponential(digits - 1) : x.toFixed(digits));
const km = (x: number) => x.toLocaleString("zh-CN");

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-12 border-t border-white/10 pt-8">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-4 space-y-4 text-sm leading-7 text-slate-300">{children}</div>
    </section>
  );
}

function LogLogChart({ series, xs, xLabel }: { series: { label: string; ys: number[]; color: string }[]; xs: number[]; xLabel: string }) {
  const W = 420, H = 220, P = 36;
  const lx = xs.map(Math.log10);
  const all = series.flatMap((s) => s.ys.map(Math.log10));
  const [x0, x1] = [Math.min(...lx), Math.max(...lx)];
  const [y0, y1] = [Math.floor(Math.min(...all)), Math.ceil(Math.max(...all))];
  const px = (v: number) => P + ((v - x0) / (x1 - x0 || 1)) * (W - 2 * P);
  const py = (v: number) => H - P - ((v - y0) / (y1 - y0 || 1)) * (H - 2 * P);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-md" role="img" aria-label={`${xLabel} 对数坐标收敛图`}>
      <rect x={P} y={P / 2} width={W - 2 * P} height={H - 1.5 * P} fill="none" stroke="rgba(255,255,255,0.15)" />
      {Array.from({ length: y1 - y0 + 1 }, (_, i) => y0 + i).map((e) => (
        <text key={e} x={P - 6} y={py(e) + 4} fontSize="10" textAnchor="end" fill="#94a3b8">1e{e}</text>
      ))}
      {xs.map((x, i) => (
        <text key={x} x={px(lx[i])} y={H - P + 16} fontSize="10" textAnchor="middle" fill="#94a3b8">{x}</text>
      ))}
      <text x={W / 2} y={H - 4} fontSize="10" textAnchor="middle" fill="#94a3b8">{xLabel}</text>
      {series.map((s) => (
        <g key={s.label}>
          <polyline fill="none" stroke={s.color} strokeWidth="2" points={s.ys.map((y, i) => `${px(lx[i])},${py(Math.log10(y))}`).join(" ")} />
          {s.ys.map((y, i) => <circle key={i} cx={px(lx[i])} cy={py(Math.log10(y))} r="3" fill={s.color} />)}
        </g>
      ))}
    </svg>
  );
}

function GrowthChart({ series }: { series: { label: string; points: number[][]; color: string }[] }) {
  const W = 420, H = 200, P = 34;
  const xs = series.flatMap((s) => s.points.map((p) => p[0]));
  const ys = series.flatMap((s) => s.points.map((p) => p[1]));
  const xMax = Math.max(...xs), yMax = Math.ceil(Math.max(...ys, 10) / 10) * 10;
  const px = (v: number) => P + (v / xMax) * (W - 2 * P);
  const py = (v: number) => H - P - (v / yMax) * (H - 1.5 * P);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-md" role="img" aria-label="噪声增长倍数随时间">
      <rect x={P} y={P / 2} width={W - 2 * P} height={H - 1.5 * P} fill="none" stroke="rgba(255,255,255,0.15)" />
      <line x1={P} x2={W - P} y1={py(10)} y2={py(10)} stroke="#fda4af" strokeDasharray="4 4" />
      <text x={W - P} y={py(10) - 4} fontSize="10" textAnchor="end" fill="#fda4af">登记上限 10×</text>
      {[0, yMax / 2, yMax].map((v) => <text key={v} x={P - 6} y={py(v) + 4} fontSize="10" textAnchor="end" fill="#94a3b8">{v}×</text>)}
      <text x={W / 2} y={H - 6} fontSize="10" textAnchor="middle" fill="#94a3b8">穿越时间 t</text>
      {series.map((s) => (
        <polyline key={s.label} fill="none" stroke={s.color} strokeWidth="2" points={[[0, 1], ...s.points].map(([t, g]) => `${px(t)},${py(g)}`).join(" ")} />
      ))}
    </svg>
  );
}

export default function RelativityLabPage() {
  const { s1, s2, kerr, s4, sources } = lab;
  const kerrPass = kerr.configs.every((c) => c.statusAgreement >= 0.99 && c.redshiftMaxRelErr <= 1e-3);
  const bodies = ["mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune"] as const;
  const names: Record<string, string> = { mercury: "水星", venus: "金星", earth: "地球", mars: "火星", jupiter: "木星", saturn: "土星", uranus: "天王星", neptune: "海王星" };
  const current = s4.tenYearErrorKm.current as Record<string, number>;
  const iau = s4.tenYearErrorKm.iauSunGm as Record<string, number>;

  return (
    // html/body are overflow:hidden for the 3D atlas (globals.css), so this page scrolls itself.
    <main className="h-dvh overflow-y-auto bg-[#030613] px-5 py-10 text-slate-100 sm:px-10">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm text-cyan-200 hover:text-cyan-100">← 返回图谱</Link>
        <p className="mt-8 text-xs uppercase tracking-[0.24em] text-amber-200/70">Relativity Lab · 只读</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">相对论实验室</h1>
        <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
          这里展示的是已经实际运行过的验证结果，包括没通过的。页面不做任何计算；数据来自
          NR 内核仓库 {sources.nrRepository}（提交 {sources.nrCommit}）与本站提交 {sources.siteCommit} 的运行记录。
        </p>

        <section className="mt-10 overflow-x-auto rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-slate-400">
              <tr><th className="p-3">检验</th><th className="p-3">内容</th><th className="p-3">结果</th></tr>
            </thead>
            <tbody>
              <tr className="border-t border-white/10"><th className="p-3 font-medium">S1 浮点对齐</th><td className="p-3 text-slate-300">8³ 网格上真实 NumPy 程序对精确线性化</td><td className="p-3"><Badge status="fail" /> v1 · <Badge status={s1.v2.passed ? "pass" : "fail"} posthoc /> v2</td></tr>
              <tr className="border-t border-white/10"><th className="p-3 font-medium">S2 演化收敛</th><td className="p-3 text-slate-300">弱引力波对精确解，FD2/FD4/RK4</td><td className="p-3"><Badge status={s2.spatial.fd2.passed && s2.spatial.fd4.passed && s2.time.passed ? "pass" : "fail"} /></td></tr>
              <tr className="border-t border-white/10"><th className="p-3 font-medium">S2-c 稳健性</th><td className="p-3 text-slate-300">平直时空加 1e-10 噪声的长时间演化</td><td className="p-3"><Badge status="fail" /> 固定倍数 · <Badge status={s2.robustV2.passed ? "pass" : "fail"} posthoc /> 增长率</td></tr>
              <tr className="border-t border-white/10"><th className="p-3 font-medium">S3 物理案例</th><td className="p-3 text-slate-300">带解析参考的完整非线性实验</td><td className="p-3"><Badge status="open" /></td></tr>
              <tr className="border-t border-white/10"><th className="p-3 font-medium">Kerr 光线追踪</th><td className="p-3 text-slate-300">GPU 着色器对 float64 参考，逐像素</td><td className="p-3"><Badge status={kerrPass ? "pass" : "fail"} /></td></tr>
              <tr className="border-t border-white/10"><th className="p-3 font-medium">S4 水星近日点</th><td className="p-3 text-slate-300">EIH 1PN 的相对论进动</td><td className="p-3"><Badge status={s4.mercury.passed ? "pass" : "fail"} /></td></tr>
              <tr className="border-t border-white/10"><th className="p-3 font-medium">S4 行星位置</th><td className="p-3 text-slate-300">10 年后对 JPL Horizons 的位置误差</td><td className="p-3 text-slate-300">无门槛，见下方数据</td></tr>
            </tbody>
          </table>
        </section>

        <Section id="s1" title="S1 · 8³ 浮点对齐">
          <p>v1：{s1.v1.note}。按规则不能事后放宽阈值，所以 v1 记为未通过。</p>
          <p>
            v2 用 Richardson 外推 (16·C<sub>L</sub> − C<sub>H</sub>)/15 消去 ε² 项后判定。生产与复算两条路径各 482/482 次求值，
            注入错误 {s1.v2.negativeControlsDetected}/{s1.v2.negativeControls} 被检出。最差槽位比值：
            RHS {fmt(s1.v2.productionWorst.rhs)}、约束 {fmt(s1.v2.productionWorst.physical43)}、模态 {fmt(s1.v2.productionWorst.modal)}（≤ 1 为通过）。
            v2 是看过 v1 的结果之后才登记的，不是独立的预注册检验。两条路径共用同一套计算后端。
          </p>
        </Section>

        <Section id="s2" title="S2 · 演化收敛（对 AwA 线性 TT 波的精确解）">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <LogLogChart xLabel="网格点数 Nx" xs={s2.spatial.points} series={[
                { label: "FD2", ys: s2.spatial.fd2.errors, color: "#67e8f9" },
                { label: "FD4", ys: s2.spatial.fd4.errors, color: "#fcd34d" },
              ]} />
              <p className="text-xs text-slate-400"><span className="text-cyan-300">■ FD2</span> <span className="text-amber-300">■ FD4</span>。误差 ÷ 振幅。实测收敛阶 FD2 {s2.spatial.fd2.observed_orders.map((o) => o.toFixed(2)).join(" / ")}（理论 2），FD4 {s2.spatial.fd4.observed_orders.map((o) => o.toFixed(2)).join(" / ")}（理论 4）。</p>
            </div>
            <div>
              <LogLogChart xLabel="CFL（与 CFL 0.1 参考解之差）" xs={s2.time.cfls} series={[
                { label: "RK4", ys: s2.time.differences, color: "#c4b5fd" },
              ]} />
              <p className="text-xs text-slate-400">RK4 时间收敛阶 {s2.time.observed_orders.map((o) => o.toFixed(2)).join(" / ")}（理论 4）。</p>
            </div>
          </div>
        </Section>

        <Section id="s2c" title="S2-c · 稳健性">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <GrowthChart series={s2.robustRun01.series.map((s) => ({ label: `FD${s.order}`, points: s.samples, color: s.order === 2 ? "#67e8f9" : "#fcd34d" }))} />
              <p className="text-xs text-slate-400"><span className="text-cyan-300">■ FD2</span> <span className="text-amber-300">■ FD4</span>。第一次运行（8³，T = 10）：扰动最大放大 19.5×（FD2）和 34.6×（FD4），超过登记的 10×，记为未通过。</p>
            </div>
            <div className="space-y-2">
              <p>之后改用增长率判据（T = 100，后半段 ln N 斜率 ≤ 0.02，约束不增长），四组都通过：</p>
              <ul className="list-disc pl-5 text-slate-300">
                {Object.entries(s2.robustV2.runs).map(([name, run]) => {
                  const r = run as { late_log_slope: number; hamiltonian_growth: number };
                  return <li key={name}>{name}：斜率 {r.late_log_slope.toFixed(4)}，约束 {fmt(r.hamiltonian_growth, 2)}×</li>;
                })}
              </ul>
              <p className="text-slate-400">局限：lapse 在 100 个穿越时间里线性增长（每个穿越时间约 0.26×），增长率判据挡不住线性增长，所以“有界”尚未证明。</p>
            </div>
          </div>
        </Section>

        <Section id="kerr" title="Kerr 黑洞 · 逐像素光线追踪">
          <p>GPU（{kerr.renderer}）对 float64 Dormand–Prince 参考，128×128 像素：</p>
          <ul className="list-disc pl-5">
            {kerr.configs.map((c) => (
              <li key={c.config}>{c.config}：分类一致 {(c.statusAgreement * 100).toFixed(3)}%，红移最大相对误差 {fmt(c.redshiftMaxRelErr)}</li>
            ))}
          </ul>
          <p>帧时间（Cinematic，中位数）：{kerr.benchmark.map((b) => `${b.w}×${b.h} ${b.medianMs.toFixed(1)} ms`).join("，")}。原生 1080p 达不到 60 fps，交互时以半分辨率追踪。</p>
          <p className="text-slate-400">模型范围：真空 Kerr、几何薄、不透明的 Novikov–Thorne 盘，静止相机。不是 GRMHD。</p>
        </Section>

        <Section id="s4" title="S4 · 太阳系积分器对 JPL Horizons">
          <p>
            水星近日点的相对论进动（EIH − 牛顿，100 年）：<b>{s4.mercury.measuredGrArcsecPerCentury.toFixed(3)}″/世纪</b>，
            广义相对论预测 {s4.mercury.predictedArcsecPerCentury.toFixed(3)}″/世纪，相对差 {fmt(s4.mercury.relativeError, 2)}。
          </p>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="text-xs text-slate-400"><tr><th className="p-2">天体</th><th className="p-2">10 年位置误差（当前）</th><th className="p-2">改用 IAU GM☉ 后</th></tr></thead>
              <tbody>
                {bodies.map((b) => (
                  <tr key={b} className="border-t border-white/10"><td className="p-2">{names[b]}</td><td className="p-2">{km(current[b])} km</td><td className="p-2">{km(iau[b])} km</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-slate-400">当前误差主要来自太阳引力参数取 G × 质量，与 IAU 的 GM☉ 相差 2.2×10⁻⁵；右栏是只改这一项的诊断运行，应用尚未修改。</p>
        </Section>

        <Section id="open" title="尚未做的">
          <ul className="list-disc pl-5">
            <li>S3：带解析参考的非线性物理案例（需要调和切片等）。</li>
            <li>黑洞时空演化、自适应网格、引力波波形、双黑洞。</li>
            <li>稳健性的有界性证明；物理边界条件。</li>
          </ul>
        </Section>

        <Section id="reproduce" title="复现">
          <pre className="overflow-x-auto rounded-lg bg-black/40 p-4 text-xs text-slate-300">{`# solar-sim-nr
python experiments/case12_binary64_variants/prepare_startup2g.py
python experiments/case12_binary64_variants/prepare_v2_richardson.py
python -B -m experiments.s2_periodic_evolution.run_s2 spatial --order 4 --out outputs/s2
python -B -m experiments.s2_periodic_evolution.robust_v2 outputs/s2c
# 本站
npx tsx scripts/kerr-v4/validate.mts
npx tsx scripts/s4-horizons-error.mts
npx tsx scripts/export-relativity-lab.mts`}</pre>
        </Section>
      </div>
    </main>
  );
}
