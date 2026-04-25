import { TrendingUp } from "lucide-react"

import { EMI_CONFIG } from "@/lib/app-config"
import { formatCurrency } from "@/lib/format"
import type { PaymentSummary } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

type SummaryCardProps = {
  summary: PaymentSummary
}

export function SummaryCard({ summary }: SummaryCardProps) {
  return (
    <Card className="sm:hidden border-white/10 bg-card/95 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-bold">
          <TrendingUp className="size-4" />
          EMI Snapshot
        </CardTitle>
      </CardHeader>
      <CardContent className="gap-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">Paid</p>
            <p className="font-semibold">{formatCurrency(summary.totalApprovedPaid)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Remaining</p>
            <p className="font-semibold">{formatCurrency(summary.totalRemaining)}</p>
          </div>
        </div>
        <Progress value={summary.progressPercent} className="h-2.5" />
        <p className="text-muted-foreground text-xs">
          {summary.progressPercent.toFixed(1)}% of {formatCurrency(EMI_CONFIG.totalDebt)}
        </p>
      </CardContent>
    </Card>
  )
}
