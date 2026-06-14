import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAuthenticated = request.cookies.get("bavio_auth")?.value === "true";
  const isOnboardingComplete = request.cookies.get("bavio_onboarding_completed")?.value === "true";

  // 1. Protect Workspace & Dashboard: must be authenticated and onboarding completed
  if (pathname.startsWith("/workspace") || pathname.startsWith("/dashboard")) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (!isOnboardingComplete) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
  }

  // 2. Protect Onboarding: must be authenticated and onboarding NOT completed
  if (pathname.startsWith("/onboarding")) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    // If onboarding is already complete, redirect to workspace
    if (isOnboardingComplete) {
      return NextResponse.redirect(new URL("/workspace", request.url));
    }
  }

  // 3. Prevent logged-in users from seeing /login page
  if (pathname === "/login") {
    if (isAuthenticated) {
      if (isOnboardingComplete) {
        return NextResponse.redirect(new URL("/workspace", request.url));
      } else {
        return NextResponse.redirect(new URL("/onboarding", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/workspace/:path*", "/workspace", "/onboarding/:path*", "/login"],
};
