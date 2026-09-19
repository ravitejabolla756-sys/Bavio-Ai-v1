import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Legacy route redirect: /dashboard/integrations/voice-pipeline -> /dashboard/phone-numbers
  if (
    pathname === "/dashboard/integrations/voice-pipeline" ||
    pathname === "/dashboard/integrations" ||
    pathname.startsWith("/dashboard/integrations/")
  ) {
    const phoneNumbersUrl = new URL(`${request.nextUrl.basePath || ""}/dashboard/phone-numbers`, request.url);
    return NextResponse.redirect(phoneNumbersUrl, 307);
  }

  const isAuthenticated = request.cookies.get("bavio_auth")?.value === "true";

  // Protect Workspace & Dashboard: must be authenticated
  if (pathname.startsWith("/workspace") || pathname.startsWith("/dashboard")) {
    if (!isAuthenticated) {
      const loginUrl = new URL(`${request.nextUrl.basePath || ""}/login`, request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/workspace/:path*", "/workspace"],
};
