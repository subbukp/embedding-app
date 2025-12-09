import { getCurrentUser } from "@/lib/supabase/queries"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, User } from "lucide-react"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function GroupAdminDashboardsPage() {
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
        name
      )
    `)
    .eq("user_id", currentUser.id)
    .eq("is_admin", true)
    .eq("is_active", true) // Only get active memberships

  const groupIds = adminGroupsData?.map((g: any) => g.group_id) || []

  let dashboards = []
  if (groupIds.length > 0) {
    const { data: dashboardsData } = await supabase
      .from("dashboards")
      .select(`
        *,
        groups:group_id (
          id,
          name
        ),
        creator:created_by (
          email,
          full_name
        )
      `)
      .in("group_id", groupIds)
      .order("created_at", { ascending: false })

    dashboards = dashboardsData || []
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Group Dashboards</h1>
        <p className="text-muted-foreground">Dashboards from groups you manage</p>
      </div>

      {dashboards && dashboards.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {dashboards.map((dashboard: any) => (
            <Card key={dashboard.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{dashboard.name}</CardTitle>
                  <Badge variant="outline">{dashboard.groups?.name}</Badge>
                </div>
                {dashboard.description && (
                  <CardDescription className="line-clamp-2">{dashboard.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Created by {dashboard.creator?.full_name || dashboard.creator?.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(dashboard.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No dashboards found in your groups yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
