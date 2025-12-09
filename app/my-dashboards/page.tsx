import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LayoutDashboard, Users } from "lucide-react"

export default async function MyDashboardsPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  const isSuperAdmin = profile?.role === "super_admin"

  let dashboards: any[] = []

  if (isSuperAdmin) {
    const { data } = await supabase
      .from("dashboards")
      .select(`
        *,
        groups (
          id,
          name
        )
      `)
      .order("created_at", { ascending: false })

    dashboards = data || []
  } else {
    // Regular users see only dashboards from their groups
    const { data: groupMemberships } = await supabase
      .from("group_members")
      .select(`
        groups (
          id,
          name,
          description
        )
      `)
      .eq("user_id", user.id)
      .eq("is_active", true) // Only get active memberships

    const groupIds = groupMemberships?.map((gm) => gm.groups.id) || []

    if (groupIds.length > 0) {
      const { data } = await supabase
        .from("dashboards")
        .select(`
          *,
          groups (
            id,
            name
          )
        `)
        .in("group_id", groupIds)
        .order("created_at", { ascending: false })

      dashboards = data || []
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Dashboards</h1>
        <p className="text-muted-foreground">
          {isSuperAdmin ? "All dashboards in the portal" : "View dashboards from your groups"}
        </p>
      </div>

      {dashboards && dashboards.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {dashboards.map((dashboard) => (
            <Card key={dashboard.id} className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <LayoutDashboard className="h-8 w-8 text-primary" />
                  <Badge variant="outline">{dashboard.groups?.name || "No Group"}</Badge>
                </div>
                <CardTitle className="mt-4">{dashboard.title}</CardTitle>
                <CardDescription>{dashboard.description || "No description available"}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Created {new Date(dashboard.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Dashboards Yet</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              {isSuperAdmin
                ? "No dashboards have been added to the portal yet. Add dashboards from the Admin panel."
                : "You don't have access to any dashboards yet. Ask your group admin to add you to a group."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
