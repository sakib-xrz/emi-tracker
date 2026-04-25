import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const { paymentId } = await params
    const body = (await request.json()) as { securityCode?: string }
    const securityCode = body.securityCode?.trim().toUpperCase() ?? ""
    if (!securityCode) {
      return NextResponse.json({ error: "Security code is required" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data, error } = await supabase.rpc("approve_payment_with_code", {
      payment_id_input: paymentId,
      security_code_input: securityCode,
    })

    if (error || !data) {
      return NextResponse.json(
        { error: "Invalid code or payment already approved" },
        { status: 400 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 })
  }
}
