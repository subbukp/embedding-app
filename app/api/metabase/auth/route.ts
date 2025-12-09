import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { createClient } from "@/lib/supabase/server"

const METABASE_JWT_SHARED_SECRET = process.env.METABASE_JWT_SHARED_SECRET
const METABASE_INSTANCE_URL = process.env.METABASE_INSTANCE_URL

export async function GET(request: NextRequest) {
  console.log("[Metabase Auth] GET request received")

  if (!METABASE_JWT_SHARED_SECRET) {
    throw new Error("Missing METABASE_JWT_SHARED_SECRET")
  }

  if (!METABASE_INSTANCE_URL) {
    throw new Error("Missing METABASE_INSTANCE_URL")
  }

  // For demo purposes, use a hardcoded user
  // TODO: integrate with your auth system
  const user = {
    email: "admin@az.com",
    firstName: "Sarah",
    lastName: "Johnson",
    group: "admin",
  }

  console.log('[Metabase Auth] Generating JWT for user:', user.email)

  const token = jwt.sign(
    {
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
      groups: [user.group],
      exp: Math.round(Date.now() / 1000) + 60 * 10,
    },
    METABASE_JWT_SHARED_SECRET
  )

  const url = new URL(request.url)
  const wantsJson = url.searchParams.get('response') === 'json'

  if (wantsJson) {
    console.log('[Metabase Auth] Returning JWT token')
    return NextResponse.json({ jwt: token })
  }

  const ssoUrl = `${METABASE_INSTANCE_URL}/auth/sso?jwt=${token}`

  try {
    console.log('[Metabase Auth] Fetching SSO session from:', ssoUrl)
    const response = await fetch(ssoUrl)
    const session = await response.text()
    console.log('[Metabase Auth] SSO session obtained')
    return new Response(session)
  } catch (error) {
    console.error('[Metabase Auth] Error:', error)
    const message = error instanceof Error ? error.message : "unknown error"
    return new Response(message, { status: 500 })
  }
}

