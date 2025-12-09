import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

/**
 * Middleware helper that handles JWT token refresh automatically
 * This keeps the session alive by refreshing tokens before they expire
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  // IMPORTANT: getUser() validates the JWT and refreshes tokens if needed
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect all routes except login and auth callback
  if (!user && !request.nextUrl.pathname.startsWith("/login") && !request.nextUrl.pathname.startsWith("/auth")) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  if (
    user &&
    !request.nextUrl.pathname.startsWith("/auth") &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/api")
  ) {
    // Check if email is verified
    const { data: profile } = await supabase.from("profiles").select("email_verified").eq("id", user.id).single()

    // If email not verified, redirect to confirm-email page
    if (!profile?.email_verified) {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/confirm-email"
      return NextResponse.redirect(url)
    }
  }

  // Redirect to dashboard if already logged in and trying to access login
  if (user && request.nextUrl.pathname === "/login") {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
