import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Routes that don't require authentication
const publicRoutes = [
  "/",
  "/login", 
  "/register",
  "/forgot-password", 
  "/reset-password",
  "/rsvp", // Public RSVP forms
];

// Routes that require auth but should bypass other checks
const onboardingRoutes = [
  "/choose-plan",
  "/free-templates", 
  "/payment-success",
  "/welcome",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/stripe") ||
    pathname.includes(".") // static files
  ) {
    return NextResponse.next();
  }

  // Check if route is public (exact match for "/" or startsWith for others)
  const isPublicRoute = publicRoutes.some((route) => 
    route === "/" ? pathname === "/" : pathname.startsWith(route)
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check authentication for protected routes
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Allow onboarding routes for authenticated users
  const isOnboardingRoute = onboardingRoutes.some((route) => pathname.startsWith(route));
  if (isOnboardingRoute) {
    return NextResponse.next();
  }

  // Check if user must change password
  if (token.mustChangePassword && pathname !== "/change-password") {
    return NextResponse.redirect(new URL("/change-password", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
