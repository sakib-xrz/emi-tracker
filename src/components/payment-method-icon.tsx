import {
  BanknoteArrowUp,
  Building2,
  HandCoins,
  Smartphone,
  type LucideIcon,
} from "lucide-react"

import type { PaymentMethod } from "@/lib/app-config"

const methodIcons: Record<PaymentMethod, LucideIcon> = {
  "Bank Transfer": Building2,
  bKash: Smartphone,
  Rocket: BanknoteArrowUp,
  Cash: HandCoins,
}

type PaymentMethodIconProps = {
  method: PaymentMethod
  className?: string
}

export function PaymentMethodIcon({ method, className }: PaymentMethodIconProps) {
  const Icon = methodIcons[method]
  return <Icon className={className} aria-hidden />
}
