import React from "react";
import { Seo } from "@/components/common/Seo";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/common/Reveal";
import { SectionHeading } from "@/components/common/SectionHeading";

const STEPS = [
  "Book online and choose Quick Clean or Deep Clean",
  "Choose the number of pairs (up to 4) — mix services if you like",
  "Upload clear photos of your shoes",
  "Submit your order for assessment",
  "Sole Serenity reviews and approves your order",
  "Pay securely online",
  "Receive your prepaid tracked shipping label by email",
  "Package your shoes securely",
  "Drop them off at your nearest collection point",
  "We receive your shoes and confirm arrival",
  "We clean and restore them by hand",
  "We carry out a final quality check",
  "We package them securely and send them back tracked",
  "You receive tracking and your shoes arrive home",
];

export default function HowItWorks() {
  const navigate = useNavigate();
  return (
    <div>
      <Seo
        title="How It Works — Mail-In Shoe Cleaning"
        path="/how-it-works"
        description="How Sole Serenity works: upload photos, get your shoes assessed and approved, pay securely, post them with a prepaid tracked label, and we clean and return them to your door."
        keywords="mail in shoe cleaning, how shoe cleaning works, send shoes to be cleaned UK, postal sneaker cleaning, shoe cleaning process"
      />
      <section className="relative ss-noise">
        <div className="absolute inset-0 ss-hero-glow pointer-events-none" />
        <div className="ss-container relative py-16 sm:py-20">
          <Reveal><SectionHeading eyebrow="How it works" title="The full journey" subtitle="A completely hands-off, premium experience from your door and back again." /></Reveal>
        </div>
      </section>
      <section className="pb-16">
        <div className="ss-container max-w-3xl">
          <div className="relative pl-8">
            <div className="absolute left-3 top-2 bottom-2 w-px bg-[var(--ss-border)]" />
            {STEPS.map((s, i) => (
              <Reveal key={i} delay={Math.min(i * 0.03, 0.3)}>
                <div className="relative pb-7">
                  <div className="absolute -left-[1.35rem] top-0.5 h-6 w-6 rounded-full bg-[rgba(59,130,246,0.14)] border border-[rgba(59,130,246,0.4)] flex items-center justify-center ss-mono text-[11px] text-[var(--ss-mint)]">{i + 1}</div>
                  <p className="text-[var(--ss-fg)]">{s}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-6">
            <Button onClick={() => navigate("/book")} className="h-12 px-8 bg-[var(--ss-mint)] text-[#ffffff] hover:bg-[var(--ss-mint-600)] font-semibold">BOOK A CLEAN <ArrowRight className="ml-2 h-5 w-5" /></Button>
          </div>
        </div>
      </section>
    </div>
  );
}
