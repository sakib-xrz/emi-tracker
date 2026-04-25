import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

import {
  assertSupabaseConfigured,
  supabaseAnonKey,
  supabaseUrl,
} from "@/lib/supabase/env"

export async function createClient() {
  assertSupabaseConfigured()
  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // Ignore write errors when called from Server Components.
        }
      },
    },
  })
}
