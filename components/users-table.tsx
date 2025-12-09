"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Shield, Users, User, CheckCircle2, Clock } from "lucide-react"
import { updateUserRole } from "@/app/admin/users/actions"

type Profile = {
  id: string
  email: string
  full_name: string | null
  role: string
  created_at: string
  last_sign_in_at: string | null
  group_members: Array<{
    group_id: string
    is_admin: boolean
    groups: { name: string }
  }>
}

export function UsersTable({ users }: { users: Profile[] }) {
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "super_admin":
        return (
          <Badge variant="default" className="bg-red-500/10 text-red-500 border-red-500/20">
            <Shield className="mr-1 h-3 w-3" />
            Super Admin
          </Badge>
        )
      case "group_admin":
        return (
          <Badge variant="default" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            <Users className="mr-1 h-3 w-3" />
            Group Admin
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            <User className="mr-1 h-3 w-3" />
            User
          </Badge>
        )
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    setIsUpdating(userId)
    try {
      await updateUserRole(userId, newRole)
      window.location.reload()
    } catch (error) {
      console.error("Failed to update role:", error)
    } finally {
      setIsUpdating(null)
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Groups</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div>
                  <div className="font-medium text-foreground">{user.full_name || "Unnamed User"}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                </div>
              </TableCell>
              <TableCell>{getRoleBadge(user.role)}</TableCell>
              <TableCell>
                {user.last_sign_in_at ? (
                  <div className="flex flex-col gap-1">
                    <Badge variant="default" className="w-fit bg-green-500/10 text-green-500 border-green-500/20">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Activated
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Last login: {new Date(user.last_sign_in_at).toLocaleDateString()}
                    </span>
                  </div>
                ) : (
                  <Badge variant="default" className="w-fit bg-amber-500/10 text-amber-500 border-amber-500/20">
                    <Clock className="mr-1 h-3 w-3" />
                    Pending
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {user.group_members.length > 0 ? (
                    user.group_members.map((membership) => (
                      <Badge key={membership.group_id} variant="secondary">
                        {membership.groups.name}
                        {membership.is_admin && " (Admin)"}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No groups</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">{new Date(user.created_at).toLocaleDateString()}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" disabled={isUpdating === user.id}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleRoleChange(user.id, "user")} disabled={user.role === "user"}>
                      Set as User
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleRoleChange(user.id, "group_admin")}
                      disabled={user.role === "group_admin"}
                    >
                      Set as Group Admin
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleRoleChange(user.id, "super_admin")}
                      disabled={user.role === "super_admin"}
                    >
                      Set as Super Admin
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
