"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "@/lib/supabase/queries"
import { revalidatePath } from "next/cache"

export async function createGroupAdminInvitation(data: { email: string; groupId: string }) {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    throw new Error("Not authenticated")
  }

  // Verify user is admin of the specified group
  const supabase = await createAdminClient()
  const { data: membership } = await supabase
    .from("group_members")
    .select("is_admin")
    .eq("user_id", currentUser.id)
    .eq("group_id", data.groupId)
    .eq("is_active", true) // Only check active memberships
    .single()

  if (!membership || !membership.is_admin) {
    throw new Error("Not authorized to invite to this group")
  }

  // Generate secure token
  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

  // Create invitation
  const { error: inviteError } = await supabase.from("user_invitations").insert({
    email: data.email,
    role: "user", // Group admins can only invite regular users
    group_id: data.groupId,
    invited_by: currentUser.id,
    token,
    expires_at: expiresAt.toISOString(),
  })

  if (inviteError) {
    throw new Error(inviteError.message)
  }

  // Send invitation email via Supabase
  const { data: inviteData, error: emailError } = await supabase.auth.admin.inviteUserByEmail(data.email, {
    data: {
      role: "user",
      group_id: data.groupId,
      invited_by: currentUser.email,
    },
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/accept-invite?token=${token}`,
  })

  if (emailError) {
    console.error("[v0] Email sending error:", emailError)
  }

  // This reserves their spot in the group before they accept
  if (inviteData?.user?.id) {
    await supabase.from("group_members").insert({
      user_id: inviteData.user.id,
      group_id: data.groupId,
      is_admin: false,
      is_active: false, // Inactive until user accepts invite
    })
  }

  revalidatePath("/group-admin/members")
}
