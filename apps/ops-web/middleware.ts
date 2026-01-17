import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ROLE_HOME: Record<string, string> = {
  CUSTOMER: "/customer",
  OPS: "/ops",
  ADMIN: "/admin"
};

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/public")
  ) {
    return NextResponse.next();
  }

  if (pathname === "/login") return NextResponse.next();

  const token = req.cookies.get("token")?.value;
  const role = req.cookies.get("role")?.value;

  if (!token || !role) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = ROLE_HOME[role] || "/login";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/customer") && role !== "CUSTOMER") {
    const url = req.nextUrl.clone();
    url.pathname = ROLE_HOME[role] || "/login";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/ops") && role !== "OPS" && role !== "ADMIN") {
    const url = req.nextUrl.clone();
    url.pathname = ROLE_HOME[role] || "/login";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    const url = req.nextUrl.clone();
    url.pathname = ROLE_HOME[role] || "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
