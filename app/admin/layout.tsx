import type React from "react"
import { getCurrentUser } from "@/lib/supabase/queries"
import { redirect } from "next/navigation"
import { AdminNav } from "@/components/admin-nav"
import { LogoutButton } from "@/components/logout-button"
import { Shield } from "lucide-react"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const currentUser = await getCurrentUser()

  // Only super admins can access admin panel
  if (!currentUser || currentUser.role !== "super_admin") {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/30">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Admin Panel</h1>
              <p className="text-xs text-muted-foreground">Super Administrator</p>
            </div>
          </div>

          <LogoutButton />
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <AdminNav />
        {children}
      </main>
    </div>
  )
}
