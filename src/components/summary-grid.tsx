import { CircleDollarSign, HandCoins, Wallet } from "lucide-react"

import { EMI_CONFIG } from "@/lib/app-config"
import { formatCurrency } from "@/lib/format"
import type { PaymentSummary } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

type SummaryGridProps = {
  summary: PaymentSummary
}

export function SummaryGrid({ summary }: SummaryGridProps) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <Card className="border-white/10 bg-card/95 backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-bold">Total Paid</CardTitle>
          <HandCoins className="text-muted-foreground size-4" />
        </CardHeader>
        <CardContent className="gap-1">
          <p className="text-xl font-semibold">{formatCurrency(summary.totalApprovedPaid)}</p>
          <p className="text-muted-foreground text-xs">Approved payments only</p>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-card/95 backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-bold">Total Remaining</CardTitle>
          <Wallet className="text-muted-foreground size-4" />
        </CardHeader>
        <CardContent className="gap-1">
          <p className="text-xl font-semibold">{formatCurrency(summary.totalRemaining)}</p>
          <p className="text-muted-foreground text-xs">
            Out of {formatCurrency(EMI_CONFIG.totalDebt)}
          </p>
        </CardContent>
      </Card>

      <Card className="sm:col-span-2 lg:col-span-1 border-white/10 bg-card/95 backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-bold">Progress</CardTitle>
          <CircleDollarSign className="text-muted-foreground size-4" />
        </CardHeader>
        <CardContent className="gap-2">
          <Progress value={summary.progressPercent} />
          <p className="text-sm font-semibold">{summary.progressPercent.toFixed(1)}%</p>
        </CardContent>
      </Card>
    </section>
  )
}
