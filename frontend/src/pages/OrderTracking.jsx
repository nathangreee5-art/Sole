import React, { useEffect, useState, useCallback } from "react";
import { Seo } from "@/components/common/Seo";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { Loader2, CreditCard, Download, Truck, Upload, PackageCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StatusBadge, PaymentBadge } from "@/components/common/StatusBadge";
import { OrderTimeline } from "@/components/common/OrderTimeline";
import { PhotoUploader } from "@/components/booking/PhotoUploader";
import { getOrder, checkoutOrder, addOrderPhotos, mediaUrl } from "@/lib/api";
import { gbp } from "@/lib/format";

export default function OrderTracking() {
  const { orderNumber } = useParams();
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);
  const [morePhotos, setMorePhotos] = useState([]);
  const [savingPhotos, setSavingPhotos] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await getOrder(orderNumber, token);
      setOrder(res.order);
    } catch (err) {
      setError(err?.response?.data?.detail || "Order not found or access denied.");
    } finally { setLoading(false); }
  }, [orderNumber, token]);

  useEffect(() => { load(); }, [load]);

  const pay = async () => {
    setPaying(true);
    try {
      const res = await checkoutOrder(orderNumber, token, window.location.origin);
      window.location.href = res.checkout_url;
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Could not start payment.");
      setPaying(false);
    }
  };

  const submitMorePhotos = async () => {
    if (!morePhotos.length) { toast.error("Please add at least one photo."); return; }
    setSavingPhotos(true);
    try {
      const res = await addOrderPhotos(orderNumber, token, morePhotos.map((p) => ({ file_id: p.file_id, slot: p.slot })));
      setOrder(res.order);
      setMorePhotos([]);
      toast.success("Photos added — we’ll take another look!");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Could not upload photos.");
    } finally { setSavingPhotos(false); }
  };

  if (loading) return <div className="ss-container py-24 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-[var(--ss-mint)]" /></div>;
  if (error) return (
    <div className="ss-container py-24 text-center">
      <h1 className="font-display text-3xl text-[var(--ss-fg)]">Order unavailable</h1>
      <p className="mt-3 text-[var(--ss-muted)]">{error}</p>
      <Link to="/" className="mt-6 inline-block text-[var(--ss-mint)] hover:underline">Back to home</Link>
    </div>
  );

  const canPay = ["APPROVED", "AWAITING_PAYMENT"].includes(order.status) && order.payment?.status !== "PAID";
  const inbound = order.shipment?.inbound || {};
  const ret = order.shipment?.return || {};

  return (
    <div className="ss-container py-10 sm:py-14">
      <Seo title="Your Order" path="/track" noindex />
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="ss-eyebrow">Order</div>
            <h1 className="font-display text-4xl text-[var(--ss-fg)] ss-mono">{order.order_number}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={order.status} />
            <PaymentBadge status={order.payment?.status} />
          </div>
        </div>

        {/* Next action banner */}
        {canPay && (
          <div className="mt-6 ss-card p-6 bg-[rgba(59,130,246,0.06)] border-[rgba(59,130,246,0.3)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-[var(--ss-fg)]">Your order is approved &mdash; ready for payment</div>
              <div className="text-sm text-[var(--ss-muted)] mt-1">Pay securely to receive your prepaid tracked label. Total: <span className="ss-mono text-[var(--ss-fg)]">{gbp(order.pricing?.grand_total)}</span></div>
            </div>
            <Button onClick={pay} disabled={paying} data-testid="order-pay-now-button" className="bg-[var(--ss-mint)] text-[#ffffff] hover:bg-[var(--ss-mint-600)] font-semibold">
              {paying ? "Redirecting..." : (<><CreditCard className="mr-2 h-4 w-4" /> Pay {gbp(order.pricing?.grand_total)}</>)}
            </Button>
          </div>
        )}

        {order.status === "AWAITING_CUSTOMER_INFORMATION" && (
          <div className="mt-6 ss-card p-6 border-[rgba(245,196,81,0.35)]">
            <div className="font-semibold text-[var(--ss-fg)]">We need a few more photos</div>
            <p className="text-sm text-[var(--ss-muted)] mt-1">Please add clearer photos so we can finish assessing your order.</p>
            <div className="mt-4"><PhotoUploader photos={morePhotos} setPhotos={setMorePhotos} /></div>
            <Button onClick={submitMorePhotos} disabled={savingPhotos} className="mt-4 bg-[var(--ss-mint)] text-[#ffffff] hover:bg-[var(--ss-mint-600)] font-semibold"><Upload className="mr-2 h-4 w-4" /> {savingPhotos ? "Uploading..." : "Submit photos"}</Button>
          </div>
        )}

        <div className="mt-8 grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 ss-card p-6">
            <h3 className="font-semibold text-[var(--ss-fg)] mb-5">Progress</h3>
            <OrderTimeline order={order} />
          </div>

          <div className="lg:col-span-2 space-y-6">
            {/* Shipping */}
            {(inbound.portal_url || inbound.tracking_number || inbound.label_url || ret.tracking_number || ret.label_url) && (
              <div className="ss-card p-6">
                <h3 className="font-semibold text-[var(--ss-fg)] mb-4 flex items-center gap-2"><Truck className="h-5 w-5 text-[var(--ss-mint)]" /> Shipping</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {(inbound.portal_url || inbound.label_url || inbound.tracking_number) && (
                    <div className="rounded-xl border border-[var(--ss-border)] p-4">
                      <div className="text-xs ss-eyebrow mb-2">Sending to us</div>
                      {inbound.portal_url ? (
                        <>
                          <a href={inbound.portal_url} target="_blank" rel="noreferrer" data-testid="order-returns-portal-link" className="inline-flex items-center gap-2 text-[var(--ss-mint)] text-sm font-semibold hover:underline"><Download className="h-4 w-4" /> Generate your Royal Mail label</a>
                          <p className="mt-2 text-xs text-[var(--ss-muted)]">Opens the Royal Mail returns portal. Enter your details to print your prepaid label or get a QR code, then post your shoes to us. Keep your receipt until delivery is confirmed.</p>
                        </>
                      ) : inbound.label_url ? (
                        <a href={mediaUrl(inbound.label_url)} target="_blank" rel="noreferrer" data-testid="order-label-download-link" className="inline-flex items-center gap-2 text-[var(--ss-mint)] text-sm hover:underline"><Download className="h-4 w-4" /> Download your prepaid label</a>
                      ) : null}
                      {inbound.tracking_number && <div className="mt-2 text-sm text-[var(--ss-muted)]">Tracking: <a className="text-[var(--ss-fg)] ss-mono hover:text-[var(--ss-mint)]" href={inbound.tracking_url} target="_blank" rel="noreferrer">{inbound.tracking_number}</a></div>}
                    </div>
                  )}
                  {(ret.label_url || ret.tracking_number) && (
                    <div className="rounded-xl border border-[var(--ss-border)] p-4">
                      <div className="text-xs ss-eyebrow mb-2">Coming back to you</div>
                      {ret.label_url && <a href={mediaUrl(ret.label_url)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[var(--ss-mint)] text-sm hover:underline"><Download className="h-4 w-4" /> Return label</a>}
                      {ret.tracking_number && <div className="mt-2 text-sm text-[var(--ss-muted)]">Tracking: <a data-testid="order-tracking-link" className="text-[var(--ss-fg)] ss-mono hover:text-[var(--ss-mint)]" href={ret.tracking_url} target="_blank" rel="noreferrer">{ret.tracking_number}</a></div>}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Items */}
            <div className="ss-card p-6">
              <h3 className="font-semibold text-[var(--ss-fg)] mb-4">Your shoes</h3>
              <div className="space-y-3">
                {(order.items || []).map((it, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-[var(--ss-border)] pb-3 last:border-0">
                    <div>
                      <div className="text-[var(--ss-fg)] font-medium">Pair {i + 1}: {it.service === "deep" ? "Deep Clean" : "Quick Clean"}</div>
                      <div className="text-xs text-[var(--ss-muted)]">{[it.brand, it.model, it.size ? `UK ${it.size}` : ""].filter(Boolean).join(" · ") || "—"}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-[var(--ss-border)] space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-[var(--ss-muted)]">Cleaning</span><span className="ss-mono text-[var(--ss-fg)]">{gbp(order.pricing?.cleaning_total)}</span></div>
                <div className="flex justify-between"><span className="text-[var(--ss-muted)]">Delivery</span><span className="ss-mono text-[var(--ss-fg)]">{gbp(order.pricing?.shipping_total)}</span></div>
                <div className="flex justify-between pt-1"><span className="text-[var(--ss-fg)] font-semibold">Total</span><span className="ss-mono text-[var(--ss-mint)] text-lg">{gbp(order.pricing?.grand_total)}</span></div>
              </div>
            </div>

            {/* Photos */}
            {(order.photos || []).length > 0 && (
              <div className="ss-card p-6">
                <h3 className="font-semibold text-[var(--ss-fg)] mb-4">Photos</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {order.photos.map((p, i) => (
                    <a key={i} href={mediaUrl(p.url)} target="_blank" rel="noreferrer" className="aspect-square rounded-lg overflow-hidden border border-[var(--ss-border)]">
                      <img src={mediaUrl(p.url)} alt={p.slot} className="h-full w-full object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
