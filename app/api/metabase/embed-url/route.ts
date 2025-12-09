import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateMetabaseEmbedUrl, isMetabaseConfigured } from "@/lib/metabase/embed"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const metabaseDashboardId = searchParams.get("dashboardId")

    if (!metabaseDashboardId) {
      return NextResponse.json({ error: "Missing dashboardId parameter" }, { status: 400 })
    }

    if (!isMetabaseConfigured()) {
      return NextResponse.json({ error: "Metabase is not configured" }, { status: 500 })
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const embedUrl = await generateMetabaseEmbedUrl({
      dashboardId: metabaseDashboardId,
      params: {},
    })

    return NextResponse.json({ embedUrl })
  } catch (error) {
    console.error("[v0] Metabase embed error:", error)
    return NextResponse.json({ error: "Failed to generate embed URL" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Metabase API: Request received")

    // Check if Metabase is configured
    const configured = isMetabaseConfigured()
    console.log("[v0] Metabase API: Is configured:", configured)

    if (!configured) {
      console.log(
        "[v0] Metabase API: Missing env vars - METABASE_SITE_URL:",
        !!process.env.METABASE_SITE_URL,
        "METABASE_SECRET_KEY:",
        !!process.env.METABASE_SECRET_KEY,
      )
      return NextResponse.json({ error: "Metabase is not configured" }, { status: 500 })
    }

    const supabase = await createClient()

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log("[v0] Metabase API: Auth error:", authError?.message)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Metabase API: User authenticated:", user.id)

    const { dashboardId, metabaseDashboardId } = await request.json()
    console.log("[v0] Metabase API: Request params:", { dashboardId, metabaseDashboardId })

    if (!dashboardId || !metabaseDashboardId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Get user's profile to check role
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
    console.log("[v0] Metabase API: User role:", profile?.role)

    // Get dashboard info
    const { data: dashboard, error: dashboardError } = await supabase
      .from("dashboards")
      .select("*, groups(name)")
      .eq("id", dashboardId)
      .single()

    if (dashboardError || !dashboard) {
      console.log("[v0] Metabase API: Dashboard not found:", dashboardError?.message)
      return NextResponse.json({ error: "Dashboard not found" }, { status: 404 })
    }

    // Check access - super_admin can access all, others need group membership
    if (profile?.role !== "super_admin") {
      const { data: membership } = await supabase
        .from("group_members")
        .select("id")
        .eq("user_id", user.id)
        .eq("group_id", dashboard.group_id)
        .eq("is_active", true)
        .eq("is_deleted", false)
        .single()

      if (!membership) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }
    }

    console.log("[v0] Metabase API: Access verified, generating embed URL...")

    // Generate JWT token for SDK
    const token = await generateMetabaseEmbedUrl({
      dashboardId: metabaseDashboardId,
      params: {}, // Can add user-specific params for row-level security
    })

    console.log("[v0] Metabase API: JWT token generated for SDK")

    return NextResponse.json({
      token,
      expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
    })
  } catch (error) {
    console.error("[v0] Metabase embed error:", error)
    return NextResponse.json({ error: "Failed to generate embed URL" }, { status: 500 })
  }
}
