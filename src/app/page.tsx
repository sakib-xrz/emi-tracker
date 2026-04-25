import Link from "next/link"

import { LoginCard } from "@/components/login-card"
import { LogoutButton } from "@/components/logout-button"
import { OwnerPaymentsTable } from "@/components/payments-table"
import { PaymentForm } from "@/components/payment-form"
import { SetupNotice } from "@/components/setup-notice"
import { SummaryCard } from "@/components/summary-card"
import { SummaryGrid } from "@/components/summary-grid"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { EMI_CONFIG } from "@/lib/app-config"
import { calculateSummary } from "@/lib/payments"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import { createClient } from "@/lib/supabase/server"
import type { PaymentRecord } from "@/lib/types"

type HomePageProps = {
  searchParams: Promise<{
    error?: string
  }>
}

export default async function Home({ searchParams }: HomePageProps) {
  const params = await searchParams

  if (!isSupabaseConfigured) {
    return (
      <main className="container mx-auto flex min-h-screen max-w-5xl items-center px-4 py-10">
        <SetupNotice />
      </main>
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="container mx-auto flex min-h-screen max-w-5xl items-center px-4 py-10">
        <LoginCard error={params.error} />
      </main>
    )
  }

  const { data } = await supabase
    .from("payments")
    .select("*")
    .order("installment_no", { ascending: true })

  const payments = ((data ?? []) as PaymentRecord[]).map((payment) => ({
    ...payment,
    amount: Number(payment.amount),
  }))
  const summary = calculateSummary(payments)

  return (
    <main className="container mx-auto w-full max-w-6xl px-4 py-6 sm:py-10">
      <section className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">EMI Tracker</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {EMI_CONFIG.itemName} - {EMI_CONFIG.months} months | Principal{" "}
            {EMI_CONFIG.principalDebt.toLocaleString()} BDT + {EMI_CONFIG.annualInterestRate}% interest ={" "}
            {EMI_CONFIG.totalDebt.toLocaleString()} BDT
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/payment-history">Payment History</Link>
          </Button>
          <LogoutButton />
        </div>
      </section>

      {params.error ? (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Action failed</AlertTitle>
          <AlertDescription>{params.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4">
        <SummaryCard summary={summary} />
        <SummaryGrid summary={summary} />
        <PaymentForm />
        <OwnerPaymentsTable payments={payments} />
      </div>
    </main>
  )
}
