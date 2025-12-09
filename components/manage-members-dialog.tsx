"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { X, UserPlus, Shield } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { addGroupMember, removeGroupMember, toggleGroupAdmin } from "@/app/admin/groups/actions"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ManageMembersDialogProps {
  group: {
    id: string
    name: string
  }
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Member {
  id: string
  user_id: string
  is_admin: boolean
  profiles: {
    email: string
    full_name: string | null
    role: string
  }
}

interface AvailableUser {
  id: string
  email: string
  full_name: string | null
}

export function ManageMembersDialog({ group, open, onOpenChange }: ManageMembersDialogProps) {
  const router = useRouter()
  const [members, setMembers] = useState<Member[]>([])
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      loadMembers()
      loadAvailableUsers()
    }
  }, [open, group.id])

  const loadMembers = async () => {
    const supabase = createBrowserClient()
    const { data } = await supabase
      .from("group_members")
      .select(`
        *,
        profiles:user_id (
          email,
          full_name,
          role
        )
      `)
      .eq("group_id", group.id)
      .eq("is_active", true) // Only show active members

    if (data) {
      setMembers(data as Member[])
    }
  }

  const loadAvailableUsers = async () => {
    const supabase = createBrowserClient()
    const { data } = await supabase.from("profiles").select("id, email, full_name").order("email")

    if (data) {
      setAvailableUsers(data)
    }
  }

  const handleAddMember = async () => {
    if (!selectedUserId) return

    setLoading(true)
    try {
      await addGroupMember(group.id, selectedUserId)
      setSelectedUserId("")
      await loadMembers()
      await loadAvailableUsers()
      router.refresh()
    } catch (error) {
      console.error("[v0] Error adding member:", error)
      alert("Failed to add member")
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    setLoading(true)
    try {
      await removeGroupMember(memberId)
      await loadMembers()
      await loadAvailableUsers()
      router.refresh()
    } catch (error) {
      console.error("[v0] Error removing member:", error)
      alert("Failed to remove member")
    } finally {
      setLoading(false)
    }
  }

  const handleToggleAdmin = async (memberId: string, currentIsAdmin: boolean) => {
    setLoading(true)
    try {
      await toggleGroupAdmin(memberId, !currentIsAdmin)
      await loadMembers()
      router.refresh()
    } catch (error) {
      console.error("[v0] Error toggling admin:", error)
      alert("Failed to update admin status")
    } finally {
      setLoading(false)
    }
  }

  const memberUserIds = members.map((m) => m.user_id)
  const usersNotInGroup = availableUsers.filter((u) => !memberUserIds.includes(u.id))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Members - {group.name}</DialogTitle>
          <DialogDescription>Add or remove members and manage group admin permissions</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Add Member</h3>
            <div className="flex gap-2">
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {usersNotInGroup.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAddMember} disabled={!selectedUserId || loading}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Current Members ({members.length})</h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium">{member.profiles.full_name || member.profiles.email}</p>
                      <p className="text-sm text-muted-foreground">{member.profiles.email}</p>
                    </div>
                    {member.is_admin && (
                      <Badge variant="secondary">
                        <Shield className="h-3 w-3 mr-1" />
                        Group Admin
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleAdmin(member.id, member.is_admin)}
                      disabled={loading}
                    >
                      {member.is_admin ? "Remove Admin" : "Make Admin"}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveMember(member.id)} disabled={loading}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {members.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No members in this group yet</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
