"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateDashboard } from "@/app/admin/dashboards/actions"
import { parsePowerBIUrl, constructPowerBIUrl } from "@/lib/powerbi-utils"
import { extractMetabaseDashboardId } from "@/lib/metabase/embed"
import { CheckCircle2, AlertCircle } from "lucide-react"

type DashboardType = "powerbi" | "metabase"

interface EditDashboardDialogProps {
  dashboard: {
    id: string
    title: string
    description: string | null
    group_id: string
    dashboard_type?: string | null
    powerbi_workspace_id?: string | null
    powerbi_report_id?: string | null
    metabase_dashboard_id?: string | null
  }
  groups: Array<{ id: string; name: string }>
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditDashboardDialog({ dashboard, groups, open, onOpenChange }: EditDashboardDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const initialPowerBIUrl =
    dashboard.powerbi_workspace_id && dashboard.powerbi_report_id
      ? constructPowerBIUrl(dashboard.powerbi_workspace_id, dashboard.powerbi_report_id)
      : ""

  const [formData, setFormData] = useState({
    title: dashboard.title,
    description: dashboard.description || "",
    group_id: dashboard.group_id,
    dashboard_type: (dashboard.dashboard_type || "powerbi") as DashboardType,
    powerbi_url: initialPowerBIUrl,
    metabase_url: dashboard.metabase_dashboard_id || "",
  })

  const [parsedPowerBIIds, setParsedPowerBIIds] = useState<{ workspaceId: string; reportId: string } | null>(
    dashboard.powerbi_workspace_id && dashboard.powerbi_report_id
      ? { workspaceId: dashboard.powerbi_workspace_id, reportId: dashboard.powerbi_report_id }
      : null,
  )
  const [parsedMetabaseId, setParsedMetabaseId] = useState<string | null>(dashboard.metabase_dashboard_id || null)
  const [urlError, setUrlError] = useState<string | null>(null)

  useEffect(() => {
    const url =
      dashboard.powerbi_workspace_id && dashboard.powerbi_report_id
        ? constructPowerBIUrl(dashboard.powerbi_workspace_id, dashboard.powerbi_report_id)
        : ""

    setFormData({
      title: dashboard.title,
      description: dashboard.description || "",
      group_id: dashboard.group_id,
      dashboard_type: (dashboard.dashboard_type || "powerbi") as DashboardType,
      powerbi_url: url,
      metabase_url: dashboard.metabase_dashboard_id || "",
    })

    setParsedPowerBIIds(
      dashboard.powerbi_workspace_id && dashboard.powerbi_report_id
        ? { workspaceId: dashboard.powerbi_workspace_id, reportId: dashboard.powerbi_report_id }
        : null,
    )
    setParsedMetabaseId(dashboard.metabase_dashboard_id || null)
    setUrlError(null)
  }, [dashboard])

  const handlePowerBIUrlChange = (url: string) => {
    setFormData({ ...formData, powerbi_url: url })

    if (!url.trim()) {
      setParsedPowerBIIds(null)
      setUrlError(null)
      return
    }

    const parsed = parsePowerBIUrl(url)
    if (parsed) {
      setParsedPowerBIIds(parsed)
      setUrlError(null)
    } else {
      setParsedPowerBIIds(null)
      setUrlError("Invalid Power BI URL. Please paste a valid report URL.")
    }
  }

  const handleMetabaseUrlChange = (url: string) => {
    setFormData({ ...formData, metabase_url: url })

    if (!url.trim()) {
      setParsedMetabaseId(null)
      setUrlError(null)
      return
    }

    // Check if it's just a dashboard ID (number)
    if (/^\d+$/.test(url.trim())) {
      setParsedMetabaseId(url.trim())
      setUrlError(null)
      return
    }

    const dashboardId = extractMetabaseDashboardId(url)
    if (dashboardId) {
      setParsedMetabaseId(dashboardId)
      setUrlError(null)
    } else {
      setParsedMetabaseId(null)
      setUrlError("Invalid Metabase URL. Please paste a valid dashboard URL (e.g., /dashboard/123)")
    }
  }

  const handleTypeChange = (type: DashboardType) => {
    setFormData({ ...formData, dashboard_type: type })
    setUrlError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.dashboard_type === "powerbi" && !parsedPowerBIIds) {
      setUrlError("Please enter a valid Power BI URL")
      return
    }
    if (formData.dashboard_type === "metabase" && !parsedMetabaseId) {
      setUrlError("Please enter a valid Metabase URL")
      return
    }

    setLoading(true)

    try {
      await updateDashboard(dashboard.id, {
        title: formData.title,
        description: formData.description,
        group_id: formData.group_id,
        dashboard_type: formData.dashboard_type,
        powerbi_workspace_id: formData.dashboard_type === "powerbi" ? parsedPowerBIIds?.workspaceId : null,
        powerbi_report_id: formData.dashboard_type === "powerbi" ? parsedPowerBIIds?.reportId : null,
        metabase_dashboard_id: formData.dashboard_type === "metabase" ? parsedMetabaseId : null,
      })
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error("Error updating dashboard:", error)
      alert("Failed to update dashboard")
    } finally {
      setLoading(false)
    }
  }

