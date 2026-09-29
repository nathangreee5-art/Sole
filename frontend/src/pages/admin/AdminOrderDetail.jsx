import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft, Check, X, Camera, Truck, Upload, RefreshCcw, Mail, PoundSterling, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { StatusBadge, PaymentBadge } from "@/components/common/StatusBadge";
import { OrderTimeline } from "@/components/common/OrderTimeline";
import {
  adminGetOrder, adminApprove, adminDecline, adminRequestPhotos, adminSetStatus,
  adminSetPrice, adminGenerateLabel, adminManualLabel, adminRefund, adminContactCustomer,
  adminGetSettings, adminDeleteOrder, mediaUrl,
} from "@/lib/api";
import { gbp } from "@/lib/format";

const ALL_STATUSES = [
  "PENDING_ASSESSMENT", "AWAITING_CUSTOMER_INFORMATION", "APPROVED", "AWAITING_PAYMENT", "PAID",
  "LABEL_GENERATED", "AWAITING_SHOES", "SHOES_IN_TRANSIT", "SHOES_RECEIVED", "CLEANING",
  "QUALITY_CHECK", "READY_FOR_RETURN", "RETURN_LABEL_GENERATED", "RETURN_IN_TRANSIT",
  "DELIVERED", "COMPLETED", "CANCELLED", "REFUNDED",
];

