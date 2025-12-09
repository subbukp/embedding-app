import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AcceptInviteForm } from "@/components/accept-invite-form"

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: { token?: string }
}) {
  const token = searchParams.token

  if (!token) {
    redirect("/login")
  }

  const supabase = await createServerClient()

  const { data: invitation, error } = await supabase
    .from("user_invitations")
    .select(`
      *,
      groups (
        id,
        name
      )
    `)
    .eq("token", token)
    .is("used_at", null)
    .single()

  if (error || !invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <h1 className="text-2xl font-bold">Invalid Invitation</h1>
          <p className="text-muted-foreground">This invitation link is invalid or has already been used.</p>
        </div>
      </div>
    )
  }

  const isExpired = new Date(invitation.expires_at) < new Date()

  if (isExpired) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <h1 className="text-2xl font-bold">Invitation Expired</h1>
          <p className="text-muted-foreground">
            This invitation has expired. Please contact your administrator for a new invitation.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <AcceptInviteForm invitation={invitation} />
    </div>
  )
}
