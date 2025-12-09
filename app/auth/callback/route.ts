import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

/**
 * Auth callback route handler
 * Supabase redirects here after user clicks the magic link
 * Exchanges the OTP code for JWT tokens and sets them in cookies
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/auth/confirm-email"

  if (code) {
    const supabase = await createClient()

    /**
     * exchangeCodeForSession validates the OTP and creates a session
     * JWT tokens (access + refresh) are automatically stored in HTTP-only cookies
     */
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && sessionData?.user) {
      const adminClient = await createAdminClient()
      const userEmail = sessionData.user.email

      if (userEmail) {
        const { data: profile } = await adminClient
          .from("profiles")
          .select("email_verified")
          .eq("id", sessionData.user.id)
          .single()

        // Find pending invitation for this email (case-insensitive)
        const { data: invitation } = await adminClient
          .from("user_invitations")
          .select("*")
          .ilike("email", userEmail)
          .is("used_at", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

        if (invitation) {
          // Update profile with role from invitation
          await adminClient.from("profiles").update({ role: invitation.role }).eq("id", sessionData.user.id)

          // If invitation has a group_id, activate or create the group membership
          if (invitation.group_id) {
            // Also check is_deleted to not activate deleted memberships
            const { data: existingMember } = await adminClient
              .from("group_members")
              .select("id, is_active, is_deleted, user_id")
              .eq("group_id", invitation.group_id)
              .eq("is_deleted", false)
              .or(`pending_user_id.eq.${invitation.id},user_id.eq.${sessionData.user.id}`)
              .limit(1)
              .single()

            if (existingMember) {
              if (!existingMember.is_active || !existingMember.user_id) {
                await adminClient
                  .from("group_members")
                  .update({
                    is_active: true,
                    user_id: sessionData.user.id,
                    pending_user_id: null,
                  })
                  .eq("id", existingMember.id)
              }
            } else {
              // No existing membership found, create a new active one
              await adminClient.from("group_members").insert({
                user_id: sessionData.user.id,
                group_id: invitation.group_id,
                is_admin: invitation.role === "group_admin",
                is_active: true,
              })
            }
          }

          // Mark invitation as used
          await adminClient
            .from("user_invitations")
            .update({ used_at: new Date().toISOString() })
            .eq("id", invitation.id)
        }

        const redirectPath = profile?.email_verified ? "/dashboard" : "/auth/confirm-email"

        const forwardedHost = request.headers.get("x-forwarded-host")
        const isLocalEnv = process.env.NODE_ENV === "development"

        if (isLocalEnv) {
          return NextResponse.redirect(`${origin}${redirectPath}`)
        } else if (forwardedHost) {
          return NextResponse.redirect(`https://${forwardedHost}${redirectPath}`)
        } else {
          return NextResponse.redirect(`${origin}${redirectPath}`)
        }
      }
    }
  }

  // Redirect to error page if something went wrong
  return NextResponse.redirect(`${origin}/auth/error`)
}
