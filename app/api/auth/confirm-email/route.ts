import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Not authenticated. Please click the magic link again." }, { status: 401 })
    }

    // Use admin client to update the profile
    const adminClient = createAdminClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Mark email as verified
    const { error: updateError } = await adminClient.from("profiles").update({ email_verified: true }).eq("id", user.id)

    if (updateError) {
      console.error("Error updating email_verified:", updateError)
      return NextResponse.json({ error: "Failed to verify email" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Confirm email error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
