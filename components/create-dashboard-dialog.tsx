"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createDashboard } from "@/app/admin/dashboards/actions"
import { parsePowerBIUrl } from "@/lib/powerbi-utils"
import { extractMetabaseDashboardId } from "@/lib/metabase/embed"
import { CheckCircle2, AlertCircle } from "lucide-react"

interface Group {
  id: string
  name: string
}

type DashboardType = "powerbi" | "metabase"

export function CreateDashboardDialog({
  children,
  groups,
}: {
  children: React.ReactNode
  groups: Group[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    group_id: "",
    dashboard_type: "powerbi" as DashboardType,
    powerbi_url: "",
    metabase_url: "",
  })
  const [parsedPowerBIIds, setParsedPowerBIIds] = useState<{ workspaceId: string; reportId: string } | null>(null)
  const [parsedMetabaseId, setParsedMetabaseId] = useState<string | null>(null)
  const [urlError, setUrlError] = useState<string | null>(null)

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
    setFormData({ ...formData, dashboard_type: type, powerbi_url: "", metabase_url: "" })
    setParsedPowerBIIds(null)
    setParsedMetabaseId(null)
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
      await createDashboard({
        title: formData.title,
        description: formData.description,
        group_id: formData.group_id,
        dashboard_type: formData.dashboard_type,
        powerbi_workspace_id: formData.dashboard_type === "powerbi" ? parsedPowerBIIds?.workspaceId : undefined,
        powerbi_report_id: formData.dashboard_type === "powerbi" ? parsedPowerBIIds?.reportId : undefined,
        metabase_dashboard_id: formData.dashboard_type === "metabase" ? parsedMetabaseId : undefined,
      })
      setOpen(false)
      setFormData({
        title: "",
        description: "",
        group_id: "",
        dashboard_type: "powerbi",
        powerbi_url: "",
        metabase_url: "",
      })
      setParsedPowerBIIds(null)
      setParsedMetabaseId(null)
      router.refresh()
    } catch (error) {
      console.error("Error creating dashboard:", error)
      alert("Failed to create dashboard")
    } finally {
      setLoading(false)
    }
  }

  const isValid = formData.dashboard_type === "powerbi" ? !!parsedPowerBIIds : !!parsedMetabaseId

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Dashboard</DialogTitle>
            <DialogDescription>Add a new dashboard for a group</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Dashboard Title</Label>
              <Input
                id="title"
                placeholder="Sales Analytics"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Track sales performance and metrics"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group">Group</Label>
              <Select
                value={formData.group_id}
                onValueChange={(value) => setFormData({ ...formData, group_id: value })}
                required
              >
                <SelectTrigger id="group">
                  <SelectValue placeholder="Select a group" />
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
                    <Label htmlFor="powerbi_url">
                      Power BI Report URL <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="powerbi_url"
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
                    <Label htmlFor="metabase_url">
                      Metabase Dashboard URL <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="metabase_url"
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !isValid}>
              {loading ? "Creating..." : "Create Dashboard"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
