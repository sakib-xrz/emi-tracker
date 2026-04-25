import { EMI_CONFIG, PAYMENT_STATUS } from "@/lib/app-config"
import { clampPercentage } from "@/lib/format"
import type { PaymentSummary } from "@/lib/types"

type SummaryPayment = {
  amount: number
  status: string
}

export function calculateSummary(payments: SummaryPayment[]): PaymentSummary {
  const totalApprovedPaid = payments
    .filter((payment) => payment.status === PAYMENT_STATUS.approved)
    .reduce((sum, payment) => sum + payment.amount, 0)

  const totalRecordedPaid = payments.reduce((sum, payment) => sum + payment.amount, 0)
  const totalRemaining = Math.max(EMI_CONFIG.totalDebt - totalApprovedPaid, 0)
  const progressPercent = clampPercentage((totalApprovedPaid / EMI_CONFIG.totalDebt) * 100)

  return {
    totalApprovedPaid,
    totalRecordedPaid,
    totalRemaining,
    progressPercent,
  }
}
