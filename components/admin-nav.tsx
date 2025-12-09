"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Users, UserCog, Shield, LayoutDashboard } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Groups",
    href: "/admin/groups",
    icon: UserCog,
  },
  {
    title: "Add Dashboards",
    href: "/admin/dashboards",
    icon: LayoutDashboard,
  },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="mb-8 flex gap-2 border-b border-border pb-2">
      <Link
        href="/dashboard"
        className={cn(
          "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:bg-accent",
          pathname === "/dashboard" ? "bg-accent" : "text-muted-foreground",
        )}
      >
        <Shield className="h-4 w-4" />
        Dashboard
      </Link>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:bg-accent",
            pathname === item.href ? "bg-accent" : "text-muted-foreground",
          )}
        >
          {item.icon && <item.icon className="h-4 w-4" />}
          {item.title}
        </Link>
      ))}
    </nav>
  )
}
