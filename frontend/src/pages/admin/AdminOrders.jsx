import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { StatusBadge, PaymentBadge } from "@/components/common/StatusBadge";
import { adminListOrders } from "@/lib/api";
import { gbp, STATUS_META } from "@/lib/format";

const FILTERS = ["ALL", "PENDING_ASSESSMENT", "AWAITING_CUSTOMER_INFORMATION", "APPROVED", "PAID", "AWAITING_SHOES", "SHOES_RECEIVED", "CLEANING", "READY_FOR_RETURN", "RETURN_IN_TRANSIT", "DELIVERED", "COMPLETED", "CANCELLED", "REFUNDED"];

export default function AdminOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");

  const load = () => {
    setLoading(true);
    adminListOrders({ status, search }).then((d) => setOrders(d.orders)).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status]);
  useEffect(() => { const t = setTimeout(load, 350); return () => clearTimeout(t); /* eslint-disable-next-line */ }, [search]);

  return (
    <div>
      <h1 className="font-display text-3xl text-[var(--ss-fg)]">Orders</h1>
      <div className="mt-5 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--ss-muted)]" />
          <Input data-testid="admin-orders-search-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search order number, name or email" className="pl-9 bg-[var(--ss-surface-2)] border-[var(--ss-border)]" />
        </div>
        <select data-testid="admin-orders-status-filter" value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg bg-[var(--ss-surface-2)] border border-[var(--ss-border)] text-[var(--ss-fg)] px-3 py-2 text-sm">
          {FILTERS.map((f) => <option key={f} value={f}>{f === "ALL" ? "All statuses" : (STATUS_META[f]?.label || f)}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="py-24 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-[var(--ss-mint)]" /></div>
      ) : orders.length === 0 ? (
        <div className="mt-8 ss-card p-10 text-center text-[var(--ss-muted)]">No orders found.</div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="mt-5 hidden md:block ss-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--ss-surface-2)] text-[var(--ss-muted)] text-xs uppercase tracking-wide">
                <tr><th className="text-left px-4 py-3">Order</th><th className="text-left px-4 py-3">Customer</th><th className="text-left px-4 py-3">Pairs</th><th className="text-left px-4 py-3">Total</th><th className="text-left px-4 py-3">Status</th><th className="text-left px-4 py-3">Payment</th></tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.order_number} onClick={() => navigate(`/admin/orders/${o.order_number}`)} data-testid={`admin-order-row-${o.order_number}`} className="border-t border-[var(--ss-border)] hover:bg-[rgba(255,255,255,0.02)] cursor-pointer">
                    <td className="px-4 py-3 ss-mono text-[var(--ss-fg)]">{o.order_number}</td>
                    <td className="px-4 py-3 text-[var(--ss-fg)]">{o.customer?.name}<div className="text-xs text-[var(--ss-muted)]">{o.customer?.email}</div></td>
                    <td className="px-4 py-3 text-[var(--ss-muted)]">{o.pricing?.total_pairs}</td>
                    <td className="px-4 py-3 ss-mono text-[var(--ss-fg)]">{gbp(o.pricing?.grand_total)}</td>
                    <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                    <td className="px-4 py-3"><PaymentBadge status={o.payment?.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <div className="mt-5 md:hidden space-y-3">
            {orders.map((o) => (
              <button key={o.order_number} onClick={() => navigate(`/admin/orders/${o.order_number}`)} className="w-full ss-card p-4 text-left">
                <div className="flex items-center justify-between"><span className="ss-mono text-[var(--ss-fg)]">{o.order_number}</span><StatusBadge status={o.status} /></div>
                <div className="mt-2 text-sm text-[var(--ss-fg)]">{o.customer?.name}</div>
                <div className="text-xs text-[var(--ss-muted)]">{o.pricing?.total_pairs} pair(s) · {gbp(o.pricing?.grand_total)}</div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