export default function AdminOrderDetail() {
  const { orderNumber } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("");
  const [price, setPrice] = useState({ cleaning_total: "", shipping_total: "" });
  const [refundAmt, setRefundAmt] = useState("");
  const [contact, setContact] = useState({ subject: "", message: "" });
  const [manual, setManual] = useState({ type: "inbound", tracking_number: "", tracking_url: "", file: null });
  const [courier, setCourier] = useState(null);

  const load = useCallback(async () => {
    const res = await adminGetOrder(orderNumber);
    setOrder(res.order);
    setStatus(res.order.status);
    setPrice({ cleaning_total: res.order.pricing?.cleaning_total ?? "", shipping_total: res.order.pricing?.shipping_total ?? "" });
  }, [orderNumber]);

  useEffect(() => { load().catch(() => toast.error("Order not found")); }, [load]);
  useEffect(() => { adminGetSettings().then((s) => setCourier(s.royal_mail)).catch(() => {}); }, []);

  const run = async (fn, msg) => {
    setBusy(true);
    try { const res = await fn(); if (res?.order) setOrder(res.order); if (msg) toast.success(msg); }
    catch (err) { toast.error(err?.response?.data?.detail || "Action failed."); }
    finally { setBusy(false); }
  };

  const doDelete = async () => {
    setDeleting(true);
    try {
      await adminDeleteOrder(orderNumber);
      toast.success(`Order ${orderNumber} deleted`);
      navigate("/admin/orders");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Could not delete order.");
      setDeleting(false);
    }
  };

  if (!order) return <div className="py-24 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-[var(--ss-mint)]" /></div>;

  const addr = order.return_address || {};
  const bill = order.billing_address || {};
  const inbound = order.shipment?.inbound || {};
  const ret = order.shipment?.return || {};

  const doManualLabel = async () => {
    const fd = new FormData();
    fd.append("type", manual.type);
    fd.append("tracking_number", manual.tracking_number);
    fd.append("tracking_url", manual.tracking_url);
    if (manual.file) fd.append("file", manual.file);
    await run(() => adminManualLabel(orderNumber, fd), "Label saved & customer notified");
    setManual({ ...manual, tracking_number: "", tracking_url: "", file: null });
  };

  return (
    <div>
      <Link to="/admin/orders" className="inline-flex items-center gap-2 text-sm text-[var(--ss-muted)] hover:text-[var(--ss-mint)]"><ArrowLeft className="h-4 w-4" /> Back to orders</Link>
      <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-[var(--ss-fg)] ss-mono">{order.order_number}</h1>
          <div className="text-sm text-[var(--ss-muted)]">{new Date(order.created_at).toLocaleString("en-GB")}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={order.status} /><PaymentBadge status={order.payment?.status} />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" data-testid="admin-delete-order-button" className="border-[rgba(255,90,106,0.4)] bg-transparent text-[#ff9aa4] hover:bg-[rgba(255,90,106,0.08)] h-9"><Trash2 className="mr-2 h-4 w-4" /> Delete</Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-[var(--ss-surface)] border-[var(--ss-border)]">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-[var(--ss-fg)]">Delete order {order.order_number}?</AlertDialogTitle>
                <AlertDialogDescription className="text-[var(--ss-muted)]">This permanently removes the order and its uploaded photos. This cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-transparent border-[var(--ss-border)] text-[var(--ss-fg)]">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={doDelete} disabled={deleting} data-testid="admin-confirm-delete-button" className="bg-[#ff5a6a] text-white hover:bg-[#e04b5a]">{deleting ? "Deleting..." : "Delete order"}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="mt-6 grid lg:grid-cols-3 gap-6">
        {/* LEFT: customer + actions */}
        <div className="lg:col-span-1 space-y-6">
          <div className="ss-card p-5">
            <h3 className="font-semibold text-[var(--ss-fg)] mb-3">Customer</h3>
            <div className="text-sm space-y-1">
              <div className="text-[var(--ss-fg)]">{order.customer?.name}</div>
              <div className="text-[var(--ss-muted)]">{order.customer?.email}</div>
              <div className="text-[var(--ss-muted)]">{order.customer?.phone}</div>
            </div>
            <div className="mt-4 pt-4 border-t border-[var(--ss-border)] text-sm">
              <div className="ss-eyebrow mb-1">Return to</div>
              <div className="text-[var(--ss-muted)]">{[addr.line1, addr.line2, addr.city, addr.county, addr.postcode].filter(Boolean).join(", ")}</div>
              <div className="ss-eyebrow mt-3 mb-1">Billing</div>
              <div className="text-[var(--ss-muted)]">{[bill.line1, bill.city, bill.postcode].filter(Boolean).join(", ")}</div>
            </div>
          </div>

          {/* Assessment actions */}
          {["PENDING_ASSESSMENT", "AWAITING_CUSTOMER_INFORMATION"].includes(order.status) && (
            <div className="ss-card p-5">
              <h3 className="font-semibold text-[var(--ss-fg)] mb-3">Assessment</h3>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Optional note to customer" className="bg-[var(--ss-surface-2)] border-[var(--ss-border)] mb-3" />
              <div className="grid grid-cols-1 gap-2">
                <Button disabled={busy} onClick={() => run(() => adminApprove(orderNumber, note), "Order approved & customer emailed")} data-testid="admin-approve-button" className="bg-[var(--ss-mint)] text-[#ffffff] hover:bg-[var(--ss-mint-600)] font-semibold"><Check className="mr-2 h-4 w-4" /> Approve order</Button>
                <Button disabled={busy} onClick={() => run(() => adminRequestPhotos(orderNumber, note), "Requested more photos")} variant="outline" className="border-[var(--ss-border)] bg-transparent text-[var(--ss-fg)] hover:border-[var(--ss-mint)]" data-testid="admin-request-photos-button"><Camera className="mr-2 h-4 w-4" /> Request more photos</Button>
                <Button disabled={busy} onClick={() => run(() => adminDecline(orderNumber, note), "Order declined")} variant="outline" className="border-[rgba(255,90,106,0.4)] bg-transparent text-[#ff9aa4] hover:bg-[rgba(255,90,106,0.08)]" data-testid="admin-decline-button"><X className="mr-2 h-4 w-4" /> Decline order</Button>
              </div>
            </div>
          )}

          {/* Status control */}
          <div className="ss-card p-5">
            <h3 className="font-semibold text-[var(--ss-fg)] mb-3">Update status</h3>
            <select value={status} onChange={(e) => setStatus(e.target.value)} data-testid="admin-status-select" className="w-full rounded-lg bg-[var(--ss-surface-2)] border border-[var(--ss-border)] text-[var(--ss-fg)] px-3 py-2 text-sm">
              {ALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <Button disabled={busy} onClick={() => run(() => adminSetStatus(orderNumber, status, "Status updated by admin"), "Status updated")} data-testid="admin-set-status-button" className="mt-3 w-full bg-[var(--ss-mint)] text-[#ffffff] hover:bg-[var(--ss-mint-600)] font-semibold"><RefreshCcw className="mr-2 h-4 w-4" /> Set status</Button>
          </div>

          {/* Pricing */}
          <div className="ss-card p-5">
            <h3 className="font-semibold text-[var(--ss-fg)] mb-3">Adjust pricing</h3>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs text-[var(--ss-muted)]">Cleaning</Label><Input value={price.cleaning_total} onChange={(e) => setPrice({ ...price, cleaning_total: e.target.value })} className="mt-1 bg-[var(--ss-surface-2)] border-[var(--ss-border)]" /></div>
              <div><Label className="text-xs text-[var(--ss-muted)]">Delivery</Label><Input value={price.shipping_total} onChange={(e) => setPrice({ ...price, shipping_total: e.target.value })} className="mt-1 bg-[var(--ss-surface-2)] border-[var(--ss-border)]" /></div>
            </div>
            <Button disabled={busy} onClick={() => run(() => adminSetPrice(orderNumber, { cleaning_total: parseFloat(price.cleaning_total), shipping_total: parseFloat(price.shipping_total) }), "Price updated")} className="mt-3 w-full bg-transparent border border-[var(--ss-border)] text-[var(--ss-fg)] hover:border-[var(--ss-mint)]"><PoundSterling className="mr-2 h-4 w-4" /> Update price</Button>
          </div>

          {/* Refund */}
          {order.payment?.status === "PAID" || order.payment?.status === "PARTIALLY_REFUNDED" ? (
            <div className="ss-card p-5">
              <h3 className="font-semibold text-[var(--ss-fg)] mb-3">Refund</h3>
              <Input value={refundAmt} onChange={(e) => setRefundAmt(e.target.value)} placeholder="Amount (blank = full)" className="bg-[var(--ss-surface-2)] border-[var(--ss-border)]" />
              <Button disabled={busy} onClick={() => run(() => adminRefund(orderNumber, refundAmt ? parseFloat(refundAmt) : null), "Refund processed")} className="mt-3 w-full bg-transparent border border-[rgba(255,90,106,0.4)] text-[#ff9aa4] hover:bg-[rgba(255,90,106,0.08)]">Issue refund</Button>
            </div>
          ) : null}
        </div>

        {/* RIGHT: photos, timeline, shipping, contact */}
        <div className="lg:col-span-2 space-y-6">
          {/* Photos */}
          <div className="ss-card p-5">
            <h3 className="font-semibold text-[var(--ss-fg)] mb-3">Uploaded photos ({(order.photos || []).length})</h3>
            {(order.photos || []).length === 0 ? <p className="text-sm text-[var(--ss-muted)]">No photos.</p> : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {order.photos.map((p, i) => (
                  <a key={i} href={mediaUrl(p.url)} target="_blank" rel="noreferrer" className="group relative aspect-square rounded-lg overflow-hidden border border-[var(--ss-border)]">
                    <img src={mediaUrl(p.url)} alt={p.slot} className="h-full w-full object-cover" />
                    <span className="absolute bottom-1 left-1 text-[10px] uppercase bg-[rgba(0,0,0,0.6)] text-white px-1.5 py-0.5 rounded">{p.slot}</span>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Items */}
          <div className="ss-card p-5">
            <h3 className="font-semibold text-[var(--ss-fg)] mb-3">Order items</h3>
            <div className="space-y-3">
              {(order.items || []).map((it, i) => (
                <div key={i} className="rounded-lg border border-[var(--ss-border)] p-3">
                  <div className="flex justify-between"><span className="text-[var(--ss-fg)] font-medium">Pair {i + 1}: {it.service === "deep" ? "Deep Clean" : "Quick Clean"}</span></div>
                  <div className="text-xs text-[var(--ss-muted)] mt-1">{[it.brand, it.model, it.material, it.color, it.size ? `UK ${it.size}` : "", it.condition].filter(Boolean).join(" · ") || "—"}</div>
                  {it.notes ? <div className="text-xs text-[var(--ss-muted)] mt-1 italic">"{it.notes}"</div> : null}
                </div>
              ))}
            </div>
            {order.special_instructions ? <div className="mt-3 text-sm text-[var(--ss-muted)]"><span className="ss-eyebrow">Special instructions</span><p className="mt-1">{order.special_instructions}</p></div> : null}
          </div>

          {/* Shipping / labels */}
          <div className="ss-card p-5">
            <h3 className="font-semibold text-[var(--ss-fg)] mb-1 flex items-center gap-2"><Truck className="h-5 w-5 text-[var(--ss-mint)]" /> Shipping labels</h3>
            {courier && (
              <p className="text-xs text-[var(--ss-muted)] mb-4">Carrier: <span className="text-[var(--ss-fg)]">{courier.carrier_name}</span> &middot; Returns portal: <span className="text-[var(--ss-fg)]">{courier.returns_portal_configured ? "connected" : "not set"}</span> &middot; Outbound API: <span className="text-[var(--ss-fg)]">{courier.outbound_api_configured ? "connected" : "not set"}</span></p>
            )}
            <div className="grid sm:grid-cols-2 gap-4">
              {["inbound", "return"].map((leg) => {
                const data = leg === "inbound" ? inbound : ret;
                return (
                  <div key={leg} className="rounded-lg border border-[var(--ss-border)] p-4">
                    <div className="ss-eyebrow mb-2">{leg === "inbound" ? "Inbound (to us)" : "Return (to customer)"}</div>
                    {data.portal_url ? <div className="text-sm text-[var(--ss-muted)]">Customer uses returns portal <a href={data.portal_url} target="_blank" rel="noreferrer" className="text-[var(--ss-mint)] hover:underline">(link)</a></div> : null}
                    {data.tracking_number ? <div className="text-sm text-[var(--ss-muted)]">Tracking: <span className="ss-mono text-[var(--ss-fg)]">{data.tracking_number}</span></div> : (!data.portal_url ? <div className="text-sm text-[var(--ss-muted)]">No label yet</div> : null)}
                    {data.label_url ? <a href={mediaUrl(data.label_url)} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm text-[var(--ss-mint)] hover:underline">View label</a> : null}
                    {leg === "return" && courier?.outbound_api_configured && (
                      <Button disabled={busy} onClick={() => run(() => adminGenerateLabel(orderNumber, leg), "Return label generated")} className="mt-3 w-full h-9 text-xs bg-transparent border border-[var(--ss-border)] text-[var(--ss-fg)] hover:border-[var(--ss-mint)]">Generate via Royal Mail</Button>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Manual label upload */}
            <div className="mt-4 rounded-lg border border-dashed border-[var(--ss-border)] p-4">
              <div className="ss-eyebrow mb-3">Upload a prepaid label manually</div>
              <div className="grid sm:grid-cols-2 gap-3">
                <select value={manual.type} onChange={(e) => setManual({ ...manual, type: e.target.value })} className="rounded-lg bg-[var(--ss-surface-2)] border border-[var(--ss-border)] text-[var(--ss-fg)] px-3 py-2 text-sm">
                  <option value="inbound">Inbound (to us)</option>
                  <option value="return">Return (to customer)</option>
                </select>
                <Input value={manual.tracking_number} onChange={(e) => setManual({ ...manual, tracking_number: e.target.value })} placeholder="Tracking number" className="bg-[var(--ss-surface-2)] border-[var(--ss-border)]" data-testid="admin-manual-tracking" />
                <Input value={manual.tracking_url} onChange={(e) => setManual({ ...manual, tracking_url: e.target.value })} placeholder="Tracking URL (optional)" className="bg-[var(--ss-surface-2)] border-[var(--ss-border)]" />
                <input type="file" accept="application/pdf,image/*" onChange={(e) => setManual({ ...manual, file: e.target.files[0] })} className="text-sm text-[var(--ss-muted)]" data-testid="admin-manual-label-file" />
              </div>
              <Button disabled={busy} onClick={doManualLabel} className="mt-3 bg-[var(--ss-mint)] text-[#ffffff] hover:bg-[var(--ss-mint-600)] font-semibold" data-testid="admin-upload-label-button"><Upload className="mr-2 h-4 w-4" /> Save label & notify customer</Button>
            </div>
          </div>

          {/* Contact + timeline */}
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="ss-card p-5">
              <h3 className="font-semibold text-[var(--ss-fg)] mb-3">Contact customer</h3>
              <Input value={contact.subject} onChange={(e) => setContact({ ...contact, subject: e.target.value })} placeholder="Subject" className="bg-[var(--ss-surface-2)] border-[var(--ss-border)] mb-2" />
              <Textarea value={contact.message} onChange={(e) => setContact({ ...contact, message: e.target.value })} rows={3} placeholder="Message" className="bg-[var(--ss-surface-2)] border-[var(--ss-border)]" />
              <Button disabled={busy || !contact.subject || !contact.message} onClick={() => run(async () => { await adminContactCustomer(orderNumber, contact); setContact({ subject: "", message: "" }); return {}; }, "Email sent")} className="mt-3 w-full bg-transparent border border-[var(--ss-border)] text-[var(--ss-fg)] hover:border-[var(--ss-mint)]"><Mail className="mr-2 h-4 w-4" /> Send email</Button>
            </div>
            <div className="ss-card p-5">
              <h3 className="font-semibold text-[var(--ss-fg)] mb-4">Progress</h3>
              <OrderTimeline order={order} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
