import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PromoteToAdminForm } from "@/components/promote-to-admin-form"

export default async function RoleSetupPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Get current user's profile
  const { data: currentProfile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Get all profiles (only super_admin can see this)
  const { data: allProfiles } = await supabase
    .from("profiles")
    .select(`
      *,
      group_members (
        group_id,
        is_admin,
        groups (name)
      )
    `)
    .order("created_at", { ascending: false })

  const isSuperAdmin = currentProfile?.role === "super_admin"

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Role Management</h1>
          <p className="text-muted-foreground">Manage user roles and permissions in the system</p>
        </div>

        {/* Current User Info */}
        <Card>
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
            <CardDescription>Current authentication and role status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{currentProfile?.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Role</p>
                <Badge
                  variant={
                    currentProfile?.role === "super_admin"
                      ? "default"
                      : currentProfile?.role === "group_admin"
                        ? "secondary"
                        : "outline"
                  }
                >
                  {currentProfile?.role || "user"}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">User ID</p>
                <p className="font-mono text-xs">{user.id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Joined</p>
                <p className="text-sm">
                  {currentProfile?.created_at ? new Date(currentProfile.created_at).toLocaleDateString() : "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role Promotion Tool */}
        {!isSuperAdmin && (
          <Card className="border-amber-500/50 bg-amber-500/5">
            <CardHeader>
              <CardTitle>First Time Setup</CardTitle>
              <CardDescription>
                No super admin exists yet. Promote yourself or another user to super admin to manage the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PromoteToAdminForm currentUserId={user.id} currentEmail={currentProfile?.email || ""} />
            </CardContent>
          </Card>
        )}

        {/* All Users List (Super Admin Only) */}
        {isSuperAdmin && allProfiles && (
          <Card>
            <CardHeader>
              <CardTitle>All Users ({allProfiles.length})</CardTitle>
              <CardDescription>Complete list of users and their roles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {allProfiles.map((profile) => (
                  <div key={profile.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{profile.email}</p>
                        <Badge
                          variant={
                            profile.role === "super_admin"
                              ? "default"
                              : profile.role === "group_admin"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {profile.role}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{profile.full_name || "No name set"}</p>
                      {profile.group_members && profile.group_members.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Groups: {profile.group_members.map((gm: any) => gm.groups.name).join(", ")}
                        </p>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Joined {new Date(profile.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Role Explanation */}
        <Card>
          <CardHeader>
            <CardTitle>Role Hierarchy</CardTitle>
            <CardDescription>Understanding the three role levels</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <Badge>super_admin</Badge>
                <div>
                  <p className="font-medium">Super Administrator</p>
                  <p className="text-sm text-muted-foreground">
                    Full system access. Can manage all users, groups, dashboards, and change any user's role.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Badge variant="secondary">group_admin</Badge>
                <div>
                  <p className="font-medium">Group Administrator</p>
                  <p className="text-sm text-muted-foreground">
                    Can manage their assigned groups, add/remove members, and manage group dashboards.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Badge variant="outline">user</Badge>
                <div>
                  <p className="font-medium">Regular User</p>
                  <p className="text-sm text-muted-foreground">
                    Can view dashboards from their assigned groups. Default role for new signups.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
