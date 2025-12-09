import { updateSession } from "@/lib/supabase/middleware"
import type { NextRequest } from "next/server"

/**
 * Middleware runs on every request to:
 * 1. Validate JWT tokens in cookies
 * 2. Refresh tokens automatically before expiry
 * 3. Protect routes - redirect to login if no valid session
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
