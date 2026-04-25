import Link from "next/link"

import { PublicPaymentsTable } from "@/components/payments-table"
import { SummaryCard } from "@/components/summary-card"
import { SummaryGrid } from "@/components/summary-grid"
import { SetupNotice } from "@/components/setup-notice"
import { Button } from "@/components/ui/button"
import { EMI_CONFIG } from "@/lib/app-config"
import { calculateSummary } from "@/lib/payments"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import { createClient } from "@/lib/supabase/server"
import type { PublicPaymentRecord } from "@/lib/types"

export default async function PaymentHistoryPage() {
  if (!isSupabaseConfigured) {
    return (
      <main className="container mx-auto flex min-h-screen max-w-5xl items-center px-4 py-10">
        <SetupNotice />
      </main>
    )
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from("public_payment_status")
    .select("*")
    .order("installment_no", { ascending: true })

  const payments = ((data ?? []) as PublicPaymentRecord[]).map((payment) => ({
    ...payment,
    amount: Number(payment.amount),
  }))
  const summary = calculateSummary(payments)

  return (
    <main className="container mx-auto w-full max-w-6xl px-4 py-6 sm:py-10">
      <section className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">EMI Payment History</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Target includes 14.5% interest: {EMI_CONFIG.totalDebt.toLocaleString()} BDT total
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/">Owner Dashboard</Link>
        </Button>
      </section>

      <div className="grid gap-4">
        <SummaryCard summary={summary} />
        <SummaryGrid summary={summary} />
        <PublicPaymentsTable payments={payments} />
      </div>
    </main>
  )
}
