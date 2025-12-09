import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getEmbedConfig } from "@/lib/powerbi/embed"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  console.log("[v0] POST /api/powerbi/embed-token - Request received")

  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("[v0] Missing or invalid authorization header")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)

    // Create admin client to verify the token and check access
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Verify the user's JWT token
    const {
      data: { user },
      error: authError,
    } = await adminClient.auth.getUser(token)

    if (authError || !user) {
      console.error("[v0] Token verification failed:", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] User authenticated:", user.id)

    // Parse request body
    const body = await request.json()
    const { workspaceId, reportId, dashboardId } = body

    console.log("[v0] Request params:", { workspaceId, reportId, dashboardId })

    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("[v0] Failed to fetch user profile:", profileError)
      return NextResponse.json({ error: "Failed to verify user" }, { status: 500 })
    }

    const isSuperAdmin = profile?.role === "super_admin"
    console.log("[v0] User role:", profile?.role, "Is super admin:", isSuperAdmin)

    // If dashboardId provided, verify user has access to this dashboard
    if (dashboardId) {
      // First get the dashboard
      const { data: dashboard, error: dashboardError } = await adminClient
        .from("dashboards")
        .select("id, group_id, powerbi_workspace_id, powerbi_report_id")
        .eq("id", dashboardId)
        .single()

      if (dashboardError || !dashboard) {
        console.error("[v0] Dashboard not found:", dashboardError)
        return NextResponse.json({ error: "Dashboard not found" }, { status: 404 })
      }

      if (!isSuperAdmin) {
        // Check if user is a member of the dashboard's group
        const { data: membership, error: membershipError } = await adminClient
          .from("group_members")
          .select("id")
          .eq("group_id", dashboard.group_id)
          .eq("user_id", user.id)
          .eq("is_active", true) // Only check active memberships
          .single()

        if (membershipError || !membership) {
          console.error("[v0] User not a member of dashboard group:", membershipError)
          return NextResponse.json({ error: "Access denied" }, { status: 403 })
        }
      }

      console.log("[v0] Dashboard access verified for user (super_admin:", isSuperAdmin, ")")
    }

    // Validate required parameters
    if (!workspaceId || !reportId) {
      console.error("[v0] Missing required parameters")
      return NextResponse.json({ error: "workspaceId and reportId are required" }, { status: 400 })
    }

    // Get embed configuration
    console.log("[v0] Fetching embed config from Power BI...")
    const embedConfig = await getEmbedConfig(workspaceId, reportId)

    console.log("[v0] Embed config generated successfully")

    return NextResponse.json(embedConfig)
  } catch (error) {
    console.error("[v0] Error generating embed token:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate embed token" },
      { status: 500 },
    )
  }
}
