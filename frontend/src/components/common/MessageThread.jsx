import React from "react";

const fmt = (s) => {
  try {
    return new Date(s).toLocaleString("en-GB", {
      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
    });
  } catch (e) {
    return "";
  }
};

export const MessageThread = ({ messages = [], selfSender = "admin" }) => (
  <div className="space-y-3" data-testid="message-thread">
    {messages.length === 0 ? (
      <p className="text-sm text-[var(--ss-muted)]">No messages yet.</p>
    ) : null}
    {messages.map((m, i) => {
      const mine = m.sender === selfSender;
      const who = m.sender === "admin" ? "Sole Serenity" : "Customer";
      return (
        <div key={m.id || i} className={`flex ${mine ? "justify-end" : "justify-start"}`} data-testid={`message-${m.sender}`}>
          <div
            className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm ${
              mine
                ? "bg-[var(--ss-mint)] text-white rounded-br-sm"
                : "bg-[var(--ss-surface-2)] text-[var(--ss-fg)] border border-[var(--ss-border)] rounded-bl-sm"
            }`}
          >
            <div className={`text-[11px] mb-1 ${mine ? "text-white/70" : "text-[var(--ss-muted)]"}`}>
              {who} &middot; {fmt(m.created_at)}
            </div>
            <div className="whitespace-pre-wrap leading-relaxed">{m.body}</div>
          </div>
        </div>
      );
    })}
  </div>
);
