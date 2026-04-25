import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import type { PublicPaymentRecord } from "@/lib/types"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const { paymentId } = await params
    const supabase = await createClient()
    const { data, error } = await supabase.rpc("get_payment_for_approval", {
      payment_id_input: paymentId,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const payment = (data?.[0] ?? null) as PublicPaymentRecord | null
    if (!payment) {
      return NextResponse.json({ payment: null })
    }

    return NextResponse.json({
      payment: {
        ...payment,
        amount: Number(payment.amount),
      },
    })
  } catch {
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 })
  }
}
