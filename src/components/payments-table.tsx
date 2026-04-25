"use client";

import { PAYMENT_STATUS } from "@/lib/app-config";
import { formatCurrency, formatDate } from "@/lib/format";
import type { PaymentRecord, PublicPaymentRecord } from "@/lib/types";
import { toast } from "sonner";
import { PaymentMethodIcon } from "@/components/payment-method-icon";
import { PaymentRowActions } from "@/components/payment-row-actions";
import { ReceiptDialog } from "@/components/receipt-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function StatusBadge({ status }: { status: string }) {
  if (status === PAYMENT_STATUS.approved) {
    return <Badge className="bg-emerald-500 text-white">{status}</Badge>;
  }
  return (
    <Badge variant="secondary" className="bg-amber-100 text-amber-700">
      {status}
    </Badge>
  );
}

type OwnerPaymentsTableProps = {
  payments: PaymentRecord[];
};

export function OwnerPaymentsTable({ payments }: OwnerPaymentsTableProps) {
  const handleCopyCode = async (securityCode: string) => {
    try {
      await navigator.clipboard.writeText(securityCode);
      toast.success("Security code copied to clipboard");
    } catch {
      toast.error("Failed to copy security code");
    }
  };

  return (
    <Card className="border-white/10 bg-card/95 backdrop-blur">
      <CardHeader>
        <CardTitle className="font-bold">Installments (1 - 24)</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Installment</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Receipt</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>#{payment.installment_no}</TableCell>
                <TableCell>
                  <div className="grid">
                    <span>{formatCurrency(payment.amount)}</span>
                    <span className="text-muted-foreground text-xs">
                      {formatDate(payment.payment_date)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5">
                    <PaymentMethodIcon
                      method={payment.method}
                      className="size-4"
                    />
                    {payment.method}
                  </span>
                </TableCell>
                <TableCell>
                  <StatusBadge status={payment.status} />
                </TableCell>
                <TableCell>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(payment.security_code)}
                    className="cursor-pointer rounded bg-muted px-2 py-1 font-mono text-xs"
                    aria-label={`Copy security code for installment ${payment.installment_no}`}
                    title="Click to copy code"
                  >
                    {payment.security_code}
                  </button>
                </TableCell>
                <TableCell>
                  <ReceiptDialog
                    receiptUrl={payment.proof_url}
                    title={`Receipt #${payment.installment_no}`}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <PaymentRowActions
                    paymentId={payment.id}
                    status={payment.status}
                  />
                </TableCell>
              </TableRow>
            ))}
            {!payments.length ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-muted-foreground text-center"
                >
                  No payments added yet.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

type PublicPaymentsTableProps = {
  payments: PublicPaymentRecord[];
};

export function PublicPaymentsTable({ payments }: PublicPaymentsTableProps) {
  return (
    <Card className="border-white/10 bg-card/95 backdrop-blur">
      <CardHeader>
        <CardTitle className="font-bold">Payment Status</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Receipt</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>#{payment.installment_no}</TableCell>
                <TableCell>
                  <div className="grid">
                    <span>{formatCurrency(payment.amount)}</span>
                    <span className="text-muted-foreground text-xs">
                      {formatDate(payment.payment_date)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5">
                    <PaymentMethodIcon
                      method={payment.method}
                      className="size-4"
                    />
                    {payment.method}
                  </span>
                </TableCell>
                <TableCell>
                  <StatusBadge status={payment.status} />
                </TableCell>
                <TableCell>
                  <ReceiptDialog
                    receiptUrl={payment.proof_url}
                    title={`Receipt #${payment.installment_no}`}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
