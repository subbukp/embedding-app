import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

/**
 * Root page - redirects based on authentication status
 */
export default async function HomePage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()

  if (data?.user) {
    redirect("/dashboard")
  } else {
    redirect("/login")
  }
}
