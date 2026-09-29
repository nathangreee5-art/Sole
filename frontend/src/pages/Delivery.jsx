import React from "react";
import { useNavigate } from "react-router-dom";
import { Truck, ShieldCheck, PackageCheck, Receipt, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/common/Reveal";
import { SectionHeading } from "@/components/common/SectionHeading";

export default function Delivery() {
  const navigate = useNavigate();
  const flow = [
    { t: "We collect your shoes", d: "After approval and payment, we email your prepaid tracked label." },
    { t: "We clean them", d: "Our specialists clean and restore your shoes by hand." },
    { t: "We return them", d: "We send them back to your door with tracked shipping." },
  ];
  return (
    <div>
      <section className="relative ss-noise">
        <div className="absolute inset-0 ss-hero-glow pointer-events-none" />
        <div className="ss-container relative py-16 sm:py-20">
          <Reveal><SectionHeading eyebrow="Delivery" title="UK-wide tracked delivery" subtitle="You don’t arrange your own postage unless you want to. We handle collection and return." /></Reveal>
          <Reveal delay={0.1}>
            <div className="mt-8 grid sm:grid-cols-3 gap-5">
              {flow.map((f, i) => (
                <div key={i} className="ss-card p-6">
                  <div className="ss-mono text-sm text-[var(--ss-mint)]">STEP 0{i + 1}</div>
                  <h3 className="mt-2 font-semibold text-lg text-[var(--ss-fg)]">{f.t}</h3>
                  <p className="mt-1 text-sm text-[var(--ss-muted)]">{f.d}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="ss-section">
        <div className="ss-container grid lg:grid-cols-2 gap-6">
          <Reveal>
            <div className="ss-card p-7">
              <h3 className="font-display text-2xl text-[var(--ss-fg)]">How our delivery service works</h3>
              <ol className="mt-4 space-y-2 text-sm text-[var(--ss-fg)] list-decimal list-inside">
                <li>Book online</li>
                <li>Upload photos</li>
                <li>Get approved</li>
                <li>Pay securely</li>
                <li>Receive your prepaid tracked label</li>
                <li>Send your shoes</li>
                <li>We clean them</li>
                <li>We return them tracked</li>
              </ol>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="ss-card p-7">
              <h3 className="font-display text-2xl text-[var(--ss-fg)]">Packaging instructions</h3>
              <ul className="mt-4 space-y-3 text-sm text-[var(--ss-muted)]">
                <li className="flex gap-3"><PackageCheck className="h-5 w-5 text-[var(--ss-mint)] shrink-0" /> Package your shoes securely in a sturdy box or padded bag.</li>
                <li className="flex gap-3"><ShieldCheck className="h-5 w-5 text-[var(--ss-mint)] shrink-0" /> Attach the prepaid label clearly to the outside.</li>
                <li className="flex gap-3"><Truck className="h-5 w-5 text-[var(--ss-mint)] shrink-0" /> Drop them off at your nearest collection point.</li>
                <li className="flex gap-3"><Receipt className="h-5 w-5 text-[var(--ss-mint)] shrink-0" /> Keep your postage receipt until delivery is confirmed.</li>
              </ul>
            </div>
          </Reveal>
        </div>
        <div className="ss-container mt-8">
          <Button onClick={() => navigate("/book")} className="h-12 px-8 bg-[var(--ss-mint)] text-[#ffffff] hover:bg-[var(--ss-mint-600)] font-semibold">BOOK A CLEAN <ArrowRight className="ml-2 h-5 w-5" /></Button>
        </div>
      </section>
    </div>
  );
}
