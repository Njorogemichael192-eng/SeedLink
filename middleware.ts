import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/", // landing page
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/public(.*)",
  "/posts(.*)",
]);

export default clerkMiddleware((auth, req) => {
  if (isPublicRoute(req)) return;

  // In development, don't globally protect via middleware.
  // Individual routes/pages (e.g. /dashboard) still call auth() themselves.
  if (process.env.NODE_ENV === "development") {
    return;
  }

  auth.protect();
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
