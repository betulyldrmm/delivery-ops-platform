import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ROLE_HOME } from "./lib/role-home";

const TOKEN_COOKIE = "ops_token";
const ROLE_COOKIE = "ops_role";
const LEGACY_TOKEN_COOKIE = "token";
const LEGACY_ROLE_COOKIE = "role";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/public")
  ) {
    return NextResponse.next();
  }

  const tokenCookie = req.cookies.get(TOKEN_COOKIE)?.value;
  const roleCookie = req.cookies.get(ROLE_COOKIE)?.value;
  const legacyToken = req.cookies.get(LEGACY_TOKEN_COOKIE)?.value;
  const legacyRole = req.cookies.get(LEGACY_ROLE_COOKIE)?.value;
  const token = tokenCookie ?? legacyToken;
  const role = roleCookie ?? legacyRole;

  function applyLegacyMigration(response: NextResponse) {
    if (legacyToken && !tokenCookie) {
      response.cookies.set(TOKEN_COOKIE, legacyToken, { path: "/", sameSite: "lax" });
    }
    if (legacyRole && !roleCookie) {
      response.cookies.set(ROLE_COOKIE, legacyRole, { path: "/", sameSite: "lax" });
    }
    if (legacyToken) response.cookies.delete(LEGACY_TOKEN_COOKIE);
    if (legacyRole) response.cookies.delete(LEGACY_ROLE_COOKIE);
    return response;
  }

  function redirectTo(targetPath: string) {
    const url = req.nextUrl.clone();
    url.pathname = targetPath;
    return applyLegacyMigration(NextResponse.redirect(url));
  }

  if (pathname === "/login") return applyLegacyMigration(NextResponse.next());

  if (!token) {
    return redirectTo("/login");
  }

  if (!role) {
    return redirectTo("/login");
  }

  if (process.env.NODE_ENV !== "production") {
    console.log("[middleware] path", pathname, "token", Boolean(token), "role", role);
  }

  if (pathname === "/") {
    return redirectTo(ROLE_HOME[role] || "/login");
  }

  if (pathname.startsWith("/customer") && role !== "CUSTOMER") {
    return redirectTo(ROLE_HOME[role] || "/login");
  }

  if (pathname.startsWith("/ops") && role !== "OPS" && role !== "ADMIN") {
    return redirectTo(ROLE_HOME[role] || "/login");
  }

  if (pathname.startsWith("/courier") && role !== "COURIER") {
    return redirectTo(ROLE_HOME[role] || "/login");
  }

  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return redirectTo(ROLE_HOME[role] || "/login");
  }

  return applyLegacyMigration(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
