export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(input: string) {
  return new Date(input).toLocaleDateString("en-BD", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function clampPercentage(value: number) {
  if (value < 0) return 0
  if (value > 100) return 100
  return value
}
