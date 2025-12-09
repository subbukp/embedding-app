"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createInvitation } from "@/app/admin/invitations/actions"
import { CheckCircle2, AlertCircle } from "lucide-react"

interface Group {
  id: string
  name: string
}

export function InviteUserDialog({
  children,
  groups,
  currentUserId,
}: {
  children: React.ReactNode
  groups: Group[]
  currentUserId: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    role: "user",
    group_id: "none",
  })

  const isGroupRequired = formData.role === "group_admin"
  const isGroupMissing = isGroupRequired && formData.group_id === "none"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isGroupMissing) {
      alert("Group Admin role requires a group assignment")
      return
    }

    setLoading(true)

    try {
      await createInvitation({
        ...formData,
        invited_by: currentUserId,
      })

      setSuccess(true)
      router.refresh()
    } catch (error) {
      console.error("[v0] Error creating invitation:", error)
      alert("Failed to create invitation")
      setLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)

    if (!newOpen) {
      setSuccess(false)
      setFormData({ email: "", role: "user", group_id: "none" })
      setLoading(false)
    }
  }

  const handleClose = () => {
    handleOpenChange(false)
  }

  const handleRoleChange = (value: string) => {
    setFormData({
      ...formData,
      role: value,
      group_id: value === "super_admin" ? "none" : formData.group_id,
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        {!success ? (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Invite New User</DialogTitle>
              <DialogDescription>Send an invitation to join the portal</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
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
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={formData.role} onValueChange={handleRoleChange}>
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="group_admin">Group Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="group" className="flex items-center gap-1">
                  Group {isGroupRequired ? <span className="text-destructive">*</span> : "(Optional)"}
                </Label>
                <Select
                  value={formData.group_id}
                  onValueChange={(value) => setFormData({ ...formData, group_id: value })}
                >
                  <SelectTrigger id="group" className={isGroupMissing ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select a group" />
                  </SelectTrigger>
                  <SelectContent>
                    {!isGroupRequired && <SelectItem value="none">No group</SelectItem>}
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isGroupMissing && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Group Admin must be assigned to a group
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || isGroupMissing}>
                {loading ? "Creating..." : "Create Invitation"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Invitation Created</h3>
            <p className="text-sm text-muted-foreground mb-6">
              An invitation has been sent to <strong>{formData.email}</strong>
            </p>
            <Button onClick={handleClose}>Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
