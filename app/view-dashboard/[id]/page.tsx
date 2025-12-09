import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect, notFound } from "next/navigation"
import { PowerBIEmbed } from "@/components/powerbi-embed"
import { MetabaseEmbed } from "@/components/metabase-embed"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Shield } from "lucide-react"
import Link from "next/link"
import { LogoutButton } from "@/components/logout-button"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ViewDashboardPage({ params }: PageProps) {
  const { id } = await params

  const supabase = await createServerClient()
  const adminClient = createAdminClient()

  // Verify authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/login")
  }

  const { data: profile } = await adminClient.from("profiles").select("role").eq("id", user.id).single()

  const isSuperAdmin = profile?.role === "super_admin"

  let dashboard = null

  if (isSuperAdmin) {
    const { data, error } = await adminClient
      .from("dashboards")
      .select(`
        id,
        title,
        description,
        dashboard_type,
        powerbi_workspace_id,
        powerbi_report_id,
        metabase_dashboard_id,
        group_id,
        groups (
          id,
          name
        )
      `)
      .eq("id", id)
      .single()

    if (!error) {
      dashboard = data
    }
  } else {
    const { data, error } = await supabase
      .from("dashboards")
      .select(`
        id,
        title,
        description,
        dashboard_type,
        powerbi_workspace_id,
        powerbi_report_id,
        metabase_dashboard_id,
        group_id,
        groups!inner (
          id,
          name,
          group_members!inner (
            user_id
          )
        )
      `)
      .eq("id", id)
      .eq("groups.group_members.user_id", user.id)
      .single()

    if (!error) {
      dashboard = data
    }
  }

  if (!dashboard) {
    notFound()
  }

  const dashboardType = dashboard.dashboard_type || "powerbi"
  const isPowerBIConfigured = dashboard.powerbi_workspace_id && dashboard.powerbi_report_id
  const isMetabaseConfigured = dashboard.metabase_dashboard_id
  const isConfigured = dashboardType === "powerbi" ? isPowerBIConfigured : isMetabaseConfigured

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border/50 bg-card/50 backdrop-blur">
          <div className="container mx-auto flex h-16 items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              </Link>
            </div>
            <LogoutButton />
          </div>
        </header>
        <main className="container mx-auto px-6 py-12">
          <div className="flex flex-col items-center justify-center py-20">
            <Shield className="h-16 w-16 text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">Dashboard Not Configured</h1>
            <p className="text-muted-foreground">
              This dashboard doesn&apos;t have {dashboardType === "powerbi" ? "Power BI" : "Metabase"} configured yet.
            </p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
            <div className="border-l pl-4">
              <h1 className="text-lg font-semibold">{dashboard.title}</h1>
              {dashboard.description && <p className="text-xs text-muted-foreground">{dashboard.description}</p>}
            </div>
          </div>
          <LogoutButton />
        </div>
      </header>

      <main>
        {dashboardType === "powerbi" && isPowerBIConfigured && (
          <PowerBIEmbed
            dashboardId={dashboard.id}
            workspaceId={dashboard.powerbi_workspace_id!}
            reportId={dashboard.powerbi_report_id!}
          />
        )}
        {dashboardType === "metabase" && isMetabaseConfigured && (
          <MetabaseEmbed
            dashboardId={dashboard.id}
            metabaseDashboardId={dashboard.metabase_dashboard_id!}
            title={dashboard.title}
          />
        )}
      </main>
    </div>
  )
}
