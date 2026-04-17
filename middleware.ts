import { clerkMiddleware, createRouteMatcher, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { verifyBridgeCookie } from "@/lib/bridge-cookie";

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

  const isOnboardingRoute = req.nextUrl.pathname.startsWith("/onboarding");
  if (isProtectedRoute(req) && !isOnboardingRoute) {
    const { sessionClaims, userId } = await auth();
    const metadata = sessionClaims?.metadata as Record<string, unknown> | undefined;
    const cookieValue = req.cookies.get("onboarding_complete")?.value;
    const hasBridgeCookie = userId && cookieValue ? await verifyBridgeCookie(cookieValue, userId) : false;
    if (!metadata?.onboardingComplete && !hasBridgeCookie) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
  }

  if (req.nextUrl.pathname.startsWith("/admin")) {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }

    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      const role = (user.publicMetadata as Record<string, unknown>)?.role;
      if (role !== "admin") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
