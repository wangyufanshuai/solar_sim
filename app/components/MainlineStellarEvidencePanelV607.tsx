import type { ProvenanceV607, StellarEvidenceV607, StellarReferenceQuantityV607 } from "../lib/celestialObjectContractV607";

function quantityText(quantity: StellarReferenceQuantityV607) {
  const value = quantity.value.toLocaleString("zh-CN", { maximumSignificantDigits: 5 });
  const uncertainty = quantity.uncertainty;
  if (uncertainty.status === "not-provided") return `${value} ${quantity.unit}（误差未提供）`;
  const plus = uncertainty.plus.toLocaleString("zh-CN", { maximumSignificantDigits: 3 });
  const minus = uncertainty.minus.toLocaleString("zh-CN", { maximumSignificantDigits: 3 });
  return uncertainty.plus === uncertainty.minus
    ? `${value} ± ${plus} ${quantity.unit}`
    : `${value} +${plus} / −${minus} ${quantity.unit}`;
}

function ReferenceQuantity({ quantity, sources }: { quantity: StellarReferenceQuantityV607; sources: readonly ProvenanceV607[] }) {
  const source = sources.find((item) => item.sourceId === quantity.sourceId);
  return <div data-mainline-a-stellar-reference={quantity.id} data-mainline-a-uncertainty-status={quantity.uncertainty.status}>
    <dt className="text-cyan-50/78">{quantity.labelCn}</dt>
    <dd className="mt-0.5 tabular-nums">{quantityText(quantity)}</dd>
    <dd className="mt-0.5 text-[9px] leading-4 text-cyan-50/45">{quantity.noteCn}</dd>
    {source ? <dd><a href={source.sourceUrl} target="_blank" rel="noreferrer" className="text-[9px] text-cyan-100/60 underline underline-offset-2">查看{quantity.sourceId === "simbad-stellar-reference" ? "SIMBAD 对象资料" : "原文模型表"}</a></dd> : null}
  </div>;
}

export default function MainlineStellarEvidencePanelV607({ evidence }: { evidence: StellarEvidenceV607 }) {
  const association = evidence.gaiaAssociation;
  const distance = evidence.referenceDistance;
  const upstream = evidence.sources.find((source) => source.sourceId === distance.upstreamSourceId);
  return <section className="mt-2 rounded border border-cyan-100/12 bg-cyan-100/[0.025] px-2 py-2 text-[10px] leading-4 text-cyan-50/65" data-mainline-a-stellar-uncertainty="true" data-mainline-a-uncertainty-confidence-level="not-recorded" aria-label="恒星资料来源与不确定性">
    <h4 className="text-cyan-50/85">资料来源与不确定性</h4>
    <p className="mt-1" data-mainline-a-gaia-association={association.status}>
      Gaia 关联：{association.status === "positional-candidate" ? "位置候选" : "渲染锚点"} · 角距 {association.angularSeparationArcsec.toLocaleString("zh-CN", { maximumFractionDigits: 2 })}″
    </p>
    <p className="mt-1 text-cyan-50/50">{association.noteCn}</p>
    <p className="mt-1 text-cyan-50/50">Gaia 测光误差未记录；不能据此给具名恒星添加误差条。</p>
    <dl className="mt-2 grid gap-2">
      <ReferenceQuantity quantity={distance} sources={evidence.sources} />
    </dl>
    <p className="mt-1 break-words text-[9px] text-cyan-50/48">SIMBAD {distance.simbadIdentifier} · ϖ = {distance.parallaxMas.toLocaleString("zh-CN", { maximumSignificantDigits: 5 })} ± {distance.parallaxErrorMas.toLocaleString("zh-CN", { maximumSignificantDigits: 3 })} mas</p>
    {upstream ? <a href={upstream.sourceUrl} target="_blank" rel="noreferrer" className="text-[9px] text-cyan-100/60 underline underline-offset-2">上游文献：{distance.upstreamBibcode}</a> : null}
    {evidence.literatureModel.length ? <details className="mt-2 border-t border-cyan-100/10 pt-1" data-mainline-a-stellar-literature="true">
      <summary className="cursor-pointer text-cyan-50/65">文献模型参考 · {evidence.literatureModel.length} 项参数</summary>
      <dl className="mt-2 grid gap-2">{evidence.literatureModel.map((quantity) => <ReferenceQuantity key={quantity.id} quantity={quantity} sources={evidence.sources} />)}</dl>
    </details> : null}
    <p className="mt-2 text-[9px] text-cyan-50/45">± 与上下误差表示原资料误差或一阶传播量；封存资料未记录置信水平，不能解读为 95% 置信区间。</p>
    <details className="mt-2 border-t border-cyan-100/10 pt-1">
      <summary className="cursor-pointer text-cyan-50/65">当前肖像参数：{evidence.modelUncertainties.length} 项误差未提供</summary>
      <ul className="mt-1 grid gap-1">
        {evidence.modelUncertainties.map((item) => <li key={item.field} data-mainline-a-stellar-missing-uncertainty={item.field} className="text-[9px] text-cyan-50/48">{item.labelCn}：未提供。{item.noteCn}</li>)}
      </ul>
    </details>
    <p className="mt-2 text-[9px] text-cyan-50/40">参考资料封存于 {evidence.sources[0]?.retrievedAt.slice(0, 10)}；在线来源页可能已有更新。</p>
  </section>;
}
