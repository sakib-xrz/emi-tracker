"use client";

import Image from "next/image";
import { FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type ReceiptDialogProps = {
  receiptUrl: string;
  title?: string;
};

function isPdf(url: string) {
  return url.toLowerCase().includes(".pdf");
}

export function ReceiptDialog({
  receiptUrl,
  title = "Payment Receipt",
}: ReceiptDialogProps) {
  const pdf = isPdf(receiptUrl);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="hover:bg-transparent">
          View
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-4xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Receipt preview</DialogDescription>
        </DialogHeader>
        <div className="bg-muted/20 relative h-[65vh] overflow-hidden rounded-lg border border-white/10">
          {pdf ? (
            <iframe
              title="Receipt PDF"
              src={receiptUrl}
              className="h-full w-full"
            />
          ) : (
            <Image
              src={receiptUrl}
              alt="Payment receipt"
              fill
              unoptimized
              className="object-contain"
            />
          )}
        </div>
        {pdf ? (
          <p className="text-muted-foreground flex items-center gap-2 text-xs">
            <FileText className="size-3.5" />
            PDF preview may vary by browser.
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
