import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Shield, Settings, Users, LayoutDashboard } from "lucide-react"
import { LogoutButton } from "@/components/logout-button"
import Link from "next/link"
import { DashboardGrid } from "@/components/dashboard-grid"
import { DecorativeShapes } from "@/components/decorative-shapes"
import { getCurrentUser, isUserGroupAdmin } from "@/lib/supabase/queries"

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    redirect("/login")
  }

  const user = data.user
  const profile = await getCurrentUser()

  const isGroupAdmin = profile ? await isUserGroupAdmin(profile.id) : false
  const isSuperAdmin = profile?.role === "super_admin"

  let dashboards: any[] = []

  if (isSuperAdmin) {
    const { data: allDashboards } = await supabase
      .from("dashboards")
      .select(`
        id,
        title,
        description,
        dashboard_type,
        powerbi_workspace_id,
        powerbi_report_id,
        metabase_dashboard_id,
        created_at,
        groups (
          id,
          name
        )
      `)
      .order("created_at", { ascending: false })

    dashboards =
      allDashboards?.map((d) => ({
        id: d.id,
        title: d.title,
        description: d.description,
        dashboard_type: d.dashboard_type,
        powerbi_workspace_id: d.powerbi_workspace_id,
        powerbi_report_id: d.powerbi_report_id,
        metabase_dashboard_id: d.metabase_dashboard_id,
        created_at: d.created_at,
        groups: d.groups ? { id: d.groups.id, name: d.groups.name } : null,
      })) || []
  } else {
    const { data: userDashboards } = await supabase
      .from("dashboards")
      .select(`
        id,
        title,
        description,
        dashboard_type,
        powerbi_workspace_id,
        powerbi_report_id,
        metabase_dashboard_id,
        created_at,
        groups!inner (
          id,
          name,
          group_members!inner (
            user_id
          )
        )
      `)
      .eq("groups.group_members.user_id", user.id)
      .order("created_at", { ascending: false })

    dashboards =
      userDashboards?.map((d) => ({
        id: d.id,
        title: d.title,
        description: d.description,
        dashboard_type: d.dashboard_type,
        powerbi_workspace_id: d.powerbi_workspace_id,
        powerbi_report_id: d.powerbi_report_id,
        metabase_dashboard_id: d.metabase_dashboard_id,
        created_at: d.created_at,
        groups: {
          id: d.groups.id,
          name: d.groups.name,
        },
      })) || []
  }

  console.log("[v0] DashboardPage: User dashboards:", dashboards.length, "isSuperAdmin:", isSuperAdmin)

  const hasMultipleGroups = dashboards.some((dashboard) => dashboard.groups && Array.isArray(dashboard.groups))

  return (
    <div className="relative min-h-screen bg-background">
      <DecorativeShapes className="opacity-50" />

      {/* Coral Header Bar */}
      <div className="h-2 bg-primary" />

      {/* Header */}
      <header className="relative z-10 border-b border-border/30 bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/30">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Secure Portal</h1>
              <p className="text-xs text-muted-foreground">Invite-only access</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {profile?.role === "super_admin" && (
              <Link href="/admin/users">
                <button className="flex items-center gap-2 rounded-full border border-primary/50 bg-card/50 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10">
                  <Settings className="h-4 w-4" />
                  Admin Panel
                </button>
              </Link>
            )}
            {isGroupAdmin && (
              <Link href="/group-admin/members">
                <button className="flex items-center gap-2 rounded-full border border-primary/50 bg-card/50 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10">
                  <Users className="h-4 w-4" />
                  Group Admin Panel
                </button>
              </Link>
            )}
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-6 py-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LayoutDashboard className="h-6 w-6 text-primary" />
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-primary">
                  {isSuperAdmin ? "All Dashboards" : "Your Dashboards"}
                </h2>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
              </div>
            </div>
          </div>

          <DashboardGrid dashboards={dashboards} showGroupFilter={hasMultipleGroups} />
        </div>
      </main>
    </div>
  )
}
