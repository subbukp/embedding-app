"use server"

import { createServerClient } from "@/lib/supabase/server"

export async function promoteToSuperAdmin(email: string) {
  try {
    const supabase = await createServerClient()

    // Check if super admin already exists
    const { data: existingSuperAdmin } = await supabase.from("profiles").select("id").eq("role", "super_admin").single()

    if (existingSuperAdmin) {
      return {
        success: false,
        error: "A super admin already exists. Contact them to change roles.",
      }
    }

    // Find the user by email
    const { data: profile } = await supabase.from("profiles").select("id, email").eq("email", email).single()

    if (!profile) {
      return {
        success: false,
        error: "User not found. Make sure they have signed up first.",
      }
    }

    // Promote to super admin using service role
    // Note: This bypasses RLS because we're promoting the first admin
    const { error: updateError } = await supabase.from("profiles").update({ role: "super_admin" }).eq("id", profile.id)

    if (updateError) {
      console.error("[v0] Error promoting user:", updateError)
      return {
        success: false,
        error: "Failed to update role. Check database permissions.",
      }
    }

    return {
      success: true,
      message: `Successfully promoted ${email} to super admin`,
    }
  } catch (error) {
    console.error("[v0] Error in promoteToSuperAdmin:", error)
    return {
      success: false,
      error: "An unexpected error occurred",
    }
  }
}
