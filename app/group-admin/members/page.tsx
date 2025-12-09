import { getCurrentUser } from "@/lib/supabase/queries"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GroupAdminMembersTable } from "@/components/group-admin-members-table"
import { GroupAdminInviteDialog } from "@/components/group-admin-invite-dialog"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function GroupAdminMembersPage() {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    redirect("/login")
  }

  const supabase = await createAdminClient()

  // Get groups where user is admin
  const { data: adminGroupsData } = await supabase
    .from("group_members")
    .select(`
      group_id,
      is_admin,
      groups:group_id (
        id,
        name,
        description
      )
    `)
    .eq("user_id", currentUser.id)
    .eq("is_admin", true)
    .eq("is_active", true) // Only get active memberships

  const adminGroups = adminGroupsData?.map((g: any) => g.groups) || []

  // Get all members from admin groups
  const groupIds = adminGroups.map((g: any) => g.id)

  let members = []
  if (groupIds.length > 0) {
    const { data: membersData } = await supabase
      .from("group_members")
      .select(`
        id,
        group_id,
        user_id,
        is_admin,
        joined_at,
        groups:group_id (
          id,
          name
        ),
        profiles:user_id (
          id,
          email,
          full_name,
          role,
          last_sign_in_at
        )
      `)
      .in("group_id", groupIds)
      .eq("is_active", true) // Only show active members
      .order("joined_at", { ascending: false })

    members = membersData || []
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Group Members</h1>
          <p className="text-muted-foreground">Manage members in your groups</p>
        </div>
        {adminGroups.length > 0 && <GroupAdminInviteDialog groups={adminGroups} />}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Groups</CardTitle>
          <CardDescription>Groups you manage as a group admin</CardDescription>
        </CardHeader>
        <CardContent>
          {adminGroups.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {adminGroups.map((group: any) => (
                <div key={group.id} className="p-4 border rounded-lg">
                  <h3 className="font-semibold">{group.name}</h3>
                  {group.description && <p className="text-sm text-muted-foreground mt-1">{group.description}</p>}
                  <p className="text-xs text-muted-foreground mt-2">
                    {members.filter((m: any) => m.group_id === group.id).length} member(s)
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">No admin groups found</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Members</CardTitle>
          <CardDescription>Members across all groups you manage</CardDescription>
        </CardHeader>
        <CardContent>
          <GroupAdminMembersTable members={members} currentUserId={currentUser.id} />
        </CardContent>
      </Card>
    </div>
  )
}
