import { getAllUsers, getCurrentUser } from "@/lib/supabase/queries"
import { createServerClient } from "@/lib/supabase/server"
import { UsersTable } from "@/components/users-table"
import { InviteUserDialog } from "@/components/invite-user-dialog"
import { Button } from "@/components/ui/button"
import { UserPlus } from "lucide-react"

export default async function UsersPage() {
  console.log("[v0] Loading users page")

  try {
    const currentUser = await getCurrentUser()
    console.log("[v0] Current user loaded:", currentUser?.email)

    const users = await getAllUsers()
    console.log("[v0] Users loaded:", users.length)

    const supabase = await createServerClient()
    const { data: groups, error: groupsError } = await supabase.from("groups").select("id, name").order("name")

    if (groupsError) {
      console.error("[v0] Error fetching groups:", groupsError)
    }
    console.log("[v0] Groups loaded:", groups?.length || 0)

    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">User Management</h2>
            <p className="mt-1 text-muted-foreground">Manage user accounts, roles, and permissions across the system</p>
          </div>

          <InviteUserDialog groups={groups || []} currentUserId={currentUser?.id || ""}>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              Invite User
            </Button>
          </InviteUserDialog>
        </div>

        <UsersTable users={users} />
      </div>
    )
  } catch (error) {
    console.error("[v0] Error in users page:", error)
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <h3 className="font-semibold text-destructive">Error Loading Users</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "An unknown error occurred"}
          </p>
        </div>
      </div>
    )
  }
}
