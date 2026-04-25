import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { PAYMENT_STATUS } from "@/lib/app-config"

function getStoragePathFromProofUrl(proofUrl: string) {
  const marker = "/storage/v1/object/public/payment-proofs/"
  const markerIndex = proofUrl.indexOf(marker)
  if (markerIndex === -1) return null
  return decodeURIComponent(proofUrl.slice(markerIndex + marker.length))
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const { paymentId } = await params
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("proof_url")
      .eq("id", paymentId)
      .single()

    if (paymentError || !payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    const proofPath = getStoragePathFromProofUrl(payment.proof_url)
    if (proofPath) {
      const { error: storageError } = await supabase.storage.from("payment-proofs").remove([proofPath])
      if (storageError) {
        return NextResponse.json({ error: storageError.message }, { status: 400 })
      }
    }

    const { error: deleteError } = await supabase.from("payments").delete().eq("id", paymentId)
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 })
    }

    const { data: remainingPayments, error: listError } = await supabase
      .from("payments")
      .select("id, installment_no")
      .order("installment_no", { ascending: true })

    if (listError) {
      return NextResponse.json({ error: listError.message }, { status: 400 })
    }

    for (let index = 0; index < (remainingPayments?.length ?? 0); index += 1) {
      const paymentItem = remainingPayments?.[index]
      if (!paymentItem) continue

      const expectedInstallmentNo = index + 1
      if (paymentItem.installment_no === expectedInstallmentNo) continue

      const { error: resequenceError } = await supabase
        .from("payments")
        .update({ installment_no: expectedInstallmentNo })
        .eq("id", paymentItem.id)

      if (resequenceError) {
        return NextResponse.json({ error: resequenceError.message }, { status: 400 })
      }
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 })
  }
}

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const { paymentId } = await params
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const securityCode = Math.random().toString(36).slice(2, 8).toUpperCase()

    const { data: updatedPayment, error } = await supabase
      .from("payments")
      .update({ security_code: securityCode })
      .eq("id", paymentId)
      .eq("status", PAYMENT_STATUS.pending)
      .select("id")
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (!updatedPayment) {
      return NextResponse.json(
        { error: "Payment is already approved or not found" },
        { status: 400 }
      )
    }

    return NextResponse.json({ ok: true, security_code: securityCode })
  } catch {
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 })
  }
}
