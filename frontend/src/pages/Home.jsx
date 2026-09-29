import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Truck, ShieldCheck, Camera, Sparkles, PackageCheck, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Reveal } from "@/components/common/Reveal";
import { SectionHeading } from "@/components/common/SectionHeading";
import { BeforeAfter } from "@/components/common/BeforeAfter";
import { Logo } from "@/components/brand/Logo";
import { getServices, getGallery, getFaq } from "@/lib/api";
import { gbp } from "@/lib/format";

const STEPS = [
  { icon: Camera, title: "Upload photos", text: "Snap your shoes from every angle so we can assess them." },
  { icon: CheckCircle2, title: "Get approved", text: "We review and confirm what’s possible — before you pay." },
  { icon: Send, title: "Send them in", text: "Pay securely and get your prepaid tracked label." },
  { icon: PackageCheck, title: "Get them back", text: "We clean, quality-check and return them tracked to your door." },
];

export default function Home() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [faq, setFaq] = useState([]);

  useEffect(() => {
    getServices().then((d) => setServices(d.services)).catch(() => {});
    getGallery().then(setGallery).catch(() => {});
    getFaq().then((d) => setFaq(d.slice(0, 6))).catch(() => {});
  }, []);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden ss-noise">
        <div className="absolute inset-0 ss-hero-glow pointer-events-none" />
        <div className="ss-container relative pt-16 pb-20 sm:pt-20 sm:pb-28 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <Reveal>
              <div className="ss-eyebrow mb-4">Clean • Protect • Restore</div>
            </Reveal>
            <Reveal delay={0.05}>
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[0.95] text-[var(--ss-fg)]">
                GIVE YOUR SHOES A <span className="text-[var(--ss-mint)]">SECOND CHANCE</span>
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-6 text-lg text-[var(--ss-muted)] max-w-lg">
                Professional shoe cleaning. Delivered straight to your door.
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Button
                  data-testid="hero-book-a-clean-button"
                  onClick={() => navigate("/book")}
                  className="h-13 px-8 py-6 text-base bg-[var(--ss-mint)] text-[#ffffff] hover:bg-[var(--ss-mint-600)] font-semibold"
                >
                  BOOK A CLEAN <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  data-testid="hero-how-it-works-button"
                  onClick={() => navigate("/how-it-works")}
                  variant="outline"
                  className="h-13 px-8 py-6 text-base border-[var(--ss-border)] bg-transparent text-[var(--ss-fg)] hover:border-[var(--ss-mint)] hover:text-[var(--ss-mint)]"
                >
                  HOW IT WORKS
                </Button>
              </div>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs sm:text-sm text-[var(--ss-muted)]">
                <span className="inline-flex items-center gap-2"><Truck className="h-4 w-4 text-[var(--ss-mint)]" /> UK-wide delivery</span>
                <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[var(--ss-mint)]" /> Tracked shipping</span>
                <span className="inline-flex items-center gap-2"><Camera className="h-4 w-4 text-[var(--ss-mint)]" /> Assessed before you pay</span>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.15} className="relative">
            <div className="ss-card ss-noise p-8 sm:p-12 flex items-center justify-center bg-[var(--ss-surface)] relative overflow-hidden">
              <div className="absolute inset-0 ss-hero-glow" />
              <Logo className="h-56 sm:h-72 relative" to={null} />
            </div>
            <div className="absolute -bottom-5 -left-4 sm:-left-6 ss-card bg-[var(--ss-bg-2)] px-5 py-3 flex items-center gap-3 shadow-xl">
              <Sparkles className="h-5 w-5 text-[var(--ss-mint)]" />
              <div>
                <div className="text-sm font-semibold text-[var(--ss-fg)]">From {gbp(15)}/pair</div>
                <div className="text-xs text-[var(--ss-muted)]">Quick &amp; Deep cleans</div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* SERVICES TEASER */}
      <section className="ss-section bg-[var(--ss-bg-2)] border-y border-[var(--ss-border)]">
        <div className="ss-container">
          <Reveal><SectionHeading eyebrow="Our services" title="Two ways to refresh your kicks" subtitle="Whether they need a standard clean or an intensive restoration, we’ve got a service for it." /></Reveal>
          <div className="mt-10 grid md:grid-cols-2 gap-6">
            {services.map((s, i) => (
              <Reveal key={s.key} delay={i * 0.08}>
                <div className="ss-card p-7 h-full flex flex-col" data-testid={`home-service-${s.key}`}>
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-display text-2xl text-[var(--ss-fg)]">{s.name}</h3>
                    <div className="text-[var(--ss-mint)] font-display text-3xl">{gbp(s.price)}</div>
                  </div>
                  <p className="text-sm text-[var(--ss-muted)] mt-1">{s.tagline}</p>
                  <ul className="mt-5 space-y-2 flex-1">
                    {s.includes.map((inc) => (
                      <li key={inc} className="flex items-start gap-2 text-sm text-[var(--ss-fg)]">
                        <CheckCircle2 className="h-4 w-4 text-[var(--ss-mint)] mt-0.5 shrink-0" /> {inc}
                      </li>
                    ))}
                  </ul>
                  <Button onClick={() => navigate("/book")} className="mt-6 bg-[var(--ss-mint)] text-[#ffffff] hover:bg-[var(--ss-mint-600)] font-semibold w-full">
                    BOOK A CLEAN
                  </Button>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="mt-6 text-xs text-[var(--ss-muted)] max-w-3xl">Results vary depending on material, age, staining and condition. We can’t promise every mark will be fully removed — that’s exactly why we assess your photos first.</p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="ss-section">
        <div className="ss-container">
          <Reveal><SectionHeading eyebrow="How it works" title="From doorstep to doorstep" subtitle="A premium, hands-off experience — you never arrange your own postage unless you want to." /></Reveal>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map((st, i) => (
              <Reveal key={st.title} delay={i * 0.07}>
                <div className="ss-card p-6 h-full">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-[rgba(59,130,246,0.12)] border border-[rgba(59,130,246,0.3)] flex items-center justify-center">
                      <st.icon className="h-5 w-5 text-[var(--ss-mint)]" />
                    </div>
                    <span className="ss-mono text-sm text-[var(--ss-muted)]">0{i + 1}</span>
                  </div>
                  <h3 className="mt-4 font-semibold text-lg text-[var(--ss-fg)]">{st.title}</h3>
                  <p className="mt-1 text-sm text-[var(--ss-muted)]">{st.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-8">
            <Button onClick={() => navigate("/how-it-works")} variant="outline" className="border-[var(--ss-border)] bg-transparent text-[var(--ss-fg)] hover:border-[var(--ss-mint)] hover:text-[var(--ss-mint)]">See the full process <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </div>
        </div>
      </section>

      {/* GALLERY */}
      {gallery.length > 0 && (
        <section className="ss-section bg-[var(--ss-bg-2)] border-y border-[var(--ss-border)]">
          <div className="ss-container">
            <Reveal><SectionHeading eyebrow="Before &amp; after" title="Real results, real shoes" subtitle="Tap to flip between before and after." /></Reveal>
            <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4">
              {gallery.slice(0, 8).map((g) => <BeforeAfter key={g.id} item={g} />)}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {faq.length > 0 && (
        <section className="ss-section bg-[var(--ss-bg-2)] border-y border-[var(--ss-border)]">
          <div className="ss-container max-w-3xl">
            <Reveal><SectionHeading eyebrow="FAQ" title="Good to know" center /></Reveal>
            <Reveal delay={0.1}>
              <Accordion type="single" collapsible className="mt-8">
                {faq.map((f, i) => (
                  <AccordionItem key={i} value={`f${i}`} className="border-[var(--ss-border)]">
                    <AccordionTrigger className="text-left text-[var(--ss-fg)] hover:text-[var(--ss-mint)] hover:no-underline">{f.q}</AccordionTrigger>
                    <AccordionContent className="text-[var(--ss-muted)]">{f.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Reveal>
            <div className="mt-8 text-center">
              <Link to="/faq" className="text-[var(--ss-mint)] text-sm font-medium hover:underline">View all FAQs →</Link>
            </div>
          </div>
        </section>
      )}

      {/* CONTACT CTA */}
      <section className="ss-section">
        <div className="ss-container">
          <div className="ss-card ss-noise relative overflow-hidden p-10 sm:p-14 text-center">
            <div className="absolute inset-0 ss-hero-glow" />
            <div className="relative">
              <h2 className="font-display text-4xl sm:text-5xl text-[var(--ss-fg)]">READY TO REFRESH?</h2>
              <p className="mt-4 text-[var(--ss-muted)] max-w-xl mx-auto">Book in under two minutes. Upload your photos, get approved, and we’ll handle the rest.</p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => navigate("/book")} className="h-12 px-8 bg-[var(--ss-mint)] text-[#ffffff] hover:bg-[var(--ss-mint-600)] font-semibold">BOOK A CLEAN <ArrowRight className="ml-2 h-5 w-5" /></Button>
                <Button onClick={() => navigate("/contact")} variant="outline" className="h-12 px-8 border-[var(--ss-border)] bg-transparent text-[var(--ss-fg)] hover:border-[var(--ss-mint)] hover:text-[var(--ss-mint)]">Contact us</Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
