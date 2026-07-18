import type { Metadata } from "next";
import { createAtlasReleaseManifestV1 } from "../lib/atlasReleaseManifestV1";

export const metadata: Metadata = {
  title: "下载与能力矩阵 | Orbit Atlas",
  description: "Orbit Atlas Lite、Standalone Full、内容包和 Windows 桌面 Beta 的下载与校验信息。",
};

const manifest = createAtlasReleaseManifestV1({
  downloadOrigin: process.env.ATLAS_PUBLIC_DOWNLOAD_ORIGIN,
});

function availability(value: boolean) {
  return value ? "可用" : "—";
}

export default function DownloadsPage() {
  return (
    <main className="min-h-dvh bg-[#030613] px-5 py-10 text-slate-100 sm:px-10">
      <div className="mx-auto max-w-5xl">
        <a href="/" className="text-sm text-cyan-200 hover:text-cyan-100">← 返回图谱</a>
        <p className="mt-8 text-xs uppercase tracking-[0.24em] text-amber-200/70">Orbit Atlas 1.0.0</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">下载与能力矩阵</h1>
        <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
          Lite 是公开 Web 门户；Standalone Full 与桌面 Beta 通过版本化内容包提供完整数据。默认科学内核始终为 legacy-eih-1pn，候选相对论模型仅作为 shadow 研究证据。
        </p>

        <section className="mt-10 overflow-x-auto rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-slate-400">
              <tr><th className="p-3">能力</th><th className="p-3">Web Lite</th><th className="p-3">Standalone</th><th className="p-3">Desktop Beta</th></tr>
            </thead>
            <tbody>
              {manifest.capabilities.map((capability) => (
                <tr key={capability.id} className="border-t border-white/10">
                  <th className="p-3 font-medium text-slate-200">{capability.label}</th>
                  <td className="p-3 text-slate-300">{availability(capability.vercelLite)}</td>
                  <td className="p-3 text-slate-300">{availability(capability.standaloneFull)}</td>
                  <td className="p-3 text-slate-300">{availability(capability.desktopBeta)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mt-10 grid gap-3 sm:grid-cols-2">
          {manifest.artifacts.map((artifact) => (
            <article key={artifact.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-xs uppercase tracking-wider text-cyan-200/70">{artifact.profile}</p>
              <h2 className="mt-2 text-base font-medium">{artifact.label}</h2>
              <p className="mt-3 text-xs leading-5 text-slate-400">
                {artifact.status === "published" ? "已发布并锁定 SHA-256" : "等待 v232 最终构建与 OSS 上传"}
              </p>
              {artifact.status === "published" ? (
                <a className="mt-4 inline-flex min-h-10 items-center text-sm text-amber-200 hover:text-amber-100" href={artifact.url}>下载</a>
              ) : null}
            </article>
          ))}
        </section>

        <p className="mt-10 border-l-2 border-amber-200/50 pl-4 text-sm leading-6 text-slate-400">
          发布文件只允许写入不可变版本路径。若页面未显示 SHA-256，则该产物尚未获得 GA/Beta 发布资格。
        </p>
      </div>
    </main>
  );
}
