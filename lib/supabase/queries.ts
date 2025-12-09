import { createServerClient } from "./server"
import { createAdminClient } from "./admin"

export async function getCurrentUser() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const adminClient = createAdminClient()
  const { data: profile, error } = await adminClient.from("profiles").select("*").eq("id", user.id).single()

  if (error) {
    console.error("[v0] Error fetching profile:", error)
    // Return a minimal profile if not found
    return {
      id: user.id,
      email: user.email,
      full_name: user.email,
      role: "user",
      created_at: new Date().toISOString(),
    }
  }

  return profile
}

export async function isUserGroupAdmin(userId: string) {
  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .from("group_members")
    .select("is_admin")
    .eq("user_id", userId)
    .eq("is_admin", true)
    .eq("is_active", true) // Only check active memberships
    .limit(1)

  if (error) {
    console.error("[v0] Error checking group admin status:", error)
    return false
  }

  return data && data.length > 0
}

export async function getAllUsers() {
  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .from("profiles")
    .select(`
      *,
      group_members(
        group_id,
        is_admin,
        is_active,
        groups(name)
      )
    `)
    .order("created_at", { ascending: false })

  if (error) throw error

  return data.map((user) => ({
    ...user,
    group_members: user.group_members?.filter((gm: { is_active: boolean }) => gm.is_active) || [],
  }))
}

export async function updateUserRole(userId: string, role: string) {
  const adminClient = createAdminClient()
  const { error } = await adminClient.from("profiles").update({ role }).eq("id", userId)

  if (error) throw error
}
