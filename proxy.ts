import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  ATLAS_DESKTOP_BOOTSTRAP_QUERY,
  ATLAS_DESKTOP_SESSION_COOKIE,
  ATLAS_DESKTOP_SESSION_MAX_AGE_SECONDS,
  atlasDesktopSecretMatches,
  atlasDesktopSessionMatches,
  atlasDesktopSessionValue,
  configuredAtlasDesktopToken,
} from "./app/lib/atlasDesktopSession";

function desktopNotFound() {
  return new NextResponse(null, {
    status: 404,
    headers: { "Cache-Control": "no-store" },
  });
}

function authorizeDesktopRequest(request: NextRequest): NextResponse | null {
  const runtimeToken = configuredAtlasDesktopToken();
  if (!runtimeToken) return null;

  const bootstrapToken = request.nextUrl.searchParams.get(ATLAS_DESKTOP_BOOTSTRAP_QUERY);
  if (bootstrapToken !== null) {
    const isInitialNavigation = request.nextUrl.pathname === "/" &&
      (request.method === "GET" || request.method === "HEAD");
    if (!isInitialNavigation || !atlasDesktopSecretMatches(bootstrapToken, runtimeToken)) {
      return desktopNotFound();
    }
    const cleanUrl = request.nextUrl.clone();
    cleanUrl.searchParams.delete(ATLAS_DESKTOP_BOOTSTRAP_QUERY);
    const response = NextResponse.redirect(cleanUrl, 303);
    response.headers.set("Cache-Control", "no-store");
    response.cookies.set({
      name: ATLAS_DESKTOP_SESSION_COOKIE,
      value: atlasDesktopSessionValue(runtimeToken),
      httpOnly: true,
      sameSite: "strict",
      secure: false,
      path: "/",
      maxAge: ATLAS_DESKTOP_SESSION_MAX_AGE_SECONDS,
    });
    return response;
  }

  const sessionCookie = request.cookies.get(ATLAS_DESKTOP_SESSION_COOKIE)?.value ?? null;
  return atlasDesktopSessionMatches(sessionCookie, runtimeToken) ? null : desktopNotFound();
}

/**
 * Redirect non-resource SPA paths back to the Atlas entry route while leaving
 * APIs, Next assets, textures and ordinary public files untouched.
 */
export function proxy(request: NextRequest) {
  const desktopAuthorization = authorizeDesktopRequest(request);
  if (desktopAuthorization) return desktopAuthorization;
  if (request.method !== "GET" && request.method !== "HEAD") {
    return NextResponse.next();
  }
  const { pathname } = request.nextUrl;
  if (pathname === "/") return NextResponse.next();
  if (pathname === "/downloads") return NextResponse.next();
  if (pathname.startsWith("/api/")) return NextResponse.next();
  if (pathname.startsWith("/_next")) return NextResponse.next();
  if (pathname.startsWith("/textures")) return NextResponse.next();
  if (pathname === "/favicon.ico") return NextResponse.next();
  if (/\.[a-zA-Z0-9]{1,10}$/.test(pathname)) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = "/";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
