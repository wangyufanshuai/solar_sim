import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * 单页仿真：误把说明文字粘进地址栏（含中文/全角符号）会得到怪路径。
 * 将非资源路径重定向到 `/`，避免浏览器报「无效响应」或困惑的 404。
 */
export function middleware(request: NextRequest) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return NextResponse.next();
  }
  const { pathname } = request.nextUrl;
  if (pathname === "/") return NextResponse.next();
  if (pathname.startsWith("/_next")) return NextResponse.next();
  if (pathname.startsWith("/textures")) return NextResponse.next();
  if (pathname === "/favicon.ico") return NextResponse.next();
  // 常见静态扩展名（public / 未来资源）
  if (/\.[a-zA-Z0-9]{1,10}$/.test(pathname)) {
    return NextResponse.next();
  }
  const url = request.nextUrl.clone();
  url.pathname = "/";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
