import React from "react";
import { Reveal } from "@/components/common/Reveal";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Logo } from "@/components/brand/Logo";

export default function About() {
  return (
    <div>
      <section className="relative ss-noise">
        <div className="absolute inset-0 ss-hero-glow pointer-events-none" />
        <div className="ss-container relative py-16 sm:py-20 grid lg:grid-cols-2 gap-10 items-center">
          <Reveal><SectionHeading eyebrow="About us" title="Sneaker care, done properly" subtitle="Sole Serenity is a UK-based professional shoe cleaning and restoration service built for people who care about their kicks." /></Reveal>
          <Reveal delay={0.1} className="flex justify-center">
            <div className="ss-card ss-noise p-10 relative overflow-hidden">
              <div className="absolute inset-0 ss-hero-glow" />
              <Logo className="h-48 relative" to={null} />
            </div>
          </Reveal>
        </div>
      </section>
      <section className="pb-16">
        <div className="ss-container max-w-3xl space-y-5 text-[var(--ss-muted)] leading-relaxed">
          <p>We treat every pair like our own. From box-fresh maintenance to deep restoration of well-loved trainers, our specialists work by hand using the right products for each material.</p>
          <p>Because no two pairs are the same, we assess your shoes from photos before accepting your order — so you always know what to expect before you pay. Results vary depending on material, age, staining and condition, and we’ll always be honest about what’s achievable.</p>
          <p>Everything is delivered door-to-door with tracked UK shipping, so getting your shoes cleaned is effortless — wherever you are.</p>
        </div>
      </section>
    </div>
  );
}
