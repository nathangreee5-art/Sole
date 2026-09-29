import React from "react";
import { Check } from "lucide-react";
import { CUSTOMER_TIMELINE, STATUS_META } from "@/lib/format";

export const OrderTimeline = ({ order }) => {
  const history = new Set((order.status_history || []).map((h) => h.status));
  const cancelled = ["CANCELLED", "REFUNDED"].includes(order.status);
  const currentIdx = CUSTOMER_TIMELINE.indexOf(order.status);
  return (
    <div className="relative pl-8">
      <div className="absolute left-[11px] top-1 bottom-1 w-px bg-[var(--ss-border)]" />
      {CUSTOMER_TIMELINE.map((st, i) => {
        const reached = history.has(st) || (currentIdx >= 0 && i <= currentIdx);
        const isCurrent = order.status === st;
        return (
          <div key={st} className="relative pb-6">
            <div className={`absolute -left-[1.35rem] top-0 h-6 w-6 rounded-full border flex items-center justify-center ${isCurrent ? "bg-[var(--ss-mint)] border-[var(--ss-mint)]" : reached ? "bg-[rgba(59,130,246,0.14)] border-[rgba(59,130,246,0.4)]" : "bg-[var(--ss-surface-2)] border-[var(--ss-border)]"}`}>
              {reached ? <Check className={`h-3.5 w-3.5 ${isCurrent ? "text-[#ffffff]" : "text-[var(--ss-mint)]"}`} /> : <span className="h-1.5 w-1.5 rounded-full bg-[var(--ss-muted)]" />}
            </div>
            <div className={`text-sm ${isCurrent ? "text-[var(--ss-fg)] font-semibold" : reached ? "text-[var(--ss-fg)]" : "text-[var(--ss-muted)]"}`}>{STATUS_META[st]?.label || st}</div>
          </div>
        );
      })}
      {cancelled && (
        <div className="relative pb-2">
          <div className="absolute -left-[1.35rem] top-0 h-6 w-6 rounded-full border border-[rgba(255,90,106,0.4)] bg-[rgba(255,90,106,0.14)] flex items-center justify-center"><span className="h-1.5 w-1.5 rounded-full bg-[#ff9aa4]" /></div>
          <div className="text-sm text-[#ff9aa4] font-semibold">{STATUS_META[order.status]?.label}</div>
        </div>
      )}
    </div>
  );
};
