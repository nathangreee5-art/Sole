import React from "react";
import { Seo } from "@/components/common/Seo";
import { Reveal } from "@/components/common/Reveal";
import { SectionHeading } from "@/components/common/SectionHeading";

const Block = ({ title, children }) => (
  <div className="space-y-2">
    <h3 className="font-semibold text-lg text-[var(--ss-fg)]">{title}</h3>
    <div className="text-sm text-[var(--ss-muted)] leading-relaxed space-y-2">{children}</div>
  </div>
);

export default function Terms() {
  return (
    <div>
      <Seo
        title="Terms & Conditions"
        path="/terms"
        description="The terms and conditions for using Sole Serenity's shoe cleaning and tracked delivery services."
        keywords="sole serenity terms, shoe cleaning terms and conditions"
      />
      <section className="relative ss-noise">
        <div className="absolute inset-0 ss-hero-glow pointer-events-none" />
        <div className="ss-container relative py-16"><Reveal><SectionHeading eyebrow="Legal" title="Terms & Conditions" /></Reveal></div>
      </section>
      <section className="pb-16"><div className="ss-container max-w-3xl space-y-8">
        <Block title="1. Our service"><p>Sole Serenity provides professional shoe cleaning and restoration. All orders are subject to a photo assessment. We reserve the right to decline any order before payment.</p></Block>
        <Block title="2. Assessment & results"><p>Cleaning results vary depending on material, age, staining and condition. We do not guarantee that every stain or mark can be completely removed. Our assessment sets expectations before you pay.</p></Block>
        <Block title="3. Payment"><p>Payment is taken securely online only after your order is approved. Prices shown include cleaning and tracked UK delivery. We do not store your card details.</p></Block>
        <Block title="4. Shipping"><p>Delivery is provided via a tracked courier service. Retain your postage receipt until delivery is confirmed. Sole Serenity is not liable for loss or damage caused by third-party carriers, though we will assist with any claims.</p></Block>
        <Block title="5. Liability"><p>While we take great care, cleaning inherently carries some risk with worn or delicate materials. By placing an order you accept that treatment is carried out at your own risk within reasonable professional standards.</p></Block>
        <Block title="6. Cancellations"><p>You may cancel free of charge before payment. After payment, contact us as soon as possible and we will help where we can.</p></Block>
      </div></section>
    </div>
  );
}
