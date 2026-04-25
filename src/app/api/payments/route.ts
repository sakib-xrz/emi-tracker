import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { PAYMENT_METHODS, PAYMENT_STATUS } from "@/lib/app-config";
import { createClient } from "@/lib/supabase/server";

const payloadSchema = z.object({
  amount: z.coerce.number().positive(),
  payment_date: z.string().min(1),
  method: z.enum(PAYMENT_METHODS),
});

function generateSecurityCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

async function getNextInstallmentNo(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: lastPayment, error: fetchError } = await supabase
    .from("payments")
    .select("installment_no")
    .order("installment_no", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchError) {
    return { nextInstallmentNo: null as number | null, error: fetchError.message };
  }

  return {
    nextInstallmentNo: (lastPayment?.installment_no ?? 0) + 1,
    error: null as string | null,
  };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const parsed = payloadSchema.safeParse({
      amount: formData.get("amount"),
      payment_date: formData.get("payment_date"),
      method: formData.get("method"),
    });

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payment data" }, { status: 400 });
    }

    const proofFile = formData.get("proof");
    if (!(proofFile instanceof File) || proofFile.size <= 0) {
      return NextResponse.json({ error: "Receipt file is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { nextInstallmentNo, error: installmentError } = await getNextInstallmentNo(supabase);
    if (installmentError || !nextInstallmentNo) {
      return NextResponse.json(
        { error: installmentError ?? "Could not generate installment number" },
        { status: 400 }
      );
    }

    const proofPath = `${user.id}/${crypto.randomUUID()}-${proofFile.name.replaceAll(" ", "_")}`;

    const { error: uploadError } = await supabase.storage
      .from("payment-proofs")
      .upload(proofPath, proofFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 400 });
    }

    const { data: proofData } = supabase.storage.from("payment-proofs").getPublicUrl(proofPath);

    const { error: insertError } = await supabase.from("payments").insert({
      amount: parsed.data.amount,
      payment_date: parsed.data.payment_date,
      method: parsed.data.method,
      proof_url: proofData.publicUrl,
      installment_no: nextInstallmentNo,
      status: PAYMENT_STATUS.pending,
      security_code: generateSecurityCode(),
    });

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "Installment number conflict. Please submit again." },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    revalidatePath("/");
    revalidatePath("/payment-history");
    revalidatePath("/status");

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}
