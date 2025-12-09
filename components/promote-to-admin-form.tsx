"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { promoteToSuperAdmin } from "@/app/admin/role-setup/actions"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield } from "lucide-react"

export function PromoteToAdminForm({
  currentUserId,
  currentEmail,
}: {
  currentUserId: string
  currentEmail: string
}) {
  const [email, setEmail] = useState(currentEmail)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)

    try {
      const result = await promoteToSuperAdmin(email)

      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          router.refresh()
          router.push("/dashboard")
        }, 2000)
      } else {
        setError(result.error || "Failed to promote user")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          This will grant super admin privileges. Use with caution. Typically, you'll promote yourself first.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label htmlFor="email">Email to Promote</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@example.com"
          required
        />
        <p className="text-sm text-muted-foreground">Enter the email of the user to promote to super admin</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500 bg-green-500/10">
          <AlertDescription className="text-green-600">
            Successfully promoted to super admin! Redirecting...
          </AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Promoting..." : "Promote to Super Admin"}
      </Button>
    </form>
  )
}
