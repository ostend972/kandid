import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
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

  if (req.nextUrl.pathname.startsWith("/admin")) {
    const { sessionClaims } = await auth();
    const metadata = sessionClaims?.metadata as Record<string, unknown> | undefined;
    if (metadata?.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
