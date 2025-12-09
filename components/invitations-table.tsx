"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Copy, Trash2, CheckCircle2, Clock } from "lucide-react"
import { deleteInvitation } from "@/app/admin/invitations/actions"
import { useRouter } from "next/navigation"

interface Invitation {
  id: string
  email: string
  role: string
  token: string
  expires_at: string
  used_at: string | null
  created_at: string
  groups: {
    id: string
    name: string
  } | null
  profiles: {
    email: string
    full_name: string | null
  }
}

interface InvitationsTableProps {
  invitations: Invitation[]
}

export function InvitationsTable({ invitations }: InvitationsTableProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  const handleDelete = async (invitationId: string) => {
    if (!confirm("Are you sure you want to delete this invitation?")) {
      return
    }

    setDeletingId(invitationId)
    try {
      await deleteInvitation(invitationId)
      router.refresh()
    } catch (error) {
      console.error("[v0] Error deleting invitation:", error)
      alert("Failed to delete invitation")
    } finally {
      setDeletingId(null)
    }
  }

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/accept-invite?token=${token}`
    navigator.clipboard.writeText(link)
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date()

  const getStatusBadge = (invitation: Invitation) => {
    if (invitation.used_at) {
      return (
        <Badge variant="secondary" className="gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Used
        </Badge>
      )
    }
    if (isExpired(invitation.expires_at)) {
      return (
        <Badge variant="destructive" className="gap-1">
          <Clock className="h-3 w-3" />
          Expired
        </Badge>
      )
    }
    return (
      <Badge variant="default" className="gap-1">
        <Clock className="h-3 w-3" />
        Pending
      </Badge>
    )
  }

  const getRoleBadge = (role: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      super_admin: "destructive",
      group_admin: "default",
      user: "secondary",
    }
    return <Badge variant={variants[role] || "outline"}>{role.replace("_", " ")}</Badge>
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Group</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Invited By</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invitations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                No invitations found
              </TableCell>
            </TableRow>
          ) : (
            invitations.map((invitation) => (
              <TableRow key={invitation.id}>
                <TableCell className="font-medium">{invitation.email}</TableCell>
                <TableCell>{getRoleBadge(invitation.role)}</TableCell>
                <TableCell>
                  {invitation.groups ? (
                    <Badge variant="outline">{invitation.groups.name}</Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">No group</span>
                  )}
                </TableCell>
                <TableCell>{getStatusBadge(invitation)}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {invitation.profiles.full_name || invitation.profiles.email}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(invitation.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {!invitation.used_at && !isExpired(invitation.expires_at) && (
                      <Button variant="ghost" size="sm" onClick={() => copyInviteLink(invitation.token)}>
                        {copiedToken === invitation.token ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(invitation.id)}
                      disabled={deletingId === invitation.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
