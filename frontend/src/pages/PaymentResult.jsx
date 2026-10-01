import React, { useEffect, useState } from "react";
import { Seo } from "@/components/common/Seo";
import { useSearchParams, Link } from "react-router-dom";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPaymentStatus } from "@/lib/api";

export default function PaymentResult() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const orderNumber = params.get("order");
  const [state, setState] = useState("checking"); // checking | paid | pending | error

  useEffect(() => {
    if (!sessionId) { setState("error"); return; }
    let tries = 0;
    let active = true;
    const poll = async () => {
      try {
        const res = await getPaymentStatus(sessionId);
        if (!active) return;
        if (res.payment_status === "paid") { setState("paid"); return; }
        if (tries >= 8) { setState("pending"); return; }
        tries += 1;
        setTimeout(poll, 2000);
      } catch (e) {
        if (active) setState("error");
      }
    };
    poll();
    return () => { active = false; };
  }, [sessionId]);

  return (
    <div className="ss-container py-24">
      <Seo title="Payment" noindex />
      <div className="max-w-lg mx-auto ss-card p-10 text-center">
        {state === "checking" && (<><Loader2 className="h-12 w-12 mx-auto animate-spin text-[var(--ss-mint)]" /><h1 className="mt-6 font-display text-3xl text-[var(--ss-fg)]">Confirming your payment...</h1><p className="mt-2 text-[var(--ss-muted)]">This only takes a moment.</p></>)}
        {state === "paid" && (<><CheckCircle2 className="h-14 w-14 mx-auto text-[var(--ss-mint)]" /><h1 className="mt-6 font-display text-3xl text-[var(--ss-fg)]">Payment received!</h1><p className="mt-2 text-[var(--ss-muted)]">Thank you. We’re preparing your prepaid tracked label — you’ll get it by email and on your order page shortly.</p></>)}
        {state === "pending" && (<><Loader2 className="h-12 w-12 mx-auto text-[var(--ss-mint)]" /><h1 className="mt-6 font-display text-3xl text-[var(--ss-fg)]">Almost there</h1><p className="mt-2 text-[var(--ss-muted)]">Your payment is processing. Check your order page in a moment for the latest status.</p></>)}
        {state === "error" && (<><XCircle className="h-14 w-14 mx-auto text-[#ff9aa4]" /><h1 className="mt-6 font-display text-3xl text-[var(--ss-fg)]">Something went wrong</h1><p className="mt-2 text-[var(--ss-muted)]">We couldn’t confirm your payment automatically. Please check your order page.</p></>)}
        <div className="mt-8">
          {orderNumber ? (
            <Link to={`/order/${orderNumber}`}><Button className="bg-[var(--ss-mint)] text-[#ffffff] hover:bg-[var(--ss-mint-600)] font-semibold">View your order</Button></Link>
          ) : (
            <Link to="/"><Button variant="outline" className="border-[var(--ss-border)] bg-transparent text-[var(--ss-fg)]">Back home</Button></Link>
          )}
        </div>
      </div>
    </div>
  );
}
