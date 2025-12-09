interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

export async function getAzureADToken(): Promise<string> {
  console.log("[v0] Starting Azure AD authentication...")

  const tenantId = process.env.POWERBI_TENANT_ID
  const clientId = process.env.POWERBI_CLIENT_ID
  const clientSecret = process.env.POWERBI_CLIENT_SECRET

  // Validate environment variables - fail fast if missing
  if (!tenantId || !clientId || !clientSecret) {
    const errorMsg = "Missing Power BI configuration. Please set POWERBI_TENANT_ID, POWERBI_CLIENT_ID, and POWERBI_CLIENT_SECRET environment variables."
    console.error("[v0] Missing Power BI environment variables:", {
      hasTenantId: !!tenantId,
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
    })
    throw new Error(errorMsg)
  }

  console.log("[v0] Environment variables validated, requesting token...")

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`

  const params = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    scope: "https://analysis.windows.net/powerbi/api/.default",
  })

  try {
    console.log("[v0] Fetching Azure AD token from:", tokenUrl)

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Azure AD token request failed:", {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      })
      throw new Error(`Failed to get Azure AD token: ${response.status} ${response.statusText}`)
    }

    const data: TokenResponse = await response.json()
    console.log("[v0] Azure AD token obtained successfully, expires in:", data.expires_in, "seconds")

    return data.access_token
  } catch (error) {
    console.error("[v0] Azure AD authentication error:", error)
    throw error
  }
}