  const isValid = formData.dashboard_type === "powerbi" ? !!parsedPowerBIIds : !!parsedMetabaseId

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Dashboard</DialogTitle>
            <DialogDescription>Update dashboard information and embed settings</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Dashboard Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-group">Group</Label>
              <Select
                value={formData.group_id}
                onValueChange={(value) => setFormData({ ...formData, group_id: value })}
              >
                <SelectTrigger id="edit-group">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border-t pt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Dashboard Type</Label>
                  <Select
                    value={formData.dashboard_type}
                    onValueChange={(value) => handleTypeChange(value as DashboardType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="powerbi">Power BI</SelectItem>
                      <SelectItem value="metabase">Metabase</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Power BI Configuration */}
                {formData.dashboard_type === "powerbi" && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-powerbi_url">
                      Power BI Report URL <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="edit-powerbi_url"
                      placeholder="https://app.powerbi.com/groups/.../reports/..."
                      value={formData.powerbi_url}
                      onChange={(e) => handlePowerBIUrlChange(e.target.value)}
                      required
                      className={urlError ? "border-destructive" : parsedPowerBIIds ? "border-green-500" : ""}
                    />
                    <p className="text-xs text-muted-foreground">
                      Paste the full Power BI report URL from your browser
                    </p>

                    {urlError && (
                      <div className="flex items-center gap-2 text-xs text-destructive">
                        <AlertCircle className="h-3 w-3" />
                        {urlError}
                      </div>
                    )}

                    {parsedPowerBIIds && (
                      <div className="rounded-md bg-muted p-3 space-y-1">
                        <div className="flex items-center gap-2 text-xs text-green-600 font-medium">
                          <CheckCircle2 className="h-3 w-3" />
                          URL parsed successfully
                        </div>
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          <p>
                            <span className="font-medium">Workspace ID:</span> {parsedPowerBIIds.workspaceId}
                          </p>
                          <p>
                            <span className="font-medium">Report ID:</span> {parsedPowerBIIds.reportId}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {formData.dashboard_type === "metabase" && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-metabase_url">
                      Metabase Dashboard URL <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="edit-metabase_url"
                      placeholder="https://metabase.example.com/dashboard/123"
                      value={formData.metabase_url}
                      onChange={(e) => handleMetabaseUrlChange(e.target.value)}
                      required
                      className={urlError ? "border-destructive" : parsedMetabaseId ? "border-green-500" : ""}
                    />
                    <p className="text-xs text-muted-foreground">
                      Paste the full Metabase dashboard URL from your browser
                    </p>

                    {urlError && (
                      <div className="flex items-center gap-2 text-xs text-destructive">
                        <AlertCircle className="h-3 w-3" />
                        {urlError}
                      </div>
                    )}

                    {parsedMetabaseId && (
                      <div className="rounded-md bg-muted p-3 space-y-1">
                        <div className="flex items-center gap-2 text-xs text-green-600 font-medium">
                          <CheckCircle2 className="h-3 w-3" />
                          URL parsed successfully
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <p>
                            <span className="font-medium">Dashboard ID:</span> {parsedMetabaseId}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !isValid}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
