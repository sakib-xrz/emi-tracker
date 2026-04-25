import { PublicPaymentsTable } from "@/components/payments-table";
import { SummaryCard } from "@/components/summary-card";
import { SummaryGrid } from "@/components/summary-grid";
import { SetupNotice } from "@/components/setup-notice";
import { Card, CardContent } from "@/components/ui/card";
import { EMI_CONFIG } from "@/lib/app-config";
import { calculateSummary } from "@/lib/payments";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { PublicPaymentRecord } from "@/lib/types";

export default async function PaymentHistoryPage() {
  if (!isSupabaseConfigured) {
    return (
      <main className="container mx-auto flex min-h-screen max-w-5xl items-center px-4 py-10">
        <SetupNotice />
      </main>
    );
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("public_payment_status")
    .select("*")
    .order("installment_no", { ascending: true });

  const payments = ((data ?? []) as PublicPaymentRecord[]).map((payment) => ({
    ...payment,
    amount: Number(payment.amount),
  }));
  const summary = calculateSummary(payments);

  return (
    <main className="container mx-auto w-full max-w-6xl px-4 py-6 sm:py-10">
      <section className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            EMI Payment History
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            On 92,000 BDT with 14.5% interest payable amount is{" "}
            {EMI_CONFIG.totalDebt.toLocaleString()} BDT.
          </p>
        </div>
      </section>

      <div className="grid gap-4">
        <SummaryCard summary={summary} />
        <SummaryGrid summary={summary} />
        {payments.length ? (
          <PublicPaymentsTable payments={payments} />
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center">
              <p className="text-lg font-semibold">No payment history yet</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Once approvals are submitted, installment updates will appear
                here.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
