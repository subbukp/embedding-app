"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { Mail, Shield, Lock, KeyRound, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { DecorativeShapes } from "@/components/decorative-shapes"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendSuccess, setResendSuccess] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const handleOTPLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    let supabase
    try {
      supabase = createClient()
    } catch (err) {
      setError("Configuration error. Please contact support.")
      console.error("[v0] Supabase client creation failed:", err)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log("[v0] Sending OTP to:", email)
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        },
      })

      if (error) throw error
      console.log("[v0] OTP sent successfully")
      setEmailSent(true)
    } catch (error: unknown) {
      console.error("[v0] OTP send error:", error)
      setError(error instanceof Error ? "User does not exist" : error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    let supabase
    try {
      supabase = createClient()
    } catch (err) {
      setError("Configuration error. Please contact support.")
      console.error("[v0] Supabase client creation failed:", err)
      return
    }

    setIsVerifying(true)
    setError(null)

    try {
      console.log("[v0] Verifying OTP for:", email)
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      })

      if (error) throw error
      console.log("[v0] OTP verified successfully, session created")

      if (data.session) {
        window.location.href = "/dashboard"
      }
    } catch (error: unknown) {
      console.error("[v0] OTP verification error:", error)
      setError(error instanceof Error ? error.message : "Invalid or expired OTP code")
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResendOTP = async () => {
    let supabase
    try {
      supabase = createClient()
    } catch (err) {
      setError("Configuration error. Please contact support.")
      return
    }

    setIsResending(true)
    setError(null)
    setResendSuccess(false)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        },
      })

      if (error) throw error
      setResendSuccess(true)
      setResendCooldown(60)
      setTimeout(() => setResendSuccess(false), 3000)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to resend code")
    } finally {
      setIsResending(false)
    }
  }

  if (emailSent) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-background p-6">
        <DecorativeShapes />
        <Card className="relative z-10 w-full max-w-md border-border/30 bg-card/80 backdrop-blur shadow-2xl">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-semibold text-primary">Check your email</CardTitle>
            <CardDescription className="text-base text-foreground/80">
              We've sent a verification code to <strong className="text-foreground">{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 space-y-2">
              <div className="flex items-start gap-3">
                <KeyRound className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-2 text-foreground">Enter the verification code</h3>
                  <form onSubmit={handleVerifyOTP} className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="otp" className="text-xs font-medium text-foreground/80">
                        8-digit verification code
                      </Label>
                      <Input
                        id="otp"
                        type="text"
                        placeholder="00000000"
                        required
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 8))}
                        className="text-center text-lg tracking-widest bg-secondary/50 border-border/50"
                        disabled={isVerifying}
                        maxLength={8}
                        pattern="[0-9]{8}"
                      />
                    </div>

                    {error && (
                      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-2">
                        <p className="text-xs text-destructive">{error}</p>
                      </div>
                    )}

                    {resendSuccess && (
                      <div className="rounded-lg border border-sage/50 bg-sage/10 p-2">
                        <p className="text-xs text-sage">New code sent successfully!</p>
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full rounded-full bg-primary hover:bg-primary/90"
                      size="sm"
                      disabled={isVerifying || otp.length !== 8}
                    >
                      {isVerifying ? (
                        <>
                          <span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <Lock className="mr-2 h-3 w-3" />
                          Verify code
                        </>
                      )}
                    </Button>
                  </form>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border/30 bg-secondary/30 p-3">
              <p className="text-xs text-muted-foreground">
                The 8-digit code expires in 60 minutes. Didn't receive it? Check your spam folder.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 rounded-full bg-transparent border-primary/50 text-primary hover:bg-primary/10"
                onClick={handleResendOTP}
                disabled={isResending || resendCooldown > 0}
              >
                {isResending ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Sending...
                  </>
                ) : resendCooldown > 0 ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Resend in {resendCooldown}s
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Resend code
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                className="flex-1 rounded-full text-foreground/70 hover:text-foreground hover:bg-secondary/50"
                onClick={() => {
                  setEmailSent(false)
                  setOtp("")
                  setError(null)
                  setResendCooldown(0)
                  setResendSuccess(false)
                }}
              >
                Different email
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-6">
      <DecorativeShapes />
      <Card className="relative z-10 w-full max-w-md border-border/30 bg-card/80 backdrop-blur shadow-2xl">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold text-primary">Welcome back</CardTitle>
          <CardDescription className="text-base text-foreground/80">
            This is an invite-only portal. Enter your email to receive a secure verification code.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleOTPLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground/80">
                Email address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-secondary/50 border-border/50"
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full rounded-full bg-primary hover:bg-primary/90" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Sending...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Send verification code
                </>
              )}
            </Button>

            <div className="rounded-xl border border-border/30 bg-secondary/30 p-4">
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground/80">Secure authentication:</strong> We'll send an email with an
                8-digit verification code. Your session uses JWT tokens stored in secure HTTP-only cookies.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
