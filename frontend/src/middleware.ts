import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAuthenticated = request.cookies.get("bavio_auth")?.value === "true";

  // 1. Protect Workspace & Dashboard: must be authenticated
  if (pathname.startsWith("/workspace") || pathname.startsWith("/dashboard")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Prevent already logged-in users from seeing /login page
  if (pathname === "/login") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/workspace", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/workspace/:path*", "/workspace", "/login"],
};
