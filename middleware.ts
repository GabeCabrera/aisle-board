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
  
  // Permissions policy
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
    pathname.startsWith("/api/manage-x7k9") ||
    pathname.includes(".") // static files
  ) {
    return addSecurityHeaders(NextResponse.next());
  }

  // Check if route is public (exact match for "/" or startsWith for others)
  const isPublicRoute = publicRoutes.some((route) => 
    route === "/" ? pathname === "/" : pathname.startsWith(route)
  );

  if (isPublicRoute) {
    return addSecurityHeaders(NextResponse.next());
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
