import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Sparkles, ShieldCheck, CheckCircle2, Copy, ExternalLink, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { PhotoUploader, requiredSlotsCovered } from "@/components/booking/PhotoUploader";
import { getServices, calculatePrice, createOrder } from "@/lib/api";
import { gbp } from "@/lib/format";

const STEPS = ["Service & pairs", "Photos", "Shoe details", "Delivery", "Review"];
const emptyAddr = { line1: "", line2: "", city: "", county: "", postcode: "", country: "United Kingdom" };

export default function BookAClean() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [services, setServices] = useState([]);
  const [pairCount, setPairCount] = useState(1);
  const [items, setItems] = useState([{ pair_index: 0, service: "quick", brand: "", model: "", material: "", color: "", size: "", condition: "", notes: "" }]);
  const [photos, setPhotos] = useState([]);
  const [customer, setCustomer] = useState({ customer_name: "", email: "", phone: "" });
  const [billing, setBilling] = useState({ ...emptyAddr });
  const [ret, setRet] = useState({ ...emptyAddr });
  const [sameAddr, setSameAddr] = useState(true);
  const [special, setSpecial] = useState("");
  const [price, setPrice] = useState({ cleaning_total: 0, shipping_total: 0, grand_total: 0, total_pairs: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(null);

  useEffect(() => { getServices().then((d) => setServices(d.services)).catch(() => {}); }, []);

  // keep items array in sync with pairCount
  useEffect(() => {
    setItems((prev) => {
      const next = [...prev];
      if (pairCount > prev.length) {
        for (let i = prev.length; i < pairCount; i++) next.push({ pair_index: i, service: "quick", brand: "", model: "", material: "", color: "", size: "", condition: "", notes: "" });
      } else if (pairCount < prev.length) {
        next.length = pairCount;
      }
      return next.map((it, i) => ({ ...it, pair_index: i }));
    });
  }, [pairCount]);

  // live price
  useEffect(() => {
    calculatePrice(items.map((i) => ({ service: i.service }))).then(setPrice).catch(() => {});
  }, [items]);

  const priceLabel = useMemo(() => services.reduce((acc, s) => ({ ...acc, [s.key]: s }), {}), [services]);

  const setItem = (idx, key, val) => setItems(items.map((it, i) => (i === idx ? { ...it, [key]: val } : it)));

  const validateStep = () => {
    if (step === 0) return true;
    if (step === 1) {
      if (!requiredSlotsCovered(photos)) { toast.error("Please add the 5 required angles: front, left, right, back and soles."); return false; }
      return true;
    }
    if (step === 3) {
      if (!customer.customer_name || customer.customer_name.length < 2) { toast.error("Please enter your name."); return false; }
      if (!/^\S+@\S+\.\S+$/.test(customer.email)) { toast.error("Please enter a valid email."); return false; }
      if (!customer.phone || customer.phone.length < 6) { toast.error("Please enter a valid phone number."); return false; }
      if (!billing.line1 || !billing.city || billing.postcode.replace(/\s/g, "").length < 5) { toast.error("Please complete your billing address including a valid postcode."); return false; }
      const r = sameAddr ? billing : ret;
      if (!r.line1 || !r.city || r.postcode.replace(/\s/g, "").length < 5) { toast.error("Please complete your return address including a valid postcode."); return false; }
      return true;
    }
    return true;
  };

  const next = () => { if (validateStep()) setStep((s) => Math.min(s + 1, STEPS.length - 1)); };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const submit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        ...customer,
        billing_address: billing,
        return_address: sameAddr ? billing : ret,
        items,
        photos: photos.map((p) => ({ file_id: p.file_id, slot: p.slot, filename: p.filename, content_type: p.content_type })),
        special_instructions: special,
        origin_url: window.location.origin,
      };
      const res = await createOrder(payload);
      const o = res.order;
      toast.success(`Order ${o.order_number} submitted for assessment!`);
      setConfirmed({
        order_number: o.order_number,
        access_token: o.access_token,
        link: `${window.location.origin}/order/${o.order_number}?token=${o.access_token}`,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Could not submit your order. Please check your details.");
    } finally { setSubmitting(false); }
  };

  if (confirmed) {
    return (
      <BookingConfirmation
        confirmed={confirmed}
        onView={() => navigate(`/order/${confirmed.order_number}?token=${confirmed.access_token}`)}
      />
    );
  }

  return (
    <div className="ss-container py-10 sm:py-14">
      <div className="max-w-5xl mx-auto">
        <div className="ss-eyebrow mb-2">Book a clean</div>
        <h1 className="font-display text-4xl sm:text-5xl text-[var(--ss-fg)]">Let&rsquo;s refresh your shoes</h1>

        <div className="mt-6">
          <div className="flex items-center justify-between text-xs text-[var(--ss-muted)] mb-2">
            <span>Step {step + 1} of {STEPS.length} &middot; {STEPS[step]}</span>
            <span>{Math.round(((step + 1) / STEPS.length) * 100)}%</span>
          </div>
          <Progress value={((step + 1) / STEPS.length) * 100} className="h-1.5 bg-[var(--ss-surface-2)]" />
        </div>

        <div className="mt-8 grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* STEP 0: SERVICE & PAIRS */}
            {step === 0 && (
              <div className="space-y-5">
                <div className="ss-card p-6">
                  <Label className="text-[var(--ss-fg)] font-medium">How many pairs?</Label>
                  <div className="mt-3 flex gap-2" data-testid="booking-pair-count-select">
                    {[1, 2, 3, 4].map((n) => (
                      <button key={n} onClick={() => setPairCount(n)} className={`h-12 w-12 rounded-lg border font-display text-xl ${pairCount === n ? "bg-[var(--ss-mint)] text-[#ffffff] border-[var(--ss-mint)]" : "border-[var(--ss-border)] text-[var(--ss-fg)] hover:border-[var(--ss-mint)]"}`}>{n}</button>
                    ))}
                  </div>
                </div>
                {items.map((it, idx) => (
                  <div key={idx} className="ss-card p-6">
                    <div className="font-medium text-[var(--ss-fg)] mb-3">Pair {idx + 1} &mdash; choose a service</div>
                    <RadioGroup value={it.service} onValueChange={(v) => setItem(idx, "service", v)} className="grid sm:grid-cols-2 gap-3">
                      {services.map((s) => (
                        <label key={s.key} className={`cursor-pointer rounded-xl border p-4 flex items-start gap-3 ${it.service === s.key ? "border-[var(--ss-mint)] bg-[rgba(59,130,246,0.06)]" : "border-[var(--ss-border)]"}`}>
                          <RadioGroupItem value={s.key} className="mt-1" data-testid={`booking-pair-${idx}-service-${s.key}`} />
                          <div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="font-semibold text-[var(--ss-fg)]">{s.name}</span>
                              <span className="text-[var(--ss-mint)] font-display text-xl">{gbp(s.price)}</span>
                            </div>
                            <div className="text-xs text-[var(--ss-muted)] mt-1">{s.tagline}</div>
                          </div>
                        </label>
                      ))}
                    </RadioGroup>
                  </div>
                ))}
              </div>
            )}

            {/* STEP 1: PHOTOS */}
            {step === 1 && (
              <div className="ss-card p-6">
                <h3 className="font-semibold text-[var(--ss-fg)]">Upload photos of your shoes</h3>
                <p className="text-sm text-[var(--ss-muted)] mt-1">Clear, well-lit photos help us assess accurately. Tap a slot to use your camera or gallery.</p>
                <div className="mt-5"><PhotoUploader photos={photos} setPhotos={setPhotos} /></div>
              </div>
            )}

            {/* STEP 2: SHOE DETAILS */}
            {step === 2 && (
              <div className="space-y-5">
                {items.map((it, idx) => (
                  <div key={idx} className="ss-card p-6">
                    <div className="font-medium text-[var(--ss-fg)] mb-4">Pair {idx + 1} &middot; {priceLabel[it.service]?.name || it.service}</div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="Brand" testId={idx === 0 ? "booking-shoe-brand-input" : undefined} value={it.brand} onChange={(v) => setItem(idx, "brand", v)} placeholder="e.g. Nike" />
                      <Field label="Model" value={it.model} onChange={(v) => setItem(idx, "model", v)} placeholder="e.g. Air Max 90" />
                      <Field label="Material (if known)" value={it.material} onChange={(v) => setItem(idx, "material", v)} placeholder="Leather, suede, mesh..." />
                      <Field label="Size (UK)" testId={idx === 0 ? "booking-shoe-size-input" : undefined} value={it.size} onChange={(v) => setItem(idx, "size", v)} placeholder="e.g. 9" />
                      <Field label="Colour" value={it.color} onChange={(v) => setItem(idx, "color", v)} placeholder="e.g. White / Black" />
                      <Field label="Condition" value={it.condition} onChange={(v) => setItem(idx, "condition", v)} placeholder="Lightly worn, heavily soiled..." />
                    </div>
                    <div className="mt-4">
                      <Label className="text-[var(--ss-muted)]">Stains, damage or special requests</Label>
                      <Textarea value={it.notes} onChange={(e) => setItem(idx, "notes", e.target.value)} rows={3} className="mt-1.5 bg-[var(--ss-surface-2)] border-[var(--ss-border)]" placeholder="Anything you want us to know about this pair" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* STEP 3: DELIVERY */}
            {step === 3 && (
              <div className="space-y-5">
                <div className="ss-card p-6">
                  <h3 className="font-semibold text-[var(--ss-fg)] mb-4">Your details</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Full name" value={customer.customer_name} onChange={(v) => setCustomer({ ...customer, customer_name: v })} placeholder="Jane Doe" testId="booking-name-input" />
                    <Field label="Email" type="email" value={customer.email} onChange={(v) => setCustomer({ ...customer, email: v })} placeholder="you@email.com" testId="booking-email-input" />
                    <Field label="Phone" value={customer.phone} onChange={(v) => setCustomer({ ...customer, phone: v })} placeholder="07123 456789" testId="booking-phone-input" />
                  </div>
                </div>
                <AddressCard title="Billing address" addr={billing} setAddr={setBilling} prefix="billing" />
                <div className="ss-card p-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <Checkbox checked={sameAddr} onCheckedChange={(v) => setSameAddr(!!v)} data-testid="booking-same-address" />
                    <span className="text-sm text-[var(--ss-fg)]">Return shoes to the same address</span>
                  </label>
                </div>
                {!sameAddr && <AddressCard title="Return address" addr={ret} setAddr={setRet} prefix="return" />}
                <div className="ss-card p-6">
                  <Label className="text-[var(--ss-muted)]">Special instructions (optional)</Label>
                  <Textarea value={special} onChange={(e) => setSpecial(e.target.value)} rows={3} className="mt-1.5 bg-[var(--ss-surface-2)] border-[var(--ss-border)]" placeholder="Anything else for your whole order" />
                </div>
              </div>
            )}

            {/* STEP 4: REVIEW */}
            {step === 4 && (
              <div className="space-y-5">
                <div className="ss-card p-6">
                  <h3 className="font-semibold text-[var(--ss-fg)]">Review your order</h3>
                  <div className="mt-4 space-y-3">
                    {items.map((it, idx) => (
                      <div key={idx} className="flex items-center justify-between border-b border-[var(--ss-border)] pb-3">
                        <div>
                          <div className="text-[var(--ss-fg)] font-medium">Pair {idx + 1}: {priceLabel[it.service]?.name}</div>
                          <div className="text-xs text-[var(--ss-muted)]">{[it.brand, it.model].filter(Boolean).join(" ") || "Shoe details provided"}</div>
                        </div>
                        <div className="ss-mono text-[var(--ss-fg)]">{gbp(priceLabel[it.service]?.price)}</div>
                      </div>
                    ))}
                    <div className="text-sm text-[var(--ss-muted)]">Photos uploaded: <span className="text-[var(--ss-fg)]">{photos.length}</span></div>
                    <div className="text-sm text-[var(--ss-muted)]">Deliver to: <span className="text-[var(--ss-fg)]">{(sameAddr ? billing : ret).line1}, {(sameAddr ? billing : ret).city}, {(sameAddr ? billing : ret).postcode}</span></div>
                  </div>
                </div>
                <div className="ss-card p-5 flex items-start gap-3 bg-[rgba(59,130,246,0.05)] border-[rgba(59,130,246,0.25)]">
                  <ShieldCheck className="h-5 w-5 text-[var(--ss-mint)] mt-0.5 shrink-0" />
                  <p className="text-sm text-[var(--ss-fg)]">You&rsquo;ll only pay after we assess your photos and confirm what&rsquo;s possible. No payment is taken now.</p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              {step > 0 ? (
                <Button variant="outline" onClick={back} data-testid="booking-back-button" className="border-[var(--ss-border)] bg-transparent text-[var(--ss-fg)] hover:border-[var(--ss-mint)]"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
              ) : <span />}
              {step < STEPS.length - 1 ? (
                <Button onClick={next} data-testid={`booking-step-${step + 1}-continue-button`} className="bg-[var(--ss-mint)] text-[#ffffff] hover:bg-[var(--ss-mint-600)] font-semibold">Continue <ArrowRight className="ml-2 h-4 w-4" /></Button>
              ) : (
                <Button onClick={submit} disabled={submitting} data-testid="booking-submit-for-assessment-button" className="bg-[var(--ss-mint)] text-[#ffffff] hover:bg-[var(--ss-mint-600)] font-semibold">
                  {submitting ? "Submitting..." : (<>Submit for assessment <Check className="ml-2 h-4 w-4" /></>)}
                </Button>
              )}
            </div>
          </div>

          {/* SUMMARY */}
          <div className="lg:col-span-1">
            <div className="ss-card p-6 lg:sticky lg:top-24" data-testid="booking-price-summary">
              <div className="flex items-center gap-2 mb-4"><Sparkles className="h-5 w-5 text-[var(--ss-mint)]" /><h3 className="font-semibold text-[var(--ss-fg)]">Order summary</h3></div>
              <div className="space-y-2 text-sm">
                <Row label={`Cleaning (${price.total_pairs} pair${price.total_pairs !== 1 ? "s" : ""})`} value={gbp(price.cleaning_total)} />
                <Row label="Tracked UK delivery" value={gbp(price.shipping_total)} />
                <div className="border-t border-[var(--ss-border)] my-2" />
                <Row label="Estimated total" value={gbp(price.grand_total)} bold />
              </div>
              <p className="mt-4 text-xs text-[var(--ss-muted)]">Final price is confirmed after we assess your photos. You won&rsquo;t be charged until your order is approved.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const CopyRow = ({ label, value, testId }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1600); }
    catch { /* clipboard unavailable */ }
  };
  return (
    <div>
      <Label className="text-[var(--ss-muted)]">{label}</Label>
      <div className="mt-1.5 flex items-stretch gap-2">
        <div className="flex-1 ss-mono text-sm text-[var(--ss-fg)] bg-[var(--ss-surface-2)] border border-[var(--ss-border)] rounded-lg px-3 py-2.5 break-all" data-testid={`${testId}-value`}>{value}</div>
        <Button type="button" variant="outline" onClick={copy} data-testid={`${testId}-copy`} className="shrink-0 border-[var(--ss-border)] bg-transparent text-[var(--ss-fg)] hover:border-[var(--ss-mint)]">
          {copied ? <Check className="h-4 w-4 text-[var(--ss-mint)]" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};

const BookingConfirmation = ({ confirmed, onView }) => (
  <div className="ss-container py-12 sm:py-16" data-testid="booking-confirmation">
    <div className="max-w-2xl mx-auto">
      <div className="ss-card p-8 sm:p-10 text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-[rgba(59,130,246,0.12)] flex items-center justify-center">
          <CheckCircle2 className="h-9 w-9 text-[var(--ss-mint)]" />
        </div>
        <div className="ss-eyebrow mt-5 mb-1">Order received</div>
        <h1 className="font-display text-3xl sm:text-4xl text-[var(--ss-fg)]">You&rsquo;re all set!</h1>
        <p className="mt-3 text-[var(--ss-muted)]">
          Thanks &mdash; your order <span className="text-[var(--ss-fg)] font-semibold">{confirmed.order_number}</span> is in for photo assessment.
          We&rsquo;ll email you once it&rsquo;s reviewed. You won&rsquo;t be charged until it&rsquo;s approved.
        </p>

        <div className="mt-7 text-left space-y-4">
          <CopyRow label="Order number" value={confirmed.order_number} testId="confirm-order-number" />
          <CopyRow label="Access code (keep this safe)" value={confirmed.access_token} testId="confirm-access-code" />
          <CopyRow label="Direct order link" value={confirmed.link} testId="confirm-order-link" />
        </div>

        <div className="mt-6 ss-card p-4 flex items-start gap-3 bg-[rgba(59,130,246,0.05)] border-[rgba(59,130,246,0.25)] text-left">
          <ShieldCheck className="h-5 w-5 text-[var(--ss-mint)] mt-0.5 shrink-0" />
          <p className="text-sm text-[var(--ss-fg)]">
            Save your <b>order number</b> and <b>access code</b> &mdash; you&rsquo;ll need them to track your order.
            We&rsquo;ve also emailed the link to you. Anyone with this link can view your order.
          </p>
        </div>

        <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button onClick={onView} data-testid="confirm-view-order-button" className="w-full sm:w-auto bg-[var(--ss-mint)] text-[#ffffff] hover:bg-[var(--ss-mint-600)] font-semibold">
            View my order <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto border-[var(--ss-border)] bg-transparent text-[var(--ss-fg)] hover:border-[var(--ss-mint)]">
            <a href="/track" data-testid="confirm-track-link"><Search className="mr-2 h-4 w-4" /> Track later</a>
          </Button>
        </div>
      </div>
    </div>
  </div>
);

const Field = ({ label, value, onChange, placeholder, type = "text", testId }) => (
  <div>
    <Label className="text-[var(--ss-muted)]">{label}</Label>
    <Input type={type} value={value} data-testid={testId} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-1.5 bg-[var(--ss-surface-2)] border-[var(--ss-border)]" />
  </div>
);

const Row = ({ label, value, bold }) => (
  <div className="flex items-center justify-between">
    <span className={bold ? "text-[var(--ss-fg)] font-semibold" : "text-[var(--ss-muted)]"}>{label}</span>
    <span className={`ss-mono ${bold ? "text-[var(--ss-mint)] text-lg" : "text-[var(--ss-fg)]"}`}>{value}</span>
  </div>
);

const AddressCard = ({ title, addr, setAddr, prefix }) => {  const set = (k) => (e) => setAddr({ ...addr, [k]: e.target.value });
  return (
    <div className="ss-card p-6">
      <h3 className="font-semibold text-[var(--ss-fg)] mb-4">{title}</h3>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2"><Label className="text-[var(--ss-muted)]">Address line 1</Label><Input value={addr.line1} onChange={set("line1")} data-testid={`booking-${prefix}-line1-input`} className="mt-1.5 bg-[var(--ss-surface-2)] border-[var(--ss-border)]" placeholder="House number and street" /></div>
        <div className="sm:col-span-2"><Label className="text-[var(--ss-muted)]">Address line 2 (optional)</Label><Input value={addr.line2} onChange={set("line2")} className="mt-1.5 bg-[var(--ss-surface-2)] border-[var(--ss-border)]" /></div>
        <div><Label className="text-[var(--ss-muted)]">Town / City</Label><Input value={addr.city} onChange={set("city")} data-testid={`booking-${prefix}-city-input`} className="mt-1.5 bg-[var(--ss-surface-2)] border-[var(--ss-border)]" /></div>
        <div><Label className="text-[var(--ss-muted)]">County</Label><Input value={addr.county} onChange={set("county")} className="mt-1.5 bg-[var(--ss-surface-2)] border-[var(--ss-border)]" /></div>
        <div><Label className="text-[var(--ss-muted)]">Postcode</Label><Input value={addr.postcode} onChange={set("postcode")} data-testid={`booking-${prefix}-postcode-input`} className="mt-1.5 bg-[var(--ss-surface-2)] border-[var(--ss-border)]" placeholder="e.g. L1 8JQ" /></div>
        <div><Label className="text-[var(--ss-muted)]">Country</Label><Input value={addr.country} onChange={set("country")} className="mt-1.5 bg-[var(--ss-surface-2)] border-[var(--ss-border)]" /></div>
      </div>
    </div>
  );
};
