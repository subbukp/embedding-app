"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Settings, Trash2, LayoutDashboard, ExternalLink } from "lucide-react"
import { EditDashboardDialog } from "./edit-dashboard-dialog"
import { deleteDashboard } from "@/app/admin/dashboards/actions"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Dashboard {
  id: string
  title: string
  description: string | null
  group_id: string
  created_at: string
  dashboard_type?: string | null
  powerbi_workspace_id?: string | null
  powerbi_report_id?: string | null
  metabase_dashboard_id?: string | null
  groups: {
    id: string
    name: string
  }
}

interface Group {
  id: string
  name: string
}

interface DashboardsTableProps {
  dashboards: Dashboard[]
  groups: Group[]
  userRole: string
}

function isDashboardConfigured(dashboard: Dashboard): boolean {
  if (dashboard.dashboard_type === "metabase") {
    return !!dashboard.metabase_dashboard_id
  }
  return !!(dashboard.powerbi_workspace_id && dashboard.powerbi_report_id)
}

export function DashboardsTable({ dashboards, groups, userRole }: DashboardsTableProps) {
  const router = useRouter()
  const [editingDashboard, setEditingDashboard] = useState<Dashboard | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (dashboardId: string) => {
    if (!confirm("Are you sure you want to delete this dashboard?")) {
      return
    }

    setDeletingId(dashboardId)
    try {
      await deleteDashboard(dashboardId)
      router.refresh()
    } catch (error) {
      console.error("[v0] DashboardsTable: Error deleting dashboard:", error)
      alert("Failed to delete dashboard")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dashboard Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Group</TableHead>
              <TableHead>Type & Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dashboards.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No dashboards found
                </TableCell>
              </TableRow>
            ) : (
              dashboards.map((dashboard) => (
                <TableRow key={dashboard.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                      {dashboard.title}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate">
                    {dashboard.description || "No description"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{dashboard.groups.name}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {dashboard.dashboard_type === "metabase" ? "Metabase" : "Power BI"}
                      </Badge>
                      {isDashboardConfigured(dashboard) ? (
                        <Badge variant="default" className="bg-green-600">
                          Connected
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Not configured</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(dashboard.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {isDashboardConfigured(dashboard) && (
                        <Link href={`/view-dashboard/${dashboard.id}`}>
                          <Button variant="ghost" size="sm" title="View Dashboard">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => setEditingDashboard(dashboard)}>
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(dashboard.id)}
                        disabled={deletingId === dashboard.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {editingDashboard && (
        <EditDashboardDialog
          dashboard={editingDashboard}
          groups={groups}
          open={!!editingDashboard}
          onOpenChange={(open) => !open && setEditingDashboard(null)}
        />
      )}
    </>
  )
}
