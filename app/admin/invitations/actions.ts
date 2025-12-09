"use server"

import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

function generateToken(): string {
  const array = new Uint8Array(32)
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(array)
  } else {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256)
    }
  }
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

export async function createInvitation(data: {
  email: string
  role: string
  group_id: string
  invited_by: string
}) {
  const supabase = await createServerClient()
  const adminClient = createAdminClient()

  const token = generateToken()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  // Get group name if applicable
  let groupName: string | null = null
  if (data.group_id && data.group_id !== "none") {
    const { data: groupData } = await adminClient.from("groups").select("name").eq("id", data.group_id).single()
    groupName = groupData?.name || null
  }

  // Get inviter details
  const { data: inviterData } = await adminClient
    .from("profiles")
    .select("email, full_name")
    .eq("id", data.invited_by)
    .single()

  const inviterName = inviterData?.full_name || inviterData?.email || "An administrator"

  // Use Supabase's built-in invite method to send email
  const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(data.email, {
    data: {
      role: data.role,
      group_id: data.group_id === "none" ? null : data.group_id,
      group_name: groupName,
      invited_by: inviterName,
    },
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/accept-invite?token=${token}`,
  })

  if (inviteError) {
    console.error("[v0] Failed to send invitation email:", inviteError)
    throw new Error(`Failed to send invitation: ${inviteError.message}`)
  }

  console.log("[v0] Supabase invitation sent successfully to:", data.email)

  // Store invitation record in our database for tracking
  const { data: invitation, error } = await adminClient
    .from("user_invitations")
    .insert({
      email: data.email,
      role: data.role,
      group_id: data.group_id === "none" ? null : data.group_id,
      invited_by: data.invited_by,
      token,
      expires_at: expiresAt.toISOString(),
    })
    .select("token")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  // This reserves the user's spot in the group before they accept the invite
  if (data.group_id && data.group_id !== "none" && inviteData?.user?.id) {
    await adminClient.from("group_members").insert({
      user_id: inviteData.user.id,
      group_id: data.group_id,
      is_admin: data.role === "group_admin",
      is_active: true, // Active immediately so user shows in group
    })
  }

  revalidatePath("/admin/invitations")
  return invitation
}

export async function deleteInvitation(invitationId: string) {
  const supabase = await createServerClient()

  const { error } = await supabase.from("user_invitations").delete().eq("id", invitationId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/admin/invitations")
}
