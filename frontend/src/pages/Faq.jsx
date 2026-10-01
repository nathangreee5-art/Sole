import React, { useEffect, useState } from "react";
import { Seo } from "@/components/common/Seo";
import { useNavigate } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/common/Reveal";
import { SectionHeading } from "@/components/common/SectionHeading";
import { getFaq } from "@/lib/api";

export default function Faq() {
  const navigate = useNavigate();
  const [faq, setFaq] = useState([]);
  useEffect(() => { getFaq().then(setFaq).catch(() => {}); }, []);
  const faqJsonLd = faq.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      }
    : null;
  return (
    <div>
      <Seo
        title="Frequently Asked Questions"
        path="/faq"
        description="Answers about sending your shoes to Sole Serenity: turnaround times, what we can clean, delivery, payment and our photo assessment process."
        keywords="shoe cleaning FAQ, sneaker cleaning questions, how long does shoe cleaning take, what shoes can you clean"
        jsonLd={faqJsonLd}
      />
      <section className="relative ss-noise">
        <div className="absolute inset-0 ss-hero-glow pointer-events-none" />
        <div className="ss-container relative py-16 sm:py-20">
          <Reveal><SectionHeading eyebrow="FAQ" title="Frequently asked questions" subtitle="Everything you need to know about sending your shoes to Sole Serenity." /></Reveal>
        </div>
      </section>
      <section className="pb-16">
        <div className="ss-container max-w-3xl">
          <Accordion type="single" collapsible data-testid="faq-accordion">
            {faq.map((f, i) => (
              <AccordionItem key={f.id || i} value={`f${i}`} className="border-[var(--ss-border)]">
                <AccordionTrigger className="text-left text-[var(--ss-fg)] hover:text-[var(--ss-mint)] hover:no-underline">{f.q}</AccordionTrigger>
                <AccordionContent className="text-[var(--ss-muted)]">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <div className="mt-10 ss-card p-6 text-center">
            <p className="text-[var(--ss-fg)]">Still have a question?</p>
            <div className="mt-4 flex gap-3 justify-center">
              <Button onClick={() => navigate("/contact")} variant="outline" className="border-[var(--ss-border)] bg-transparent text-[var(--ss-fg)] hover:border-[var(--ss-mint)] hover:text-[var(--ss-mint)]">Contact us</Button>
              <Button onClick={() => navigate("/book")} className="bg-[var(--ss-mint)] text-[#ffffff] hover:bg-[var(--ss-mint-600)] font-semibold">Book a clean</Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
