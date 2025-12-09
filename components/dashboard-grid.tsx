"use client"

import { useState, useMemo } from "react"
import { PowerBIEmbed } from "@/components/powerbi-embed"
import { MetabaseEmbed } from "@/components/metabase-embed"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { LayoutDashboard, Filter, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Dashboard {
  id: string
  title: string
  description: string | null
  dashboard_type: string | null
  powerbi_workspace_id: string | null
  powerbi_report_id: string | null
  metabase_dashboard_id: string | null
  groups: {
    id: string
    name: string
  } | null
}

interface DashboardGridProps {
  dashboards: Dashboard[]
  showGroupFilter?: boolean
}

function isDashboardConfigured(dashboard: Dashboard): boolean {
  if (dashboard.dashboard_type === "metabase") {
    return !!dashboard.metabase_dashboard_id
  }
  // Default to powerbi
  return !!(dashboard.powerbi_workspace_id && dashboard.powerbi_report_id)
}

export function DashboardGrid({ dashboards, showGroupFilter = false }: DashboardGridProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")

  // Extract unique groups from dashboards
  const uniqueGroups = useMemo(() => {
    const groupsMap = new Map<string, { id: string; name: string }>()
    dashboards.forEach((d) => {
      if (d.groups) {
        groupsMap.set(d.groups.id, d.groups)
      }
    })
    return Array.from(groupsMap.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [dashboards])

  const filteredDashboards = useMemo(() => {
    let result = dashboards.filter(isDashboardConfigured)

    if (selectedGroupId !== "all") {
      result = result.filter((d) => d.groups?.id === selectedGroupId)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(query) ||
          d.description?.toLowerCase().includes(query) ||
          d.groups?.name.toLowerCase().includes(query),
      )
    }

    return result
  }, [dashboards, selectedGroupId, searchQuery])

  const configuredDashboards = dashboards.filter(isDashboardConfigured)

  const hasActiveFilters = selectedGroupId !== "all" || searchQuery.trim() !== ""

  const clearFilters = () => {
    setSelectedGroupId("all")
    setSearchQuery("")
  }

  if (configuredDashboards.length === 0) {
    return (
      <Card className="border-border/50 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <LayoutDashboard className="h-12 w-12 text-muted-foreground mb-4" />
          <h4 className="text-lg font-medium mb-2">No Dashboards Available</h4>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            You don&apos;t have access to any dashboards yet. Contact your administrator to get access to group
            dashboards.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {configuredDashboards.length > 1 && (
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filter Dashboards</span>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {/* Search input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-full sm:w-[200px]"
                  />
                </div>

                {/* Group filter - show if multiple groups */}
                {showGroupFilter && uniqueGroups.length > 1 && (
                  <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Filter by group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Groups</SelectItem>
                      {uniqueGroups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Clear filters button */}
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {/* Results count */}
            <div className="mt-3 text-sm text-muted-foreground">
              Showing {filteredDashboards.length} of {configuredDashboards.length} dashboards
              {hasActiveFilters && " (filtered)"}
            </div>
          </CardContent>
        </Card>
      )}

      {filteredDashboards.length === 0 ? (
        <Card className="border-border/50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <LayoutDashboard className="h-12 w-12 text-muted-foreground mb-4" />
            <h4 className="text-lg font-medium mb-2">No Matching Dashboards</h4>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              No dashboards match your current filters. Try adjusting your search or group selection.
            </p>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters} className="mt-4 bg-transparent">
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {filteredDashboards.map((dashboard) => (
            <div key={dashboard.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">{dashboard.title}</h3>
                  {dashboard.description && <p className="text-sm text-muted-foreground">{dashboard.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    {dashboard.dashboard_type === "metabase" ? "Metabase" : "Power BI"}
                  </span>
                  {dashboard.groups && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                      {dashboard.groups.name}
                    </span>
                  )}
                </div>
              </div>
              {dashboard.dashboard_type === "metabase" ? (
                <MetabaseEmbed dashboardId={dashboard.id} metabaseDashboardId={dashboard.metabase_dashboard_id!} />
              ) : (
                <PowerBIEmbed
                  dashboardId={dashboard.id}
                  workspaceId={dashboard.powerbi_workspace_id!}
                  reportId={dashboard.powerbi_report_id!}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
