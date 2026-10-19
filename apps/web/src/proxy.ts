import type { NextRequest } from "next/server";
import { auth0 } from "@/lib/auth0";

// Mounts /auth/login, /auth/logout, /auth/callback and /auth/profile, and keeps
// the session cookie rolling. Pages still check the session themselves.
export async function proxy(request: NextRequest) {
  return await auth0.middleware(request);
}

export const config = {
  // Skip static files (public/ assets) so they don't decrypt/re-set the session cookie.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};
