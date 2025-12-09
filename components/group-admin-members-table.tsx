"use client"

import { Badge } from "@/components/ui/badge"
import { Shield, User, CheckCircle, Clock } from "lucide-react"

interface Member {
  id: string
  group_id: string
  user_id: string
  is_admin: boolean
  joined_at: string
  groups: {
    id: string
    name: string
  }
  profiles: {
    id: string
    email: string
    full_name: string | null
    role: string
    last_sign_in_at: string | null
  }
}

interface GroupAdminMembersTableProps {
  members: Member[]
  currentUserId: string
}

export function GroupAdminMembersTable({ members, currentUserId }: GroupAdminMembersTableProps) {
  if (members.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No members found</p>
  }

  return (
    <div className="space-y-2">
      {members.map((member) => {
        const isActivated = !!member.profiles.last_sign_in_at

        return (
          <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{member.profiles.full_name || member.profiles.email}</p>
                  {member.user_id === currentUserId && <Badge variant="secondary">You</Badge>}
                  {member.is_admin && (
                    <Badge variant="outline">
                      <Shield className="h-3 w-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                  {isActivated ? (
                    <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Activated
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-amber-500/20 text-amber-600 hover:bg-amber-500/30">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{member.profiles.email}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Group: {member.groups.name} • Joined {new Date(member.joined_at).toLocaleDateString()}
                  {isActivated && member.profiles.last_sign_in_at && (
                    <> • Last login: {new Date(member.profiles.last_sign_in_at).toLocaleDateString()}</>
                  )}
                </p>
              </div>
            </div>
            <Badge variant={member.profiles.role === "super_admin" ? "default" : "outline"}>
              {member.profiles.role}
            </Badge>
          </div>
        )
      })}
    </div>
  )
}
