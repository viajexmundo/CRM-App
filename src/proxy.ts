import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";
import { hasRouteAccess } from "@/lib/constants/roles";
import type { Role } from "@/types";

const { auth } = NextAuth(authConfig);

const publicPaths = ["/login", "/api/auth"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Allow public paths
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const user = req.auth?.user;

  // Redirect unauthenticated users to login
  if (!user) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // RBAC check
  const role = user.role as Role;
  if (!hasRouteAccess(role, pathname)) {
    const dashboardUrl = new URL("/dashboard", req.nextUrl.origin);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/contactos/:path*",
    "/leads/:path*",
    "/oportunidades/:path*",
    "/calendario/:path*",
    "/casos/:path*",
    "/reportes/:path*",
    "/coaching/:path*",
    "/configuracion/:path*",
  ],
};
