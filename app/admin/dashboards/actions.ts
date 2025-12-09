"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createDashboard(data: {
  title: string
  description: string
  group_id: string
  dashboard_type: "powerbi" | "metabase"
  powerbi_workspace_id?: string | null
  powerbi_report_id?: string | null
  metabase_dashboard_id?: string | null
}) {
  const supabase = await createServerClient()

  const { error } = await supabase.from("dashboards").insert({
    title: data.title,
    description: data.description,
    group_id: data.group_id,
    dashboard_type: data.dashboard_type,
    powerbi_workspace_id: data.powerbi_workspace_id || null,
    powerbi_report_id: data.powerbi_report_id || null,
    metabase_dashboard_id: data.metabase_dashboard_id || null,
  })

  if (error) {
    console.error("createDashboard error:", error)
    throw new Error(error.message)
  }

  revalidatePath("/admin/dashboards")
}

export async function updateDashboard(
  dashboardId: string,
  data: {
    title: string
    description: string
    group_id: string
    dashboard_type: "powerbi" | "metabase"
    powerbi_workspace_id?: string | null
    powerbi_report_id?: string | null
    metabase_dashboard_id?: string | null
  },
) {
  const supabase = await createServerClient()

  const { error } = await supabase
    .from("dashboards")
    .update({
      title: data.title,
      description: data.description,
      group_id: data.group_id,
      dashboard_type: data.dashboard_type,
      powerbi_workspace_id: data.powerbi_workspace_id || null,
      powerbi_report_id: data.powerbi_report_id || null,
      metabase_dashboard_id: data.metabase_dashboard_id || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", dashboardId)

  if (error) {
    console.error("updateDashboard error:", error)
    throw new Error(error.message)
  }

  revalidatePath("/admin/dashboards")
}

export async function deleteDashboard(dashboardId: string) {
  const supabase = await createServerClient()

  const { error } = await supabase.from("dashboards").delete().eq("id", dashboardId)

  if (error) {
    console.error("deleteDashboard error:", error)
    throw new Error(error.message)
  }

  revalidatePath("/admin/dashboards")
}
