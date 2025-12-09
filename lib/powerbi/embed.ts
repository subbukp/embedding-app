import { getAzureADToken } from "./auth"

interface EmbedTokenResponse {
  token: string
  tokenId: string
  expiration: string
}

interface ReportDetails {
  id: string
  name: string
  embedUrl: string
  datasetId: string
}

export interface EmbedConfig {
  reportId: string
  embedUrl: string
  accessToken: string
  tokenExpiry: string
}

/**
 * Get report details from Power BI API
 */
export async function getReportDetails(
  workspaceId: string,
  reportId: string,
  accessToken: string,
): Promise<ReportDetails> {
  console.log("[v0] Fetching report details:", { workspaceId, reportId })

  const url = `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/reports/${reportId}`

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("[v0] Failed to get report details:", {
      status: response.status,
      error: errorText,
    })
    throw new Error(`Failed to get report details: ${response.status}`)
  }

  const data = await response.json()
  console.log("[v0] Report details fetched:", { name: data.name, embedUrl: data.embedUrl })

  return {
    id: data.id,
    name: data.name,
    embedUrl: data.embedUrl,
    datasetId: data.datasetId,
  }
}

/**
 * Generate embed token for a report
 */
export async function generateEmbedToken(
  workspaceId: string,
  reportId: string,
  accessToken: string,
): Promise<EmbedTokenResponse> {
  console.log("[v0] Generating embed token for report:", reportId)

  const url = `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/reports/${reportId}/GenerateToken`

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      accessLevel: "View",
      allowSaveAs: false,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("[v0] Failed to generate embed token:", {
      status: response.status,
      error: errorText,
    })
    throw new Error(`Failed to generate embed token: ${response.status}`)
  }

  const data: EmbedTokenResponse = await response.json()
  console.log("[v0] Embed token generated, expires:", data.expiration)

  return data
}

/**
 * Get complete embed configuration for a Power BI report
 */
export async function getEmbedConfig(workspaceId: string, reportId: string): Promise<EmbedConfig> {
  console.log("[v0] Getting embed config for:", { workspaceId, reportId })

  // Step 1: Get Azure AD access token
  const accessToken = await getAzureADToken()

  // Step 2: Get report details (including embed URL)
  const reportDetails = await getReportDetails(workspaceId, reportId, accessToken)

  // Step 3: Generate embed token
  const embedToken = await generateEmbedToken(workspaceId, reportId, accessToken)

  const config: EmbedConfig = {
    reportId: reportDetails.id,
    embedUrl: reportDetails.embedUrl,
    accessToken: embedToken.token,
    tokenExpiry: embedToken.expiration,
  }

  console.log("[v0] Embed config ready:", {
    reportId: config.reportId,
    tokenExpiry: config.tokenExpiry,
  })

  return config
}
