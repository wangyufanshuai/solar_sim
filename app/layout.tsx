import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const inter = localFont({
  src: "../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
  display: "swap",
  weight: "100 900",
  style: "normal",
});

const jetbrainsMono = localFont({
  src: "../node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2",
  display: "swap",
  weight: "100 800",
  style: "normal",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://solar.wangyufan.xyz"),
  title: "Orbit Atlas | 相对论宇宙图谱",
  description: "离线天文数据、轨道模拟、恒星肖像与可复核相对论实验图谱。",
  applicationName: "Orbit Atlas",
  manifest: "/manifest.webmanifest",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: "/",
    siteName: "Orbit Atlas",
    title: "Orbit Atlas | 相对论宇宙图谱",
    description: "科学电影感天文图谱、轨道模拟与可复核相对论研究工作台。",
  },
  twitter: {
    card: "summary",
    title: "Orbit Atlas | 相对论宇宙图谱",
    description: "科学电影感天文图谱、轨道模拟与可复核相对论研究工作台。",
  },
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={jetbrainsMono.variable}>
      <body
        className={`${inter.className} antialiased`}
        style={{
          margin: 0,
          minHeight: "100dvh",
          backgroundColor: "#030613",
        }}
      >
        {children}
      </body>
    </html>
  );
}
