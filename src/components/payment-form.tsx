"use client";

import axios from "axios";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { PAYMENT_METHODS } from "@/lib/app-config";
import { FileUpload05 } from "@/components/file-upload-05";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const paymentFormSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  payment_date: z.string().min(1, "Please select a payment date"),
  method: z
    .string()
    .refine(
      (value) =>
        PAYMENT_METHODS.includes(value as (typeof PAYMENT_METHODS)[number]),
      {
        message: "Please select a payment method",
      },
    ),
  proof: z
    .instanceof(File, { message: "Payment receipt is required" })
    .nullable()
    .refine(
      (file) => Boolean(file && file.size > 0),
      "Payment receipt is required",
    ),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

function SubmitPaymentButton({
  canSubmit,
  isSubmitting,
}: {
  canSubmit: boolean;
  isSubmitting: boolean;
}) {
  return (
    <Button
      type="submit"
      className="h-11 font-semibold"
      disabled={isSubmitting || !canSubmit}
    >
      {isSubmitting ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Saving...
        </>
      ) : (
        "Save Payment"
      )}
    </Button>
  );
}

export function PaymentForm() {
  const [paymentDate, setPaymentDate] = useState<Date>();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const router = useRouter();
  const createPaymentMutation = useMutation({
    mutationFn: async (payload: FormData) => {
      await axios.post("/api/payments", payload);
    },
  });

  const {
    register,
    setValue,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<z.input<typeof paymentFormSchema>, unknown, PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: undefined,
      payment_date: "",
      method: "",
      proof: null,
    },
  });

  const selectedMethod = useWatch({ control, name: "method" });
  const proofFile = useWatch({ control, name: "proof" }) ?? null;
  const canSubmit = Boolean(selectedMethod && paymentDate && proofFile);

  const onSubmit = async (values: PaymentFormValues) => {
    setSubmitError(null);
    setSubmitSuccess(null);

    const formData = new FormData();
    if (!values.proof) {
      setSubmitError("Payment receipt is required");
      return;
    }

    formData.append("amount", String(values.amount));
    formData.append("payment_date", values.payment_date);
    formData.append("method", values.method);
    formData.append("proof", values.proof);

    try {
      await createPaymentMutation.mutateAsync(formData);

      reset();
      setPaymentDate(undefined);
      setSubmitSuccess("Payment saved successfully.");
      router.refresh();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = (error.response?.data as { error?: string } | undefined)
          ?.error;
        setSubmitError(message ?? "Failed to save payment");
        return;
      }
      setSubmitError("Network error. Please try again.");
    }
  };

  return (
    <Card className="border-white/10 bg-card/90 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-lg font-bold">Add New Payment</CardTitle>
        <CardDescription>
          Installment number is auto-assigned in order of submission.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid gap-4"
          noValidate
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount (BDT)</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                {...register("amount")}
              />
              {errors.amount ? (
                <p className="text-destructive text-xs">
                  {errors.amount.message}
                </p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label>Payment Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    data-empty={!paymentDate}
                    className={cn(
                      "h-10 w-full justify-start text-left font-normal data-[empty=true]:text-muted-foreground bg-black!",
                    )}
                  >
                    <CalendarIcon className="mr-2 size-4" />
                    {paymentDate ? (
                      <span>{format(paymentDate, "PPP")}</span>
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={paymentDate}
                    onSelect={(date) => {
                      setPaymentDate(date);
                      setValue(
                        "payment_date",
                        date ? format(date, "yyyy-MM-dd") : "",
                        {
                          shouldValidate: true,
                        },
                      );
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <input type="hidden" {...register("payment_date")} />
              {errors.payment_date ? (
                <p className="text-destructive text-xs">
                  {errors.payment_date.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Payment Method</Label>
            <Controller
              control={control}
              name="method"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((paymentMethod) => (
                      <SelectItem key={paymentMethod} value={paymentMethod}>
                        {paymentMethod}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.method ? (
              <p className="text-destructive text-xs">
                {errors.method.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="proof">Payment Receipt (PDF/Image)</Label>
            <FileUpload05
              id="proof"
              name="proof"
              accept="image/*,.pdf"
              value={proofFile}
              onFileChange={(file) => {
                setValue("proof", file, { shouldValidate: true });
              }}
            />
            {errors.proof ? (
              <p className="text-destructive text-xs">{errors.proof.message}</p>
            ) : null}
          </div>

          {submitError ? (
            <Alert variant="destructive">
              <AlertTitle>Could not save payment</AlertTitle>
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          ) : null}

          {submitSuccess ? (
            <Alert>
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{submitSuccess}</AlertDescription>
            </Alert>
          ) : null}

          <SubmitPaymentButton
            canSubmit={canSubmit}
            isSubmitting={createPaymentMutation.isPending}
          />
        </form>
      </CardContent>
    </Card>
  );
}
