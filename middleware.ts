import { clerkMiddleware, createRouteMatcher, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/cv-analysis(.*)",
  "/jobs(.*)",
  "/settings(.*)",
  "/saved-jobs(.*)",
  "/admin(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  // Onboarding gate — redirect non-onboarded users (D001: uses sessionClaims, not DB)
  const isOnboardingRoute = req.nextUrl.pathname.startsWith("/onboarding");
  if (isProtectedRoute(req) && !isOnboardingRoute) {
    const { sessionClaims } = await auth();
    const metadata = sessionClaims?.metadata as Record<string, unknown> | undefined;
    if (!metadata?.onboardingComplete) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
  }

  if (req.nextUrl.pathname.startsWith("/admin")) {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }

    // Fetch user from Clerk to check public_metadata.role
    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      const role = (user.publicMetadata as Record<string, unknown>)?.role;
      console.log('[ADMIN MIDDLEWARE] userId:', userId, 'role:', role);
      if (role !== "admin") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    } catch (err) {
      console.error('[ADMIN MIDDLEWARE] Error:', err);
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
