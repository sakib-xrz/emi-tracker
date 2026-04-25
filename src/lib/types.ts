import type { PaymentMethod, PaymentStatus } from "@/lib/app-config"

export type PaymentRecord = {
  id: string
  amount: number
  payment_date: string
  method: PaymentMethod
  proof_url: string
  installment_no: number
  status: PaymentStatus
  security_code: string
  created_at: string
}

export type PaymentSummary = {
  totalApprovedPaid: number
  totalRecordedPaid: number
  totalRemaining: number
  progressPercent: number
}

export type PublicPaymentRecord = Omit<PaymentRecord, "security_code">
