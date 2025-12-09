"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mail, Shield, Users } from "lucide-react"
import { acceptInvitation } from "@/app/accept-invite/actions"
import { createBrowserClient } from "@/lib/supabase/client"

interface AcceptInviteFormProps {
  invitation: {
    id: string
    email: string
    role: string
    token: string
    groups: {
      id: string
      name: string
    } | null
  }
}

export function AcceptInviteForm({ invitation }: AcceptInviteFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState("")

  const handleSendOTP = async () => {
    setLoading(true)
    try {
      const supabase = createBrowserClient()
      const { error } = await supabase.auth.signInWithOtp({
        email: invitation.email,
        options: {
          shouldCreateUser: true,
        },
      })

      if (error) throw error

      setOtpSent(true)
    } catch (error) {
      console.error("[v0] Error sending OTP:", error)
      alert("Failed to send OTP")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) return

    setLoading(true)
    try {
      const supabase = createBrowserClient()

      const { data, error } = await supabase.auth.verifyOtp({
        email: invitation.email,
        token: otp,
        type: "email",
      })

      if (error) throw error

      if (data.user) {
        await acceptInvitation(invitation.token, data.user.id)
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("[v0] Error verifying OTP:", error)
      alert("Invalid OTP code")
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <CardTitle>You've Been Invited!</CardTitle>
        <CardDescription>Accept this invitation to join the portal</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Email</span>
            </div>
            <span className="text-sm text-muted-foreground">{invitation.email}</span>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Role</span>
            </div>
            <Badge variant="secondary">{invitation.role.replace("_", " ")}</Badge>
          </div>

          {invitation.groups && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Group</span>
              </div>
              <Badge variant="outline">{invitation.groups.name}</Badge>
            </div>
          )}
        </div>

        {!otpSent ? (
          <Button className="w-full" onClick={handleSendOTP} disabled={loading}>
            {loading ? "Sending..." : "Accept Invitation"}
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Enter OTP Code</label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="w-full rounded-lg border bg-background px-4 py-2 text-center text-2xl tracking-widest"
              />
              <p className="text-xs text-muted-foreground text-center">Check your email for the 6-digit code</p>
            </div>
            <Button className="w-full" onClick={handleVerifyOTP} disabled={loading || otp.length !== 6}>
              {loading ? "Verifying..." : "Complete Registration"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
