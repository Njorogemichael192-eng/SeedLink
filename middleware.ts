import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/", // landing page
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/public(.*)",
  "/posts(.*)",
]);

export default clerkMiddleware((auth, req) => {
  // Handle forwarded headers for dev environment
  const forwarded = req.headers.get('x-forwarded-host');
  const host = req.headers.get('host');
  
  if (isPublicRoute(req)) return;
  auth.protect();
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
