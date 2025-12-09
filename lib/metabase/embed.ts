import { SignJWT } from "jose"

const METABASE_SITE_URL = process.env.METABASE_SITE_URL
const METABASE_SECRET_KEY = process.env.METABASE_SECRET_KEY

interface MetabaseEmbedParams {
  dashboardId: string
  params?: Record<string, string | number>
}

export async function generateMetabaseEmbedUrl({ dashboardId, params = {} }: MetabaseEmbedParams): Promise<string> {
  console.log("[v0] generateMetabaseEmbedUrl: Called with dashboardId:", dashboardId)
  console.log("[v0] generateMetabaseEmbedUrl: METABASE_SITE_URL exists:", !!METABASE_SITE_URL)
  console.log("[v0] generateMetabaseEmbedUrl: METABASE_SECRET_KEY exists:", !!METABASE_SECRET_KEY)

  if (!METABASE_SITE_URL || !METABASE_SECRET_KEY) {
    throw new Error("Metabase configuration missing. Please set METABASE_SITE_URL and METABASE_SECRET_KEY.")
  }

  // Encode the secret key for jose
  const secret = new TextEncoder().encode(METABASE_SECRET_KEY)

  const parsedDashboardId = Number.parseInt(dashboardId, 10)
  console.log("[v0] generateMetabaseEmbedUrl: Parsed dashboard ID:", parsedDashboardId)

  // Create the JWT token using jose
  const token = await new SignJWT({
    resource: { dashboard: parsedDashboardId },
    params: params,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1h")
    .sign(secret)

  console.log("[v0] generateMetabaseEmbedUrl: Generated JWT token for SDK")

  return token
}

export function extractMetabaseDashboardId(url: string): string | null {
  // Supports URLs like:
  // https://metabase.example.com/dashboard/123
  // https://metabase.example.com/dashboard/123-dashboard-name
  // https://metabase.example.com/question/456

  const dashboardMatch = url.match(/\/dashboard\/(\d+)/)
  if (dashboardMatch) {
    return dashboardMatch[1]
  }

  const questionMatch = url.match(/\/question\/(\d+)/)
  if (questionMatch) {
    return questionMatch[1]
  }

  return null
}

export function isMetabaseConfigured(): boolean {
  return !!(METABASE_SITE_URL && METABASE_SECRET_KEY)
}
