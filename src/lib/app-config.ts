const principalDebt = 92_000
const annualInterestRate = 14.5
const interestAmount = Math.round((principalDebt * annualInterestRate) / 100)

export const EMI_CONFIG = {
  itemName: "MacBook Air M4",
  lenderName: "Mohsin",
  principalDebt,
  annualInterestRate,
  interestAmount,
  totalDebt: principalDebt + interestAmount,
  months: 24,
} as const

export const PAYMENT_METHODS = [
  "Bank Transfer",
  "bKash",
  "Rocket",
  "Cash",
] as const

export const PAYMENT_STATUS = {
  pending: "Pending",
  approved: "Approved",
} as const

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]
export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS]
