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
  "/privacy", // Privacy policy
  "/terms", // Terms of service
  "/unsubscribe", // Email unsubscribe
];

// Routes that require auth but should bypass other checks
const onboardingRoutes = [
  "/choose-plan",
  "/free-templates", 
  "/payment-success",
  "/welcome",
];

// Add security headers to response
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");

  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Enable XSS filter
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // Control referrer information
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions policy - disable unnecessary browser features
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );

  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/stripe") ||
    pathname.startsWith("/api/admin") ||
    pathname.includes(".") // static files
  ) {
    return addSecurityHeaders(NextResponse.next());
  }

  // Check if route is public (exact match for "/" or startsWith for others)
  const isPublicRoute = publicRoutes.some((route) => 
    route === "/" ? pathname === "/" : pathname.startsWith(route)
  );

  // FORCE REDIRECT: Redirect Vercel preview domains to production for Auth consistency.
  // The 'State cookie was missing' error happens when users start on a preview URL
  // but are redirected to the production URL by NextAuth (due to NEXTAUTH_URL env var).
  // We force them to production immediately to ensure cookies are set on the correct domain.
  const host = request.headers.get("host") || "";
  if (
    process.env.NODE_ENV === "production" && 
    host.includes("vercel.app") && 
    !host.includes("localhost")
  ) {
    // Only redirect if we are sure we want to enforce production domain.
    // Assuming 'scribeandstem.com' is the canonical URL from the logs.
    const canonicalUrl = new URL(request.url);
    canonicalUrl.host = "scribeandstem.com";
    canonicalUrl.protocol = "https:";
    // console.log(`[MIDDLEWARE] Redirecting preview ${host} to canonical ${canonicalUrl.host}`);
    return NextResponse.redirect(canonicalUrl);
  }

  // Check authentication for protected routes
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // console.log(`[MIDDLEWARE] Path: ${pathname}, Token: ${token ? "Found" : "Missing"}`);

  // Special case: Redirect authenticated users from Landing Page to Planner
  if (pathname === "/" && token) {
    return NextResponse.redirect(new URL("/planner", request.url));
  }

  if (isPublicRoute) {
    return addSecurityHeaders(NextResponse.next());
  }

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Allow onboarding routes for authenticated users
  const isOnboardingRoute = onboardingRoutes.some((route) => pathname.startsWith(route));
  if (isOnboardingRoute) {
    return addSecurityHeaders(NextResponse.next());
  }

  // Check if user must change password
  if (token.mustChangePassword && pathname !== "/change-password") {
    return NextResponse.redirect(new URL("/change-password", request.url));
  }

  return addSecurityHeaders(NextResponse.next());
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
