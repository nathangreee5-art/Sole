import React, { useEffect, useState } from "react";
import { Loader2, Save, Plus, Trash2, Truck, CreditCard, Mail as MailIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  adminGetSettings, adminUpdateSettings, getFaq, adminAddFaq, adminUpdateFaq, adminDeleteFaq,
  getGallery, adminAddGallery, adminDeleteGallery,
  uploadImages, mediaUrl,
} from "@/lib/api";
import { gbp } from "@/lib/format";

export default function AdminSettings() {
  const [s, setS] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { adminGetSettings().then(setS).catch(() => {}); }, []);
  if (!s) return <div className="py-24 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-[var(--ss-mint)]" /></div>;

  const save = async (patch) => {
    setSaving(true);
    try { const next = await adminUpdateSettings(patch); setS({ ...s, ...next }); toast.success("Settings saved"); }
    catch (e) { toast.error("Could not save"); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <h1 className="font-display text-3xl text-[var(--ss-fg)]">Settings</h1>
      <Tabs defaultValue="business" className="mt-6">
        <TabsList className="flex flex-wrap h-auto bg-[var(--ss-surface-2)] border border-[var(--ss-border)]">
          {["business", "pricing", "shipping", "social", "analytics", "faq", "gallery", "integrations"].map((t) => (
            <TabsTrigger key={t} value={t} className="capitalize data-[state=active]:bg-[var(--ss-mint)] data-[state=active]:text-[#ffffff]" data-testid={`settings-tab-${t}`}>{t}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="business"><BusinessTab s={s} setS={setS} save={save} saving={saving} /></TabsContent>
        <TabsContent value="pricing"><PricingTab s={s} setS={setS} save={save} saving={saving} /></TabsContent>
        <TabsContent value="shipping"><ShippingTab s={s} setS={setS} save={save} saving={saving} /></TabsContent>
        <TabsContent value="social"><SocialTab s={s} setS={setS} save={save} saving={saving} /></TabsContent>
        <TabsContent value="analytics"><AnalyticsTab s={s} setS={setS} save={save} saving={saving} /></TabsContent>
        <TabsContent value="faq"><FaqTab /></TabsContent>
        <TabsContent value="gallery"><GalleryTab /></TabsContent>
        <TabsContent value="integrations"><IntegrationsTab s={s} /></TabsContent>
      </Tabs>
    </div>
  );
}

const Card = ({ children }) => <div className="ss-card p-6 mt-5 space-y-4 max-w-2xl">{children}</div>;
const F = ({ label, value, onChange, ...p }) => (
  <div><Label className="text-[var(--ss-muted)]">{label}</Label><Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="mt-1.5 bg-[var(--ss-surface-2)] border-[var(--ss-border)]" {...p} /></div>
);
const SaveBtn = ({ onClick, saving }) => <Button onClick={onClick} disabled={saving} className="bg-[var(--ss-mint)] text-[#ffffff] hover:bg-[var(--ss-mint-600)] font-semibold" data-testid="settings-save-button"><Save className="mr-2 h-4 w-4" /> {saving ? "Saving..." : "Save changes"}</Button>;

function BusinessTab({ s, setS, save, saving }) {
  const b = s.business || {};
  const set = (k, v) => setS({ ...s, business: { ...b, [k]: v } });
  return (
    <Card>
      <F label="Business name" value={b.name} onChange={(v) => set("name", v)} />
      <F label="Tagline" value={b.tagline} onChange={(v) => set("tagline", v)} />
      <F label="Business email" value={b.email} onChange={(v) => set("email", v)} />
      <F label="Phone" value={b.phone} onChange={(v) => set("phone", v)} />
      <F label="Cleaning turnaround" value={b.turnaround} onChange={(v) => set("turnaround", v)} />
      <div>
        <Label className="text-[var(--ss-muted)]">Website announcement banner</Label>
        <Input value={s.announcement ?? ""} onChange={(e) => setS({ ...s, announcement: e.target.value })} className="mt-1.5 bg-[var(--ss-surface-2)] border-[var(--ss-border)]" placeholder="e.g. 20% off this week!" />
      </div>
      <div className="flex items-center justify-between rounded-lg border border-[var(--ss-border)] p-3">
        <span className="text-sm text-[var(--ss-fg)]">Maintenance mode</span>
        <Switch checked={!!s.maintenance_mode} onCheckedChange={(v) => setS({ ...s, maintenance_mode: v })} />
      </div>
      <div className="flex items-center justify-between rounded-lg border border-[rgba(59,130,246,0.3)] bg-[rgba(59,130,246,0.06)] p-3">
        <div>
          <span className="text-sm text-[var(--ss-fg)] font-medium">Test mode (safe orders)</span>
          <p className="text-xs text-[var(--ss-muted)] mt-0.5">When ON, generating a return label creates a simulated label &amp; tracking &mdash; no real Royal Mail order or charge. Turn OFF to go live.</p>
        </div>
        <Switch checked={!!s.test_mode} onCheckedChange={(v) => setS({ ...s, test_mode: v })} data-testid="settings-test-mode-switch" />
      </div>
      <SaveBtn saving={saving} onClick={() => save({ business: s.business, announcement: s.announcement, maintenance_mode: s.maintenance_mode, test_mode: s.test_mode })} />
    </Card>
  );
}

function PricingTab({ s, setS, save, saving }) {
  const p = s.pricing || {};
  const setTier = (svc, n, v) => setS({ ...s, pricing: { ...p, [`${svc}_tiers`]: { ...p[`${svc}_tiers`], [n]: parseFloat(v) || 0 } } });
  return (
    <Card>
      {["quick", "deep"].map((svc) => (
        <div key={svc}>
          <div className="ss-eyebrow mb-2">{svc === "quick" ? "Quick Clean" : "Deep Clean"} tiers (total price)</div>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((n) => (
              <div key={n}><Label className="text-xs text-[var(--ss-muted)]">{n} pair{n > 1 ? "s" : ""}</Label><Input value={(p[`${svc}_tiers`] || {})[n] ?? ""} onChange={(e) => setTier(svc, n, e.target.value)} className="mt-1 bg-[var(--ss-surface-2)] border-[var(--ss-border)]" /></div>
            ))}
          </div>
        </div>
      ))}
      <SaveBtn saving={saving} onClick={() => save({ pricing: s.pricing })} />
    </Card>
  );
}

function ShippingTab({ s, setS, save, saving }) {
  const rates = s.shipping_rates || [];
  const setRate = (i, k, v) => { const next = rates.map((r, idx) => idx === i ? { ...r, [k]: k === "label" ? v : (parseFloat(v) || 0) } : r); setS({ ...s, shipping_rates: next }); };
  const add = () => setS({ ...s, shipping_rates: [...rates, { min_pairs: 1, max_pairs: 1, price: 0, label: "" }] });
  const del = (i) => setS({ ...s, shipping_rates: rates.filter((_, idx) => idx !== i) });
  return (
    <Card>
      <div className="ss-eyebrow">Shipping rate rules (by number of pairs)</div>
      {rates.map((r, i) => (
        <div key={i} className="grid grid-cols-12 gap-2 items-end">
          <div className="col-span-2"><Label className="text-xs text-[var(--ss-muted)]">Min</Label><Input value={r.min_pairs} onChange={(e) => setRate(i, "min_pairs", e.target.value)} className="mt-1 bg-[var(--ss-surface-2)] border-[var(--ss-border)]" /></div>
          <div className="col-span-2"><Label className="text-xs text-[var(--ss-muted)]">Max</Label><Input value={r.max_pairs} onChange={(e) => setRate(i, "max_pairs", e.target.value)} className="mt-1 bg-[var(--ss-surface-2)] border-[var(--ss-border)]" /></div>
          <div className="col-span-3"><Label className="text-xs text-[var(--ss-muted)]">Price £</Label><Input value={r.price} onChange={(e) => setRate(i, "price", e.target.value)} className="mt-1 bg-[var(--ss-surface-2)] border-[var(--ss-border)]" /></div>
          <div className="col-span-4"><Label className="text-xs text-[var(--ss-muted)]">Label</Label><Input value={r.label ?? ""} onChange={(e) => setRate(i, "label", e.target.value)} className="mt-1 bg-[var(--ss-surface-2)] border-[var(--ss-border)]" /></div>
          <button onClick={() => del(i)} className="col-span-1 h-9 text-[#ff9aa4]"><Trash2 className="h-4 w-4" /></button>
        </div>
      ))}
      <Button onClick={add} variant="outline" className="border-[var(--ss-border)] bg-transparent text-[var(--ss-fg)]"><Plus className="mr-2 h-4 w-4" /> Add rate</Button>
      <SaveBtn saving={saving} onClick={() => save({ shipping_rates: s.shipping_rates })} />
    </Card>
  );
}

function SocialTab({ s, setS, save, saving }) {
  const soc = s.social || {};
  const set = (k, v) => setS({ ...s, social: { ...soc, [k]: v } });
  return (<Card><F label="TikTok URL" value={soc.tiktok} onChange={(v) => set("tiktok", v)} /><F label="Instagram URL" value={soc.instagram} onChange={(v) => set("instagram", v)} /><SaveBtn saving={saving} onClick={() => save({ social: s.social })} /></Card>);
}

function AnalyticsTab({ s, setS, save, saving }) {
  const a = s.analytics || {};
  const set = (k, v) => setS({ ...s, analytics: { ...a, [k]: v } });
  return (<Card>
    <p className="text-sm text-[var(--ss-muted)]">Add your tracking IDs. These are stored securely and never hard-coded.</p>
    <F label="Google Analytics ID" value={a.google_analytics} onChange={(v) => set("google_analytics", v)} placeholder="G-XXXXXXX" />
    <F label="Google Search Console" value={a.google_search_console} onChange={(v) => set("google_search_console", v)} />
    <F label="Meta Pixel ID" value={a.meta_pixel} onChange={(v) => set("meta_pixel", v)} />
    <F label="TikTok Pixel ID" value={a.tiktok_pixel} onChange={(v) => set("tiktok_pixel", v)} />
    <SaveBtn saving={saving} onClick={() => save({ analytics: s.analytics })} />
  </Card>);
}

function FaqTab() {
  const [items, setItems] = useState([]);
  const [nw, setNw] = useState({ q: "", a: "" });
  const load = () => getFaq().then(setItems);
  useEffect(() => { load(); }, []);
  const add = async () => { if (!nw.q || !nw.a) return; await adminAddFaq({ ...nw, order: items.length }); setNw({ q: "", a: "" }); load(); toast.success("FAQ added"); };
  const del = async (id) => { await adminDeleteFaq(id); load(); };
  return (
    <div className="mt-5 max-w-3xl space-y-4">
      <div className="ss-card p-5 space-y-3">
        <F label="Question" value={nw.q} onChange={(v) => setNw({ ...nw, q: v })} />
        <div><Label className="text-[var(--ss-muted)]">Answer</Label><Textarea value={nw.a} onChange={(e) => setNw({ ...nw, a: e.target.value })} className="mt-1.5 bg-[var(--ss-surface-2)] border-[var(--ss-border)]" /></div>
        <Button onClick={add} className="bg-[var(--ss-mint)] text-[#ffffff] font-semibold"><Plus className="mr-2 h-4 w-4" /> Add FAQ</Button>
      </div>
      {items.map((f) => (
        <div key={f.id} className="ss-card p-4 flex items-start justify-between gap-3">
          <div><div className="text-[var(--ss-fg)] font-medium">{f.q}</div><div className="text-sm text-[var(--ss-muted)] mt-1">{f.a}</div></div>
          <button onClick={() => del(f.id)} className="text-[#ff9aa4] shrink-0"><Trash2 className="h-4 w-4" /></button>
        </div>
      ))}
    </div>
  );
}

function GalleryTab() {
  const [items, setItems] = useState([]);
  const [nw, setNw] = useState({ shoe_type: "", description: "", before_file_id: "", after_file_id: "" });
  const [uploading, setUploading] = useState("");
  const load = () => getGallery().then(setItems);
  useEffect(() => { load(); }, []);
  const up = async (key, file) => { if (!file) return; setUploading(key); try { const r = await uploadImages([file]); setNw((n) => ({ ...n, [key]: r.files[0].file_id })); } catch { toast.error("Upload failed"); } finally { setUploading(""); } };
  const add = async () => { if (!nw.before_file_id && !nw.after_file_id) { toast.error("Add at least one image"); return; } await adminAddGallery({ ...nw, order: items.length }); setNw({ shoe_type: "", description: "", before_file_id: "", after_file_id: "" }); load(); toast.success("Added to gallery"); };
  const del = async (id) => { await adminDeleteGallery(id); load(); };
  return (
    <div className="mt-5 max-w-3xl space-y-4">
      <div className="ss-card p-5 space-y-3">
        <F label="Shoe type" value={nw.shoe_type} onChange={(v) => setNw({ ...nw, shoe_type: v })} placeholder="e.g. Air Force 1" />
        <F label="Description" value={nw.description} onChange={(v) => setNw({ ...nw, description: v })} />
        <div className="grid grid-cols-2 gap-3">
          {["before_file_id", "after_file_id"].map((k) => (
            <div key={k}><Label className="text-xs text-[var(--ss-muted)]">{k === "before_file_id" ? "Before image" : "After image"}</Label>
              <input type="file" accept="image/*" onChange={(e) => up(k, e.target.files[0])} className="mt-1 text-sm text-[var(--ss-muted)] block" />
              {uploading === k ? <span className="text-xs text-[var(--ss-mint)]">Uploading...</span> : nw[k] ? <img src={mediaUrl(`/api/images/${nw[k]}`)} alt="preview" className="mt-2 h-20 w-20 object-cover rounded-lg border border-[var(--ss-border)]" /> : null}
            </div>
          ))}
        </div>
        <Button onClick={add} className="bg-[var(--ss-mint)] text-[#ffffff] font-semibold"><Plus className="mr-2 h-4 w-4" /> Add to gallery</Button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items.map((g) => (
          <div key={g.id} className="ss-card p-3">
            <div className="grid grid-cols-2 gap-1">
              {g.before_url ? <img src={mediaUrl(g.before_url)} alt="before" className="aspect-square object-cover rounded" /> : <div className="aspect-square rounded bg-[var(--ss-surface-2)]" />}
              {g.after_url ? <img src={mediaUrl(g.after_url)} alt="after" className="aspect-square object-cover rounded" /> : <div className="aspect-square rounded bg-[var(--ss-surface-2)]" />}
            </div>
            <div className="mt-2 flex items-center justify-between"><span className="text-xs text-[var(--ss-fg)]">{g.shoe_type}</span><button onClick={() => del(g.id)} className="text-[#ff9aa4]"><Trash2 className="h-3.5 w-3.5" /></button></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function IntegrationsTab({ s }) {
  const rm = s.royal_mail || {};
  return (
    <div className="mt-5 max-w-2xl space-y-4">
      <div className="ss-card p-6">
        <div className="flex items-center gap-2 mb-2"><Truck className="h-5 w-5 text-[var(--ss-mint)]" /><h3 className="font-semibold text-[var(--ss-fg)]">Shipping (Royal Mail Click & Drop)</h3></div>
        <p className="text-sm text-[var(--ss-muted)]">Carrier: <span className="text-[var(--ss-fg)]">{rm.carrier_name}</span></p>
        <div className="mt-3 text-sm text-[var(--ss-muted)] space-y-1">
          <div>Inbound returns portal: <b className="text-[var(--ss-fg)]">{rm.returns_portal_configured ? "Connected" : "Not set"}</b></div>
          <div>Outbound label API: <b className="text-[var(--ss-fg)]">{rm.outbound_api_configured ? "Connected" : "Not set"}</b></div>
        </div>
        <p className="text-sm text-[var(--ss-muted)] mt-3">{rm.note}</p>
        <div className="mt-3 text-xs text-[var(--ss-muted)]">Set in environment: {(rm.required_env_vars || []).join(", ")}</div>
      </div>
      <div className="ss-card p-6">
        <div className="flex items-center gap-2 mb-2"><CreditCard className="h-5 w-5 text-[var(--ss-mint)]" /><h3 className="font-semibold text-[var(--ss-fg)]">Payments (Stripe)</h3></div>
        <p className="text-sm text-[var(--ss-muted)]">Mode: <span className="text-[var(--ss-fg)]">{s.stripe_mode}</span>. Test card 4242 4242 4242 4242 works now. Complete KYC to go live.</p>
      </div>
      <div className="ss-card p-6">
        <div className="flex items-center gap-2 mb-2"><MailIcon className="h-5 w-5 text-[var(--ss-mint)]" /><h3 className="font-semibold text-[var(--ss-fg)]">Email</h3></div>
        <p className="text-sm text-[var(--ss-muted)]">Provider: <span className="text-[var(--ss-fg)]">{s.email_provider}</span>. Fallback mode logs all emails until a provider (SendGrid/SMTP) key is added.</p>
      </div>
    </div>
  );
}
