import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { InvitationsTable } from "@/components/invitations-table"
import { InviteUserDialog } from "@/components/invite-user-dialog"
import { Button } from "@/components/ui/button"
import { Mail } from "lucide-react"

export default async function InvitationsPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (!profile || (profile.role !== "super_admin" && profile.role !== "group_admin")) {
    redirect("/dashboard")
  }

  const { data: invitations } = await supabase
    .from("user_invitations")
    .select(`
      *,
      groups (
        id,
        name
      ),
      profiles:invited_by (
        email,
        full_name
      )
    `)
    .order("created_at", { ascending: false })

  const { data: groups } = await supabase.from("groups").select("id, name").order("name")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Invitations</h1>
          <p className="text-muted-foreground">Invite users to join groups</p>
        </div>
        <InviteUserDialog groups={groups || []} currentUserId={user.id}>
          <Button>
            <Mail className="mr-2 h-4 w-4" />
            Invite User
          </Button>
        </InviteUserDialog>
      </div>

      <InvitationsTable invitations={invitations || []} />
    </div>
  )
}
