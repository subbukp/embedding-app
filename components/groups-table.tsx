"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, Settings, Trash2 } from "lucide-react"
import { ManageMembersDialog } from "./manage-members-dialog"
import { EditGroupDialog } from "./edit-group-dialog"
import { deleteGroup } from "@/app/admin/groups/actions"
import { useRouter } from "next/navigation"

interface Group {
  id: string
  name: string
  description: string | null
  created_at: string
  group_members: { count: number }[]
}

interface GroupsTableProps {
  groups: Group[]
  userRole: string
}

export function GroupsTable({ groups, userRole }: GroupsTableProps) {
  const router = useRouter()
  const [managingGroup, setManagingGroup] = useState<Group | null>(null)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (groupId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this group? This will remove all members and dashboards associated with it.",
      )
    ) {
      return
    }

    setDeletingId(groupId)
    try {
      await deleteGroup(groupId)
      router.refresh()
    } catch (error) {
      console.error("[v0] Error deleting group:", error)
      alert("Failed to delete group")
    } finally {
      setDeletingId(null)
    }
  }

  const getMemberCount = (group: Group) => {
    return group.group_members?.[0]?.count || 0
  }

  return (
    <>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Group Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No groups found
                </TableCell>
              </TableRow>
            ) : (
              groups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell className="font-medium">{group.name}</TableCell>
                  <TableCell className="text-muted-foreground">{group.description || "No description"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      <Users className="mr-1 h-3 w-3" />
                      {getMemberCount(group)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(group.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setManagingGroup(group)}>
                        <Users className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setEditingGroup(group)}>
                        <Settings className="h-4 w-4" />
                      </Button>
                      {userRole === "super_admin" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(group.id)}
                          disabled={deletingId === group.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {managingGroup && (
        <ManageMembersDialog
          group={managingGroup}
          open={!!managingGroup}
          onOpenChange={(open) => !open && setManagingGroup(null)}
        />
      )}

      {editingGroup && (
        <EditGroupDialog
          group={editingGroup}
          open={!!editingGroup}
          onOpenChange={(open) => !open && setEditingGroup(null)}
        />
      )}
    </>
  )
}
