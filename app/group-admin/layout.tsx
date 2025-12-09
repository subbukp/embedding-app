import type React from "react"
import { getCurrentUser } from "@/lib/supabase/queries"
import { redirect } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"
import { LogoutButton } from "@/components/logout-button"
import { Shield, Users, Home, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export default async function GroupAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const currentUser = await getCurrentUser()

  // Only group admins and super admins can access
  if (!currentUser || (currentUser.role !== "group_admin" && currentUser.role !== "super_admin")) {
    redirect("/dashboard")
  }

  // Get user's admin groups
  const supabase = await createAdminClient()
  const { data: adminGroups } = await supabase
    .from("group_members")
    .select(`
      group_id,
      is_admin,
      groups:group_id (
        id,
        name
      )
    `)
    .eq("user_id", currentUser.id)
    .eq("is_admin", true)
    .eq("is_active", true) // Only check active memberships

  const hasAdminGroups = adminGroups && adminGroups.length > 0

  if (!hasAdminGroups) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/30">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild className="mr-2">
              <Link href="/dashboard">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Back to Home</span>
              </Link>
            </Button>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
              <Shield className="h-6 w-6 text-secondary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Group Admin Panel</h1>
              <p className="text-xs text-muted-foreground">Managing {adminGroups?.length} group(s)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Link>
            </Button>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="mb-6 flex gap-4 border-b">
          <Link
            href="/group-admin/members"
            className={cn(
              "pb-3 px-1 border-b-2 font-medium transition-colors",
              "hover:text-foreground border-transparent hover:border-border",
            )}
          >
            <Users className="h-4 w-4 inline mr-2" />
            Members
          </Link>
        </div>
        {children}
      </main>
    </div>
  )
}
