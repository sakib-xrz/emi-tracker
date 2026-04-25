"use client";

import axios from "axios";
import { MoreHorizontal } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { PAYMENT_STATUS } from "@/lib/app-config";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type PaymentRowActionsProps = {
  paymentId: string;
  status: string;
};

export function PaymentRowActions({
  paymentId,
  status,
}: PaymentRowActionsProps) {
  const router = useRouter();

  const regenerateMutation = useMutation({
    mutationFn: async () => {
      await axios.patch(`/api/payments/${paymentId}`);
    },
    onSuccess: () => {
      toast.success("Security code regenerated");
      router.refresh();
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        const message = (error.response?.data as { error?: string } | undefined)?.error;
        toast.error(message ?? "Failed to regenerate code");
        return;
      }
      toast.error("Failed to regenerate code");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await axios.delete(`/api/payments/${paymentId}`);
    },
    onSuccess: () => {
      toast.success("Payment deleted");
      router.refresh();
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        const message = (error.response?.data as { error?: string } | undefined)?.error;
        toast.error(message ?? "Failed to delete entry");
        return;
      }
      toast.error("Failed to delete entry");
    },
  });

  const handleCopyApprovalLink = async () => {
    const approvalLink = `${window.location.origin}/approve/${paymentId}`;

    try {
      await navigator.clipboard.writeText(approvalLink);
      toast.success("Approval link copied to clipboard");
    } catch {
      toast.error("Failed to copy approval link");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        asChild
        disabled={
          status === PAYMENT_STATUS.approved ||
          regenerateMutation.isPending ||
          deleteMutation.isPending
        }
      >
        <Button variant="ghost" size="icon-sm" aria-label="Open actions menu">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {status === PAYMENT_STATUS.pending ? (
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              void handleCopyApprovalLink();
            }}
          >
            Copy Approval Link
          </DropdownMenuItem>
        ) : null}

        {status === PAYMENT_STATUS.pending ? (
          <DropdownMenuItem
            disabled={regenerateMutation.isPending}
            onSelect={(event) => {
              event.preventDefault();
              regenerateMutation.mutate();
            }}
          >
            {regenerateMutation.isPending ? "Regenerating..." : "Regenerate Code"}
          </DropdownMenuItem>
        ) : null}

        {status === PAYMENT_STATUS.pending ? <DropdownMenuSeparator /> : null}

        {status === PAYMENT_STATUS.pending ? (
          <DropdownMenuItem
            disabled={deleteMutation.isPending}
            variant="destructive"
            onSelect={(event) => {
              event.preventDefault();
              deleteMutation.mutate();
            }}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete Entry"}
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
