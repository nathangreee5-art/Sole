import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, MessageSquare, Inbox } from "lucide-react";
import { adminListTickets } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const fmt = (s) => {
  try {
    return new Date(s).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch (e) {
    return "";
  }
};

export default function AdminTickets() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter === "all" ? {} : { status: filter };
      const data = await adminListTickets(params);
      setTickets(data.tickets || []);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6" data-testid="admin-tickets-page">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl text-[var(--ss-fg)]">Messages</h1>
          <p className="text-[var(--ss-muted)] text-sm mt-1">Customer enquiries and order conversations.</p>
        </div>
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="all" data-testid="tickets-filter-all">All</TabsTrigger>
            <TabsTrigger value="open" data-testid="tickets-filter-open">Open</TabsTrigger>
            <TabsTrigger value="closed" data-testid="tickets-filter-closed">Closed</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[var(--ss-mint)]" /></div>
      ) : tickets.length === 0 ? (
        <div className="ss-card p-12 text-center">
          <Inbox className="h-10 w-10 mx-auto text-[var(--ss-muted)] mb-3" />
          <p className="text-[var(--ss-fg)] font-medium">No messages yet</p>
          <p className="text-[var(--ss-muted)] text-sm mt-1">Enquiries from the contact form will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map((t) => (
            <button
              key={t.id}
              onClick={() => navigate(`/admin/tickets/${t.id}`)}
              data-testid={`ticket-row-${t.id}`}
              className="w-full text-left ss-card p-4 flex items-start gap-4 transition-colors hover:border-[var(--ss-mint)]"
            >
              <div className="mt-1 relative">
                <MessageSquare className="h-5 w-5 text-[var(--ss-mint)]" />
                {t.unread_admin ? (
                  <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-[var(--ss-mint)] ring-2 ring-[var(--ss-card)]" data-testid="ticket-unread-dot" />
                ) : null}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-sm ${t.unread_admin ? "font-bold text-[var(--ss-fg)]" : "font-medium text-[var(--ss-fg)]"}`}>{t.subject}</span>
                  {t.order_number ? <Badge variant="outline" className="text-[11px] border-[var(--ss-border)] text-[var(--ss-muted)]">{t.order_number}</Badge> : null}
                  {t.status === "closed" ? <Badge variant="outline" className="text-[11px] border-[var(--ss-border)] text-[var(--ss-muted)]">Closed</Badge> : null}
                </div>
                <p className="text-sm text-[var(--ss-muted)] truncate mt-0.5">
                  <span className="text-[var(--ss-fg)]">{t.customer?.name}</span> &middot; {t.last_message}
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[11px] text-[var(--ss-muted)]">{fmt(t.updated_at)}</div>
                <div className="text-[11px] text-[var(--ss-muted)] mt-1">{t.message_count} msg{t.message_count === 1 ? "" : "s"}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
