import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { GroupsTable } from "@/components/groups-table"
import { CreateGroupDialog } from "@/components/create-group-dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default async function GroupsPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get user profile with role
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (!profile || (profile.role !== "super_admin" && profile.role !== "group_admin")) {
    redirect("/dashboard")
  }

  // Fetch groups based on role
  const groupsQuery = supabase
    .from("groups")
    .select(`
      *,
      group_members(count)
    `)
    .order("created_at", { ascending: false })

  const { data: groups, error } = await groupsQuery

  if (error) {
    console.error("[v0] Error fetching groups:", error)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Groups</h1>
          <p className="text-muted-foreground">Manage groups and their members</p>
        </div>
        {profile.role === "super_admin" && (
          <CreateGroupDialog>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Group
            </Button>
          </CreateGroupDialog>
        )}
      </div>

      <GroupsTable groups={groups || []} userRole={profile.role} />
    </div>
  )
}
