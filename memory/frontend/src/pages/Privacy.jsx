import React from "react";
import { Reveal } from "@/components/common/Reveal";
import { SectionHeading } from "@/components/common/SectionHeading";

const Block = ({ title, children }) => (
  <div className="space-y-2">
    <h3 className="font-semibold text-lg text-[var(--ss-fg)]">{title}</h3>
    <div className="text-sm text-[var(--ss-muted)] leading-relaxed space-y-2">{children}</div>
  </div>
);

export default function Privacy() {
  return (
    <div>
      <section className="relative ss-noise">
        <div className="absolute inset-0 ss-hero-glow pointer-events-none" />
        <div className="ss-container relative py-16"><Reveal><SectionHeading eyebrow="Legal" title="Privacy Policy" /></Reveal></div>
      </section>
      <section className="pb-16"><div className="ss-container max-w-3xl space-y-8">
        <Block title="Information we collect"><p>We collect the details you provide when booking: your name, contact details, addresses, shoe details, photographs and order history.</p></Block>
        <Block title="How we use it"><p>We use your information solely to assess, process, clean and return your order, to communicate with you, and to process payments and shipping.</p></Block>
        <Block title="Payments"><p>Card payments are handled by our payment provider (Stripe). We never see or store your full card details.</p></Block>
        <Block title="Photographs"><p>Photographs you upload are stored securely and used only to assess and document your order. We may, with permission, showcase before/after results.</p></Block>
        <Block title="Your rights"><p>You can request access to, correction of, or deletion of your personal data at any time by contacting us.</p></Block>
      </div></section>
    </div>
  );
}
