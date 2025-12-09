"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateUserRole(userId: string, role: string) {
  const supabase = await createServerClient()

  // Verify current user is super admin
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data: currentUser } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (currentUser?.role !== "super_admin") {
    throw new Error("Unauthorized")
  }

  // Update the user's role
  const { error } = await supabase
    .from("profiles")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", userId)

  if (error) throw error

  revalidatePath("/admin/users")
}
