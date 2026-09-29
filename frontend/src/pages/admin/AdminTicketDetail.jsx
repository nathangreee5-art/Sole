import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Send, CheckCircle2, RotateCcw, Trash2, Package } from "lucide-react";
import { adminGetTicket, adminReplyTicket, adminSetTicketStatus, adminDeleteTicket } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageThread } from "@/components/common/MessageThread";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AdminTicketDetail() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminGetTicket(ticketId);
      setTicket(data.ticket);
    } catch (e) {
      toast.error("Could not load this conversation.");
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => { load(); }, [load]);

  const send = async () => {
    if (!reply.trim()) return;
    setBusy(true);
    try {
      const data = await adminReplyTicket(ticketId, reply.trim());
      setTicket(data.ticket);
      setReply("");
      toast.success("Reply sent to customer");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Could not send reply.");
    } finally {
      setBusy(false);
    }
  };

  const toggleStatus = async () => {
    const next = ticket.status === "open" ? "closed" : "open";
    setBusy(true);
    try {
      const data = await adminSetTicketStatus(ticketId, next);
      setTicket(data.ticket);
      toast.success(next === "closed" ? "Conversation closed" : "Conversation reopened");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    try {
      await adminDeleteTicket(ticketId);
      toast.success("Conversation deleted");
      navigate("/admin/tickets");
    } catch (e) {
      toast.error("Could not delete.");
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[var(--ss-mint)]" /></div>;
  if (!ticket) return <p className="text-[var(--ss-muted)]">Conversation not found.</p>;

  return (
    <div className="space-y-5 max-w-3xl" data-testid="admin-ticket-detail">
      <Link to="/admin/tickets" className="inline-flex items-center gap-2 text-sm text-[var(--ss-muted)] hover:text-[var(--ss-fg)]"><ArrowLeft className="h-4 w-4" /> Back to messages</Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl text-[var(--ss-fg)]">{ticket.subject}</h1>
          <p className="text-sm text-[var(--ss-muted)] mt-1">
            {ticket.customer?.name} &middot; {ticket.customer?.email}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="border-[var(--ss-border)] text-[var(--ss-muted)]">{ticket.status === "open" ? "Open" : "Closed"}</Badge>
            {ticket.order_number ? (
              <Link to={`/admin/orders/${ticket.order_number}`}>
                <Badge variant="outline" className="border-[var(--ss-border)] text-[var(--ss-mint)] hover:bg-[rgba(59,130,246,0.1)]"><Package className="h-3 w-3 mr-1" /> {ticket.order_number}</Badge>
              </Link>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={toggleStatus} disabled={busy} data-testid="ticket-toggle-status" className="border-[var(--ss-border)] text-[var(--ss-fg)]">
            {ticket.status === "open" ? <><CheckCircle2 className="h-4 w-4 mr-2" /> Close</> : <><RotateCcw className="h-4 w-4 mr-2" /> Reopen</>}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="border-[var(--ss-border)] text-[#ff9aa4] hover:bg-[rgba(255,90,106,0.08)]" data-testid="ticket-delete-button"><Trash2 className="h-4 w-4" /></Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-[var(--ss-card)] border-[var(--ss-border)]">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-[var(--ss-fg)]">Delete this conversation?</AlertDialogTitle>
                <AlertDialogDescription className="text-[var(--ss-muted)]">This permanently removes the whole thread. This cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-transparent border-[var(--ss-border)] text-[var(--ss-fg)]">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={remove} className="bg-[#ff5a6a] text-white hover:bg-[#e04b5a]" data-testid="ticket-delete-confirm">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="ss-card p-5">
        <MessageThread messages={ticket.messages} selfSender="admin" />
      </div>

      <div className="ss-card p-4">
        <label className="text-sm font-medium text-[var(--ss-fg)]">Reply to customer</label>
        <p className="text-xs text-[var(--ss-muted)] mt-0.5 mb-2">Your reply is emailed to the customer, who can respond here to continue the conversation.</p>
        <Textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          rows={4}
          placeholder="Type your reply..."
          data-testid="ticket-reply-input"
          className="bg-[var(--ss-surface-2)] border-[var(--ss-border)]"
        />
        <div className="flex justify-end mt-3">
          <Button onClick={send} disabled={busy || !reply.trim()} data-testid="ticket-reply-send" className="bg-[var(--ss-mint)] text-white hover:bg-[var(--ss-mint-600)] font-semibold">
            {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />} Send reply
          </Button>
        </div>
      </div>
    </div>
  );
}
