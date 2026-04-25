"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { PAYMENT_METHODS, PAYMENT_STATUS } from "@/lib/app-config"
import { createClient } from "@/lib/supabase/server"

function generateSecurityCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

function normalizeMethod(value: string) {
  if (PAYMENT_METHODS.includes(value as (typeof PAYMENT_METHODS)[number])) {
    return value as (typeof PAYMENT_METHODS)[number]
  }
  return null
}

function getStoragePathFromProofUrl(proofUrl: string) {
  const marker = "/storage/v1/object/public/payment-proofs/"
  const markerIndex = proofUrl.indexOf(marker)
  if (markerIndex === -1) return null
  return decodeURIComponent(proofUrl.slice(markerIndex + marker.length))
}

async function getNextInstallmentNo(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: lastPayment, error: fetchError } = await supabase
    .from("payments")
    .select("installment_no")
    .order("installment_no", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (fetchError) {
    return { nextInstallmentNo: null as number | null, error: fetchError.message }
  }

  return {
    nextInstallmentNo: (lastPayment?.installment_no ?? 0) + 1,
    error: null as string | null,
  }
}

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "")
  const password = String(formData.get("password") ?? "")
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    redirect(`/?error=${encodeURIComponent(error.message)}`)
  }

  redirect("/")
}

export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/")
}

export async function createPaymentAction(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/?error=Please sign in first")
  }

  const amount = Number(formData.get("amount"))
  const paymentDate = String(formData.get("payment_date") ?? "")
  const method = normalizeMethod(String(formData.get("method") ?? ""))
  const proofFile = formData.get("proof") as File | null

  if (!method) {
    redirect("/?error=Please select a valid payment method")
  }

  if (!proofFile || !proofFile.size) {
    redirect("/?error=Proof file is required")
  }

  if (!amount || amount <= 0) {
    redirect("/?error=Amount must be greater than 0")
  }

  if (!paymentDate) {
    redirect("/?error=Please select a payment date")
  }

  const proofPath = `${user.id}/${crypto.randomUUID()}-${proofFile.name.replaceAll(" ", "_")}`
  const { error: uploadError } = await supabase.storage
    .from("payment-proofs")
    .upload(proofPath, proofFile, {
      cacheControl: "3600",
      upsert: false,
    })

  if (uploadError) {
    redirect(`/?error=${encodeURIComponent(uploadError.message)}`)
  }

  const { data: proofData } = supabase.storage.from("payment-proofs").getPublicUrl(proofPath)
  const securityCode = generateSecurityCode()
  const { nextInstallmentNo, error: installmentError } = await getNextInstallmentNo(supabase)

  if (installmentError || !nextInstallmentNo) {
    redirect(`/?error=${encodeURIComponent(installmentError ?? "Could not generate installment number")}`)
  }

  const { error } = await supabase.from("payments").insert({
    amount,
    payment_date: paymentDate,
    method,
    proof_url: proofData.publicUrl,
    installment_no: nextInstallmentNo,
    status: PAYMENT_STATUS.pending,
    security_code: securityCode,
  })

  if (error) {
    redirect(`/?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath("/")
  revalidatePath("/payment-history")
  revalidatePath("/status")
  redirect("/")
}

export async function regenerateCodeAction(formData: FormData) {
  const paymentId = String(formData.get("payment_id") ?? "")
  const supabase = await createClient()
  const securityCode = generateSecurityCode()

  const { error } = await supabase
    .from("payments")
    .update({ security_code: securityCode })
    .eq("id", paymentId)
    .eq("status", PAYMENT_STATUS.pending)

  if (error) {
    redirect(`/?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath("/")
  redirect("/")
}

export async function deletePaymentAction(formData: FormData) {
  const paymentId = String(formData.get("payment_id") ?? "")
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/?error=Please sign in first")
  }

  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select("proof_url")
    .eq("id", paymentId)
    .single()

  if (paymentError || !payment) {
    redirect("/?error=Payment not found")
  }

  const proofPath = getStoragePathFromProofUrl(payment.proof_url)
  if (proofPath) {
    const { error: storageError } = await supabase.storage
      .from("payment-proofs")
      .remove([proofPath])

    if (storageError) {
      redirect(`/?error=${encodeURIComponent(storageError.message)}`)
    }
  }

  const { error: deleteError } = await supabase
    .from("payments")
    .delete()
    .eq("id", paymentId)

  if (deleteError) {
    redirect(`/?error=${encodeURIComponent(deleteError.message)}`)
  }

  // Keep installment numbers contiguous after deletion.
  const { data: remainingPayments, error: listError } = await supabase
    .from("payments")
    .select("id, installment_no")
    .order("installment_no", { ascending: true })

  if (listError) {
    redirect(`/?error=${encodeURIComponent(listError.message)}`)
  }

  for (let index = 0; index < (remainingPayments?.length ?? 0); index += 1) {
    const payment = remainingPayments?.[index]
    if (!payment) continue

    const expectedInstallmentNo = index + 1
    if (payment.installment_no === expectedInstallmentNo) continue

    const { error: resequenceError } = await supabase
      .from("payments")
      .update({ installment_no: expectedInstallmentNo })
      .eq("id", payment.id)

    if (resequenceError) {
      redirect(`/?error=${encodeURIComponent(resequenceError.message)}`)
    }
  }

  revalidatePath("/")
  revalidatePath("/payment-history")
  revalidatePath("/status")
  redirect("/")
}

export async function approvePaymentAction(formData: FormData) {
  const paymentId = String(formData.get("payment_id") ?? "")
  const securityCode = String(formData.get("security_code") ?? "").trim().toUpperCase()
  const supabase = await createClient()

  const { data, error } = await supabase.rpc("approve_payment_with_code", {
    payment_id_input: paymentId,
    security_code_input: securityCode,
  })

  if (error || !data) {
    redirect(`/approve/${paymentId}?error=Invalid code or payment already approved`)
  }

  revalidatePath("/")
  revalidatePath("/payment-history")
  revalidatePath("/status")
  redirect(`/approve/${paymentId}?success=1`)
}
