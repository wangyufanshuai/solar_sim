import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Orbit Atlas 相对论宇宙图谱",
    short_name: "Orbit Atlas",
    description: "科学电影感天文图谱、轨道模拟与可复核相对论研究工作台。",
    start_url: "/",
    display: "standalone",
    background_color: "#030613",
    theme_color: "#030613",
    lang: "zh-CN",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
