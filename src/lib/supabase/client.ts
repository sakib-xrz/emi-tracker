"use client"

import { createBrowserClient } from "@supabase/ssr"

import { assertSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env"

export function createClient() {
  assertSupabaseConfigured()
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
