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
  title: "Universe Sandbox Replica",
  description: "High-fidelity solar system sandbox built with React Three Fiber",
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
