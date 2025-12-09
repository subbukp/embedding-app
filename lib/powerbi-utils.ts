export function parsePowerBIUrl(url: string): { workspaceId: string; reportId: string } | null {
  try {
    // URL format: https://app.powerbi.com/groups/{workspace_id}/reports/{report_id}/...
    const urlObj = new URL(url)
    const pathname = urlObj.pathname

    // Extract workspace ID (after /groups/)
    const groupsMatch = pathname.match(/\/groups\/([a-f0-9-]+)/i)
    // Extract report ID (after /reports/)
    const reportsMatch = pathname.match(/\/reports\/([a-f0-9-]+)/i)

    if (groupsMatch && reportsMatch) {
      return {
        workspaceId: groupsMatch[1],
        reportId: reportsMatch[1],
      }
    }

    return null
  } catch {
    return null
  }
}

export function constructPowerBIUrl(workspaceId: string, reportId: string): string {
  return `https://app.powerbi.com/groups/${workspaceId}/reports/${reportId}`
}
