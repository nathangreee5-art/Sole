import React, { useState } from "react";
import { Mail, Phone, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Reveal } from "@/components/common/Reveal";
import { SectionHeading } from "@/components/common/SectionHeading";
import { useApp } from "@/context/AppContext";
import { sendContact } from "@/lib/api";

export default function Contact() {
  const { settings } = useApp();
  const biz = settings?.business || {};
  const [form, setForm] = useState({ name: "", email: "", subject: "Website enquiry", message: "" });
  const [sending, setSending] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) { toast.error("Please fill in your name, email and message."); return; }
    setSending(true);
    try {
      const res = await sendContact(form);
      toast.success(res.message || "Message sent!");
      setForm({ name: "", email: "", subject: "Website enquiry", message: "" });
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Could not send message.");
    } finally { setSending(false); }
  };

  return (
    <div>
      <section className="relative ss-noise">
        <div className="absolute inset-0 ss-hero-glow pointer-events-none" />
        <div className="ss-container relative py-16 sm:py-20">
          <Reveal><SectionHeading eyebrow="Contact" title="Get in touch" subtitle="Questions about your shoes or an existing order? We’re here to help." /></Reveal>
        </div>
      </section>
      <section className="pb-16">
        <div className="ss-container grid lg:grid-cols-2 gap-6">
          <Reveal>
            <form onSubmit={submit} className="ss-card p-7 space-y-4" data-testid="contact-form">
              <div>
                <Label className="text-[var(--ss-muted)]">Your name</Label>
                <Input data-testid="contact-name" value={form.name} onChange={set("name")} className="mt-1.5 bg-[var(--ss-surface-2)] border-[var(--ss-border)]" placeholder="Jane Doe" />
              </div>
              <div>
                <Label className="text-[var(--ss-muted)]">Email</Label>
                <Input data-testid="contact-email" type="email" value={form.email} onChange={set("email")} className="mt-1.5 bg-[var(--ss-surface-2)] border-[var(--ss-border)]" placeholder="you@email.com" />
              </div>
              <div>
                <Label className="text-[var(--ss-muted)]">Subject</Label>
                <Input value={form.subject} onChange={set("subject")} className="mt-1.5 bg-[var(--ss-surface-2)] border-[var(--ss-border)]" />
              </div>
              <div>
                <Label className="text-[var(--ss-muted)]">Message</Label>
                <Textarea data-testid="contact-message" value={form.message} onChange={set("message")} rows={5} className="mt-1.5 bg-[var(--ss-surface-2)] border-[var(--ss-border)]" placeholder="How can we help?" />
              </div>
              <Button type="submit" disabled={sending} data-testid="contact-submit" className="w-full bg-[var(--ss-mint)] text-[#ffffff] hover:bg-[var(--ss-mint-600)] font-semibold">
                {sending ? "Sending..." : (<>Send message <Send className="ml-2 h-4 w-4" /></>)}
              </Button>
            </form>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="ss-card p-7 h-full">
              <h3 className="font-display text-2xl text-[var(--ss-fg)]">Other ways to reach us</h3>
              <div className="mt-5 space-y-4">
                {biz.email ? (
                  <a href={`mailto:${biz.email}`} className="flex items-center gap-3 text-[var(--ss-fg)] hover:text-[var(--ss-mint)]"><Mail className="h-5 w-5 text-[var(--ss-mint)]" /> {biz.email}</a>
                ) : null}
                {biz.phone ? (
                  <div className="flex items-center gap-3 text-[var(--ss-fg)]"><Phone className="h-5 w-5 text-[var(--ss-mint)]" /> {biz.phone}</div>
                ) : null}
              </div>
              <div className="mt-8 rounded-xl border border-[var(--ss-border)] p-5 bg-[var(--ss-surface-2)]">
                <p className="text-sm text-[var(--ss-muted)]">Tracking an order? Head to your order page using the link in your confirmation email, or the Track link in the footer.</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
