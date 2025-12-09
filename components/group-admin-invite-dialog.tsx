"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserPlus, Check } from "lucide-react"
import { createGroupAdminInvitation } from "@/app/group-admin/actions"

interface GroupAdminInviteDialogProps {
  groups: Array<{ id: string; name: string; description?: string }>
}

export function GroupAdminInviteDialog({ groups }: GroupAdminInviteDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    groupId: groups[0]?.id || "",
  })

  const hasSingleGroup = groups.length === 1
  const selectedGroup = groups.find((g) => g.id === formData.groupId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await createGroupAdminInvitation({
        email: formData.email,
        groupId: formData.groupId,
      })
      setSuccess(true)
      setTimeout(() => {
        setOpen(false)
        setSuccess(false)
        setFormData({ email: "", groupId: groups[0]?.id || "" })
      }, 2000)
    } catch (error) {
      console.error("[v0] Invitation error:", error)
      alert("Failed to send invitation")
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setSuccess(false)
      setFormData({ email: "", groupId: groups[0]?.id || "" })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite User
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite User to Group</DialogTitle>
          <DialogDescription>
            {hasSingleGroup
              ? `User will be added to "${selectedGroup?.name}" group`
              : "Send an invitation to add a new user to one of your groups"}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Invitation Sent!</h3>
            <p className="text-sm text-muted-foreground">
              The user will receive an email with instructions to join <strong>{selectedGroup?.name}</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            {hasSingleGroup ? (
              <div className="space-y-2">
                <Label>Assign to Group</Label>
                <div className="p-3 bg-muted rounded-md">
                  <p className="font-medium">{selectedGroup?.name}</p>
                  {selectedGroup?.description && (
                    <p className="text-xs text-muted-foreground mt-1">{selectedGroup.description}</p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">User will be added as a regular member of your group</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="group">Assign to Group</Label>
                <Select
                  value={formData.groupId}
                  onValueChange={(value) => setFormData({ ...formData, groupId: value })}
                >
                  <SelectTrigger id="group">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">User will be added as a regular member of this group</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Sending..." : "Send Invitation"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
