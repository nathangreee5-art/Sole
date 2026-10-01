import React, { useEffect, useState, useCallback } from "react";
import { Seo } from "@/components/common/Seo";
import { useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, Send, MessageSquare } from "lucide-react";
import { getConversation, replyConversation } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageThread } from "@/components/common/MessageThread";

export default function Conversation() {
  const { ticketId } = useParams();
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getConversation(ticketId, token);
      setTicket(data.ticket);
    } catch (e) {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [ticketId, token]);

  useEffect(() => { load(); }, [load]);

  const send = async () => {
    if (!reply.trim()) return;
    setBusy(true);
    try {
      const data = await replyConversation(ticketId, token, reply.trim());
      setTicket(data.ticket);
      setReply("");
      toast.success("Message sent");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Could not send message.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ss-section">
      <Seo title="Your Conversation" noindex />
      <div className="ss-container max-w-2xl">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[var(--ss-mint)]" /></div>
        ) : error || !ticket ? (
          <div className="ss-card p-10 text-center" data-testid="conversation-error">
            <MessageSquare className="h-10 w-10 mx-auto text-[var(--ss-muted)] mb-3" />
            <h1 className="font-display text-2xl text-[var(--ss-fg)]">Conversation not found</h1>
            <p className="text-[var(--ss-muted)] text-sm mt-2">This link may have expired or is invalid. Please use the link from your latest email, or contact us again.</p>
          </div>
        ) : (
          <div className="space-y-5" data-testid="conversation-page">
            <div>
              <p className="ss-eyebrow">Your conversation</p>
              <h1 className="font-display text-3xl text-[var(--ss-fg)] mt-1">{ticket.subject}</h1>
              <div className="mt-2">
                <Badge variant="outline" className="border-[var(--ss-border)] text-[var(--ss-muted)]">{ticket.status === "open" ? "Open" : "Closed"}</Badge>
              </div>
            </div>

            <div className="ss-card p-5">
              <MessageThread messages={ticket.messages} selfSender="customer" />
            </div>

            <div className="ss-card p-4">
              <label className="text-sm font-medium text-[var(--ss-fg)]">Reply</label>
              <Textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={4}
                placeholder="Type your message..."
                data-testid="conversation-reply-input"
                className="mt-2 bg-[var(--ss-surface-2)] border-[var(--ss-border)]"
              />
              <div className="flex justify-end mt-3">
                <Button onClick={send} disabled={busy || !reply.trim()} data-testid="conversation-reply-send" className="bg-[var(--ss-mint)] text-white hover:bg-[var(--ss-mint-600)] font-semibold">
                  {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />} Send
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
