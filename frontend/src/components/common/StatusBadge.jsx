import React from "react";
import { STATUS_META, PAYMENT_META, toneClass } from "@/lib/format";
import { cn } from "@/lib/utils";

export const StatusBadge = ({ status, testId }) => {
  const meta = STATUS_META[status] || { label: status, tone: "muted" };
  return (
    <span
      data-testid={testId || "order-status-badge"}
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide",
        toneClass(meta.tone)
      )}
    >
      {meta.label}
    </span>
  );
};

export const PaymentBadge = ({ status }) => {
  const meta = PAYMENT_META[status] || { label: status, tone: "muted" };
  return (
    <span className={cn("inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide", toneClass(meta.tone))}>
      {meta.label}
    </span>
  );
};
