"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

export async function acceptInvitation(token: string, userId: string) {
  const supabase = createAdminClient()

  // Fetch invitation
  const { data: invitation, error: fetchError } = await supabase
    .from("user_invitations")
    .select("*")
    .eq("token", token)
    .is("used_at", null)
    .single()

  if (fetchError || !invitation) {
    console.error("[v0] Invitation fetch error:", fetchError)
    throw new Error("Invalid invitation")
  }

  console.log("[v0] Processing invitation:", {
    email: invitation.email,
    role: invitation.role,
    group_id: invitation.group_id,
    userId,
  })

  const { error: updateProfileError } = await supabase
    .from("profiles")
    .update({ role: invitation.role })
    .eq("id", userId)

  if (updateProfileError) {
    console.error("[v0] Profile update error:", updateProfileError)
    throw new Error("Failed to update profile")
  }

  console.log("[v0] Profile updated to role:", invitation.role)

  if (invitation.group_id) {
    const { error: memberError } = await supabase.from("group_members").insert({
      group_id: invitation.group_id,
      user_id: userId,
      is_admin: invitation.role === "group_admin",
    })

    if (memberError) {
      console.error("[v0] Error adding to group:", memberError)
      // Don't throw - profile was updated, group membership is secondary
    } else {
      console.log("[v0] Added to group_members with is_admin:", invitation.role === "group_admin")
    }
  }

  // Mark invitation as used
  const { error: markUsedError } = await supabase
    .from("user_invitations")
    .update({ used_at: new Date().toISOString() })
    .eq("id", invitation.id)

  if (markUsedError) {
    console.error("[v0] Mark used error:", markUsedError)
    throw new Error("Failed to mark invitation as used")
  }

  console.log("[v0] Invitation accepted successfully")
  revalidatePath("/admin/invitations")
}
