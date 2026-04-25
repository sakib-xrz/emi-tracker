"use client"

import { useParams } from "next/navigation"

import { ApprovePaymentCard } from "@/components/approve-payment-card"
import { SetupNotice } from "@/components/setup-notice"
import { isSupabaseConfigured } from "@/lib/supabase/env"

export default function ApprovePage() {
  const params = useParams<{ paymentId: string }>()

  if (!isSupabaseConfigured) {
    return (
      <main className="container mx-auto flex min-h-screen max-w-5xl items-center px-4 py-10">
        <SetupNotice />
      </main>
    )
  }

  return (
    <main className="container mx-auto flex min-h-screen max-w-5xl items-center px-4 py-10">
      <ApprovePaymentCard paymentId={params.paymentId} />
    </main>
  )
}
