import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardsTable } from "@/components/dashboards-table"
import { CreateDashboardDialog } from "@/components/create-dashboard-dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default async function DashboardsPage() {
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

  const { data: dashboards, error } = await supabase
    .from("dashboards")
    .select(`
      *,
      groups (
        id,
        name
      )
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching dashboards:", error)
  }

  const { data: groups } = await supabase.from("groups").select("id, name").order("name")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboards</h1>
          <p className="text-muted-foreground">Manage group dashboards and configurations</p>
        </div>
        <CreateDashboardDialog groups={groups || []}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Dashboard
          </Button>
        </CreateDashboardDialog>
      </div>

      <DashboardsTable dashboards={dashboards || []} groups={groups || []} userRole={profile.role} />
    </div>
  )
}
