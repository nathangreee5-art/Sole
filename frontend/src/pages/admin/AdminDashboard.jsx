import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, PoundSterling, Package, Footprints, Clock } from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { adminDashboard } from "@/lib/api";
import { gbp } from "@/lib/format";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => { adminDashboard().then(setData).catch(() => {}); }, []);

  if (!data) return <div className="py-24 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-[var(--ss-mint)]" /></div>;
  const c = data.counts;

  const kpis = [
    { label: "Revenue", value: gbp(data.revenue), icon: PoundSterling, accent: true },
    { label: "Total orders", value: data.counts.total_orders, icon: Package },
    { label: "Pairs cleaned", value: data.pairs_cleaned, icon: Footprints },
    { label: "Pending assessment", value: c.pending_assessment, icon: Clock },
  ];

  const queues = [
    { label: "Pending assessment", value: c.pending_assessment },
    { label: "Awaiting customer info", value: c.awaiting_customer },
    { label: "Awaiting payment", value: c.awaiting_payment },
    { label: "Shoes in transit", value: c.shoes_in_transit },
    { label: "Shoes received", value: c.shoes_received },
    { label: "Cleaning", value: c.cleaning },
    { label: "Ready for return", value: c.ready_for_return },
    { label: "Returns in transit", value: c.returns_in_transit },
    { label: "Completed", value: c.completed },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl text-[var(--ss-fg)]">Dashboard</h1>
      <p className="text-sm text-[var(--ss-muted)] mt-1">Overview of your Sole Serenity operation.</p>

      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className={`ss-card p-5 ${k.accent ? "bg-[rgba(59,130,246,0.06)] border-[rgba(59,130,246,0.3)]" : ""}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-[var(--ss-muted)]">{k.label}</span>
              <k.icon className="h-4 w-4 text-[var(--ss-mint)]" />
            </div>
            <div className="mt-2 font-display text-3xl text-[var(--ss-fg)]">{k.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid lg:grid-cols-3 gap-4">
        <div className="ss-card p-5">
          <h3 className="font-semibold text-[var(--ss-fg)] mb-3">Work queues</h3>
          <div className="space-y-1">
            {queues.map((q) => (
              <div key={q.label} className="flex items-center justify-between py-1.5 border-b border-[var(--ss-border)] last:border-0">
                <span className="text-sm text-[var(--ss-muted)]">{q.label}</span>
                <span className="ss-mono text-[var(--ss-fg)] font-semibold">{q.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="ss-card p-5 lg:col-span-2">
          <h3 className="font-semibold text-[var(--ss-fg)] mb-3">Recent orders</h3>
          <div className="space-y-2">
            {data.recent_orders.length === 0 && <p className="text-sm text-[var(--ss-muted)]">No orders yet.</p>}
            {data.recent_orders.map((o) => (
              <button key={o.order_number} onClick={() => navigate(`/admin/orders/${o.order_number}`)} className="w-full flex items-center justify-between rounded-lg border border-[var(--ss-border)] px-4 py-3 hover:border-[var(--ss-mint)] text-left">
                <div>
                  <div className="ss-mono text-[var(--ss-fg)]">{o.order_number}</div>
                  <div className="text-xs text-[var(--ss-muted)]">{o.customer?.name} · {o.pricing?.total_pairs} pair(s) · {gbp(o.pricing?.grand_total)}</div>
                </div>
                <StatusBadge status={o.status} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
