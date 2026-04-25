"use client";

import axios from "axios";
import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { PAYMENT_STATUS } from "@/lib/app-config";
import { formatCurrency, formatDate } from "@/lib/format";
import type { PublicPaymentRecord } from "@/lib/types";
import { PaymentMethodIcon } from "@/components/payment-method-icon";
import { ReceiptDialog } from "@/components/receipt-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ApprovePaymentCardProps = {
  paymentId: string;
};

type ApprovalResponse = {
  payment: PublicPaymentRecord | null;
};

export function ApprovePaymentCard({ paymentId }: ApprovePaymentCardProps) {
  const [securityCode, setSecurityCode] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isApprovedNow, setIsApprovedNow] = useState(false);

  const paymentQuery = useQuery({
    queryKey: ["approval-payment", paymentId],
    queryFn: async () => {
      const response = await axios.get<ApprovalResponse>(
        `/api/payments/${paymentId}/approval`,
      );
      return response.data.payment;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      await axios.post(`/api/payments/${paymentId}/approve`, {
        securityCode,
      });
    },
    onSuccess: async () => {
      setSubmitError(null);
      setSecurityCode("");
      setIsApprovedNow(true);
      await paymentQuery.refetch();
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        const message = (error.response?.data as { error?: string } | undefined)
          ?.error;
        setSubmitError(message ?? "Approval failed");
        return;
      }
      setSubmitError("Approval failed");
    },
  });

  const payment = paymentQuery.data ?? null;

  if (paymentQuery.isLoading) {
    return (
      <Card className="mx-auto w-full max-w-lg border-white/10 bg-card/95 backdrop-blur">
        <CardHeader>
          <CardTitle className="font-bold">Loading payment...</CardTitle>
          <CardDescription>
            Please wait while we fetch payment details.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!payment) {
    return (
      <Card className="mx-auto w-full max-w-lg border-white/10 bg-card/95 backdrop-blur">
        <CardHeader>
          <CardTitle className="font-bold">Payment not found</CardTitle>
          <CardDescription>
            The requested approval link is invalid.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const alreadyApproved = payment.status === PAYMENT_STATUS.approved;

  return (
    <Card className="mx-auto w-full max-w-lg border-white/10 bg-card/95 backdrop-blur">
      <CardHeader>
        <CardTitle className="font-bold">
          Approve Installment #{payment.installment_no}
        </CardTitle>
        <CardDescription>
          Verify amount and receipt, then enter the security code shared by the
          owner.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-3 rounded-lg border p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-medium">
              {formatCurrency(payment.amount)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Date</span>
            <span>{formatDate(payment.payment_date)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Method</span>
            <span className="inline-flex items-center gap-1.5">
              <PaymentMethodIcon method={payment.method} className="size-4" />
              {payment.method}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Status</span>
            <Badge variant={alreadyApproved ? "default" : "secondary"}>
              {payment.status}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Receipt</span>
            <div>
              <ReceiptDialog
                receiptUrl={payment.proof_url}
                title={`Receipt #${payment.installment_no}`}
              />
            </div>
          </div>
        </div>

        {!alreadyApproved ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!securityCode.trim()) {
                setSubmitError("Security code is required");
                return;
              }
              setSubmitError(null);
              setIsApprovedNow(false);
              approveMutation.mutate();
            }}
            className="grid gap-3"
          >
            <div className="grid gap-2">
              <Label htmlFor="security_code">Security Code</Label>
              <Input
                id="security_code"
                placeholder="Enter 6-character code"
                required
                maxLength={6}
                className="uppercase"
                value={securityCode}
                onChange={(event) =>
                  setSecurityCode(event.target.value.toUpperCase())
                }
              />
            </div>
            <Button type="submit" size="lg" className="h-10 w-full">
              {approveMutation.isPending ? "Approving..." : "Approve Payment"}
            </Button>
          </form>
        ) : (
          <p className="text-sm text-emerald-700">
            This payment is already approved.
          </p>
        )}

        {submitError ? (
          <Alert variant="destructive">
            <AlertTitle>Approval failed</AlertTitle>
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        ) : null}
        {isApprovedNow ? (
          <Alert>
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>Payment approved successfully.</AlertDescription>
          </Alert>
        ) : null}

        <Button asChild variant="outline" className="w-full">
          <Link href="/payment-history">View Payment History</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
