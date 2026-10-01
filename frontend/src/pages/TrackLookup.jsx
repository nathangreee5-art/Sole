import React, { useState } from "react";
import { Seo } from "@/components/common/Seo";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionHeading } from "@/components/common/SectionHeading";
import { getOrder } from "@/lib/api";

export default function TrackLookup() {
  const navigate = useNavigate();
  const [orderNumber, setOrderNumber] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!orderNumber) { toast.error("Enter your order number."); return; }
    setLoading(true);
    try {
      await getOrder(orderNumber.trim().toUpperCase(), token.trim());
      navigate(`/order/${orderNumber.trim().toUpperCase()}?token=${token.trim()}`);
    } catch (err) {
      toast.error("We couldn’t find that order. Use the link in your confirmation email, or check your order number and access code.");
    } finally { setLoading(false); }
  };

  return (
    <div>
      <Seo
        title="Track Your Order"
        path="/track"
        description="Track your Sole Serenity shoe cleaning order. Enter your order number and access code to see live status and tracking updates."
        keywords="track shoe cleaning order, sole serenity order tracking"
      />
      <section className="relative ss-noise"><div className="absolute inset-0 ss-hero-glow pointer-events-none" />
        <div className="ss-container relative py-16"><SectionHeading eyebrow="Track" title="Track your order" subtitle="Enter your order number and the access code from your confirmation email." /></div>
      </section>
      <section className="pb-16"><div className="ss-container max-w-lg">
        <form onSubmit={submit} className="ss-card p-7 space-y-4">
          <div><Label className="text-[var(--ss-muted)]">Order number</Label><Input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="SS-10001" className="mt-1.5 bg-[var(--ss-surface-2)] border-[var(--ss-border)]" data-testid="track-order-number" /></div>
          <div><Label className="text-[var(--ss-muted)]">Access code (from email link)</Label><Input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Access code" className="mt-1.5 bg-[var(--ss-surface-2)] border-[var(--ss-border)]" data-testid="track-token" /></div>
          <Button type="submit" disabled={loading} className="w-full bg-[var(--ss-mint)] text-[#ffffff] hover:bg-[var(--ss-mint-600)] font-semibold"><Search className="mr-2 h-4 w-4" /> {loading ? "Searching..." : "Find my order"}</Button>
          <p className="text-xs text-[var(--ss-muted)]">Tip: the easiest way is to click the order link in your confirmation email.</p>
        </form>
      </div></section>
    </div>
  );
}
