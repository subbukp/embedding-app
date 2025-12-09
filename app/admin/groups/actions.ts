"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createGroup(data: { name: string; description: string }) {
  const supabase = await createServerClient()

  const { error } = await supabase.from("groups").insert({
    name: data.name,
    description: data.description,
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/admin/groups")
}

export async function updateGroup(groupId: string, data: { name: string; description: string }) {
  const supabase = await createServerClient()

  const { error } = await supabase
    .from("groups")
    .update({
      name: data.name,
      description: data.description,
      updated_at: new Date().toISOString(),
    })
    .eq("id", groupId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/admin/groups")
}

export async function deleteGroup(groupId: string) {
  const supabase = await createServerClient()

  const { error } = await supabase.from("groups").delete().eq("id", groupId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/admin/groups")
}

export async function addGroupMember(groupId: string, userId: string) {
  const supabase = await createServerClient()

  const { data: existingMember } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .single()

  if (existingMember) {
    // Reactivate existing membership
    const { error } = await supabase
      .from("group_members")
      .update({ is_active: true, is_deleted: false })
      .eq("id", existingMember.id)

    if (error) {
      throw new Error(error.message)
    }
  } else {
    // Create new membership
    const { error } = await supabase.from("group_members").insert({
      group_id: groupId,
      user_id: userId,
      is_admin: false,
      is_active: true,
      is_deleted: false,
    })

    if (error) {
      throw new Error(error.message)
    }
  }

  revalidatePath("/admin/groups")
}

export async function removeGroupMember(memberId: string) {
  const supabase = await createServerClient()

  const { error } = await supabase
    .from("group_members")
    .update({ is_deleted: true, is_active: false })
    .eq("id", memberId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/admin/groups")
}

export async function toggleGroupAdmin(memberId: string, isAdmin: boolean) {
  const supabase = await createServerClient()

  const { error } = await supabase.from("group_members").update({ is_admin: isAdmin }).eq("id", memberId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/admin/groups")
}
